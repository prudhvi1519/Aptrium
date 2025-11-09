import React, { useState } from 'react';
import { Feature } from './types';
import { FEATURES } from './constants';
import { ChatView } from './components/ChatView';
import { ImageGenView } from './components/ImageGenView';
import { ImageEditView } from './components/ImageEditView';
import { VideoGenView } from './components/VideoGenView';
import { MediaAnalysisView } from './components/MediaAnalysisView';
import { TTSView } from './components/TTSView';
import { LiveConversationView } from './components/LiveConversationView';
import { AptriumLogo } from './components/Logo';


const Header = ({ onMenuClick }: { onMenuClick: () => void }) => (
    <header className="md:hidden flex items-center justify-between p-4 bg-white border-b h-16">
        <AptriumLogo className="h-7" />
        <button onClick={onMenuClick} className="p-2 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
        </button>
    </header>
);

const Sidebar = ({ currentFeature, onFeatureSelect, isOpen, onClose }: { currentFeature: Feature, onFeatureSelect: (feature: Feature) => void, isOpen: boolean, onClose: () => void }) => (
    <>
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
        <aside className={`fixed top-0 left-0 h-full w-64 bg-white border-r transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-64 flex-shrink-0 transition-transform z-40`}>
            <div className="flex items-center justify-between p-4 border-b h-16">
                <AptriumLogo className="h-7" />
                 <button onClick={onClose} className="md:hidden p-2 text-gray-600">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <nav className="p-4 space-y-1">
                {FEATURES.map((feature) => (
                    <button
                        key={feature.id}
                        onClick={() => onFeatureSelect(feature.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            currentFeature === feature.id
                                ? 'bg-blue-50 text-blue-600'
                                : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                        {feature.icon}
                        <span>{feature.name}</span>
                    </button>
                ))}
            </nav>
        </aside>
    </>
);


function App() {
    const [currentFeature, setCurrentFeature] = useState<Feature>(Feature.Chat);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleFeatureSelect = (feature: Feature) => {
        setCurrentFeature(feature);
        setIsSidebarOpen(false); // Close sidebar on selection
    };

    const renderFeature = () => {
        switch (currentFeature) {
            case Feature.Chat:
                return <ChatView placeholder="Ask me anything..." modelSwitcherEnabled={true} />;
            case Feature.SearchGrounding:
                 return <ChatView model="gemini-2.5-flash" tools={['googleSearch']} placeholder="Ask about recent events or topics..." initialMessage="Ask me anything, and I'll use Google Search to find the most current information for you." />;
            case Feature.MapsGrounding:
                return <ChatView model="gemini-2.5-flash" tools={['googleMaps']} placeholder="Find places, get directions..." initialMessage="Looking for a place? Ask me about restaurants, landmarks, or anything location-based. Please allow location access for best results." />;
            case Feature.ImageGeneration:
                return <ImageGenView />;
            case Feature.ImageEditing:
                return <ImageEditView />;
            case Feature.VideoGeneration:
                return <VideoGenView />;
            case Feature.ImageUnderstanding:
                return <MediaAnalysisView type="image" />;
            case Feature.VideoUnderstanding:
                return <MediaAnalysisView type="video" />;
            case Feature.TTS:
                return <TTSView />;
            case Feature.LiveConversation:
                return <LiveConversationView />;
            default:
                return <div>Select a feature</div>;
        }
    };

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col md:flex-row">
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <Sidebar 
                currentFeature={currentFeature} 
                onFeatureSelect={handleFeatureSelect}
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />
            <main className="flex-1 overflow-hidden p-4 md:p-6 bg-gray-100">
                <div className="h-full w-full bg-white rounded-lg shadow-md overflow-auto">
                    {renderFeature()}
                </div>
            </main>
        </div>
    );
}

export default App;