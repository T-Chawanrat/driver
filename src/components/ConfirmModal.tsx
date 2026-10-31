import { type ReactNode, useId } from "react";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  icon?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  disabled?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  children,
  icon,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  confirmClassName = "bg-blue-600 text-white disabled:bg-slate-300",
  disabled = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const titleId = useId();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/50 p-5" role="presentation">
      <section className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className={icon ? "flex items-start gap-3" : ""}>
          {icon ? <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blue-100 text-blue-700">{icon}</span> : null}
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold text-slate-900">{title}</h2>
            {description ? <p className="mt-1 text-[15px] leading-6 text-slate-600">{description}</p> : null}
            {children}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" onClick={onCancel} disabled={disabled} className="h-12 rounded-xl border border-slate-200 text-[15px] font-bold text-slate-600 disabled:opacity-60">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={disabled} className={`h-12 rounded-xl text-[15px] font-bold disabled:opacity-50 ${confirmClassName}`}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}
