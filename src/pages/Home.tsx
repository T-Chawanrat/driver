import { useEffect, useState } from "react";
import { CalendarDays, FilePlus2, LayoutDashboard, Megaphone, Pin, Search } from "lucide-react";
import { useDriverAuth } from "../context/AuthContext";
import AxiosInstance from "../services/http";
import { getDeliverySummary } from "../services/deliveries";
import FuelLabel from "../components/FuelLabel";
import type { Navigate } from "../types/driver";

type Announcement = {
  id: number;
  title: string;
  content: string;
  createdDate: string;
  isPinned: boolean;
  imageUrls: string[];
};

type OilPrice = { product: string; price: number };
type DriverTruck = { is_close?: string | null };

const getUploadUrl = (value: string) => {
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  const baseUrl = (AxiosInstance.defaults.baseURL || "").replace(/\/$/, "");
  return `${baseUrl}/${value.replace(/^\/+/, "")}`;
};

const formatOilDate = (value: string | null) => {
  if (!value) return "-";
  const [date, time = ""] = value.split("T");
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}-${month}-${Number(year) + 543} ${time.slice(0, 5)}`.trim() : value;
};

export default function Home({ go }: { go: Navigate }) {
  const { driver } = useDriverAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState("");
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");
  const [oilPrices, setOilPrices] = useState<OilPrice[]>([]);
  const [oilUpdatedAt, setOilUpdatedAt] = useState<string | null>(null);
  const [oilLoading, setOilLoading] = useState(true);
  const [oilError, setOilError] = useState("");
  const [preparingCount, setPreparingCount] = useState<number | null>(null);
  const [deliveringCount, setDeliveringCount] = useState<number | null>(null);
  const [summaryError, setSummaryError] = useState("");

  useEffect(() => {
    let current = true;
    void AxiosInstance.get("/announcements")
      .then(({ data }) => {
        if (current) setAnnouncements(Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => {
        if (current) setAnnouncementsError("ไม่สามารถโหลดประกาศได้ในขณะนี้");
      })
      .finally(() => {
        if (current) setAnnouncementsLoading(false);
      });

    void AxiosInstance.get("/oil-prices")
      .then(({ data }) => {
        const result = data?.data || data;
        if (current) {
          setOilPrices(Array.isArray(result?.items) ? result.items : []);
          setOilUpdatedAt(result?.updatedAt || null);
        }
      })
      .catch(() => {
        if (current) setOilError("ไม่สามารถโหลดราคาน้ำมันได้ในขณะนี้");
      })
      .finally(() => {
        if (current) setOilLoading(false);
      });

    void AxiosInstance.get<{ data?: DriverTruck[] }>("/driver/trucks")
      .then(({ data }) => {
        if (current) setPreparingCount((data.data || []).filter((truck) => truck.is_close !== "Y").length);
      })
      .catch(() => {
        if (current) setSummaryError("โหลดข้อมูลสรุปบางส่วนไม่สำเร็จ");
      });

    void getDeliverySummary()
      .then((data) => {
        if (current) setDeliveringCount(data.truckCount);
      })
      .catch(() => {
        if (current) setSummaryError("โหลดข้อมูลสรุปบางส่วนไม่สำเร็จ");
      });

    return () => {
      current = false;
    };
  }, []);

  const searchText = search.trim().toLocaleLowerCase();
  const today = new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  const visibleAnnouncements = announcements.filter((item) => `${item.title} ${item.content}`.toLocaleLowerCase().includes(searchText));
  const workPages = [
    ["WORK_MENU", "เมนูงานคนขับ", LayoutDashboard],
    ["DELIVERY_CREATE", "สร้างใบรถกระจาย", FilePlus2],
  ] as const;
  return (
    <section className="flex w-full flex-col gap-5 px-4 pb-24 pt-5 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <b className="text-lg font-bold">สวัสดี {[driver?.first_name, driver?.last_name].filter(Boolean).join(" ") || driver?.username}</b>
          <span className="text-sm font-medium text-blue-100">{today}</span>
        </div>
        <p className="mt-1 text-sm font-medium text-blue-100">คลัง: {driver?.warehouse_name || "ไม่ระบุคลัง"}</p>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">สรุปงานวันนี้</h2>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200">
          <div className="pr-2">
            <p className="min-h-10 text-sm font-medium leading-5 text-slate-600">รับงาน</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {preparingCount ?? "–"} <span className="text-sm font-medium text-slate-500">ใบ</span>
            </p>
          </div>
          <div className="px-2 sm:px-4">
            <p className="min-h-10 text-sm font-medium leading-5 text-slate-600">ส่งของ</p>
            <p className="mt-2 text-2xl font-bold text-blue-600">
              {deliveringCount ?? "–"} <span className="text-sm font-medium text-slate-500">ใบ</span>
            </p>
          </div>
          <div className="pl-2 sm:pl-4">
            <p className="min-h-10 text-sm font-medium leading-5 text-slate-600">ส่งสำเร็จวันนี้</p>
            <p className="mt-2 text-2xl font-bold text-slate-400">
              – <span className="text-sm font-medium text-slate-500">กล่อง</span>
            </p>
          </div>
        </div>
        {summaryError ? (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {summaryError}
          </p>
        ) : null}
      </section>
      <h2 className="text-lg font-bold text-slate-900">เมนูงาน</h2>
      <div className="grid grid-cols-2 gap-3">
        {workPages.map(([screen, label, Icon]) => (
          <button
            className="grid min-h-28 place-items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-[15px] font-bold text-slate-700 shadow-sm active:scale-[.98]"
            key={screen}
            type="button"
            onClick={() => go(screen)}
          >
            {Icon ? <Icon className="h-6 w-6 text-blue-600" /> : null}
            <span>{label}</span>
          </button>
        ))}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">ราคาน้ำมันวันนี้</h2>
          {oilUpdatedAt ? <span className="text-xs font-medium text-slate-500">ปรับราคาเมื่อ {formatOilDate(oilUpdatedAt)}</span> : null}
        </div>
        {oilLoading ? <p className="pt-4 text-sm text-slate-500">กำลังโหลดราคาน้ำมัน...</p> : null}
        {oilError ? <p className="pt-4 text-sm text-rose-600">{oilError}</p> : null}
        {!oilLoading && !oilError ? (
          oilPrices.length ? (
            <div className="mt-4 flex flex-col gap-2">
              {oilPrices.map((oil) => (
                <div key={oil.product} className="flex items-center gap-6">
                  <FuelLabel product={oil.product} />
                  <p className="ml-auto text-right text-base font-bold text-slate-900">
                    {Number(oil.price).toFixed(2)} <span className="text-xs font-medium text-slate-500">บาท/ลิตร</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="pt-4 text-sm text-slate-500">ไม่พบข้อมูลราคาน้ำมัน</p>
          )
        ) : null}
      </section>
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <Megaphone className="h-5 w-5 text-blue-600" />
          ประกาศจากบริษัท
        </h2>
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาประกาศ"
            className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-base text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
        {announcementsLoading ? <p className="py-4 text-center text-sm text-slate-500">กำลังโหลดประกาศ...</p> : null}
        {announcementsError ? <p className="py-4 text-center text-sm text-rose-600">{announcementsError}</p> : null}
        {!announcementsLoading && !announcementsError && !visibleAnnouncements.length ? (
          <p className="py-4 text-center text-sm text-slate-500">ไม่พบประกาศ</p>
        ) : null}
        {!announcementsLoading && !announcementsError
          ? visibleAnnouncements.map((announcement) => (
              <article key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="break-words text-base font-bold text-slate-900">{announcement.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                      <CalendarDays className="h-4 w-4" />
                      {announcement.createdDate}
                    </p>
                  </div>
                  {announcement.isPinned ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                      <Pin className="h-3.5 w-3.5" />
                      ปักหมุด
                    </span>
                  ) : null}
                </div>
                {announcement.imageUrls?.length ? (
                  <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
                    {announcement.imageUrls.map((url, index) => (
                      <a key={`${url}-${index}`} href={getUploadUrl(url)} target="_blank" rel="noreferrer" className="max-w-full shrink-0 snap-start">
                        <img
                          src={getUploadUrl(url)}
                          alt={`รูปประกอบ ${announcement.title}`}
                          className="max-h-56 max-w-full rounded-xl object-contain"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-700">{announcement.content}</p>
              </article>
            ))
          : null}
      </section>
    </section>
  );
}

