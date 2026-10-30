import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, RotateCcw, ScanLine, Truck } from "lucide-react";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
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
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    void AxiosInstance.get(`/driver/delivery-trucks/${id}`)
      .then(({ data }) => setTruck(data?.data || data))
      .catch(() => setError("โหลดข้อมูลใบรถกระจายไม่สำเร็จ"));
  }, [id]);

  useEffect(
    () => () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    },
    [imageUrl],
  );

  const startCamera = () => setCameraOpen(true);

  const setImage = (file: File) => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setSuccess("");
    setError("");
  };

  const selectTestPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImage(file);
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
        <div className="flex items-stretch gap-2">
          <button
            className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm active:scale-[.99]"
            type="button"
            onClick={() => void startCamera()}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600">
              <Camera size={25} />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[15px] text-slate-900">
                ถ่ายรูปปิดบรรทุก <em className="text-red-500">*</em>
              </b>
              <span className="text-sm font-medium text-slate-600">เปิดกล้องถ่ายรูป</span>
            </span>
            <ScanLine className="shrink-0 text-blue-600" size={22} />
          </button>
          <input ref={fileInput} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectTestPhoto} />
          <button
            className="flex w-20 shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 px-2 text-sm font-bold text-white shadow-sm active:opacity-90"
            type="button"
            onClick={() => fileInput.current?.click()}
          >
            <ImagePlus size={18} /> อัปโหลด
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
      <CameraCaptureModal
        open={cameraOpen}
        title="ถ่ายรูปปิดบรรทุก"
        guide="จัดภาพบรรทุกสินค้าให้อยู่ในกรอบ"
        fileName="truck-close.jpg"
        onClose={() => setCameraOpen(false)}
        onCapture={setImage}
      />
    </section>
  );
}
