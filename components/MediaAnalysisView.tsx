import React, { useState, useRef } from 'react';
import { analyzeMedia } from '../services/geminiService';
import { FeaturePlaceholder } from './common/FeaturePlaceholder';
import { ImageIcon } from './icons';
import { LoadingSpinner } from './common/LoadingSpinner';

export const MediaAnalysisView = ({ type }: { type: 'image' | 'video' }) => {
    const [prompt, setPrompt] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const model = type === 'image' ? 'gemini-2.5-flash' : 'gemini-2.5-pro';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFileUrl(URL.createObjectURL(selectedFile));
            setAnalysis(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!prompt.trim() || !file) {
            setError(`Please upload a ${type} and enter a question or task.`);
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis(null);
        try {
            const result = await analyzeMedia(prompt, file, model);
            setAnalysis(result);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to analyze ${type}: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetState = () => {
        setPrompt('');
        setFile(null);
        setFileUrl(null);
        setAnalysis(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const featureName = type === 'image' ? 'Image Analysis' : 'Video Analysis';
    const description = `Upload a ${type} and ask questions or request tasks based on its content.`;
    const acceptType = type === 'image' ? 'image/*' : 'video/*';
    
    if (!fileUrl) {
        return (
            <FeaturePlaceholder
                icon={<ImageIcon />}
                name={featureName}
                description={description}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept={acceptType}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
            </FeaturePlaceholder>
        );
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col overflow-y-auto">
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="w-full flex flex-col items-center">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Media</h3>
                    {type === 'image' ? 
                        <img src={fileUrl} alt="uploaded content" className="rounded-lg shadow-md object-contain max-h-96 w-auto" /> :
                        <video src={fileUrl} controls className="rounded-lg shadow-md max-h-96 w-full" />
                    }
                </div>
                <div className="w-full flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Analysis Result</h3>
                    <div className="w-full min-h-[20rem] bg-gray-100 rounded-lg shadow-inner p-4 overflow-y-auto">
                        {isLoading && <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}
                        {error && <div className="text-red-500">{error}</div>}
                        {analysis && <p className="whitespace-pre-wrap text-gray-800">{analysis}</p>}
                    </div>
                </div>
            </div>
            
            <div className="mt-8 space-y-4">
                 <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={`e.g., What is happening in this ${type}?`}
                    className="w-full p-3 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-lg resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    rows={2}
                    disabled={isLoading}
                />
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={handleAnalyze}
                        disabled={isLoading || !prompt.trim()}
                        className="flex-1 bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                       {isLoading ? 'Analyzing...' : 'Analyze'}
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