import type React from 'react';
import { FaHome, FaEnvelope, FaPaintBrush, FaSignOutAlt, FaPodcast } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import "./sidebar.css";
import { useState } from 'react';
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

  // Sidebar styles
  const sidebarStyle: React.CSSProperties = {
    background: '#611DD0',
    color: '#fff',
    padding: '16px',
    borderRadius: '0 45px 45px 45px',
    height: 'calc(97vh - 80px)',
    width: isCollapsed ? '70px' : '250px',
    position: 'absolute',
    top: '98px',
    left: '2px',
    display: "flex",
    flexDirection: "column",
    alignItems: isCollapsed ? "center" : "flex-start", 
    transition: "width 0.3s ease"
  };

  // Links
  const linkStyle = (path: string): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: isCollapsed ? "center" : "flex-start", 
    textDecoration: 'none',
    margin: '15px 10px',
    padding: '10px',
    borderRadius: "50px",
    width: isCollapsed ? "50px" : "210px", 
    background: location.pathname === path ? "#F5F6FA" : "transparent",
    color: location.pathname === path ? "#611DD0" : "#F5F6FA",
    fontSize: '16px',
    transition: "all 0.3s ease"
  });

  const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    localStorage.removeItem('userSession');
    navigate('/');
  };

  return (
    <div style={sidebarStyle}>
      <a
        href="/home"
        style={linkStyle('/home')}
        onClick={(e) => { e.preventDefault(); navigate('/home'); }}
      >
        {imgErr ? (
          <FaHome size={23.5} />
        ) : (
          <img src={toyHome} alt="Home Icon" onError={() => setImgErr(true)} style={{ width: '38px', marginRight: isCollapsed ? '0' : '10px' }} />
        )}
        {!isCollapsed && "Home"}
      </a>

      <a
        href="/posts"
        style={linkStyle('/posts')}
        onClick={(e) => { e.preventDefault(); navigate('/posts'); }}
      >
        {imgErr ? (
          <FaPodcast size={23.5} />
        ) : (
          <img src={posts} alt="postsIcon" onError={() => setImgErr(true)} style={{ width: '38px', marginRight: isCollapsed ? '0' : '10px' }} />
        )}
        {!isCollapsed && "Posts"}
      </a>

      <a
        href="/create-post"
        style={linkStyle('/create-post')}
        onClick={(e) => { e.preventDefault(); navigate('/create-post'); }}
      >
        {imgErr ? (
          <FiPlus size={24} />
        ) : (
          <img src={createPost} alt="+ Create Post" onError={() => setImgErr(true)} style={{ width: '38px', marginRight: isCollapsed ? '0' : '10px' }} />
        )}
        {!isCollapsed && "Create Post"}
      </a>

      <a
        href="/messages"
        style={linkStyle('/messages')}
        onClick={(e) => { e.preventDefault(); navigate('/messages'); }}
      >
        {imgErr ? (
          <FaEnvelope size={23.5} />
        ) : (
          <img src={messageImgIcon} alt="Messages" onError={() => setImgErr(true)} style={{ width: '38px', marginRight: isCollapsed ? '0' : '10px' }} />
        )}
        {!isCollapsed && "Messages"}
      </a>

      <a
        href="/themes"
        style={linkStyle("/themes")}
        onClick={(e) => { e.preventDefault(); navigate('/themes'); }}
      >
        {imgErr ? (
          <FaPaintBrush size={25} />
        ) : (
          <img src={themes} alt="Themes" onError={() => setImgErr(true)} style={{ width: '38px', marginRight: isCollapsed ? '0' : '10px' }} />
        )}
        {!isCollapsed && "Themes"}
      </a>

      <a
        href="/logout"
        style={{ ...linkStyle('/logout'), marginTop: "auto" }}
        onClick={handleLogout}
      >
        {imgErr ? (
          <FaSignOutAlt size={23.5} />
        ) : (
          <img src={logout} alt="Logout" onError={() => setImgErr(true)} style={{ width: '38px', marginRight: isCollapsed ? '0' : '10px' }} />
        )}
        {!isCollapsed && "Logout"}
      </a>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        style={{
          marginTop: "15px",
          background: "#F5F6FA",
          border: "none",
          borderRadius: "50%",
          width: "40px",
          height: "40px",
          cursor: "pointer",
          color: "#611DD0",
          alignSelf: "center"
        }}
      >
        {isCollapsed ? '→' : '←'}
      </button>
    </div>
  );
};

export default Sidebar;
