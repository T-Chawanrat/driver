import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { openCamera } from "../../utils/scanner";

type CameraCaptureModalProps = {
  open: boolean;
  title: string;
  guide?: string;
  fileName: string;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export default function CameraCaptureModal({ open, title, guide, fileName, onClose, onCapture }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCloseRef = useRef(onClose);
  const onCaptureRef = useRef(onCapture);
  const [error, setError] = useState("");

  onCloseRef.current = onClose;
  onCaptureRef.current = onCapture;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    setError("");

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("อุปกรณ์นี้ไม่รองรับการเปิดกล้องผ่านเบราว์เซอร์ กรุณาเปิดผ่าน HTTPS และอนุญาตสิทธิ์กล้อง");
        return;
      }

      try {
        const cameraStream = await openCamera("photo");
        if (cancelled) {
          cameraStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = cameraStream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = cameraStream;
        await videoRef.current.play();
      } catch {
        if (!cancelled) setError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้องแล้วลองใหม่");
      }
    };

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [open]);

  const capture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      setError("กล้องยังไม่พร้อมถ่ายรูป กรุณาลองใหม่");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่");
          return;
        }
        onCaptureRef.current(new File([blob], fileName, { type: "image/jpeg" }));
        onCloseRef.current();
      },
      "image/jpeg",
      0.9,
    );
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label={title}>
      <div className="flex items-center justify-between p-5">
        <b className="text-base font-bold">{title}</b>
        <button type="button" onClick={onClose} aria-label="ปิดกล้อง" className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
          <X size={22} />
        </button>
      </div>
      {error ? (
        <div className="grid place-content-center justify-items-center gap-4 p-8 text-center">
          <AlertTriangle size={28} className="text-amber-300" />
          <p className="max-w-xs leading-6 text-slate-200">{error}</p>
          <button type="button" onClick={onClose} className="rounded-xl bg-blue-600 px-5 py-3 text-[15px] font-bold">
            กลับ
          </button>
        </div>
      ) : (
        <div className="relative grid place-items-center overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {guide ? <p className="absolute bottom-8 px-5 text-center text-sm font-semibold">{guide}</p> : null}
        </div>
      )}
      {!error ? (
        <div className="grid place-items-center gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5">
          <small className="text-[15px] font-medium text-white/70">แตะปุ่มเพื่อถ่ายรูป</small>
          <button type="button" onClick={capture} aria-label="ถ่ายรูป" className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white bg-transparent p-[5px]">
            <span className="h-14 w-14 rounded-full bg-white" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
