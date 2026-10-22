import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Camera, MapPin, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDriverAuth } from "../context/AuthContext";
import { mileageIsOpen, setMileageOpen } from "../utils/mileageMock";

type Photo = { file: File; url: string };

export default function MileageForm({ mode }: { mode: "open" | "close" }) {
  const { driver } = useDriverAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [plate, setPlate] = useState("");
  const [province, setProvince] = useState("");
  const [mileage, setMileage] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState("");
  const photoUrls = useRef(new Set<string>());
  const maxPhotos = mode === "open" ? 2 : 5;
  const isOpen = mileageIsOpen(driver?.id);
  const name = [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || driver?.username || "พนักงานขับรถ";

  useEffect(() => () => { photoUrls.current.forEach((url) => URL.revokeObjectURL(url)); }, []);

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
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

  const getLocation = () => {
    if (!navigator.geolocation) return setLocation("อุปกรณ์นี้ไม่รองรับตำแหน่ง");
    setLocation("กำลังค้นหาตำแหน่ง...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setLocation(`${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`),
      () => setLocation("ไม่สามารถรับตำแหน่งได้"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const submit = () => {
    if (!driver?.id || !photos.length) return;
    setMileageOpen(driver.id, mode === "open");
    navigate(mode === "open" ? "/deliveries" : "/menu", { replace: true });
  };

  return (
    <section className="flex flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">หน้านี้เป็นตัวอย่าง ข้อมูลและรูปยังไม่ได้บันทึกลงระบบ สถานะเปิดไมล์ใช้ทดสอบเฉพาะแท็บนี้</div>
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white">
        <p className="text-sm font-semibold text-blue-100">ผู้ขับรถ</p><h1 className="mt-1 text-lg font-bold">{name}</h1>
        <p className="mt-2 text-sm font-medium text-blue-100">วันที่และเวลา: {new Date().toLocaleString("th-TH")}</p>
      </div>
      {((mode === "open" && isOpen) || (mode === "close" && !isOpen)) && (
        <p className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">{isOpen ? "เปิดไมล์แล้ว สามารถเข้าไปส่งของหรือปิดไมล์ได้" : "ยังไม่ได้เปิดไมล์ กรุณาเปิดไมล์ก่อน"}</p>
      )}
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">เลขไมล์ (กม.)<input type="number" min="0" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="กรอกเลขไมล์" className="h-12 rounded-xl border border-slate-200 px-3 text-base font-medium outline-none focus:border-blue-500" /></label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">ทะเบียนรถ<input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="กรอกทะเบียนรถ" className="h-12 rounded-xl border border-slate-200 px-3 text-base font-medium outline-none focus:border-blue-500" /></label>
        <label className="grid gap-1.5 text-sm font-bold text-slate-700">จังหวัดทะเบียนรถ<input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="กรอกจังหวัดทะเบียนรถ" className="h-12 rounded-xl border border-slate-200 px-3 text-base font-medium outline-none focus:border-blue-500" /></label>
        <button type="button" onClick={getLocation} className="flex min-h-12 items-center gap-2 rounded-xl bg-blue-50 px-3 text-left text-sm font-bold text-blue-700"><MapPin size={19} />{location || "รับตำแหน่งปัจจุบัน"}</button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex justify-between gap-2 text-base font-bold text-slate-900"><span>รูป{mode === "open" ? "เปิดไมล์" : "ปิดไมล์"} <span className="text-red-500">*</span></span><span className="text-sm text-slate-500">{photos.length}/{maxPhotos}</span></div>
        <label className="mt-3 flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-blue-200 bg-blue-50 px-4 font-bold text-blue-700"><Camera size={24} /> ถ่ายรูปหรือเลือกรูป<input type="file" accept="image/*" multiple onChange={addPhotos} className="hidden" /></label>
        {error && <p role="alert" className="mt-2 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-3 grid grid-cols-3 gap-2">{photos.map((photo) => <div key={photo.url} className="relative aspect-square"><img src={photo.url} alt="รูปไมล์" className="h-full w-full rounded-xl object-cover" /><button type="button" onClick={() => { URL.revokeObjectURL(photo.url); photoUrls.current.delete(photo.url); setPhotos((current) => current.filter((item) => item.url !== photo.url)); }} aria-label="ลบรูป" className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-slate-900/70 text-white"><X size={18} /></button></div>)}</div>
      </div>
      <button type="button" onClick={submit} disabled={!photos.length || (mode === "open" ? isOpen : !isOpen)} className="min-h-12 rounded-2xl bg-blue-600 px-4 text-base font-bold text-white disabled:bg-slate-300">{mode === "open" ? "ยืนยันเปิดไมล์" : "ยืนยันปิดไมล์"}</button>
      {isOpen && mode === "open" && <button type="button" onClick={() => navigate("/deliveries")} className="min-h-12 rounded-2xl border border-blue-200 bg-blue-50 font-bold text-blue-700">ไปหน้าส่งของ</button>}
      {!isOpen && mode === "close" && <button type="button" onClick={() => navigate("/mileage/open")} className="min-h-12 rounded-2xl border border-blue-200 bg-blue-50 font-bold text-blue-700">ไปหน้าเปิดไมล์</button>}
    </section>
  );
}
