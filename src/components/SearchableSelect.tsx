import { useId } from "react";

type Props = {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
};

export default function SearchableSelect({ label, options, value, onChange, placeholder, disabled, required, error }: Props) {
  const id = useId();

  return (
    <div className="grid gap-1.5 text-sm font-bold text-slate-700">
      <label htmlFor={id}>{label}{required && <span className="text-red-500"> *</span>}</label>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} required={required}
        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-base font-medium outline-none focus:border-blue-500 disabled:bg-slate-50">
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {error && <span role="alert" className="text-sm font-medium text-red-600">{error}</span>}
    </div>
  );
}
