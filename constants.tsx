import React from 'react';
import { Feature, FeatureConfig } from './types';
import {
    BrainCircuitIcon,
    ImageIcon,
    MapPinIcon,
    MessageSquareIcon,
    MicIcon,
    SearchIcon,
    SlidersIcon,
    VideoIcon,
    Volume2Icon,
    WandIcon,
    ZapIcon,
} from './components/icons';

export const FEATURES: FeatureConfig[] = [
    {
        id: Feature.Chat,
        name: 'Chat',
        description: 'Engage in a conversation with a versatile AI. Switch between Lite and Pro models.',
        icon: <MessageSquareIcon className="w-5 h-5" />,
    },
    {
        id: Feature.SearchGrounding,
        name: 'Web Search Chat',
        description: 'Get up-to-date answers grounded in Google Search.',
        icon: <SearchIcon className="w-5 h-5" />,
    },
    {
        id: Feature.MapsGrounding,
        name: 'Maps Chat',
        description: 'Ask location-based questions with Maps integration.',
        icon: <MapPinIcon className="w-5 h-5" />,
    },
    {
        id: Feature.ImageUnderstanding,
        name: 'Analyze Image',
        description: 'Upload an image to understand its content.',
        icon: <ImageIcon className="w-5 h-5" />,
    },
    {
        id: Feature.VideoUnderstanding,
        name: 'Extract key information and insights from videos.',
        description: 'Extract key information and insights from videos.',
        icon: <VideoIcon className="w-5 h-5" />,
    },
    {
        id: Feature.ImageGeneration,
        name: 'Generate Image',
        description: 'Create stunning images from text prompts.',
        icon: <WandIcon className="w-5 h-5" />,
    },
    {
        id: Feature.ImageEditing,
        name: 'Edit Image',
        description: 'Modify images with simple text instructions.',
        icon: <SlidersIcon className="w-5 h-5" />,
    },
    {
        id: Feature.VideoGeneration,
        name: 'Generate Video',
        description: 'Bring your ideas to life with AI-powered video.',
        icon: <VideoIcon className="w-5 h-5" />,
    },
    {
        id: Feature.TTS,
        name: 'Text to Speech',
        description: 'Convert text into natural-sounding speech.',
        icon: <Volume2Icon className="w-5 h-5" />,
    },
    {
        id: Feature.LiveConversation,
        name: 'Live Conversation',
        description: 'Have a real-time voice conversation with Gemini.',
        icon: <MicIcon className="w-5 h-5" />,
    },
];