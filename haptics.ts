import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Triggers a very light click feedback — ideal for tab navigation, checkboxes, and buttons.
 */
export async function hapticSelection(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
    } catch {
      // Fallback or ignore
    }
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(10);
    } catch {}
  }
}

/**
 * Physical impact feedback (Light, Medium, Heavy)
 */
export async function hapticImpact(style: ImpactStyle = ImpactStyle.Light): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.impact({ style });
    } catch {}
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(style === ImpactStyle.Heavy ? 35 : style === ImpactStyle.Medium ? 20 : 12);
    } catch {}
  }
}

/**
 * Success celebratory feedback (e.g. payment confirmed, booking successful)
 */
export async function hapticSuccess(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch {}
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([15, 60, 25]);
    } catch {}
  }
}

/**
 * Error / Warning feedback (e.g. invalid form field, flight expired)
 */
export async function hapticError(): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch {}
  } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([30, 40, 30]);
    } catch {}
  }
}
