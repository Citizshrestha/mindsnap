import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState, useRef } from "react";
import { Pencil, X, Upload } from "lucide-react";
import {
  User,
  Mail,
  Lock,
  Cake,
  Info,
  Users,
  VenetianMask,
} from "lucide-react";
import {
  setProfilePicture,
  setUsername,
  setFullName,
  setDob,
  setAboutMe,
  setUserProfile,
  setCoverImage,
  setEmail,
  setGender,
  setVibe,
  setVibeDescription,
} from "../../redux/slices/userSlice";
import { toast } from "react-toastify";
import type { RootState } from "../../redux/store";
import axiosClient from "../../api/axiosClient";
import type { AxiosError } from "axios";
import { changePassword } from "../../api/auth";

export interface UserState {
  _id: string;
  profilePicture: string;
  username: string;
  fullname: string;
  email: string;
  gender: string;
  dob: string;
  aboutMe: string;
  coverImage: string;
  vibe: string;
  vibeDescription: string;
  followers: number;
  following: number;
  postsCount: number;
}

export default function Settings() {
  const dispatch = useDispatch();
  const {
    profilePicture,
    username,
    fullname,
    dob,
    gender,
    aboutMe,
    coverImage,
    email,
    vibe,
    vibeDescription,
    followers,
    following,
    postsCount,
  } = useSelector((state: RootState) => state.user);
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Image upload states
  const [imageUploadModal, setImageUploadModal] = useState<{
    isOpen: boolean;
    type: "profilePicture" | "coverImage" | null;
    currentImage: string;
  }>({
    isOpen: false,
    type: null,
    currentImage: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load server profile on mount and hydrate Redux + local state
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await axiosClient.get("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const data = response.data || {};

        if (data.success) {
          // Format date properly - remove time portion
          const formattedDob = data.dob
            ? new Date(data.dob).toISOString().split("T")[0]
            : "";

          dispatch(
            setUserProfile({
              profilePicture:
                data.profilePicture ||
                "https://avatars.githubusercontent.com/u/1?v=4",
              username: data.username || "",
              fullname: data.fullname || "",
              email: data.email || "",
              dob: formattedDob,
              gender: data.gender || "",
              aboutMe: data.aboutMe || "",
              coverImage:
                data.coverImage ||
                "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&h=250&fit=crop",
              vibe: data.vibe || "",
              vibeDescription: data.vibeDescription || "",
              followers: data.followers || 0,
              following: data.following || 0,
              postsCount: data.postsCount || 0,
            })
          );
        } else {
          throw new Error(data.message || "Failed to fetch profile");
        }
      } catch (err: unknown) {
        // Use type guard to check for AxiosError shape
        const errorObj = err as {
          message?: string;
          response?: { status?: number; data?: unknown };
        };
        console.error("Fetch profile error:", {
          message: errorObj?.message,
          status: errorObj?.response?.status,
          data: errorObj?.response?.data,
        });
        toast.error("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [dispatch]);

  const startEditing = (field: string, currentValue: string) => {
    // For images, open the image upload modal instead of text input
    if (field === "profilePicture" || field === "coverImage") {
      setImageUploadModal({
        isOpen: true,
        type: field as "profilePicture" | "coverImage",
        currentImage: currentValue,
      });
      setImagePreview(currentValue);
      setImageUrl("");
      setSelectedImage(null);
      setActiveTab("upload");
    } else {
      setEditingField(field);
      setEditValue(currentValue || "");
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValue("");
  };

  const closeImageModal = () => {
    setImageUploadModal({ isOpen: false, type: null, currentImage: "" });
    setSelectedImage(null);
    setImagePreview("");
    setImageUrl("");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("❌ Please select a valid image file (JPEG, PNG, GIF, WEBP)");
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 10MB limit.");
      return;
    }

    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "mindsnap_preset"
      );

      const folder =
        imageUploadModal.type === "profilePicture"
          ? "mindsnap/profile_pictures"
          : "mindsnap/cover_images";
      formData.append("folder", folder);

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${
        import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dcv3pajfc"
      }/image/upload`;

      const res = await fetch(cloudinaryUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Cloudinary upload failed");
      }

      const data = await res.json();
      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw error;
    }
  };

  const handleImageSave = async () => {
    if (!imageUploadModal.type) return;

    try {
      setIsLoading(true);
      let imageUrlToSave = "";

      if (activeTab === "upload" && selectedImage) {
        imageUrlToSave = await uploadImageToCloudinary(selectedImage);
      } else if (activeTab === "url" && imageUrl.trim()) {
        // Validate URL
        try {
          new URL(imageUrl);
          imageUrlToSave = imageUrl;
        } catch (error) {
          console.error(error);
          toast.error("Please enter a valid image URL");
          return;
        }
      } else {
        toast.error("Please select an image or enter a URL");
        return;
      }

      // Update via API using axiosClient like EditProfile component
      const updateData = { [imageUploadModal.type]: imageUrlToSave };
      const response = await axiosClient.patch(
        "/api/users/update-profile",
        updateData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data.success) {
        // Update Redux store
        if (imageUploadModal.type === "profilePicture") {
          dispatch(setProfilePicture(imageUrlToSave));
        } else if (imageUploadModal.type === "coverImage") {
          dispatch(setCoverImage(imageUrlToSave));
        }

        toast.success(
          `${
            imageUploadModal.type === "profilePicture"
              ? "Profile Picture"
              : "Cover Image"
          } updated successfully`
        );
        closeImageModal();
      } else {
        throw new Error(
          response.data.message || `Failed to update ${imageUploadModal.type}`
        );
      }
    } catch (err: unknown) {
      // Use AxiosError type for better type safety (same as EditProfile)
      const axiosErr = err as AxiosError<unknown>;
      console.error("Update image error:", {
        message: axiosErr?.message,
        status: axiosErr?.response?.status,
        data: axiosErr?.response?.data,
        headers: axiosErr?.response?.headers,
      });

      const serverMessage =
        (axiosErr?.response?.data as { message?: string })?.message ||
        (typeof axiosErr?.response?.data === "string"
          ? axiosErr?.response?.data
          : null) ||
        axiosErr?.message ||
        "Failed to update image. Please try again.";

      toast.error(String(serverMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (field: string) => {
    if (
      !editValue.trim() &&
      field !== "aboutMe" &&
      field !== "vibeDescription" &&
      field !== "gender"
    ) {
      toast.error("Please enter a value");
      return;
    }

    try {
      setIsLoading(true);

      let updateValue = editValue.trim();

      // Handle date formatting for DOB
      if (field === "dob" && updateValue) {
        // Ensure the date is in proper format for backend
        const date = new Date(updateValue);
        if (isNaN(date.getTime())) {
          toast.error("Please enter a valid date");
          return;
        }
        updateValue = date.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      }

      const updateData: Record<string, string> = { [field]: updateValue };

      // Use axiosClient exactly like EditProfile component
      const response = await axiosClient.patch(
        "/api/users/update-profile",
        updateData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || `Failed to update ${field}`);
      }

      // Update Redux store based on field with the formatted value
      switch (field) {
        case "username":
          dispatch(setUsername(updateValue));
          break;
        case "fullname":
          dispatch(setFullName(updateValue));
          break;
        case "email":
          dispatch(setEmail(updateValue));
          break;
        case "dob":
          dispatch(setDob(updateValue));
          break;
        case "gender":
          dispatch(setGender(updateValue));
          break;
        case "aboutMe":
          dispatch(setAboutMe(updateValue));
          break;
        case "vibe":
          dispatch(setVibe(updateValue));
          break;
        case "vibeDescription":
          dispatch(setVibeDescription(updateValue));
          break;
        default:
          dispatch(setUserProfile({ [field]: updateValue }));
      }

      toast.success(
        `${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`
      );
      setEditingField(null);
      setEditValue("");
    } catch (err: unknown) {
      // Use AxiosError type for better type safety (same as EditProfile)
      const axiosErr = err as AxiosError<unknown>;
      console.error(`Error updating ${field}:`, {
        message: axiosErr?.message,
        status: axiosErr?.response?.status,
        data: axiosErr?.response?.data,
        headers: axiosErr?.response?.headers,
      });

      const serverMessage =
        (axiosErr?.response?.data as { message?: string })?.message ||
        (typeof axiosErr?.response?.data === "string"
          ? axiosErr?.response?.data
          : null) ||
        axiosErr?.message ||
        `Failed to update ${field}. Please try again.`;

      toast.error(String(serverMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordError("New password and confirmation are required");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      setPasswordError("");

      // Since we removed current password, we need a different API endpoint
      // that doesn't require current password for logged-in users
      const response = await changePassword(newPassword);

      if (response.success) {
        toast.success("Password changed successfully");
        setChangePasswordModal(false);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(response.message || "Failed to change password");
      }
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      const errorMessage =
        axiosErr?.response?.data?.message || "Failed to change password";
      setPasswordError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !editingField && !imageUploadModal.isOpen) {
    return (
      <div className="p-6 ml-20 mt-20 flex justify-center items-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const formatFieldName = (field: string) => {
    return field
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  };

  // Format date for display (remove time portion)
  const displayDob = dob ? dob.split("T")[0] : dob;

  return (
    <div className="p-6 ml-20 overflow-y-auto h-[calc(100vh-80px)] scrollbar-hide mt-20 grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Image Upload Modal */}
      {imageUploadModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Edit{" "}
                {imageUploadModal.type === "profilePicture"
                  ? "Profile Picture"
                  : "Cover Image"}
              </h3>
              <button
                onClick={closeImageModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            <div className="mb-4 flex justify-center">
              <div
                className={`relative ${
                  imageUploadModal.type === "coverImage"
                    ? "w-full h-32"
                    : "w-32 h-32"
                }`}
              >
                <img
                  src={imagePreview || imageUploadModal.currentImage}
                  alt="Preview"
                  className={`w-full h-full object-cover rounded-lg ${
                    imageUploadModal.type === "profilePicture"
                      ? "rounded-full"
                      : "rounded-lg"
                  }`}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b mb-4">
              <button
                className={`flex-1 py-2 text-center ${
                  activeTab === "upload"
                    ? "border-b-2 border-purple-600 text-purple-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("upload")}
              >
                Upload
              </button>
              <button
                className={`flex-1 py-2 text-center ${
                  activeTab === "url"
                    ? "border-b-2 border-purple-600 text-purple-600"
                    : "text-gray-600"
                }`}
                onClick={() => setActiveTab("url")}
              >
                URL
              </button>
            </div>

            {/* Upload Tab */}
            {activeTab === "upload" && (
              <div className="mb-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-purple-500 transition-colors"
                  disabled={isLoading}
                >
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-gray-600">Click to upload image</span>
                  <span className="text-sm text-gray-400">
                    PNG, JPG, GIF up to 10MB
                  </span>
                </button>
                {selectedImage && (
                  <p className="text-sm text-green-600 mt-2">
                    Selected: {selectedImage.name}
                  </p>
                )}
              </div>
            )}

            {/* URL Tab */}
            {activeTab === "url" && (
              <div className="mb-4">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL here"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  style={{ backgroundColor: "#fff" }}
                  disabled={isLoading}
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={closeImageModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleImageSave}
                className="px-4 py-2 bg-[#611DD0] text-white rounded-lg disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Uploading..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal - UPDATED */}
      {changePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <button
                onClick={() => {
                  setChangePasswordModal(false);
                  setPasswordError("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  style={{ backgroundColor: "#fff" }}
                  placeholder="Enter new password (min. 6 characters)"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  style={{ backgroundColor: "#fff" }}
                  placeholder="Confirm new password"
                  disabled={isLoading}
                />
              </div>

              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setChangePasswordModal(false);
                  setPasswordError("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 bg-[#611DD0] text-white rounded-lg disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Edit Modal */}
      {editingField && (
        <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Edit {formatFieldName(editingField)}
              </h3>
              <button
                onClick={cancelEditing}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formatFieldName(editingField)}
              </label>

              {editingField === "aboutMe" ||
              editingField === "vibeDescription" ? (
                <textarea
                  value={editValue}
                  style={{ backgroundColor: "#fff" }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={4}
                  placeholder={`Enter your ${editingField}`}
                  disabled={isLoading}
                />
              ) : editingField === "gender" ? (
                <select
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  style={{ backgroundColor: "#fff" }}
                  disabled={isLoading}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="others">Others</option>
                </select>
              ) : editingField === "dob" ? (
                <input
                  type="date"
                  value={editValue}
                  style={{ backgroundColor: "#fff" }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  onChange={(e) => setEditValue(e.target.value)}
                  disabled={isLoading}
                />
              ) : (
                <input
                  type="text"
                  value={editValue}
                  style={{ backgroundColor: "#fff" }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent"
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={`Enter your ${editingField}`}
                  disabled={isLoading}
                />
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelEditing}
                className="px-4 py-2 border border-gray-300 cursor-pointer rounded-lg text-gray-700 hover:bg-gray-100"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSave(editingField)}
                className="px-4 py-2 bg-[#611DD0] text-white rounded-lg cursor-pointer disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Details */}
      <div className="rounded-2xl shadow-md bg-white p-6">
        <h1 className="text-lg font-semibold mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-500" /> Personal Details
        </h1>
        <div className="space-y-4">
          {/* Profile Picture */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  profilePicture ||
                  "https://avatars.githubusercontent.com/u/1?v=4"
                }
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">Profile Picture</p>
                <p className="text-xs text-gray-500">Click edit to change</p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => startEditing("profilePicture", profilePicture)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          </div>

          {/* Cover Image */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={
                  coverImage ||
                  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000&h=250&fit=crop"
                }
                alt="Cover"
                className="w-20 h-10 rounded-md object-cover"
              />
              <div>
                <p className="font-medium">Cover Image</p>
                <p className="text-xs text-gray-500">Click edit to change</p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => startEditing("coverImage", coverImage)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          </div>

          {/* Full Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 mr-2 text-purple-500" />
              <div>
                <p className="font-medium">Full Name</p>
                <p className="text-sm text-gray-600">{fullname || "Not set"}</p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => startEditing("fullname", fullname)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="rounded-2xl shadow-md bg-white p-4">
        <h1 className="text-lg font-semibold mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-blue-500" /> Account Information
        </h1>
        <div className="space-y-4">
          {[
            {
              label: "Username",
              value: username,
              field: "username",
              icon: User,
            },
            {
              label: "Email Address",
              value: email,
              field: "email",
              icon: Mail,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 mr-2 text-purple-500" />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-gray-600">
                    {item.value || "Not set"}
                  </p>
                </div>
              </div>
              <button
                className="p-2 hover:bg-gray-100 rounded-full"
                onClick={() => startEditing(item.field, item.value)}
                disabled={isLoading}
              >
                <Pencil className="h-4 w-4 text-blue-500" />
              </button>
            </div>
          ))}

          {/* Password field - now editable */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 mr-2 text-purple-500" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-gray-600">********</p>
              </div>
            </div>
            <button
              className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm hover:bg-blue-200"
              onClick={() => setChangePasswordModal(true)}
              disabled={isLoading}
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Demographic Information */}
      <div className="rounded-2xl shadow-md bg-white p-4">
        <h1 className="text-lg font-semibold mb-4 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-500" /> Demographic
          Information
        </h1>
        <div className="space-y-4">
          {/* Date of Birth */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cake className="w-5 h-5 mr-2 text-purple-500" />
              <div>
                <p className="font-medium">Date of Birth</p>
                <p className="text-sm text-gray-600">
                  {displayDob || "Not set"}
                </p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => startEditing("dob", dob)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          </div>

          {/* Gender */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 mr-2 text-purple-500" />
              <div>
                <p className="font-medium">Gender</p>
                <p className="text-sm text-gray-600">
                  {gender
                    ? gender.charAt(0).toLowerCase() + gender.slice(1)
                    : "Not set"}
                </p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => startEditing("gender", gender)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          </div>

          {/* Bio/About Me */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 mr-2 text-purple-500" />
              <div>
                <p className="font-medium">Bio/About Me</p>
                <p className="text-sm text-gray-600">
                  {aboutMe
                    ? aboutMe.length > 50
                      ? `${aboutMe.substring(0, 50)}...`
                      : aboutMe
                    : "Not set"}
                </p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => startEditing("aboutMe", aboutMe)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Vibe Information */}
      <div className="rounded-2xl shadow-md bg-white p-4">
        <h1 className="text-lg font-semibold mb-4 flex items-center">
          <VenetianMask className="w-5 h-5 mr-2 text-blue-500" /> Vibe
          Information
        </h1>
        <div className="space-y-4">
          {/* Vibe */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <VenetianMask className="w-5 h-5 mr-2 text-purple-500" />
              <div>
                <p className="font-medium">Vibe</p>
                <p className="text-sm text-gray-600">{vibe || "Not set"}</p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => startEditing("vibe", vibe)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          </div>

          {/* Vibe Description */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 mr-2 text-purple-500" />
              <div>
                <p className="font-medium">Vibe Description</p>
                <p className="text-sm text-gray-600">
                  {vibeDescription
                    ? vibeDescription.length > 50
                      ? `${vibeDescription.substring(0, 50)}...`
                      : vibeDescription
                    : "Not set"}
                </p>
              </div>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-full"
              onClick={() => startEditing("vibeDescription", vibeDescription)}
              disabled={isLoading}
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Social Connections */}
      <div className="rounded-2xl shadow-md bg-white p-4">
        <h1 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-500" /> Social Connections
        </h1>
        <div className="space-y-4">
          {[
            { label: "Posts", value: postsCount || 0, icon: Users },
            { label: "Followers", value: followers || 0, icon: Users },
            { label: "Following", value: following || 0, icon: Users },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5 mr-2 text-purple-500" />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-sm text-gray-600">{item.value}</p>
                </div>
              </div>
              <button className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm cursor-default">
                {item.value}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
