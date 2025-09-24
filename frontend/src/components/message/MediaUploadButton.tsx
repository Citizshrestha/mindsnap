import React from 'react';
import { RiImageLine } from 'react-icons/ri';

interface MediaUploadButtonProps {
  onFileSelect: (files: File[]) => void;
  disabled?: boolean;
  isUploading?: boolean;
  currentConversationId?: string | null;
  editingMessage?: any;
}

const MediaUploadButton: React.FC<MediaUploadButtonProps> = ({
  onFileSelect,
  disabled = false,
  isUploading = false,
  currentConversationId,
  editingMessage
}) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileSelect(files);
    }
    // Clear the input to allow selecting the same files again
    event.target.value = '';
  };

  const isDisabled = disabled || 
    isUploading || 
    !currentConversationId || 
    !!editingMessage;

  return (
    <>
      <input
        type="file"
        id="media-upload-input"
        accept="image/*,video/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={isDisabled}
      />
      <label
        htmlFor="media-upload-input"
        className={`w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-700 transition-colors ${
          isDisabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        title={
          !currentConversationId
            ? "Select a conversation"
            : isUploading
            ? "Uploading..."
            : "Upload media files"
        }
      >
        <RiImageLine className="text-white" size={16} />
      </label>
    </>
  );
};

export default MediaUploadButton;