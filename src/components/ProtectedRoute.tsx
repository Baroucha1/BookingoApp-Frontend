import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import AppLoading from '@/components/common/AppLoading';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <AppLoading message="Vérification de votre session..." />;
    }

    if (!user) {
        const redirectTo = `${location.pathname}${location.search}`;
        return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;