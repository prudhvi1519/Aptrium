import React from 'react';

export const LoadingSpinner = ({ size = 'w-8 h-8' }: { size?: string }) => {
  return (
    <div className={`animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 ${size}`} />
  );
};
