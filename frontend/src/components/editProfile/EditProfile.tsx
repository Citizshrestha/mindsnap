import  { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../redux/store';

const EditProfile = () => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState("");
  const { profilePicture } = useSelector((state: RootState) => state.user);
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [vibe, setVibe] = useState('');
  const [vibeDescription, setVibeDescription] = useState('');
  const [aboutMe, setAboutMe] = useState('');

  const handleSave = () => {
    const updatedProfile = {
      fullName,
      username,
      gender,
      dob,
      vibe,
      vibeDescription,
      aboutMe
    };
    console.log('Saved Profile:', updatedProfile);
  };

  return (
    <div
      className="min-h-screen overflow-y-scroll  mt-19 w-[100%] ml-18 px-6 py-10 font-sans hide-scrollbar"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-8">
        <div className="flex items-center justify-between mb-8">
          
          <h2 className="text-3xl font-semibold text-[#5C27FE]">Edit Profile</h2>
          <div className="flex items-center gap-2">
            <span className="text-[#5C27FE] font-semibold">Profile</span>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 20.25a8.25 8.25 0 0115 0" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={profilePicture}
              alt="Profile"
              className="w-28 h-28 rounded-full object-cover"
            />
          
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-semibold">Full Name</label>
            <input style={{background:"#fff", color: "#111"}}
              className="w-full border  text-white border-gray-800 rounded px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold">Username</label>
            <input style={{background:"#fff",color: "#111"}}
              className="w-full border border-gray-800 rounded px-3 py-2"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block font-semibold">Gender</label>
            <select  className="w-full border border-gray-800 rounded px-3 py-2"  value={gender} name="" id=""  onChange={(e) => setGender(e.target.value)}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
          
          </div>
          <div>
            <label className="block font-semibold">Date of Birth</label>
            <input
              type="date" style={{background:"#fff",color: "#111"}}
              className="w-full border border-gray-800 rounded px-3 py-2"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block font-semibold">Vibe:</label>
          <input style={{background: "#fff",color: "#111"}}
            className="w-full border border-gray-800 rounded px-3 py-2"
            value={vibe}
            onChange={(e) => setVibe(e.target.value)}
            placeholder='Travel'
          />
        </div>

        <div className="mt-4">
          <label className="block font-semibold">Vibe Description</label>
          <input style={{background: "#fff",color: "#111"}}
            className="w-full border border-gray-800 rounded px-3 py-2"
            value={vibeDescription}
            placeholder='What Your Vibe Says About You'
            onChange={(e) => setVibeDescription(e.target.value)}
          />
        </div>

        <div className="mt-4">
          <label className="block font-semibold">About Me:</label>
          <textarea style={{color: "#111"}}
            className="w-full border border-gray-800 rounded px-3 py-2"
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            rows={3}
            placeholder='About yourself'
          />
        </div>

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