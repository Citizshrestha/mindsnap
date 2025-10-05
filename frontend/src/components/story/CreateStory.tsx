import { useState, useRef } from "react";
import { isAxiosError, AxiosError } from "axios";
import { toast } from "react-toastify";
import { FaWindowClose, FaCamera, FaPlay } from "react-icons/fa";
import { RiEmotionHappyLine } from "react-icons/ri";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface CreateStoryProps {
  onClose: () => void;
  onSave: (story: {
    caption: string;
    mediaUrl?: string;
    userId: string;
  }) => void;
  userId: string;
}

interface Content {
  url: string;
  mediaType: "image" | "video" | "text";
}

interface Emoji {
  native: string;
}

const CreateStory = ({ onClose, onSave, userId }: CreateStoryProps) => {
  const [caption, setCaption] = useState("");
  const [media, setMedia] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const handleEmojiSelect = (emoji: Emoji) => {
    setCaption(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption && !media) {
      toast.error("Please add a caption or media.");
      return;
    }

    if (media) {
      if (
        !/(image\/(jpg|jpeg|png|gif|webp|avif))|(video\/(mp4|mov))/.test(media.type)
      ) {
        toast.error(
          "Please upload a supported image (jpg, jpeg, png, gif, webp, avif) or video (mp4, mov) file."
        );
        return;
      }
      if (media.size > 10 * 1024 * 1024) {
        // 10MB limit
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
      const content: Content = { url: "", mediaType: "text" };

      // Replace the Cloudinary upload section with this:
      if (media) {
        console.log("Uploading media to Cloudinary...");
        const formData = new FormData();
        formData.append("file", media);
        formData.append(
          "upload_preset",
          import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || ""
        );
        formData.append("folder", "mindsnap/stories/${username}"); // saved with their respective username fetch it from userSlice

        // Remove any auto/ transformation that might be causing issues
        const uploadUrl = `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/upload`; 

        const res = await fetch(uploadUrl, { method: "POST", body: formData });
        const data = await res.json();
        console.log("Cloudinary response:", data);

        if (!res.ok) {
          throw new Error(
            `Cloudinary upload failed: ${
              data.error?.message || "Unknown error"
            }`
          );
        }

        content.url = data.secure_url;
        content.mediaType = media.type.startsWith("video") ? "video" : "image";
        console.log("Media uploaded successfully:", content);
      }

  

      onSave({ caption, mediaUrl: content.url || "", userId });
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
        errorMessage =
          (axiosErr.response?.data as { message?: string })?.message ||
          axiosErr.message ||
          errorMessage;
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
    <div className="fixed inset-0 bg-[#ffffff9b] bg-opacity-50 flex items-center justify-center z-10004">
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

        <h2 className="text-center text-[#611DD0] border-b-2 border-[#611DD0] text-xl font-semibold mb-6">
          Create New Story
        </h2>

        <form
          onSubmit={handleSubmit}
          className="w-full h-[calc(100%-100px)] mt-10 flex flex-col items-center justify-between"
        >
          <div className="flex flex-col gap-6 items-center w-[90%]">
            <div className="flex items-center gap-2 w-full">
              <FaCamera className="text-[#611DD0] text-2xl" />
              <h2 className="text-[#611DD0] text-sm font-medium">Photos</h2>
              <input
                type="file"
                accept="image/*,.avif"
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
            <div className="flex items-center gap-2 w-full relative">
              <h2 className="text-[#611DD0] text-sm font-medium">Message</h2>
              <div className="flex-1 relative">
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full h-20 p-2 pr-10 border border-gray-300 rounded text-center resize-none text-sm"
                  disabled={loading}
                  placeholder="Add a caption..."
                />
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="absolute right-2 top-2 text-[#611DD0] hover:text-[#4a0d8a] transition-colors"
                  disabled={loading}
                >
                  <RiEmotionHappyLine size={20} />
                </button>
                
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute top-12 right-0 z-[9999]"
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                      previewPosition="none"
                      skinTonePosition="none"
                    />
                  </div>
                )}
              </div>
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
