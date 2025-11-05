import React, { useState } from 'react';
import AuthForm from '../auth/AuthForm';
import Toast from '../ui/Toast';

const LandingPage: React.FC = () => {
    const [showStudentAuthModal, setShowStudentAuthModal] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="w-full">
                        <img
                            className="w-full h-auto object-cover"
                            src="https://i.ibb.co/bgZ86HQV/NIOS-TMA.png"
                            alt="NIOS TMA Banner"
                        />
                    </div>
                </div>

                <div className="max-w-4xl mx-auto text-center py-12 px-4 sm:px-6 lg:px-8">
                     <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl" style={{color: '#0048BA'}}>
                        Fast • Secure • 100% Trusted NIOS TMA Upload Portal
                    </h1>
                    <div className="mt-8">
                        <p className="mt-4 text-base text-gray-600">
                            Upload your payment proof and track your TMA status online for Class 10 & 12.
                            <br/>
                            Service Price: <span className="font-bold text-gray-800">INR 1,499</span>.
                        </p>
                        <div className="mt-8 flex justify-center">
                             <button
                                onClick={() => setShowStudentAuthModal(true)}
                                className="w-full sm:w-auto inline-block bg-gradient-to-r from-blue-500 to-blue-700 border border-transparent rounded-xl py-3 px-8 font-medium text-white hover:from-blue-600 hover:to-blue-800 shadow-lg"
                            >
                                Student Login / Register
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {showStudentAuthModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md m-4">
                        <AuthForm closeModal={() => setShowStudentAuthModal(false)} />
                    </div>
                </div>
            )}
        </>
    );
};

export default LandingPage;