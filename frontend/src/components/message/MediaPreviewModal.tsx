import React, { useRef, useState, useCallback, useEffect } from 'react';
import { RiCloseLine, RiDeleteBinLine, RiSendPlaneFill, RiAddLine } from 'react-icons/ri';
import { HiOutlineEmojiHappy } from "react-icons/hi";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  selectedMedia: File[];
  mediaCaption: string;
  isUploading: boolean;
  onClose: () => void;
  onRemoveMedia: (index: number) => void;
  onCaptionChange: (caption: string) => void;
  onSendMedia: () => void;
  onAddMoreFiles: () => void;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  isOpen,
  selectedMedia,
  mediaCaption,
  isUploading,
  onClose,
  onRemoveMedia,
  onCaptionChange,
  onSendMedia,
  onAddMoreFiles,
}) => {
  // CRITICAL: Early return MUST come before any hooks
  if (!isOpen) return null;
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [emojiPickerPosition, setEmojiPickerPosition] = useState({ top: 0, left: 0 });

  // Emoji picker functions
  const toggleEmojiPicker = useCallback(() => {
    if (emojiButtonRef.current) {
      const buttonRect = emojiButtonRef.current.getBoundingClientRect();
      const pickerHeight = 350; // Approximate height of emoji picker
      const pickerWidth = 320; // Approximate width of emoji picker
      
      // Calculate position - show above button to avoid going off-screen
      let top = buttonRect.top - pickerHeight - 8;
      let left = buttonRect.left - pickerWidth + 40; // Align right edge with button area
      
      // Ensure picker doesn't go off-screen horizontally
      if (left + pickerWidth > window.innerWidth) {
        left = window.innerWidth - pickerWidth - 20;
      }
      if (left < 20) {
        left = 20;
      }
      
      // Ensure picker doesn't go off-screen vertically
      if (top < 20) {
        top = 20;
      }
      
      setEmojiPickerPosition({ top, left });
    }
    setShowEmojiPicker(!showEmojiPicker);
  }, [showEmojiPicker]);

  const handleEmojiSelect = useCallback((emoji: any) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart || 0;
      const end = textarea.selectionEnd || 0;
      const newText = mediaCaption.slice(0, start) + emoji.native + mediaCaption.slice(end);
      onCaptionChange(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.native.length, start + emoji.native.length);
      }, 0);
    }
    setShowEmojiPicker(false);
  }, [mediaCaption, onCaptionChange]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        showEmojiPicker &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target) &&
        !target.closest('.emoji-picker')
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const getFilePreview = (file: File, index: number) => {
    const fileUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    return (
      <div key={index} className="relative group">
        {isVideo ? (
          <video
            src={fileUrl}
            className="w-full h-32 object-cover rounded-lg"
            controls={false}
            muted
          />
        ) : (
          <img
            src={fileUrl}
            alt={`Preview ${index + 1}`}
            className="w-full h-32 object-cover rounded-lg"
          />
        )}
        <button
          onClick={() => onRemoveMedia(index)}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          disabled={isUploading}
        >
          <RiDeleteBinLine size={14} />
        </button>
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          {isVideo ? 'Video' : 'Image'}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-transparent mt-35 ml-5 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Send Media ({selectedMedia.length} file{selectedMedia.length !== 1 ? 's' : ''})
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isUploading}
          >
            <RiCloseLine size={24} />
          </button>
        </div>

        {/* Media Preview Grid */}
        <div className="p-4 max-h-60 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedMedia.map((file, index) => getFilePreview(file, index))}
            {/* Add More Files Button */}
            <div 
              onClick={onAddMoreFiles}
              className="border-2 border-dashed border-gray-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <RiAddLine size={24} className="text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">Add More</span>
            </div>
          </div>
        </div>

        {/* Caption Input */}
        <div className="p-4 border-t relative">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={mediaCaption}
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Add a caption (optional)..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
              rows={3}
              disabled={isUploading}
            />
            
            {/* Emoji Button */}
            <button
              ref={emojiButtonRef}
              type="button"
              onClick={toggleEmojiPicker}
              className="absolute top-3 right-3 text-gray-500 hover:text-purple-600 transition-colors"
              title="Add emoji"
              disabled={isUploading}
            >
              <HiOutlineEmojiHappy size={20} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedMedia.length} file{selectedMedia.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={onSendMedia}
              disabled={isUploading || selectedMedia.length === 0}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <RiSendPlaneFill size={16} />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          className="emoji-picker fixed z-[999999]"
          style={{
            top: `${emojiPickerPosition.top}px`,
            left: `${emojiPickerPosition.left}px`,
            zIndex: 999999
          }}
        >
          <Picker
            data={data}
            onEmojiSelect={handleEmojiSelect}
            theme="light"
            set="native"
            showPreview={false}
            showSkinTones={false}
            emojiButtonSize={28}
            emojiSize={20}
            maxFrequentRows={2}
          />
        </div>
      )}
    </div>
  );
};

export default MediaPreviewModal;