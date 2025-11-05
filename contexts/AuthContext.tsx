import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { StudentSubmission } from '../types';

interface AuthContextType {
    user: User | null;
    studentData: StudentSubmission | null;
    isAdmin: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, studentData: null, isAdmin: false, loading: true });

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [studentData, setStudentData] = useState<StudentSubmission | null>(null);
    const [isAdmin, setIsAdmin] = useState<boolean>(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setIsAdmin(false);
                setStudentData(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    useEffect(() => {
        let unsubscribeRole: (() => void) | undefined;
        let unsubscribeStudent: (() => void) | undefined;

        if (user) {
            setLoading(true);

            // Special check for the hardcoded super admin email
            if (user.email === 'ddeducation.in@gmail.com') {
                setIsAdmin(true);
                setStudentData(null);
                setLoading(false);
            } else {
                 const roleDocRef = doc(db, 'roles', user.uid);
                unsubscribeRole = onSnapshot(roleDocRef, (roleSnap) => {
                    const userIsAdmin = roleSnap.exists() && roleSnap.data()?.role === 'admin';
                    setIsAdmin(userIsAdmin);

                    if (userIsAdmin) {
                        setStudentData(null);
                        setLoading(false);
                    } else {
                        const studentDocRef = doc(db, 'students', user.uid);
                        unsubscribeStudent = onSnapshot(studentDocRef, (studentSnap) => {
                            if (studentSnap.exists()) {
                                setStudentData({ id: studentSnap.id, ...studentSnap.data() } as StudentSubmission);
                            } else {
                                setStudentData(null);
                            }
                            setLoading(false);
                        }, (error) => {
                             console.error("Error fetching student data:", error);
                             setStudentData(null);
                             setLoading(false);
                        });
                    }
                }, (error) => {
                    console.error("Error fetching role:", error);
                    setIsAdmin(false); // Default to non-admin on error
                    // Attempt to fetch student data even if role check fails, assuming non-admin.
                    const studentDocRef = doc(db, 'students', user.uid);
                    unsubscribeStudent = onSnapshot(studentDocRef, (studentSnap) => {
                        if (studentSnap.exists()) {
                            setStudentData({ id: studentSnap.id, ...studentSnap.data() } as StudentSubmission);
                        } else {
                            setStudentData(null);
                        }
                        setLoading(false);
                    });
                });
            }
        }

        return () => {
            unsubscribeRole?.();
            unsubscribeStudent?.();
        };
    }, [user]);

    const value = { user, studentData, isAdmin, loading };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};