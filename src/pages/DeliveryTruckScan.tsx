import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ScanLine, Search, X } from "lucide-react";
import AxiosInstance from "../services/http";
import { createScanner, openCamera } from "../utils/scanner";

type ScanItem = { serial_id?: string; serial_no?: string };
type RouteWarning = { serialNo: string; routeMissing: boolean };

export default function DeliveryTruckScan({ id, onBack, onClose }: { id?: number; onBack: () => void; onClose: () => void }) {
  const [serial, setSerial] = useState("");
  const [pending, setPending] = useState<ScanItem[]>([]);
  const [loaded, setLoaded] = useState<ScanItem[]>([]);
  const [activeList, setActiveList] = useState<"loaded" | "pending">("loaded");
  const [scanMode, setScanMode] = useState<"LOAD" | "UNLOAD">("LOAD");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [routeWarning, setRouteWarning] = useState<RouteWarning | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const base = "/driver/delivery-trucks";
  const title = "สแกนขึ้นรถกระจาย";

  const load = async () => {
    if (!id) return;
    try {
      const { data } = await AxiosInstance.get(`${base}/${id}/products`);
      setPending(data?.data || []);
      setLoaded(data?.loaded || []);
    } catch {
      setError("โหลดรายการสินค้าไม่สำเร็จ");
    }
  };

  const stopCamera = () => {
    setCameraOpen(false);
  };

  useEffect(() => {
    void load();
  }, [id]);

  const submitSerial = async (serialNo: string, confirmRouteWarning = false) => {
    const trimmedSerial = serialNo.trim();
    if (!trimmedSerial || !id || saving) return;

    try {
      setSaving(true);
      setError("");
      await AxiosInstance.post(`${base}/${id}/${scanMode === "LOAD" ? "load-product" : "unload-product"}`, {
        serial_no: trimmedSerial,
        ...(scanMode === "LOAD" ? { confirm_route_warning: confirmRouteWarning } : {}),
      });
      setSerial("");
      await load();
      input.current?.focus();
    } catch (exception: any) {
      const warning = exception.response?.data;
      if (scanMode === "LOAD" && (warning?.code === "ROUTE_MISSING" || warning?.code === "ROUTE_MISMATCH")) {
        setRouteWarning({ serialNo: warning.data?.serial_no || trimmedSerial, routeMissing: warning.code === "ROUTE_MISSING" });
        return;
      }
      setError(warning?.message || (scanMode === "LOAD" ? "ไม่สามารถยิง SN ขึ้นรถได้" : "ไม่สามารถยิงลบ SN ออกจากรถได้"));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!cameraOpen) return;
    let cancelled = false;
    let stream: MediaStream | undefined;
    let stopScanning: (() => void) | undefined;
    const start = async () => {
      try {
        const cameraStream = await openCamera("scan");
        if (cancelled) { cameraStream.getTracks().forEach((track) => track.stop()); return; }
        stream = cameraStream;
        if (!video.current) return;
        video.current.srcObject = cameraStream;
        await video.current.play();
        const stop = await createScanner(video.current, (value) => {
          if (cancelled) return;
          cancelled = true;
          stopCamera();
          void submitSerial(value);
        });
        if (cancelled) stop(); else stopScanning = stop;
      } catch {
        stream?.getTracks().forEach((track) => track.stop());
        if (!cancelled) setCameraError("ไม่สามารถเปิดกล้องได้ กรุณาตรวจสอบ HTTPS และสิทธิ์กล้อง แล้วลองใหม่");
      }
    };
    void start();
    return () => { cancelled = true; stopScanning?.(); stream?.getTracks().forEach((track) => track.stop()); };
  }, [cameraOpen]);

  const startCamera = () => {
    setCameraError("");
    setCameraOpen(true);
  };

  return (
    <>
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <button
          className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600"
          type="button"
          onClick={onBack}
          aria-label="ย้อนกลับ"
        >
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <b className="text-base font-bold text-slate-900">{title}</b>
        <span className="w-9" />
      </header>
      {!id ? (
        <section className="w-full px-4 pt-5 sm:px-6">
          <p className="rounded-xl bg-slate-50 p-4 text-center text-[15px] font-medium text-slate-500">กรุณาสร้างหรือเลือกใบรถก่อนเริ่มสแกน</p>
        </section>
      ) : (
        <section className="flex w-full flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
          <div className="flex items-center justify-between rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
            <div className="grid gap-1">
              <small className="text-sm font-semibold text-blue-100">ใบรถกระจาย</small>
              <b className="text-lg font-bold">สแกนขึ้นรถแล้ว</b>
            </div>
            <strong className="text-4xl">
              {loaded.length}
              <small> SN</small>
            </strong>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist" aria-label="โหมดยิงสินค้า">
            <button
              type="button"
              className={`h-11 rounded-xl text-[15px] font-bold ${scanMode === "LOAD" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}
              onClick={() => setScanMode("LOAD")}
            >
              ยิงขึ้นรถ
            </button>
            <button
              type="button"
              className={`h-11 rounded-xl text-[15px] font-bold ${scanMode === "UNLOAD" ? "bg-white text-orange-700 shadow-sm" : "text-slate-500"}`}
              onClick={() => setScanMode("UNLOAD")}
            >
              ยิงลบ
            </button>
          </div>
          <form
            className={`flex min-h-[76px] items-center gap-2 rounded-3xl border bg-white p-2 shadow-sm ${scanMode === "LOAD" ? "border-blue-100" : "border-orange-100"}`}
            onSubmit={(event) => {
              event.preventDefault();
              void submitSerial(serial);
            }}
          >
            <input
              className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] font-medium outline-none"
              ref={input}
              autoFocus
              value={serial}
              onChange={(event) => setSerial(event.target.value)}
              placeholder={scanMode === "LOAD" ? "ยิงหรือพิมพ์ Serial No" : "ยิงลบหรือพิมพ์ Serial No"}
            />
            <button
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold text-white disabled:bg-slate-300 ${scanMode === "LOAD" ? "bg-blue-600" : "bg-orange-600"}`}
              disabled={saving}
              aria-label={scanMode === "LOAD" ? "ยิง SN ขึ้นรถ" : "ยิงลบ SN"}
            >
              <Search size={25} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={() => void startCamera()}
              aria-label={scanMode === "LOAD" ? "เปิดกล้องเพื่อยิงขึ้นรถ" : "เปิดกล้องเพื่อยิงลบ"}
              className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl ${scanMode === "LOAD" ? "bg-blue-100 text-blue-700 active:bg-blue-200" : "bg-orange-100 text-orange-700 active:bg-orange-200"}`}
            >
              <ScanLine size={27} strokeWidth={2.2} />
            </button>
          </form>
          <button
            className="h-12 rounded-2xl border border-blue-200 bg-blue-50 text-[15px] font-bold text-blue-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
            type="button"
            onClick={onClose}
            disabled={!loaded.length || saving}
          >
            ปิดบรรทุกและออกนำจ่าย
          </button>
          {error ? <p className="rounded-xl bg-red-50 p-3 text-[15px] font-medium text-red-700">{error}</p> : null}
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeList === "loaded"}
              className={`h-11 rounded-xl text-[15px] font-bold ${activeList === "loaded" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}
              onClick={() => setActiveList("loaded")}
            >
              บนรถแล้ว <b>{loaded.length}</b>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeList === "pending"}
              className={`h-11 rounded-xl text-[15px] font-bold ${activeList === "pending" ? "bg-white text-orange-700 shadow-sm" : "text-slate-500"}`}
              onClick={() => setActiveList("pending")}
            >
              รอยิง <b>{pending.length}</b>
            </button>
          </div>
          {activeList === "loaded" ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">SN บนรถแล้ว</h2>
                <span className="text-[15px] font-semibold text-slate-600">{loaded.length} SN</span>
              </div>
              {loaded.length ? (
                loaded.map((item, index) => (
                  <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 text-[15px] font-semibold text-emerald-700" key={item.serial_id || item.serial_no || index}>
                    <CheckCircle2 size={18} />
                    <code>{item.serial_no}</code>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-[15px] font-medium text-slate-400">ยังไม่มีสินค้าในใบนี้</p>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900">SN รอยิง</h2>
                <span className="text-[15px] font-semibold text-slate-600">{pending.length} SN</span>
              </div>
              {pending.length ? (
                pending.map((item, index) => (
                  <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] font-semibold text-slate-700" key={item.serial_id || item.serial_no || index}>
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    <code>{item.serial_no}</code>
                  </div>
                ))
              ) : (
                <p className="rounded-xl bg-slate-50 p-4 text-center text-[15px] font-medium text-slate-400">ไม่มีรายการที่รอยิง</p>
              )}
            </>
          )}
        </section>
      )}
      {cameraOpen && (
        <div className="fixed inset-0 z-[60] grid grid-rows-[auto_1fr] bg-slate-950 text-white" role="dialog" aria-modal="true" aria-label="สแกนบาร์โค้ดด้วยกล้อง">
          <div className="flex items-center justify-between p-5">
            <b className="text-base font-bold">สแกนบาร์โค้ด</b>
            <button className="grid h-10 w-10 place-items-center rounded-full bg-white/15" type="button" onClick={stopCamera} aria-label="ปิดกล้อง">
              <X size={22} />
            </button>
          </div>
          {cameraError ? (
            <div className="grid place-content-center justify-items-center gap-4 p-8 text-center text-amber-300">
              <AlertTriangle size={28} />
              <p className="max-w-xs text-sm leading-6 text-slate-200">{cameraError}</p>
              <button className="rounded-xl bg-blue-600 px-5 py-3 text-[15px] font-bold text-white" type="button" onClick={stopCamera}>
                กลับไปยิง SN
              </button>
            </div>
          ) : (
            <div className="relative grid place-items-center overflow-hidden">
              <video className="h-full w-full object-cover" ref={video} autoPlay playsInline muted />
              <div className="absolute h-52 w-[min(78vw,330px)] rounded-3xl border-2 border-white shadow-[0_0_0_999px_rgb(15_23_42_/_0.12)]" />
              <p className="absolute bottom-8 text-sm font-semibold">จัดบาร์โค้ดให้อยู่ในกรอบ</p>
            </div>
          )}
        </div>
      )}
      {routeWarning && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-5" role="presentation">
          <section className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="route-warning-title">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-700">
                <AlertTriangle size={23} />
              </span>
              <div>
                <h2 className="text-lg font-bold text-amber-700" id="route-warning-title">{routeWarning.routeMissing ? "สินค้ายังไม่มีสายรถ" : "สายรถไม่ตรงกัน"}</h2>
              </div>
            </div>
            <p className="my-4 text-sm leading-6 text-slate-600">
              {routeWarning.routeMissing
                ? "สินค้านี้ยังไม่ได้กำหนดสายรถ ต้องการยิงขึ้นรถต่อหรือไม่"
                : "SN นี้อยู่คนละสายรถกับใบรถกระจายที่เลือก ต้องการยิงขึ้นรถต่อหรือไม่"}
            </p>
            <div className="grid gap-1 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800">
              <span>Serial No</span>
              <strong className="font-mono text-sm">{routeWarning.serialNo}</strong>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                className="h-12 rounded-xl border border-slate-200 bg-white text-[15px] font-bold text-slate-700"
                type="button"
                onClick={() => {
                  const current = routeWarning;
                  setRouteWarning(null);
                  void submitSerial(current.serialNo, true);
                }}
                disabled={saving}
              >
                {saving ? "กำลังยิง..." : "ใช่"}
              </button>
              <button
                className="h-12 rounded-xl bg-orange-600 text-[15px] font-bold text-white disabled:bg-orange-300"
                type="button"
                onClick={() => {
                  setRouteWarning(null);
                  setSerial("");
                  input.current?.focus();
                }}
                disabled={saving}
              >
                ไม่
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
