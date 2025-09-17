import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useEffect } from "react";
import { selectUnreadCount } from "../redux/slices/notificationSlice";

const AuthenticatedLayout: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useSelector((state: RootState) => state.user);
  const unreadCount = useSelector(selectUnreadCount); // Get unread count from Redux

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token || !username) {
      navigate("/");
    }
  }, [navigate, username]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Pass unreadCount as a prop */}
      <Header unreadCount={unreadCount} />

      {/* Main Content Area with Sidebar and Outlet */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 p-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AuthenticatedLayout;