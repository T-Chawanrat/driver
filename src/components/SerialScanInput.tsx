import { ScanLine, Search } from "lucide-react";
import { type FormEvent } from "react";

import { preventSpaceKey, removeSpaces } from "../utils/textSanitizer";

type SerialScanInputProps = {
  value: string;
  placeholder: string;
  inputLabel: string;
  searchLabel: string;
  cameraLabel: string;
  disabled?: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onOpenCamera: () => void;
};

export default function SerialScanInput({
  value,
  placeholder,
  inputLabel,
  searchLabel,
  cameraLabel,
  disabled = false,
  onValueChange,
  onSubmit,
  onOpenCamera,
}: SerialScanInputProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <form className="flex min-h-[76px] items-center gap-2 rounded-3xl border border-blue-100 bg-white p-2 shadow-sm" onSubmit={submit}>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(removeSpaces(event.target.value))}
        onKeyDown={preventSpaceKey}
        placeholder={placeholder}
        aria-label={inputLabel}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] font-medium outline-none disabled:text-slate-400"
      />
      <button type="submit" disabled={disabled || !value.trim()} aria-label={searchLabel} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white disabled:bg-slate-300">
        <Search size={25} strokeWidth={2.2} />
      </button>
      <button type="button" disabled={disabled} onClick={onOpenCamera} aria-label={cameraLabel} className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 active:bg-blue-200 disabled:opacity-50">
        <ScanLine size={27} strokeWidth={2.2} />
      </button>
    </form>
  );
}
