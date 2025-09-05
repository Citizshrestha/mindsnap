import { FiBell, FiHome, FiSearch } from "react-icons/fi";
import { MdPerson3, MdPersonAdd } from "react-icons/md";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { useSelector, useDispatch } from "react-redux";
import { setProfilePicture, setUsername } from "../../redux/slices/userSlice";
import type { RootState, AppDispatch } from "../../redux/store";

// Import images
import logoImg from "../../../public/images/mindsnap logo.png";
import settingImg from "../../../public/images/settings.png";
import defaultAvatar from "../../../public/images/default.jpg";

import "./header.css";

interface CloudinaryUploadResponse {
  secure_url: string;
  error?: { message: string };
}

interface UpdateProfileResponse {
  data: {
    success: boolean;
    message?: string;
    [key: string]: unknown;
  };
}

interface UserProfileResponse {
  data: {
    username: string;
    profilePicture: string;
    [key: string]: unknown;
  };
}

interface SearchUser {
  _id: string;
  username: string;
  fullname?: string;
  profilePicture?: string;
  isFollowing?: boolean;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Track current route
  const dispatch = useDispatch<AppDispatch>();
  const { profilePicture, username: currentUsername } = useSelector(
    (state: RootState) => state.user
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null); // Track active link

  // Fetch user profile if not already in Redux
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUsername) {
        try {
          const token = localStorage.getItem("accessToken");
          if (!token) {
            setError("No token available");
            toast.error("Please log in to continue.");
            return;
          }

          const response: UserProfileResponse = await axiosClient.get(
            "/api/users/profile"
          );
          dispatch(setUsername(response.data.username));
          if (response.data.profilePicture) {
            dispatch(setProfilePicture(response.data.profilePicture));
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch user data";
          setError(message);
          toast.error(`Error: ${message}`);
        }
      }
    };
    fetchUserData();
  }, [currentUsername, dispatch]);

  // Handle profile picture upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file: File | undefined = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("❌ Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 50MB limit.");
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ""
      );
      formData.append("folder", "mindsnap/profile_pictures");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        { method: "POST", body: formData }
      );

      const data: CloudinaryUploadResponse = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Cloudinary upload failed");

      const updateResp: UpdateProfileResponse = await axiosClient.patch(
        "/api/users/update-profile",
        {
          profilePicture: data.secure_url,
        }
      );

      if (updateResp.data.success) {
        dispatch(setProfilePicture(data.secure_url));
        localStorage.setItem("profilePicture", data.secure_url);
        toast.success("Profile Picture Updated Successfully");
      } else {
        throw new Error(updateResp.data.message || "Update failed");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error uploading image";
      setError(message);
      toast.error(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const transformedUrl: string = profilePicture || defaultAvatar;

  // Handle search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No token available");

      const res = await axiosClient.get(
        `/api/users/search?query=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search users");
    } finally {
      setSearchLoading(false);
    }
  };

  // Navigate to profile
  const handleProfileClick = (user: SearchUser) => {
    if (user.username === currentUsername) {
      navigate("/profile");
    } else {
      navigate(`/profile/${user._id}`);
    }
  };

  // Set active link based on current route
  useEffect(() => {
    const path = location.pathname;
    if (path === "/home") setActiveLink("/home");
    else if (path === "/profile") setActiveLink("/profile");
    else if (path === "/explore") setActiveLink("/explore");
    else if (path === "/connections") setActiveLink("/connections");
    else setActiveLink(null);
  }, [location.pathname]);

  if (error) {
    return (
      <div className="fixed bg-[#611DD0] top-0 left-0 w-full h-20 flex items-center justify-center text-white z-50">
        {error}{" "}
        <button
          onClick={() => setError(null)}
          className="ml-2 text-red-300"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="fixed font-poppins bg-[#611DD0] top-0 left-0 w-full h-20 flex items-center justify-between px-5 z-50">
      {/* Logo */}
      <div className="flex items-center justify-start h-full">
        <img
          src={logoImg}
          alt="SnapMind Logo"
          className="w-20 h-20 pb-2 pl-5 object-cover rounded-full"
        />
        <h1 className="text-white text-3xl font-bold flex items-center">
          Mind<span className="text-yellow-300">Snap</span>
        </h1>
      </div>

      {/* Navigation */}
      <div className="Nav_Link flex items-center justify-between absolute left-80">
        {/* Home */}
        <a
          onClick={() => navigate("/home")}
          className="link text-white flex mt-4 mx-2 items-center"
          href="/home"
          style={
            {
              "--underline-color": "#FFF0F5",
              "--hover-color": "#FFF0F5",
            } as React.CSSProperties
          }
        >
          <FiHome
            size={20}
            className="home-icon"
            style={{
              color: activeLink === "/home" ? "#FFF0F5" : "#00FFFF",
            }}
          />
          <h5
            className="font-semibold text-[1.1rem] ml-2"
            style={{
              color: activeLink === "/home" ? "#FFF0F5" : "#fff",
            }}
          >
            Home
          </h5>
          {activeLink === "/home" && (
            <span
              className="underline"
              style={{
                width: "100%",
                height: "3px",
                backgroundColor: "#FFF0F5",
                display: "block",
                position: "absolute",
                bottom: 0,
                left: 0,
                borderRadius: "2px",
              }}
            />
          )}
        </a>

        {/* Profile */}
        <a
          onClick={() => navigate("/profile")}
          href="/profile"
          className="link text-white flex mt-4 mx-2 items-center"
          style={
            {
              "--underline-color": "#F9A8D4",
              "--hover-color": "#F9A8D4",
            } as React.CSSProperties
          }
        >
          <MdPerson3
            size={22}
            className="profile-icon"
            style={{
              color: activeLink === "/profile" ? "#FF00FF" : "#FF00FF",
            }}
          />
          <h5
            className="font-semibold text-white text-[1.1rem] ml-2"
            style={{
              color: activeLink === "/profile" ? "#F9A8D4" : "#fff",
            }}
          >
            Profile
          </h5>
          {activeLink === "/profile" && (
            <span
              className="underline"
              style={{
                width: "100%",
                height: "3px",
                backgroundColor: "#F9A8D4",
                display: "block",
                position: "absolute",
                bottom: 0,
                left: 0,
                borderRadius: "2px",
              }}
            />
          )}
        </a>

        {/* Explore */}
        <a
          onClick={() => navigate("/explore")}
          href="/explore"
          className="link rocketLink text-white flex mt-4 mx-2 items-center"
          style={
            {
              "--underline-color": "#FF6347",
              "--hover-color": "#FF6347",
            } as React.CSSProperties
          }
        >
          <span
            className="text-xl rocketIcon"
            style={{
              color: activeLink === "/explore" ? "#FF6347" : "#fff",
            }}
          >
            🚀
          </span>
          <h5
            className="font-semibold text-[1.1rem] ml-2"
            style={{
              color: activeLink === "/explore" ? "#FF6347" : "#fff",
            }}
          >
            Explore
          </h5>
          {activeLink === "/explore" && (
            <span
              className="underline"
              style={{
                width: "100%",
                height: "3px",
                backgroundColor: "#FF6347",
                display: "block",
                position: "absolute",
                bottom: 0,
                left: 0,
                borderRadius: "2px",
              }}
            />
          )}
        </a>

        {/* Connections */}
        <a
          onClick={() => navigate("/connections")}
          href="/connections"
          className="link text-white flex mt-4 mx-2 items-center"
          style={
            {
              "--underline-color": "#0ACEDC",
              "--hover-color": "#0ACEDC",
            } as React.CSSProperties
          }
        >
          <MdPersonAdd
            size={22}
            className="connection-icon"
            style={{
              color: activeLink === "/connections" ? "#0ACEDC" : "#0ACEDC",
            }}
          />
          <h5
            className="font-semibold text-[1.1rem] ml-2"
            style={{
              color: activeLink === "/connections" ? "#0ACEDC" : "#fff",
            }}
          >
            Connection
          </h5>
          {activeLink === "/connections" && (
            <span
              className="underline"
              style={{
                width: "100%",
                height: "3px",
                backgroundColor: "#0ACEDC",
                display: "block",
                position: "absolute",
                bottom: 0,
                left: 0,
                borderRadius: "2px",
              }}
            />
          )}
        </a>
      </div>

      {/* Search */}
      <div className="relative flex-1 ml-165 max-w-md">
        <div className="flex items-center bg-[#f0f2f5] p-2 rounded-full shadow-sm">
          <FiSearch size={22} className="mr-3 text-gray-600" />
          <input
            type="search"
            value={searchQuery}
            style={{ background: "#f0f2f5" }}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search People, Posts, Topics"
            className="border-none outline-none bg-transparent w-full text-black placeholder-gray-500"
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="absolute top-full left-0 w-full bg-white max-h-60 overflow-y-auto rounded-md shadow-lg mt-1 z-50">
            {searchLoading ? (
              <p className="p-2 text-gray-500">Loading...</p>
            ) : searchResults.length === 0 ? (
              <p className="p-2 text-gray-500">No users found</p>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user._id}
                  className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleProfileClick(user)}
                >
                  <div className="flex items-center">
                    <img
                      src={user.profilePicture || defaultAvatar}
                      alt={user.username}
                      className="h-8 w-8 rounded-full object-cover mr-2"
                    />
                    <div>
                      <p className="text-sm text-gray-800 font-stretch-normal">{user.fullname}</p>
                      {user.fullname && (
                        <p className="text-xs text-gray-600">
                          {user.username}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="text-white flex items-center space-x-4">
        <div className="setting flex justify-between items-center flex-col h-9 w-9">
          <img
            src={settingImg}
            className="rounded-full"
            alt="Setting"
            onClick={() => navigate("/settings")}
          />
          <h3>Settings</h3>
        </div>
        <FiBell
          size={24}
          className="cursor-pointer text-[#FFD700]"
          onClick={() => navigate("/notifications")}
        />
        <div className="profileContainer flex flex-col items-center">
          <div className="relative">
            {loading ? (
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                Loading...
              </div>
            ) : (
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={transformedUrl}
                alt="profileIMG"
                onError={(e) => (e.currentTarget.src = defaultAvatar)}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute top-0 left-0 h-12 w-12 opacity-0 cursor-pointer"
              disabled={loading}
              title="Upload Profile Picture"
            />
          </div>
          <h3 className="text-sm font-medium">
            {currentUsername || "Loading..."}
          </h3>
        </div>
      </div>
    </div>
  );
};

export default Header;