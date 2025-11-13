import React from 'react';
import type { MessageType } from '../../data/messageSample';

interface MessageContentProps {
  message: MessageType;
}

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  // Get media URL from either mediaUrl or content field
  const mediaUrl = message.mediaUrl || message.content;

  // Helper function to check if URL is a valid media URL (not just Cloudinary)
  const isMediaUrl = (url: string): boolean => {
    if (!url) return false;
    // Check for common media URL patterns
    return Boolean(
      url.includes('cloudinary.com') ||
      url.includes('imgur.com') ||
      url.includes('amazonaws.com') ||
      url.startsWith('data:image/') ||
      url.startsWith('data:video/') ||
      /\.(jpg|jpeg|png|gif|webp|mp4|mov|avi|webm)$/i.test(url)
    );
  };

  // Render image content
  const renderImage = () => {
    if (!mediaUrl || !isMediaUrl(mediaUrl)) {
      return <p className="text-gray-500 italic">Image not available</p>;
    }

    return (
      <div className="max-w-xs">
        <img
          src={mediaUrl}
          alt={message.fileName || 'Shared image'}
          className="rounded-lg max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
          }}
          onClick={() => window.open(mediaUrl, '_blank')}
        />
      </div>
    );
  };

  // Render video content
  const renderVideo = () => {
    if (!mediaUrl || !isMediaUrl(mediaUrl)) {
      return <p className="text-gray-500 italic">Video not available</p>;
    }

    return (
      <div className="max-w-xs">
        <video
          controls
          className="rounded-lg max-h-64 w-full"
          poster="https://via.placeholder.com/300x200?text=Video"
        >
          <source src={mediaUrl} type="video/mp4" />
          <source src={mediaUrl} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  // Render text content (excluding media URLs)
  const renderText = () => {
    // Don't show content if it's a media URL (this prevents showing URLs for media messages)
    if (!message.content || isMediaUrl(message.content)) {
      return null;
    }

    // Additional check to exclude Cloudinary URLs specifically
    if (message.content.includes('cloudinary.com') || message.content.includes('res.cloudinary.com')) {
      return null;
    }

    return <p className="break-words">{message.content}</p>;
  };

  // Render system message (for call notifications, etc.)
  const renderSystemMessage = () => {
    if (!message.content) return null;

    // Determine icon based on message content
    let icon = '📞';
    let bgColor = 'bg-blue-50';
    let textColor = 'text-blue-700';
    let borderColor = 'border-blue-200';

    if (message.content.includes('ended')) {
      icon = '📞';
      bgColor = 'bg-green-50';
      textColor = 'text-green-700';
      borderColor = 'border-green-200';
    } else if (message.content.includes('declined') || message.content.includes('Missed')) {
      icon = '📵';
      bgColor = 'bg-red-50';
      textColor = 'text-red-700';
      borderColor = 'border-red-200';
    }

    return (
      <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${bgColor} border ${borderColor}`}>
        <span className="text-lg">{icon}</span>
        <p className={`text-sm font-medium ${textColor}`}>{message.content}</p>
      </div>
    );
  };

  // Main render logic based on message type
  switch (message.messageType) {
    case 'image':
      return renderImage();
    case 'video':
      return renderVideo();
    case 'system':
      return renderSystemMessage();
    case 'text':
    default:
      return renderText();
  }
};

export default MessageContent;
