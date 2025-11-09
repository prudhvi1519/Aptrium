import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';
import { FeaturePlaceholder } from './common/FeaturePlaceholder';
import { Volume2Icon } from './icons';
import { LoadingSpinner } from './common/LoadingSpinner';

export const TTSView = () => {
    const [text, setText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

    const handleGenerate = async () => {
        if (!text.trim()) {
            setError('Please enter some text to convert to speech.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setAudioBuffer(null);

        try {
            const buffer = await generateSpeech(text);
            setAudioBuffer(buffer);
            playAudio(buffer);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to generate speech: ${errorMessage}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const playAudio = (buffer: AudioBuffer) => {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
    };

    return (
        <FeaturePlaceholder
            icon={<Volume2Icon />}
            name="Text-to-Speech"
            description="Convert written text into natural-sounding audio. Type something and press Speak."
        >
            <div className="w-full flex flex-col items-center gap-4">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Hello, Aptrium! Welcome to the future of AI."
                    className="w-full p-3 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-lg resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                    rows={5}
                />
                <button
                    onClick={handleGenerate}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-blue-500 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2"
                >
                    {isLoading ? <LoadingSpinner size="w-5 h-5" /> : 'Speak'}
                </button>

                {error && <p className="text-red-500 mt-4">{error}</p>}
                
                {audioBuffer && (
                     <button
                        onClick={() => playAudio(audioBuffer)}
                        className="mt-4 bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                     >
                        <Volume2Icon className="w-5 h-5" /> Replay Audio
                     </button>
                )}
            </div>
        </FeaturePlaceholder>
    );
};