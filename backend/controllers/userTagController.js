// controllers/userTagController.js
import { asyncHandler } from "../utils/asyncHandler.js";
import {UserTag} from "../models/userTag.model.js";
import {Post} from "../models/post.models.js";
import {Notification} from "../models/notification.models.js"; // Assuming this will be added

// Get all posts where a user was tagged
export const getTaggedPosts = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  const userTags = await UserTag.find({ taggedUser: userId }).populate({
    path: "post",
    populate: { path: "user", select: "username profilePicture" },
  });

  const posts = userTags.map((tag) => tag.post).filter((post) => post);
  res.json(posts);
});

// Get all users tagged in a specific post
export const getTaggedUsersInPost = asyncHandler(async (req, res) => {
  const postId = req.params.postId;
  const userTags = await UserTag.find({ post: postId }).populate(
    "taggedUser",
    "username profilePicture"
  );

  const taggedUsers = userTags.map((tag) => tag.taggedUser).filter((user) => user);
  res.json(taggedUsers);
});

// Tag users in a post (called when creating/updating a post)
export const tagUsersInPost = asyncHandler(async (req, res) => {
  const { postId, taggedUsernames } = req.body;

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (taggedUsernames && taggedUsernames.length > 0) {
    if (taggedUsernames.length > 10) {
      res.status(400);
      throw new Error("Cannot tag more than 10 users in a post");
    }

    const taggedUsers = await User.find({ username: { $in: taggedUsernames } });
    if (taggedUsers.length !== taggedUsernames.length) {
      res.status(400);
      throw new Error("One or more tagged usernames not found");
    }

    // Remove existing tags for this post
    await UserTag.deleteMany({ post: postId });

    // Create new tags
    for (const taggedUser of taggedUsers) {
      const userTag = await UserTag.create({
        post: postId,
        taggedUser: taggedUser._id,
        taggedBy: req.user._id,
      });

      if (!userTag.isNotified) {
        await Notification.create({
          recipient: taggedUser._id,
          sender: req.user._id,
          type: "tag",
          targetType: "Post",
          targetId: postId,
        });
        userTag.isNotified = true;
        await userTag.save();
      }
    }
  }

  res.json({ message: "Users tagged successfully" });
});