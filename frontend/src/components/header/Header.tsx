import { FiBell, FiSearch } from "react-icons/fi";
import "./header.css"
import { FaPerson} from "react-icons/fa6";
import { AiFillCrown } from "react-icons/ai";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();
  return (
    <div className="fixed top-0 left-0 w-full h-20   flex items-center justify-between px-5 z-50 s">
      <div className="flex items-center justify-start h-full">
        <h2 style={{ margin: 0, display: "flex", alignItems: "center" }}>
          <span
            style={{
              background: "linear-gradient(135deg, #00ffcc, #ff00ff)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontSize: "36px",
              fontWeight: "bold",
              paddingLeft: "13px",
              marginRight: "5px",
              marginBottom: "6px",
            }}
          >
            Mind
          </span>
          <span style={{ fontSize: "33px", fontWeight: "bold", color: "#000" }}>
            Snap
          </span>
        </h2>
      </div>
      <div className="gkQuiz flex items-center justify-between absolute left-80">
         <a href="/gkQuiz" className="text-[#611DD0] flex font-bold mx-2">
            <AiFillCrown size={34} className="text-[#FFD700] "/>
            <h1 className="font-semibold text-2xl">GK Quiz</h1> 
         </a>
        
      </div>
         <div className="flex absolute left-245 items-center bg-[#f0f2f5] p-2 rounded-full w-[320px] shadow-sm">
        <FiSearch size={22} className="mr-3 text-gray-600" />
        <input
          type="search"
          name="search"
          placeholder="Search "
          className="border-none outline-none w-full bg-transparent text-gray-900 text-3xl text-base placeholder-gray-500"
          style={{
            WebkitBoxShadow: '0 0 0 30px #f0f2f5 inset', 
            WebkitTextFillColor: '#1f2937', 
          }}
        />
      </div>

      <div className="profile flex items-center justify-between absolute right-30">
         <a 
            onClick={() => navigate('/profile')} 
            href="/profile" 
            className="text-[#611DD0] flex font-bold mx-2"
            >
            <FaPerson size={25}/>
            <h1 className="font-semibold text-xl">Profile</h1> 
         </a>
        
      </div>

       <div className="notificationBell flex items-center space-x-4 ">
          
          <FiBell size={20} className="mr-5 text-black"/>
           <div className="profileContainer flex flex-col items-center h-12 w-12 object-cover mr-2 mb-4">
            <img className="h-full w-full rounded-full" src="https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8dXNlcnxlbnwwfHwwfHx8MA%3D%3D" alt="profileIMG" />
            <h3 className="text-sm font-medium text-black">Citizshresthaa</h3>
            </div>
       </div>


      </div>
  );
};

export default Header;
