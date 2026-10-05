import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SideBar } from "./Component/SideBar/SideBar";
import "flag-icons/css/flag-icons.min.css";
import { ControlPanel } from "./pages/ControlPanel/ControlPanel";
import { AppProvider } from "./AppContext";
import { Anbar } from "./pages/Anbar/Anbar";
import "./App.scss";
import { CashFlow } from "./pages/CashFlow/CashFlow";
import { LandingPage } from "./pages/Welcome/Welcome";
import { Report } from "./pages/Reports/Report";
import { Settings } from "./pages/Settings/Settings";
import { UserProfile } from "./pages/Useprofile/UserProfile";

// 👉 отдельный layout внутри
const Layout = () => {
  const location = useLocation();

  const isWelcomePage = location.pathname === "/";

  return (
    <div className="App-Wrapper">
      {/* ❌ скрываем sidebar на welcome */}
      {!isWelcomePage && <SideBar />}

      <div className={isWelcomePage ? "FullScreen" : "App-Content"}>
        <Routes>
          <Route path="/usepanels" element={<UserProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/report" element={<Report />} />
          <Route path="/dashboard" element={<ControlPanel />} />
          <Route path="/warehouse" element={<Anbar />} />
          <Route path="/cashflow" element={<CashFlow />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout />
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </AppProvider>
  );
};

export default App;
