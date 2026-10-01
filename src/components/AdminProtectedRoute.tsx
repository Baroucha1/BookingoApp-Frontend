import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import AppLoading from '@/components/common/AppLoading';

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, isAdmin, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <AppLoading message="Vérification de l'accès administrateur..." />;
    }

    if (!user) {
        const redirectTo = `${location.pathname}${location.search}`;
        return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
    }

    if (!isAdmin) {
        // Logged in, but not an admin — don't leak that /admin exists as
        // a valid destination, just bounce them somewhere sane.
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;