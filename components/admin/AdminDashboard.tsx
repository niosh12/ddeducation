import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, orderBy, query, doc, updateDoc, serverTimestamp, setDoc, getDoc } from 'firebase/firestore';
import { StudentSubmission, SubmissionStatus } from '../../types';
import { Spinner, SubmissionStatusBadge } from '../ui/Indicators';
import Toast from '../ui/Toast';

const SubmissionDetailsModal: React.FC<{ submission: StudentSubmission; onClose: () => void; onUpdate: (id: string, data: any) => Promise<boolean> }> = ({ submission, onClose, onUpdate }) => {
    const [status, setStatus] = useState(submission.status);
    const [adminReply, setAdminReply] = useState(submission.adminReply || '');
    const [adminProofLink, setAdminProofLink] = useState(submission.adminProofLink || '');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async () => {
        setLoading(true);
        const updateData: any = {
            status,
            adminReply,
            adminProofLink,
        };
        const success = await onUpdate(submission.id, updateData);
        setLoading(false);
        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-full overflow-y-auto">
                <div className="p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900">Submission Details</h3>
                    <div className="space-y-4 text-sm text-gray-600">
                        <p><strong>Student:</strong> {submission.fullName} ({submission.class})</p>
                        <p><strong>Enrollment No:</strong> {submission.enrollmentNumber}</p>
                        <p><strong>Payment Ref:</strong> {submission.paymentRef}</p>
                        <p><strong>Subjects:</strong> {submission.subjects?.join(', ') || 'N/A'}</p>
                        <p><strong>Comments:</strong> {submission.comments || 'N/A'}</p>
                        {submission.paymentImageBase64 && (
                            <div>
                                <strong>Payment Screenshot:</strong>
                                <img src={submission.paymentImageBase64} alt="Payment Screenshot" className="mt-2 border rounded-md max-h-64" />
                            </div>
                        )}
                        <hr className="border-gray-200"/>
                        <div className="space-y-4">
                           <div>
                                <label className="block font-medium text-gray-700">Status</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value as SubmissionStatus)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white text-gray-900">
                                    {Object.values(SubmissionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                           </div>
                           <div>
                               <label className="block font-medium text-gray-700">Rejection Reason / Admin Message</label>
                               <textarea value={adminReply} onChange={(e) => setAdminReply(e.target.value)} rows={3} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white text-gray-900" />
                           </div>
                            <div>
                               <label className="block font-medium text-gray-700">NIOS Proof Link (if Uploaded)</label>
                               <input type="url" value={adminProofLink} onChange={(e) => setAdminProofLink(e.target.value)} className="w-full mt-1 p-2 border border-gray-300 rounded-md bg-white text-gray-900" />
                           </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleUpdate} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300 hover:bg-blue-700">
                        {loading ? 'Updating...' : 'Update Status'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard: React.FC = () => {
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [price, setPrice] = useState<number | string>(1499);
    const [isEditingPrice, setIsEditingPrice] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'students'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const subs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudentSubmission));
            setSubmissions(subs);
            setLoading(false);
        });
        
        const priceDocRef = doc(db, 'config', 'price');
        const unsubPrice = onSnapshot(priceDocRef, (docSnap) => {
            if (docSnap.exists()) {
                setPrice(docSnap.data().amount);
            }
        });

        return () => {
            unsubscribe();
            unsubPrice();
        };
    }, []);
    
    const handleUpdatePrice = async () => {
        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice <= 0) {
            setToast({ message: 'Please enter a valid price.', type: 'error' });
            return;
        }
        try {
            await setDoc(doc(db, 'config', 'price'), { amount: numericPrice });
            setToast({ message: 'Price updated successfully.', type: 'success' });
            setIsEditingPrice(false);
        } catch (error: any) {
            setToast({ message: `Failed to update price: ${error.message}`, type: 'error' });
        }
    };


    const filteredSubmissions = useMemo(() => {
        if (!searchTerm) return submissions;
        return submissions.filter(sub => 
            sub.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sub.enrollmentNumber && sub.enrollmentNumber.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [submissions, searchTerm]);
    
    const handleUpdateSubmission = async (id: string, data: any): Promise<boolean> => {
        try {
            const docRef = doc(db, 'students', id);
            await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
            setToast({ message: 'Status updated successfully.', type: 'success' });
            return true;
        } catch (error: any) {
            console.error("Error updating document: ", error);
            setToast({ message: `Update failed: ${error.message}`, type: 'error' });
            return false;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6 px-4 sm:px-0">
                    <div className="lg:col-span-2">
                        <img 
                            src="https://i.ibb.co/bgZ86HQV/NIOS-TMA.png" 
                            alt="NIOS TMA Banner"
                            className="w-full h-full object-cover rounded-lg shadow-lg"
                        />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col justify-center">
                        <h3 className="text-lg font-semibold text-gray-800">Service Price</h3>
                        {isEditingPrice ? (
                            <div className="flex items-center mt-2 gap-2">
                                <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded-md" />
                                <button onClick={handleUpdatePrice} className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">Save</button>
                                <button onClick={() => setIsEditingPrice(false)} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                            </div>
                        ) : (
                             <div className="flex items-baseline mt-2 gap-4">
                                <p className="text-3xl font-bold text-blue-600">₹{price}</p>
                                <button onClick={() => setIsEditingPrice(true)} className="text-sm text-blue-500 hover:underline">Edit Price</button>
                            </div>
                        )}
                    </div>
                </div>
                
                 <div className="px-4 sm:px-0 mb-4">
                    <input
                        type="text"
                        placeholder="Search by name or enrollment no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    />
                </div>

                <div className="px-4 sm:px-0">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <div className="overflow-x-auto">
                            {loading ? <div className="p-8 flex justify-center"><Spinner /></div> : (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Ref</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredSubmissions.map(sub => (
                                            <tr key={sub.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.fullName}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.enrollmentNumber}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.class}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.paymentRef}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><SubmissionStatusBadge status={sub.status} /></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sub.createdAt?.toDate().toLocaleString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button onClick={() => setSelectedSubmission(sub)} className="text-blue-600 hover:text-blue-900">View / Edit</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
                {selectedSubmission && <SubmissionDetailsModal submission={selectedSubmission} onClose={() => setSelectedSubmission(null)} onUpdate={handleUpdateSubmission} />}
            </div>
        </div>
    );
};

export default AdminDashboard;
