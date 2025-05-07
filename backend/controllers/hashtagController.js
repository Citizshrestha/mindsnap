import { asyncHandler } from "../utils/asyncHandler.js";
import {Hashtag} from "../models/hashtag.models.js";

export const getPostsByHashtag = asyncHandler(async (req, res) => {
  const { name } = req.params;
  const hashtag = await Hashtag.findOne({ name: name.toLowerCase() }).populate({
    path: "posts",
    populate: { path: "user", select: "username profilePicture" },
  });

  if (!hashtag) {
    res.status(404);
    throw new Error("Hashtag not found");
  }

  res.json(hashtag.posts);
});