import { Headset, MessageCircle, Phone } from "lucide-react";

// Fill these from the support contact API when available.
const support: { name: string; phone: string; chatUrl: string } = { name: "ผู้ดูแลระบบ", phone: "", chatUrl: "" };

export default function MenuContact() {
  return (
    <section className="flex flex-col gap-5 px-4 pb-24 pt-5 sm:px-6">
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/20">
          <Headset size={25} />
        </span>
        <div>
          <h1 className="text-lg font-bold">ติดต่อผู้ดูแล</h1>
          <p className="mt-1 text-sm font-medium text-blue-100">ติดต่อเมื่อมีปัญหาในการใช้งาน</p>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-bold text-slate-900">{support.name}</h2>
        <p className="mt-1 text-sm font-medium text-slate-500">{support.phone || "ยังไม่มีข้อมูลเบอร์ติดต่อ"}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {support.phone ? (
            <a
              href={`tel:${support.phone}`}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-blue-600 text-[15px] font-bold text-white"
            >
              <Phone size={18} />
              โทรติดต่อ
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 text-[15px] font-bold text-slate-400"
            >
              <Phone size={18} />
              โทรติดต่อ
            </button>
          )}
          {support.chatUrl ? (
            <a
              href={support.chatUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 text-[15px] font-bold text-blue-700"
            >
              <MessageCircle size={18} />
              แชท
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-100 text-[15px] font-bold text-slate-400"
            >
              <MessageCircle size={18} />
              แชท
            </button>
          )}
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500">หน้าตัวอย่าง ยังไม่ได้เชื่อมต่อข้อมูลช่องทางติดต่อ</p>
    </section>
  );
}
