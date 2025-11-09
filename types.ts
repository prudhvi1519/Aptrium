import { ReactElement } from 'react';

export enum Feature {
  Chat = 'Chat',
  SearchGrounding = 'SearchGrounding',
  MapsGrounding = 'MapsGrounding',
  ImageUnderstanding = 'ImageUnderstanding',
  VideoUnderstanding = 'VideoUnderstanding',
  ImageGeneration = 'ImageGeneration',
  ImageEditing = 'ImageEditing',
  VideoGeneration = 'VideoGeneration',
  TTS = 'TTS',
  LiveConversation = 'LiveConversation',
}

export interface FeatureConfig {
  id: Feature;
  name: string;
  description: string;
  icon: ReactElement;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: GroundingSource[];
}