import { useEffect } from 'react';
import { useLocation } from 'wouter';
import AuthForm from '@/components/auth/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

const HomePage = () => {
  const [, setLocation] = useLocation();
  const { user, userRole, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation(`/dashboard/${userRole.toLowerCase()}`);
    }
  }, [user, userRole, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return <AuthForm />;
};

export default HomePage;
