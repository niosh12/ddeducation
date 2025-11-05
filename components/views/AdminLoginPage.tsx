import React from 'react';
import AdminAuthForm from '../auth/AdminAuthForm';

const AdminLoginPage: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4" style={{ minHeight: 'calc(100vh - 150px)' }}>
            <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
                <AdminAuthForm />
            </div>
        </div>
    );
};

export default AdminLoginPage;
