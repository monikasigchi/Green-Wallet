import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Recycle, Wallet, ShoppingBag, Package, CheckCircle2, PlusCircle, ClipboardList, ScanLine, UserRound, LogOut, Bell, Menu, X, Leaf, ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Brand } from "../components/UI";
const household = [
  ["Overview","/app",LayoutDashboard],["Schedule pickup","/app/schedule",CalendarDays],["My pickups","/app/pickups",Recycle],["Rewards wallet","/app/wallet",Wallet],["Green marketplace","/app/marketplace",ShoppingBag],["Active orders","/app/orders",Package],["Completed orders","/app/completed",CheckCircle2],["Profile & settings","/app/profile",UserRound]
];
const collector = [
  ["Overview","/app",LayoutDashboard],["Available pickups","/app/available",CalendarDays],["My accepted pickups","/app/assigned",ClipboardList],["Verify waste","/app/verify",ScanLine],["Completed pickups","/app/completed-pickups",CheckCircle2],["Profile & settings","/app/profile",UserRound]
];
const organisation = [
  ["Overview","/app",LayoutDashboard],["Add product","/app/add-product",PlusCircle],["Manage products","/app/products",ShoppingBag],["Incoming orders","/app/incoming",ClipboardList],["Dispatched orders","/app/dispatched",Package],["Completed orders","/app/completed",CheckCircle2],["Profile & settings","/app/profile",UserRound]
];
export default function AppLayout() {
  const { user, logout } = useAuth(), navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = user?.role === "collector" ? collector : user?.role === "organisation" ? organisation : household;
  async function signOut() { await logout(); navigate("/signin"); }
  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Brand/><button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)}><X size={18}/></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="side-nav">{items.map(([label,to,Icon])=><NavLink key={to} to={to} end={to==="/app"} onClick={()=>setMobileOpen(false)} className={({isActive})=>`side-link ${isActive?"active":""}`}><Icon size={18}/><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="impact-mini"><span><Leaf size={18}/></span><div><b>Small actions matter</b><small>Every pickup counts.</small></div></div><button className="side-link logout-link" onClick={signOut}><LogOut size={18}/><span>Sign out</span></button></div>
    </aside>
    {mobileOpen && <button className="sidebar-scrim" onClick={()=>setMobileOpen(false)} aria-label="Close navigation"/>}
    <div className="app-main">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={()=>setMobileOpen(true)}><Menu size={20}/></button><div className="crumb"><span>Green Wallet</span><span className="crumb-slash">/</span><b>{items.find(i=>i[1]===window.location.pathname)?.[0] || "Workspace"}</b></div><div className="topbar-right"><button className="icon-btn" title="Notifications" onClick={()=>navigate("/app/notifications")}><Bell size={18}/></button><div className="user-chip"><span className="avatar">{(user?.name||"G").slice(0,1).toUpperCase()}</span><span><b>{user?.name}</b><small>{user?.role==="organisation"?"Organisation":user?.role==="collector"?"Local collector":"Household"}</small></span></div></div></header>
      <main className="page-content"><Outlet/></main>
      <footer className="app-footer"><span>© {new Date().getFullYear()} Green Wallet</span><span>Turn Waste into Worth <Leaf size={13}/></span></footer>
    </div>
  </div>;
}
