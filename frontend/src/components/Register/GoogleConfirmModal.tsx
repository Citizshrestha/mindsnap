import React from "react";

interface GoogleConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name: string;
  email: string;
  picture?: string;
}

const GoogleConfirmModal: React.FC<GoogleConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  name,
  email,
  picture,
}) => {
  if (!open) return null;
  return (
    <div className="fixed bg-transparent inset-0 z-50 flex items-center justify-center bg-opacity-60">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md text-center relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
        <div className="flex flex-col items-center">
          {picture && (
            <img
              src={picture}
              alt="Google profile"
              className="w-20 h-20 rounded-full mb-4 border-4 border-blue-400 shadow-md"
            />
          )}
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Continue with Google?</h2>
          <p className="text-lg text-gray-700 mb-4">You are signing up as:</p>
          <div className="mb-4">
            <span className="block font-semibold text-blue-700 text-lg">{name}</span>
            <span className="block text-gray-500">{email}</span>
          </div>
          <p className="text-gray-600 mb-6">MindSnap will use your Google account to create your profile. Do you want to continue?</p>
          <button
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:from-blue-600 hover:to-purple-600 transition-colors text-lg mb-2"
            onClick={onConfirm}
          >
            Yes, Continue
          </button>
          <button
            className="text-gray-500 hover:text-gray-700 text-sm underline"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoogleConfirmModal;
