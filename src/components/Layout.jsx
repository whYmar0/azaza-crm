import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LayoutGrid, Users, BarChart2, Zap, LogOut } from "lucide-react";

const nav = [
  { to: "/chess", icon: LayoutGrid, label: "Шахматка" },
  { to: "/leads", icon: Users, label: "Лиды" },
  { to: "/dashboard", icon: BarChart2, label: "Дашборд" },
  { to: "/automation", icon: Zap, label: "Автоматизация" },
];

const s = {
  shell: { display: "flex", height: "100vh", overflow: "hidden" },
  sidebar: { width: 220, background: "#13162b", borderRight: "1px solid #2a2d4a", display: "flex", flexDirection: "column", padding: "0 0 16px" },
  logo: { padding: "20px 20px 24px", fontSize: 17, fontWeight: 700, color: "#7c83f7", borderBottom: "1px solid #2a2d4a", marginBottom: 8 },
  navLink: { display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", color: "#8892b0", textDecoration: "none", fontSize: 14, borderRadius: 0, transition: "all .15s" },
  navActive: { color: "#e2e8f0", background: "#1e2235", borderLeft: "3px solid #7c83f7" },
  main: { flex: 1, overflow: "auto", padding: 28, background: "#0f1117" },
  userInfo: { marginTop: "auto", padding: "12px 20px", borderTop: "1px solid #2a2d4a", fontSize: 12, color: "#6b7280" },
  logoutBtn: { background: "none", border: "none", color: "#6b7280", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: "8px 20px", fontSize: 13, width: "100%" },
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={s.shell}>
      <aside style={s.sidebar}>
        <div style={s.logo}>🏢 CRM Застройщик</div>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({ ...s.navLink, ...(isActive ? s.navActive : {}) })}>
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
        <div style={s.userInfo}>{user?.full_name}<br /><span style={{ color: "#4b5563" }}>{user?.role}</span></div>
        <button style={s.logoutBtn} onClick={handleLogout}><LogOut size={14} /> Выйти</button>
      </aside>
      <main style={s.main}>
        <Outlet />
      </main>
    </div>
  );
}
