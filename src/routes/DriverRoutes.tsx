import { Navigate as RouterRedirect, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import DeliveryTruckDispatch from "../pages/DeliveryTruckDispatch";
import DeliveryTruckCreate from "../pages/DeliveryTruckCreate";
import DeliveryTruckScan from "../pages/DeliveryTruckScan";
import Home from "../pages/Home";
import Jobs from "../pages/Jobs";
import Chat from "../pages/Chat";
import TaskMenu from "../pages/TaskMenu";
import Menu from "../pages/Menu";
import MenuProfile from "../pages/MenuProfile";
import MenuJobHistory from "../pages/MenuJobHistory";
import MenuContact from "../pages/MenuContact";
import Deliveries from "../pages/Deliveries";
import RecipientClose from "../pages/RecipientClose";
import DriverLayout from "../layout/DriverLayout";
import type { DriverScreen, Navigate } from "../types/driver";

const toNumber = (value?: string) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
};

function screenFromPath(pathname: string): DriverScreen {
  if (pathname === "/deliveries") return "DELIVERIES";
  if (pathname === "/mockup/recipient-close" || pathname.startsWith("/mockup/recipient-close/")) return "MOCKUP_RECIPIENT_CLOSE";
  if (pathname === "/menu") return "MENU";
  if (pathname === "/menu/profile") return "PROFILE";
  if (pathname === "/menu/job-history") return "JOB_HISTORY";
  if (pathname === "/menu/contact") return "CONTACT";
  if (pathname === "/jobs") return "JOBS";
  if (pathname === "/work-menu") return "WORK_MENU";
  if (pathname === "/delivery-trucks/create") return "DELIVERY_CREATE";
  if (pathname.endsWith("/close")) return "CLOSE";
  if (pathname.includes("/delivery-trucks/")) return "DELIVERY_SCAN";
  if (pathname === "/mockup/chat") return "MOCKUP_CHAT";
  return "HOME";
}

function pathFor(screen: DriverScreen, id?: number) {
  switch (screen) {
    case "HOME": return "/home";
    case "DELIVERIES": return "/deliveries";
    case "MOCKUP_RECIPIENT_CLOSE": return id ? `/mockup/recipient-close/${id}` : "/mockup/recipient-close";
    case "MENU": return "/menu";
    case "PROFILE": return "/menu/profile";
    case "JOB_HISTORY": return "/menu/job-history";
    case "CONTACT": return "/menu/contact";
    case "WORK_MENU": return "/work-menu";
    case "JOBS": return "/jobs";
    case "DELIVERY_CREATE": return "/delivery-trucks/create";
    case "DELIVERY_SCAN": return id ? `/delivery-trucks/${id}/scan` : "/jobs";
    case "CLOSE": return id ? `/delivery-trucks/${id}/close` : "/jobs";
    case "MOCKUP_CHAT": return "/mockup/chat";
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
  const screen = screenFromPath(location.pathname);
  const go: Navigate = (next, id) => navigate(pathFor(next, id));
  const onBack = () => navigate(-1);

  return <DriverLayout go={go} onBack={onBack} screen={screen}>
    <Routes>
      <Route path="/" element={<RouterRedirect to="/home" replace />} />
      <Route path="/home" element={<Home go={go} />} />
      <Route path="/deliveries" element={<Deliveries go={go} />} />
      <Route path="/mockup/recipient-close" element={<RecipientClose />} />
      <Route path="/mockup/recipient-close/:recipientId" element={<RecipientClose />} />
      <Route path="/menu" element={<Menu go={go} />} />
      <Route path="/menu/profile" element={<MenuProfile />} />
      <Route path="/menu/job-history" element={<MenuJobHistory />} />
      <Route path="/menu/contact" element={<MenuContact />} />
      <Route path="/work-menu" element={<TaskMenu go={go} />} />
      <Route path="/jobs" element={<Jobs go={go} />} />
      <Route path="/delivery-trucks/create" element={<DeliveryTruckCreate go={go} />} />
      <Route path="/delivery-trucks/:truckLoadId/scan" element={<ScanRoute go={go} onBack={onBack} />} />
      <Route path="/delivery-trucks/:truckLoadId/close" element={<CloseRoute />} />
      <Route path="/mockup/chat" element={<Chat go={go} />} />
      <Route path="*" element={<RouterRedirect to="/home" replace />} />
    </Routes>
  </DriverLayout>;
}
