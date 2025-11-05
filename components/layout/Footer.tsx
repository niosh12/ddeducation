import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-blue-600">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
                <p className="text-center text-sm text-white">
                    © {new Date().getFullYear()} DD EDUCATION | Empowering NIOS Students.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
