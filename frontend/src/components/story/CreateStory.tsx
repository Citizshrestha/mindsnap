// src/components/createStory/CreateStory.tsx
import { useState } from "react";
import axiosClient from "../../api/axiosClient";
import { toast } from "react-toastify";
import { FaWindowClose, FaCamera, FaPlay } from "react-icons/fa";

interface CreateStoryProps {
  onClose: () => void;
  onSave: (story: { caption: string; mediaUrl?: string; userId: string }) => void;
  userId: string; // Pass from parent
}

const CreateStory = ({ onClose, onSave, userId }: CreateStoryProps) => {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption && !media) {
      toast.error("Please add a caption or media.");
      return;
    }

    // Validate userId as ObjectId (24 hex chars)
    if (!userId || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      toast.error("Invalid user ID. Please log in again.");
      onClose();
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      toast.error("Authentication token missing. Please log in.");
      onClose();
      return;
    }

    try {
      setLoading(true);
      let mediaUrl = "";

      if (media) {
        console.log("Uploading media to Cloudinary...");
        const formData = new FormData();
        formData.append("file", media);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "");
        formData.append("folder", `mindsnap/stories/${userId}`);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        console.log("Cloudinary response:", data);
        if (!res.ok) {
          throw new Error(data.error?.message || "Upload failed");
        }
        mediaUrl = data.secure_url;
        console.log("Media uploaded successfully:", mediaUrl);
      }

      // Save to MongoDB - ensure user is ObjectId
      console.log("Saving story to database...");
      const storyData = {
        user: userId, // Mongoose will cast string to ObjectId if valid
        content: mediaUrl || caption,
      };

      const response = await axiosClient.post("/api/stories", storyData, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("Database response:", response.data);
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to save story");
      }

      onSave({ caption, mediaUrl, userId });
      toast.success("Story created successfully!");
      onClose();
    } catch (err) {
  
      toast.error(`Error: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#ffffff9b] bg-opacity-50 flex items-center justify-center z-50">
      <div
        style={{ textAlign: "left" }}
        className="relative w-[470px] h-[450px] text-left overflow-hidden rounded-[20px] border-2 border-[#611DD0] bg-white p-4 cursor-pointer hover:border-[#a679ee] transition-colors"
      >
        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#611DD0] hover:text-[#a679ee] text-xl"
          disabled={loading}
        >
          <FaWindowClose size={25} />
        </button>

        {/* Title */}
        <h2 className="text-center text-[#611DD0] border-b-2 border-[#611DD0] text-xl font-semibold mb-6">Create New Story</h2>

        <form onSubmit={handleSubmit} className="w-full h-[calc(100%-100px)] mt-10 flex flex-col items-center justify-between">
          {/* File Inputs with Icons */}
          <div className="flex flex-col gap-6 items-center w-[90%]">
            <div className="flex items-center gap-2 w-full">
              <FaCamera className="text-[#611DD0] text-2xl" />
              <h2 className="text-[#611DD0] text-sm font-medium">Photos</h2>
              <input
                type="file"
                accept="image/*"
                style={{ backgroundColor: "#fff" }}
                onChange={(e) => setMedia(e.target.files?.[0] || null)}
                className="flex-1 text-center text-sm border border-gray-300 rounded p-1"
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2 w-full">
              <FaPlay className="text-[#611DD0] text-2xl" />
              <h2 className="text-[#611DD0] text-sm font-medium">Videos</h2>
              <input
                type="file"
                accept="video/*"
                style={{ backgroundColor: "#fff" }}
                onChange={(e) => setMedia(e.target.files?.[0] || null)}
                className="flex-1 text-center text-sm border border-gray-300 rounded p-1"
                disabled={loading}
              />
            </div>
            <div className="flex items-center gap-2 w-full">
              <h2 className="text-[#611DD0] text-sm font-medium">Message</h2>
              {/* Caption Textarea */}
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full h-20 p-2 border border-gray-300 rounded text-center resize-none text-sm"
                disabled={loading}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="absolute right-6 bottom-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 rounded text-sm"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{ color: "#fff" }}
              className="px-4 py-2 bg-[#611DD0] rounded text-sm"
              disabled={loading}
            >
              {loading ? "Publishing..." : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStory;