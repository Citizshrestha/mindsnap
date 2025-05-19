import { FiBell, FiSearch } from "react-icons/fi";
import "./header.css";
import { FaPerson } from "react-icons/fa6";
import { AiFillCrown } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

const Header = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

interface UpdateProfileResponse {
  data: {
    success: boolean;
    [key: string]: unknown;
  };
}

const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
  const file: File | undefined = event.target.files?.[0];
  if (!file) return;

  const allowedTypes: string[] = ["image/jpeg", "image/png", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    setError("Please select a valid image file (JPEG, PNG, or GIF)");
    return;
}

  const maxSizeInBytes: number = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSizeInBytes) {
    setError("File size exceeds 5MB limit");
    return;
  }

  try {
    setError("");
    setLoading(true);

    // Prepare form data for Cloudinary unsigned upload
    const formData: FormData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string);
    formData.append("folder", "mindsnap/profile_pictures");

    console.log("Uploading image to Cloudinary...");
    const response: Response = await fetch(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data: CloudinaryUploadResponse = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || `Cloudinary upload failed with status ${response.status}`);
    }

    const imageUrl: string = data.secure_url;
    console.log("Image uploaded to Cloudinary:", imageUrl);

    console.log("Updating user profile with new image URL...");
    const updateResponse: UpdateProfileResponse = await axiosClient.patch("/api/users/update-profile", {
      profilePicture: imageUrl,
    });

    if (updateResponse.data.success) {
      setProfilePicture(imageUrl);
      console.log("Profile picture updated successfully in UI and backend");
    } else {
      throw new Error("Failed to update profile picture in the backend");
    }
  } catch (err) {
    console.error("Error uploading image:", err);
    if (err instanceof Error) {
      setError(err.message);
    } else if (typeof err === "object" && err !== null && "message" in err) {
      setError(String((err as { message?: unknown }).message));
    } else {
      setError("Failed to upload image");
    }
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
      <div className="gkQuiz flex items-center justify-between absolute left-80">
        <a href="/gkQuiz" className="text-[#611DD0] flex font-bold mx-2">
          <AiFillCrown size={34} className="text-[#FFD700]" />
          <h2 className="font-semibold text-white text-2xl">GK Quiz</h2>
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
            WebkitBoxShadow: "0 0 0 30px #f0f2f5 inset",
            WebkitTextFillColor: "#1f2937",
          }}
        />
      </div>

      <div className="profile flex items-center justify-between absolute right-30 mr-2">
        <a
          onClick={() => navigate("/profile")}
          href="/profile"
          className="text-white flex font-bold mx-2"
        >
          <FaPerson size={25} />
          <h1 className="font-semibold text-xl">Profile</h1>
        </a>
      </div>

      <div className="notificationBell text-white flex items-center space-x-4 gap-1">
        <FiBell size={20} className="mr-5 text-[#FFD700]" />
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