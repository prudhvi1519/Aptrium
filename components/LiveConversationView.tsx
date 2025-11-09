import React, { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, LiveSession } from '@google/genai';
import { FeaturePlaceholder } from './common/FeaturePlaceholder';
import { MicIcon } from './icons';

// Audio helper functions
const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length;
    const buffer = ctx.createBuffer(1, frameCount, 24000);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
    }
    return buffer;
};

export const LiveConversationView = () => {
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, connecting, active, error
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [history, setHistory] = useState<{user: string, model: string}[]>([]);
    
    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const tempUserTranscript = useRef('');
    const tempModelTranscript = useRef('');

    const stopConversation = useCallback(() => {
        setIsActive(false);
        setStatus('idle');
        
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }

        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }

        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close();
            inputAudioContextRef.current = null;
        }

        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        
        audioSourcesRef.current.forEach(source => source.stop());
        audioSourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    const startConversation = useCallback(async () => {
        if (isActive) return;
        setIsActive(true);
        setStatus('connecting');
        setHistory([]);
        setUserTranscript('');
        setModelTranscript('');
        tempUserTranscript.current = '';
        tempModelTranscript.current = '';

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setStatus('active');
                        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
                        mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(streamRef.current);
                        scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const l = inputData.length;
                            const int16 = new Int16Array(l);
                            for (let i = 0; i < l; i++) {
                                int16[i] = inputData[i] * 32768;
                            }
                            const pcmBlob: Blob = {
                                data: encode(new Uint8Array(int16.buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            if(sessionPromiseRef.current){
                                sessionPromiseRef.current.then((session) => {
                                    session.sendRealtimeInput({ media: pcmBlob });
                                });
                            }
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            tempUserTranscript.current += message.serverContent.inputTranscription.text;
                            setUserTranscript(tempUserTranscript.current);
                        }
                        if (message.serverContent?.outputTranscription) {
                            tempModelTranscript.current += message.serverContent.outputTranscription.text;
                            setModelTranscript(tempModelTranscript.current);
                        }

                        if (message.serverContent?.turnComplete) {
                            setHistory(prev => [...prev, { user: tempUserTranscript.current, model: tempModelTranscript.current }]);
                            tempUserTranscript.current = '';
                            tempModelTranscript.current = '';
                            setUserTranscript('');
                            setModelTranscript('');
                        }

                        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64Audio && outputAudioContextRef.current) {
                            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current);
                            const source = outputAudioContextRef.current.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputAudioContextRef.current.destination);
                            source.addEventListener('ended', () => {
                                audioSourcesRef.current.delete(source);
                            });
                            source.start(nextStartTimeRef.current);
                            nextStartTimeRef.current += audioBuffer.duration;
                            audioSourcesRef.current.add(source);
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setStatus('error');
                        stopConversation();
                    },
                    onclose: () => {
                        stopConversation();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
                    },
                },
            });

        } catch (e) {
            console.error('Failed to start conversation:', e);
            setStatus('error');
            stopConversation();
        }
    }, [isActive, stopConversation]);
    
    useEffect(() => {
        return () => {
            stopConversation();
        };
    }, [stopConversation]);

    const getStatusText = () => {
        switch (status) {
            case 'connecting': return 'Connecting...';
            case 'active': return 'Listening... Speak now.';
            case 'error': return 'An error occurred. Please try again.';
            default: return 'Start a conversation with Gemini.';
        }
    }

    return (
        <div className="p-4 sm:p-6 md:p-8 h-full flex flex-col items-center justify-between">
            {!isActive && status !== 'error' && (
                <FeaturePlaceholder
                    icon={<MicIcon />}
                    name="Live Conversation"
                    description="Press the button below and start speaking to have a real-time voice conversation with Gemini."
                />
            )}
            
            {(isActive || status === 'error') && (
                <div className="w-full flex-1 overflow-y-auto space-y-4 pr-2">
                    {history.map((turn, index) => (
                        <div key={index}>
                            <p className="font-semibold text-blue-600">You:</p>
                            <p className="mb-2 text-gray-700">{turn.user}</p>
                            <p className="font-semibold text-purple-600">Aptrium:</p>
                            <p className="text-gray-700">{turn.model}</p>
                        </div>
                    ))}
                    {userTranscript && (
                        <div>
                            <p className="font-semibold text-blue-600">You:</p>
                            <p className="text-gray-700">{userTranscript}</p>
                        </div>
                    )}
                    {modelTranscript && (
                        <div>
                            <p className="font-semibold text-purple-600">Aptrium:</p>
                            <p className="text-gray-700">{modelTranscript}</p>
                        </div>
                    )}
                </div>
            )}
            
            <div className="flex flex-col items-center mt-8">
                <button
                    onClick={isActive ? stopConversation : startConversation}
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-300 ${isActive ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}
                >
                    <MicIcon className="w-8 h-8"/>
                </button>
                <p className="mt-4 text-gray-600">{getStatusText()}</p>
            </div>
        </div>
    );
};
