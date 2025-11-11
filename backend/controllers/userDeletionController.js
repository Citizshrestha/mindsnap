import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { Post } from "../models/post.models.js";
import { Story } from "../models/story.models.js";
import { Comment } from "../models/comment.models.js";
import { Message } from "../models/message.models.js";
import { Conversation } from "../models/conversation.models.js";
import { Notification } from "../models/notification.models.js";
import { Hashtag } from "../models/hashtag.models.js";
import { Highlight } from "../models/highlight.models.js";
import { Like } from "../models/like.models.js";
import { io } from "../server.js";



export const deleteUserAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user._id;

  // Security check: Only allow users to delete their own account or admin
  if (userId !== requestingUserId.toString() && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You can only delete your own account"
    });
  }

  console.log(`🗑️ Starting comprehensive deletion for user: ${userId}`);

  try {
    // 1. Get user data before deletion
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // console.log(`👤 Deleting user: ${userToDelete.username} (${userToDelete.email})`);

    // 2. Delete all user's posts and update engagement counts
    console.log("📝 Deleting user's posts...");
    const userPosts = await Post.find({ author: userId });
    
    for (const post of userPosts) {
      // Delete all comments on this post
      await Comment.deleteMany({ post: post._id });
      
      // Delete all notifications related to this post
      await Notification.deleteMany({ 
        targetType: "Post", 
        targetId: post._id 
      });
      
      // console.log(`📝 Deleted post: ${post._id} with all comments and notifications`);
    }
    
    // Delete all posts by user
    const deletedPostsResult = await Post.deleteMany({ author: userId });
    // console.log(`📝 Deleted ${deletedPostsResult.deletedCount} posts`);

    // 3. Delete all user's stories
    console.log("📸 Deleting user's stories...");
    const deletedStoriesResult = await Story.deleteMany({ user: userId });
    console.log(`📸 Deleted ${deletedStoriesResult.deletedCount} stories`);

    // 4. Delete all user's comments on other posts
    // console.log("💬 Deleting user's comments...");
    const userComments = await Comment.find({ author: userId });
    
    for (const comment of userComments) {
      // Delete notifications related to this comment
      await Notification.deleteMany({ 
        targetType: "Comment", 
        targetId: comment._id 
      });
    }
    
    const deletedCommentsResult = await Comment.deleteMany({ author: userId });
    console.log(`💬 Deleted ${deletedCommentsResult.deletedCount} comments`);

    // 5. Handle messages and conversations
    console.log("📨 Cleaning up messages and conversations...");
    
    // Find all conversations involving this user
    const userConversations = await Conversation.find({
      participants: userId
    });

    for (const conversation of userConversations) {
      if (conversation.participants.length === 2) {
        // Direct conversation - delete all messages and the conversation
        await Message.deleteMany({ conversation: conversation._id });
        await Conversation.findByIdAndDelete(conversation._id);
        console.log(`📨 Deleted conversation: ${conversation._id}`);
      } else {
        // Group conversation - just remove user from participants
        await Conversation.findByIdAndUpdate(conversation._id, {
          $pull: { participants: userId }
        });
        console.log(`👥 Removed user from group conversation: ${conversation._id}`);
      }
    }

    // Delete any remaining messages sent by user
    const deletedMessagesResult = await Message.deleteMany({ sender: userId });
    console.log(`📨 Deleted ${deletedMessagesResult.deletedCount} messages`);

    // 6. Delete all notifications (sent and received)
    console.log("🔔 Deleting notifications...");
    const deletedSentNotifications = await Notification.deleteMany({ sender: userId });
    const deletedReceivedNotifications = await Notification.deleteMany({ recipient: userId });
    // console.log(`🔔 Deleted ${deletedSentNotifications.deletedCount} sent notifications`);
    // console.log(`🔔 Deleted ${deletedReceivedNotifications.deletedCount} received notifications`);

    // 7. Remove user from other users' followers/following lists and update counts
    console.log("👥 Updating follower/following relationships...");
  
    // Get all users who follow this user
    const followersToUpdate = await User.find({ following: userId });
    console.log(`👥 Found ${followersToUpdate.length} users following the deleted user`);
    
    // Get all users this user follows
    const followingToUpdate = await User.find({ followers: userId });
    // console.log(`👥 Found ${followingToUpdate.length} users followed by the deleted user`);

    // Remove deleted user from followers' following lists
    for (const follower of followersToUpdate) {
      await User.findByIdAndUpdate(follower._id, {
        $pull: { following: userId }
      });
      
      // Emit real-time update to follower
      io.to(`user_${follower._id}`).emit("userDeleted", {
        deletedUserId: userId,
        deletedUsername: userToDelete.username,
        message: `${userToDelete.username} has deleted their account`
      });
      
      // console.log(`👥 Removed deleted user from ${follower.username}'s following list`);
    }

    // Remove deleted user from following users' followers lists
    for (const following of followingToUpdate) {
      await User.findByIdAndUpdate(following._id, {
        $pull: { followers: userId }
      });
      
      // Emit real-time update to following user
      io.to(`user_${following._id}`).emit("userDeleted", {
        deletedUserId: userId,
        deletedUsername: userToDelete.username,
        message: `${userToDelete.username} has deleted their account`
      });
      
      // console.log(`👥 Removed deleted user from ${following.username}'s followers list`);
    }

    // 8. Clean up reactions/likes on other posts
    // console.log("❤️ Cleaning up reactions...");
    await Post.updateMany(
      { "reactions.user": userId },
      { $pull: { reactions: { user: userId } } }
    );

    // 9. Delete all likes/reactions by user
    console.log("❤️ Deleting user's likes and reactions...");
    const deletedLikesResult = await Like.deleteMany({ user: userId });
    console.log(`❤️ Deleted ${deletedLikesResult.deletedCount} likes/reactions`);

    // 10. Delete user's highlights
    console.log("⭐ Deleting user's highlights...");
    const deletedHighlightsResult = await Highlight.deleteMany({ user: userId });
    console.log(`⭐ Deleted ${deletedHighlightsResult.deletedCount} highlights`);

    // 11. Clean up hashtags - remove posts from hashtag collections
    console.log("🏷️ Cleaning up hashtags...");
    const userPostIds = userPosts.map(post => post._id);
    let deletedEmptyHashtagsResult = { deletedCount: 0 };
    
    if (userPostIds.length > 0) {
      await Hashtag.updateMany(
        { posts: { $in: userPostIds } },
        { $pullAll: { posts: userPostIds } }
      );
      
      // Delete hashtags that have no posts left
      deletedEmptyHashtagsResult = await Hashtag.deleteMany({ posts: { $size: 0 } });
      console.log(`🏷️ Deleted ${deletedEmptyHashtagsResult.deletedCount} empty hashtags`);
    }

    // 12. Delete notifications related to user interactions
    await Notification.deleteMany({
      $or: [
        { sender: userId },
        { recipient: userId }
      ]
    });

    // 13. Finally, delete the user account
    console.log("👤 Deleting user account...");
    await User.findByIdAndDelete(userId);

    // 11. Broadcast user deletion to all connected clients
    io.emit("userAccountDeleted", {
      deletedUserId: userId,
      deletedUsername: userToDelete.username,
      message: `${userToDelete.username} has deleted their account`
    });

    // console.log(`✅ Successfully deleted user account: ${userToDelete.username}`);
    // console.log(`📊 Deletion Summary:
    //   - Posts: ${deletedPostsResult.deletedCount}
    //   - Stories: ${deletedStoriesResult.deletedCount}  
    //   - Comments: ${deletedCommentsResult.deletedCount}
    //   - Messages: ${deletedMessagesResult.deletedCount}
    //   - Sent Notifications: ${deletedSentNotifications.deletedCount}
    //   - Received Notifications: ${deletedReceivedNotifications.deletedCount}
    //   - Followers Updated: ${followersToUpdate.length}
    //   - Following Updated: ${followingToUpdate.length}
    // `);

    res.status(200).json({
      success: true,
      message: "User account and all associated data deleted successfully",
      deletionSummary: {
        posts: deletedPostsResult.deletedCount,
        stories: deletedStoriesResult.deletedCount,
        comments: deletedCommentsResult.deletedCount,
        messages: deletedMessagesResult.deletedCount,
        likes: deletedLikesResult.deletedCount,
        highlights: deletedHighlightsResult.deletedCount,
        emptyHashtags: deletedEmptyHashtagsResult.deletedCount,
        sentNotifications: deletedSentNotifications.deletedCount,
        receivedNotifications: deletedReceivedNotifications.deletedCount,
        followersUpdated: followersToUpdate.length,
        followingUpdated: followingToUpdate.length
      }
    });

  } catch (error) {
    console.error("❌ Error during user deletion:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user account",
      error: error.message
    });
  }
});

