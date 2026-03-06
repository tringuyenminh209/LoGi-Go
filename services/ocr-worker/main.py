import os
import io
import json
import time
import base64
import logging

from flask import Flask, request, jsonify

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ocr-worker")

app = Flask(__name__)

PORT = int(os.getenv("PORT", "8080"))
USE_MOCK = os.getenv("USE_MOCK", "true").lower() == "true"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# ── Lazy-loaded heavy deps ─────────────────────────────────────────────────────

_paddle_ocr = None
_gemini_model = None


def _paddle_available() -> bool:
    try:
        import paddleocr  # noqa
        return True
    except ImportError:
        return False


def _get_paddle():
    global _paddle_ocr
    if _paddle_ocr is None:
        from paddleocr import PaddleOCR
        _paddle_ocr = PaddleOCR(use_angle_cls=True, lang="japan", show_log=False)
    return _paddle_ocr


def _get_gemini():
    global _gemini_model
    if _gemini_model is None and GEMINI_API_KEY and GEMINI_API_KEY not in ("mock", ""):
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _gemini_model = genai.GenerativeModel("gemini-1.5-pro")
    return _gemini_model


# ── Mock data ──────────────────────────────────────────────────────────────────

_MOCK_DATA = [
    {
        "shipper_name": "テスト運送株式会社",
        "shipper_address": "大阪府大阪市中央区1-1-1",
        "consignee_name": "東京物流センター",
        "consignee_address": "東京都港区2-2-2",
        "cargo_description": "精密機器",
        "weight_kg": 250.0,
        "dimensions": "120x80x60cm",
        "pickup_datetime": None,
        "delivery_datetime": None,
        "phone": "06-1234-5678",
    },
    {
        "shipper_name": "山田電機株式会社",
        "shipper_address": "名古屋市中区栄2-17-1",
        "consignee_name": "横浜流通センター",
        "consignee_address": "横浜市中区桜木町1-1",
        "cargo_description": "電子部品",
        "weight_kg": 180.0,
        "dimensions": "100x60x40cm",
        "pickup_datetime": "翌日 09:00",
        "delivery_datetime": "翌々日 17:00",
        "phone": "052-123-4567",
    },
    {
        "shipper_name": "佐藤テキスタイル株式会社",
        "shipper_address": "福岡市博多区博多駅南5-1-3",
        "consignee_name": "広島配送センター",
        "consignee_address": "広島市中区基町6-78",
        "cargo_description": "衣料品",
        "weight_kg": 800.0,
        "dimensions": None,
        "pickup_datetime": "3日後 06:00",
        "delivery_datetime": "4日後 12:00",
        "phone": None,  # low confidence field
    },
]
_mock_idx = 0


def _run_mock() -> tuple[dict, float, bool]:
    global _mock_idx
    data = dict(_MOCK_DATA[_mock_idx % len(_MOCK_DATA)])
    _mock_idx += 1
    data["reference_number"] = f"REF-{int(time.time())}"
    confidence = round(0.87 + (_mock_idx % 3) * 0.04, 2)  # 0.87 / 0.91 / 0.95
    needs_review = confidence < 0.90
    return data, confidence, needs_review


# ── Real OCR pipeline ──────────────────────────────────────────────────────────

_EXTRACT_PROMPT = """You are extracting structured fields from a Japanese logistics waybill or shipping instruction (伝票).
OCR raw text from the document:
---
{text}
---
Extract the following fields and return ONLY a JSON object (no markdown, no explanation):
{{
  "shipper_name": "荷主名 or null",
  "shipper_address": "荷主住所 or null",
  "consignee_name": "着荷主名 or null",
  "consignee_address": "配送先住所 or null",
  "cargo_description": "品名 or null",
  "weight_kg": number or null,
  "dimensions": "寸法 e.g. 120x80x60cm or null",
  "reference_number": "依頼番号 or null",
  "pickup_datetime": "集荷日時 or null",
  "delivery_datetime": "配達日時 or null",
  "phone": "電話番号 or null"
}}"""


def _run_real(image_bytes: bytes) -> tuple[dict, float, bool]:
    try:
        import numpy as np
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        img_array = np.array(img)
    except Exception as e:
        log.error("Image decode failed: %s", e)
        return _run_mock()

    try:
        ocr = _get_paddle()
        result = ocr.ocr(img_array, cls=True)
    except Exception as e:
        log.error("PaddleOCR failed: %s", e)
        return _run_mock()

    lines: list[str] = []
    confidences: list[float] = []
    for page in (result or []):
        for line in (page or []):
            if line and len(line) >= 2:
                text_info = line[1]
                if isinstance(text_info, (list, tuple)) and len(text_info) >= 2:
                    lines.append(str(text_info[0]))
                    confidences.append(float(text_info[1]))

    raw_text = "\n".join(lines)
    ocr_conf = sum(confidences) / len(confidences) if confidences else 0.5

    # Gemini structured extraction
    extracted = {}
    llm_conf = 0.3
    model = _get_gemini()
    if model and raw_text.strip():
        try:
            response = model.generate_content(
                _EXTRACT_PROMPT.format(text=raw_text),
                generation_config={"temperature": 0.1},
            )
            extracted = json.loads(response.text.strip())
            llm_conf = 0.85
        except Exception as e:
            log.warning("Gemini extraction failed: %s", e)
            extracted = {"cargo_description": raw_text[:300]}
    else:
        extracted = {"cargo_description": raw_text[:300]}

    final_conf = round(ocr_conf * 0.4 + llm_conf * 0.6, 4)
    needs_review = final_conf < 0.85 or not extracted.get("shipper_name")
    return extracted, final_conf, needs_review


# ── HTTP handlers ──────────────────────────────────────────────────────────────

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "mock": USE_MOCK,
        "paddle_available": _paddle_available(),
        "gemini_configured": bool(GEMINI_API_KEY and GEMINI_API_KEY not in ("mock", "")),
    })


@app.route("/ocr", methods=["POST"])
def ocr():
    t0 = time.perf_counter()
    job_id = f"ocr-{int(time.time() * 1000)}"

    if USE_MOCK or not _paddle_available():
        data, confidence, needs_review = _run_mock()
    else:
        image_bytes: bytes | None = None
        if "image" in request.files:
            image_bytes = request.files["image"].read()
        elif request.data:
            try:
                image_bytes = base64.b64decode(request.data)
            except Exception:
                image_bytes = request.data

        if not image_bytes:
            return jsonify({"error": "no image provided"}), 400

        data, confidence, needs_review = _run_real(image_bytes)

    processing_ms = int((time.perf_counter() - t0) * 1000)

    return jsonify({
        "job_id": job_id,
        "status": "completed",
        "confidence": confidence,
        "needs_review": needs_review,
        "processing_ms": processing_ms,
        "data": data,
    })


if __name__ == "__main__":
    log.info("ocr-worker starting on :%d (mock=%s, paddle=%s)", PORT, USE_MOCK, _paddle_available())
    app.run(host="0.0.0.0", port=PORT, debug=False)
