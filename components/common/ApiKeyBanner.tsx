import React from 'react';

interface ApiKeyBannerProps {
    isKeyReady: boolean;
    onSelectKey: () => void;
    featureName: string;
}

export const ApiKeyBanner: React.FC<ApiKeyBannerProps> = ({ isKeyReady, onSelectKey, featureName }) => {
    if (isKeyReady) {
        return null;
    }

    return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md shadow-md mb-6" role="alert">
            <p className="font-bold">API Key Required</p>
            <p className="text-sm">
                To use the {featureName} feature, you must select an API key. 
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-medium ml-1">Learn about billing</a>.
            </p>
            <button
                onClick={onSelectKey}
                className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
            >
                Select API Key
            </button>
        </div>
    );
};
