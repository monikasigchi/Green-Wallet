import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./layouts/AppLayout";
import { Landing, AuthPage } from "./pages/PublicPages";
import { Spinner } from "./components/UI";
import { CompletedPickups, DashboardHome, Marketplace, NotificationsPage, OrdersPage, PickupList, ProductManagement, ProfilePage, SchedulePickup, VerifyWaste, WalletPage } from "./pages/DashboardPages";
function Protected({ roles, children }) {
 const { user, loading } = useAuth();
 if (loading) return <Spinner label="Checking your session…"/>;
 if (!user) return <Navigate to="/signin" replace/>;
 if (roles && !roles.includes(user.role)) return <Navigate to="/app" replace/>;
 return children;
}
function RolePage({roles,children}){return <Protected roles={roles}><AppLayout/></Protected>;}
export default function App() {
 const {user,loading}=useAuth();
 if(loading)return <div className="initial-loading"><Spinner label="Loading Green Wallet…"/></div>;
 return <Routes>
  <Route path="/" element={user?<Navigate to="/app" replace/>:<Landing/>}/>
  <Route path="/signin" element={user?<Navigate to="/app" replace/>:<AuthPage mode="signin"/>}/>
  <Route path="/signup" element={user?<Navigate to="/app" replace/>:<AuthPage mode="signup"/>}/>
  <Route path="/app" element={<Protected><AppLayout/></Protected>}>
   <Route index element={<DashboardHome/>}/>
   <Route path="schedule" element={<Protected roles={["household"]}><SchedulePickup/></Protected>}/>
   <Route path="pickups" element={<Protected roles={["household"]}><PickupList/></Protected>}/>
   <Route path="wallet" element={<Protected roles={["household"]}><WalletPage/></Protected>}/>
   <Route path="marketplace" element={<Protected roles={["household"]}><Marketplace/></Protected>}/>
   <Route path="orders" element={<Protected roles={["household"]}><OrdersPage/></Protected>}/>
   <Route path="completed" element={<Protected roles={["household","organisation"]}><OrdersPage completed/></Protected>}/>
   <Route path="available" element={<Protected roles={["collector"]}><PickupList collector/></Protected>}/>
   <Route path="assigned" element={<Protected roles={["collector"]}><PickupList collector assigned/></Protected>}/>
   <Route path="verify" element={<Protected roles={["collector"]}><VerifyWaste/></Protected>}/>
   <Route path="completed-pickups" element={<Protected roles={["collector"]}><CompletedPickups/></Protected>}/>
   <Route path="add-product" element={<Protected roles={["organisation"]}><ProductManagement addOnly/></Protected>}/>
   <Route path="products" element={<Protected roles={["organisation"]}><ProductManagement/></Protected>}/>
   <Route path="incoming" element={<Protected roles={["organisation"]}><OrdersPage organisation/></Protected>}/>
   <Route path="dispatched" element={<Protected roles={["organisation"]}><OrdersPage organisation dispatched/></Protected>}/>
   <Route path="profile" element={<ProfilePage/>}/>
   <Route path="notifications" element={<NotificationsPage/>}/>
  </Route>
  <Route path="*" element={<Navigate to={user?"/app":"/"} replace/>}/>
 </Routes>;
}
