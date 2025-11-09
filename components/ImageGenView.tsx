import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { FeaturePlaceholder } from './common/FeaturePlaceholder';
import { WandIcon } from './icons';
import { LoadingSpinner } from './common/LoadingSpinner';

type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export const ImageGenView = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageUrl = await generateImage(prompt, aspectRatio);
            setGeneratedImage(imageUrl);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate image: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const aspectRatios: { value: AspectRatio, label: string }[] = [
        { value: '1:1', label: 'Square' },
        { value: '16:9', label: 'Landscape' },
        { value: '9:16', label: 'Portrait' },
        { value: '4:3', label: 'Wide' },
        { value: '3:4', label: 'Tall' },
    ];

    if (!generatedImage && !isLoading && !error) {
        return (
            <FeaturePlaceholder
                icon={<WandIcon />}
                name="Image Generation"
                description="Describe the image you want to create. Be as specific as you can for the best results."
            >
                <div className="w-full flex flex-col items-center gap-4">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A photorealistic image of a cat wearing a tiny wizard hat..."
                        className="w-full p-3 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-lg resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                        rows={3}
                    />
                    <div className="w-full flex flex-col sm:flex-row gap-4 items-center">
                         <div className="flex-1 w-full sm:w-auto">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Aspect Ratio</label>
                            <div className="flex flex-wrap gap-2">
                                {aspectRatios.map(ar => (
                                    <button
                                        key={ar.value}
                                        onClick={() => setAspectRatio(ar.value)}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${aspectRatio === ar.value ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                    >
                                        {ar.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full sm:w-auto bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                        >
                            Generate
                        </button>
                    </div>
                </div>
            </FeaturePlaceholder>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center">
                {isLoading && (
                    <div className="flex flex-col items-center gap-4 text-gray-600">
                        <LoadingSpinner size="w-12 h-12" />
                        <p>Generating your masterpiece...</p>
                    </div>
                )}
                {error && <div className="text-red-500 bg-red-100 p-4 rounded-lg">{error}</div>}
                {generatedImage && (
                    <div className="w-full max-w-2xl">
                        <img src={generatedImage} alt={prompt} className="rounded-lg shadow-lg object-contain w-full h-auto" />
                    </div>
                )}
            </div>
            <div className="mt-6 flex justify-center">
                 <button
                    onClick={() => { setGeneratedImage(null); setError(null); setPrompt(''); }}
                    className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    Start Over
                </button>
            </div>
        </div>
    );
};