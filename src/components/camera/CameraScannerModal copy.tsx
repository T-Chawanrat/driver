import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createScanner, openCamera } from "../../utils/scanner";

type CameraScannerModalProps = {
  open: boolean;
  title: string;
  guide: string;
  onClose: () => void;
  onScan: (value: string) => void;
  closeOnScan?: boolean;
  showFrame?: boolean;
  footer?: ReactNode;
};

export default function CameraScannerModal({
  open,
  title,
  guide,
  onClose,
  onScan,
  closeOnScan = true,
  showFrame = false,
  footer,
}: CameraScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCloseRef = useRef(onClose);
  const onScanRef = useRef(onScan);
  const [error, setError] = useState("");

  onCloseRef.current = onClose;
  onScanRef.current = onScan;

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    let stream: MediaStream | null = null;
    let stopScanning: (() => void) | undefined;
    let lastValue = "";
    let lastSeen = 0;
    setError("");

    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("อุปกรณ์นี้ไม่รองรับการเปิดกล้องผ่านเบราว์เซอร์ กรุณาเปิดผ่าน HTTPS และอนุญาตสิทธิ์กล้อง");
        return;
      }

      try {
        const cameraStream = await openCamera("scan");
        if (cancelled) {
          cameraStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = cameraStream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = cameraStream;
        await videoRef.current.play();
        const stop = await createScanner(videoRef.current, (value) => {
          if (cancelled) return;
          const now = Date.now();
          if (!value || (!closeOnScan && value === lastValue && now - lastSeen <= 2000)) return;
          lastValue = value;
          lastSeen = now;
          if (closeOnScan) {
            cancelled = true;
            onCloseRef.current();
          }
          onScanRef.current(value);
        });
        if (cancelled) stop();
        else stopScanning = stop;
      } catch {
        stream?.getTracks().forEach((track) => track.stop());
        if (!cancelled) setError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้องแล้วลองใหม่");
      }
    };

    void start();
    return () => {
      cancelled = true;
      stopScanning?.();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [closeOnScan, open]);

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
          {showFrame ? (
            <div className="absolute aspect-square w-[min(78vw,330px)] shadow-[0_0_0_999px_rgb(15_23_42_/_0.12)]" aria-hidden="true">
              <span className="absolute left-0 top-0 h-9 w-9 border-l-4 border-t-4 border-white" />
              <span className="absolute right-0 top-0 h-9 w-9 border-r-4 border-t-4 border-white" />
              <span className="absolute bottom-0 left-0 h-9 w-9 border-b-4 border-l-4 border-white" />
              <span className="absolute bottom-0 right-0 h-9 w-9 border-b-4 border-r-4 border-white" />
            </div>
          ) : null}
          <p className="absolute bottom-8 px-5 text-center text-sm font-semibold">{guide}</p>
        </div>
      )}
      {!error
        ? footer ?? (showFrame ? null : <p className="px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5 text-center text-sm font-semibold text-white/80">{guide}</p>)
        : null}
    </div>
  );
}
