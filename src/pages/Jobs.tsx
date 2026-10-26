import { useEffect, useState } from "react";
import { FilePlus2, Truck } from "lucide-react";
import AxiosInstance from "../services/http";
import type { Navigate } from "../types/driver";

type DriverTruck = {
  truck_load_id: number;
  truck_code: string;
  status: "DC_TRUCK" | "DC_TRUCK_DC";
  is_close?: "Y" | "N" | null;
  license_plate?: string | null;
  license_plate_province?: string | null;
  route_code?: string | null;
  route_name?: string | null;
  count_box?: number;
};

export default function Jobs({ go }: { go: Navigate }) {
  const [trucks, setTrucks] = useState<DriverTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await AxiosInstance.get<{ data?: DriverTruck[] }>("/driver/trucks");
      setTrucks((data?.data || []).filter((truck) => truck.is_close !== "Y"));
    } catch (exception: any) {
      setError(exception.response?.data?.message || "โหลดรายการงานไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadJobs();
  }, []);

  return (
    <section className="flex h-[calc(100dvh-130px)] w-full flex-col gap-4 px-4 pt-5 sm:px-6">
      <button
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-base font-extrabold text-white shadow-lg shadow-blue-600/20"
        onClick={() => go("DELIVERY_CREATE")}
      >
        <FilePlus2 size={18} />
        สร้างใบรถกระจาย
      </button>
      <h2 className="text-lg font-bold text-slate-900">งานของฉัน ({trucks.length})</h2>
      {loading ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-[15px] font-medium text-slate-500">กำลังโหลดรายการงาน...</p>
      ) : error ? (
        <p className="rounded-xl bg-red-50 p-3 text-[15px] font-medium text-red-700">{error}</p>
      ) : trucks.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-[15px] font-medium text-slate-500">ยังไม่มีใบรถของคุณ</p>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-5">
          <div className="grid gap-4">
        {trucks.map((truck) => {
          const isTruckload = truck.status === "DC_TRUCK_DC";
          const details = isTruckload
            ? "ใบปิดบรรทุก · รอรับลงคลังปลายทาง"
            : [truck.route_code, truck.route_name].filter(Boolean).join(" - ") || "ยังไม่ได้ระบุสายรถ";
          const content = (
            <>
              <span className="grid gap-1 text-left">
                <span
                  className={`w-max rounded-full px-2 py-0.5 text-[11px] font-bold ${isTruckload ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}
                >
                  {isTruckload ? "TK · ใบปิดบรรทุก" : "DT · ใบรถกระจาย"}
                </span>
                <b className="text-base text-slate-900">{truck.truck_code}</b>
                <small className="flex items-center gap-1 text-[13px] font-semibold text-slate-600">
                  <Truck size={14} />
                  {[truck.license_plate, truck.license_plate_province].filter(Boolean).join(" ") || "ยังไม่ได้ระบุรถ"}
                </small>
                <small className="text-[13px] font-medium text-slate-600">{details}</small>
              </span>
              <b className="whitespace-nowrap text-[15px] font-bold text-blue-700">{truck.count_box || 0} SN</b>
            </>
          );
          return isTruckload ? (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" key={truck.truck_load_id}>
              {content}
            </div>
          ) : (
            <button
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm active:scale-[.99]"
              key={truck.truck_load_id}
              onClick={() => go("DELIVERY_SCAN", truck.truck_load_id)}
            >
              {content}
            </button>
          );
        })}
          </div>
        </div>
      )}
    </section>
  );
}
