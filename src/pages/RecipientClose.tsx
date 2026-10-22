import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { Camera, CheckCircle2, FileText, ImagePlus, MapPin, Phone, RotateCcw, ScanLine, TriangleAlert, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import type { DeliveryRecipient } from "../types/delivery";
import { createScanner, openCamera as openDeviceCamera } from "../utils/scanner";
import AxiosInstance from "../services/http";

type Photo = { file: File; url: string };
const maxPhotos = 8;

export default function RecipientClose() {
  const location = useLocation();
  const navigate = useNavigate();
  const navigationState = location.state as { deliveryRecipient?: DeliveryRecipient; selectedSerialKey?: string } | null;
  const realRecipient = navigationState?.deliveryRecipient;
  const recipient = realRecipient;
  const bills = useMemo(() => (realRecipient?.bills ?? []).map((bill) => ({
        key: bill.key,
        receiveCode: bill.receiveCode,
        remarks: bill.remarks ?? [],
        media: bill.media ?? { proof: [], signatures: [] },
        serials: bill.serials.map((serial) => ({ key: JSON.stringify([serial.id, serial.serialNo]), serialNo: serial.serialNo, completed: serial.completed })),
      })), [realRecipient]);
  const allSerials = useMemo(() => bills.flatMap((bill) => bill.serials.filter((serial) => !serial.completed).map((serial) => serial.key)), [bills]);
  const serialsByNumber = useMemo(() => {
    const index = new Map<string, (typeof bills)[number]["serials"]>();
    for (const bill of bills) {
      for (const serial of bill.serials) {
        const number = serial.serialNo.trim().toLocaleUpperCase();
        const matches = index.get(number) ?? [];
        matches.push(serial);
        index.set(number, matches);
      }
    }
    return index;
  }, [bills]);
  const [selected, setSelected] = useState<string[]>(() =>
    navigationState?.selectedSerialKey && allSerials.includes(navigationState.selectedSerialKey) ? [navigationState.selectedSerialKey] : [],
  );
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
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
  const serialIndex = useRef(serialsByNumber);
  serialIndex.current = serialsByNumber;
  const stream = useRef<MediaStream | null>(null);
  const photoUrls = useRef(new Set<string>());
  const signature = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    if (!scanOpen) return;
    let cancelled = false;
    let cameraStream: MediaStream | null = null;
    let stopScanning: (() => void) | undefined;
    let lastValue = "";
    let lastSeen = 0;
    const openScanner = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setScanError("อุปกรณ์นี้ไม่รองรับการเปิดกล้องผ่านเบราว์เซอร์ กรุณาเปิดผ่าน HTTPS หรือเลือก SN ด้วยมือ");
        return;
      }
      try {
        const activeStream = await openDeviceCamera("scan");
        if (cancelled) {
          activeStream.getTracks().forEach((track) => track.stop());
          return;
        }
        cameraStream = activeStream;
        if (!scanVideo.current) return;
        scanVideo.current.srcObject = activeStream;
        await scanVideo.current.play();
        const stop = await createScanner(scanVideo.current, (value) => {
          if (cancelled) return;
          const now = Date.now();
          if (value && (value !== lastValue || now - lastSeen > 2000)) {
            lastValue = value;
            lastSeen = now;
            const matches = serialIndex.current.get(value.toLocaleUpperCase()) ?? [];
            if (matches.length === 1 && matches[0].completed) {
              setScanFeedback(`SN ${value} ส่งสำเร็จแล้ว`);
            } else if (matches.length === 1) {
              setSelected((current) => (current.includes(matches[0].key) ? current : [...current, matches[0].key]));
              setScanFeedback(`เลือก SN ${value} แล้ว`);
            } else {
              setScanFeedback(matches.length ? `SN ${value} มีหลายรายการ กรุณาเลือกด้วยมือ` : `ไม่พบ SN ${value} ของผู้รับรายนี้`);
            }
          }
        });
        if (cancelled) stop();
        else stopScanning = stop;
      } catch {
        cameraStream?.getTracks().forEach((track) => track.stop());
        if (!cancelled) setScanError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้องแล้วลองใหม่");
      }
    };
    void openScanner();
    return () => {
      cancelled = true;
      stopScanning?.();
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
        const cameraStream = await openDeviceCamera("photo");
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

  useEffect(
    () => () => {
      photoUrls.current.forEach((url) => URL.revokeObjectURL(url));
      photoUrls.current.clear();
    },
    [],
  );

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
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setCameraError("ไม่สามารถบันทึกรูปได้ กรุณาลองใหม่");
          return;
        }
        addPhotos([new File([blob], `delivery-${Date.now()}.jpg`, { type: "image/jpeg" })]);
        setCameraOpen(false);
      },
      "image/jpeg",
      0.9,
    );
  };

  const signaturePoint = (event: PointerEvent<HTMLCanvasElement>) => {
    const canvas = event.currentTarget;
    const bounds = canvas.getBoundingClientRect();
    return { x: ((event.clientX - bounds.left) * canvas.width) / bounds.width, y: ((event.clientY - bounds.top) * canvas.height) / bounds.height };
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
  const selectedSet = new Set(selected);
  const selectedBills = bills.filter((bill) => bill.serials.some((serial) => selectedSet.has(serial.key)));
  const selectedBillCount = selectedBills.length;
  const evidenceReady = selectedBills.length > 0 && selectedBills.every((bill) =>
    bill.media.proof.length + photos.length >= 1 && bill.media.proof.length + photos.length <= 8 &&
    bill.media.signatures.length + Number(hasSignature) >= 1 && bill.media.signatures.length + Number(hasSignature) <= 4,
  );
  const mediaUrl = (url: string) => new URL(url, AxiosInstance.defaults.baseURL || window.location.origin).href;

  const complete = async () => {
    if (!realRecipient || !evidenceReady || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const position = navigator.geolocation && window.isSecureContext
        ? await new Promise<GeolocationPosition | null>((resolve) => navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }))
        : null;
      if (!position && !window.confirm("ไม่สามารถรับตำแหน่งได้ กรุณาเปิดสิทธิ์ตำแหน่งหรือตรวจสอบ GPS ต้องการบันทึกโดยไม่มีพิกัดหรือไม่?")) return;
      const body = new FormData();
      body.append("serials", JSON.stringify(selected.map((key) => { const [serial_id, serial_no] = JSON.parse(key); return { serial_id, serial_no }; })));
      for (const photo of photos) body.append("proof_images", photo.file);
      if (hasSignature && signature.current) {
        const blob = await new Promise<Blob | null>((resolve) => signature.current!.toBlob(resolve, "image/png"));
        if (!blob) throw new Error("ไม่สามารถบันทึกลายเซ็นได้");
        body.append("sign_images", blob, "signature.png");
      }
      if (position) {
        body.append("lat", String(position.coords.latitude));
        body.append("lng", String(position.coords.longitude));
        body.append("accuracy_m", String(position.coords.accuracy));
      }
      await AxiosInstance.post("/driver/deliveries/complete", body);
      navigate("/deliveries", { replace: true });
    } catch (error: any) {
      setNotice(error?.response?.data?.message || error?.message || "ไม่สามารถบันทึกการจัดส่งได้");
    } finally { setSaving(false); }
  };

  const toggleSerial = (serial: string) => {
    setSelected((current) => (current.includes(serial) ? current.filter((item) => item !== serial) : [...current, serial]));
    setNotice("");
  };

  const toggleBill = (serials: string[]) => {
    const allSelected = serials.every((serial) => selectedSet.has(serial));
    setSelected((current) => (allSelected ? current.filter((serial) => !serials.includes(serial)) : [...new Set([...current, ...serials])]));
    setNotice("");
  };

  if (!recipient)
    return (
      <section className="px-4 py-5">
        <p className="rounded-xl bg-white p-4 text-center text-[15px] font-semibold text-slate-600">ไม่พบข้อมูลผู้รับ กรุณากลับไปเลือกรายการอีกครั้ง</p>
        <button type="button" onClick={() => navigate("/deliveries")} className="mt-3 w-full rounded-xl bg-blue-600 p-3 font-bold text-white">กลับไปรายการส่งของ</button>
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
      <button
        type="button"
        onClick={() => {
          setScanError("");
          setScanFeedback("");
          setScanOpen(true);
        }}
        className="grid w-full grid-cols-[54px_1fr_24px] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[.99]"
      >
        <span className="grid h-[54px] w-[54px] place-items-center rounded-2xl bg-blue-100 text-blue-600">
          <Camera size={29} />
        </span>
        <span className="grid gap-1">
          <b className="text-base text-slate-900">สแกน SN ด้วยกล้อง</b>
          <small className="text-sm font-medium text-slate-600">เล็งกล้องไปที่บาร์โค้ดหรือ QR Code</small>
        </span>
        <ScanLine className="text-blue-600" size={24} />
      </button>
      <div className="grid gap-3">
        {bills.map((bill) => {
          const selectedCount = bill.serials.filter((serial) => selectedSet.has(serial.key)).length;
          const availableSerials = bill.serials.filter((serial) => !serial.completed).map((serial) => serial.key);
          return (
            <article key={bill.key} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <FileText size={19} className="mt-0.5 shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="break-all text-[15px] font-bold text-slate-900">{bill.receiveCode}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    เลือก {selectedCount}/{availableSerials.length}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleBill(availableSerials)}
                  disabled={!availableSerials.length}
                  className="shrink-0 text-sm font-bold text-blue-700 disabled:text-slate-400"
                >
                  {availableSerials.length > 0 && selectedCount === availableSerials.length ? "ไม่เลือกทั้งหมด" : "เลือกทั้งหมด"}
                </button>
              </div>
              {bill.remarks.length ? (
                <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-base font-semibold leading-6 text-amber-800">
                  <span className="whitespace-pre-line break-words">{bill.remarks.join("\n")}</span>
                </div>
              ) : null}
              {(bill.media.proof.length > 0 || bill.media.signatures.length > 0) && (
                <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
                  {bill.media.proof.length > 0 && (
                    <div className="grid gap-2">
                      <p>รูปการส่ง {bill.media.proof.length}/8</p>
                      <div className="flex flex-wrap gap-2">
                        {bill.media.proof.map((url, index) => (
                          <a key={`${url}-${index}`} href={mediaUrl(url)} target="_blank" rel="noreferrer">
                            <img src={mediaUrl(url)} alt={`รูปการส่ง ${index + 1}`} loading="lazy" decoding="async" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  {bill.media.signatures.length > 0 && (
                    <div className="grid gap-2">
                      <p>ลายเซ็นผู้รับ {bill.media.signatures.length}/4</p>
                      <div className="flex flex-wrap gap-2">
                        {bill.media.signatures.map((url, index) => (
                          <a key={`${url}-${index}`} href={mediaUrl(url)} target="_blank" rel="noreferrer">
                            <img src={mediaUrl(url)} alt={`ลายเซ็นผู้รับ ${index + 1}`} loading="lazy" decoding="async" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-3 grid gap-2">
                {bill.serials.map((serial) => (
                  <label key={serial.key} className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 ${serial.completed ? "border-emerald-200 bg-emerald-50" : "border-transparent bg-slate-50"}`}>
                    {serial.completed ? (
                      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <input
                        type="checkbox"
                        checked={selectedSet.has(serial.key)}
                        onChange={() => toggleSerial(serial.key)}
                        className="h-4 w-4 shrink-0 accent-blue-600"
                      />
                    )}
                    <code className={`break-all text-[15px] font-semibold ${serial.completed ? "text-emerald-700" : "text-slate-700"}`}>{serial.serialNo}</code>
                    {serial.completed && <span className="ml-auto shrink-0 text-xs font-bold text-emerald-700">ส่งสำเร็จแล้ว</span>}
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
          <h2 className="text-base font-bold text-slate-900">
            รูปการส่ง <span className="text-red-500">*</span>
          </h2>
          <span className="text-sm font-semibold text-slate-500">
            {photos.length}/{maxPhotos} รูป
          </span>
        </div>
        <div className="flex items-stretch gap-2">
          <button
            type="button"
            disabled={photos.length >= maxPhotos}
            onClick={() => { setCameraError(""); setCameraOpen(true); }}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm active:scale-[.99] disabled:opacity-50"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600"><Camera size={25} /></span>
            <span className="min-w-0 flex-1"><b className="block text-[15px] text-slate-900">ถ่ายรูปการส่ง</b><span className="text-sm font-medium text-slate-600">เปิดกล้องถ่ายรูป</span></span>
            <ScanLine className="shrink-0 text-blue-600" size={22} />
          </button>
          <button
            type="button"
            disabled={photos.length >= maxPhotos}
            onClick={() => photoInput.current?.click()}
            className="flex w-20 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 px-2 text-sm font-bold text-white shadow-sm active:opacity-90 disabled:opacity-50"
          >
            <ImagePlus size={18} /> อัปโหลด
          </button>
        </div>
        <input ref={photoInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectTestPhotos} />
        {photoError ? (
          <p role="alert" className="text-sm font-medium text-red-600">
            {photoError}
          </p>
        ) : null}
        {photos.length ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {photos.map((photo, index) => (
              <div key={photo.url} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                <img src={photo.url} alt={`รูปการส่ง ${index + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(photo.url)}
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
            onClick={clearSignature}
            disabled={!hasSignature}
            className="flex min-h-10 items-center gap-1 text-sm font-bold text-blue-700 disabled:text-slate-400"
          >
            <RotateCcw size={16} />
            ล้างลายเซ็น
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <canvas
            ref={signature}
            width={900}
            height={400}
            aria-label="พื้นที่เซ็นลายเซ็นผู้รับ"
            className="block h-40 w-full touch-none"
            onPointerDown={startSignature}
            onPointerMove={drawSignature}
            onPointerUp={() => {
              drawing.current = false;
            }}
            onPointerCancel={() => {
              drawing.current = false;
            }}
            onLostPointerCapture={() => {
              drawing.current = false;
            }}
          />
        </div>
      </div>
      <div className="rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">
        เลือก {selected.length} กล่อง จาก {selectedBillCount} บิล
      </div>
      {selectedBills.length > 0 && !evidenceReady && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">แต่ละบิลที่เลือกต้องมีรูปและลายเซ็น โดยรูปส่งงานไม่เกิน 8 รูป และลายเซ็นไม่เกิน 4 รูปต่อบิล</p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          {notice}
        </p>
      )}
      <button
        type="button"
        disabled={!realRecipient || !evidenceReady || saving}
        onClick={() => void complete()}
        className="h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-[15px] font-bold text-white disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "ยืนยันปิดงาน"}
      </button>
      {cameraOpen ? (
        <div
          className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] bg-slate-950 text-white"
          role="dialog"
          aria-modal="true"
          aria-label="ถ่ายรูปการส่ง"
        >
          <div className="flex items-center justify-between p-5">
            <b className="text-base font-bold">ถ่ายรูปการส่ง</b>
            <button
              type="button"
              onClick={() => setCameraOpen(false)}
              aria-label="ปิดกล้อง"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15"
            >
              <X size={22} />
            </button>
          </div>
          {cameraError ? (
            <div className="grid place-content-center justify-items-center gap-4 p-8 text-center">
              <TriangleAlert size={28} className="text-amber-300" />
              <p className="max-w-xs leading-6 text-slate-200">{cameraError}</p>
              <button type="button" onClick={() => setCameraOpen(false)} className="rounded-xl bg-blue-600 px-5 py-3 text-[15px] font-bold">
                กลับ
              </button>
            </div>
          ) : (
            <>
              <div className="relative grid place-items-center overflow-hidden">
                <video ref={video} autoPlay playsInline muted className="h-full w-full object-cover" />
              </div>
              <div className="grid place-items-center gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5">
                <small className="text-[15px] font-medium text-white/70">แตะปุ่มเพื่อถ่ายรูป</small>
                <button
                  type="button"
                  onClick={capturePhoto}
                  aria-label="ถ่ายรูป"
                  className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white bg-transparent p-[5px]"
                >
                  <span className="h-14 w-14 rounded-full bg-white" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
      {scanOpen ? (
        <div
          className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] bg-slate-950 text-white"
          role="dialog"
          aria-modal="true"
          aria-label="สแกน SN เพื่อเลือก"
        >
          <div className="flex items-center justify-between p-5">
            <b className="text-base font-bold">สแกน SN เพื่อเลือก</b>
            <button
              type="button"
              onClick={() => setScanOpen(false)}
              aria-label="ปิดกล้อง"
              className="grid h-10 w-10 place-items-center rounded-full bg-white/15"
            >
              <X size={22} />
            </button>
          </div>
          {scanError ? (
            <div className="grid place-content-center justify-items-center gap-4 p-8 text-center">
              <TriangleAlert size={28} className="text-amber-300" />
              <p className="max-w-xs leading-6 text-slate-200">{scanError}</p>
            </div>
          ) : (
            <div className="relative grid place-items-center overflow-hidden">
              <video ref={scanVideo} autoPlay playsInline muted className="h-full w-full object-cover" />
            </div>
          )}
          <div className="grid gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5 text-center">
            {!scanError ? (
              <p role="status" className="break-words text-sm font-semibold text-white">
                {scanFeedback || "เล็งกล้องไปที่บาร์โค้ดหรือ QR Code"}
              </p>
            ) : null}
            <button type="button" onClick={() => setScanOpen(false)} className="h-12 rounded-xl bg-blue-600 text-[15px] font-bold">
              เสร็จสิ้น
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
