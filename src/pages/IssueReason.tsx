import { ChevronLeft, ChevronRight, CircleAlert, LoaderCircle, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import ConfirmModal from "../components/ConfirmModal";
import AxiosInstance from "../services/http";

type IssueDraft = {
  receiveCode: string;
  receiveBusinessId: number | null;
  receiveWalkinId: number | null;
  serials?: { serialId: string; serialNo: string }[];
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
  const [selectedReason, setSelectedReason] = useState<QuickReason | null>(null);
  const [failedSerials, setFailedSerials] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
    if (draft.serials?.length) {
      setSelectedReason(reason);
      setFailedSerials([]);
      setError("");
      return;
    }
    await createIssue(reason);
  };

  const createIssue = async (reason: QuickReason, serials: { serial_id: string; serial_no: string }[] = []) => {
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
        serials,
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

  const serialKey = (serial: { serialId: string; serialNo: string }) => JSON.stringify([serial.serialId, serial.serialNo]);
  const toggleFailedSerial = (serial: { serialId: string; serialNo: string }) => {
    const key = serialKey(serial);
    setFailedSerials((current) => current.includes(key) ? current.filter((value) => value !== key) : [...current, key]);
  };

  const selectedFailureSerials = (draft?.serials || [])
    .filter((serial) => failedSerials.includes(serialKey(serial)))
    .map((serial) => ({ serial_id: serial.serialId, serial_no: serial.serialNo }));

  const toggleAllFailedSerials = () => {
    const serials = draft?.serials || [];
    setFailedSerials((current) => current.length === serials.length ? [] : serials.map(serialKey));
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
        <b className="text-center text-[17px] font-bold text-slate-900">{selectedReason ? "เลือก SN" : "แจ้งปัญหา"}</b>
        <span />
      </header>

      <main className="mx-auto w-full max-w-xl px-4 pt-5">
        <button type="button" onClick={() => void openChat()} disabled={openingChat || Boolean(submittingId)} className="flex min-h-[82px] w-full items-center justify-between gap-4 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-600 px-4 py-3.5 text-left text-white shadow-lg shadow-blue-600/20 active:scale-[0.99] disabled:opacity-60">
          <span className="min-w-0">
            <span className="block break-all text-[16px] font-bold tracking-wide text-white">{draft.receiveCode}</span>
          </span>
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white">{openingChat ? <LoaderCircle size={27} className="animate-spin" /> : <MessageCircle size={28} strokeWidth={2.2} />}</span>
        </button>

        {selectedReason ? (
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">{selectedReason.reason_send_problem_detail}</p>
              <p className="mt-1 text-sm font-medium text-amber-700">เลือก SN ที่ส่งไม่สำเร็จ</p>
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-600">เลือก {failedSerials.length}/{draft.serials?.length || 0}</span>
              <button type="button" onClick={toggleAllFailedSerials} disabled={Boolean(submittingId)} className="text-sm font-bold text-blue-600 disabled:opacity-60">
                {failedSerials.length === (draft.serials?.length || 0) ? "ไม่เลือกทั้งหมด" : "เลือกทั้งหมด"}
              </button>
            </div>
            <div className="grid gap-2">
              {draft.serials?.map((serial) => (
                <label key={serialKey(serial)} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                  <input type="checkbox" checked={failedSerials.includes(serialKey(serial))} onChange={() => toggleFailedSerial(serial)} className="h-4 w-4 accent-orange-600" />
                  <code className="break-all text-[15px] font-semibold text-slate-700">{serial.serialNo}</code>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button type="button" onClick={() => setSelectedReason(null)} disabled={Boolean(submittingId)} className="h-12 rounded-xl border border-slate-200 bg-white text-[15px] font-bold text-slate-700 disabled:opacity-60">ย้อนกลับ</button>
              <button type="button" onClick={() => setConfirmOpen(true)} disabled={!failedSerials.length || Boolean(submittingId)} className="h-12 rounded-xl bg-orange-600 text-[15px] font-bold text-white disabled:opacity-50">
                {submittingId ? "กำลังแจ้ง..." : `ยืนยัน ${failedSerials.length} SN`}
              </button>
            </div>
          </div>
        ) : (
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
        )}

        {error ? <p className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p> : null}
      </main>

      <ConfirmModal
        open={confirmOpen && Boolean(selectedReason)}
        title="ยืนยันแจ้งส่งไม่สำเร็จ"
        confirmClassName="bg-orange-600 text-white"
        disabled={Boolean(submittingId)}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          if (!selectedReason) return;
          setConfirmOpen(false);
          void createIssue(selectedReason, selectedFailureSerials);
        }}
      >
        <p className="mt-2 text-[15px] font-medium leading-6 text-slate-600">{selectedReason?.reason_send_problem_detail}</p>
        <p className="mt-1 text-sm font-semibold text-slate-500">จำนวน {selectedFailureSerials.length} SN</p>
      </ConfirmModal>
    </section>
  );
}
