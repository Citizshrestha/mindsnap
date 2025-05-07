import { asyncHandler } from "../utils/asyncHandler.js";
import {Post} from "../models/post.models.js";
import { Hashtag } from "../models/hashtag.models.js";
import { toggleLike } from "./likeController.js";

// @route  POST /api/posts/createPost
export const createPost = asyncHandler(async (req, res) => {
  const { content, image, taggedUsernames } = req.body;

  const post = await Post.create({
    user: req.user._id,
    content,
    image,
  });

  const hashtags = content.match(/#\w+/g) || [];
  const hashtagNames = hashtags.map((tag) => tag.replace("#", "").toLowerCase());

  for (const name of hashtagNames) {
    let hashtag = await Hashtag.findOne({ name });
    if (!hashtag) {
      hashtag = await Hashtag.create({ name, posts: [post._id] });
    } else {
      hashtag.posts.push(post._id);
      await hashtag.save();
    }
  }

  if (taggedUsernames && taggedUsernames.length > 0) {
    const tagUsersInPost = (await import("./userTagController.js")).tagUsersInPost;
    await tagUsersInPost({ body: { postId: post._id, taggedUsernames }, user: req.user });
  }

  const populatedPost = await Post.findById(post._id).populate(
    "user",
    "username profilePicture"
  );
  res.status(201).json(populatedPost);
});

// @route  GET /api/posts/getPosts
export const getPosts = asyncHandler(async (req, res) => {
  const posts = await Post.find()
    .populate("user", "username profilePicture")
    .sort({ createdAt: -1 });
  res.json(posts);
});

// @route POST /api/posts/:id/like
export const likePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post Not Found!");
  }

  await toggleLike({ params: { targetType: "Post", targetId: req.params.id }, user: req.user });

  const updatedPost = await Post.findById(req.params.id).populate(
    "user",
    "username profilePicture"
  );
  res.json(updatedPost);
});

// @route POST /api/posts/:postId/comments/:commentId/like
export const commentOnPost = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;

  const post = await Post.findById(postId);
  if (!post) {
    res.status(404);
    throw new Error("Post not found!");
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    res.status(404);
    throw new Error("Comment not Found!");
  }

  await toggleLike({
    params: { targetType: "EmbeddedComment", targetId: commentId, postId: postId },
    user: req.user,
  });

  const updatedPost = await Post.findById(postId).populate(
    "user",
    "username profilePicture"
  );
  res.json(updatedPost.comments.id(commentId));
});