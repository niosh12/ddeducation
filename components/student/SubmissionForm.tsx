import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { SubmissionStatus } from '../../types';
import { SUBJECTS_CLASS_10, SUBJECTS_CLASS_12 } from '../../constants';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface SubmissionFormProps {
    price: number;
    onSuccess: () => void;
    onCancel: () => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ price, onSuccess, onCancel }) => {
    const { user, studentData } = useAuth();
    
    const [enrollmentNumber, setEnrollmentNumber] = useState(studentData?.enrollmentNumber || '');
    const [dob, setDob] = useState(studentData?.dob || '');
    const [session, setSession] = useState(studentData?.session ||'April 2026');
    const [subjects, setSubjects] = useState<string[]>(studentData?.subjects || []);
    const [paymentImageBase64, setPaymentImageBase64] = useState(studentData?.paymentImageBase64 || '');
    const [comments, setComments] = useState(studentData?.comments || '');
    const [declaration, setDeclaration] = useState(false);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const subjectOptions = studentData?.class === '10th' ? SUBJECTS_CLASS_10 : SUBJECTS_CLASS_12;

    const handleSubjectChange = (subject: string) => {
        setSubjects(prev =>
            prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
        );
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file (PNG, JPG, etc.).');
                return;
            }
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                setError('File is too large. Please upload an image smaller than 2MB.');
                return;
            }
            setError(null);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentImageBase64(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const displayRazorpay = async () => {
        if (!user) return;
        
        const options = {
            key: "rzp_test_demo12345", // Updated Key
            amount: price * 100,
            currency: "INR",
            name: "DD EDUCATION",
            description: "NIOS TMA Upload Service",
            handler: async (response: any) => {
                const studentDocRef = doc(db, 'students', user.uid);
                await updateDoc(studentDocRef, {
                    status: SubmissionStatus.Paid,
                    paymentRef: response.razorpay_payment_id,
                    razorpay_order_id: response.razorpay_payment_id, // Using same for demo
                    razorpay_signature: "demo_signature", // Using demo signature
                    updatedAt: serverTimestamp(),
                });
                onSuccess();
            },
            prefill: {
                name: studentData?.fullName,
                email: user?.email,
            },
            theme: {
                color: "#0048BA"
            },
            modal: {
                ondismiss: () => {
                    setLoading(false);
                    setError("Payment cancelled. Your details are saved. You can try paying again by creating a new submission from your dashboard.");
                }
            }
        };

        try {
            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (e: any) {
            console.error("Razorpay initialization error: ", e);
            setError(`Could not initialize payment gateway. Please try again. Error: ${e.message}`);
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!declaration) {
            setError('You must accept the declaration to proceed.');
            return;
        }
        if (!user) {
            setError('You must be logged in to submit.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const studentDocRef = doc(db, 'students', user.uid);
            await updateDoc(studentDocRef, {
                enrollmentNumber,
                dob,
                session,
                subjects,
                paymentImageBase64,
                comments,
                status: SubmissionStatus.Pending, // Set to pending, will be 'Paid' after payment
                updatedAt: serverTimestamp(),
            });
            
            await displayRazorpay();

        } catch (err: any) {
            console.error("Error updating submission document: ", err);
            setError(`Failed to save submission. Please check your network and try again. Error: ${err.message}`);
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-lg sm:rounded-xl">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Submit Your TMA Details</h3>
                <p className="mt-1 text-sm text-gray-500">Complete your details below, then click 'Proceed to Pay' to open the secure payment window.</p>
                
                {error && <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>}
                
                <form onSubmit={handleSubmit} className="mt-5 grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-8">
                    <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Enrollment Number</label>
                        <input type="text" value={enrollmentNumber} onChange={e => setEnrollmentNumber(e.target.value)} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                     <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                        <input type="date" value={dob} onChange={e => setDob(e.target.value)} required className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md" />
                    </div>
                    <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700">Session</label>
                        <select value={session} onChange={(e) => setSession(e.target.value)} className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md">
                            <option>April 2026</option>
                            <option>October 2026</option>
                        </select>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Subjects for Class {studentData?.class}</label>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 rounded-md">
                        {subjectOptions.map(subject => (
                            <div key={subject} className="flex items-center">
                                <input id={subject} name="subjects" type="checkbox" checked={subjects.includes(subject)} onChange={() => handleSubjectChange(subject)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label htmlFor={subject} className="ml-2 block text-sm text-gray-900">{subject}</label>
                            </div>
                        ))}
                        </div>
                    </div>
                    
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Payment Amount</label>
                        <div className="mt-1 p-2 bg-gray-100 border border-gray-300 rounded-md">INR {price}</div>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Payment Screenshot (Optional)</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                {paymentImageBase64 ? (
                                    <div>
                                        <img src={paymentImageBase64} alt="Payment proof preview" className="mx-auto h-32 w-auto rounded-md object-contain" />
                                        <button type="button" onClick={() => setPaymentImageBase64('')} className="mt-2 text-sm font-medium text-red-600 hover:text-red-500">
                                            Remove Image
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-600 justify-center">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                                            </label>
                                        </div>
                                        <p className="text-xs text-gray-500">PNG, JPG, etc. up to 2MB</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Comments (optional)</label>
                        <textarea rows={3} value={comments} onChange={e => setComments(e.target.value)} placeholder="Any note for admin" className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"></textarea>
                    </div>

                    <div className="sm:col-span-2">
                        <div className="flex items-start">
                            <div className="flex-shrink-0">
                                <input id="declaration" name="declaration" type="checkbox" checked={declaration} onChange={e => setDeclaration(e.target.checked)} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="declaration" className="font-medium text-gray-700">Declaration</label>
                                <p className="text-gray-500">I authorize DD EDUCATION to upload my TMA on my behalf.</p>
                            </div>
                        </div>
                    </div>

                    <div className="sm:col-span-2 flex justify-end space-x-3">
                         <button type="button" onClick={onCancel} className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300">
                            {loading ? 'Processing...' : 'Proceed to Pay'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmissionForm;