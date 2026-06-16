import { create } from "zustand";
import { mockUser } from "./mockData";

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    await new Promise(r => setTimeout(r, 600));
    const ok = (email === "admin@crm.dev" && password === "admin123")
            || (email === "rop@crm.dev" && password === "rop123")
            || (email === "manager@crm.dev" && password === "manager123");
    if (!ok) { set({ loading: false }); throw new Error("Invalid credentials"); }
    const role = email.startsWith("admin") ? "admin" : email.startsWith("rop") ? "rop" : "manager";
    const user = { ...mockUser, email, role, full_name: email.startsWith("admin") ? "Алексей Петров" : email.startsWith("rop") ? "Марина Козлова" : "Иван Сидоров" };
    localStorage.setItem("token", "mock-token");
    set({ token: "mock-token", user, loading: false });
  },

  logout: () => { localStorage.removeItem("token"); set({ user: null, token: null }); },

  fetchMe: async () => {
    const token = localStorage.getItem("token");
    if (token) set({ user: mockUser, token });
    else set({ user: null, token: null });
  },
}));
