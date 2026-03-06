import os
import time
from flask import Flask, request, jsonify

app = Flask(__name__)

PORT = int(os.getenv("PORT", "8080"))
USE_MOCK = os.getenv("USE_MOCK", "true").lower() == "true"

MOCK_RESULT = {
    "shipper_name": "テスト運送株式会社",
    "shipper_address": "大阪府大阪市中央区1-1-1",
    "consignee_name": "東京物流センター",
    "consignee_address": "東京都港区2-2-2",
    "cargo_description": "精密機器",
    "weight_kg": 250.0,
    "dimensions": "120x80x60cm",
    "reference_number": f"REF-{int(time.time())}",
}


@app.route("/health")
def health():
    return jsonify({"status": "ok", "mock": USE_MOCK})


@app.route("/ocr", methods=["POST"])
def ocr():
    job_id = f"ocr-{int(time.time() * 1000)}"

    if USE_MOCK:
        return jsonify({
            "job_id": job_id,
            "status": "completed",
            "confidence": 0.97,
            "data": MOCK_RESULT,
        })

    # TODO: real PaddleOCR implementation
    return jsonify({"job_id": job_id, "status": "queued"})


if __name__ == "__main__":
    print(f"ocr-worker starting on :{PORT} (mock={USE_MOCK})")
    app.run(host="0.0.0.0", port=PORT, debug=False)
