import React from 'react';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
    const { user } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <img 
                    src="https://ddeducation.in/wp-content/uploads/2024/06/DD-EDUCATION-2-e1717751649464-removebg-preview.png" 
                    alt="DD EDUCATION Logo"
                    className="h-10 w-auto"
                />
                {user && (
                    <button
                        onClick={handleLogout}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Logout
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;