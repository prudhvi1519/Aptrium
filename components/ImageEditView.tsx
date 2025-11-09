import React, { useState, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { FeaturePlaceholder } from './common/FeaturePlaceholder';
import { SlidersIcon } from './icons';
import { LoadingSpinner } from './common/LoadingSpinner';

export const ImageEditView = () => {
    const [prompt, setPrompt] = useState('');
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setOriginalImage(file);
            setOriginalImageUrl(URL.createObjectURL(file));
            setEditedImageUrl(null);
            setError(null);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || !originalImage) {
            setError('Please upload an image and enter an editing instruction.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setEditedImageUrl(null);
        try {
            const imageUrl = await editImage(prompt, originalImage);
            setEditedImageUrl(imageUrl);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to edit image: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetState = () => {
        setPrompt('');
        setOriginalImage(null);
        setOriginalImageUrl(null);
        setEditedImageUrl(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    if (!originalImageUrl) {
        return (
            <FeaturePlaceholder
                icon={<SlidersIcon />}
                name="Image Editing"
                description="Upload an image and tell the AI how to change it. For example, 'add a retro filter' or 'make the sky purple'."
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </FeaturePlaceholder>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col overflow-y-auto">
             <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8">
                <div className="w-full lg:w-1/2 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Original</h3>
                    <img src={originalImageUrl} alt="Original" className="rounded-lg shadow-md object-contain max-h-96 w-auto"/>
                </div>
                <div className="w-full lg:w-1/2 flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Edited</h3>
                    <div className="w-full aspect-square bg-gray-100 rounded-lg shadow-md flex items-center justify-center">
                        {isLoading && <LoadingSpinner />}
                        {error && <div className="text-red-500 p-4 text-center">{error}</div>}
                        {editedImageUrl && <img src={editedImageUrl} alt="Edited" className="rounded-lg object-contain max-h-96 w-auto"/>}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 space-y-4">
                 <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., Change the background to a beach at sunset"
                    className="w-full p-3 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-lg resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    rows={2}
                    disabled={isLoading}
                />
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !prompt.trim()}
                        className="flex-1 bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                       {isLoading ? 'Editing...' : 'Edit Image'}
                    </button>
                    <button
                        onClick={resetState}
                        className="flex-1 sm:flex-initial bg-gray-200 text-gray-800 font-semibold py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Start Over
                    </button>
                </div>
            </div>
        </div>
    );
};