import { ChevronLeft, ChevronRight, CircleAlert, LoaderCircle, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AxiosInstance from "../services/http";

type IssueDraft = {
  receiveCode: string;
  receiveBusinessId: number | null;
  receiveWalkinId: number | null;
};

type QuickReason = {
  reason_send_problem_id: number;
  reason_send_problem_detail: string;
};

export default function IssueReason() {
  const navigate = useNavigate();
  const location = useLocation();
  const draft = (location.state as { deliveryIssueDraft?: IssueDraft } | null)?.deliveryIssueDraft;
  const [reasons, setReasons] = useState<QuickReason[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [openingChat, setOpeningChat] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void AxiosInstance.get<{ data?: QuickReason[] }>("/driver/delivery-issues/reasons")
      .then((response) => {
        if (active) setReasons(response.data.data || []);
      })
      .catch((requestError: any) => {
        if (active) setError(requestError?.response?.data?.message || "ไม่สามารถโหลดรายการปัญหาได้");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const chooseReason = async (reason: QuickReason) => {
    if (!draft || submittingId) return;
    try {
      setSubmittingId(reason.reason_send_problem_id);
      setError("");
      const response = await AxiosInstance.post<{ data?: { delivery_issue_id?: number } }>("/driver/delivery-issues", {
        receive_business_id: draft.receiveBusinessId,
        receive_walkin_id: draft.receiveWalkinId,
        issue_type: reason.reason_send_problem_detail,
        reason_send_problem_id: reason.reason_send_problem_id,
        message_text: reason.reason_send_problem_detail,
      });
      const issueId = Number(response.data.data?.delivery_issue_id);
      if (!Number.isInteger(issueId) || issueId <= 0) throw new Error("ไม่สามารถสร้างเคสแจ้งปัญหาได้");
      navigate(`/issues/${issueId}`, { replace: true });
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || "ไม่สามารถสร้างเคสแจ้งปัญหาได้");
    } finally {
      setSubmittingId(null);
    }
  };

  const openChat = async () => {
    if (!draft || openingChat || submittingId) return;
    try {
      setOpeningChat(true);
      setError("");
      const response = await AxiosInstance.get<{ data?: { delivery_issue_id?: number } | null }>("/driver/delivery-issues/by-receive", {
        params: {
          receive_business_id: draft.receiveBusinessId,
          receive_walkin_id: draft.receiveWalkinId,
        },
      });
      const issueId = Number(response.data.data?.delivery_issue_id);
      if (!Number.isInteger(issueId) || issueId <= 0) {
        setError("ยังไม่มีแชทของบิลนี้ กรุณาเลือกหัวข้อเพื่อเริ่มแจ้งปัญหา");
        return;
      }
      navigate(`/issues/${issueId}`);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || "ไม่สามารถเปิดแชทของบิลนี้ได้");
    } finally {
      setOpeningChat(false);
    }
  };

  if (!draft) {
    return (
      <section className="px-4 py-5">
        <p className="rounded-2xl bg-white p-4 text-center text-sm font-semibold text-slate-600">กรุณาเลือกบิลจากหน้าส่งของก่อนแจ้งปัญหา</p>
      </section>
    );
  }

  return (
    <section className="min-h-[calc(100dvh-72px)] bg-slate-50 pb-6">
      <header className="grid h-[58px] grid-cols-[38px_1fr_38px] items-center border-b border-slate-200 bg-white px-3.5">
        <button type="button" onClick={() => navigate(-1)} aria-label="ย้อนกลับ" className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-blue-600">
          <ChevronLeft size={24} strokeWidth={3} />
        </button>
        <b className="text-center text-[17px] font-bold text-slate-900">แจ้งปัญหา</b>
        <span />
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pt-5">
        <button type="button" onClick={() => void openChat()} disabled={openingChat || Boolean(submittingId)} className="flex min-h-[82px] w-full items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 px-4 py-3.5 text-left text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-60">
          <span className="min-w-0 break-all text-[16px] font-bold tracking-wide text-white">{draft.receiveCode}</span>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white">{openingChat ? <LoaderCircle size={27} className="animate-spin" /> : <MessageCircle size={28} strokeWidth={2.2} />}</span>
        </button>

        <div className="mt-4 grid gap-2.5">
          {loading ? (
            <div className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500">
              <LoaderCircle size={18} className="animate-spin text-blue-600" /> กำลังโหลดรายการ...
            </div>
          ) : null}
          {!loading && !reasons.length ? <p className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-500">ยังไม่มีหัวข้อปัญหา</p> : null}
          {reasons.map((reason) => (
            <button
              key={reason.reason_send_problem_id}
              type="button"
              onClick={() => void chooseReason(reason)}
              disabled={Boolean(submittingId)}
              className="group flex min-h-[68px] w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3.5 text-left shadow-sm transition active:scale-[0.99] active:border-orange-200 active:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-orange-50 text-orange-600 group-active:bg-orange-100">
                {submittingId === reason.reason_send_problem_id ? <LoaderCircle size={20} className="animate-spin" /> : <CircleAlert size={20} />}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-bold leading-5 text-slate-800">
                {submittingId === reason.reason_send_problem_id ? "กำลังแจ้งผู้ดูแล..." : reason.reason_send_problem_detail}
              </span>
              <ChevronRight size={20} className="shrink-0 text-slate-300 group-active:text-orange-500" />
            </button>
          ))}
        </div>

        {error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </main>
    </section>
  );
}
