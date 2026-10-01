import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { ChevronDown, Keyboard as KeyboardIcon } from 'lucide-react';

export default function KeyboardManager() {
    const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
    const [bottomOffset, setBottomOffset] = useState(12);

    useEffect(() => {
        // 1. Enable iOS native accessory bar (displays the native "Done" / "Terminé" button on iOS keyboard)
        if (Capacitor.isNativePlatform()) {
            try {
                Keyboard.setAccessoryBarVisible({ isVisible: true }).catch(() => {});
                Keyboard.setScroll({ isDisabled: false }).catch(() => {});
            } catch (e) {
                // Ignore if not supported
            }
        }

        // Helper to gently ensure the active input is visible above the keyboard without jumping to the top
        const scrollToActiveElement = () => {
            const el = document.activeElement as HTMLElement | null;
            if (!el) return;
            const isField =
                el.tagName === 'INPUT' ||
                el.tagName === 'TEXTAREA' ||
                el.tagName === 'SELECT' ||
                el.isContentEditable;

            if (!isField) return;

            // Check if element is already comfortably visible
            const rect = el.getBoundingClientRect();
            const visibleHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;

            // If the element is already completely in view, do nothing (prevents unwanted jumps)
            if (rect.top >= 60 && rect.bottom <= visibleHeight - 20) {
                return;
            }

            // Only scroll if actually occluded by the keyboard or top bar
            try {
                el.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest',
                });
            } catch {
                el.scrollIntoView();
            }
        };

        // 2. Listen for focus events across all inputs/textareas
        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement | null;
            if (!target) return;
            const isField =
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable;

            if (isField) {
                setIsKeyboardOpen(true);
                // Wait for the keyboard animation to finish before checking visibility
                setTimeout(scrollToActiveElement, 250);
            }
        };

        const handleFocusOut = () => {
            // Small delay to check if another input immediately took focus
            setTimeout(() => {
                const el = document.activeElement as HTMLElement | null;
                const isField =
                    el &&
                    (el.tagName === 'INPUT' ||
                        el.tagName === 'TEXTAREA' ||
                        el.tagName === 'SELECT' ||
                        el.isContentEditable);
                if (!isField) {
                    setIsKeyboardOpen(false);
                }
            }, 100);
        };

        document.addEventListener('focusin', handleFocusIn, true);
        document.addEventListener('focusout', handleFocusOut, true);

        // 3. Native Capacitor Keyboard listeners
        const handles: { remove: () => void }[] = [];
        if (Capacitor.isNativePlatform()) {
            Keyboard.addListener('keyboardWillShow', (info) => {
                setIsKeyboardOpen(true);
                if (info?.keyboardHeight) {
                    setBottomOffset(Math.max(12, info.keyboardHeight + 10));
                }
            }).then((h) => handles.push(h)).catch(() => {});

            Keyboard.addListener('keyboardDidShow', (info) => {
                setIsKeyboardOpen(true);
                if (info?.keyboardHeight) {
                    setBottomOffset(Math.max(12, info.keyboardHeight + 10));
                }
                scrollToActiveElement();
            }).then((h) => handles.push(h)).catch(() => {});

            Keyboard.addListener('keyboardWillHide', () => {
                setIsKeyboardOpen(false);
                setBottomOffset(12);
            }).then((h) => handles.push(h)).catch(() => {});

            Keyboard.addListener('keyboardDidHide', () => {
                setIsKeyboardOpen(false);
                setBottomOffset(12);
            }).then((h) => handles.push(h)).catch(() => {});
        }

        // 4. Visual Viewport handling for Android / Mobile Web (resize only, never scroll)
        const handleVisualViewportChange = () => {
            if (!window.visualViewport) return;
            const diff = window.innerHeight - window.visualViewport.height;
            if (diff > 150) {
                setIsKeyboardOpen(true);
                setBottomOffset(Math.max(12, diff + 10));
                scrollToActiveElement();
            } else {
                setIsKeyboardOpen(false);
                setBottomOffset(12);
            }
        };

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleVisualViewportChange);
        }

        return () => {
            document.removeEventListener('focusin', handleFocusIn, true);
            document.removeEventListener('focusout', handleFocusOut, true);
            handles.forEach((h) => h.remove());
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
            }
        };
    }, []);

    const dismissKeyboard = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                await Keyboard.hide();
            } catch {}
        }
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
        setIsKeyboardOpen(false);
    };

    if (!isKeyboardOpen) return null;

    return (
        <div
            className="fixed right-3 z-[99999] pointer-events-auto flex items-center transition-all duration-150 ease-out"
            style={{
                bottom: Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios'
                    ? 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)'
                    : `${bottomOffset}px`,
            }}
        >
            <button
                type="button"
                onClick={dismissKeyboard}
                aria-label="Fermer le clavier"
                className="bg-[#0454E8]/95 hover:bg-[#0454E8] text-white px-3.5 py-1.5 rounded-full shadow-2xl flex items-center gap-1.5 text-xs font-bold border border-white/20 active:scale-95 transition-all cursor-pointer backdrop-blur-md"
            >
                <KeyboardIcon className="w-3.5 h-3.5" />
                <span>Fermer</span>
                <ChevronDown className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
