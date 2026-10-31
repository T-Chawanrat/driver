import { Check, PackageMinus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import ConfirmModal from "../components/ConfirmModal";
import CameraScannerModal from "../components/camera/CameraScannerModal";
import SerialScanInput from "../components/SerialScanInput";
import AxiosInstance from "../services/http";
import { removeSpaces } from "../utils/textSanitizer";

type FailedProduct = {
  serial_id: string;
  serial_no: string;
  receive_code: string | null;
};

export default function ReturnWarehouse() {
  const [serial, setSerial] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [selectedSerials, setSelectedSerials] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [failedProducts, setFailedProducts] = useState<FailedProduct[]>([]);
  const [scannedSerials, setScannedSerials] = useState<string[]>([]);
  const [failedLoading, setFailedLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const loadFailedProducts = useCallback(async () => {
    try {
      setFailedLoading(true);
      const { data } = await AxiosInstance.get<{ data?: FailedProduct[] }>("/driver/returns/failed");
      setFailedProducts(data.data || []);
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "ไม่สามารถโหลดรายการส่งไม่สำเร็จได้");
    } finally {
      setFailedLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFailedProducts();
  }, [loadFailedProducts]);

  const addSerial = (value: string) => {
    const serialNo = removeSpaces(value).trim().toLocaleUpperCase();
    if (!serialNo) return;
    setSerial("");
    if (selectedSerials.includes(serialNo)) {
      setNotice(`เลือก SN ${serialNo} แล้ว`);
      return;
    }
    if (!failedProducts.some((product) => product.serial_no === serialNo)) {
      setScannedSerials((current) => current.includes(serialNo) ? current : [...current, serialNo]);
    }
    setSelectedSerials((current) => [...current, serialNo]);
    setNotice("");
  };

  const toggleSerial = (serialNo: string, scanned = false) => {
    const selected = selectedSerials.includes(serialNo);
    if (selected && scanned) setScannedSerials((current) => current.filter((value) => value !== serialNo));
    setSelectedSerials((current) => selected ? current.filter((value) => value !== serialNo) : [...current, serialNo]);
  };

  const confirmReturn = async () => {
    if (!selectedSerials.length || saving) return;
    setSaving(true);
    setNotice("");
    try {
      const { data } = await AxiosInstance.post("/driver/returns", { serial_nos: selectedSerials });
      setSelectedSerials([]);
      setScannedSerials([]);
      setNotice(data.message || "คืนสินค้าเข้าคลังสำเร็จ");
      await loadFailedProducts();
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "ไม่สามารถคืนสินค้าเข้าคลังได้");
    } finally {
      setSaving(false);
    }
  };

  const returnItems = [
    ...failedProducts.map((product) => ({ ...product, scanned: false })),
    ...scannedSerials.map((serial_no) => ({ serial_id: serial_no, serial_no, receive_code: null, scanned: true })),
  ];

  return (
    <section className="flex w-full flex-col gap-4 px-4 pb-24 pt-5 sm:px-6">
      <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-blue-600 p-5 text-white shadow-xl shadow-blue-600/20">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15"><PackageMinus size={26} /></span>
          <div>
            <h1 className="text-lg font-bold">คืนสินค้าเข้าคลัง</h1>
            <p className="mt-1 text-sm font-medium text-blue-100">สแกน SN ที่นำกลับจากรถ</p>
          </div>
        </div>
        <div className="mt-4 border-t border-white/20 pt-4 text-sm font-semibold text-blue-100">
          เลือกคืนคลัง {selectedSerials.length} SN
        </div>
      </div>

      <SerialScanInput
        value={serial}
        placeholder="ยิงหรือพิมพ์ Serial No"
        inputLabel="ค้นหา Serial No เพื่อคืนคลัง"
        searchLabel="เพิ่ม SN"
        cameraLabel="เปิดกล้องเพื่อสแกน SN"
        onValueChange={setSerial}
        onSubmit={() => addSerial(serial)}
        onOpenCamera={() => setCameraOpen(true)}
      />

      {notice ? <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">{notice}</p> : null}

      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">รายการส่งไม่สำเร็จ</h2>
        </div>
        <span className="shrink-0 text-sm font-bold text-blue-700">เลือก {selectedSerials.length} SN</span>
      </div>
      {failedLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-500">กำลังโหลดรายการ...</div>
      ) : !returnItems.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center text-sm font-medium text-slate-500">ไม่มีรายการส่งไม่สำเร็จบนรถ</div>
      ) : (
        <div className="grid gap-2">
          {returnItems.map((product) => {
            const selected = selectedSerials.includes(product.serial_no);
            return (
              <button
                key={`${product.serial_id}-${product.serial_no}`}
                type="button"
                onClick={() => toggleSerial(product.serial_no, product.scanned)}
                className={`flex min-h-[60px] items-center gap-2.5 rounded-2xl border px-2.5 text-left shadow-sm transition active:scale-[.99] ${selected ? "border-blue-300 bg-blue-50" : "border-slate-200 bg-white"}`}
              >
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-transparent"}`}>
                  <Check size={16} strokeWidth={3} />
                </span>
                <span className="ml-1 grid min-w-0 flex-1 gap-0.5">
                  <code className="break-all text-[15px] font-semibold text-slate-700">{product.serial_no}</code>
                  <span className="text-xs font-semibold text-slate-500">{product.receive_code || "สแกนเพิ่ม"}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <button type="button" disabled={!selectedSerials.length || saving} onClick={() => setConfirmOpen(true)} className="h-12 rounded-xl bg-blue-600 text-[15px] font-bold text-white disabled:bg-slate-300">
        {saving ? "กำลังคืนสินค้า..." : "ยืนยันคืนคลัง"}
      </button>
      <ConfirmModal
        open={confirmOpen}
        title="ยืนยันคืนสินค้าเข้าคลัง"
        description={`คืนสินค้า ${selectedSerials.length} SN เข้าคลัง`}
        confirmLabel={saving ? "กำลังคืนสินค้า..." : "ยืนยัน"}
        disabled={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); void confirmReturn(); }}
      />

      <CameraScannerModal
        open={cameraOpen}
        title="สแกน SN คืนคลัง"
        guide="จัดบาร์โค้ดให้อยู่ในกรอบ"
        showFrame
        onClose={() => setCameraOpen(false)}
        onScan={addSerial}
      />
    </section>
  );
}
