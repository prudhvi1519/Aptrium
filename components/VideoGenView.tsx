import React, { useState, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { useVeoApiKey } from '../hooks/useVeoApiKey';
import { FeaturePlaceholder } from './common/FeaturePlaceholder';
import { VideoIcon } from './icons';
import { LoadingSpinner } from './common/LoadingSpinner';
import { ApiKeyBanner } from './common/ApiKeyBanner';

type AspectRatio = '16:9' | '9:16';

export const VideoGenView = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [image, setImage] = useState<File | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isKeyReady, selectKey, handleApiError } = useVeoApiKey();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            setImageUrl(URL.createObjectURL(file));
        }
    };
    
    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedVideo(null);
        try {
            const videoUrl = await generateVideo(prompt, aspectRatio, image || undefined);
            setGeneratedVideo(videoUrl);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            if (errorMessage.includes("Requested entity was not found")) {
                handleApiError();
            } else {
                setError(`Failed to generate video: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };
    
    const reset = () => {
        setPrompt('');
        setImage(null);
        setImageUrl(null);
        setGeneratedVideo(null);
        setError(null);
        if(fileInputRef.current) fileInputRef.current.value = '';
    };

    if (isLoading || generatedVideo || error) {
        return (
            <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col items-center justify-center">
                 {isLoading && (
                    <div className="flex flex-col items-center gap-4 text-gray-600 text-center">
                        <LoadingSpinner size="w-12 h-12" />
                        <p className="font-semibold text-lg">Generating video...</p>
                        <p className="text-sm max-w-sm">This can take a few minutes. Please be patient and don't close this window.</p>
                    </div>
                )}
                {error && (
                    <div className="text-red-500 bg-red-100 p-4 rounded-lg text-center">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                    </div>
                )}
                {generatedVideo && (
                    <div className="w-full max-w-2xl text-center">
                        <h2 className="text-2xl font-bold mb-4">Video Ready!</h2>
                        <video src={generatedVideo} controls autoPlay loop className="rounded-lg shadow-lg w-full" />
                    </div>
                )}
                 <button onClick={reset} className="mt-8 bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors">
                    Create Another
                </button>
            </div>
        );
    }

    return (
        <FeaturePlaceholder
            icon={<VideoIcon />}
            name="Video Generation"
            description="Create captivating videos from text prompts and optional starting images."
        >
            <div className="w-full flex flex-col items-center gap-4">
                <ApiKeyBanner isKeyReady={isKeyReady} onSelectKey={selectKey} featureName="Video Generation" />
                
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A cinematic shot of a futuristic city at night..."
                    className="w-full p-3 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-lg resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    rows={3}
                />
                
                <div className="w-full p-4 border-2 border-dashed rounded-lg text-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        className="hidden"
                        id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer text-blue-600 hover:underline font-medium">
                        {imageUrl ? 'Change starting image' : 'Add an optional starting image'}
                    </label>
                    {imageUrl && <img src={imageUrl} alt="preview" className="mt-4 rounded-md max-h-32 mx-auto" />}
                </div>

                <div className="w-full flex flex-col sm:flex-row gap-4 items-center">
                     <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">Aspect Ratio</label>
                        <div className="flex gap-2">
                           <button onClick={() => setAspectRatio('16:9')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${aspectRatio === '16:9' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Landscape (16:9)</button>
                           <button onClick={() => setAspectRatio('9:16')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${aspectRatio === '9:16' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Portrait (9:16)</button>
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !isKeyReady || !prompt.trim()}
                        className="w-full sm:w-auto bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                        Generate Video
                    </button>
                </div>
            </div>
        </FeaturePlaceholder>
    );
};