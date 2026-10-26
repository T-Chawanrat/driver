import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, ImagePlus, LocateFixed, MapPin, ScanLine, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../context/AuthContext";
import AxiosInstance from "../services/http";
import { openCamera } from "../utils/scanner";
import SearchableSelect from "./SearchableSelect";

type Photo = { file: File; url: string };
type Vehicle = { id: number; license_plate: string | null; license_plate_province: string | null };
export type MileageProps = {
  mileage: { id: number; license_plate: string | null; license_plate_province: string | null } | null;
  loading: boolean;
  loadError: string;
  refresh: () => Promise<void>;
};

export default function MileageForm({ mode, mileage: currentMileage, loading, loadError, refresh }: MileageProps & { mode: "open" | "close" }) {
  const { driver } = useDriverAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [vehiclesError, setVehiclesError] = useState("");
  const [mileage, setMileage] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [currentLocation, setCurrentLocation] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number; accuracy: number } | null>(null);
  const [locationMessage, setLocationMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const photoUrls = useRef(new Set<string>());
  const video = useRef<HTMLVideoElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const maxPhotos = mode === "open" ? 2 : 5;
  const isOpen = Boolean(currentMileage);
  const name = [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || driver?.username || "พนักงานขับรถ";

  useEffect(() => () => { photoUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => { getLocation(); }, []);

  useEffect(() => {
    if (!cameraOpen) return;
    let cancelled = false;
    let stream: MediaStream | undefined;
    void openCamera("photo").then(async (result) => {
      if (cancelled) { result.getTracks().forEach((track) => track.stop()); return; }
      stream = result;
      if (video.current) { video.current.srcObject = result; await video.current.play(); }
    }).catch(() => { if (!cancelled) setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบ HTTPS และสิทธิ์กล้อง"); });
    return () => { cancelled = true; stream?.getTracks().forEach((track) => track.stop()); };
  }, [cameraOpen]);

  useEffect(() => {
    let active = true;
    void AxiosInstance.get<{ data: Vehicle[] }>("/vehicles")
      .then(({ data }) => { if (active) setVehicles(Array.isArray(data.data) ? data.data : []); })
      .catch(() => { if (active) setVehiclesError("ไม่สามารถโหลดรายการรถได้"); })
      .finally(() => { if (active) setVehiclesLoading(false); });
    return () => { active = false; };
  }, []);

  const addFiles = (files: File[]) => {
    if (files.some((file) => !file.type.startsWith("image/"))) return setError("กรุณาเลือกรูปภาพเท่านั้น");
    if (photos.length + files.length > maxPhotos) return setError(`เพิ่มรูปได้ไม่เกิน ${maxPhotos} รูป`);
    setError("");
    const additions = files.map((file) => {
      const url = URL.createObjectURL(file);
      photoUrls.current.add(url);
      return { file, url };
    });
    setPhotos((current) => [...current, ...additions]);
  };

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    addFiles(files);
  };

  const capturePhoto = () => {
    const camera = video.current;
    if (!camera?.videoWidth || !camera.videoHeight) return setCameraError("กล้องยังไม่พร้อม กรุณาลองอีกครั้ง");
    const canvas = document.createElement("canvas");
    canvas.width = camera.videoWidth;
    canvas.height = camera.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return setCameraError("ไม่สามารถถ่ายรูปได้ กรุณาลองอีกครั้ง");
    context.drawImage(camera, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return setCameraError("ไม่สามารถถ่ายรูปได้ กรุณาลองอีกครั้ง");
      addFiles([new File([blob], `mileage-${Date.now()}.jpg`, { type: "image/jpeg" })]);
      setCameraOpen(false);
    }, "image/jpeg", 0.9);
  };

  const getLocation = () => {
    if (!navigator.geolocation) return setLocationMessage("อุปกรณ์นี้ไม่รองรับตำแหน่ง หรือไม่ได้เปิดผ่าน HTTPS");
    setLocationMessage("กำลังค้นหาตำแหน่ง...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setCoordinates({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }); setCurrentLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`); setLocationMessage(""); },
      () => { setCoordinates(null); setCurrentLocation(""); setLocationMessage("ไม่สามารถรับตำแหน่งได้ กรุณาตรวจสอบสิทธิ์ตำแหน่ง"); },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const submit = async () => {
    if (!driver?.id || !photos.length || loading || loadError || saving) return;
    const vehicle = vehicles.find((item) => String(item.id) === vehicleId);
    if (mode === "open" && !vehicle) return setError("กรุณาเลือกทะเบียนรถ");
    if (mode === "close" && !currentMileage) return;
    if (mileage && (!/^\d+$/.test(mileage) || Number(mileage) > 4294967295)) return setError("กรุณากรอกเลขไมล์เป็นจำนวนเต็มตั้งแต่ 0 ถึง 4,294,967,295");
    const form = new FormData();
    photos.forEach(({ file }) => form.append("images", file));
    if (mileage.trim()) form.append("mileage", mileage.trim());
    if (coordinates) {
      form.append("latitude", String(coordinates.latitude));
      form.append("longitude", String(coordinates.longitude));
      form.append("accuracy_m", String(coordinates.accuracy));
    }
    if (vehicle && mode === "open") {
      form.append("license_plate", vehicle.license_plate || "");
      form.append("license_plate_province", vehicle.license_plate_province || "");
    }
    setSaving(true);
    setError("");
    try {
      await AxiosInstance.post(mode === "open" ? "/driver/mileage/open" : `/driver/mileage/${currentMileage!.id}/close`, form);
      await refresh();
      navigate(mode === "open" ? "/recipients" : "/menu", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message || "ไม่สามารถบันทึกข้อมูลไมล์ได้ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="flex flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <b className="text-lg font-bold">สวัสดี {name}</b>
          <span className="text-sm font-medium text-blue-100">{now.toLocaleString("th-TH", { hour12: false })}</span>
        </div>
        <p className="mt-1 text-sm font-medium text-blue-100">คลัง: {driver?.warehouse_name || "ไม่ระบุคลัง"}</p>
      </div>
      {((mode === "open" && isOpen) || (mode === "close" && !isOpen)) && (
        <p className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">{isOpen ? "เปิดไมล์แล้ว สามารถเข้าไปส่งของหรือปิดไมล์ได้" : "ยังไม่ได้เปิดไมล์ กรุณาเปิดไมล์ก่อน"}</p>
      )}
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {mode === "open" ? <SearchableSelect label="ทะเบียนรถ" value={vehicleId} onChange={setVehicleId} options={vehicles.map((vehicle) => ({ value: String(vehicle.id), label: [vehicle.license_plate, vehicle.license_plate_province].filter(Boolean).join(" · ") || `รถ ${vehicle.id}`, searchText: [vehicle.license_plate, vehicle.license_plate_province].filter(Boolean).join(" ") }))} placeholder={vehiclesLoading ? "กำลังโหลดรายการรถ..." : "ค้นหาทะเบียนรถหรือจังหวัด"} disabled={vehiclesLoading || Boolean(vehiclesError)} error={vehiclesError} /> : <div className="grid gap-1.5 text-sm font-bold text-slate-700">ทะเบียนรถ<span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-base font-medium">{[currentMileage?.license_plate, currentMileage?.license_plate_province].filter(Boolean).join(" · ") || "-"}</span></div>}
        <label className="grid gap-1.5 text-sm font-bold text-slate-700"><span>เลขไมล์ (กม.)</span>
          <input type="text" inputMode="numeric" pattern="[0-9]*" value={mileage} onChange={(e) => { if (/^\d*$/.test(e.target.value)) setMileage(e.target.value); }} placeholder="กรอกเลขไมล์จำนวนเต็ม" className="h-12 rounded-xl border border-slate-200 px-3 text-base font-medium outline-none focus:border-blue-500" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid min-w-0 gap-1.5 text-sm font-bold text-slate-700">วันที่<input value={now.toLocaleDateString("th-TH")} readOnly className="h-12 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-medium" /></label>
          <label className="grid min-w-0 gap-1.5 text-sm font-bold text-slate-700">เวลา<input value={now.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })} readOnly className="h-12 min-w-0 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-base font-medium" /></label>
        </div>
        <div className="grid gap-1.5">
          <span className="text-sm font-bold text-slate-700">ตำแหน่งปัจจุบัน</span>
          <div className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 pl-3">
            <MapPin size={19} className="shrink-0 text-slate-500" />
            <span className="min-w-0 flex-1 break-all text-sm font-medium text-slate-700">{currentLocation || "ยังไม่ได้รับตำแหน่ง"}</span>
            <button type="button" onClick={getLocation} className="m-1 flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-blue-100 px-3 text-sm font-bold text-blue-700 active:bg-blue-200"><LocateFixed size={18} />รับตำแหน่ง</button>
          </div>
        </div>
        {locationMessage && <p className="text-sm text-slate-600">{locationMessage}</p>}
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between gap-2 text-base font-bold text-slate-900"><span>รูป{mode === "open" ? "เปิดไมล์" : "ปิดไมล์"} <span className="text-red-500">*</span></span><span className="text-sm text-slate-500">{photos.length}/{maxPhotos}</span></div>
        <div className="mt-3 flex items-stretch gap-2">
          <button type="button" disabled={photos.length >= maxPhotos} onClick={() => { setCameraError(""); setCameraOpen(true); }} className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm disabled:opacity-50">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-100 text-blue-600"><Camera size={25} /></span>
            <span className="min-w-0 flex-1"><b className="block text-[15px] text-slate-900">ถ่ายรูป{mode === "open" ? "เปิดไมล์" : "ปิดไมล์"}</b><span className="text-sm font-medium text-slate-600">เปิดกล้องถ่ายรูป</span></span>
            <ScanLine className="shrink-0 text-blue-600" size={22} />
          </button>
          <label className={`flex w-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 px-2 text-sm font-bold text-white shadow-sm ${photos.length >= maxPhotos ? "opacity-50" : ""}`}><ImagePlus size={18} />อัปโหลด<input type="file" accept="image/*" multiple disabled={photos.length >= maxPhotos} onChange={addPhotos} className="hidden" /></label>
        </div>
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-3 grid grid-cols-3 gap-2">{photos.map((photo) => <div key={photo.url} className="relative aspect-square"><img src={photo.url} alt="รูปไมล์" className="h-full w-full rounded-xl object-cover" /><button type="button" onClick={() => { URL.revokeObjectURL(photo.url); photoUrls.current.delete(photo.url); setPhotos((current) => current.filter((item) => item.url !== photo.url)); }} aria-label="ลบรูป" className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-slate-900/70 text-white"><X size={18} /></button></div>)}</div>
      </div>
      {loadError && <div className="text-sm text-red-600">{loadError} <button type="button" className="font-bold underline" onClick={() => void refresh()}>ลองอีกครั้ง</button></div>}
      <button type="button" onClick={() => setConfirmOpen(true)} disabled={!photos.length || (mode === "open" && !vehicleId) || loading || saving || Boolean(loadError) || (mode === "open" ? isOpen : !isOpen)} className="min-h-12 rounded-2xl bg-blue-600 px-4 text-base font-bold text-white disabled:bg-slate-300">{saving ? "กำลังบันทึก..." : mode === "open" ? "ยืนยันเปิดไมล์" : "ยืนยันปิดไมล์"}</button>
      {isOpen && mode === "open" && <button type="button" onClick={() => navigate("/recipients")} className="min-h-12 rounded-2xl border border-blue-200 bg-blue-50 font-bold text-blue-700">ไปหน้าส่งของ</button>}
      {!isOpen && mode === "close" && <button type="button" onClick={() => navigate("/mileage/open")} className="min-h-12 rounded-2xl border border-blue-200 bg-blue-50 font-bold text-blue-700">ไปหน้าเปิดไมล์</button>}
      {confirmOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 px-5" role="dialog" aria-modal="true" aria-labelledby="mileage-confirm-title">
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
          <h2 id="mileage-confirm-title" className="text-lg font-bold text-slate-900">{mode === "open" ? "เปิดไมล์" : "ปิดไมล์"}</h2>
          <p className="mt-2 text-sm font-medium text-slate-600">{mode === "open" ? "ยืนยันเปิดไมล์" : "ยืนยันปิดไมล์"}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setConfirmOpen(false)} disabled={saving} className="h-12 rounded-xl border border-slate-200 font-bold text-slate-700 disabled:opacity-50">ยกเลิก</button>
            <button type="button" onClick={() => { setConfirmOpen(false); void submit(); }} disabled={saving} className="h-12 rounded-xl bg-blue-600 font-bold text-white disabled:bg-slate-300">ยืนยัน</button>
          </div>
        </div>
      </div>}
      {cameraOpen && <div className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr_auto] bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label="ถ่ายรูปไมล์">
        <div className="flex items-center justify-between p-5"><b>ถ่ายรูป{mode === "open" ? "เปิดไมล์" : "ปิดไมล์"}</b><button type="button" onClick={() => setCameraOpen(false)} aria-label="ปิดกล้อง" className="grid h-10 w-10 place-items-center rounded-full bg-white/15"><X size={22} /></button></div>
        {cameraError ? <p className="self-center px-8 text-center text-amber-300">{cameraError}</p> : <video ref={video} muted playsInline className="h-full min-h-0 w-full object-contain" />}
        <div className="flex justify-center p-6"><button type="button" disabled={Boolean(cameraError)} onClick={capturePhoto} className="rounded-2xl bg-blue-600 px-8 py-3 font-bold text-white disabled:bg-slate-600">ถ่ายรูป</button></div>
      </div>}
    </section>
  );
}
