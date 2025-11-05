import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import LandingPage from './components/views/LandingPage';
import { Spinner } from './components/ui/Indicators';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

const AppContent: React.FC = () => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (!user) {
        return <LandingPage />;
    }

    if (isAdmin) {
        return <AdminDashboard />;
    }

    return <StudentDashboard />;
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