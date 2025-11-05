import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { StudentSubmission, SubmissionStatus } from '../../types';
import SubmissionForm from './SubmissionForm';
import { Spinner } from '../ui/Indicators';
import Toast from '../ui/Toast';

// --- ICONS --- //
const Icons = {
    UserIcon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    ),
    MailIcon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
    ),
    AcademicCapIcon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        </svg>
    ),
    IdentificationIcon: (props: React.SVGProps<SVGSVGElement>) => (
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
        </svg>
    ),
    CheckCircleIcon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    XCircleIcon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

// --- SUB-COMPONENTS --- //

const ProfileEditor: React.FC<{
    initialData: { fullName: string; enrollmentNumber: string };
    onSave: (data: { fullName: string; enrollmentNumber: string }) => Promise<void>;
    onCancel: () => void;
}> = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialData);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await onSave(formData);
        setLoading(false);
    };

    return (
        <form onSubmit={handleSave} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                    type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Enrollment Number</label>
                <input
                    type="text" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} required
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                    {loading ? 'Saving...' : 'Save Profile'}
                </button>
            </div>
        </form>
    );
};

const ProfileSummaryCard: React.FC<{ 
    studentData: StudentSubmission, 
    onEdit: () => void 
}> = ({ studentData, onEdit }) => (
    <div className="bg-white overflow-hidden shadow-lg rounded-xl h-full">
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Profile Summary</h3>
                <button onClick={onEdit} className="text-sm font-medium text-blue-600 hover:text-blue-500">Edit</button>
            </div>
            <div className="space-y-4 text-sm">
                <div className="flex items-center">
                    <Icons.UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-500 font-medium w-24">Name:</span>
                    <span className="text-gray-800">{studentData.fullName}</span>
                </div>
                <div className="flex items-center">
                    <Icons.MailIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-500 font-medium w-24">Email:</span>
                    <span className="text-gray-800">{studentData.email}</span>
                </div>
                <div className="flex items-center">
                    <Icons.AcademicCapIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-500 font-medium w-24">Class:</span>
                    <span className="text-gray-800">{studentData.class}</span>
                </div>
                <div className="flex items-center">
                    <Icons.IdentificationIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <span className="text-gray-500 font-medium w-24">Enrollment No:</span>
                    <span className="text-gray-800">{studentData.enrollmentNumber || 'Not provided'}</span>
                </div>
            </div>
        </div>
    </div>
);

