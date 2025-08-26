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
  const { fullname, username, gender, dob, vibe, vibeDescription, aboutMe, profilePicture } = req.body;

  // if (!profilePicture) {
  //   return res.status(400).json({
  //     success: false,
  //     message: "Profile picture URL is required",
  //   });
  // }

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

   if (fullname !== undefined) user.fullname = fullname;
   if (username !== undefined) user.username = username;
   if (gender !== undefined) user.gender = gender;
   if (dob !== undefined) user.dob = dob;
   if (vibe !== undefined) user.vibe = vibe;
   if (vibeDescription !== undefined) user.vibeDescription = vibeDescription;
   if (aboutMe !== undefined) user.aboutMe = aboutMe;
 

    // Only update profile picture if a new one is provided
   if (profilePicture !== undefined && profilePicture !== user.profilePicture){
     // Delete old profile picture from Cloudinary if it exists
  if (user.profilePicture) {
    const publicId = user.profilePicture.split("/").pop()?.split(".")[0];
    if (publicId) {
      try {
       const res = await cloudinary.uploader.destroy(publicId);
        if (res.result !== 'ok'){
          console.warn(`Failed to delete Cloudinary image: ${publicId}`);
        }
      } catch (err) {
        console.error("Error deleting old image from Cloudinary:", err);
      }
    }
  }
  user.profilePicture = profilePicture;
}


  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
    fullname: user.fullname,
    username: user.username,
    gender: user.gender, 
    dob :  user.dob,
    vibe: user.vibe,
    vibeDescription : user.vibeDescription,
    aboutMe: user.aboutMe,
    postsCount: user.postsCount,

    profilePicture: user.profilePicture,
  });
});

// @route GET/api/users/generateSignature
export const generateSignature = asyncHandler(async(req,res) => {
  const timestamp =  Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {timestamp},
    process.env.CLOUDINARY_API_SECRET,
  );

  return res.status(200).json({
    signature,
    timestamp,
    cloudName: process.env.VITE_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.VITE_CLOUDINARY_API_KEY
  });
});