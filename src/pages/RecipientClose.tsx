import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, CheckCircle2, FileText, MapPin, Phone, ScanLine, TriangleAlert } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import DeliveryEvidenceCard from "../components/DeliveryEvidenceCard";
import { type SignaturePadHandle } from "../components/SignaturePad";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import CameraScannerModal from "../components/camera/CameraScannerModal";
import type { DeliveryRecipient } from "../types/delivery";
import AxiosInstance from "../services/http";
import { completeDriverDeliveries, getDeliveryRecipient } from "../services/deliveries";
import { getCurrentLocation } from "../utils/location";

type Photo = { file: File; url: string };
const maxPhotos = 8;

export default function RecipientClose() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const navigationState = location.state as { deliveryRecipient?: DeliveryRecipient; selectedSerialKey?: string } | null;
  const stateRecipient = navigationState?.deliveryRecipient;
  const [realRecipient, setRealRecipient] = useState<DeliveryRecipient | null>(stateRecipient || null);
  const [recipientLoading, setRecipientLoading] = useState(!stateRecipient);
  const recipient = realRecipient;
  const bills = useMemo(() => (realRecipient?.bills ?? []).map((bill) => ({
        key: bill.key,
        receiveCode: bill.receiveCode,
        receiveBusinessId: bill.receiveBusinessId,
        receiveWalkinId: bill.receiveWalkinId,
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
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photoError, setPhotoError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const photoUrls = useRef(new Set<string>());
  const signature = useRef<SignaturePadHandle>(null);

  useEffect(() => {
    if (stateRecipient) {
      setRealRecipient(stateRecipient);
      setRecipientLoading(false);
      return;
    }
    const recipientDetailId = Number(searchParams.get("recipient_detail_id"));
    const receiveBusinessId = Number(searchParams.get("receive_business_id"));
    const receiveWalkinId = Number(searchParams.get("receive_walkin_id"));
    const params = Number.isInteger(recipientDetailId) && recipientDetailId > 0
      ? { recipient_detail_id: recipientDetailId }
      : Number.isInteger(receiveBusinessId) && receiveBusinessId > 0
        ? { receive_business_id: receiveBusinessId }
        : Number.isInteger(receiveWalkinId) && receiveWalkinId > 0
          ? { receive_walkin_id: receiveWalkinId }
          : null;
    if (!params) {
      setRealRecipient(null);
      setRecipientLoading(false);
      return;
    }
    let active = true;
    setRecipientLoading(true);
    void getDeliveryRecipient(params)
      .then((recipient) => { if (active) setRealRecipient(recipient); })
      .catch(() => { if (active) setRealRecipient(null); })
      .finally(() => { if (active) setRecipientLoading(false); });
    return () => { active = false; };
  }, [searchParams, stateRecipient]);

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

  const removePhoto = (url: string) => {
    URL.revokeObjectURL(url);
    photoUrls.current.delete(url);
    setPhotos((current) => current.filter((photo) => photo.url !== url));
    setPhotoError("");
  };

  const openIssueReason = (bill: { receiveCode: string; receiveBusinessId: number | null; receiveWalkinId: number | null; serials: { key: string; serialNo: string; completed: boolean }[] }) => {
    navigate("/issues/new", {
      state: {
        deliveryIssueDraft: {
          receiveCode: bill.receiveCode,
          receiveBusinessId: bill.receiveBusinessId,
          receiveWalkinId: bill.receiveWalkinId,
          serials: bill.serials.filter((serial) => !serial.completed).map((serial) => {
            const [serialId] = JSON.parse(serial.key);
            return { serialId, serialNo: serial.serialNo };
          }),
        },
      },
    });
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
      const location = await getCurrentLocation();
      if (!location && !window.confirm("ไม่สามารถรับตำแหน่งได้ กรุณาเปิดสิทธิ์ตำแหน่งหรือตรวจสอบ GPS ต้องการบันทึกโดยไม่มีพิกัดหรือไม่?")) return;
      const body = new FormData();
      body.append("serials", JSON.stringify(selected.map((key) => { const [serial_id, serial_no] = JSON.parse(key); return { serial_id, serial_no }; })));
      for (const photo of photos) body.append("proof_images", photo.file);
      if (hasSignature) {
        const blob = await signature.current?.toBlob();
        if (!blob) throw new Error("ไม่สามารถบันทึกลายเซ็นได้");
        body.append("sign_images", blob, "signature.png");
      }
      if (location) {
        body.append("lat", String(location.latitude));
        body.append("lng", String(location.longitude));
        body.append("accuracy_m", String(location.accuracy));
      }
      await completeDriverDeliveries(body);
      navigate("/recipients", { replace: true });
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

  if (recipientLoading) return <section className="px-4 py-5"><p className="rounded-xl bg-white p-4 text-center text-[15px] font-semibold text-slate-600">กำลังโหลดข้อมูลผู้รับ...</p></section>;

  if (!recipient)
    return (
      <section className="px-4 py-5">
        <p className="rounded-xl bg-white p-4 text-center text-[15px] font-semibold text-slate-600">ไม่พบข้อมูลผู้รับ กรุณากลับไปเลือกรายการอีกครั้ง</p>
        <button type="button" onClick={() => navigate("/recipients")} className="mt-3 w-full rounded-xl bg-blue-600 p-3 font-bold text-white">กลับไปรายการส่งของ</button>
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
      {scanFeedback && <p role="status" className="break-words text-sm font-semibold text-slate-700">{scanFeedback}</p>}
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
                onClick={() => openIssueReason(bill)}
                className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-[15px] font-bold text-red-600"
              >
                <TriangleAlert size={18} />
                แจ้งปัญหาบิลนี้
              </button>
            </article>
          );
        })}
      </div>
      <DeliveryEvidenceCard
        photos={photos}
        maxPhotos={maxPhotos}
        photoError={photoError}
        hasSignature={hasSignature}
        signatureRef={signature}
        onAddPhotos={addPhotos}
        onRemovePhoto={removePhoto}
        onOpenCamera={() => setCameraOpen(true)}
        onSignatureChange={setHasSignature}
      />
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
        onClick={() => setConfirmOpen(true)}
        className="h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-[15px] font-bold text-white disabled:opacity-50"
      >
        {saving ? "กำลังบันทึก..." : "ยืนยันปิดงาน"}
      </button>
      <ConfirmModal
        open={confirmOpen}
        title="ยืนยันปิดงาน"
        description={`ส่งสำเร็จ ${selected.length} SN จาก ${selectedBillCount} บิล`}
        confirmLabel={saving ? "กำลังบันทึก..." : "ยืนยัน"}
        disabled={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); void complete(); }}
      />
      <CameraCaptureModal
        open={cameraOpen}
        title="ถ่ายรูปการส่ง"
        fileName={`delivery-${Date.now()}.jpg`}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => addPhotos([file])}
      />
      <CameraScannerModal
        open={scanOpen}
        title="สแกน SN เพื่อเลือก"
        guide="เล็งกล้องไปที่บาร์โค้ดหรือ QR Code"
        showFrame
        onClose={() => setScanOpen(false)}
        onScan={(value) => {
          const matches = serialsByNumber.get(value.toLocaleUpperCase()) ?? [];
          if (matches.length === 1 && matches[0].completed) {
            setScanFeedback(`SN ${value} ส่งสำเร็จแล้ว`);
          } else if (matches.length === 1) {
            setSelected((current) => (current.includes(matches[0].key) ? current : [...current, matches[0].key]));
            setScanFeedback(`เลือก SN ${value} แล้ว`);
          } else {
            setScanFeedback(matches.length ? `SN ${value} มีหลายรายการ กรุณาเลือกด้วยมือ` : `ไม่พบ SN ${value} ของผู้รับรายนี้`);
          }
        }}
      />
    </section>
  );
}
