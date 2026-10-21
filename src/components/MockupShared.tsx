import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Navigate } from "../types/driver";

export function MockupHeader({ title, go }: { title: string; go: Navigate }) {
  return (
    <header className="grid h-[58px] grid-cols-[38px_1fr_38px] items-center border-b border-slate-200 bg-white px-3.5">
      <button
        className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600 active:bg-blue-100"
        type="button"
        onClick={() => go("HOME")}
        aria-label="กลับ"
      >
        <ChevronLeft size={24} strokeWidth={3} />
      </button>
      <b className="text-center text-base font-bold text-slate-900">{title}</b>
      <span />
    </header>
  );
}

export function MockupBill({ go, action = "MOCKUP_RECIPIENT_CLOSE" }: { go?: Navigate; action?: Parameters<Navigate>[0] }) {
  const body = (
    <>
      <div>
        <strong className="text-sm font-bold text-blue-700">DOA000021202609300001</strong>
        <p className="mt-1 text-[15px] font-semibold text-slate-800">บริษัท ไทยเทค จำกัด</p>
      </div>
      <ChevronRight className="text-slate-400" size={19} />
      <footer className="col-span-2 flex justify-between border-t border-slate-100 pt-2.5 text-xs font-medium text-slate-500">
        <span>3 SN</span>
        <span>ปลายทาง: บางนา</span>
      </footer>
    </>
  );
  const className = "grid w-full grid-cols-[1fr_auto] gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm";
  return go ? (
    <button type="button" className={className} onClick={() => go(action)}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
