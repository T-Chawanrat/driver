import { useState } from "react";
import { ClipboardList, Search } from "lucide-react";

type HistoryItem = { id: string; truckCode: string; kind: "DT" | "TK"; description: string; completedAt: string };

// Replace with the driver's completed jobs from the API.
const history: HistoryItem[] = [];

export default function MenuJobHistory() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<"ALL" | "DT" | "TK">("ALL");
  const items = history.filter((item) => (kind === "ALL" || item.kind === kind) && `${item.truckCode} ${item.description}`.toLowerCase().includes(search.trim().toLowerCase()));
  return (
    <section className="flex flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20"><h1 className="text-lg font-bold">ประวัติงาน</h1><p className="mt-1 text-sm font-medium text-blue-100">รายการงานที่เสร็จสิ้นของคุณ</p></div>
      <label className="flex h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4"><Search size={20} className="shrink-0 text-slate-400" /><input className="min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาเลขใบรถหรือสายรถ" aria-label="ค้นหาประวัติงาน" /></label>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1" aria-label="ประเภทใบรถ">
        {([ ["ALL", "ทั้งหมด"], ["DT", "รถกระจาย"], ["TK", "รถขนย้าย"] ] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={kind === value} onClick={() => setKind(value)} className={`min-h-11 rounded-lg text-sm font-bold ${kind === value ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}>{label}</button>)}
      </div>
      <p className="text-sm font-medium text-slate-500">หน้าตัวอย่าง ยังไม่ได้เชื่อมต่อประวัติงาน</p>
      {items.length ? <div className="grid gap-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><span className="text-sm font-bold text-blue-600">{item.kind}</span><h2 className="mt-1 text-base font-bold text-slate-900">{item.truckCode}</h2><p className="mt-1 text-sm font-medium text-slate-600">{item.description}</p><p className="mt-2 text-sm font-medium text-slate-500">{item.completedAt}</p></article>)}</div> : <div className="grid justify-items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center"><ClipboardList size={32} className="text-slate-400" /><p className="text-base font-bold text-slate-700">ยังไม่มีรายการประวัติงาน</p><p className="text-sm font-medium text-slate-500">เมื่อเชื่อมต่อข้อมูล รายการงานจะแสดงที่นี่</p></div>}
    </section>
  );
}
