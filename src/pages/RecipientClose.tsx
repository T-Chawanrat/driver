import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { Camera, FileText, MapPin, Phone, RotateCcw, ScanLine, TriangleAlert, X } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import { mockDeliveryRecipients } from "../data/mockDeliveries";
import type { DeliveryRecipient } from "./Deliveries";

type Photo = { file: File; url: string };
type BarcodeDetectorLike = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;
const maxPhotos = 8;

export default function RecipientClose() {
  const { recipientId } = useParams();
  const location = useLocation();
  const navigationState = location.state as { deliveryRecipient?: DeliveryRecipient; selectedSerialKey?: string } | null;
  const realRecipient = navigationState?.deliveryRecipient;
  const mockRecipient = mockDeliveryRecipients.find((item) => item.id === (recipientId ? Number(recipientId) : 1));
  const recipient = realRecipient || mockRecipient;
  const bills = realRecipient
    ? realRecipient.bills.map((bill) => ({
        key: bill.key,
        receiveCode: bill.receiveCode,
        remarks: bill.remarks ?? [],
        serials: bill.serials.map((serial) => ({ key: JSON.stringify([serial.id, serial.serialNo]), serialNo: serial.serialNo })),
      }))
    : (mockRecipient?.bills ?? []).map((bill) => ({
        key: bill.receiveCode,
        receiveCode: bill.receiveCode,
        remarks: [],
        serials: bill.serials.map((serial) => ({ key: serial, serialNo: serial })),
      }));
  const allSerials = bills.flatMap((bill) => bill.serials.map((serial) => serial.key));
  const [selected, setSelected] = useState<string[]>(() => navigationState?.selectedSerialKey && allSerials.includes(navigationState.selectedSerialKey) ? [navigationState.selectedSerialKey] : []);
  const [notice, setNotice] = useState("");
  const [issueBill, setIssueBill] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanFeedback, setScanFeedback] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const scanVideo = useRef<HTMLVideoElement>(null);
  const serialIndex = useRef(bills.flatMap((bill) => bill.serials));
  serialIndex.current = bills.flatMap((bill) => bill.serials);
  const stream = useRef<MediaStream | null>(null);
  const photoUrls = useRef(new Set<string>());
  const signature = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!scanOpen) return;
    let cancelled = false;
    let cameraStream: MediaStream | null = null;
    let frame: number | null = null;
    let lastValue = "";
    let lastSeen = 0;
    const openScanner = async () => {
      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanError("อุปกรณ์นี้ไม่รองรับการเปิดกล้องผ่านเบราว์เซอร์ กรุณาเปิดผ่าน HTTPS หรือเลือก SN ด้วยมือ");
        return;
      }
      if (!Detector) {
        setScanError("เบราว์เซอร์นี้ยังไม่รองรับการอ่านบาร์โค้ดจากกล้อง กรุณาเลือก SN ด้วยมือ");
        return;
      }
      try {
        const detector = new Detector({ formats: ["code_128", "code_39", "ean_13", "ean_8", "qr_code"] });
        const activeStream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" } } });
        if (cancelled) {
          activeStream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStream = activeStream;
        if (!scanVideo.current) return;
        scanVideo.current.srcObject = activeStream;
        await scanVideo.current.play();
        const scan = async () => {
          if (cancelled || !scanVideo.current) return;
          try {
            const codes = await detector.detect(scanVideo.current);
            if (cancelled) return;
            const value = codes[0]?.rawValue?.trim();
            const now = Date.now();
            if (value && (value !== lastValue || now - lastSeen > 2000)) {
              lastValue = value;
              lastSeen = now;
              const matches = serialIndex.current.filter((item) => item.serialNo.trim().toLocaleUpperCase() === value.toLocaleUpperCase());
              if (matches.length === 1) {
                setSelected((current) => current.includes(matches[0].key) ? current : [...current, matches[0].key]);
                setScanFeedback(`เลือก SN ${value} แล้ว`);
              } else {
                setScanFeedback(matches.length ? `SN ${value} มีหลายรายการ กรุณาเลือกด้วยมือ` : `ไม่พบ SN ${value} ของผู้รับรายนี้`);
              }
            }
          } catch {
            // Ignore frames that cannot yet be decoded.
          }
          if (!cancelled) frame = requestAnimationFrame(() => void scan());
        };
        if (!cancelled) void scan();
      } catch {
        if (!cancelled) setScanError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้องแล้วลองใหม่");
      }
    };
    void openScanner();
    return () => {
      cancelled = true;
      if (frame !== null) cancelAnimationFrame(frame);
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [scanOpen]);

  useEffect(() => {
    if (!cameraOpen) return;
    let cancelled = false;
    const openCamera = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError("อุปกรณ์นี้ไม่รองรับการเปิดกล้องผ่านเบราว์เซอร์ กรุณาเปิดผ่าน HTTPS");
        return;
      }
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (cancelled) {
          cameraStream.getTracks().forEach((track) => track.stop());
          return;
        }
        stream.current = cameraStream;
        if (video.current) {
          video.current.srcObject = cameraStream;
          await video.current.play();
        }
      } catch {
        if (!cancelled) setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้องแล้วลองใหม่");
      }
    };
    void openCamera();
    return () => {
      cancelled = true;
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
    };
  }, [cameraOpen]);

  useEffect(() => () => {
    photoUrls.current.forEach((url) => URL.revokeObjectURL(url));
    photoUrls.current.clear();
  }, []);

  const addPhotos = (files: File[]) => {
    const available = maxPhotos - photos.length;
    const images = files.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (images.length !== files.length) setPhotoError("รองรับเฉพาะรูป JPG, PNG และ WebP");
    else if (images.length > available) setPhotoError(`เพิ่มรูปได้ไม่เกิน ${maxPhotos} รูป`);
    else setPhotoError("");
    const additions = images.slice(0, Math.max(available, 0)).map((file) => {
      const url = URL.createObjectURL(file);
      photoUrls.current.add(url);
      return { file, url };
    });
    setPhotos((current) => [...current, ...additions]);
  };

  const selectTestPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    addPhotos(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    photoUrls.current.delete(url);
    setPhotos((current) => current.filter((photo) => photo.url !== url));
    setPhotoError("");
  };

  const capturePhoto = () => {
    if (!video.current?.videoWidth || !video.current.videoHeight) {
      setCameraError("กล้องยังไม่พร้อมถ่ายรูป กรุณาลองใหม่");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    canvas.getContext("2d")?.drawImage(video.current, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) {
        setCameraError("ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่");
        return;
      }
      addPhotos([new File([blob], `delivery-${Date.now()}.jpg`, { type: "image/jpeg" })]);
      setCameraOpen(false);
    }, "image/jpeg", 0.9);
  };

  const signaturePoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * canvas.width / bounds.width, y: (event.clientY - bounds.top) * canvas.height / bounds.height };
  };

  const startSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const { x, y } = signaturePoint(event);
    context.lineWidth = 4;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#0f172a";
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + 0.01, y + 0.01);
    context.stroke();
    drawing.current = true;
    setHasSignature(true);
  };

  const drawSignature = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = event.currentTarget.getContext("2d");
    if (!context) return;
    const { x, y } = signaturePoint(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const clearSignature = () => {
    const canvas = signature.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    drawing.current = false;
    setHasSignature(false);
  };
  const selectedBillCount = bills.filter((bill) => bill.serials.some((serial) => selected.includes(serial.key))).length;

  const toggleSerial = (serial: string) => {
    setSelected((current) => (current.includes(serial) ? current.filter((item) => item !== serial) : [...current, serial]));
    setNotice("");
  };

  const toggleBill = (serials: string[]) => {
    const allSelected = serials.every((serial) => selected.includes(serial));
    setSelected((current) => (allSelected ? current.filter((serial) => !serials.includes(serial)) : [...new Set([...current, ...serials])]));
    setNotice("");
  };

  if (!recipient)
    return (
      <section className="px-4 py-5">
        <p className="rounded-xl bg-white p-4 text-center text-[15px] font-semibold text-slate-600">ไม่พบข้อมูลผู้รับตัวอย่าง</p>
      </section>
    );

  return (
    <section className="flex w-full flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <p className="text-sm font-semibold text-blue-100">ผู้รับสินค้า</p>
        <h1 className="mt-1 text-lg font-bold">{recipient.name}</h1>
        <p className="mt-2 flex items-start gap-1.5 text-sm font-medium leading-5 text-blue-100">
          <MapPin size={16} className="mt-0.5 shrink-0" />
          {recipient.address}
        </p>
        <p className="mt-2 flex items-start gap-1.5 text-sm font-medium leading-5 text-blue-100">
          <Phone size={16} className="mt-0.5 shrink-0" />
          {realRecipient?.phones?.length ? realRecipient.phones.join(", ") : "ไม่ระบุเบอร์โทร"}
        </p>
        <div className="mt-4 flex gap-3 border-t border-white/20 pt-4 text-sm font-bold">
          <span>{bills.length} บิล</span>
          <span className="text-blue-200">·</span>
          <span>{allSerials.length} กล่อง</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">
          เลือก SN <span className="text-red-500">*</span>
        </h2>
        <span className="shrink-0 text-sm font-bold text-blue-700">
          เลือก {selected.length}/{allSerials.length} SN
        </span>
      </div>
      <button type="button" onClick={() => { setScanError(""); setScanFeedback(""); setScanOpen(true); }} className="grid w-full grid-cols-[54px_1fr_24px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[.99]">
        <span className="grid h-[54px] w-[54px] place-items-center rounded-2xl bg-blue-100 text-blue-600"><Camera size={29} /></span>
        <span className="grid gap-1"><b className="text-base text-slate-900">สแกน SN ด้วยกล้อง</b><small className="text-sm font-medium text-slate-600">เล็งกล้องไปที่บาร์โค้ดหรือ QR Code</small></span>
        <ScanLine className="text-blue-600" size={24} />
      </button>
      <div className="grid gap-3">
        {bills.map((bill) => {
          const selectedCount = bill.serials.filter((serial) => selected.includes(serial.key)).length;
          return (
            <article key={bill.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <FileText size={19} className="mt-0.5 shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="break-all text-[15px] font-bold text-slate-900">{bill.receiveCode}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    เลือก {selectedCount}/{bill.serials.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBill(bill.serials.map((serial) => serial.key))}
                  className="shrink-0 text-sm font-bold text-blue-700"
                >
                  {selectedCount === bill.serials.length ? "ไม่เลือกทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>
              {bill.remarks.length ? (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-base font-semibold leading-6 text-amber-800">
                  <span className="whitespace-pre-line break-words">{bill.remarks.join("\n")}</span>
                </div>
              ) : null}
              <div className="mt-3 grid gap-2">
                {bill.serials.map((serial) => (
                  <label key={serial.key} className="flex min-h-11 items-center gap-3 rounded-xl bg-slate-50 px-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(serial.key)}
                      onChange={() => toggleSerial(serial.key)}
                      className="h-4 w-4 shrink-0 accent-blue-600"
                    />
                    <code className="break-all text-[15px] font-semibold text-slate-700">{serial.serialNo}</code>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIssueBill(bill.key)}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-[15px] font-bold text-red-600"
              >
                <TriangleAlert size={18} />
                แจ้งปัญหาบิลนี้
              </button>
              {issueBill === bill.key && (
                <p role="status" className="mt-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                  ตัวอย่างแจ้งปัญหาสำหรับบิล {bill.receiveCode} — ยังไม่ได้บันทึกข้อมูลจริง
                </p>
              )}
            </article>
          );
        })}
      </div>
      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">รูปการส่ง <span className="text-red-500">*</span></h2>
          <span className="text-sm font-semibold text-slate-500">{photos.length}/{maxPhotos} รูป</span>
        </div>
        <button
          type="button"
          disabled={photos.length >= maxPhotos}
          onClick={() => { setCameraError(""); setCameraOpen(true); }}
          className="grid w-full grid-cols-[54px_1fr_24px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[.99] disabled:opacity-50"
        >
          <span className="grid h-[54px] w-[54px] place-items-center rounded-2xl bg-blue-100 text-blue-600"><Camera size={29} /></span>
          <span className="grid gap-1"><b className="text-base text-slate-900">ถ่ายรูปการส่ง</b><small className="text-sm font-medium text-slate-600">เปิดกล้องเพื่อถ่ายรูป สูงสุด {maxPhotos} รูป</small></span>
          <ScanLine className="text-blue-600" size={24} />
        </button>
        <input ref={photoInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectTestPhotos} />
        <button type="button" disabled={photos.length >= maxPhotos} onClick={() => photoInput.current?.click()} className="min-h-10 text-[15px] font-semibold text-slate-500 underline underline-offset-4 disabled:opacity-50">เลือกรูปสำหรับทดสอบ</button>
        {photoError ? <p role="alert" className="text-sm font-medium text-red-600">{photoError}</p> : null}
        {photos.length ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((photo, index) => <div key={photo.url} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            <img src={photo.url} alt={`รูปการส่ง ${index + 1}`} className="h-full w-full object-cover" />
            <button type="button" onClick={() => removePhoto(photo.url)} aria-label={`ลบรูปการส่ง ${index + 1}`} className="absolute right-1 top-1 grid h-9 w-9 place-items-center rounded-full bg-slate-900/75 text-white"><X size={18} /></button>
          </div>)}
        </div> : null}
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-bold text-slate-900">ลายเซ็นผู้รับ <span className="text-red-500">*</span></h2>
          <button type="button" onClick={clearSignature} disabled={!hasSignature} className="flex min-h-10 items-center gap-1 text-sm font-bold text-blue-700 disabled:text-slate-400"><RotateCcw size={16} />ล้างลายเซ็น</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <canvas ref={signature} width={900} height={400} aria-label="พื้นที่เซ็นลายเซ็นผู้รับ" className="block h-40 w-full touch-none" onPointerDown={startSignature} onPointerMove={drawSignature} onPointerUp={() => { drawing.current = false; }} onPointerCancel={() => { drawing.current = false; }} onLostPointerCapture={() => { drawing.current = false; }} />
        </div>
      </div>
      <div className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">
        เลือก {selected.length} กล่อง จาก {selectedBillCount} บิล
      </div>
      {notice && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          {notice}
        </p>
      )}
      <button
        type="button"
        disabled={!selected.length}
        onClick={() => setNotice("ตัวอย่างหน้าจอ: ยังไม่ได้บันทึกข้อมูลจริง")}
        className="h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-[15px] font-bold text-white disabled:opacity-50"
      >
        ยืนยันปิดงาน
      </button>
      {cameraOpen ? <div className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label="ถ่ายรูปการส่ง">
        <div className="flex items-center justify-between p-5"><b className="text-base font-bold">ถ่ายรูปการส่ง</b><button type="button" onClick={() => setCameraOpen(false)} aria-label="ปิดกล้อง" className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><X size={22} /></button></div>
        {cameraError ? <div className="grid place-content-center justify-items-center gap-4 p-8 text-center"><TriangleAlert size={28} className="text-amber-300" /><p className="max-w-xs leading-6 text-slate-200">{cameraError}</p><button type="button" onClick={() => setCameraOpen(false)} className="rounded-xl bg-blue-600 px-5 py-3 text-[15px] font-bold">กลับ</button></div> : <>
          <div className="relative grid place-items-center overflow-hidden"><video ref={video} autoPlay playsInline muted className="h-full w-full object-cover" /></div>
          <div className="grid place-items-center gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5"><small className="text-[15px] font-medium text-white/70">แตะปุ่มเพื่อถ่ายรูป</small><button type="button" onClick={capturePhoto} aria-label="ถ่ายรูป" className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white bg-transparent p-[5px]"><span className="h-14 w-14 rounded-full bg-white" /></button></div>
        </>}
      </div> : null}
      {scanOpen ? <div className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label="สแกน SN เพื่อเลือก">
        <div className="flex items-center justify-between p-5"><b className="text-base font-bold">สแกน SN เพื่อเลือก</b><button type="button" onClick={() => setScanOpen(false)} aria-label="ปิดกล้อง" className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><X size={22} /></button></div>
        {scanError ? <div className="grid place-content-center justify-items-center gap-4 p-8 text-center"><TriangleAlert size={28} className="text-amber-300" /><p className="max-w-xs leading-6 text-slate-200">{scanError}</p></div> : <div className="relative grid place-items-center overflow-hidden"><video ref={scanVideo} autoPlay playsInline muted className="h-full w-full object-cover" /></div>}
        <div className="grid gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5 text-center">{!scanError ? <p role="status" className="break-words text-sm font-semibold text-white">{scanFeedback || "เล็งกล้องไปที่บาร์โค้ดหรือ QR Code"}</p> : null}<button type="button" onClick={() => setScanOpen(false)} className="h-12 rounded-xl bg-blue-600 text-[15px] font-bold">เสร็จสิ้น</button></div>
      </div> : null}
    </section>
  );
}
