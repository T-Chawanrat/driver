import { useState } from "react";
import { Eye, EyeOff, Truck } from "lucide-react";
import { useDriverAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useDriverAuth();
  const [remember, setRemember] = useState(() => localStorage.getItem("driver_remember_login") === "true");
  const [username, setUsername] = useState(() =>
    localStorage.getItem("driver_remember_login") === "true" ? localStorage.getItem("driver_remember_username") || "" : "",
  );
  const [password, setPassword] = useState(() =>
    localStorage.getItem("driver_remember_login") === "true" ? localStorage.getItem("driver_remember_password") || "" : "",
  );
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      await login(username, password);
      if (remember) {
        localStorage.setItem("driver_remember_login", "true");
        localStorage.setItem("driver_remember_username", username);
        localStorage.setItem("driver_remember_password", password);
      } else {
        localStorage.removeItem("driver_remember_login");
        localStorage.removeItem("driver_remember_username");
        localStorage.removeItem("driver_remember_password");
      }
    } catch (exception: any) {
      setError(exception.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ");
    }
  };

  return (
    <main className="min-h-dvh w-full bg-slate-50 font-[Sarabun,sans-serif] text-slate-900">
      <form className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col justify-center px-6 py-10 sm:px-8 md:max-w-[460px] md:px-8 md:py-14" onSubmit={handleSubmit}>
        <div className="grid justify-items-center gap-2 text-center">
          <span className="grid h-[68px] w-[68px] place-items-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 text-white shadow-lg shadow-blue-600/25">
            <Truck size={34} strokeWidth={2.2} />
          </span>
          <h1 className="mt-2 text-[28px] font-bold leading-none tracking-tight">TMS Driver</h1>
          <p className="text-[15px] font-medium text-slate-500">ระบบงานจัดส่งสำหรับคนขับ</p>
        </div>
        <div className="mt-11 grid gap-5">
        <label className="grid gap-2 text-[15px] font-bold text-slate-700">
          <span>
            Username <em className="text-red-500">*</em>
          </span>
          <input
            className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-base font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="grid gap-2 text-[15px] font-bold text-slate-700">
          <span>
            Password <em className="text-red-500">*</em>
          </span>
          <span className="relative">
            <input
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-14 text-base font-medium outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-slate-500 active:bg-blue-50 active:text-blue-600"
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            >
              {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </span>
        </label>
        <label className="flex min-h-10 items-center gap-2.5 text-[15px] font-semibold text-slate-600">
          <input
            className="h-4 w-4 accent-blue-600"
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          จดจำชื่อผู้ใช้และรหัสผ่าน
        </label>
        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}
        <button className="mt-2 h-14 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 text-[15px] font-bold text-white shadow-lg shadow-blue-600/20 active:scale-[.99]">
          เข้าสู่ระบบ
        </button>
        </div>
      </form>
    </main>
  );
}
