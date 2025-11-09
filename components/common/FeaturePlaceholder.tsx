import React, { ReactElement } from 'react';

// FIX: Specify that the icon prop is a ReactElement that accepts a className.
// This provides enough type information for React.cloneElement to work without error.
interface FeaturePlaceholderProps {
    icon: ReactElement<{ className?: string }>;
    name: string;
    description: string;
    children?: React.ReactNode;
}

export const FeaturePlaceholder: React.FC<FeaturePlaceholderProps> = ({ icon, name, description, children }) => {
    return (
        <div className="text-center p-8 flex flex-col items-center justify-center h-full">
            <div className="bg-gray-200 rounded-full p-4 mb-4 text-gray-600">
                {React.cloneElement(icon, { className: 'w-10 h-10' })}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{name}</h2>
            <p className="text-gray-500 mt-2 max-w-md">{description}</p>
            {children && <div className="mt-8 w-full max-w-2xl">{children}</div>}
        </div>
    );
};