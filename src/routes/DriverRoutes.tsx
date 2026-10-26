import { Navigate as RouterRedirect, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import DeliveryTruckDispatch from "../pages/DeliveryTruckDispatch";
import DeliveryTruckCreate from "../pages/DeliveryTruckCreate";
import DeliveryTruckScan from "../pages/DeliveryTruckScan";
import Home from "../pages/Home";
import Jobs from "../pages/Jobs";
import IssueChat from "../pages/IssueChat";
import IssueInbox from "../pages/IssueInbox";
import TaskMenu from "../pages/TaskMenu";
import Menu from "../pages/Menu";
import MenuProfile from "../pages/MenuProfile";
import MenuJobHistory from "../pages/MenuJobHistory";
import MenuContact from "../pages/MenuContact";
import RecipientList from "../pages/RecipientList";
import RecipientClose from "../pages/RecipientClose";
import IssueReason from "../pages/IssueReason";
import MileageOpen from "../pages/MileageOpen";
import MileageClose from "../pages/MileageClose";
import { useDriverAuth } from "../context/AuthContext";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import AxiosInstance from "../services/http";
import DriverLayout from "../layout/DriverLayout";
import type { DriverScreen, Navigate } from "../types/driver";

const toNumber = (value?: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

function screenFromPath(pathname: string): DriverScreen {
  if (pathname === "/recipients") return "DELIVERIES";
  if (pathname === "/mileage/open") return "MILEAGE_OPEN";
  if (pathname === "/mileage/close") return "MILEAGE_CLOSE";
  if (pathname === "/recipient-close" || pathname.startsWith("/recipient-close/")) return "RECIPIENT_CLOSE";
  if (pathname === "/menu") return "MENU";
  if (pathname === "/menu/profile") return "PROFILE";
  if (pathname === "/menu/job-history") return "JOB_HISTORY";
  if (pathname === "/menu/contact") return "CONTACT";
  if (pathname === "/jobs") return "JOBS";
  if (pathname === "/work-menu") return "WORK_MENU";
  if (pathname === "/trucks/create") return "DELIVERY_CREATE";
  if (pathname.endsWith("/close")) return "CLOSE";
  if (pathname.includes("/trucks/")) return "DELIVERY_SCAN";
  if (pathname === "/issues" || pathname.startsWith("/issues/")) return "ISSUES";
  return "HOME";
}

function pathFor(screen: DriverScreen, id?: number) {
  switch (screen) {
    case "HOME": return "/home";
    case "DELIVERIES": return "/recipients";
    case "MILEAGE_OPEN": return "/mileage/open";
    case "MILEAGE_CLOSE": return "/mileage/close";
    case "RECIPIENT_CLOSE": return id ? `/recipient-close/${id}` : "/recipient-close";
    case "MENU": return "/menu";
    case "PROFILE": return "/menu/profile";
    case "JOB_HISTORY": return "/menu/job-history";
    case "CONTACT": return "/menu/contact";
    case "WORK_MENU": return "/work-menu";
    case "JOBS": return "/jobs";
    case "DELIVERY_CREATE": return "/trucks/create";
    case "DELIVERY_SCAN": return id ? `/trucks/${id}/scan` : "/jobs";
    case "CLOSE": return id ? `/trucks/${id}/close` : "/jobs";
    case "ISSUES": return "/issues";
    default: return "/home";
  }
}

function ScanRoute({ go, onBack }: { go: Navigate; onBack: () => void }) {
  const { truckLoadId } = useParams();
  const id = toNumber(truckLoadId);
  return <DeliveryTruckScan id={id} onBack={onBack} onClose={() => go("CLOSE", id)} />;
}

function CloseRoute() {
  const { truckLoadId } = useParams();
  return <DeliveryTruckDispatch id={toNumber(truckLoadId)} />;
}

export default function DriverRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { driver } = useDriverAuth();
  const [mileage, setMileage] = useState<{ id: number; license_plate: string | null; license_plate_province: string | null } | null>(null);
  const [mileageLoading, setMileageLoading] = useState(true);
  const [mileageError, setMileageError] = useState("");
  const refreshMileage = useCallback(async () => {
    setMileageLoading(true);
    setMileageError("");
    try {
      const { data } = await AxiosInstance.get("/driver/mileage/current");
      setMileage(data.data || null);
    } catch {
      setMileageError("ไม่สามารถตรวจสอบสถานะไมล์ได้ กรุณาลองใหม่");
    } finally {
      setMileageLoading(false);
    }
  }, []);
  useEffect(() => { void refreshMileage(); }, [driver?.id, refreshMileage]);
  const canDeliver = Boolean(mileage);
  const protectedPage = (page: ReactNode) => mileageLoading
    ? <p className="p-4">กำลังตรวจสอบสถานะไมล์...</p>
    : mileageError
      ? <div className="p-4"><p className="text-red-600">{mileageError}</p><button type="button" onClick={() => void refreshMileage()} className="mt-3 rounded-xl bg-blue-600 px-4 py-2 font-bold text-white">ลองอีกครั้ง</button></div>
      : canDeliver ? page : <RouterRedirect to="/mileage/open" replace />;
  const screen = screenFromPath(location.pathname);
  const go: Navigate = (next, id) => navigate(pathFor(next, id));
  const onBack = () => navigate(-1);

  return <DriverLayout go={go} onBack={onBack} screen={screen}>
    <Routes>
      <Route path="/" element={<RouterRedirect to="/home" replace />} />
      <Route path="/home" element={<Home go={go} />} />
      <Route path="/recipients" element={protectedPage(<RecipientList go={go} />)} />
      <Route path="/recipient-close" element={protectedPage(<RecipientClose />)} />
      <Route path="/recipient-close/:recipientId" element={protectedPage(<RecipientClose />)} />
      <Route path="/mileage/open" element={<MileageOpen mileage={mileage} loading={mileageLoading} loadError={mileageError} refresh={refreshMileage} />} />
      <Route path="/mileage/close" element={<MileageClose mileage={mileage} loading={mileageLoading} loadError={mileageError} refresh={refreshMileage} />} />
      <Route path="/menu" element={<Menu go={go} />} />
      <Route path="/menu/profile" element={<MenuProfile />} />
      <Route path="/menu/job-history" element={<MenuJobHistory />} />
      <Route path="/menu/contact" element={<MenuContact />} />
      <Route path="/work-menu" element={<TaskMenu go={go} />} />
      <Route path="/jobs" element={<Jobs go={go} />} />
      <Route path="/trucks/create" element={<DeliveryTruckCreate go={go} />} />
      <Route path="/trucks/:truckLoadId/scan" element={<ScanRoute go={go} onBack={onBack} />} />
      <Route path="/trucks/:truckLoadId/close" element={<CloseRoute />} />
      <Route path="/issues" element={<IssueInbox />} />
      <Route path="/issues/new" element={protectedPage(<IssueReason />)} />
      <Route path="/issues/:deliveryIssueId" element={protectedPage(<IssueChat />)} />
      <Route path="*" element={<RouterRedirect to="/home" replace />} />
    </Routes>
  </DriverLayout>;
}
