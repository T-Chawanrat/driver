import { useState } from "react";
import { ChevronRight, Gauge, Headset, History, LogOut, UserRound } from "lucide-react";
import { useDriverAuth } from "../context/AuthContext";
import type { Navigate } from "../types/driver";

export default function Menu({ go }: { go: Navigate }) {
  const { driver, logout } = useDriverAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const name = [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || driver?.username || "พนักงานขับรถ";
  const items = [
    { screen: "MILEAGE_OPEN", label: "เปิดไมล์", description: "บันทึกก่อนเริ่มส่งของ", Icon: Gauge },
    { screen: "MILEAGE_CLOSE", label: "ปิดไมล์", description: "บันทึกเมื่อจบรอบส่งของ", Icon: Gauge },
    { screen: "PROFILE", label: "ข้อมูลผู้ขับ", description: "ข้อมูลบัญชีและคลังที่สังกัด", Icon: UserRound },
    { screen: "JOB_HISTORY", label: "ประวัติงาน", description: "ดูรายการงานที่เสร็จสิ้น", Icon: History },
    { screen: "CONTACT", label: "ติดต่อผู้ดูแล", description: "ช่องทางติดต่อเมื่อมีปัญหา", Icon: Headset },
  ] as const;

  return (
    <section className="flex flex-col gap-5 px-4 pb-24 pt-5 sm:px-6">
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20"><UserRound size={25} /></span>
        <div className="min-w-0"><p className="break-words text-lg font-bold">{name}</p><p className="text-sm font-medium text-blue-100">{driver?.warehouse_name || "พนักงานขับรถ"}</p></div>
      </div>
      <div className="grid gap-3">
        {items.map(({ screen, label, description, Icon }) => (
          <button key={screen} type="button" onClick={() => go(screen)} className="flex min-h-20 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:bg-slate-50">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Icon size={22} /></span>
            <span className="min-w-0 flex-1"><span className="block text-base font-bold text-slate-900">{label}</span><span className="mt-1 block text-sm font-medium text-slate-500">{description}</span></span>
            <ChevronRight size={20} className="shrink-0 text-slate-400" />
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setConfirmLogout(true)} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 text-base font-bold text-red-600 active:bg-red-100"><LogOut size={20} />ออกจากระบบ</button>
      {confirmLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4" role="dialog" aria-modal="true" aria-labelledby="logout-title">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h2 id="logout-title" className="text-lg font-bold text-slate-900">ออกจากระบบ?</h2>
            <p className="mt-2 text-sm font-medium text-slate-600">คุณต้องการออกจากระบบใช่ไหม</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setConfirmLogout(false)} className="h-12 rounded-xl border border-slate-200 bg-white text-base font-bold text-slate-700">ยกเลิก</button>
              <button type="button" onClick={logout} className="h-12 rounded-xl bg-red-600 text-base font-bold text-white">ออกจากระบบ</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
