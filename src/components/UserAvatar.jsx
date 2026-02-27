import { API_URL } from '../services/api';

const getAvatarUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${API_URL}${url}`;
};

export default function UserAvatar({ profile, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : '';

  return profile?.avatar ? (
    <img
      src={getAvatarUrl(profile.avatar)}
      alt={profile.name}
      className={`user-avatar ${sizeClass}`}
    />
  ) : (
    <div className={`user-avatar-placeholder ${sizeClass}`}>
      {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
    </div>
  );
}
