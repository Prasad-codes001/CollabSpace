import React, { useEffect, useState } from 'react';

interface UserAvatarProps {
  name?: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-10 h-10 text-sm',
  lg: 'w-20 h-20 text-2xl',
} as const;

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  avatarUrl,
  size = 'sm',
  className = '',
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [avatarUrl]);

  const hasAvatar = !!avatarUrl && !imgFailed;
  const initial = (name?.trim().charAt(0) || 'U').toUpperCase();

  if (hasAvatar) {
    return (
      <img
        src={avatarUrl as string}
        alt={name || 'User'}
        onError={() => setImgFailed(true)}
        className={`${SIZE_CLASSES[size]} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name ? `${name}'s avatar` : 'User avatar'}
      className={`${SIZE_CLASSES[size]} rounded-full bg-[#D97706] flex items-center justify-center font-bold text-white shrink-0 ${className}`}
    >
      {initial}
    </div>
  );
};