
import React, { useState, useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    const baseClasses = 'fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white max-w-sm z-50';
    const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[type]}`}>
            {message}
        </div>
    );
};

export default Toast;
