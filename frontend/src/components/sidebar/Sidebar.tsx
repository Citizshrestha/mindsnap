import type React from 'react';
import { FaHome,  FaEnvelope, FaPaintBrush, FaSignOutAlt, FaPodcast } from 'react-icons/fa';
import { FiPlus } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import "./sidebar.css"
import { useState } from 'react';
import toyHome from "../../../public/images/toyhome.png"
import posts from "../../../public/images/Posts.png"
import createPost from "../../../public/images/CreatePosts.png"
import messageImgIcon from "../../../public/images/messages.png"
import themes from "../../../public/images/themes.png"
import logout from "../../../public/images/logout.png"

const Sidebar = () => {

  const [imgErr, setImgErr] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

const sidebarStyle: React.CSSProperties = {
  background: '#611DD0',
  color: '#fff',
  padding: '20px',
  borderRadius: '0 45px 45px 45px',
  height: 'calc(97vh - 80px)',
  width: '250px',
  position: 'absolute',
  top: '98px',
  left: '2px',
  display: "flex",
  flexDirection : "column"
};



const linkStyle = (path: string): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  textDecoration: 'none',
  margin: '15px 10px',
  padding: '10px',
  borderTopRightRadius : "90px",
  borderTopLeftRadius : "56px",
  borderBottomLeftRadius : "56px",
  borderBottomRightRadius : "none",
  width : "230px",
  background: location.pathname === path ? "#F5F6FA" : "transparent",
  color: location.pathname === path ? "#611DD0" : "#F5F6FA",
  fontSize: '19px',
});

const handleLogout = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    localStorage.removeItem('userSession');
    navigate('/')
}

return (
  <>
    
    <div style={sidebarStyle}>
      <a 
         href="/home" 
         style={linkStyle('/home')} 
         className="font-stretch-100%"
         onClick={(e) => {
          e.preventDefault();
          navigate('/home')
         }}
        >
         {imgErr ? (
          <FaHome size={23.5} style={{ marginRight: '10px' }} />
         ): (
          <img src={toyHome} 
          alt="Home Icon"
            onError={() => setImgErr(true)} 
             style={{ width: '38px', marginRight: '10px' }}
          />
         )
         }
         Home
      </a>
     
      <a 
        href="/posts" 
        style={linkStyle('/posts')}
        onClick={(e) => {
          e.preventDefault();
          navigate('/posts');
        }}
        >
         {imgErr ? (
          <FaPodcast size={23.5} style={{ marginRight: '10px' }} />) : (
            <img 
            src={posts} 
            alt="postsIcon" 
              onError={() => setImgErr(true)}
          style={{ width: '38px', marginRight: '10px' }}
            />
           
          )}
           Posts
      </a>
      <a 
        href="/create-post" 
        style={linkStyle('/create-post')} 
        className='plusIcon'
        onClick={(e) => {
          e.preventDefault();
          navigate('/create-post')
        }}
        >
         {imgErr ? (
          <FiPlus size={24} style={{ marginRight: '10px' }} /> 
         ) :(
            <img 
            src={createPost} 
            alt="+ Create Post" 
            onError={() => setImgErr(true)}
            style={{width: "38px", marginRight: "10px"}}
            />
         )}
         Create Post
      </a>
      <a 
        href="/messages" 
        style={linkStyle('/messages')}
        onClick={(e) => {
          e.preventDefault();
          navigate('/messages')
        }}
        >
           {imgErr ? (
             <FaEnvelope size={23.5} style={{ marginRight: '10px' }} />
         ) :(
            <img 
            src={messageImgIcon} 
            alt="Messages" 
            onError={() => setImgErr(true)}
            style={{width: "38px", marginRight: "10px"}}
            />
         )}
        Messages
      </a>
      <a 
        href="/themes" 
        style={linkStyle("/themes")}
          onClick={(e) => {
          e.preventDefault();
          navigate('/themes')
        }}
      >
         {imgErr ? (
                     <FaPaintBrush size={25} style={{ marginRight: '10px' }} /> 

         ) :(
            <img 
            src={themes} 
            alt="Themes" 
            onError={() => setImgErr(true)}
            style={{width: "38px", marginRight: "10px"}}
            />
         )}
         Themes
      </a>
      <a 
        href="/logout" 
        className="absolute bottom-0" 
        style={linkStyle('/logout')}
        onClick={handleLogout}
        >
           {imgErr ? (
            <FaSignOutAlt size={23.5} style={{ marginRight: '10px' }} /> 
         ) :(
            <img 
            src={logout} 
            alt="Logout" 
            onError={() => setImgErr(true)}
            style={{width: "38px", marginRight: "10px"}}
            />
         )}
         Logout
      </a>
    </div>
  </>
);
};

export default Sidebar;