import React, { useState } from 'react';
import { auth, db } from '../../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { SubmissionStatus } from '../../types';

interface AuthFormProps {
    closeModal: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ closeModal }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [selectedClass, setSelectedClass] = useState<'10th' | '12th'>('12th');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRegistering) {
                // Register
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: fullName });

                // Create student document in Firestore
                await setDoc(doc(db, "students", user.uid), {
                    uid: user.uid,
                    fullName,
                    email,
                    class: selectedClass,
                    status: SubmissionStatus.Pending,
                    createdAt: serverTimestamp(),
                });

                // Create role document in Firestore
                await setDoc(doc(db, "roles", user.uid), { role: 'student' });

            } else {
                // Login
                await signInWithEmailAndPassword(auth, email, password);
            }
            closeModal();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">{isRegistering ? 'Create Student Account' : 'Student Login'}</h2>
            
            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">{error}</div>}

            <form onSubmit={handleAuthAction} className="space-y-4">
                {isRegistering && (
                    <>
                        <input type="text" placeholder="Full Name *" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value as '10th' | '12th')} required className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white">
                            <option value="12th">Class 12th</option>
                            <option value="10th">Class 10th</option>
                        </select>
                    </>
                )}
                <input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <input type="password" placeholder="Password *" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-400">
                    {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
                </button>
            </form>

            <p className="text-center text-sm text-gray-600">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                <button onClick={() => setIsRegistering(!isRegistering)} className="ml-1 font-medium text-blue-600 hover:text-blue-500">
                    {isRegistering ? 'Login' : 'Register'}
                </button>
            </p>
        </div>
    );
};

export default AuthForm;