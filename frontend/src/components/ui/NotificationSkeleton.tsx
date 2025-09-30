import React from 'react';

interface NotificationSkeletonProps {
  count?: number;
}

const NotificationSkeleton: React.FC<NotificationSkeletonProps> = ({ count = 3 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
          {/* Avatar skeleton */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
          
          {/* Content skeleton */}
          <div className="flex-1 space-y-2">
            {/* Username and action */}
            <div className="flex items-center space-x-2">
              <div className="h-4 bg-gray-300 rounded w-20"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
            
            {/* Time */}
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
          
          {/* Action button skeleton */}
          <div className="w-8 h-8 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSkeleton;
