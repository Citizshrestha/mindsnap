import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import MaleAvatar from "../../../public/images/Male Avatar.png";
import FemaleAvatar from "../../../public/images/Female Avatar.webp";
import DefaultAvatar from "../../../public/images/default.jpg";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import {
  setProfilePicture,
  setFullName,
  setUsername,
  setGender,
} from "../../redux/slices/userSlice";
import axiosClient from "../../api/axiosClient";
import type { RootState } from "../../redux/store";
import {
  FaRegCommentDots,
  FaShare,
  FaEllipsisV,
  FaVideo,
  FaPaperPlane,
  FaSmile,
  FaReply,
  FaCaretDown,
  FaCaretUp,
} from "react-icons/fa";
import { BiSolidLike } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import HashtagList from "../HashtagList/HashtagList";
import Story from "../../components/story/Story";
import { socketService } from "../../services/socketServices";
import { useSocketNotifications } from "../../hooks/useSocketNotifications";

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

interface Emoji {
  native: string;
  id: string;
}

interface Comment {
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

interface Reply {
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

interface CommentState {
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

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

const scaleVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15
    }
  }
};

const slideInVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 150,
      damping: 15
    }
  }
};

const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

const hoverScale = {
  scale: 1.02,
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 15
  }
};

const tapScale = {
  scale: 0.98
};

