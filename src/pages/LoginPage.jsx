import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const s = {
  page: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117" },
  card: { background: "#13162b", border: "1px solid #2a2d4a", borderRadius: 12, padding: "40px 36px", width: 360 },
  title: { fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 8, textAlign: "center" },
  sub: { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 28 },
  label: { display: "block", fontSize: 12, color: "#8892b0", marginBottom: 6, fontWeight: 500 },
  input: { width: "100%", background: "#0f1117", border: "1px solid #2a2d4a", borderRadius: 8, padding: "10px 12px", color: "#e2e8f0", fontSize: 14, marginBottom: 16, outline: "none" },
  btn: { width: "100%", background: "#7c83f7", color: "#fff", border: "none", borderRadius: 8, padding: "12px", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  hint: { marginTop: 20, padding: 12, background: "#0f1117", borderRadius: 8, fontSize: 12, color: "#6b7280", lineHeight: 1.6 },
};

export default function LoginPage() {
  const [email, setEmail] = useState("admin@crm.dev");
  const [password, setPassword] = useState("admin123");
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/chess");
    } catch {
      toast.error("Неверный email или пароль");
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>🏢 CRM Застройщик</div>
        <div style={s.sub}>Войдите в систему управления продажами</div>
        <form onSubmit={submit}>
          <label style={s.label}>Email</label>
          <input style={s.input} value={email} onChange={e => setEmail(e.target.value)} type="email" required />
          <label style={s.label}>Пароль</label>
          <input style={s.input} value={password} onChange={e => setPassword(e.target.value)} type="password" required />
          <button style={s.btn} type="submit" disabled={loading}>{loading ? "Вход..." : "Войти"}</button>
        </form>
        <div style={s.hint}>
          <strong style={{ color: "#7c83f7" }}>Demo:</strong><br />
          admin@crm.dev / admin123<br />
          rop@crm.dev / rop123<br />
          manager@crm.dev / manager123
        </div>
      </div>
    </div>
  );
}
