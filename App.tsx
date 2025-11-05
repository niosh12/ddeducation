import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import LandingPage from './components/views/LandingPage';
import AdminLoginPage from './components/views/AdminLoginPage';
import { Spinner } from './components/ui/Indicators';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

const AppContent: React.FC = () => {
    const { user, isAdmin, loading } = useAuth();
    const [path, setPath] = useState(window.location.pathname);

    useEffect(() => {
        const handlePopState = () => {
            setPath(window.location.pathname);
        };
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    useEffect(() => {
        // If an admin is logged in but not on an admin path, redirect them to /admin.
        if (isAdmin && path !== '/admin') {
            window.history.replaceState(null, '', '/admin');
            setPath('/admin');
        }
        // If a logged-in student tries to access /admin, redirect them to the root.
        if (user && !isAdmin && path === '/admin') {
            window.history.replaceState(null, '', '/');
            setPath('/');
        }
    }, [user, isAdmin, path]);

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (path === '/admin') {
        return isAdmin ? <AdminDashboard /> : <AdminLoginPage />;
    }

    // All other paths default to '/' behavior
    if (user) {
        // isAdmin case is handled by the redirect effect above
        return <StudentDashboard />;
    }

    return <LandingPage />;
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
                <Header />
                <main className="flex-grow">
                    <AppContent />
                </main>
                <Footer />
            </div>
        </AuthProvider>
    );
};

export default App;