/**
 * Soft delete user account (deactivate instead of permanent deletion)
 * This is what most social media platforms do initially
 */
export const deactivateUserAccount = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const requestingUserId = req.user._id;

  // Security check
  if (userId !== requestingUserId.toString() && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: "You can only deactivate your own account"
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isAccountActive: false,
        deactivatedAt: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Broadcast deactivation
    io.emit("userDeactivated", {
      userId: userId,
      username: user.username
    });

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully. You can reactivate within 30 days."
    });

  } catch (error) {
    console.error("Error deactivating account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate account"
    });
  }
});

/**
 * Clean up orphaned user references from followers/following arrays
 * This removes references to deleted users that no longer exist
 */
export const cleanupOrphanedReferences = asyncHandler(async (req, res) => {
  try {
    console.log("🧹 Starting cleanup of orphaned user references...");

    // Get all users
    const allUsers = await User.find().select("_id followers following username");
    let totalCleaned = 0;

    for (const user of allUsers) {
      let needsUpdate = false;
      const validFollowers = [];
      const validFollowing = [];

      // Check followers
      for (const followerId of user.followers) {
        const followerExists = await User.exists({ _id: followerId });
        if (followerExists) {
          validFollowers.push(followerId);
        } else {
          needsUpdate = true;
          totalCleaned++;
        }
      }

      // Check following
      for (const followingId of user.following) {
        const followingExists = await User.exists({ _id: followingId });
        if (followingExists) {
          validFollowing.push(followingId);
        } else {
          needsUpdate = true;
          totalCleaned++;
        }
      }

      // Update user if orphaned references found
      if (needsUpdate) {
        await User.findByIdAndUpdate(user._id, {
          followers: validFollowers,
          following: validFollowing
        });
        console.log(`✅ Cleaned up references for user: ${user.username}`);
      }
    }

    console.log(`🧹 Cleanup complete! Removed ${totalCleaned} orphaned references`);

    res.status(200).json({
      success: true,
      message: "Orphaned references cleaned up successfully",
      cleanedCount: totalCleaned
    });

  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clean up orphaned references",
      error: error.message
    });
  }
});
