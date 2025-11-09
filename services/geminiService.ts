import { GoogleGenAI, GenerateContentResponse, Type, Modality, Chat, LiveSession } from "@google/genai";
import { ChatMessage, GroundingSource } from "../types";

const getApiKey = () => {
    const key = process.env.API_KEY;
    if (!key) {
        throw new Error("API_KEY environment variable not set.");
    }
    return key;
};

// We create a new instance for each call to ensure the latest API key is used,
// especially important for Veo which has a key selection dialog.
const getGenAIClient = () => new GoogleGenAI({ apiKey: getApiKey() });


export const fileToGenerativePart = async (file: File) => {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
    };
};

// Generic chat function
export const generateChatResponse = async (
    history: ChatMessage[],
    newMessage: string,
    // FIX: Updated model name 'gemini-2.5-flash-lite' to 'gemini-flash-lite-latest' to align with API guidelines.
    model: 'gemini-2.5-flash' | 'gemini-flash-lite-latest' | 'gemini-2.5-pro',
    tools: ('googleSearch' | 'googleMaps')[] = [],
    getGeolocation: () => Promise<{latitude: number; longitude: number} | null>
): Promise<GenerateContentResponse> => {
    const ai = getGenAIClient();
    const formattedHistory = history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
    }));

    const config: any = {};
    if (tools.length > 0) {
        config.tools = tools.map(tool => ({ [tool]: {} }));
    }

    if (tools.includes('googleMaps')) {
        const coords = await getGeolocation();
        if (coords) {
            config.toolConfig = {
                retrievalConfig: { latLng: coords }
            };
        }
    }

    if (model === 'gemini-2.5-pro') {
        config.thinkingConfig = { thinkingBudget: 32768 };
    }
    
    const chat: Chat = ai.chats.create({
        model: model,
        history: formattedHistory,
        config,
    });
    
    return await chat.sendMessage({ message: newMessage });
};

// Image Generation
export const generateImage = async (prompt: string, aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '3:4'): Promise<string> => {
    const ai = getGenAIClient();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio,
        },
    });
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

// Image Editing
export const editImage = async (prompt: string, image: File): Promise<string> => {
    const ai = getGenAIClient();
    const imagePart = await fileToGenerativePart(image);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [imagePart, { text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated in response.");
};


// Media Analysis
export const analyzeMedia = async (prompt: string, file: File, model: 'gemini-2.5-flash' | 'gemini-2.5-pro'): Promise<string> => {
    const ai = getGenAIClient();
    const mediaPart = await fileToGenerativePart(file);
    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [mediaPart, { text: prompt }],
        }
    });
    return response.text;
};

// Video Generation
export const generateVideo = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16',
    image?: File
): Promise<string> => {
    const ai = getGenAIClient();
    
    let operation;
    
    const config = {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio,
    };

    let payload: any = {
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config,
    };
    
    if (image) {
        const imagePart = await fileToGenerativePart(image);
        payload.image = {
            imageBytes: imagePart.inlineData.data,
            mimeType: imagePart.inlineData.mimeType,
        };
    }
    
    operation = await ai.models.generateVideos(payload);

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.response?.generatedVideos?.[0]?.video?.uri) {
        const downloadLink = operation.response.generatedVideos[0].video.uri;
        const response = await fetch(`${downloadLink}&key=${getApiKey()}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

    throw new Error('Video generation failed or returned no URI.');
};

// Text to Speech
export const generateSpeech = async (text: string): Promise<AudioBuffer> => {
    const ai = getGenAIClient();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("No audio data received from TTS API.");
    }
    
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    const decode = (base64: string) => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    };
    
    const decodeAudioData = async (
        data: Uint8Array,
        ctx: AudioContext,
        sampleRate: number,
        numChannels: number,
    ): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
            }
        }
        return buffer;
    };

    return await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
};