import { createRoot } from "react-dom/client";
import { setupNativeHttpPatch } from "./lib/nativeHttpPatch";
import App from "./App.tsx";
import "./index.css";

// Bypass WebView CORS on Android/iOS and forward native origin capacitor://localboat
setupNativeHttpPatch();

// Lock orientation to portrait when supported by browser / webview
if (typeof window !== 'undefined' && 'screen' in window && 'orientation' in window.screen) {
  try {
    (window.screen.orientation as any)?.lock?.('portrait')?.catch(() => {});
  } catch (e) {
    // Ignore unsupported
  }
}

createRoot(document.getElementById("root")!).render(<App />);

