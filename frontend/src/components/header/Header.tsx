import { FiBell, FiHome, FiSearch } from "react-icons/fi";
import "./header.css";
import { MdPerson3, MdPersonAdd } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import settingImg from "../../../public/images/settings.png";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string>("");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("accessToken");

        if (!token) {
          setError("No token available");
          setUsername("Guest");
          return;
        }

        const response = await axiosClient.get("/api/users/profile");
        setUsername(response.data.username);
        if (response.data.profilePicture) {
          setProfilePicture(response.data.profilePicture);
        }
      } catch (err) {
        console.error("Error fetching the user data: ", err);
      }
    };
    fetchUserInfo();
  }, []);

  interface CloudinaryUploadResponse {
    secure_url: string;
    error?: { message?: string };
  }

  interface updateProfileResponse {
    data: {
      success: boolean;
      [key: string]: unknown;
    };
  }

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> => {
    const file: File | undefined = event.target.files?.[0];
    if (!file) return;

    const allowedTypes: string[] = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, or GIF)");
      toast.error("❌Please select a valid image file (JPEG, PNG, or GIF)");
      return;
    }

    const maxSizeInBytes: number = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSizeInBytes) {
      setError("File Size exceeds 50MB limit.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const formData: FormData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
      );
      formData.append("folder", "mindsnap/profile_pictures");

      console.log("Uploading image to Cloudinary");
      const response: Response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data: CloudinaryUploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message ||
            `Cloudinary upload failed with status ${response.status}`
        );
      }
      const imageUrl: string = data.secure_url;
      console.log("Image Upload to Cloudinary: ", imageUrl);

      const updateResp: updateProfileResponse = await axiosClient.patch(
        "/api/users/update-profile",
        {
          profilePicture: imageUrl,
        }
      );

      if (updateResp.data.success) {
        setProfilePicture(imageUrl);
        toast.success("Profile Picture Updated Successfully");
      }
    } catch (err: unknown) {
      setError(`Error uploading image ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const transformedUrl = profilePicture || "";

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="fixed bg-[#611DD0] top-0 left-0 w-full h-20 flex items-center justify-between px-5 z-50">
      <div className="flex items-center justify-start h-full">
        <h1 style={{ margin: 0, display: "flex", alignItems: "center" }}>
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
          <span style={{ fontSize: "33px", fontWeight: "bold", color: "#fff" }}>
            Snap
          </span>
        </h1>
      </div>

      <div className="navlinks flex items-center justify-between absolute left-80">
        <a
          onClick={() => navigate("/home")}
          className="link text-white flex mt-4 font-bold mx-2 items-center"
          href="/home"
          style={
            {
              "--underline-color": "#DC6009",
              "--hover-color": "#DC6009",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#DC6009";
            (e.currentTarget.querySelector(
              ".home-icon"
            ) as HTMLElement)!.style.color = "#DC6009";

            e.currentTarget.style.setProperty("--underline-color", "#DC6009");
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#fff";
            (e.currentTarget.querySelector(
              ".home-icon"
            ) as HTMLElement)!.style.color = "#00FFFF";

            e.currentTarget.style.setProperty("--underline-color", "#FDE68A");
          }}
        >
          <FiHome size={24} className="home-icon" />
          <h5 className="font-semibold text-xl ml-2">Home</h5>
        </a>

        <a
          onClick={() => navigate("/profile")}
          href="/profile"
          className="link text-white flex mt-4 font-bold mx-2 items-center"
          style={
            {
              "--underline-color": "#F9A8D4",
              "--hover-color": "#F9A8D4",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#F9A8D4";
            (e.currentTarget.querySelector(
              ".profile-icon"
            ) as HTMLElement)!.style.color = "#FF00FF";
            e.currentTarget.style.setProperty("--underline-color", "#F9A8D4");
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#fff";
            (e.currentTarget.querySelector(
              ".profile-icon"
            ) as HTMLElement)!.style.color = "#FF00FF";
            e.currentTarget.style.setProperty("--underline-color", "#F9A8D4");
          }}
        >
          <MdPerson3 size={26} className="profile-icon" />
          <h5 className="font-semibold text-xl ml-2">Profile</h5>
        </a>

        <a
          onClick={() => navigate("/explore")}
          href="/explore"
          className="link rocketLink text-white flex mt-4 font-bold mx-2 items-center"
          style={
            {
              "--underline-color": "#67E8F9",
              "--hover-color": "#67E8F9",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#67E8F9";
            e.currentTarget.style.setProperty("--underline-color", "#67E8F9");
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.setProperty("--underline-color", "#67E8F9");
          }}
        >
          <span className="text-xl ">🚀</span>
          <h5 className="font-semibold text-xl ml-2">Explore</h5>
        </a>

        <a
          onClick={() => navigate("/connections")}
          href="/connections"
          className="link text-white flex mt-4 font-bold mx-2 items-center"
          style={
            {
              "--underline-color": "#A3E635",
              "--hover-color": "#A3E635",
            } as React.CSSProperties
          }
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#A3E635";
            e.currentTarget.style.setProperty("--underline-color", "#A3E635");
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#fff";
            e.currentTarget.style.setProperty("--underline-color", "#A3E635");
          }}
        >
          <MdPersonAdd size={26} className="connection-icon" />

          <h5 className="font-semibold text-xl ml-2">Connection</h5>
        </a>
      </div>

      <div className="flex absolute left-245 items-center bg-[#f0f2f5] p-2 rounded-full w-[320px] shadow-sm">
        <FiSearch size={22} className="mr-3 text-gray-600" />
        <input
          type="search"
          name="search"
          placeholder="Search People, Posts, Topics  "
          className="border-none outline-none w-full bg-transparent text-gray-900  text-base placeholder-gray-500"
          style={{
            WebkitBoxShadow: "0 0 0 30px #f0f2f5 inset",
            WebkitTextFillColor: "#1f2937",
          }}
        />
      </div>

      <div className=" text-white flex items-center cursor-pointer space-x-4 gap-1">
        <div className="setting h-9 w-9 mr-10 mb-2  ">
          <img src={settingImg} className="rounded-full ml-2" alt="Setting" />
          <span className=" text-center">Settings</span>
        </div>
        <FiBell size={24} className="mr-5 cursor-pointer text-[#FFD700]" />

        <div className="profileContainer flex flex-col items-center h-12 w-12 object-cover mr-2 mb-4">
          <div className="relative">
            {loading ? (
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                Loading...
              </div>
            ) : transformedUrl ? (
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={transformedUrl}
                alt="profileIMG"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                No Image
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute top-0 left-0 h-12 w-12 opacity-0 cursor-pointer"
              title="Upload Profile Picture"
              disabled={loading}
            />
          </div>
          <h3 className="text-sm font-medium text-white">{username}</h3>
        </div>
      </div>
    </div>
  );
};

export default Header;
