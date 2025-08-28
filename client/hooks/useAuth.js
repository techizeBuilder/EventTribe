
import { useSelector } from 'react-redux';

export const useAuth = () => {
  const { user, isAuthenticated, token } = useSelector((state) => state.auth);
  
  return {
    user,
    isAuthenticated,
    token,
    isOrganizer: user?.role === 'organizer',
    isAttendee: user?.role === 'attendee',
    userName: user?.firstName || user?.name || user?.email?.split('@')[0] || 'User',
    userEmail: user?.email || 'user@example.com',
  };
};
