import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, Star, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ImageType = 'FLAG' | 'HERO' | 'GALLERY';
interface CountryImage { id: string; url: string; type: ImageType; isMain: boolean; }
interface CountryRow { id: string; code: string; name_fr: string; main_photo_url: string | null; gallery: unknown; }

interface FlatImage extends CountryImage {
  countryId: string;
  countryName: string;
  countryCode: string;
  sortOrder: number;
}

const TYPE_COLOR: Record<ImageType, string> = {
  FLAG: 'bg-blue-100 text-blue-800 border-blue-300',
  HERO: 'bg-purple-100 text-purple-800 border-purple-300',
  GALLERY: 'bg-muted text-muted-foreground border-border',
};

const parseImages = (raw: unknown, mainPhotoUrl: string | null): CountryImage[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((it, i): CountryImage | null => {
    if (typeof it === 'string') {
      return { id: `legacy-${i}`, url: it, type: 'GALLERY', isMain: !!mainPhotoUrl && it === mainPhotoUrl };
    }
    if (it && typeof it === 'object' && 'url' in it && typeof (it as { url: unknown }).url === 'string') {
      const obj = it as Record<string, unknown>;
      const type = (obj.type === 'FLAG' || obj.type === 'HERO' || obj.type === 'GALLERY') ? obj.type : 'GALLERY';
      return {
        id: typeof obj.id === 'string' ? obj.id : `img-${i}`,
        url: obj.url as string,
        type,
        isMain: !!obj.isMain,
      };
    }
    return null;
  }).filter((x): x is CountryImage => x !== null);
};

const ImagesAdmin = () => {
  const [countries, setCountries] = useState<CountryRow[]>([]);
  const [byCountry, setByCountry] = useState<Record<string, CountryImage[]>>({});
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  const load = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries?fields=id,code,name_fr,main_photo_url,gallery`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!Array.isArray(data)) return;
    setCountries(data);
    const map: Record<string, CountryImage[]> = {};
    data.forEach((c: CountryRow) => { map[c.id] = parseImages(c.gallery, c.main_photo_url); });
    setByCountry(map);
  };

  const flat: FlatImage[] = useMemo(() => {
    const rows: FlatImage[] = [];
    countries.forEach(c => {
      (byCountry[c.id] ?? []).forEach((img, i) => {
        rows.push({ ...img, countryId: c.id, countryName: c.name_fr, countryCode: c.code, sortOrder: i });
      });
    });
    return rows.filter(r => (countryFilter === 'all' || r.countryId === countryFilter) && (typeFilter === 'all' || r.type === typeFilter));
  }, [countries, byCountry, countryFilter, typeFilter]);

  const persist = async (countryId: string, images: CountryImage[]) => {
    const token = localStorage.getItem('token');
    const main = images.find(i => i.isMain);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/${countryId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ gallery: images, main_photo_url: main?.url ?? null }),
    });
    if (!res.ok) {
      const err = await res.json();
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      return false;
    }
    return true;
  };

  const setMain = async (countryId: string, imageId: string) => {
    const next = (byCountry[countryId] ?? []).map(i => ({ ...i, isMain: i.id === imageId }));
    setByCountry(b => ({ ...b, [countryId]: next }));
    if (await persist(countryId, next)) toast({ title: 'Image principale définie' });
  };

  const reorder = async (countryId: string, imageId: string, dir: -1 | 1) => {
    const arr = [...(byCountry[countryId] ?? [])];
    const idx = arr.findIndex(i => i.id === imageId);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setByCountry(b => ({ ...b, [countryId]: arr }));
    if (await persist(countryId, arr)) toast({ title: 'Ordre mis à jour' });
  };

  const totalsByType = useMemo(() => {
    const t: Record<ImageType, number> = { FLAG: 0, HERO: 0, GALLERY: 0 };
    Object.values(byCountry).flat().forEach(i => { t[i.type]++; });
    return t;
  }, [byCountry]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Images</h1>
          <p className="text-sm text-muted-foreground mt-1">Vue centralisée des photos par pays</p>
        </div>
        <div className="flex gap-2">
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Pays" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous pays</SelectItem>
              {countries.map(c => <SelectItem key={c.id} value={c.id}>{c.name_fr}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="FLAG">Drapeau</SelectItem>
              <SelectItem value="HERO">Bannière</SelectItem>
              <SelectItem value="GALLERY">Galerie</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['FLAG', 'HERO', 'GALLERY'] as ImageType[]).map(t => (
          <Card key={t}><CardContent className="p-4"><p className="text-xs text-muted-foreground uppercase">{t}</p><p className="text-2xl font-bold mt-1">{totalsByType[t]}</p></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">ID</TableHead>
                <TableHead className="w-20">Aperçu</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead className="w-24 text-center">Principale</TableHead>
                <TableHead className="w-20">Ordre</TableHead>
                <TableHead className="text-end w-32">Réordonner</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flat.map(img => (
                <TableRow key={`${img.countryId}-${img.id}`}>
                  <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-16">{img.id.slice(0, 8)}</TableCell>
                  <TableCell>
                    <div className="w-14 h-10 rounded bg-muted overflow-hidden border">
                      {img.url ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 m-auto text-muted-foreground" />}
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={TYPE_COLOR[img.type]}>{img.type}</Badge></TableCell>
                  <TableCell><span className="text-sm">{img.countryName}</span></TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Switch checked={img.isMain} onCheckedChange={() => setMain(img.countryId, img.id)} />
                      {img.isMain && <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{img.sortOrder + 1}</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="icon" onClick={() => reorder(img.countryId, img.id, -1)}><ArrowUp className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => reorder(img.countryId, img.id, 1)}><ArrowDown className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {flat.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Aucune image</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImagesAdmin;
