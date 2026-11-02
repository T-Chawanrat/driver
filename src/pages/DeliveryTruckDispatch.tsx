import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ImagePlus, RotateCcw, ScanLine, Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../components/ConfirmModal";
import CameraCaptureModal from "../components/camera/CameraCaptureModal";
import AxiosInstance from "../services/http";
import { getCurrentLocation } from "../utils/location";

type TruckDetail = {
  truck_code?: string;
  route_code?: string | null;
  route_name?: string | null;
  license_plate?: string | null;
  license_plate_province?: string | null;
};

export default function DeliveryTruckDispatch({ id }: { id?: number }) {
  const navigate = useNavigate();
  const [truck, setTruck] = useState<TruckDetail | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [saving, setSaving] = useState(false);
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
      const location = await getCurrentLocation();
      if (location) {
        formData.append("latitude", String(location.latitude));
        formData.append("longitude", String(location.longitude));
        formData.append("accuracy_m", String(location.accuracy));
      }
      await AxiosInstance.patch(`/driver/delivery-trucks/${id}/close-and-go`, formData);
      navigate("/recipients", { replace: true });
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
      <button
        className="h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-[15px] font-bold text-white shadow-lg shadow-blue-600/20 disabled:bg-slate-300 disabled:shadow-none"
        type="button"
        disabled={!imageFile || saving}
        onClick={() => setConfirmOpen(true)}
      >
        {saving ? "กำลังบันทึก..." : "ปิดบรรทุกและออกนำจ่าย"}
      </button>
      <ConfirmModal
        open={confirmOpen}
        title="ยืนยันปิดบรรทุกและออกนำจ่าย"
        description="เมื่อยืนยันแล้ว ใบรถจะถูกปิดและเปลี่ยนสถานะเป็นกำลังนำจ่าย ไม่สามารถย้อนกลับจากหน้านี้ได้"
        icon={<CheckCircle2 size={25} />}
        confirmLabel={saving ? "กำลังบันทึก..." : "ยืนยัน"}
        disabled={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); void closeAndGo(); }}
      />
      <CameraCaptureModal
        open={cameraOpen}
        title="ถ่ายรูปปิดบรรทุก"
        fileName="truck-close.jpg"
        onClose={() => setCameraOpen(false)}
        onCapture={setImage}
      />
    </section>
  );
}
