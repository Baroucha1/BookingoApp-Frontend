import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Camera, Upload, Loader2, ScanLine, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export type MrzResult = {
  firstName: string;
  lastName: string;
  birthDate: string; // YYYY-MM-DD
  nationality: string;
  passportNumber: string;
  passportExpiryDate: string; // YYYY-MM-DD
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (data: MrzResult) => void;
};

// ISO-3 -> French nationality mapping (subset of common cases). Falls back to the raw code.
const NATIONALITY_MAP: Record<string, string> = {
  DZA: 'Algérienne', FRA: 'Française', MAR: 'Marocaine', TUN: 'Tunisienne',
  USA: 'Américaine', GBR: 'Britannique', DEU: 'Allemande', ESP: 'Espagnole',
  ITA: 'Italienne', CAN: 'Canadienne', TUR: 'Turque', EGY: 'Égyptienne',
  SAU: 'Saoudienne', ARE: 'Émiratie', CHN: 'Chinoise', JPN: 'Japonaise',
  IND: 'Indienne', RUS: 'Russe', BRA: 'Brésilienne', MEX: 'Mexicaine',
  PRT: 'Portugaise', NLD: 'Néerlandaise', BEL: 'Belge', CHE: 'Suisse',
  SEN: 'Sénégalaise', NGA: 'Nigériane', ZAF: 'Sud-Africaine',
};

// Convert MRZ YYMMDD to ISO YYYY-MM-DD. Pivot at 30 — anything <=30 → 20xx, else 19xx.
function mrzDateToIso(yymmdd: string, isExpiry = false): string {
  if (!yymmdd || yymmdd.length !== 6 || !/^\d{6}$/.test(yymmdd)) return '';
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  const year = isExpiry ? 2000 + yy : (yy <= 30 ? 2000 + yy : 1900 + yy);
  return `${year}-${mm}-${dd}`;
}

// Try to locate the MRZ block (TD3=2x44, TD2=2x36, TD1=3x30) in OCR text. Tolerates noise.
function extractMrzLines(raw: string): string[] | null {
  const cleaned = raw
    .replace(/[«]/g, '<')
    .replace(/ /g, '')
    .toUpperCase()
    .split(/\r?\n/)
    .map(l => l.replace(/[^A-Z0-9<]/g, ''))
    .filter(l => l.length >= 25);

  const fit = (line: string, target: number) => {
    if (line.length === target) return line;
    if (line.length > target) {
      let best = line.slice(0, target);
      let bestScore = (best.match(/</g) || []).length;
      for (let s = 1; s <= line.length - target; s++) {
        const w = line.slice(s, s + target);
        const sc = (w.match(/</g) || []).length;
        if (sc > bestScore) { best = w; bestScore = sc; }
      }
      return best;
    }
    return line.padEnd(target, '<');
  };

  // TD3 (passport): 2 x 44
  for (let i = 0; i < cleaned.length - 1; i++) {
    const a = cleaned[i], b = cleaned[i + 1];
    if (a.length >= 38 && a.length <= 50 && b.length >= 38 && b.length <= 50) {
      const A = fit(a, 44), B = fit(b, 44);
      if (A.startsWith('P') || (A.match(/</g) || []).length >= 5) return [A, B];
    }
  }
  // TD2: 2 x 36
  for (let i = 0; i < cleaned.length - 1; i++) {
    const a = cleaned[i], b = cleaned[i + 1];
    if (a.length >= 32 && a.length <= 40 && b.length >= 32 && b.length <= 40) {
      return [fit(a, 36), fit(b, 36)];
    }
  }
  // TD1: 3 x 30
  for (let i = 0; i < cleaned.length - 2; i++) {
    const a = cleaned[i], b = cleaned[i + 1], c = cleaned[i + 2];
    if ([a, b, c].every(l => l.length >= 26 && l.length <= 34)) {
      return [fit(a, 30), fit(b, 30), fit(c, 30)];
    }
  }
  return null;
}

// Preprocess image for MRZ OCR: crop bottom band, upscale, grayscale, Otsu binarize.
async function preprocessForMrz(input: Blob, cropBottomRatio = 0.3): Promise<Blob> {
  const bitmap = await createImageBitmap(input);
  const srcW = bitmap.width, srcH = bitmap.height;
  const bandH = Math.max(1, Math.round(srcH * cropBottomRatio));
  const bandY = srcH - bandH;

  const targetW = Math.min(2200, Math.max(1400, srcW));
  const scale = targetW / srcW;
  const outW = Math.round(srcW * scale);
  const outH = Math.round(bandH * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW; canvas.height = outH;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, bandY, srcW, bandH, 0, 0, outW, outH);

  const img = ctx.getImageData(0, 0, outW, outH);
  const d = img.data;
  const hist = new Array(256).fill(0);
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0;
    d[i] = d[i + 1] = d[i + 2] = g;
    hist[g]++;
  }
  // Otsu threshold
  const total = outW * outH;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];
  let sumB = 0, wB = 0, varMax = 0, threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const v = wB * wF * (mB - mF) * (mB - mF);
    if (v > varMax) { varMax = v; threshold = t; }
  }
  const T = Math.max(80, threshold - 10);
  for (let i = 0; i < d.length; i += 4) {
    const v = d[i] < T ? 0 : 255;
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return await new Promise<Blob>(res => canvas.toBlob(b => res(b!), 'image/png'));
}

