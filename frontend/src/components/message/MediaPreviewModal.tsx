import React from 'react';
import { RiCloseLine, RiDeleteBinLine, RiSendPlaneFill } from 'react-icons/ri';

interface MediaPreviewModalProps {
  isOpen: boolean;
  selectedMedia: File[];
  mediaCaption: string;
  isUploading: boolean;
  onClose: () => void;
  onRemoveMedia: (index: number) => void;
  onCaptionChange: (caption: string) => void;
  onSendMedia: () => void;
}

const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  isOpen,
  selectedMedia,
  mediaCaption,
  isUploading,
  onClose,
  onRemoveMedia,
  onCaptionChange,
  onSendMedia
}) => {
  if (!isOpen) return null;

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
          </div>
        </div>

        {/* Caption Input */}
        <div className="p-4 border-t">
          <textarea
            value={mediaCaption}
            onChange={(e) => onCaptionChange(e.target.value)}
            placeholder="Add a caption (optional)..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={3}
            disabled={isUploading}
          />
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
    </div>
  );
};

export default MediaPreviewModal;