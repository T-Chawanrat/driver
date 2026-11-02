import { ImagePlus, Camera, RotateCcw, ScanLine, X } from "lucide-react";
import { useRef, type ChangeEvent, type RefObject } from "react";

import SignaturePad, { type SignaturePadHandle } from "./SignaturePad";

type DeliveryEvidenceCardProps = {
  photos: { url: string }[];
  maxPhotos: number;
  photoError: string;
  hasSignature: boolean;
  signatureRef: RefObject<SignaturePadHandle | null>;
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (url: string) => void;
  onOpenCamera: () => void;
  onSignatureChange: (hasSignature: boolean) => void;
};

export default function DeliveryEvidenceCard({
  photos,
  maxPhotos,
  photoError,
  hasSignature,
  signatureRef,
  onAddPhotos,
  onRemovePhoto,
  onOpenCamera,
  onSignatureChange,
}: DeliveryEvidenceCardProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const isFull = photos.length >= maxPhotos;

  const selectPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    onAddPhotos(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">
          รูปการส่ง <span className="text-red-500">*</span>
        </h2>
        <span className="text-sm font-semibold text-slate-500">{photos.length}/{maxPhotos} รูป</span>
      </div>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          disabled={isFull}
          onClick={onOpenCamera}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm active:scale-[.99] disabled:opacity-50"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600"><Camera size={25} /></span>
          <span className="min-w-0 flex-1"><b className="block text-[15px] text-slate-900">ถ่ายรูปการส่ง</b><span className="text-sm font-medium text-slate-600">เปิดกล้องถ่ายรูป</span></span>
          <ScanLine className="shrink-0 text-blue-600" size={22} />
        </button>
        <button
          type="button"
          disabled={isFull}
          onClick={() => fileInput.current?.click()}
          className="flex w-20 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 px-2 text-sm font-bold text-white shadow-sm active:opacity-90 disabled:opacity-50"
        >
          <ImagePlus size={18} /> อัปโหลด
        </button>
      </div>
      <input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectPhotos} />
      {photoError ? <p role="alert" className="text-sm font-medium text-red-600">{photoError}</p> : null}
      {photos.length ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => (
            <div key={photo.url} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
              <img src={photo.url} alt={`รูปการส่ง ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onRemovePhoto(photo.url)}
                aria-label={`ลบรูปการส่ง ${index + 1}`}
                className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-slate-900/75 text-white"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-bold text-slate-900">
          ลายเซ็นผู้รับ <span className="text-red-500">*</span>
        </h2>
        <button
          type="button"
          onClick={() => signatureRef.current?.clear()}
          disabled={!hasSignature}
          className="flex min-h-10 items-center gap-1 text-sm font-bold text-blue-700 disabled:text-slate-400"
        >
          <RotateCcw size={16} />
          ล้างลายเซ็น
        </button>
      </div>
      <SignaturePad ref={signatureRef} onChange={onSignatureChange} />
    </div>
  );
}
