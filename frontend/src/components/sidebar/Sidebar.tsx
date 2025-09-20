// src/components/Sidebar.tsx
import React, { useState, useEffect } from "react";
import { FaHome, FaEnvelope, FaPaintBrush, FaSignOutAlt } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import "./sidebar.css";
import type { RootState } from "../../redux/store";

import toyHome from "../../../public/images/toyhome.png";
import createPost from "../../../public/images/CreatePosts.png";
import messageImgIcon from "../../../public/images/messages.png";
import themes from "../../../public/images/themes.png";
import logout from "../../../public/images/logout.png";
import { logout as performLogout } from "../../api/auth";
import { useSelector } from "react-redux";
import contacts from "../../../public/images/contacts.png"
import pendingRequest from "../../../public/images/friend request.png"

const Sidebar = () => {
  const [imgErr, setImgErr] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [tooltip, setTooltip] = useState<{
    text: string;
    top: number;
    left: number;
  } | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Redux user data
  const { profilePicture, fullname, username } = useSelector(
    (state: RootState) => state.user
  );

  useEffect(() => {
    if (location.pathname === "/messages") {
      setIsCollapsed(true);
    }
  }, [location.pathname]);

  const sidebarStyle: React.CSSProperties = {
    background: "#611DD0",
    color: "#fff",
    padding: "16px",
    borderRadius: "0 45px 45px 45px",
    height: "calc(97vh - 80px)",
    width: isCollapsed ? "70px" : "250px",
    position: "absolute",
    top: "98px",
    left: "2px",
    display: "flex",
    flexDirection: "column",
    alignItems: isCollapsed ? "center" : "flex-start",
    transition: "width 0.3s ease",
    overflowY: "auto",
    scrollbarWidth: "none",
  };

  const profileStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    padding: "10px",
    borderBottom: "2px solid #F5F6FA",
    marginBottom: "15px",
    width: isCollapsed ? "50px" : "210px",
    justifyContent: isCollapsed ? "center" : "flex-start",
  };

  const linkStyle = (path: string): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    justifyContent: isCollapsed ? "center" : "flex-start",
    textDecoration: "none",
    margin: "15px 10px",
    padding: "10px",
    borderRadius: "50px",
    width: isCollapsed ? "50px" : "210px",
    background: location.pathname === path ? "#F5F6FA" : "transparent",
    color: location.pathname === path ? "#611DD0" : "#F5F6FA",
    fontSize: "16px",
    position: "relative",
    transition: "all 0.3s ease-in",
    cursor: "pointer",
  });

  const showTooltip = (e: React.MouseEvent<HTMLElement>, text: string) => {
    if (!isCollapsed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      text,
      top: rect.top + rect.height / 2,
      left: rect.right + 10,
    });
  };

  const hideTooltip = () => setTooltip(null);

  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      await performLogout();
      localStorage.clear();
      navigate("/");
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.clear();
      navigate("/");
      window.location.reload();
    }
  };

  const handleNavigate = (path: string) => {
    if (path === "/messages") {
      setIsCollapsed(true);
    } else if (!isCollapsed && path !== location.pathname) {
      setIsCollapsed(false);
    }
    navigate(path);
  };

  return (
    <>
      <div style={sidebarStyle}>
        {/* Profile Section */}
        <div style={profileStyle}>
          {imgErr ? (
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "#F5F6FA",
                borderRadius: "50%",
              }}
            />
          ) : (
            <img
              src={profilePicture || "https://via.placeholder.com/40"}
              alt="Profile"
              onError={() => setImgErr(true)}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                marginRight: isCollapsed ? "0" : "10px",
              }}
            />
          )}
          {!isCollapsed && (
            <div>
              <div style={{ fontWeight: "bold" }}>{fullname || "No Name"}</div>
              <div style={{ fontSize: "14px", color: "#F5F6FA" }}>
                @{username || "No Username"}
              </div>
            </div>
          )}
        </div>

        {/* Links */}
        <a
          style={linkStyle("/home")}
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("/home");
          }}
          onMouseEnter={(e) => showTooltip(e, "Home")}
          onMouseLeave={hideTooltip}
        >
          {imgErr ? (
            <FaHome size={23.5} />
          ) : (
            <img
              src={toyHome}
              alt="Home"
              style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }}
            />
          )}
          {!isCollapsed && "Home"}
        </a>

        <a
          style={linkStyle("/create-post")}
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("/create-post");
          }}
          onMouseEnter={(e) => showTooltip(e, "Create Post")}
          onMouseLeave={hideTooltip}
        >
          {imgErr ? (
            <FiPlus size={24} />
          ) : (
            <img
              src={createPost}
              alt="+ Create Post"
              style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }}
            />
          )}
          {!isCollapsed && "Create Post"}
        </a>

        <a
          style={linkStyle("/messages")}
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("/messages");
          }}
          onMouseEnter={(e) => showTooltip(e, "Messages")}
          onMouseLeave={hideTooltip}
        >
          {imgErr ? (
            <FaEnvelope size={23.5} />
          ) : (
            <img
              src={messageImgIcon}
              alt="Messages"
              style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }}
            />
          )}
          {!isCollapsed && "Messages"}
        </a>

        <button
          onClick={() => {
            if (location.pathname !== "/messages") {
              setIsCollapsed(!isCollapsed);
            }
          }}
          style={{
            marginTop: "15px",
            background: "#F5F6FA",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            cursor:
              location.pathname === "/messages" ? "not-allowed" : "pointer",
            color: "#611DD0",
            alignSelf: "center",
            opacity: location.pathname === "/messages" ? 0.5 : 1,
          }}
          onMouseEnter={(e) =>
            showTooltip(e, isCollapsed ? "Open Sidebar" : "Close Sidebar")
          }
          onMouseLeave={hideTooltip}
          disabled={location.pathname === "/messages"}
        >
          {isCollapsed ? "→" : "←"}
        </button>

        <a
          style={linkStyle("/themes")}
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("/themes");
          }}
          onMouseEnter={(e) => showTooltip(e, "Themes")}
          onMouseLeave={hideTooltip}
        >
          {imgErr ? (
            <FaPaintBrush size={25} />
          ) : (
            <img
              src={themes}
              alt="Themes"
              style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }}
            />
          )}
          {!isCollapsed && "Themes"}
        </a>

        <a
          href="/follow_request"
          style={linkStyle("/PendingRequest")}
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("/follow_request");
          }}
          onMouseEnter={(e) => showTooltip(e, "Follow Request")}
          onMouseLeave={hideTooltip}
        >
          {imgErr ? (
            <FaPaintBrush size={25} /> // Fallback icon
          ) : (
            <img
              src={pendingRequest}
              alt="Follow Request"
              onError={() => setImgErr(true)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                marginRight: isCollapsed ? "0" : "10px",
              }}
            />
          )}
          {!isCollapsed && "Follow Request"}
        </a>

        <a
          href="/contact"
          style={linkStyle("/contact")}
          onClick={(e) => {
            e.preventDefault();
            handleNavigate("/contact");
          }}
          onMouseEnter={(e) => showTooltip(e, "Contact")}
          onMouseLeave={hideTooltip}
        >
          {imgErr ? (
            <FaEnvelope size={23.5} />
          ) : (
            <img
              src={contacts}
              alt="Contact"
              onError={() => setImgErr(true)}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                marginRight: isCollapsed ? "0" : "10px",
              }}
            />
          )}
          {!isCollapsed && "Contact"}
        </a>

        <a
          style={linkStyle("/logout")}
          onClick={handleLogout}
          onMouseEnter={(e) => showTooltip(e, "Logout")}
          onMouseLeave={hideTooltip}
        >
          {imgErr ? (
            <FaSignOutAlt size={23.5} />
          ) : (
            <img
              src={logout}
              alt="Logout"
              style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }}
            />
          )}
          {!isCollapsed && "Logout"}
        </a>
      </div>

      {/* Tooltip Renderer */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            top: `${tooltip.top}px`,
            left: `${tooltip.left}px`,
            transform: "translateY(-50%)",
            background: "#fff",
            color: "#611DD0",
            padding: "5px 10px",
            borderRadius: "5px",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
            zIndex: 9999,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </>
  );
};

export default Sidebar;