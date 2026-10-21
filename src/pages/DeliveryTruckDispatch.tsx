import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CheckCircle2, RotateCcw, ScanLine, Truck, X } from "lucide-react";
import AxiosInstance from "../services/http";

type TruckDetail = {
  truck_code?: string;
  route_code?: string | null;
  route_name?: string | null;
  license_plate?: string | null;
  license_plate_province?: string | null;
};

export default function DeliveryTruckDispatch({ id }: { id?: number }) {
  const [truck, setTruck] = useState<TruckDetail | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    void AxiosInstance.get(`/driver/delivery-trucks/${id}`)
      .then(({ data }) => setTruck(data?.data || data))
      .catch(() => setError("โหลดข้อมูลใบรถกระจายไม่สำเร็จ"));
  }, [id]);

  useEffect(() => {
    if (!cameraOpen || !video.current || !stream.current) return;
    video.current.srcObject = stream.current;
    void video.current.play().catch(() => setError("ไม่สามารถแสดงภาพจากกล้องได้"));
  }, [cameraOpen]);

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl],
  );

  const closeCamera = () => {
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setCameraOpen(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("อุปกรณ์นี้ไม่รองรับการเปิดกล้องผ่านเบราว์เซอร์ กรุณาเปิดด้วย Chrome บนมือถือหรือแท็บเล็ต");
      setCameraOpen(true);
      return;
    }

    try {
      setCameraError("");
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      setCameraOpen(true);
    } catch {
      setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาอนุญาตสิทธิ์กล้องแล้วลองใหม่");
      setCameraOpen(true);
    }
  };

  const capturePhoto = () => {
    if (!video.current || !video.current.videoWidth || !video.current.videoHeight) {
      setError("กล้องยังไม่พร้อมถ่ายรูป");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.current.videoWidth;
    canvas.height = video.current.videoHeight;
    canvas.getContext("2d")?.drawImage(video.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("ไม่สามารถสร้างรูปจากกล้องได้");
          return;
        }

        const file = new File([blob], "truck-close.jpg", { type: "image/jpeg" });
        if (imageUrl) URL.revokeObjectURL(imageUrl);
        setImageFile(file);
        setImageUrl(URL.createObjectURL(file));
        setSuccess("");
        setError("");
        closeCamera();
      },
      "image/jpeg",
      0.9,
    );
  };

  const selectTestPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setSuccess("");
    setError("");
    event.target.value = "";
  };

  const closeAndGo = async () => {
    if (!id || !imageFile || saving) return;

    try {
      setSaving(true);
      setError("");
      const formData = new FormData();
      formData.append("photo", imageFile);
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
        });
        if (position) {
          const { latitude, longitude, accuracy } = position.coords;
          if (Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(accuracy)) {
            formData.append("latitude", String(latitude));
            formData.append("longitude", String(longitude));
            formData.append("accuracy_m", String(accuracy));
          }
        }
      }
      const { data } = await AxiosInstance.patch(`/driver/delivery-trucks/${id}/close-and-go`, formData);
      setSuccess(data?.message || "ปิดบรรทุกและปล่อยรถสำเร็จ");
    } catch (requestError) {
      const message = requestError as { response?: { data?: { message?: string } } };
      setError(message.response?.data?.message || (requestError instanceof Error ? requestError.message : "ไม่สามารถปิดบรรทุกและปล่อยรถได้"));
    } finally {
      setSaving(false);
    }
  };

  if (!id)
    return (
      <section className="w-full px-4 pt-5 sm:px-6">
        <p className="rounded-xl bg-slate-50 p-4 text-center text-[15px] font-medium text-slate-500">กรุณาเลือกใบรถกระจายก่อนปิดบรรทุก</p>
      </section>
    );

  const routeLabel = [truck?.route_code, truck?.route_name].filter(Boolean).join(" - ") || "สายรถของใบนี้";
  const vehicleLabel = [truck?.license_plate, truck?.license_plate_province].filter(Boolean).join(" ") || "รถที่เลือก";

  return (
    <section className="flex w-full flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
      <div className="flex items-center justify-between rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <div className="grid gap-1">
          <b className="text-lg font-bold">ปิดบรรทุกและออกนำจ่าย</b>
          <span className="text-sm font-semibold text-blue-100">{truck?.truck_code || `ใบรถ #${id}`}</span>
        </div>
        <Truck size={38} strokeWidth={1.8} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <span className="grid gap-1 rounded-2xl border border-slate-200 bg-white p-3">
          <b className="text-[13px] font-semibold text-slate-600">สายรถ</b>
          <small className="truncate text-sm font-bold text-slate-800">{routeLabel}</small>
        </span>
        <span className="grid gap-1 rounded-2xl border border-slate-200 bg-white p-3">
          <b className="text-[13px] font-semibold text-slate-600">รถ</b>
          <small className="truncate text-sm font-bold text-slate-800">{vehicleLabel}</small>
        </span>
      </div>
      {imageUrl ? (
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-sm">
          <img className="block max-h-80 w-full object-cover" src={imageUrl} alt="รูปปิดบรรทุก" />
          <button
            className="absolute right-2.5 top-2.5 flex h-10 items-center gap-1.5 rounded-full bg-slate-900/75 px-3 text-[15px] font-bold text-white"
            type="button"
            onClick={() => void startCamera()}
            aria-label="ถ่ายรูปใหม่"
          >
            <RotateCcw size={18} />
            <span>ถ่ายใหม่</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-2">
          <button
            className="grid w-full grid-cols-[54px_1fr_24px] items-center gap-3 rounded-3xl bg-white p-4 text-left shadow-sm active:scale-[.99]"
            type="button"
            onClick={() => void startCamera()}
          >
            <span className="grid h-[54px] w-[54px] place-items-center rounded-2xl bg-blue-100 text-blue-600">
              <Camera size={31} strokeWidth={2.2} />
            </span>
            <span className="grid gap-1">
              <b className="text-base text-slate-900">
                ถ่ายรูปปิดบรรทุก <em className="text-red-500">*</em>
              </b>
              <small className="text-[15px] font-medium text-slate-600">เปิดกล้องหลังเพื่อถ่ายหลักฐาน 1 รูป</small>
            </span>
            <ScanLine className="text-blue-600" size={24} />
          </button>
          <input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectTestPhoto} />
          <button
            className="h-10 rounded-xl text-[15px] font-semibold text-slate-500 underline underline-offset-4"
            type="button"
            onClick={() => fileInput.current?.click()}
          >
            เลือกรูป
          </button>
        </div>
      )}
      <div className="flex gap-2 rounded-2xl bg-blue-50 p-3.5 text-[15px] font-medium leading-5 text-blue-800">
        <CheckCircle2 size={19} />
        <span>ตรวจสอบรูปและรายการสินค้าให้ครบก่อนปิดบรรทุกและออกนำจ่าย</span>
      </div>
      {error ? <p className="rounded-xl bg-red-50 p-3 text-[15px] font-medium text-red-700">{error}</p> : null}
      {success ? <p className="rounded-xl bg-emerald-50 p-3 text-[15px] font-bold text-emerald-700">{success}</p> : null}
      <button
        className="h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-[15px] font-bold text-white shadow-lg shadow-blue-600/20 disabled:bg-slate-300 disabled:shadow-none"
        type="button"
        disabled={!imageFile || saving || Boolean(success)}
        onClick={() => setConfirmOpen(true)}
      >
        {saving ? "กำลังบันทึก..." : success ? "ปิดบรรทุกและออกนำจ่ายแล้ว" : "ปิดบรรทุกและออกนำจ่าย"}
      </button>
      {confirmOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-5" role="presentation">
          <section className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="dispatch-confirm-title">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">
                <CheckCircle2 size={25} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900" id="dispatch-confirm-title">ยืนยันปิดบรรทุกและออกนำจ่าย</h2>
                <p className="mt-1 text-[15px] leading-6 text-slate-600">เมื่อยืนยันแล้ว ใบรถจะถูกปิดและเปลี่ยนสถานะเป็นกำลังนำจ่าย ไม่สามารถย้อนกลับจากหน้านี้ได้</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button className="h-12 rounded-xl border border-slate-200 text-[15px] font-bold text-slate-600" type="button" onClick={() => setConfirmOpen(false)} disabled={saving}>ยกเลิก</button>
              <button className="h-12 rounded-xl bg-blue-600 text-[15px] font-bold text-white disabled:bg-slate-300" type="button" disabled={saving} onClick={() => { setConfirmOpen(false); void closeAndGo(); }}>{saving ? "กำลังบันทึก..." : "ยืนยัน"}</button>
            </div>
          </section>
        </div>
      ) : null}
      {cameraOpen ? (
        <div
          className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] bg-slate-950 text-white"
          role="dialog"
          aria-modal="true"
          aria-label="ถ่ายรูปปิดบรรทุก"
        >
          <div className="flex items-center justify-between p-5">
            <b className="text-base font-bold">ถ่ายรูปปิดบรรทุก</b>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-white/15" type="button" onClick={closeCamera} aria-label="ปิดกล้อง">
              <X size={22} />
            </button>
          </div>
          {cameraError ? (
            <div className="grid place-content-center justify-items-center gap-4 p-8 text-center text-amber-300">
              <AlertTriangle size={28} />
              <p className="max-w-xs leading-6 text-slate-200">{cameraError}</p>
              <button className="rounded-xl bg-blue-600 px-5 py-3 text-[15px] font-bold text-white" type="button" onClick={closeCamera}>
                กลับไปหน้าปิดบรรทุก
              </button>
            </div>
          ) : (
            <>
              <div className="relative grid place-items-center overflow-hidden">
                <video className="h-full w-full object-cover" ref={video} autoPlay playsInline muted />
                <p className="absolute bottom-8 text-sm font-semibold">จัดภาพบรรทุกสินค้าให้อยู่ในกรอบ</p>
              </div>
              <div className="grid place-items-center gap-3 px-5 pb-[max(28px,env(safe-area-inset-bottom))] pt-5">
                <small className="text-[15px] font-medium text-white/70">แตะปุ่มเพื่อถ่ายรูป</small>
                <button
                  className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white bg-transparent p-[5px]"
                  type="button"
                  onClick={capturePhoto}
                  aria-label="ถ่ายรูป"
                >
                  <span className="h-14 w-14 rounded-full bg-white" />
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
