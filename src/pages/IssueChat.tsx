import { ChevronLeft, ImagePlus, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useDriverAuth } from "../context/AuthContext";
import AxiosInstance from "../services/http";
import { connectSocket } from "../services/socket";

type Thread = { delivery_issue_id: number; receive_code: string; issue_type: string; issue_status: string; recipient_name: string };
type Message = { delivery_status_message_id: number; sender_user_id: number; sender_name: string; role_name?: string | null; message_text?: string | null; created_date: string; media: { file_name: string; file_path: string }[] };
type Attachment = { file: File; preview: string };
type QuickReason = { reason_send_problem_id: number; reason_send_problem_detail: string };

const time = (value: string) => new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
const fileUrl = (filePath: string) => new URL(filePath, AxiosInstance.defaults.baseURL || window.location.origin).href;
const issueStatus: Record<string, { label: string; className: string }> = {
  NEW: { label: "รอรับเรื่อง", className: "bg-rose-50 text-rose-700" },
  IN_PROGRESS: { label: "รับเรื่องแล้ว", className: "bg-amber-50 text-amber-700" },
  RESOLVED: { label: "เสร็จสิ้น", className: "bg-emerald-50 text-emerald-700" },
};
const messageMeta = (message: Pick<Message, "sender_name" | "role_name" | "created_date">) => <>{message.sender_name}{message.role_name ? <span className="mx-1 inline-flex rounded-full border border-blue-100 bg-blue-50 px-1.5 py-0.5 align-middle text-[10px] font-bold leading-none text-blue-700">{message.role_name}</span> : null} · {time(message.created_date)}</>;