const PassportScanner = ({ open, onOpenChange, onResult }: Props) => {
  const { toast } = useToast();
  const [tab, setTab] = useState<'upload' | 'camera'>('upload');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera when dialog closes
  useEffect(() => {
    if (!open) {
      stopCamera();
      setScanning(false);
      setProgress(0);
      setError(null);
      setPreviewUrl(null);
    }
  }, [open]);

  // Auto-start camera when switching to camera tab
  useEffect(() => {
    if (open && tab === 'camera') startCamera();
    else stopCamera();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, open]);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e: any) {
      setError("Impossible d'accéder à la caméra. Veuillez autoriser l'accès ou utiliser l'option Importer.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const captureFromCamera = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (blob) processImage(blob);
    }, 'image/jpeg', 0.92);
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Veuillez fournir une image (JPG, PNG).');
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
    processImage(file);
  };

  const processImage = async (input: Blob | File) => {
    setScanning(true);
    setError(null);
    setProgress(2);
    try {
      const Tesseract = await import('tesseract.js');
      const { parse } = await import('mrz');

      // Try several crop bands so we work for tightly cropped MRZ shots AND full passport pages.
      const ratios = [0.3, 0.5, 0.22, 1.0];
      let lines: string[] | null = null;
      let lastText = '';

      for (let r = 0; r < ratios.length; r++) {
        const ratio = ratios[r];
        const baseProgress = (r / ratios.length) * 100;
        const processed = await preprocessForMrz(input, ratio);

        const result = await Tesseract.recognize(processed, 'eng', {
          // Restrict charset and treat input as a uniform block — much better for MRZ.
          tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<',
          preserve_interword_spaces: '1',
          tessedit_pageseg_mode: '6', // assume a single uniform block of text
          logger: (m: any) => {
            if (m.status === 'recognizing text' && typeof m.progress === 'number') {
              setProgress(Math.min(98, Math.round(baseProgress + (m.progress * 100) / ratios.length)));
            }
          },
        } as any);

        const text = result.data.text || '';
        lastText = text;
        lines = extractMrzLines(text);
        if (lines) break;
      }

      if (!lines) {
        // Detection failure — give actionable feedback (don't claim format invalid).
        throw new Error(
          "Aucune zone MRZ détectée. Assurez-vous que les 2 lignes du bas du passeport sont nettes, bien éclairées et entièrement visibles."
        );
      }

      const parsed = parse(lines);
      const fields: any = parsed.fields || {};
      const hasValidChecksums = parsed.valid;

      const data: MrzResult = {
        firstName: (fields.firstName || '').replace(/\s+/g, ' ').trim(),
        lastName: (fields.lastName || '').replace(/\s+/g, ' ').trim(),
        birthDate: mrzDateToIso(fields.birthDate || '', false),
        nationality: NATIONALITY_MAP[fields.nationality] || fields.nationality || '',
        passportNumber: (fields.documentNumber || '').replace(/</g, '').trim(),
        passportExpiryDate: mrzDateToIso(fields.expirationDate || '', true),
      };

      if (!data.firstName && !data.lastName && !data.passportNumber) {
        throw new Error('Format MRZ invalide après lecture. Réessayez avec une meilleure netteté ou saisissez manuellement.');
      }

      onResult(data);
      toast({
        title: hasValidChecksums ? 'Passeport scanné ✅' : 'Données extraites ⚠️',
        description: hasValidChecksums
          ? 'Champs remplis automatiquement. Vérifiez avant de continuer.'
          : "Certains contrôles MRZ ont échoué. Vérifiez les valeurs surlignées.",
      });
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || 'Échec du scan. Réessayez ou saisissez manuellement.');
    } finally {
      setScanning(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-primary" />
            Scanner le passeport
          </DialogTitle>
          <DialogDescription>
            Cadrez les 2 lignes MRZ en bas du passeport. Les données sont extraites localement, aucune image n'est envoyée.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => setTab(v as 'upload' | 'camera')}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" /> Importer</TabsTrigger>
            <TabsTrigger value="camera"><Camera className="w-4 h-4 mr-2" /> Caméra</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3 pt-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors disabled:opacity-50"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Aperçu" className="max-h-48 mx-auto rounded-lg" />
              ) : (
                <>
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Cliquez pour importer une photo de passeport</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG ou PNG — page avec MRZ visible</p>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
                e.target.value = '';
              }}
            />
          </TabsContent>

          <TabsContent value="camera" className="space-y-3 pt-3">
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
              {/* MRZ guide overlay */}
              <div className="absolute inset-x-6 bottom-6 h-16 border-2 border-primary/80 rounded-md pointer-events-none flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-widest text-primary bg-background/80 px-2 py-0.5 rounded">
                  Alignez la zone MRZ ici
                </span>
              </div>
            </div>
            <Button onClick={captureFromCamera} disabled={scanning} className="w-full">
              <Camera className="w-4 h-4 mr-2" />
              Capturer & scanner
            </Button>
          </TabsContent>
        </Tabs>

        {scanning && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Analyse OCR en cours… {progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Échec du scan</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription className="text-xs">
            L'OCR s'exécute dans votre navigateur. Aucune image de passeport n'est stockée ou transmise.
          </AlertDescription>
        </Alert>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default PassportScanner;
