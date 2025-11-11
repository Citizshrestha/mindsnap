// hooks/useDeletedUserTracking.ts
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { socketService } from '../services/socketServices';
import { 
  markUserAsDeleted, 
  cleanupDeletedUserData, 
  showUserDeletionNotification 
} from '../utils/deletedUserUtils';
import { setNotifications } from '../redux/slices/notificationSlice';
import { useSelector } from 'react-redux';
import type { RootState } from '../redux/store';

/**
 * Hook to track deleted users and clean up their data across the application
 */
export const useDeletedUserTracking = () => {
  const dispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notification.notifications);

  useEffect(() => {
    const handleUserAccountDeleted = (data: { deletedUserId: string; deletedUsername: string; message: string }) => {
      console.log(`🗑️ Global user deletion handler: ${data.deletedUsername}`);
      
      // Mark user as deleted in our tracking system
      markUserAsDeleted(data.deletedUserId, data.deletedUsername);
      
      // Clean up localStorage data
      cleanupDeletedUserData(data.deletedUserId);
      
      // Remove notifications from deleted user
      const filteredNotifications = notifications.filter(notif => notif.sender?._id !== data.deletedUserId);
      dispatch(setNotifications(filteredNotifications));
      
      // Show notification
      showUserDeletionNotification(data.deletedUsername, 'general');
    };

    const handleUserDeleted = (data: { deletedUserId: string; deletedUsername: string; message: string }) => {
      console.log(`🗑️ Individual user deletion handler: ${data.deletedUsername}`);
      
      // Mark user as deleted in our tracking system
      markUserAsDeleted(data.deletedUserId, data.deletedUsername);
      
      // Clean up localStorage data
      cleanupDeletedUserData(data.deletedUserId);
      
      // Remove notifications from deleted user
      const filteredNotifications = notifications.filter(notif => notif.sender?._id !== data.deletedUserId);
      dispatch(setNotifications(filteredNotifications));
    };

    // Set up socket listeners
    socketService.onUserAccountDeleted(handleUserAccountDeleted);
    socketService.onUserDeleted(handleUserDeleted);

    return () => {
      // Clean up listeners
      socketService.offUserAccountDeleted(handleUserAccountDeleted);
      socketService.offUserDeleted(handleUserDeleted);
    };
  }, [dispatch, notifications]);

  return {
    // Expose utility functions if needed
    markUserAsDeleted,
    cleanupDeletedUserData,
    showUserDeletionNotification
  };
};