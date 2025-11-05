export interface Post {
  id: string;
  name: string;
  username: string;
  time: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  profilePicture: string;
  media: {
    type: "image" | "video" | "audio" | "file";
    url: string;
    name?: string;
  } | null;
  userId: string;
  userReaction: string | null;
  reactionCounts?: {
    [key: string]: number;
  };
}

export interface Emoji {
  native: string;
  id: string;
}

export interface Comment {
  _id: string;
  user: {
    _id: string;
    username: string;
    profilePicture: string;
  };
  content: string;
  createdAt: string;
  likes: string[];
  replies?: Reply[];
  replyCount?: number;
}

export interface Reply {
  _id: string;
  user: {
    _id: string;
    username: string;
    profilePicture: string;
  };
  content: string;
  createdAt: string;
  likes: string[];
  parentComment?: string;
}

export interface CommentState {
  [key: string]: {
    content: string;
    showInput: boolean;
    comments: Comment[];
    isSubmitting: boolean;
    showCommentEmojiPicker: boolean;
    replyingTo: string | null;
    replyContent: string;
    showReplyEmojiPicker: string | null;
    expandedReplies: { [commentId: string]: boolean };
  };
}