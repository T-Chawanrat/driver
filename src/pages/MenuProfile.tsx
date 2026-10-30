import { UserRound } from "lucide-react";
import { useDriverAuth } from "../context/AuthContext";

export default function MenuProfile() {
  const { driver } = useDriverAuth();
  const name = [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || "ยังไม่มีข้อมูล";
  const fields = [
    { label: "ชื่อผู้ใช้", value: driver?.username },
    { label: "คลังที่สังกัด", value: driver?.warehouse_name },
    {
      label: "ประเภทพนักงาน",
      value: driver?.employment_type === "EMPLOYEE" ? "พนักงาน" : driver?.employment_type === "CONTRACTOR" ? "รถเสริม" : null,
    },
    { label: "เลขใบอนุญาตขับขี่", value: driver?.license_no },
  ];
  return (
    <section className="flex flex-col gap-5 px-4 pb-24 pt-5 sm:px-6">
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
          <UserRound size={25} />
        </span>
        <div>
          <p className="text-sm font-medium text-blue-100">พนักงานขับรถ</p>
          <h1 className="break-words text-lg font-bold">{name}</h1>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-100 py-4 last:border-0">
            <span className="text-[15px] font-semibold text-slate-500">{label}</span>
            <span className="break-words text-[15px] font-bold text-slate-900">{value || "ยังไม่มีข้อมูล"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
