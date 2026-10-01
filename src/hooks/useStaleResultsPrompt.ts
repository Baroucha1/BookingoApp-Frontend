// src/hooks/useStaleResultsPrompt.ts
import { useEffect, useRef, useState, useCallback } from 'react';

const STALE_AFTER_MS = 4 * 60 * 1000;

interface UseStaleResultsPromptArgs {
    active: boolean;
    onRefresh: () => Promise<void>;
}

export function useStaleResultsPrompt({ onRefresh, active }: UseStaleResultsPromptArgs) {
    const [showPrompt, setShowPrompt] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout>>();


    const resetTimer = useCallback(() => {
        clearTimeout(timerRef.current);
        setShowPrompt(false);
        if (!active) return;
        //console.log('[staleResultsPrompt] arming timer, active =', active);
        timerRef.current = setTimeout(() => {
            //console.log('[staleResultsPrompt] FIRING — setting showPrompt(true)');
            setShowPrompt(true);
        }, STALE_AFTER_MS);
    }, [active]);

    useEffect(() => {
        resetTimer();
        return () => clearTimeout(timerRef.current);
    }, [resetTimer]);

    const dismissWithRefresh = useCallback(async () => {
        setShowPrompt(false);
        clearTimeout(timerRef.current);
        await onRefresh();   // ← this is the line that must exist for onRefresh to be "used"
        resetTimer();
    }, [onRefresh, resetTimer]);

    const dismissWithNewSearch = useCallback((goToSearchForm: () => void) => {
        clearTimeout(timerRef.current);
        setShowPrompt(false);
        goToSearchForm();
    }, []);

    return { showPrompt, resetTimer, dismissWithRefresh, dismissWithNewSearch };
}