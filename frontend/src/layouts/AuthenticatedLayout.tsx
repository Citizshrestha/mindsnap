// AuthenticatedLayout.tsx
import { Outlet, useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Sidebar from "../components/sidebar/Sidebar";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { useEffect, useState } from "react";

const AuthenticatedLayout: React.FC = () => {
  const navigate = useNavigate();
  const { username, _id } = useSelector((state: RootState) => state.user);
  const [isChecking, setIsChecking] = useState(true);

  // Redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId");
      
      // Check if user has valid authentication
      if (!token || !userId || !_id || username === "Guest") {
        console.log("Authentication check failed:", { token: !!token, userId: !!userId, _id: !!_id, username });
        navigate("/", { replace: true });
        return;
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [navigate, username, _id]);

  // Show loading or nothing while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - No longer needs unreadCount prop */}
      <Header />

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