const StatusTimeline: React.FC<{ studentData: StudentSubmission }> = ({ studentData }) => {
    const { status, adminReply, adminProofLink } = studentData;

    if (status === SubmissionStatus.Rejected) {
        return (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <Icons.XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Submission Rejected</h3>
                        <div className="mt-2 text-sm text-red-700">
                            <p>{adminReply || 'Your submission could not be processed. Please check your details and resubmit.'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const steps = [
        { name: 'Payment Received', statuses: [SubmissionStatus.Paid, SubmissionStatus.Processing, SubmissionStatus.Verified, SubmissionStatus.Uploaded] },
        { name: 'Admin Verified Details', statuses: [SubmissionStatus.Verified, SubmissionStatus.Uploaded] },
        { name: 'TMA Uploaded to NIOS', statuses: [SubmissionStatus.Uploaded] }
    ];

    return (
        <div className="flow-root">
             <h3 className="text-xl font-semibold text-gray-900 mb-6">Submission Progress</h3>
            <ul className="-mb-8">
                {steps.map((step, stepIdx) => {
                    const isCompleted = step.statuses.includes(status);
                    const isCurrent = isCompleted && !steps[stepIdx + 1]?.statuses.includes(status);

                    return (
                        <li key={step.name}>
                            <div className="relative pb-8">
                                {stepIdx !== steps.length - 1 ? (
                                    <span className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${isCompleted ? 'bg-blue-600' : 'bg-gray-200'}`} aria-hidden="true" />
                                ) : null}
                                <div className="relative flex items-center space-x-3">
                                    <div>
                                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                            <Icons.CheckCircleIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                        </span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm ${isCurrent ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                                            {step.name}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
             {status === SubmissionStatus.Uploaded && (
                <div className="mt-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                     <div className="flex">
                        <div className="flex-shrink-0">
                            <Icons.CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-green-800">Congratulations! Your TMA is Uploaded.</h3>
                            {adminProofLink && (
                                <div className="mt-2 text-sm text-green-700">
                                    <a href={adminProofLink} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:text-blue-500">
                                        Click here to view the upload proof
                                    </a>
                                </div>
                            )}
                             {adminReply && <p className="mt-2 text-sm text-gray-500">Admin Message: {adminReply}</p>}
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};

const CtaCard: React.FC<{ status: SubmissionStatus, onClick: () => void }> = ({ status, onClick }) => (
    <div className="bg-white overflow-hidden shadow-lg rounded-xl h-full flex flex-col justify-center p-6 text-center">
        <h3 className="text-2xl font-bold text-gray-900">
            {status === SubmissionStatus.Rejected ? 'Resubmit Your TMA' : 'Get Started with Your TMA Submission'}
        </h3>
        <p className="mt-3 text-gray-600">
             {status === SubmissionStatus.Rejected 
                ? 'There was an issue with your previous submission. Please click below to correct your details and resubmit.' 
                : 'Provide your details and complete the payment to get your Tutor Marked Assignments uploaded by our experts.'}
        </p>
        <button
            onClick={onClick}
            className="mt-8 w-full sm:w-auto self-center inline-block bg-gradient-to-r from-blue-500 to-blue-700 border border-transparent rounded-xl py-3 px-10 font-medium text-white hover:from-blue-600 hover:to-blue-800 shadow-lg transition-transform transform hover:scale-105"
        >
            {status === SubmissionStatus.Rejected ? 'Resubmit Form' : 'Submit TMA Now'}
        </button>
    </div>
);


const DashboardHome: React.FC<{
    studentData: StudentSubmission;
    isEditingProfile: boolean;
    setIsEditingProfile: (isEditing: boolean) => void;
    handleSaveProfile: (data: { fullName: string, enrollmentNumber: string }) => Promise<void>;
    setShowSubmissionForm: (show: boolean) => void;
}> = ({ studentData, isEditingProfile, setIsEditingProfile, handleSaveProfile, setShowSubmissionForm }) => {
    
    const canCreateNewSubmission = !studentData || studentData.status === SubmissionStatus.Pending || studentData.status === SubmissionStatus.Rejected;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2">
                    {isEditingProfile ? (
                        <div className="bg-white overflow-hidden shadow-lg rounded-xl p-6">
                            <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h3>
                            <ProfileEditor 
                                initialData={{ 
                                    fullName: studentData.fullName, 
                                    enrollmentNumber: studentData.enrollmentNumber || '' 
                                }}
                                onSave={handleSaveProfile}
                                onCancel={() => setIsEditingProfile(false)}
                            />
                        </div>
                    ) : (
                        <ProfileSummaryCard studentData={studentData} onEdit={() => setIsEditingProfile(true)} />
                    )}
                </div>

                <div className="lg:col-span-3">
                    {canCreateNewSubmission ? (
                        <CtaCard status={studentData.status} onClick={() => setShowSubmissionForm(true)} />
                    ) : (
                        <div className="bg-white overflow-hidden shadow-lg rounded-xl p-6 h-full">
                           <StatusTimeline studentData={studentData} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT --- //

const StudentDashboard: React.FC = () => {
    const { user, studentData } = useAuth();
    const [showSubmissionForm, setShowSubmissionForm] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [price, setPrice] = useState<number>(1499);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            setLoading(true);
            try {
                const configDoc = await getDoc(doc(db, 'config', 'price'));
                if (configDoc.exists()) {
                    setPrice(configDoc.data().amount);
                }
            } catch (error) {
                console.error("Error fetching price:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);
    
    const handleSubmissionSuccess = () => {
        setShowSubmissionForm(false);
        setToast({ message: 'Payment successful! We will process your TMA upload shortly.', type: 'success' });
    }

    const handleSaveProfile = async (data: { fullName: string; enrollmentNumber: string }) => {
        if (!user) {
            setToast({ message: 'You are not logged in.', type: 'error' });
            return;
        }
        try {
            const studentDocRef = doc(db, 'students', user.uid);
            await updateDoc(studentDocRef, {
                fullName: data.fullName,
                enrollmentNumber: data.enrollmentNumber,
                updatedAt: serverTimestamp(),
            });
            setToast({ message: 'Profile updated successfully.', type: 'success' });
            setIsEditingProfile(false);
        } catch (error: any) {
            setToast({ message: `Failed to update profile: ${error.message}`, type: 'error' });
        }
    };
    
    if (loading || !studentData) {
        return <div className="flex justify-center items-center h-screen"><Spinner /></div>;
    }

    return (
        <div className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            <div className="px-4 sm:px-0">
                <div className="w-full mb-8">
                    <img
                        className="w-full h-auto object-cover rounded-lg shadow-lg"
                        src="https://i.ibb.co/bgZ86HQV/NIOS-TMA.png"
                        alt="NIOS TMA Banner"
                    />
                </div>
                 <h2 className="text-3xl font-bold text-gray-800 mb-8">Welcome, {studentData.fullName} 👋</h2>

                {showSubmissionForm ? (
                    <SubmissionForm price={price} onSuccess={handleSubmissionSuccess} onCancel={() => setShowSubmissionForm(false)} />
                ) : (
                    <DashboardHome 
                        studentData={studentData}
                        isEditingProfile={isEditingProfile}
                        setIsEditingProfile={setIsEditingProfile}
                        handleSaveProfile={handleSaveProfile}
                        setShowSubmissionForm={setShowSubmissionForm}
                    />
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;