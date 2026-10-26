import { ChevronLeft, ChevronRight, MessageCircle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AxiosInstance from "../services/http";
import { connectSocket } from "../services/socket";

type IssueThread = {
  delivery_issue_id: number;
  receive_code: string;
  issue_type: string;
  recipient_name: string | null;
  updated_at: string;
  last_message: string | null;
  unread_count: number | string;
};

const time = (value: string) =>
  value ? new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value)) : "";

export default function IssueInbox() {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<IssueThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadThreads = useCallback(async (refresh = false, silent = false) => {
    try {
      if (!silent) {
        if (refresh) setRefreshing(true);
        else setLoading(true);
      }
      setError("");
      const response = await AxiosInstance.get<{ data?: IssueThread[] }>("/driver/delivery-issues");
      setThreads(response.data.data || []);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถโหลดรายการแชตได้");
    } finally {
      if (!silent) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const socket = connectSocket();
    const joinInbox = () => socket.emit("driver-delivery-issues:inbox:join");
    const refreshInbox = () => void loadThreads(false, true);
    socket.on("connect", joinInbox);
    if (socket.connected) joinInbox();
    socket.on("driver-delivery-issue:inbox", refreshInbox);
    return () => {
      socket.off("connect", joinInbox);
      socket.off("driver-delivery-issue:inbox", refreshInbox);
    };
  }, [loadThreads]);

  return (
    <section className="flex h-[calc(100dvh-72px)] flex-col bg-slate-50">
      <header className="grid h-[58px] shrink-0 grid-cols-[40px_1fr_40px] items-center border-b border-slate-200 bg-white px-3.5">
        <button type="button" onClick={() => navigate(-1)} aria-label="ย้อนกลับ" className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600 active:bg-blue-100">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <b className="text-center text-[17px] font-bold text-slate-900">ปัญหา</b>
        <button type="button" onClick={() => void loadThreads(true)} disabled={refreshing} aria-label="อัปเดตรายการ" className="grid h-9 w-9 place-items-center rounded-full text-slate-500 active:bg-slate-100 disabled:text-slate-300">
          <RefreshCw size={19} className={refreshing ? "animate-spin" : ""} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4">
        {loading ? <p className="rounded-2xl bg-white p-5 text-center text-sm font-semibold text-slate-500">กำลังโหลดรายการ...</p> : null}
        {!loading && !error && !threads.length ? (
          <div className="grid min-h-64 place-items-center p-6 text-center">
            <div>
              <MessageCircle size={34} className="mx-auto mb-3 text-slate-400" />
              <p className="text-[15px] font-bold text-slate-600">ยังไม่มีรายการแจ้งปัญหา</p>
            </div>
          </div>
        ) : null}
        {!loading && threads.length ? (
          <div className="space-y-2.5">
            {threads.map((thread) => {
              const unread = Number(thread.unread_count) || 0;
              return (
                <button
                  key={thread.delivery_issue_id}
                  type="button"
                  onClick={() => navigate(`/issues/${thread.delivery_issue_id}`)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 py-3.5 text-left shadow-sm active:bg-slate-50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[15px] font-bold text-blue-700">{thread.receive_code}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-bold text-slate-600">{thread.issue_type || "แจ้งปัญหาการจัดส่ง"}{thread.recipient_name ? ` · ${thread.recipient_name}` : ""}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-slate-500">{thread.last_message || "ยังไม่มีข้อความ"}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end self-stretch pt-0.5">
                    <span className="text-xs font-medium text-slate-400">{time(thread.updated_at)}</span>
                    {unread ? <span className="mt-auto grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">{unread > 99 ? "99+" : unread}</span> : <ChevronRight size={18} strokeWidth={2.25} className="mt-auto text-slate-300" />}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
        {error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </div>
    </section>
  );
}
