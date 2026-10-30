import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Gauge, MapPin, Package, Phone, ScanLine, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CameraScannerModal from "../components/camera/CameraScannerModal";
import { useDriverAuth } from "../context/AuthContext";
import { getDeliveries } from "../services/deliveries";
import type { Deliveries, DeliveryRecipient } from "../types/delivery";


export default function RecipientList() {
  const navigate = useNavigate();
  const { driver } = useDriverAuth();
  const isContractor = driver?.employment_type === "CONTRACTOR";
  const [deliveries, setDeliveries] = useState<Deliveries | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [serial, setSerial] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [searchError, setSearchError] = useState("");
  const openRecipient = (recipient: DeliveryRecipient, selectedSerialKey?: string) => {
    const bill = recipient.bills[0];
    const params = new URLSearchParams();
    if (recipient.recipientDetailId) params.set("recipient_detail_id", String(recipient.recipientDetailId));
    else if (bill?.receiveBusinessId) params.set("receive_business_id", String(bill.receiveBusinessId));
    else if (bill?.receiveWalkinId) params.set("receive_walkin_id", String(bill.receiveWalkinId));
    navigate(`/recipient-close?${params.toString()}`, { state: { deliveryRecipient: recipient, selectedSerialKey } });
  };
  const serialIndex = useMemo(() => {
    const index = new Map<string, { recipient: Deliveries["recipients"][number]; selectedSerialKey: string }>();
    for (const recipient of deliveries?.recipients || []) {
      for (const bill of recipient.bills) {
        for (const item of bill.serials) {
          if (item.completed) continue;
          index.set(item.serialNo.trim().toLocaleUpperCase(), {
            recipient,
            selectedSerialKey: JSON.stringify([item.id, item.serialNo]),
          });
        }
      }
    }
    return index;
  }, [deliveries]);

  const searchSerial = (value: string) => {
    const searched = value.trim();
    if (!searched) return;
    setSerial(searched);
    setSearchError("");
    const match = serialIndex.get(searched.toLocaleUpperCase());
    if (!match) {
      setSearchError("ไม่พบ SN นี้ในรายการสินค้าที่กำลังนำจ่าย");
      return;
    }
    openRecipient(match.recipient, match.selectedSerialKey);
  };
  useEffect(() => {
    let current = true;
    void getDeliveries()
      .then((data) => {
        if (current) setDeliveries(data);
      })
      .catch(() => {
        if (current) setError("ไม่สามารถโหลดรายการสินค้าบนรถได้");
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, []);

  const visibleRecipients = deliveries?.recipients ?? [];

  return (
    <section className="flex w-full flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold">รายการสินค้าบนรถ</h1>
          {!isContractor && (
            <button type="button" onClick={() => navigate("/mileage/close")} className="flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/40 bg-white/15 px-3 text-sm font-bold text-white active:bg-white/25">
              <Gauge size={19} aria-hidden="true" />
              ปิดไมล์
            </button>
          )}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-4 text-center">
          <div>
            <b className="block text-xl">{deliveries?.recipientCount ?? "-"}</b>
            <span className="text-sm font-semibold text-blue-100">ผู้รับ</span>
          </div>
          <div>
            <b className="block text-xl">{deliveries?.billCount ?? "-"}</b>
            <span className="text-sm font-semibold text-blue-100">บิล</span>
          </div>
          <div>
            <b className="block text-xl">{deliveries?.serialCount ?? "-"}</b>
            <span className="text-sm font-semibold text-blue-100">SN</span>
          </div>
        </div>
      </div>
      <form
        className="flex min-h-[76px] items-center gap-2 rounded-3xl border border-blue-100 bg-white p-2 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          setSearchError("");
          searchSerial(serial);
        }}
      >
        <input
          value={serial}
          onChange={(event) => {
            setSerial(event.target.value);
            if (!event.target.value.trim()) {
              setSearchError("");
            }
          }}
          placeholder="ยิงหรือพิมพ์ Serial No"
          aria-label="ค้นหา Serial No"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] font-medium outline-none"
        />
        <button
          type="submit"
          disabled={!serial.trim()}
          aria-label="ค้นหา SN"
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white disabled:bg-slate-300"
        >
          <Search size={25} strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => {
            setSearchError("");
            setCameraOpen(true);
          }}
          aria-label="เปิดกล้องเพื่อค้นหา SN"
          className="flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-blue-100 text-blue-700 active:bg-blue-200 disabled:opacity-50"
        >
          <ScanLine size={27} strokeWidth={2.2} />
        </button>
      </form>
      {searchError ? (
        <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
          {searchError}
        </p>
      ) : null}
      <h2 className="text-lg font-bold text-slate-900">ผู้รับสินค้า</h2>
      {loading ? <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500">กำลังโหลดรายการ...</p> : null}
      {error ? (
        <p role="alert" className="rounded-2xl bg-red-50 p-4 text-center text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {!loading && !error && !visibleRecipients.length ? (
        <p className="rounded-2xl bg-white p-4 text-center text-sm text-slate-500">ไม่มีรายการสินค้าที่กำลังนำจ่าย</p>
      ) : null}
      <div className="grid gap-3">
        {visibleRecipients.map((recipient) => (
          <button
            key={recipient.key}
            type="button"
            onClick={() => openRecipient(recipient)}
            className="flex w-full items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm active:bg-slate-50"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block break-words text-base font-bold text-slate-900">{recipient.name}</span>
              <span className="mt-1 flex items-start gap-1 text-sm font-medium text-slate-500">
                <MapPin size={15} className="mt-0.5 shrink-0" />
                {recipient.address}
              </span>
              <span className="mt-1 flex items-start gap-1 text-sm font-medium text-slate-500">
                <Phone size={15} className="mt-0.5 shrink-0" />
                {recipient.phones?.length ? recipient.phones.join(", ") : "ไม่ระบุเบอร์โทร"}
              </span>
              <span className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-700">{recipient.billCount} บิล</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-700">{recipient.serialCount} SN</span>
              </span>
            </span>
            <ChevronRight size={20} className="mt-1 shrink-0 text-slate-400" />
          </button>
        ))}
      </div>
      <CameraScannerModal
        open={cameraOpen}
        title="สแกนค้นหา SN"
        guide="เล็งกล้องไปที่บาร์โค้ดหรือ QR Code"
        showFrame
        onClose={() => setCameraOpen(false)}
        onScan={searchSerial}
      />
    </section>
  );
}
