import React from 'react';
import { SubmissionStatus } from '../../types';

export const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
);

interface SubmissionStatusBadgeProps {
    status: SubmissionStatus;
}

export const SubmissionStatusBadge: React.FC<SubmissionStatusBadgeProps> = ({ status }) => {
    // FIX: Corrected the keys to match the SubmissionStatus enum and added missing status styles.
    const statusStyles: { [key in SubmissionStatus]: string } = {
        [SubmissionStatus.Pending]: 'bg-gray-100 text-gray-800',
        [SubmissionStatus.Paid]: 'bg-blue-100 text-blue-800',
        [SubmissionStatus.Processing]: 'bg-blue-100 text-blue-800',
        [SubmissionStatus.Verified]: 'bg-yellow-100 text-yellow-800',
        [SubmissionStatus.Uploaded]: 'bg-green-100 text-green-800',
        [SubmissionStatus.Rejected]: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    );
};
