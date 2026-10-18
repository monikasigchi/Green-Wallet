import { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null), [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/auth/me").then(r => setUser(r.data.user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  async function login(data) { const r = await api.post("/auth/login", data); setUser(r.data.user); return r.data.user; }
  async function register(data) { const r = await api.post("/auth/register", data); setUser(r.data.user); return r.data.user; }
  async function logout() { try { await api.post("/auth/logout"); } finally { setUser(null); } }
  return <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>{children}</AuthContext.Provider>;
}
export const useAuth = () => useContext(AuthContext);
