import { ChevronRight, CircleAlert, PackageCheck, Truck } from "lucide-react";
import { useDriverAuth } from "../context/AuthContext";
import type { Navigate } from "../types/driver";

type TaskMenuItem = {
  screen: "JOBS" | "DELIVERIES" | "ISSUES";
  title: string;
  description: string;
  Icon: typeof Truck;
  tone?: "warning";
};

const menuItems: TaskMenuItem[] = [
  { screen: "JOBS", title: "รับงาน / ขึ้นรถ", description: "สร้าง DT และสแกนของขึ้นรถ", Icon: PackageCheck },
  { screen: "DELIVERIES", title: "ไปส่งลูกค้า", description: "ดูรายการสินค้าและผู้รับ", Icon: Truck },
  { screen: "ISSUES", title: "ปัญหาการจัดส่ง", description: "แจ้งปัญหา แชทกับทีมควบคุม", Icon: CircleAlert, tone: "warning" },
];

export default function TaskMenu({ go }: { go: Navigate }) {
  const { driver } = useDriverAuth();
  const name = [driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || driver?.username || "พนักงาน";

  return (
    <section className="flex w-full flex-col gap-6 px-4 pb-24 pt-5 sm:px-6">
      <header className="border-b border-slate-200 pb-5">
        <small className="text-[15px] font-semibold text-slate-600">สวัสดี</small>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{name}</h1>
      </header>
      <div className="grid gap-3">
        {menuItems.map(({ screen, title, description, Icon, tone }, index) => (
          <button
            key={screen}
            className={`grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:scale-[.99] ${tone === "warning" ? "" : ""}`}
            type="button"
            onClick={() => go(screen)}
          >
            <span
              className={`grid h-11 w-11 place-items-center rounded-xl text-lg font-bold ${tone === "warning" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"}`}
            >
              {index + 1}
            </span>
            <span className="grid gap-1">
              <b className="text-base font-bold text-slate-900">{title}</b>
              <small className="text-[15px] font-medium text-slate-600">{description}</small>
            </span>
            <ChevronRight className="text-slate-400" size={23} aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  );
}
