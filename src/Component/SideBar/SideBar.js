import {
  Home,
  BarChart3,
  Package,
  DollarSign,
  FileText,
  Settings,
  Box,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../AppContext";
import { useAuth } from "../../AuthContext";
import { useSync } from "../../SyncContext";
import { countLowStock } from "../../utils/stock";
import "./SideBar.scss";

const SYNC_LABELS = {
  loading: "Yüklənir...",
  saving: "Saxlanılır...",
  saved: "Saxlanıldı",
  offline: "Offline: lokal saxlanılır",
  error: "Sinxronizasiya xətası",
};

export const SideBar = () => {
  const { state } = useApp();
  const { user, offline } = useAuth();
  const { status, signOut } = useSync();
  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "İstifadəçi";
  const syncKey = offline ? "offline" : status;
  const lowStock = countLowStock(state.anbar);

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Box className="logo-icon" />
        <div>
          <div className="logo-title">Hesabla</div>
          <div className="logo-subtitle">Anbar və Pul Axını Sistemi</div>
        </div>
      </div>
      <nav className="sidebar__menu">
        <ul>
          <li className="menu-item">
            <NavLink to="/" className="menu-item">
              <Home size={40} />
              <div className="Menu-item-text">Ana Səhifə</div>
            </NavLink>
          </li>

          <li className="menu-item">
            <NavLink to="/dashboard" className="menu-item">
              <BarChart3 size={40} />
              <div className="Menu-item-text">İdarə Paneli</div>
            </NavLink>
          </li>

          <li className="menu-item">
            <NavLink to="/warehouse" className="menu-item">
              <Package size={40} />
              <div className="Menu-item-text">Anbar</div>
              {lowStock > 0 && (
                <span
                  className="menu-badge"
                  title={`${lowStock} məhsulun stoku azdır`}
                >
                  {lowStock > 99 ? "99+" : lowStock}
                </span>
              )}
            </NavLink>
          </li>

          <li className="menu-item">
            <NavLink to="/purchases" className="menu-item">
              <ShoppingCart size={40} />
              <div className="Menu-item-text">Alışlar</div>
            </NavLink>
          </li>

          <li className="menu-item">
            <NavLink to="/cashflow" className="menu-item">
              <DollarSign size={40} />
              <div className="Menu-item-text">Pul Axını</div>
            </NavLink>
          </li>

          <li className="menu-item">
            <NavLink to="/report" className="menu-item">
              <FileText size={40} />
              <div className="Menu-item-text">Hesabatlar</div>
            </NavLink>
          </li>

          <li className="menu-item">
            <NavLink to="/settings" className="menu-item">
              <Settings size={40} />
              <div className="Menu-item-text">Parametrlər</div>
            </NavLink>
          </li>
        </ul>
      </nav>
      {SYNC_LABELS[syncKey] && (
        <div className={`sync-status ${syncKey}`} role="status">
          <span className="dot" />
          {SYNC_LABELS[syncKey]}
        </div>
      )}

      {/* USER */}
      <div className="sidebar__user-row">
        <NavLink to={"/usepanels"} className="sidebar__user">
          <div className="user-avatar">
            {(user?.firstName || "İ").charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <div className="user-name">{fullName}</div>
            <div className="user-email">{user?.email || ""}</div>
          </div>
        </NavLink>
        <button
          type="button"
          className="logout-btn"
          onClick={signOut}
          title="Çıxış"
          aria-label="Çıxış"
        >
          <LogOut size={22} />
        </button>
      </div>
    </aside>
  );
};
