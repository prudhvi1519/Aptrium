import React from 'react';

export const AptriumLogo = ({ className = 'h-7' }: { className?: string }) => (
    <div className={`inline-flex items-center gap-2 ${className}`} aria-label="Aptrium Logo">
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="w-auto h-full text-blue-500"
            aria-hidden="true"
        >
            <path d="M12 2 L2 7 L12 22 L22 7 L12 2 Z" />
            <path d="M12 22 L12 12" />
            <path d="M2 7 L12 12 L22 7" />
        </svg>
        <span className="text-xl font-bold tracking-tighter text-gray-800">Aptrium</span>
    </div>
);
