import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="flex items-center justify-center h-screen text-muted-foreground">Chargement...</div>;
    }

    if (!user) {
        const redirectTo = `${location.pathname}${location.search}`;
        return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;