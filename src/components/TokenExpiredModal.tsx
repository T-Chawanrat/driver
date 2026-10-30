import { LogIn, ShieldAlert } from "lucide-react";

type TokenExpiredModalProps = {
  open: boolean;
  onLogin: () => void;
};

export default function TokenExpiredModal({ open, onLogin }: TokenExpiredModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end bg-slate-950/45 p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="token-expired-title">
      <section className="w-full max-w-[420px] rounded-[28px] bg-white p-6 shadow-2xl shadow-slate-950/25">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <ShieldAlert size={30} strokeWidth={2.25} />
        </span>
        <h1 id="token-expired-title" className="mt-5 text-[21px] font-bold text-slate-900">
          เซสชันหมดอายุ
        </h1>
        <p className="mt-1.5 text-[15px] font-medium leading-6 text-slate-500">เพื่อความปลอดภัย กรุณาเข้าสู่ระบบอีกครั้ง</p>
        <button
          type="button"
          onClick={onLogin}
          className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 text-[15px] font-bold text-white shadow-lg shadow-blue-600/20 active:scale-[.99]"
        >
          <LogIn size={19} strokeWidth={2.5} />
          เข้าสู่ระบบอีกครั้ง
        </button>
      </section>
    </div>
  );
}
