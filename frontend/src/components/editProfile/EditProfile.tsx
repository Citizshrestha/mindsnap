// src/pages/EditProfile/EditProfile.tsx
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import {
  setProfilePicture,
  setUsername,
  setGender,
  setVibe,
  setUserProfile,
} from "../../redux/slices/userSlice";
import axiosClient from "../../api/axiosClient";
import defaultAvatar from "../../../public/images/default.jpg";
import { toast } from "react-toastify";
import type { AxiosError } from "axios";



const EditProfile: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    profilePicture,
    username,
    gender,
    vibe,
    dob,
    fullname,
    vibeDescription,
    aboutMe,
  } = useSelector((state: RootState) => state.user);

  // Local form state initialized from Redux
  const [fullnameState, setFullnameState] = useState<string>(fullname || "");
  const [usernameState, setUsernameState] = useState<string>(username || "");
  const [genderState, setGenderState] = useState<string>(gender || "");
  const [dobState, setDobState] = useState<string>(dob || "");
  const [vibeState, setVibeState] = useState<string>(vibe || "");
  const [vibeDescriptionState, setVibeDescriptionState] = useState<string>(
    vibeDescription || ""
  );
  const [aboutMeState, setAboutMeState] = useState<string>(aboutMe || "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);



  // Load server profile on mount and hydrate Redux + local state
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const data = response.data || {};

        // Save to Redux
        dispatch(setUserProfile(data));

        // Update local form state
        setFullnameState(data.fullname || "");
        setUsernameState(data.username || "");
        setGenderState(data.gender || "");
        setDobState(data.dob || "");
        setVibeState(data.vibe || "");
        setVibeDescriptionState(data.vibeDescription || "");
        setAboutMeState(data.aboutMe || "");
      } catch (err: unknown) {
        // Use type guard to check for AxiosError shape
        const errorObj = err as { message?: string; response?: { status?: number; data?: unknown } };
        console.error("Fetch profile error:", {
          message: errorObj?.message,
          status: errorObj?.response?.status,
          data: errorObj?.response?.data,
        });
        setError("Failed to load profile data");
        toast.error("Failed to load profile data");
      }
    };
    fetchProfile();
  }, [dispatch]);

  
 
  const handleSave = async () => {
    setError(null);
    setSuccess(null);
  setSaving(true);

    const updatedProfile = {
    fullname: fullnameState,
      username: usernameState,
      gender: genderState,
      dob: dobState,
      vibe: vibeState,
      vibeDescription: vibeDescriptionState,
      aboutMe: aboutMeState,
    };

    try {
      const response = await axiosClient.patch(
        "/api/users/update-profile",
        updatedProfile,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      const updated = response.data || {};

      // Update Redux
      dispatch(
        setUserProfile({
          fullname: updated.fullname,
          username: updated.username,
          gender: updated.gender,
          dob: updated.dob,
          vibe: updated.vibe,
          vibeDescription: updated.vibeDescription,
          aboutMe: updated.aboutMe,
          profilePicture: updated.profilePicture,
        })
      );

      // Update local state
      setFullnameState(updated.fullname ?? fullnameState);
      setUsernameState(updated.username ?? usernameState);
      setGenderState(updated.gender ?? genderState);
      setDobState(updated.dob ?? dobState);
      setVibeState(updated.vibe ?? vibeState);
      setVibeDescriptionState(
        updated.vibeDescription ?? vibeDescriptionState
      );
      setAboutMeState(updated.aboutMe ?? aboutMeState);

      if (updated.profilePicture !== undefined)
        dispatch(setProfilePicture(updated.profilePicture));
      if (updated.username !== undefined)
        dispatch(setUsername(updated.username));
      if (updated.gender !== undefined) dispatch(setGender(updated.gender));
      if (updated.vibe !== undefined) dispatch(setVibe(updated.vibe));

      setSuccess("Profile updated successfully!");
      toast.success("Profile updated successfully!");

      setTimeout(() => navigate("/profile"), 900);
    } catch (err: unknown) {
      // Use AxiosError type for better type safety
      const axiosErr = err as AxiosError<unknown>;
      console.error("Update profile error:", {
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
        "Failed to update profile. Please try again.";

      setError(String(serverMessage));
      toast.error(String(serverMessage));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen overflow-y-scroll mt-19 w-[100%] ml-18 px-6 py-10 font-sans hide-scrollbar"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <a
              href="/profile"
              className="text-[#5C27FE] flex justify-between items-center gap-2 text-2xl font-semibold"
            >
              Back to
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 20.25a8.25 8.25 0 0115 0"
                />
              </svg>
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={profilePicture || defaultAvatar}
              alt="Profile"
              className="w-40 h-40 rounded-full object-cover"
              onError={(e) => (e.currentTarget.src = defaultAvatar)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold">Full Name</label>
            <input
              style={{ background: "#fff", color: "#111" }}
              className="w-full border border-gray-800 rounded px-3 py-2"
              value={fullnameState}
              onChange={(e) => setFullnameState(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold">Username</label>
            <input
              style={{ background: "#fff", color: "#111" }}
              className="w-full border border-gray-800 rounded px-3 py-2"
              value={usernameState}
              onChange={(e) => setUsernameState(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold">Gender</label>
            <select
              className="w-full border border-gray-800 rounded px-3 py-2"
              value={genderState}
              onChange={(e) => setGenderState(e.target.value)}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold">Date of Birth</label>
            <input
              type="date"
              style={{ background: "#fff", color: "#111" }}
              className="w-full border border-gray-800 rounded px-3 py-2"
              value={dobState}
              onChange={(e) => setDobState(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block font-semibold">Vibe:</label>
          <input
            style={{ background: "#fff", color: "#111" }}
            className="w-full border border-gray-800 rounded px-3 py-2"
            value={vibeState}
            onChange={(e) => setVibeState(e.target.value)}
            placeholder="Travel"
          />
        </div>

        <div className="mt-4">
          <label className="block font-semibold">Vibe Description</label>
          <input
            style={{ background: "#fff", color: "#111" }}
            className="w-full border border-gray-800 rounded px-3 py-2"
            value={vibeDescriptionState}
            placeholder="What Your Vibe Says About You"
            onChange={(e) => setVibeDescriptionState(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="block font-semibold">About Me:</label>
          <textarea
            style={{ color: "#111" }}
            className="w-full border border-gray-800 rounded px-3 py-2"
            value={aboutMeState}
            onChange={(e) => setAboutMeState(e.target.value)}
            rows={3}
            placeholder="About yourself"
          />
        </div>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {success && <p className="text-green-500 text-center mt-2">{success}</p>}

        <div className="mt-6 text-center">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#5C27FE] disabled:opacity-50 text-white font-semibold px-8 py-2 rounded hover:bg-[#4b1eea] transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
