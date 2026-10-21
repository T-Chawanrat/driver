import { Send, TriangleAlert } from "lucide-react";
import { useState } from "react";
import type { Navigate } from "../types/driver";
import { MockupHeader } from "../components/MockupShared";
export default function Chat({ go }: { go: Navigate }) {
  const [draft, setDraft] = useState("");
  const [items, setItems] = useState(["รับเรื่องแล้วค่ะ รบกวนรอการติดต่อกลับ"]);
  const send = () => {
    if (draft.trim()) {
      setItems((x) => [...x, draft.trim()]);
      setDraft("");
    }
  };
  return (
    <>
      <MockupHeader title="ปัญหาการจัดส่ง" go={go} />
      <section className="grid min-h-[calc(100dvh-130px)] w-full grid-rows-[auto_1fr_auto] bg-slate-50">
        <div className="flex items-center gap-3 border-b border-slate-200 bg-white p-4">
          <TriangleAlert className="text-orange-500" size={20} />
          <span className="grid flex-1 gap-0.5">
            <b className="text-base font-bold text-slate-900">ติดต่อผู้รับไม่ได้</b>
            <small className="text-[13px] font-medium text-slate-500">DOA000021202609300001</small>
          </span>
          <span className="rounded-full bg-amber-100 px-2 py-1 text-[13px] font-bold text-amber-700">รับเรื่องแล้ว</span>
        </div>
        <div className="grid content-start gap-3 overflow-y-auto p-4">
          <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm">
            <small className="text-[13px] font-medium text-slate-500">คุณ · 10:32</small>
            <p className="mt-1 text-[15px] font-medium leading-5 text-slate-700">โทรหาผู้รับแล้ว 2 ครั้ง แต่ยังไม่มีคนรับสายครับ</p>
          </div>
          {items.map((x, i) => (
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-700 to-blue-600 p-3 text-white" key={i}>
              <small className="text-[13px] font-medium text-blue-100">Admin · 10:36</small>
              <p className="mt-1 text-[15px] font-medium leading-5">{x}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2 border-t border-slate-200 bg-white p-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="h-11 min-w-0 flex-1 rounded-xl bg-slate-100 px-3 text-[15px] font-medium outline-none focus:ring-2 focus:ring-blue-100"
            placeholder="พิมพ์ข้อความ..."
          />
          <button className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white" onClick={send}>
            <Send size={18} />
          </button>
        </div>
      </section>
    </>
  );
}
