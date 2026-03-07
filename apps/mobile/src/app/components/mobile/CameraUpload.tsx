import { useState, useRef } from "react";
import { Camera, Upload, X, Check, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8443";

interface CameraUploadProps {
  onBack: () => void;
  onSuccess?: (jobId: string) => void;
}

type UploadState = "idle" | "preview" | "uploading" | "success" | "error";

export function CameraUpload({ onBack, onSuccess }: CameraUploadProps) {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setState("preview");
  };

  const handleUpload = async () => {
    if (!selectedFile || !token) return;

    setState("uploading");
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch(`${API_BASE}/api/v1/ocr/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: selectedFile,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message ?? "アップロードに失敗しました");
      }

      const data = await res.json();
      setJobId(data.job_id);
      setState("success");
    } catch (err: any) {
      setErrorMsg(err.message ?? "アップロードに失敗しました");
      setState("error");
    }
  };

  const handleReset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    setJobId(null);
    setErrorMsg(null);
    setState("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A1628" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-[env(safe-area-inset-top)] py-4">
        <button onClick={onBack} className="p-1">
          <ArrowLeft size={22} className="text-slate-300" />
        </button>
        <h1
          className="text-white text-[18px]"
          style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}
        >
          FAX / OCR アップロード
        </h1>
      </div>

      <div className="px-5 mt-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {/* Idle state: show capture button */}
          {state === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-6 mt-12"
            >
              <div
                className="w-32 h-32 rounded-3xl flex items-center justify-center"
                style={{ background: "rgba(37, 99, 235, 0.15)", border: "2px dashed rgba(37, 99, 235, 0.4)" }}
              >
                <Camera size={48} className="text-[#2563EB]" />
              </div>

              <p
                className="text-slate-400 text-[14px] text-center leading-relaxed"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                FAX用紙を撮影するか、
                <br />
                画像ファイルを選択してください
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 rounded-2xl text-white text-[16px] flex items-center justify-center gap-2"
                style={{
                  background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontWeight: 600,
                }}
              >
                <Camera size={20} />
                撮影 / ファイル選択
              </button>
            </motion.div>
          )}

          {/* Preview state: show image + upload button */}
          {state === "preview" && previewUrl && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700/50">
                <img
                  src={previewUrl}
                  alt="プレビュー"
                  className="w-full max-h-[400px] object-contain"
                  style={{ background: "rgba(15, 23, 42, 0.8)" }}
                />
                <button
                  onClick={handleReset}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0, 0, 0, 0.6)" }}
                >
                  <X size={16} className="text-white" />
                </button>
              </div>

              <p
                className="text-slate-400 text-[13px]"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                {selectedFile?.name} ({((selectedFile?.size ?? 0) / 1024).toFixed(0)} KB)
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3.5 rounded-2xl text-slate-300 text-[15px] border border-slate-700/50"
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  やり直す
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 py-3.5 rounded-2xl text-white text-[15px] flex items-center justify-center gap-2"
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  <Upload size={18} />
                  送信する
                </button>
              </div>
            </motion.div>
          )}

          {/* Uploading state: spinner */}
          {state === "uploading" && (
            <motion.div
              key="uploading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 mt-20"
            >
              <Loader2 size={48} className="text-[#2563EB] animate-spin" />
              <p
                className="text-slate-300 text-[15px]"
                style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 500 }}
              >
                OCR処理中...
              </p>
              <p
                className="text-slate-500 text-[13px]"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                FAX内容を読み取っています
              </p>
            </motion.div>
          )}

          {/* Success state */}
          {state === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 mt-16"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16, 185, 129, 0.2)" }}
              >
                <Check size={40} className="text-[#10B981]" />
              </div>
              <p
                className="text-white text-[18px]"
                style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}
              >
                読み取り完了
              </p>
              <p
                className="text-slate-400 text-[13px] text-center"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                ジョブID: <span className="text-[#06B6D4]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{jobId}</span>
              </p>

              <div className="flex gap-3 w-full mt-4">
                <button
                  onClick={handleReset}
                  className="flex-1 py-3.5 rounded-2xl text-slate-300 text-[15px] border border-slate-700/50"
                  style={{
                    background: "rgba(15, 23, 42, 0.8)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontWeight: 500,
                  }}
                >
                  もう一枚
                </button>
                <button
                  onClick={() => onSuccess?.(jobId ?? "")}
                  className="flex-1 py-3.5 rounded-2xl text-white text-[15px]"
                  style={{
                    background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                    fontFamily: "'Noto Sans JP', sans-serif",
                    fontWeight: 600,
                  }}
                >
                  確認画面へ
                </button>
              </div>
            </motion.div>
          )}

          {/* Error state */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 mt-16"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "rgba(239, 68, 68, 0.2)" }}
              >
                <X size={40} className="text-[#EF4444]" />
              </div>
              <p
                className="text-white text-[18px]"
                style={{ fontFamily: "'Noto Sans JP', sans-serif", fontWeight: 600 }}
              >
                エラーが発生しました
              </p>
              <p
                className="text-slate-400 text-[13px] text-center"
                style={{ fontFamily: "'Noto Sans JP', sans-serif" }}
              >
                {errorMsg}
              </p>
              <button
                onClick={handleReset}
                className="w-full py-3.5 rounded-2xl text-white text-[15px] mt-4"
                style={{
                  background: "linear-gradient(135deg, #2563EB, #06B6D4)",
                  fontFamily: "'Noto Sans JP', sans-serif",
                  fontWeight: 600,
                }}
              >
                やり直す
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
