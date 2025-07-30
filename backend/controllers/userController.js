import {asyncHandler}  from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js";




// @route GET /api/users/profile
export const getUserProfileInfo =  asyncHandler(async(req,res) => {
   const user = await  User.findById(req.user._id).select(" fullname username postsCount profilePicture aboutMe vibe vibeDescription");

   if (!user){
    res.status(400).json({
      success: false,
      message: "User not Found"
    })
   }

   return res.status(200).json({
    success: true,
    username: user.username,
    fullname: user.fullname,
    profilePicture : user.profilePicture,
    aboutMe: user.aboutMe,
    vibe: user.vibe,
    vibeDescription: user.vibeDescription,
    postsCount: user.postsCount

   })
});

// @route patch /api/users/updateUserProfile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { profilePicture } = req.body;

  if (!profilePicture) {
    return res.status(400).json({
      success: false,
      message: "Profile picture URL is required",
    });
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.profilePicture) {
    const publicId = user.profilePicture.split("/").pop()?.split(".")[0];
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error("Error deleting old image from Cloudinary:", err);
      }
    }
  }

  user.profilePicture = profilePicture;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
    profilePicture: user.profilePicture,
  });
});

// @route GET/api/users/generateSignature
export const generateSignature = asyncHandler(async(req,res) => {
  const timestamp =  Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {timestamp},
    process.env.VITE_CLOUDINARY_API_SECRET,
  );

  return res.status(400).json({
    signature,
    timestamp,
    cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.VITE_CLOUDINARY_API_KEY
  });
});