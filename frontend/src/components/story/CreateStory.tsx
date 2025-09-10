import { useState } from "react";
import axiosClient from "../../api/axiosClient";
import { isAxiosError, AxiosError } from "axios";
import { toast } from "react-toastify";
import { FaWindowClose, FaCamera, FaPlay } from "react-icons/fa";

interface CreateStoryProps {
  onClose: () => void;
  onSave: (story: { caption: string; mediaUrl?: string; userId: string }) => void;
  userId: string;
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

    if (media) {
      if (!/(image\/(jpg|jpeg|png|gif))|(video\/(mp4|mov))/.test(media.type)) {
        toast.error("Please upload a supported image (jpg, jpeg, png, gif) or video (mp4, mov) file.");
        return;
      }
      if (media.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("File size must not exceed 10MB.");
        return;
      }
    }

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
      let content = "";

      if (media) {
        console.log("Uploading image to Cloudinary...");
        const formData = new FormData();
        formData.append("file", media);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "");
        formData.append("folder", "mindsnap/stories"); 

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        console.log("Cloudinary response:", data);
        if (!res.ok) {
          throw new Error(`Cloudinary upload failed: ${data.error?.message || "Unknown error"}`);
        }
        content = data.secure_url;
        console.log("Image uploaded successfully:", content);
      }

      console.log("Sending story data to API:", { caption, content, user: userId });
      const response = await axiosClient.post("/api/stories", {
        caption,
        content: content || "",
        user: userId,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("API response (full):", response.data);
      if (!response.data || typeof response.data !== "object" || !response.data.success) {
        throw new Error(`Database error: ${response.data?.message || "Failed to save story"}`);
      }

      // const { story } = response.data; // Extract the created story from the response
      onSave({ caption, mediaUrl: content || "", userId }); // Pass the new story data back
      toast.success("Story created successfully!");
      onClose();
    } catch (err: unknown) {
      let errorMessage = "Failed to create story";
      let responseData: unknown = undefined;
      let status: number | undefined = undefined;
      let requestUrl: string | undefined = undefined;

      if (isAxiosError(err)) {
        const axiosErr = err as AxiosError;
        responseData = axiosErr.response?.data;
        status = axiosErr.response?.status;
        requestUrl = axiosErr.config?.url;
        errorMessage = (axiosErr.response?.data as  AxiosError)?.message || axiosErr.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === "string") {
        errorMessage = err;
      }

      toast.error(`Error: ${errorMessage}`);
      console.error("Story creation error details:", {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        response: responseData,
        status,
        request: requestUrl,
      });
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
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#611DD0] hover:text-[#a679ee] text-xl"
          disabled={loading}
        >
          <FaWindowClose size={25} />
        </button>

        <h2 className="text-center text-[#611DD0] border-b-2 border-[#611DD0] text-xl font-semibold mb-6">Create New Story</h2>

        <form onSubmit={handleSubmit} className="w-full h-[calc(100%-100px)] mt-10 flex flex-col items-center justify-between">
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
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full h-20 p-2 border border-gray-300 rounded text-center resize-none text-sm"
                disabled={loading}
              />
            </div>
          </div>

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