export default function IssueChat() {
  const navigate = useNavigate();
  const { deliveryIssueId } = useParams();
  const { driver } = useDriverAuth();
  const issueId = Number(deliveryIssueId);
  const [thread, setThread] = useState<Thread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const quickReasons: QuickReason[] = [];
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(Number.isInteger(issueId) && issueId > 0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const attachmentUrls = useRef(new Set<string>());

  const loadMessages = async () => {
    if (!Number.isInteger(issueId) || issueId <= 0) return;
    const response = await AxiosInstance.get<{ data?: { thread: Thread; messages: Message[] } }>(`/driver/delivery-issues/${issueId}/messages`);
    setThread(response.data.data?.thread || null);
    setMessages(response.data.data?.messages || []);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current?.scrollHeight || 0 }));
  };

  useEffect(() => {
    let active = true;
    if (!Number.isInteger(issueId) || issueId <= 0) return;
    void (async () => {
      try {
        setLoading(true);
        setError("");
        if (active) await loadMessages();
      } catch (requestError: any) {
        if (active) setError(requestError?.response?.data?.message || "ไม่สามารถเปิดแชตได้");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [issueId]);

  useEffect(() => {
    if (!thread) return;
    const socket = connectSocket();
    const receiveMessage = (event: { issueId?: number }) => {
      if (Number(event.issueId) === issueId) void loadMessages().catch(() => undefined);
    };
    const joinThread = () => socket.emit("delivery-issue:join", issueId);
    socket.on("connect", joinThread);
    if (socket.connected) joinThread();
    socket.on("delivery-issue:message", receiveMessage);
    return () => {
      socket.emit("delivery-issue:leave", issueId);
      socket.off("connect", joinThread);
      socket.off("delivery-issue:message", receiveMessage);
    };
  }, [thread?.delivery_issue_id, issueId]);

  useEffect(() => () => attachmentUrls.current.forEach((preview) => URL.revokeObjectURL(preview)), []);

  const send = async (quickMessage?: string) => {
    const messageText = (quickMessage ?? draft).trim();
    const files = quickMessage ? [] : attachments;
    if (!Number.isInteger(issueId) || issueId <= 0 || sending || (!messageText && !files.length)) return;
    try {
      setSending(true);
      setError("");
      const form = new FormData();
      if (messageText) form.append("message_text", messageText);
      files.forEach(({ file }) => form.append("images", file));
      await AxiosInstance.post(`/driver/delivery-issues/${issueId}/messages`, form);
      if (!quickMessage) {
        attachments.forEach(({ preview }) => { URL.revokeObjectURL(preview); attachmentUrls.current.delete(preview); });
        setAttachments([]);
        setDraft("");
      }
      await loadMessages();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถส่งข้อความได้");
    } finally {
      setSending(false);
    }
  };

  if (!Number.isInteger(issueId) || issueId <= 0) return <section className="px-4 py-5"><p className="rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-600">เลือกบิลจากหน้าส่งของเพื่อแจ้งปัญหา</p></section>;

  return <section className="grid h-[calc(100dvh-72px)] grid-rows-[auto_1fr_auto] bg-slate-50">
    <header className="grid h-[58px] grid-cols-[38px_1fr_38px] items-center border-b border-slate-200 bg-white px-3.5"><button type="button" onClick={() => navigate(-1)} aria-label="ย้อนกลับ" className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600"><ChevronLeft size={24} strokeWidth={3} /></button><b className="truncate text-center text-[16px] font-bold text-slate-900">{thread?.receive_code || "แจ้งปัญหา"}</b><span /></header>
    <div ref={scrollRef} className="min-h-0 overflow-y-auto"><div className="border-b border-slate-200 bg-white p-4"><span className="block min-w-0"><span className="flex items-center justify-between gap-2"><b className="min-w-0 truncate text-base text-slate-900">{thread?.issue_type || "แจ้งปัญหาการจัดส่ง"}</b>{thread?.issue_status ? <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${issueStatus[thread.issue_status]?.className || "bg-slate-100 text-slate-600"}`}>{issueStatus[thread.issue_status]?.label || thread.issue_status}</span> : null}</span><small className="mt-0.5 block truncate text-[13px] font-medium text-slate-500">{thread?.recipient_name || "-"}</small></span></div>{quickReasons.length ? <div className="border-b border-slate-200 bg-white px-4 py-3"><p className="mb-2 text-[13px] font-bold text-slate-600">ข้อความด่วน</p><div className="flex gap-2 overflow-x-auto pb-1">{quickReasons.map((reason) => <button key={reason.reason_send_problem_id} type="button" disabled={sending} onClick={() => void send(reason.reason_send_problem_detail)} className="shrink-0 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-700 active:bg-orange-100 disabled:opacity-50">{reason.reason_send_problem_detail}</button>)}</div></div> : null}<div className="flex flex-col gap-3 p-4">{loading ? <p className="text-center text-sm text-slate-500">กำลังโหลด...</p> : null}{messages.map((message) => { const mine = Number(message.sender_user_id) === Number(driver?.id); return <div key={message.delivery_status_message_id} className={mine ? "ml-auto flex max-w-[85%] flex-col items-end" : "flex max-w-[85%] flex-col items-start"}><small className={`mb-1 block text-[13px] font-medium text-slate-500 ${mine ? "text-right" : ""}`}>{messageMeta(message)}</small><div className={`w-fit max-w-full rounded-2xl p-3 shadow-sm ${mine ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm bg-white text-slate-700"}`}>{message.message_text ? <p className="whitespace-pre-wrap break-words text-[15px] font-medium leading-5">{message.message_text}</p> : null}{message.media.length ? <div className={`grid gap-2 ${message.message_text ? "mt-2" : ""} ${message.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>{message.media.map((media) => <a key={media.file_path} href={fileUrl(media.file_path)} target="_blank" rel="noreferrer"><img src={fileUrl(media.file_path)} alt={media.file_name} className="max-h-64 w-full rounded-xl object-cover" /></a>)}</div> : null}</div></div>; })}{!loading && !messages.length ? <p className="text-center text-sm text-slate-500">เริ่มพิมพ์ข้อความเพื่อแจ้งปัญหา</p> : null}</div></div>
    <div className="border-t border-slate-200 bg-white p-3">{attachments.length ? <div className="mb-2 flex gap-2">{attachments.map((attachment, index) => <div key={attachment.preview} className="relative h-14 w-14"><img src={attachment.preview} alt="รูปแนบ" className="h-full w-full rounded-lg object-cover" /><button type="button" onClick={() => setAttachments((current) => current.filter((_, itemIndex) => { if (itemIndex === index) { URL.revokeObjectURL(attachment.preview); attachmentUrls.current.delete(attachment.preview); } return itemIndex !== index; }))} className="absolute -right-1 -top-1 rounded-full bg-slate-900 p-1 text-white"><X size={13} /></button></div>)}</div> : null}<div className="flex items-end gap-2"><input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(event) => { const files = Array.from(event.target.files || []).filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type)); setAttachments((current) => [...current, ...files.slice(0, Math.max(0, 4 - current.length)).map((file) => { const preview = URL.createObjectURL(file); attachmentUrls.current.add(preview); return { file, preview }; })]); event.target.value = ""; }} /><button type="button" onClick={() => fileInput.current?.click()} disabled={attachments.length >= 4} className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 disabled:text-slate-300"><ImagePlus size={21} /></button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} placeholder="พิมพ์ข้อความ..." className="min-h-11 flex-1 resize-none rounded-xl bg-slate-100 px-3 py-2 text-[15px] font-medium outline-none" /><button type="button" onClick={() => void send()} disabled={sending || (!draft.trim() && !attachments.length)} className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600 text-white disabled:bg-slate-300"><Send size={19} /></button></div>{error ? <p className="mt-2 text-sm font-medium text-red-600">{error}</p> : null}</div>
  </section>;
}
