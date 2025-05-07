import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";

// @route   POST /api/users/:id/follow
export const followUser = asyncHandler(async (req, res) => {
  const userToFollow = await User.findById(req.params.id);
  const currentUser = await User.findById(req.user._id);

  if (!userToFollow) {
    res.status(404);
    throw new Error("User not found");
  }

  if (currentUser.following.includes(req.params.id)) {
    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== req.params.id
    );
    userToFollow.followers = userToFollow.followers.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
  } else {
    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user._id);
  }

  await currentUser.save();
  await userToFollow.save();
  res.json({ message: "Follow status updated" });
});