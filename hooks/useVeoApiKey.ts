import { useState, useCallback, useEffect } from 'react';

// FIX: Inlined the type for `window.aistudio` to resolve a global type
// declaration conflict. This ensures a single, consistent type definition
// for the `aistudio` object on the window.
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

export const useVeoApiKey = () => {
    const [isKeyReady, setIsKeyReady] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    const checkAndSetKey = useCallback(async () => {
        setIsChecking(true);
        if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
            const hasKey = await window.aistudio.hasSelectedApiKey();
            setIsKeyReady(hasKey);
        } else {
            // If the aistudio object isn't available, assume we can proceed
            // This allows development outside the specific runtime environment
            setIsKeyReady(true);
        }
        setIsChecking(false);
    }, []);

    useEffect(() => {
        checkAndSetKey();
    }, [checkAndSetKey]);

    const selectKey = useCallback(async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success after dialog opens to avoid race conditions
            setIsKeyReady(true); 
        } else {
            alert('API key selection is not available in this environment.');
        }
    }, []);
    
    const handleApiError = useCallback(() => {
        // If an API call fails with a "not found" error, reset the key state.
        setIsKeyReady(false);
        alert("Video generation failed. Your API key might be invalid. Please select a valid API key.");
    }, []);

    return { isKeyReady, isChecking, selectKey, checkAndSetKey, handleApiError };
};