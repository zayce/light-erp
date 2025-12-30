import {
  Home,
  BarChart3,
  Package,
  DollarSign,
  FileText,
  Settings,
  Box,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import "./SideBar.scss";

export const SideBar = () => {
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
            </NavLink>
          </li>

          <li className="menu-item">
            <NavLink to="/cashflow" className="menu-item">
              <DollarSign size={40} />
              <div className="Menu-item-text">Pul Axını</div>
            </NavLink>
          </li>

          <li className="menu-item">
            <NavLink to="/reports" className="menu-item">
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
      {/* USER */}{" "}
      <div className="sidebar__user">
        {" "}
        <div className="user-avatar">İ</div>{" "}
        <div className="user-info">
          {" "}
          <div className="user-name">İstifadəçi</div>{" "}
          <div className="user-email">admin@hesabla.az</div>{" "}
        </div>{" "}
      </div>
    </aside>
  );
};
