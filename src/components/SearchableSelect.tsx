import { useEffect, useId, useState } from "react";

type Option = { value: string; label: string; searchText?: string };

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
};

export default function SearchableSelect({ label, options, value, onChange, placeholder, disabled, required, error }: Props) {
  const id = useId();
  const selected = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selected?.label || "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => { if (!open) setQuery(selected?.label || ""); }, [open, selected?.label]);

  const search = value && query === selected?.label ? "" : query.trim().toLocaleLowerCase();
  const matches = options.filter((option) => `${option.label} ${option.searchText || ""}`.toLocaleLowerCase().includes(search));
  const select = (option: Option) => { onChange(option.value); setQuery(option.label); setOpen(false); };

  return (
    <div className="relative grid gap-1.5 text-sm font-bold text-slate-700" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <label htmlFor={id}>{label}{required && <span className="text-red-500"> *</span>}</label>
      <input id={id} type="search" role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={open && matches[activeIndex] ? `${id}-option-${activeIndex}` : undefined} autoComplete="off" value={query} disabled={disabled} placeholder={placeholder}
        onFocus={() => { setOpen(true); setActiveIndex(0); }}
        onChange={(event) => { setQuery(event.target.value); onChange(""); setOpen(true); setActiveIndex(0); }}
        onKeyDown={(event) => {
          if (event.key === "Escape") { setOpen(false); event.currentTarget.blur(); }
          if (event.key === "ArrowDown") { event.preventDefault(); setOpen(true); setActiveIndex((index) => Math.min(index + 1, Math.max(matches.length - 1, 0))); }
          if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => Math.max(index - 1, 0)); }
          if (event.key === "Enter" && open && matches[activeIndex]) { event.preventDefault(); select(matches[activeIndex]); }
        }}
        className="h-12 rounded-xl border border-slate-200 bg-white px-3 text-base font-medium outline-none focus:border-blue-500 disabled:bg-slate-50" />
      {open && <div id={`${id}-list`} role="listbox" className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
        {matches.length ? matches.map((option, index) => <button id={`${id}-option-${index}`} key={option.value} type="button" role="option" aria-selected={value === option.value} onClick={() => select(option)} className={`block w-full rounded-lg px-3 py-3 text-left text-base font-medium text-slate-800 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${index === activeIndex ? "bg-blue-50" : ""}`}>{option.label}</button>) : <p className="px-3 py-3 font-medium text-slate-500">ไม่พบรายการ</p>}
      </div>}
      {error && <span role="alert" className="text-sm font-medium text-red-600">{error}</span>}
    </div>
  );
}
