import React from 'react';
import { CheckIcon, CrossCircledIcon } from '@radix-ui/react-icons';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge = ({ status, size = 'md' }: StatusBadgeProps) => {
  const isSuccess = status === 'success';
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };
  
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${
        isSuccess 
          ? 'bg-green-100 text-green-800 border border-green-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      {isSuccess ? (
        <CheckIcon className="h-3.5 w-3.5" />
      ) : (
        <CrossCircledIcon className="h-3.5 w-3.5" />
      )}
      {isSuccess ? 'Успешно' : 'Ошибка'}
    </span>
  );
};

export default StatusBadge;