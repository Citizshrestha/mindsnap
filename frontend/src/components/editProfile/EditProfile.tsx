import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { RootState } from "../../redux/store";
import { setProfilePicture, setUsername, setGender, setVibe } from "../../redux/slices/userSlice"; // Import all actions
import axiosClient from "../../api/axiosClient"; // Adjust path if needed
import defaultAvatar from "../../../public/images/default.jpg";
import { toast } from "react-toastify";

const EditProfile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profilePicture, username, gender, vibe } = useSelector((state: RootState) => state.user);

  // Initialize state with existing Redux values; use defaults for missing fields
  const [fullName, setFullName] = useState("");
  const [usernameState, setUsernameState] = useState(username || "");
  const [genderState, setGenderState] = useState(gender || "");
  const [dob, setDob] = useState("");
  const [vibeState, setVibeState] = useState(vibe || "");
  const [vibeDescription, setVibeDescription] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load initial data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axiosClient.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        const { profilePicture, username, gender, vibe, fullName, dob, vibeDescription, aboutMe } = response.data;
        dispatch(setProfilePicture(profilePicture || ""));
        dispatch(setUsername(username || ""));
        dispatch(setGender(gender || ""));
        dispatch(setVibe(vibe || ""));
        setFullName(fullName || "");
        setDob(dob || "");
        setVibeDescription(vibeDescription || "");
        setAboutMe(aboutMe || "");
      } catch (err: unknown) {
        setError("Failed to load profile data");
        toast.error(String(err));
      }
    };
    fetchProfile(); // Fetch on mount to ensure all fields are populated
  }, [dispatch]);

  const handleSave = async () => {
    const updatedProfile = {
      fullName,
      username: usernameState,
      gender: genderState,
      dob,
      vibe: vibeState,
      vibeDescription,
      aboutMe,
    };

    try {
      // Send updated profile to backend
      const response = await axiosClient.put("/api/users/profile", updatedProfile, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
      });

      // Update Redux state with server response
      const { profilePicture, username, gender, vibe } = response.data;
      dispatch(setProfilePicture(profilePicture || ""));
      dispatch(setUsername(username || ""));
      dispatch(setGender(gender || ""));
      dispatch(setVibe(vibe || ""));

      // Update localStorage
      localStorage.setItem("profilePicture", profilePicture || "");
      localStorage.setItem("username", username || "");
      localStorage.setItem("gender", gender || "");
      localStorage.setItem("vibe", vibe || "");

      // Set success message and navigate back
      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        navigate("/profile");
      }, 1000); // Delay to show success message
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error("Error updating profile:", err);
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
            <a href="/profile" className="text-[#5C27FE] flex justify-between items-center gap-2 text-2xl font-semibold">
              Back to
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a8.25 8.25 0 0115 0" />
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
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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
              value={dob}
              onChange={(e) => setDob(e.target.value)}
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
            value={vibeDescription}
            placeholder="What Your Vibe Says About You"
            onChange={(e) => setVibeDescription(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="block font-semibold">About Me:</label>
          <textarea
            style={{ color: "#111" }}
            className="w-full border border-gray-800 rounded px-3 py-2"
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            rows={3}
            placeholder="About yourself"
          />
        </div>

        {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        {success && <p className="text-green-500 text-center mt-2">{success}</p>}

        <div className="mt-6 text-center">
          <button
            onClick={handleSave}
            className="bg-[#5C27FE] text-white font-semibold px-8 py-2 rounded hover:bg-[#4b1eea] transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;