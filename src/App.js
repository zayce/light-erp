import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SideBar } from "./Component/SideBar/SideBar";
import { StockAlerts } from "./Component/StockAlerts/StockAlerts";
import "flag-icons/css/flag-icons.min.css";
import { ControlPanel } from "./pages/ControlPanel/ControlPanel";
import { AppProvider } from "./AppContext";
import { AuthProvider, useAuth } from "./AuthContext";
import { SyncProvider } from "./SyncContext";
import { Anbar } from "./pages/Anbar/Anbar";
import "./App.scss";
import { CashFlow } from "./pages/CashFlow/CashFlow";
import { LandingPage } from "./pages/Welcome/Welcome";
import { Login } from "./pages/Login/Login";
import { Purchases } from "./pages/Purchases/Purchases";
import { Report } from "./pages/Reports/Report";
import { Settings } from "./pages/Settings/Settings";
import { UserProfile } from "./pages/Useprofile/UserProfile";

const PUBLIC_PATHS = ["/", "/login"];

// Sends visitors without a session to the login page and back afterwards.
const RequireAuth = ({ children }) => {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <div className="Auth-Loading">Yüklənir...</div>;
  }
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
};

const Layout = () => {
  const location = useLocation();
  const isPublicPage = PUBLIC_PATHS.includes(location.pathname);

  return (
    <div className="App-Wrapper">
      {!isPublicPage && <SideBar />}

      <div className={isPublicPage ? "FullScreen" : "App-Content"}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          <Route path="/usepanels" element={<RequireAuth><UserProfile /></RequireAuth>} />
          <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
          <Route path="/report" element={<RequireAuth><Report /></RequireAuth>} />
          <Route path="/dashboard" element={<RequireAuth><ControlPanel /></RequireAuth>} />
          <Route path="/warehouse" element={<RequireAuth><Anbar /></RequireAuth>} />
          <Route path="/purchases" element={<RequireAuth><Purchases /></RequireAuth>} />
          <Route path="/cashflow" element={<RequireAuth><CashFlow /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppProvider>
        <SyncProvider>
          <StockAlerts />
          <BrowserRouter>
            <Layout />
          </BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </SyncProvider>
      </AppProvider>
    </AuthProvider>
  );
};

export default App;