const Home = () => {
  const dispatch = useDispatch();
  useSocketNotifications();

  const {
    profilePicture,
    fullname,
    gender,
    _id: currentUserId,
  } = useSelector((state: RootState) => state.user);

  const [posts, setPosts] = useState<Post[]>([]);
  const [showPostOptions, setShowPostOptions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<
    "image" | "video" | null
  >(null);
  const [showReactionOptions, setShowReactionOptions] = useState<{
    [key: string]: boolean;
  }>({});
  const [showOptionsMenu, setShowOptionsMenu] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const commentEmojiPickerRef = useRef<HTMLDivElement>(null);
  const replyEmojiPickerRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const [commentStates, setCommentStates] = useState<CommentState>({});
  const [expandedComments, setExpandedComments] = useState<{
    [key: string]: boolean;
  }>({});

  // Function to get reaction icon based on reaction type
  const getReactionIcon = (reactionType: string) => {
    switch (reactionType) {
      case "love":
        return "❤️";
      case "haha":
        return "😂";
      case "wow":
        return "😮";
      case "sad":
        return "😢";
      case "angry":
        return "😠";
      default:
        return "👍"; // Default to like
    }
  };

  const handleCommentLike = async (postId: string, commentId: string) => {
    try {
      const response = await axiosClient.post(
        `/api/comments/posts/${postId}/comments/${commentId}/like`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: prev[postId]?.comments.map((comment) =>
            comment._id === commentId
              ? { ...comment, likes: response.data.likes }
              : comment
          ),
        },
      }));

      // Send comment like notification
      const comment = commentStates[postId]?.comments.find(
        (c) => c._id === commentId
      );
      if (comment && comment.user._id !== currentUserId) {
        const userState = {
          user: {
            username: fullname || "User",
            profilePicture: profilePicture || "",
            _id: currentUserId,
          },
        };
        localStorage.setItem("userState", JSON.stringify(userState));

        socketService.sendCommentLikeNotification({
          recipientId: comment.user._id,
          senderId: currentUserId,
          targetType: "Comment",
          targetId: commentId,
          type: "like",
        });
      }

      toast.success("Comment like toggled successfully!");
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error("Failed to like comment");
    }
  };

  // Add socket connection on component mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userId = localStorage.getItem("userId") || currentUserId;

    if (token && userId) {
      socketService.connect(token, userId).catch((error) => {
        console.error("Socket connection failed:", error);
      });
    }

    return () => {
      if (socketService.isSocketConnected()) {
        socketService.disconnect();
      }
    };
  }, [currentUserId]);

  const getAvatarByGender = (gender: string) => {
    if (gender?.toLowerCase() === "male") return MaleAvatar;
    else if (gender?.toLowerCase() === "female") return FemaleAvatar;
    else return DefaultAvatar;
  };

  const handleCommentChange = (postId: string, content: string) => {
    setCommentStates((prev) => ({
      ...prev,
      [postId]: {
        ...(prev[postId] || {
          comments: [],
          isSubmitting: false,
          showCommentEmojiPicker: false,
          replyingTo: null,
          replyContent: "",
          showReplyEmojiPicker: null,
          expandedReplies: {},
        }),
        content,
      },
    }));
  };

  const handleReplyChange = (postId: string, commentId: string, content: string) => {
    setCommentStates((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        replyContent: content,
        replyingTo: commentId,
      },
    }));
  };

  const handleSubmitComment = async (postId: string) => {
    try {
      console.log("=== SUBMITTING COMMENT DEBUG ===");
      console.log("Post ID:", postId);
      console.log("Comment content:", commentStates[postId]?.content);

      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isSubmitting: true,
        },
      }));

      const response = await axiosClient.post(
        `/api/comments/posts/${postId}/comments`,
        { content: commentStates[postId]?.content },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      console.log("Comment response:", response.data);

      if (response.data) {
        // Update the post's comment count
        setPosts((prevPosts) => {
          const updatedPosts = prevPosts.map((post) => {
            if (post.id === postId) {
              const newCommentCount = post.comments + 1;
              console.log(
                `Updating post ${postId} comments from ${post.comments} to ${newCommentCount}`
              );
              return { ...post, comments: newCommentCount };
            }
            return post;
          });

          console.log("Updated posts with new comment count:", updatedPosts);
          return updatedPosts;
        });

        // Add the new comment to the state
        setCommentStates((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            content: "",
            showInput: false,
            showCommentEmojiPicker: false,
            comments: [
              { ...response.data, likes: [], replies: [], replyCount: 0 },
              ...(prev[postId]?.comments || []),
            ],
            isSubmitting: false,
          },
        }));

        // Send comment notification
        const post = posts.find((p) => p.id === postId);
        if (post && post.userId !== currentUserId) {
          const userState = {
            user: {
              username: fullname || "User",
              profilePicture: profilePicture || "",
              _id: currentUserId,
            },
          };
          localStorage.setItem("userState", JSON.stringify(userState));

          socketService.sendCommentNotification({
            recipientId: post.userId,
            senderId: currentUserId,
            targetType: "Post",
            targetId: postId,
            type: "comment",
          });
        }

        toast.success("Comment added successfully!");
      }
    } catch (error: any) {
      console.error("Error adding comment:", error);
      if (error.response) {
        console.error("Error response data:", error.response.data);
        console.error("Error response status:", error.response.status);
        toast.error(error.response.data.message || "Failed to add comment");
      } else if (error.request) {
        console.error("Error request:", error.request);
        toast.error("Network error. Please check your connection.");
      } else {
        console.error("Error message:", error.message);
        toast.error("Failed to add comment");
      }

      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isSubmitting: false,
        },
      }));
    }
  };

  // For adding a reply
  const handleSubmitReply = async (postId: string, commentId: string) => {
    try {
      const replyContent = commentStates[postId]?.replyContent;
      if (!replyContent?.trim()) return;

      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isSubmitting: true,
        },
      }));

      // Use the correct endpoint
      const response = await axiosClient.post(
        `/api/comments/posts/${postId}/comments/${commentId}/replies`,
        { content: replyContent },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data) {
        // Update the comment with the new reply
        setCommentStates((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            replyContent: "",
            replyingTo: null,
            showReplyEmojiPicker: null,
            comments: prev[postId]?.comments.map((comment) => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), response.data],
                  replyCount: (comment.replyCount || 0) + 1,
                };
              }
              return comment;
            }),
            isSubmitting: false,
          },
        }));

        toast.success("Reply added successfully!");
      }
    } catch (error: any) {
      console.error("Error adding reply:", error);
      toast.error(error.response?.data?.message || "Failed to add reply");
      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          isSubmitting: false,
        },
      }));
    }
  };

  // For getting replies
  const fetchReplies = async (postId: string, commentId: string) => {
    try {
      const response = await axiosClient.get(
        `/api/comments/posts/${postId}/comments/${commentId}/replies`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          comments: prev[postId]?.comments.map((comment) => {
            if (comment._id === commentId) {
              return {
                ...comment,
                replies: response.data,
                replyCount: response.data.length,
              };
            }
            return comment;
          }),
          expandedReplies: {
            ...prev[postId]?.expandedReplies,
            [commentId]: true,
          },
        },
      }));
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast.error("Failed to load replies");
    }
  };

  const fetchComments = async (postId: string) => {
    try {
      const response = await axiosClient.get(
        `/api/comments/posts/${postId}/comments`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...(prev[postId] || {
            content: "",
            showInput: false,
            isSubmitting: false,
            showCommentEmojiPicker: false,
            replyingTo: null,
            replyContent: "",
            showReplyEmojiPicker: null,
            expandedReplies: {},
          }),
          comments: response.data.map((comment: Comment) => ({
            ...comment,
            replies: comment.replies || [],
            replyCount: comment.replyCount || 0,
          })),
        },
      }));

      setExpandedComments((prev) => ({ ...prev, [postId]: true }));
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast.error("Failed to load comments");
    }
  };

  const toggleComments = (postId: string) => {
    if (!expandedComments[postId]) {
      fetchComments(postId);
    } else {
      setExpandedComments((prev) => ({ ...prev, [postId]: false }));
      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          showCommentEmojiPicker: false,
          showReplyEmojiPicker: null,
        },
      }));
    }
  };

  const toggleReplies = (postId: string, commentId: string) => {
    const currentState = commentStates[postId]?.expandedReplies[commentId];
    if (!currentState) {
      fetchReplies(postId, commentId);
    } else {
      setCommentStates((prev) => ({
        ...prev,
        [postId]: {
          ...prev[postId],
          expandedReplies: {
            ...prev[postId]?.expandedReplies,
            [commentId]: false,
          },
        },
      }));
    }
  };

  const toggleCommentEmojiPicker = (postId: string) => {
    setCommentStates((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        showCommentEmojiPicker: !prev[postId]?.showCommentEmojiPicker,
        showReplyEmojiPicker: null,
      },
    }));
  };

  const toggleReplyEmojiPicker = (postId: string, commentId: string) => {
    setCommentStates((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        showReplyEmojiPicker: prev[postId]?.showReplyEmojiPicker === commentId ? null : commentId,
        showCommentEmojiPicker: false,
      },
    }));
  };

  const handleCommentEmojiSelect = (emoji: Emoji, postId: string) => {
    setCommentStates((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        content: (prev[postId]?.content || "") + emoji.native,
        showCommentEmojiPicker: false,
      },
    }));
  };

  const handleReplyEmojiSelect = (emoji: Emoji, postId: string) => {
    setCommentStates((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        replyContent: (prev[postId]?.replyContent || "") + emoji.native,
        showReplyEmojiPicker: null,
      },
    }));
  };

  const startReply = (postId: string, commentId: string) => {
    setCommentStates((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        replyingTo: commentId,
        replyContent: "",
        showReplyEmojiPicker: null,
        showCommentEmojiPicker: false,
      },
    }));
  };

  const cancelReply = (postId: string) => {
    setCommentStates((prev) => ({
      ...prev,
      [postId]: {
        ...prev[postId],
        replyingTo: null,
        replyContent: "",
        showReplyEmojiPicker: null,
      },
    }));
  };

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get("/api/users/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        const data = res.data || {};
        const genderAvatar = getAvatarByGender(data.gender);
        dispatch(setProfilePicture(data.profilePicture || genderAvatar));
        dispatch(setFullName(data.fullname || "Current User"));
        dispatch(setUsername(data.username || "@currentUser"));
        dispatch(setGender(data.gender || ""));
      } catch (err: unknown) {
        const error = err as {
          message?: string;
          response?: { status?: number; data?: unknown };
        };
        console.error("Fetch Profile error: ", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error("Failed to load profile data");
      }
    };
    fetchProfile();
  }, [dispatch]);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axiosClient.get("/api/posts/getPosts", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        console.log("=== FETCHED POSTS DEBUG ===");
        console.log("Raw response data:", res.data);

        const formattedPosts: Post[] = res.data.map((post: any) => {
          // Debug the post object to see what's coming from backend
          console.log("Post from backend:", post);
          console.log(
            "Comments:",
            post.comments,
            "Type:",
            typeof post.comments
          );

          // FIX: Handle both array and number types for comments
          let commentCount = 0;
          if (typeof post.comments === "number") {
            commentCount = post.comments;
          } else if (Array.isArray(post.comments)) {
            commentCount = post.comments.length;
          }

          const formattedPost = {
            id: post._id,
            caption: post.content,
            media: post.image
              ? {
                  type: post.image.includes("/video/")
                    ? ("video" as const)
                    : ("image" as const),
                  url: post.image,
                  name: post.image.split("/").pop(),
                }
              : null,
            likes: post.likes || 0,
            comments: commentCount, // Use the correct comment count
            shares: post.shares || 0,
            time: formatTime(post.createdAt),
            profilePicture: post.user?.profilePicture || DefaultAvatar,
            username: post.user?.username
              ? `@${post.user.username}`
              : "@UnknownUser",
            name: post.user?.fullname || "Unknown User",
            userId: post.user?._id || "",
            userReaction: post.userReaction || null,
            reactionCounts: post.reactionCounts || {}, // Add reaction counts
          };

          console.log("Formatted post comment count:", formattedPost.comments);
          console.log("User reaction:", formattedPost.userReaction);
          console.log("Reaction counts:", formattedPost.reactionCounts);
          return formattedPost;
        });

        console.log("All formatted posts:", formattedPosts);
        console.log("Current user ID from Redux:", currentUserId);
        console.log("===========================");

        setPosts(formattedPosts);
      } catch (err: unknown) {
        const error = err as {
          message?: string;
          response?: { status?: number; data?: { message?: string } };
        };
        console.error("Fetch Posts error: ", {
          message: error.message,
          status: error.response?.status,
          data: error.response?.data,
        });
        toast.error(error.response?.data?.message || "Failed to load posts");
      }
    };

    fetchPosts();
  }, [currentUserId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }

      if (
        commentEmojiPickerRef.current &&
        !commentEmojiPickerRef.current.contains(event.target as Node)
      ) {
        Object.keys(commentStates).forEach((postId) => {
          setCommentStates((prev) => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              showCommentEmojiPicker: false,
            },
          }));
        });
      }

      if (
        replyEmojiPickerRef.current &&
        !replyEmojiPickerRef.current.contains(event.target as Node)
      ) {
        Object.keys(commentStates).forEach((postId) => {
          setCommentStates((prev) => ({
            ...prev,
            [postId]: {
              ...prev[postId],
              showReplyEmojiPicker: null,
            },
          }));
        });
      }

      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(event.target as Node)
      ) {
        setShowOptionsMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [commentStates]);

  const handleEmojiSelect = (emoji: Emoji) => {
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const text = textareaRef.current.value;
      const newText =
        text.slice(0, cursorPos) + emoji.native + text.slice(cursorPos);
      textareaRef.current.value = newText;
      textareaRef.current.selectionEnd = cursorPos + emoji.native.length;
      textareaRef.current.focus();
    }
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video"
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }

      setSelectedMedia(file);
      setSelectedMediaType(type);

      if (type === "image") {
        toast.success(`Selected image: ${file.name}`);
      } else {
        toast.success(`Selected video: ${file.name}`);
      }
    }
  };

  const handlePostSubmit = async () => {
    if (textareaRef.current && textareaRef.current.value.trim()) {
      setIsPosting(true);
      const formData = new FormData();
      formData.append("content", textareaRef.current.value.trim());

      if (selectedMedia) {
        formData.append("media", selectedMedia);
      }

      try {
        const response = await axiosClient.post(
          "/api/posts/createPost",
          formData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          const newPostData = response.data.data;
          const newPost: Post = {
            id: newPostData._id,
            caption: newPostData.content,
            media: newPostData.image
              ? {
                  type: newPostData.image.includes("/video/")
                    ? ("video" as const)
                    : ("image" as const),
                  url: newPostData.image,
                  name: newPostData.image.split("/").pop(),
                }
              : null,
            likes: newPostData.likes?.length || 0,
            comments: newPostData.comments?.length || 0,
            shares: newPostData.shares || 0,
            time: formatTime(newPostData.createdAt),
            profilePicture:
              newPostData.user?.profilePicture || getAvatarByGender(gender),
            username: newPostData.user?.username
              ? `@${newPostData.user.username}`
              : "@CurrentUser",
            name: newPostData.user?.fullname || fullname || "Current User",
            userId: newPostData.user?._id || currentUserId || "",
            userReaction: null,
            reactionCounts: {},
          };

          setPosts((prevPosts) => [newPost, ...prevPosts]);
          textareaRef.current.value = "";
          setSelectedMedia(null);
          setSelectedMediaType(null);
          setShowPostOptions(false);
          setShowEmojiPicker(false);
          if (imageInputRef.current) imageInputRef.current.value = "";
          if (videoInputRef.current) videoInputRef.current.value = "";
          toast.success("Post created successfully!");
        } else {
          toast.error(response.data.message || "Failed to create post");
        }
      } catch (err: unknown) {
        const error = err as {
          message?: string;
          response?: {
            status?: number;
            data?: {
              message?: string;
              error?: string;
              stack?: string;
            };
          };
        };

        const errorMessage =
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Failed to create post. Please check your connection and try again.";

        toast.error(errorMessage);
      } finally {
        setIsPosting(false);
      }
    } else {
      toast.error("Please enter a caption!");
    }
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    if (!showEmojiPicker && textareaRef.current)
      setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleReaction = async (
    postId: string,
    reactionType: string = "like"
  ) => {
    try {
      const response = await axiosClient.post(
        `/api/likes/toggle/Post/${postId}`,
        { reactionType },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            const updatedPost = {
              ...post,
              userReaction: response.data.liked ? reactionType : null,
            };

            // Update reaction counts
            if (response.data.liked) {
              updatedPost.likes = post.likes + 1;
              updatedPost.reactionCounts = {
                ...post.reactionCounts,
                [reactionType]: (post.reactionCounts?.[reactionType] || 0) + 1
              };
            } else {
              updatedPost.likes = Math.max(0, post.likes - 1);
              if (post.reactionCounts?.[reactionType]) {
                updatedPost.reactionCounts = {
                  ...post.reactionCounts,
                  [reactionType]: Math.max(0, (post.reactionCounts[reactionType] || 0) - 1)
                };
              }
            }

            return updatedPost;
          }
          return post;
        })
      );

      if (response.data.liked) {
        const likedPost = posts.find((post) => post.id === postId);
        if (likedPost && likedPost.userId !== currentUserId) {
          // Save user state to localStorage for socket service to access
          const userState = {
            user: {
              username: fullname || 'User',
              profilePicture: profilePicture || '',
              _id: currentUserId
            }
          };
          localStorage.setItem('userState', JSON.stringify(userState));
          
          // Send like notification via socket
          socketService.sendLikeNotification({
            recipientId: likedPost.userId,
            senderId: currentUserId,
            targetType: "Post",
            targetId: postId,
            type: "like",
            reactionType: reactionType,
          });
        }
      }
      toast.success(response.data.message);
    } catch (err: unknown) {
      const error = err as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      console.error("Reaction error:", error);
      toast.error(error.response?.data?.message || "Failed to add reaction");
    }
    setShowReactionOptions((prev) => ({ ...prev, [postId]: false }));
  };

  const toggleOptionsMenu = (postId: string) => {
    setShowOptionsMenu(showOptionsMenu === postId ? null : postId);
  };

  const handleSavePost = async (postId: string) => {
    try {
      console.log(`${postId} has been saved!`);
      toast.success("Post saved!");
      setShowOptionsMenu(null);
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleHidePost = (postId: string) => {
    setPosts(posts.filter((post) => post.id !== postId));
    toast.success("Post hidden");
    setShowOptionsMenu(null);
  };

  const handleReportPost = async (postId: string) => {
    try {
      console.log(`${postId} has been reported`);
      toast.success("Post reported. Our team will review it shortly.");
      setShowOptionsMenu(null);
    } catch (error) {
      console.error("Error reporting post:", error);
      toast.error("Failed to report post");
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      setIsDeleting(postId);
      await axiosClient.delete(`/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setPosts(posts.filter((post) => post.id !== postId));
      toast.success("Post deleted successfully");
      setShowOptionsMenu(null);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(null);
    }
  };

  const clearSelectedMedia = () => {
    setSelectedMedia(null);
    setSelectedMediaType(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    toast.info("Media cleared");
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      const response = await axiosClient.delete(
        `/api/comments/posts/${postId}/comments/${commentId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data.success) {
        // Remove the comment from the frontend state
        setCommentStates((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: prev[postId]?.comments.filter(
              (comment) => comment._id !== commentId
            ),
          },
        }));

        // Update the post's comment count
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                comments: Math.max(0, post.comments - 1),
              };
            }
            return post;
          })
        );

        toast.success("Comment deleted successfully!");
      }
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast.error(error.response?.data?.message || "Failed to delete comment");
    }
  };

  const handleDeleteReply = async (postId: string, commentId: string, replyId: string) => {
    try {
      const postResponse = await axiosClient.get(`/api/posts/${postId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      const post = postResponse.data;
      const comment = post.comments.find((c: any) => c._id === commentId);
      
      if (comment) {
        // Update the comment to remove the reply
        const updatedComment = {
          ...comment,
          replies: comment.replies.filter((reply: any) => reply._id !== replyId),
        };

        setCommentStates((prev) => ({
          ...prev,
          [postId]: {
            ...prev[postId],
            comments: prev[postId]?.comments.map((comment) => {
              if (comment._id === commentId) {
                return {
                  ...comment,
                  replies: comment.replies?.filter((reply) => reply._id !== replyId) || [],
                  replyCount: Math.max(0, (comment.replyCount || 0) - 1),
                };
              }
              return comment;
            }),
          },
        }));

        toast.success("Reply deleted successfully!");
      }
    } catch (error: any) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  return (
    <motion.div 
      className="flex h-screen"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="flex-1 w-[950px] relative flex flex-col min-h-screen">
        <motion.div 
          className="flex h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide items-start justify-between w-full px-8 py-6 ml-[6rem] mt-[5rem]"
          variants={containerVariants}
        >
          <div className="flex-1 max-w-3xl">
            {/* Create Post */}
            <motion.div 
              className="bg-white flex flex-col shadow-md rounded-2xl p-4 mt-6 mb-4 relative"
              variants={itemVariants}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              layout
            >
              <div className="flex items-center gap-4 mt-2">
                <motion.img
                  src={profilePicture || getAvatarByGender(gender)}
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) =>
                    (e.currentTarget.src = getAvatarByGender(gender))
                  }
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                />
                <motion.textarea
                  ref={textareaRef}
                  className="w-full border font-['Nunito Bold'] text-black rounded-xl p-3 outline-none resize-none"
                  rows={2}
                  placeholder="What's on your Heart? #Hashtag... @Mention... Link..."
                  onFocus={() => setShowPostOptions(true)}
                  whileFocus={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                ></motion.textarea>
              </div>

              <AnimatePresence>
                {selectedMedia && (
                  <motion.div 
                    className="mt-3 p-2 bg-gray-100 rounded-lg flex items-center justify-between"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="text-sm text-gray-700">
                      Selected: {selectedMedia.name} ({selectedMediaType})
                    </span>
                    <motion.button
                      onClick={clearSelectedMedia}
                      className="text-red-500 hover:text-red-700 text-sm"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      Remove
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showPostOptions && (
                  <motion.div 
                    className="flex items-center justify-between mt-4 p-2"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex gap-4 text-[#611DD0]">
                      <input
                        type="file"
                        ref={imageInputRef}
                        onChange={(e) => handleFileSelect(e, "image")}
                        accept="image/*"
                        className="hidden"
                      />
                      <motion.button
                        className="p-2 cursor-pointer hover:bg-purple-100 rounded-full transition-colors"
                        onClick={() => imageInputRef.current?.click()}
                        title="Upload image"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="text-2xl">📸</span>
                      </motion.button>

                      <input
                        type="file"
                        ref={videoInputRef}
                        onChange={(e) => handleFileSelect(e, "video")}
                        accept="video/*"
                        className="hidden"
                      />
                      <motion.button
                        className="p-2 cursor-pointer hover:bg-purple-100 rounded-full transition-colors"
                        onClick={() => videoInputRef.current?.click()}
                        title="Upload video"
                        whileHover={{ scale: 1.1, rotate: -5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaVideo className="text-xl text-[#611DD0]" />
                      </motion.button>

                      <motion.button
                        className="p-2 cursor-pointer hover:bg-purple-100 rounded-full transition-colors"
                        onClick={toggleEmojiPicker}
                        title="Add emoji"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <span className="text-2xl">😊</span>
                      </motion.button>
                    </div>
                    <motion.button
                      className="flex items-center gap-2 bg-[#611DD0] text-white px-4 py-2 rounded-lg hover:bg-[#a679ee] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handlePostSubmit}
                      disabled={isPosting}
                      whileHover={!isPosting ? { scale: 1.05 } : {}}
                      whileTap={!isPosting ? { scale: 0.95 } : {}}
                    >
                      {isPosting ? (
                        <>
                          <motion.div 
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          ></motion.div>
                          Posting...
                        </>
                      ) : (
                        "Post"
                      )}
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    ref={emojiPickerRef}
                    className="absolute top-16 left-16 z-10"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  >
                    <Picker
                      data={data}
                      onEmojiSelect={handleEmojiSelect}
                      theme="light"
                      previewPosition="none"
                      skinTonePosition="none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Stories Slider */}
            <motion.div variants={itemVariants}>
              <Story />
            </motion.div>

            {/* Post Feeds */}
            <motion.div 
              className="flex flex-col gap-6"
              variants={containerVariants}
            >
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  className="bg-white shadow-md rounded-2xl p-6 relative"
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  layout
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <motion.img
                        src={post.profilePicture}
                        alt={post.name}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => (e.currentTarget.src = DefaultAvatar)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {post.name}{" "}
                          <span className="text-gray-600 font-normal">
                            {post.username}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-500">{post.time}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <motion.button
                        className="text-gray-700 p-2 rounded-full hover:bg-gray-100"
                        onClick={() => toggleOptionsMenu(post.id)}
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaEllipsisV />
                      </motion.button>

                      <AnimatePresence>
                        {showOptionsMenu === post.id && (
                          <motion.div
                            ref={optionsMenuRef}
                            className="absolute right-0 top-10 bg-white shadow-lg rounded-lg p-2 w-48 z-10 border border-gray-200"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          >
                            <motion.button
                              className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-gray-700"
                              onClick={() => handleSavePost(post.id)}
                              whileHover={{ x: 5 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Save Post
                            </motion.button>
                            <motion.button
                              className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-gray-700"
                              onClick={() => handleHidePost(post.id)}
                              whileHover={{ x: 5 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Hide this post
                            </motion.button>
                            <motion.button
                              className="w-full text-left p-2 hover:bg-gray-100 rounded-md text-gray-700"
                              onClick={() => handleReportPost(post.id)}
                              whileHover={{ x: 5 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Report post
                            </motion.button>

                            {post.userId === currentUserId && (
                              <motion.button
                                className="w-full text-left p-2 hover:bg-red-50 rounded-md text-red-600 border-t border-gray-200 mt-2"
                                onClick={() => setShowDeleteConfirm(post.id)}
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Delete post
                              </motion.button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-gray-800 text-lg text-left break-words mb-2">
                      {post.caption.replace(/#\w+/g, "")}
                    </p>
                    {post.caption.match(/#\w+/g) && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.caption.match(/#\w+/g)?.map((hashtag, index) => (
                          <motion.span
                            key={index}
                            className="text-[#611DD0] font-medium"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {hashtag}
                          </motion.span>
                        ))}
                      </div>
                    )}
                  </div>
                  {post.media && (
                    <motion.div 
                      className="mt-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {post.media.type === "image" && (
                        <motion.img
                          src={post.media.url}
                          alt="post media"
                          className="rounded-xl h-[450px] w-full object-cover"
                          onError={(e) => {
                            console.error(
                              "Failed to load post image:",
                              post.media?.url
                            );
                            e.currentTarget.style.display = "none";
                          }}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        />
                      )}
                      {post.media.type === "video" && (
                        <motion.video
                          autoPlay
                          playsInline
                          controls
                          className="rounded-xl h-[450px] w-full object-cover"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 200 }}
                        >
                          <source src={post.media.url} type="video/mp4" />
                          Your browser does not support the video tag.
                        </motion.video>
                      )}
                    </motion.div>
                  )}
                  <div className="flex justify-between text-gray-800 mt-6 text-sm">
                    {/* Only show counts if current user is the post owner */}
                    {post.userId === currentUserId ? (
                      <>
                        <motion.span
                          className="flex ml-10 items-center gap-2 cursor-pointer relative"
                          onMouseEnter={() =>
                            setShowReactionOptions((prev) => ({
                              ...prev,
                              [post.id]: true,
                            }))
                          }
                          onMouseLeave={() =>
                            setShowReactionOptions((prev) => ({
                              ...prev,
                              [post.id]: false,
                            }))
                          }
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {post.userReaction ? (
                            <motion.span 
                              className="text-xl"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {getReactionIcon(post.userReaction)}
                            </motion.span>
                          ) : (
                            <BiSolidLike size={20} />
                          )}
                          {post.likes}
                          <AnimatePresence>
                            {showReactionOptions[post.id] && (
                              <motion.div 
                                className="absolute bottom-4 h-10 left-0 bg-white shadow-lg rounded-lg p-2 flex gap-2 z-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                {["like", "love", "haha", "wow", "sad"].map((reaction) => (
                                  <motion.span
                                    key={reaction}
                                    onClick={() => handleReaction(post.id, reaction)}
                                    className="cursor-pointer text-xl"
                                    whileHover={{ scale: 1.5, y: -5 }}
                                    whileTap={{ scale: 1.2 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    {getReactionIcon(reaction)}
                                  </motion.span>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.span>

                        <motion.span
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleComments(post.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FaRegCommentDots size={20} />
                          {post.comments}
                        </motion.span>

                        <motion.span 
                          className="flex mr-10 items-center gap-2"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FaShare size={20} />
                          {post.shares}
                        </motion.span>
                      </>
                    ) : (
                      <>
                        {/* Show only icons without counts for non-owners */}
                        <motion.span
                          className="flex ml-10 items-center gap-2 cursor-pointer relative"
                          onMouseEnter={() =>
                            setShowReactionOptions((prev) => ({
                              ...prev,
                              [post.id]: true,
                            }))
                          }
                          onMouseLeave={() =>
                            setShowReactionOptions((prev) => ({
                              ...prev,
                              [post.id]: false,
                            }))
                          }
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {post.userReaction ? (
                            <motion.span 
                              className="text-xl"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            >
                              {getReactionIcon(post.userReaction)}
                            </motion.span>
                          ) : (
                            <BiSolidLike size={20} />
                          )}
                          <AnimatePresence>
                            {showReactionOptions[post.id] && (
                              <motion.div 
                                className="absolute bottom-4 h-10 left-0 bg-white shadow-lg rounded-lg p-2 flex gap-2 z-10"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ type: "spring", stiffness: 300 }}
                              >
                                {["like", "love", "haha", "wow", "sad"].map((reaction) => (
                                  <motion.span
                                    key={reaction}
                                    onClick={() => handleReaction(post.id, reaction)}
                                    className="cursor-pointer text-xl"
                                    whileHover={{ scale: 1.5, y: -5 }}
                                    whileTap={{ scale: 1.2 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    {getReactionIcon(reaction)}
                                  </motion.span>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.span>

                        <motion.span
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleComments(post.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FaRegCommentDots size={20} />
                        </motion.span>

                        <motion.span 
                          className="flex mr-10 items-center gap-2"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FaShare size={20} />
                        </motion.span>
                      </>
                    )}
                  </div>
                  
                  {/* Comments Section */}
                  <AnimatePresence>
                    {expandedComments[post.id] && (
                      <motion.div 
                        className="mt-4 border-t pt-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Comment input */}
                        <div className="flex items-center gap-3 mb-4">
                          <motion.img
                            src={profilePicture || getAvatarByGender(gender)}
                            alt="Profile"
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) =>
                              (e.currentTarget.src = getAvatarByGender(gender))
                            }
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          />
                          <div className="flex-1 relative">
                            <motion.input
                              style={{ background: "#fff" }}
                              type="text"
                              placeholder="Add your thoughts..."
                              value={commentStates[post.id]?.content || ""}
                              onChange={(e) =>
                                handleCommentChange(post.id, e.target.value)
                              }
                              className="w-full border border-gray-300 text-black rounded-full px-4 py-2 pr-16 focus:outline-none focus:border-[#611DD0]"
                              onKeyPress={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  commentStates[post.id]?.content.trim()
                                ) {
                                  handleSubmitComment(post.id);
                                }
                              }}
                              whileFocus={{ scale: 1.02 }}
                              transition={{ type: "spring", stiffness: 300 }}
                            />
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                              <motion.button
                                onClick={() => toggleCommentEmojiPicker(post.id)}
                                className="text-gray-500 hover:text-[#611DD0] transition-colors"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <FaSmile size={18} />
                              </motion.button>
                              <motion.button
                                onClick={() => handleSubmitComment(post.id)}
                                disabled={
                                  !commentStates[post.id]?.content.trim() ||
                                  commentStates[post.id]?.isSubmitting
                                }
                                className="text-[#611DD0] disabled:text-gray-400 transition-colors"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {commentStates[post.id]?.isSubmitting ? (
                                  <motion.div 
                                    className="w-4 h-4 border-2 border-[#611DD0] border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  ></motion.div>
                                ) : (
                                  <FaPaperPlane size={16} />
                                )}
                              </motion.button>
                            </div>

                            {/* Comment emoji picker */}
                            <AnimatePresence>
                              {commentStates[post.id]?.showCommentEmojiPicker && (
                                <motion.div
                                  ref={commentEmojiPickerRef}
                                  className="absolute bottom-12 right-0 z-10"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                >
                                  <Picker
                                    data={data}
                                    onEmojiSelect={(emoji: Emoji) =>
                                      handleCommentEmojiSelect(emoji, post.id)
                                    }
                                    theme="light"
                                    previewPosition="none"
                                    skinTonePosition="none"
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        {/* Comments list */}
                        <motion.div 
                          className="space-y-4 max-h-96 overflow-y-auto"
                          layout
                        >
                          {commentStates[post.id]?.comments?.map((comment, index) => (
                            <motion.div 
                              key={comment._id} 
                              className="comment-container"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                            >
                              <div className="flex items-start gap-3">
                                <motion.img
                                  src={comment.user.profilePicture || DefaultAvatar}
                                  alt={comment.user.username}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                  onError={(e) =>
                                    (e.currentTarget.src = DefaultAvatar)
                                  }
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                />
                                <motion.div 
                                  className="flex-1 bg-gray-50 rounded-lg p-3"
                                  whileHover={{ scale: 1.01 }}
                                  transition={{ type: "spring", stiffness: 300 }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-sm text-gray-800">
                                        {comment.user.username}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {new Date(
                                          comment.createdAt
                                        ).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-800 mb-2">
                                    {comment.content}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <motion.button
                                      onClick={() =>
                                        handleCommentLike(post.id, comment._id)
                                      }
                                      className={`flex items-center gap-1 text-xs ${
                                        comment.likes.includes(currentUserId)
                                          ? "text-[#611DD0] font-medium"
                                          : "text-gray-500"
                                      } hover:text-[#611DD0] transition-colors`}
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <BiSolidLike size={14} />
                                      <span>{comment.likes.length}</span>
                                    </motion.button>
                                    <motion.button
                                      onClick={() => startReply(post.id, comment._id)}
                                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#611DD0] transition-colors"
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                    >
                                      <FaReply size={12} />
                                      <span>Reply</span>
                                    </motion.button>
                                    {comment.replyCount > 0 && (
                                      <motion.button
                                        onClick={() => toggleReplies(post.id, comment._id)}
                                        className="flex items-center gap-1 text-xs text-[#611DD0] hover:underline"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                      >
                                        {commentStates[post.id]?.expandedReplies[comment._id] ? (
                                          <>
                                            <FaCaretUp size={12} />
                                            <span>Hide {comment.replyCount} replies</span>
                                          </>
                                        ) : (
                                          <>
                                            <FaCaretDown size={12} />
                                            <span>View {comment.replyCount} replies</span>
                                          </>
                                        )}
                                      </motion.button>
                                    )}
                                  </div>
                                </motion.div>
                              </div>

                              {/* Reply input */}
                              <AnimatePresence>
                                {commentStates[post.id]?.replyingTo === comment._id && (
                                  <motion.div 
                                    className="ml-11 mt-3 flex items-center gap-2"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <motion.img
                                      src={profilePicture || getAvatarByGender(gender)}
                                      alt="Profile"
                                      className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                      onError={(e) =>
                                        (e.currentTarget.src = getAvatarByGender(gender))
                                      }
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.95 }}
                                    />
                                    <div className="flex-1 relative">
                                      <motion.input
                                        style={{ background: "#fff" }}
                                        type="text"
                                        placeholder="Write a reply..."
                                        value={commentStates[post.id]?.replyContent || ""}
                                        onChange={(e) =>
                                          handleReplyChange(post.id, comment._id, e.target.value)
                                        }
                                        className="w-full border border-gray-300 text-black rounded-full px-3 py-1 pr-16 focus:outline-none focus:border-[#611DD0] text-sm"
                                        onKeyPress={(e) => {
                                          if (
                                            e.key === "Enter" &&
                                            commentStates[post.id]?.replyContent.trim()
                                          ) {
                                            handleSubmitReply(post.id, comment._id);
                                          }
                                        }}
                                        whileFocus={{ scale: 1.02 }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                      />
                                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                                        <motion.button
                                          onClick={() => toggleReplyEmojiPicker(post.id, comment._id)}
                                          className="text-gray-400 hover:text-[#611DD0] transition-colors"
                                          whileHover={{ scale: 1.2 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <FaSmile size={14} />
                                        </motion.button>
                                        <motion.button
                                          onClick={() => handleSubmitReply(post.id, comment._id)}
                                          disabled={
                                            !commentStates[post.id]?.replyContent.trim() ||
                                            commentStates[post.id]?.isSubmitting
                                          }
                                          className="text-[#611DD0] disabled:text-gray-400 transition-colors"
                                          whileHover={{ scale: 1.2 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          <FaPaperPlane size={12} />
                                        </motion.button>
                                        <motion.button
                                          onClick={() => cancelReply(post.id)}
                                          className="text-gray-400 hover:text-red-500 transition-colors"
                                          whileHover={{ scale: 1.2 }}
                                          whileTap={{ scale: 0.9 }}
                                        >
                                          ×
                                        </motion.button>
                                      </div>

                                      {/* Reply emoji picker */}
                                      <AnimatePresence>
                                        {commentStates[post.id]?.showReplyEmojiPicker === comment._id && (
                                          <motion.div
                                            ref={replyEmojiPickerRef}
                                            className="absolute bottom-8 right-0 z-10"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                          >
                                            <Picker
                                              data={data}
                                              onEmojiSelect={(emoji: Emoji) =>
                                                handleReplyEmojiSelect(emoji, post.id, comment._id)
                                              }
                                              theme="light"
                                              previewPosition="none"
                                              skinTonePosition="none"
                                            />
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Replies list */}
                              <AnimatePresence>
                                {commentStates[post.id]?.expandedReplies[comment._id] && (
                                  <motion.div 
                                    className="ml-11 mt-3 space-y-3 border-l-2 border-gray-200 pl-3"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {comment.replies?.map((reply, replyIndex) => (
                                      <motion.div 
                                        key={reply._id} 
                                        className="flex items-start gap-2"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: replyIndex * 0.05 }}
                                      >
                                        <motion.img
                                          src={reply.user.profilePicture || DefaultAvatar}
                                          alt={reply.user.username}
                                          className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                          onError={(e) =>
                                            (e.currentTarget.src = DefaultAvatar)
                                          }
                                          whileHover={{ scale: 1.1 }}
                                          whileTap={{ scale: 0.95 }}
                                        />
                                        <motion.div 
                                          className="flex-1 bg-gray-50 rounded-lg p-2"
                                          whileHover={{ scale: 1.01 }}
                                          transition={{ type: "spring", stiffness: 300 }}
                                        >
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-xs text-gray-800">
                                                {reply.user.username}
                                              </span>
                                              <span className="text-xs text-gray-500">
                                                {new Date(
                                                  reply.createdAt
                                                ).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </span>
                                            </div>
                                          </div>
                                          <p className="text-xs text-gray-800">
                                            {reply.content}
                                          </p>
                                          <div className="flex items-center gap-3 mt-1">
                                            <motion.button
                                              onClick={() => handleCommentLike(post.id, reply._id)}
                                              className={`flex items-center gap-1 text-xs ${
                                                reply.likes.includes(currentUserId)
                                                  ? "text-[#611DD0] font-medium"
                                                  : "text-gray-500"
                                              } hover:text-[#611DD0] transition-colors`}
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                            >
                                              <BiSolidLike size={12} />
                                              <span>{reply.likes.length}</span>
                                            </motion.button>
                                            <motion.button
                                              onClick={() => startReply(post.id, comment._id)}
                                              className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#611DD0] transition-colors"
                                              whileHover={{ scale: 1.1 }}
                                              whileTap={{ scale: 0.9 }}
                                            >
                                              <FaReply size={10} />
                                              <span>Reply</span>
                                            </motion.button>
                                          </div>
                                        </motion.div>
                                      </motion.div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          ))}

                          {(!commentStates[post.id]?.comments ||
                            commentStates[post.id]?.comments.length === 0) && (
                            <motion.p 
                              className="text-center text-gray-500 text-sm py-4"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                            >
                              No comments yet. Be the first to comment!
                            </motion.p>
                          )}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Right Sidebar */}
      <motion.div 
        className="w-1/4 moodMaker sticky top-[12rem] right-10 self-start ml-16"
        variants={slideInVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.5 }}
      >
        <HashtagList />
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-white rounded-lg p-6 w-96"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this post? This action cannot be
                undone.
              </p>
              <div className="flex justify-end gap-4">
                <motion.button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  onClick={() => setShowDeleteConfirm(null)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  onClick={() => handleDeletePost(showDeleteConfirm)}
                  disabled={isDeleting === showDeleteConfirm}
                  whileHover={isDeleting !== showDeleteConfirm ? { scale: 1.05 } : {}}
                  whileTap={isDeleting !== showDeleteConfirm ? { scale: 0.95 } : {}}
                >
                  {isDeleting === showDeleteConfirm ? (
                    <>
                      <motion.div 
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      ></motion.div>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Home;