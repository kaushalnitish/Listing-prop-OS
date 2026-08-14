import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { isAccessAuthenticated, ACCESS_CONTROL_ENABLED } from '../../lib/auth';
import { PrivateAccessPage } from '../../pages/auth/PrivateAccessPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [authenticated, setAuthenticated] = useState<boolean>(() => isAccessAuthenticated());

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthenticated(isAccessAuthenticated());
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth_state_changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  if (ACCESS_CONTROL_ENABLED && !authenticated) {
    return (
      <PrivateAccessPage
        redirectTo={location.pathname + location.search + location.hash}
        onSuccess={() => setAuthenticated(true)}
      />
    );
  }

  return <>{children}</>;
};
