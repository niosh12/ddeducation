import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
// FIX: Import db to access Firestore
import { auth, db } from '../../firebase';
// FIX: Import doc and getDoc to read from Firestore
import { doc, getDoc } from 'firebase/firestore';

interface AdminAuthFormProps {
    closeModal: () => void;
}

const AdminAuthForm: React.FC<AdminAuthFormProps> = ({ closeModal }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Allow the hardcoded super admin to log in directly
            if (user.email === 'ddeducation.in@gmail.com') {
                closeModal();
            } else {
                // For other users, check for admin role in Firestore.
                const roleDocRef = doc(db, 'roles', user.uid);
                const roleSnap = await getDoc(roleDocRef);

                if (!roleSnap.exists() || roleSnap.data()?.role !== 'admin') {
                    await auth.signOut();
                    setError("Access Denied. This login is for administrators only.");
                } else {
                    closeModal(); // Success, close modal, AuthContext will take over
                }
            }
        } catch (err: any) {
            // Handle firebase auth errors like wrong password, user not found etc.
             if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError("Invalid email or password.");
            } else {
                setError(err.message || "Failed to log in. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">Admin Login</h2>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
                <input type="email" placeholder="Admin Email *" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <input type="password" placeholder="Password *" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default AdminAuthForm;