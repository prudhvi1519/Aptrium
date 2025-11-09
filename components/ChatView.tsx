import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateChatResponse } from '../services/geminiService';
import { ChatMessage, GroundingSource } from '../types';
import { LoadingSpinner } from './common/LoadingSpinner';
import { UserIcon, BotIcon, ZapIcon, BrainCircuitIcon } from './icons';

// FIX: Updated model name 'gemini-2.5-flash-lite' to 'gemini-flash-lite-latest' to align with API guidelines.
type SwitcherModel = 'gemini-flash-lite-latest' | 'gemini-2.5-pro';

// FIX: Correctly typed `icon` as `React.ReactElement<{ className?: string }>` to allow passing a `className` prop via `React.cloneElement`, resolving a TypeScript error.
const modelOptions: { id: SwitcherModel; name: string; icon: React.ReactElement<{ className?: string }> }[] = [
    { id: 'gemini-flash-lite-latest', name: 'Lite Chat', icon: <ZapIcon className="w-5 h-5" /> },
    { id: 'gemini-2.5-pro', name: 'Pro Chat', icon: <BrainCircuitIcon className="w-5 h-5" /> },
];

interface ChatViewProps {
    model?: 'gemini-2.5-flash' | 'gemini-flash-lite-latest' | 'gemini-2.5-pro';
    tools?: ('googleSearch' | 'googleMaps')[];
    initialMessage?: string;
    placeholder: string;
    modelSwitcherEnabled?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({ model = 'gemini-2.5-flash', tools = [], initialMessage, placeholder, modelSwitcherEnabled = false }) => {
    const [switcherModel, setSwitcherModel] = useState<SwitcherModel>('gemini-flash-lite-latest');
    const [showModelSelector, setShowModelSelector] = useState(false);
    
    const activeModel = modelSwitcherEnabled ? switcherModel : model;

    const getInitialMessage = () => {
        if (modelSwitcherEnabled) {
            return "I'm the Lite model, designed for speed. What do you need?";
        }
        return initialMessage || "";
    };

    const [messages, setMessages] = useState<ChatMessage[]>(getInitialMessage() ? [{ role: 'model', text: getInitialMessage() }] : []);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const chatEndRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setShowModelSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getGeolocation = useCallback((): Promise<{latitude: number; longitude: number} | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        });
                    },
                    () => {
                        resolve(null); // User denied or error
                    }
                );
            }
        });
    }, []);

    const handleModelSwitch = (newModel: SwitcherModel) => {
        if (newModel !== switcherModel) {
            setSwitcherModel(newModel);
            const newIntro = newModel === 'gemini-flash-lite-latest'
                ? "Switched to Lite Chat. Ready for your quick questions!"
                : "Switched to Pro Chat. I'm equipped for complex reasoning and problems.";
            setMessages([{ role: 'model', text: newIntro }]);
            setInput('');
            setError(null);
        }
        setShowModelSelector(false);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', text: input };
        setMessages(prev => [...prev, newUserMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await generateChatResponse(messages, input, activeModel, tools, getGeolocation);
            const modelMessageText = response.text;
            
            const groundingMeta = response.candidates?.[0]?.groundingMetadata;
            let sources: GroundingSource[] = [];
            if(groundingMeta?.groundingChunks){
                sources = groundingMeta.groundingChunks.map((chunk: any) => ({
                    uri: chunk.web?.uri || chunk.maps?.uri || '',
                    title: chunk.web?.title || chunk.maps?.title || 'Source'
                })).filter(source => source.uri);
            }

            const newModelMessage: ChatMessage = { role: 'model', text: modelMessageText, sources };
            setMessages(prev => [...prev, newModelMessage]);
        } catch (e) {
            console.error(e);
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
            setError(`Failed to get response: ${errorMessage}`);
            setMessages(prev => [...prev, { role: 'model', text: `Sorry, I encountered an error. ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                                <BotIcon className="w-5 h-5 text-gray-600" />
                            </div>
                        )}
                        <div className={`max-w-xl p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 border-t border-gray-200 pt-3">
                                    <h4 className="text-xs font-semibold text-gray-500 mb-2">Sources:</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.sources.map((source, i) => (
                                            <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300 transition-colors">
                                                {source.title || new URL(source.uri).hostname}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon className="w-5 h-5 text-blue-600" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-4">
                         <div className="w-8 h-8 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center">
                            <BotIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="max-w-xl p-4 rounded-2xl bg-gray-100 rounded-bl-none flex items-center justify-center">
                           <LoadingSpinner size="w-5 h-5" />
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="border-t p-4 bg-white">
                <div className="relative">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={placeholder}
                        rows={1}
                        className="w-full p-3 pr-24 bg-gray-100 text-gray-800 placeholder-gray-500 rounded-lg resize-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                        disabled={isLoading}
                    />
                    <div className="absolute right-14 top-1/2 -translate-y-1/2">
                        {modelSwitcherEnabled && (
                            <div className="relative" ref={popoverRef}>
                                <button
                                    onClick={() => setShowModelSelector(prev => !prev)}
                                    className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200 rounded-full transition-colors"
                                    aria-label="Switch chat model"
                                >
                                {switcherModel === 'gemini-flash-lite-latest' 
                                    ? <ZapIcon className="w-5 h-5" /> 
                                    : <BrainCircuitIcon className="w-5 h-5" />}
                                </button>
                                {showModelSelector && (
                                    <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 p-1 z-10">
                                        {modelOptions.map(option => (
                                            <button
                                                key={option.id}
                                                onClick={() => handleModelSwitch(option.id)}
                                                className={`w-full flex items-center gap-3 px-2 py-1.5 text-sm font-medium rounded-md text-left transition-colors ${
                                                    switcherModel === option.id
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                            >
                                                {React.cloneElement(option.icon, { className: 'w-5 h-5' })}
                                                <span>{option.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white disabled:bg-gray-300 hover:bg-blue-600 transition-colors"
                        aria-label="Send message"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transform rotate-90"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};