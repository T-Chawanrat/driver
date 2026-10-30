import type { ReactNode } from "react";
import { Box, ChevronLeft, House, Menu, TriangleAlert, Truck } from "lucide-react";
import type { DriverScreen, Navigate } from "../types/driver";

type DriverLayoutProps = { children: ReactNode; go: Navigate; onBack: () => void; screen: DriverScreen };

function pageTitle(screen: DriverScreen) {
  if (screen === "HOME") return "TMS Driver";
  if (screen === "JOBS") return "งานของฉัน";
  if (screen === "DELIVERIES") return "ส่งของ";
  if (screen === "CLOSE") return "ปิดบรรทุกและออกนำจ่าย";
  if (screen === "RECIPIENT_CLOSE") return "ปิดงานจัดส่ง";
  if (screen === "MENU") return "เมนู";
  if (screen === "PROFILE") return "ข้อมูลผู้ขับ";
  if (screen === "JOB_HISTORY") return "ประวัติงาน";
  if (screen === "CONTACT") return "ติดต่อผู้ดูแล";
  if (screen === "MILEAGE_OPEN") return "เปิดไมล์";
  if (screen === "MILEAGE_CLOSE") return "ปิดไมล์";
  return "ใบรถกระจาย";
}

export default function DriverLayout({ children, go, onBack, screen }: DriverLayoutProps) {
  const showTopbar = screen !== "DELIVERY_SCAN" && screen !== "ISSUES";
  const isTaskScreen = ["JOBS", "DELIVERY_CREATE", "DELIVERY_SCAN"].includes(screen);
  const isDeliveryScreen = ["DELIVERIES", "RECIPIENT_CLOSE"].includes(screen);
  const isIssueScreen = screen === "ISSUES";

  return (
    <main className="relative mx-auto min-h-dvh w-full max-w-[760px] bg-slate-50 pb-[72px]">
      {showTopbar && (
        <header className="sticky top-0 z-40 grid h-[58px] grid-cols-[38px_1fr_38px] items-center border-b border-slate-200 bg-white px-3.5">
          {screen === "HOME" ? (
            <span className="h-9 w-9" />
          ) : (
            <button
              className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600 active:bg-blue-100"
              type="button"
              onClick={onBack}
              aria-label="ย้อนกลับ"
            >
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
          )}
          <b className="text-center text-[17px] font-bold text-slate-900">{pageTitle(screen)}</b>
          <span className="h-9 w-9" />
        </header>
      )}
      <div className="mx-auto w-full max-w-[760px]">{children}</div>
      <nav className="fixed bottom-0 left-1/2 z-40 grid h-[72px] w-full max-w-[760px] -translate-x-1/2 grid-cols-5 border-t border-slate-200 bg-white px-1 pt-1.5 shadow-[0_-3px_14px_rgb(15_23_42_/_0.06)]">
        <button
          className={`grid content-center justify-items-center gap-1 text-[11px] font-semibold ${screen === "HOME" ? "text-blue-600" : "text-slate-500"}`}
          onClick={() => go("HOME")}
        >
          <House size={30} />
          <span>หน้าหลัก</span>
        </button>
        <button
          className={`grid content-center justify-items-center gap-1 text-[11px] font-semibold ${isTaskScreen ? "text-blue-600" : "text-slate-500"}`}
          onClick={() => go("JOBS")}
        >
          <Box size={30} />
          <span>รับงาน</span>
        </button>
        <button
          className={`grid content-center justify-items-center gap-1 text-[11px] font-semibold ${isDeliveryScreen ? "text-blue-600" : "text-slate-500"}`}
          onClick={() => go("DELIVERIES")}
        >
          <Truck size={30} />
          <span>ส่งของ</span>
        </button>
        <button
          type="button"
          onClick={() => go("ISSUES")}
          className={`grid content-center justify-items-center gap-1 text-[11px] font-semibold ${isIssueScreen ? "text-blue-600" : "text-slate-500"}`}
        >
          <TriangleAlert size={30} />
          <span>ปัญหา</span>
        </button>
        <button
          className={`grid content-center justify-items-center gap-1 text-[11px] font-semibold ${["MENU", "PROFILE", "JOB_HISTORY", "CONTACT"].includes(screen) ? "text-blue-600" : "text-slate-500"}`}
          type="button"
          onClick={() => go("MENU")}
          aria-label="เมนู"
        >
          <Menu size={30} />
          <span>เมนู</span>
        </button>
      </nav>
    </main>
  );
}
