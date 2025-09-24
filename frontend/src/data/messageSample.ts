// data/messageSample.ts - Update your MessageType interface
export interface Receiver {
  _id: string;
  username?: string;
  profilePicture?: string;
}

export interface Sender {
  _id: string;
  username?: string;
  profilePicture?: string;
}

export type MessageType = {
  _id: string;
  content: string;
  messageType: "text" | "image" | "video"; // Add image and video types
  createdAt: string;
  status: string;
  sender: Sender;
  receiver: Receiver; 
  replyTo?: string;
  isPinned?: boolean;
  reactions?: Array<{ user: string; reaction: string }>;
  mediaUrl?: string;
  fileName?: string;
  isEdited?: boolean;
  editedAt?: string;
};

export const messageSample: MessageType[] = [
  {
    _id: "m1",
    content: "Hey, are you free tomorrow?",
    messageType: "text",
    createdAt: "2025-09-05T09:00:00Z",
    status: "sent",
    sender: { _id: "user1" },
    receiver: { _id: "user2" },
  },
  {
    _id: "m2",
    content: "Yes! What time?",
    messageType: "text",
    createdAt: "2025-09-05T09:01:00Z",
    status: "sent",
    sender: { _id: "user2" },
    receiver: { _id: "user1" },
  },
  {
    _id: "m3",
    content: "How about 3 PM?",
    messageType: "text",
    createdAt: "2025-09-05T09:02:00Z",
    status: "sent",
    sender: { _id: "user1" },
    receiver: { _id: "user2" },
  },
  {
    _id: "m4",
    content: "Can we meet today?",
    messageType: "text",
    createdAt: "2025-09-05T09:10:00Z",
    status: "sent",
    sender: { _id: "user1" },
    receiver: { _id: "user3" },
  },
  {
    _id: "m5",
    content: "Sure, at 6 PM?",
    messageType: "text",
    createdAt: "2025-09-05T09:11:00Z",
    status: "sent",
    sender: { _id: "user3" },
    receiver: { _id: "user1" },
  },
];