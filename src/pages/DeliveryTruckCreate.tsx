import { useEffect, useState } from "react";
import { CarFront, Route, Truck } from "lucide-react";
import AxiosInstance from "../services/http";
import { useDriverAuth } from "../context/AuthContext";
import type { Navigate } from "../types/driver";

type DriverType = "EMPLOYEE" | "CONTRACTOR";
type RouteOption = { route_id: number; route_code?: string | null; route_name?: string | null };
type Vehicle = { id: number; license_plate: string; license_plate_province?: string | null; model?: string | null };
type ContractorVehicle = { vehicle_contractor_id: number; license_plate: string; license_plate_province?: string | null; model?: string | null };

export default function DeliveryTruckCreate({ go }: { go: Navigate }) {
  const { driver } = useDriverAuth();
  const [driverType, setDriverType] = useState<DriverType>();
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [contractorVehicle, setContractorVehicle] = useState<ContractorVehicle | null>(null);
  const [route, setRoute] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoading(true);
        const { data } = await AxiosInstance.get<{
          data?: { driver_type?: DriverType; routes?: RouteOption[]; vehicles?: Vehicle[]; contractor_vehicle?: ContractorVehicle | null };
        }>("/driver/delivery-trucks/options");
        setDriverType(data?.data?.driver_type || "EMPLOYEE");
        setRoutes(data?.data?.routes || []);
        setVehicles(data?.data?.vehicles || []);
        setContractorVehicle(data?.data?.contractor_vehicle || null);
      } catch (exception: any) {
        setError(exception.response?.data?.message || "โหลดข้อมูลสำหรับสร้างใบรถไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };

    void loadOptions();
  }, []);

  const create = async () => {
    if (!route) return setError("กรุณาเลือกสายรถ");
    if (driverType === "EMPLOYEE" && !vehicle) return setError("กรุณาเลือกรถ");

    try {
      setSaving(true);
      setError("");
      const { data } = await AxiosInstance.post("/driver/delivery-trucks", {
        route_id: Number(route),
        vehicle_id: driverType === "EMPLOYEE" ? Number(vehicle) : null,
      });
      go("DELIVERY_SCAN", data?.data?.truck_load_id);
    } catch (exception: any) {
      setError(exception.response?.data?.message || "สร้างใบรถกระจายไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const driverName = [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || driver?.username;
  const contractorVehicleName =
    contractorVehicle &&
    [contractorVehicle.license_plate, contractorVehicle.license_plate_province, contractorVehicle.model].filter(Boolean).join(" · ");

  return (
    <section className="flex w-full flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">สร้างใบรถกระจาย</h1>
      </div>
      <div className="grid gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <small className="text-[13px] font-semibold text-slate-600">คนขับ</small>
        <b className="flex items-center gap-2 text-base font-bold text-slate-900">
          <Truck size={17} />
          {driverName}
        </b>
        <small className="text-[13px] font-medium text-slate-600">{driverType === "CONTRACTOR" ? "รถเสริม (Contractor)" : "พนักงานประจำ"}</small>
      </div>
      {loading ? (
        <p className="rounded-xl bg-slate-50 p-4 text-center text-[15px] font-medium text-slate-500">กำลังโหลดข้อมูล...</p>
      ) : (
        <>
          {driverType === "EMPLOYEE" ? (
            <label className="grid gap-2 text-[15px] font-bold text-slate-700">
              <span>
                รถ <em className="text-red-500">*</em>
              </span>
              <select className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" value={vehicle} onChange={(event) => setVehicle(event.target.value)}>
                <option value="">เลือกรถ</option>
                {vehicles.map((item) => (
                  <option key={item.id} value={item.id}>
                    {[item.license_plate, item.license_plate_province, item.model].filter(Boolean).join(" · ")}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <div className="grid gap-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <small className="text-[13px] font-semibold text-slate-600">รถที่ผูกกับคนขับ</small>
              <b className="flex items-center gap-2 text-base font-bold text-slate-900">
                <CarFront size={17} />
                {contractorVehicleName || "ไม่พบข้อมูลรถ"}
              </b>
            </div>
          )}
          <label className="grid gap-2 text-[15px] font-bold text-slate-700">
            <span>
              สายรถ <em className="text-red-500">*</em>
            </span>
            <select className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" value={route} onChange={(event) => setRoute(event.target.value)}>
              <option value="">เลือกสายรถ</option>
              {routes.map((item) => (
                <option key={item.route_id} value={item.route_id}>
                  {[item.route_code, item.route_name].filter(Boolean).join(" - ")}
                </option>
              ))}
            </select>
          </label>
          <p className="flex gap-2 rounded-xl bg-blue-50 p-3 text-[15px] font-medium leading-5 text-blue-800">
            <Route size={17} />
            {driverType === "CONTRACTOR" ? "รถของ contractor ถูกผูกไว้แล้ว จึงเลือกเฉพาะสายรถ" : "กรุณาเลือกรถและสายรถก่อนเริ่มสแกนสินค้า"}
          </p>
        </>
      )}
      {error ? <p className="rounded-xl bg-red-50 p-3 text-[15px] font-medium text-red-700">{error}</p> : null}
      <button className="h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-600 text-[15px] font-bold text-white shadow-lg shadow-blue-600/20 disabled:bg-slate-300 disabled:shadow-none" onClick={() => void create()} disabled={loading || saving || !driverType}>
        {saving ? "กำลังสร้าง..." : "สร้างและเริ่มสแกน"}
      </button>
    </section>
  );
}
