import React, { useState, useEffect } from "react";
import { FaHome, FaEnvelope, FaPaintBrush, FaSignOutAlt, FaPodcast } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { useLocation, useNavigate } from "react-router-dom";
import "./sidebar.css";

import toyHome from "../../../public/images/toyhome.png";
import posts from "../../../public/images/Posts.png";
import createPost from "../../../public/images/CreatePosts.png";
import messageImgIcon from "../../../public/images/messages.png";
import themes from "../../../public/images/themes.png";
import logout from "../../../public/images/logout.png";

const Sidebar = () => {
  const [imgErr, setImgErr] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/messages") {
      setIsCollapsed(true); 
    }
  }, [location.pathname]);

  // Sidebar styles
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
  };

  // Links
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
  });

  // Hover tooltip style
  const tooltipStyle: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    left: "100%",
    transform: "translateY(-50%)",
    background: "#fff",
    color: "#611DD0",
    padding: "5px 10px",
    borderRadius: "5px",
    whiteSpace: "nowrap",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    marginLeft: "10px",
    opacity: 0,
    visibility: "hidden",
    transition: "opacity 0.2s ease, visibility 0s linear 0.2s",
    zIndex: 10,
  };

  // Safe hover handler
  const showTooltip = (e: React.MouseEvent<HTMLElement>) => {
    if (isCollapsed) {
      const tooltip = e.currentTarget.querySelector(".tooltip") as HTMLElement | null;
      if (tooltip) {
        tooltip.style.opacity = "1";
        tooltip.style.visibility = "visible";
        tooltip.style.transition = "opacity 0.2s ease";
      }
    }
  };

  const hideTooltip = (e: React.MouseEvent<HTMLElement>) => {
    if (isCollapsed) {
      const tooltip = e.currentTarget.querySelector(".tooltip") as HTMLElement | null;
      if (tooltip) {
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
        tooltip.style.transition = "opacity 0.2s ease, visibility 0s linear 0.2s";
      }
    }
  };

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    localStorage.removeItem("userSession");
    navigate("/");
  };

  // Handle navigation and enforce collapsed state for /messages
  const handleNavigate = (path: string) => {
    if (path === "/messages") {
      setIsCollapsed(true); 
    } else if (!isCollapsed && path !== location.pathname) {
      setIsCollapsed(false); 
    }
    navigate(path);
  };

  return (
    <div style={sidebarStyle}>
      <a
        href="/home"
        style={linkStyle("/home")}
        onClick={(e) => { e.preventDefault(); handleNavigate("/home"); }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {imgErr ? (
          <FaHome size={23.5} />
        ) : (
          <img src={toyHome} alt="Home Icon" onError={() => setImgErr(true)} style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }} />
        )}
        {!isCollapsed && "Home"}
        {isCollapsed && <div className="tooltip" style={tooltipStyle}>Home</div>}
      </a>

      <a
        href="/posts"
        style={linkStyle("/posts")}
        onClick={(e) => { e.preventDefault(); handleNavigate("/posts"); }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {imgErr ? (
          <FaPodcast size={23.5} />
        ) : (
          <img src={posts} alt="postsIcon" onError={() => setImgErr(true)} style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }} />
        )}
        {!isCollapsed && "Posts"}
        {isCollapsed && <div className="tooltip" style={tooltipStyle}>Posts</div>}
      </a>

      <a
        href="/create-post"
        style={linkStyle("/create-post")}
        onClick={(e) => { e.preventDefault(); handleNavigate("/create-post"); }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {imgErr ? (
          <FiPlus size={24} />
        ) : (
          <img src={createPost} alt="+ Create Post" onError={() => setImgErr(true)} style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }} />
        )}
        {!isCollapsed && "Create Post"}
        {isCollapsed && <div className="tooltip" style={tooltipStyle}>Create Post</div>}
      </a>

      <a
        href="/messages"
        style={linkStyle("/messages")}
        onClick={(e) => { e.preventDefault(); handleNavigate("/messages"); }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {imgErr ? (
          <FaEnvelope size={23.5} />
        ) : (
          <img src={messageImgIcon} alt="Messages" onError={() => setImgErr(true)} style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }} />
        )}
        {!isCollapsed && "Messages"}
        {isCollapsed && <div className="tooltip" style={tooltipStyle}>Messages</div>}
      </a>

      <a
        href="/themes"
        style={linkStyle("/themes")}
        onClick={(e) => { e.preventDefault(); handleNavigate("/themes"); }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {imgErr ? (
          <FaPaintBrush size={25} />
        ) : (
          <img src={themes} alt="Themes" onError={() => setImgErr(true)} style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }} />
        )}
        {!isCollapsed && "Themes"}
        {isCollapsed && <div className="tooltip" style={tooltipStyle}>Themes</div>}
      </a>

      <a
        href="/logout"
        style={{ ...linkStyle("/logout"), marginTop: "auto" }}
        onClick={handleLogout}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {imgErr ? (
          <FaSignOutAlt size={23.5} />
        ) : (
          <img src={logout} alt="Logout" onError={() => setImgErr(true)} style={{ width: "38px", marginRight: isCollapsed ? "0" : "10px" }} />
        )}
        {!isCollapsed && "Logout"}
        {isCollapsed && <div className="tooltip" style={tooltipStyle}>Logout</div>}
      </a>

      {/* Toggle Button - Disabled when on /messages */}
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
          cursor: location.pathname === "/messages" ? "not-allowed" : "pointer",
          color: "#611DD0",
          alignSelf: "center",
          opacity: location.pathname === "/messages" ? 0.5 : 1,
        }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        disabled={location.pathname === "/messages"}
      >
        {isCollapsed ? "→" : "←"}
        {isCollapsed && <div className="tooltip mt-60" style={tooltipStyle}>{isCollapsed ? "Close Sidebar" : "Open Sidebar"}</div>}
      </button>
    </div>
  );
};

export default Sidebar;