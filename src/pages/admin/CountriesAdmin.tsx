import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Pencil, Trash2, Upload, Loader2, Star, ArrowUp, ArrowDown, ImageIcon, Ticket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ─── Types (aligned with Prisma schema) ──────────────────────────────────────

type ImageType = 'FLAG' | 'HERO' | 'GALLERY' | 'THUMBNAIL';

interface CountryImage {
  id: string;
  url: string;
  imageType: ImageType;
  isMain: boolean;
  sortOrder: number;
}

interface RelatedVisaType {
  id: string;
  nameFr: string;
  nameEn: string;
  price: number;
  currency: string;
  duration: number;
  processingDelay: number;
  isActive: boolean;
}

export interface Country {
  id: string;
  code: string;
  nameFr: string; nameEn: string; nameAr: string;
  descriptionFr: string | null; descriptionEn: string | null; descriptionAr: string | null;
  pointFortsFr: string | null; pointFortsEn: string | null; pointFortsAr: string | null;
  lieuxAVisiterFr: string | null; lieuxAVisiterEn: string | null; lieuxAVisiterAr: string | null;
  conseilsVoyageFr: string | null; conseilsVoyageEn: string | null; conseilsVoyageAr: string | null;
  isActive: boolean;
  images: CountryImage[];
}

// ─── Form state ───────────────────────────────────────────────────────────────

const empty = {
  code: '',
  nameFr: '', nameEn: '', nameAr: '',
  descriptionFr: '', descriptionEn: '', descriptionAr: '',
  pointFortsFr: '', pointFortsEn: '', pointFortsAr: '',
  lieuxAVisiterFr: '', lieuxAVisiterEn: '', lieuxAVisiterAr: '',
  conseilsVoyageFr: '', conseilsVoyageEn: '', conseilsVoyageAr: '',
  isActive: true,
  images: [] as CountryImage[],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<ImageType, string> = {
  FLAG: 'Drapeau', HERO: 'Bannière', GALLERY: 'Galerie', THUMBNAIL: 'Miniature',
};
const TYPE_COLOR: Record<ImageType, string> = {
  FLAG: 'bg-blue-100 text-blue-800 border-blue-300',
  HERO: 'bg-purple-100 text-purple-800 border-purple-300',
  GALLERY: 'bg-muted text-muted-foreground border-border',
  THUMBNAIL: 'bg-orange-100 text-orange-800 border-orange-300',
};

const ensureSingleMain = (imgs: CountryImage[]): CountryImage[] => {
  const hasMain = imgs.some(i => i.isMain);
  if (!hasMain && imgs.length > 0) {
    const heroIdx = imgs.findIndex(i => i.imageType === 'HERO');
    const idx = heroIdx >= 0 ? heroIdx : 0;
    return imgs.map((i, k) => ({ ...i, isMain: k === idx }));
  }
  return imgs;
};

// ─── Component ────────────────────────────────────────────────────────────────

const CountriesAdmin = () => {
  const [countries, setCountries] = useState<Country[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingType, setPendingType] = useState<ImageType>('GALLERY');
  const [urlInput, setUrlInput] = useState('');
  const [relatedVisas, setRelatedVisas] = useState<RelatedVisaType[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const load = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (Array.isArray(data)) setCountries(data);
  };

  useEffect(() => { load(); }, []);

  // ─── Image helpers ──────────────────────────────────────────────────────────

  const uploadFile = async (file: File): Promise<string | null> => {
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/upload`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
    });
    if (!res.ok) { toast({ title: 'Erreur upload', variant: 'destructive' }); return null; }
    return (await res.json()).url;
  };

  const addImageFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length) return;
    setUploading(true);
    const token = localStorage.getItem('token');
    for (const f of files) {
      const url = await uploadFile(f);
      if (!url) continue;
      if (editId) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/${editId}/images`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, imageType: pendingType, isMain: false, sortOrder: form.images.length }),
        });
        const img = await res.json();
        setForm(f => ({ ...f, images: ensureSingleMain([...f.images, img]) }));
      } else {
        setForm(f => ({ ...f, images: ensureSingleMain([...f.images, { id: crypto.randomUUID(), url, imageType: pendingType, isMain: false, sortOrder: 0 }]) }));
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const addImageFromUrl = async () => {
    const url = urlInput.trim(); if (!url) return;
    if (editId) {
      // live — hit API directly
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/${editId}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, imageType: pendingType, isMain: false, sortOrder: form.images.length }),
      });
      const img = await res.json();
      setForm(f => ({ ...f, images: ensureSingleMain([...f.images, img]) }));
    } else {
      // new country — local state only
      setForm(f => ({
        ...f,
        images: ensureSingleMain([...f.images, { id: crypto.randomUUID(), url, imageType: pendingType, isMain: false, sortOrder: 0 }]),
      }));
    }
    setUrlInput('');
  };

  const deleteImage = async (id: string) => {
    if (editId) {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/images/${id}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if(!res.ok){
        toast({title: 'Erreur upload', description: "Impossible de supprimer l'image"});
        return;;
      }
    }
    setForm(f => ({ ...f, images: ensureSingleMain(f.images.filter(i => i.id !== id)) }));
  };

  const setAsMain = async (id: string) => {
    if (editId) {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/images/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isMain: true }),
      });
    }
    setForm(f => ({ ...f, images: f.images.map(i => ({ ...i, isMain: i.id === id })) }));
  };
  const changeType = async (id: string, imageType: ImageType) => {
    if (editId) {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/images/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageType }),
      });
      if(!res.ok){
        toast({title: 'Erreur ', description: "Impossible de changer type d'image"});
        return;
      }
    }
    setForm(f => ({ ...f, images: f.images.map(i => i.id === id ? { ...i, imageType } : i) }));
  };
  const moveImage = async (id: string, dir: -1 | 1) => {
    const idx = form.images.findIndex(i => i.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= form.images.length) return;
    const next = [...form.images];
    [next[idx], next[target]] = [next[target], next[idx]];
    setForm(f => ({ ...f, images: next }));
    if (editId) {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/${editId}/images/reorder`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(next.map((img, i) => ({ id: img.id, sortOrder: i }))),
      });
    }
  };

  // ─── CRUD ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.code || !form.nameFr) {
      toast({ title: 'Erreur', description: 'Code et nom (FR) requis', variant: 'destructive' });
      return;
    }
    const imagesNormalized = ensureSingleMain(form.images).map((img, i) => ({ ...img, sortOrder: i }));
    const payload = {
      code: form.code.toLowerCase(),
      nameFr: form.nameFr,       nameEn: form.nameEn,       nameAr: form.nameAr,
      descriptionFr: form.descriptionFr || null,
      descriptionEn: form.descriptionEn || null,
      descriptionAr: form.descriptionAr || null,
      pointFortsFr:  form.pointFortsFr  || null,
      pointFortsEn:  form.pointFortsEn  || null,
      pointFortsAr:  form.pointFortsAr  || null,
      lieuxAVisiterFr: form.lieuxAVisiterFr || null,
      lieuxAVisiterEn: form.lieuxAVisiterEn || null,
      lieuxAVisiterAr: form.lieuxAVisiterAr || null,
      conseilsVoyageFr: form.conseilsVoyageFr || null,
      conseilsVoyageEn: form.conseilsVoyageEn || null,
      conseilsVoyageAr: form.conseilsVoyageAr || null,
      isActive: form.isActive,
      ...(editId ? {} : { images: ensureSingleMain(form.images) }),
    };
    const token = localStorage.getItem('token');
    const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/admin/countries${editId ? `/${editId}` : ''}`,
        { method: editId ? 'PUT' : 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
    );
    if (!res.ok) {
      const err = await res.json();
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
      return;
    }
    toast({ title: editId ? 'Pays mis à jour' : 'Pays créé' });
    setOpen(false); setForm(empty); setEditId(null); load();
  };

  const handleEdit = async (c: Country) => {
    setForm({
      code: c.code,
      nameFr: c.nameFr,         nameEn: c.nameEn,         nameAr: c.nameAr,
      descriptionFr: c.descriptionFr ?? '', descriptionEn: c.descriptionEn ?? '', descriptionAr: c.descriptionAr ?? '',
      pointFortsFr:  c.pointFortsFr  ?? '', pointFortsEn:  c.pointFortsEn  ?? '', pointFortsAr:  c.pointFortsAr  ?? '',
      lieuxAVisiterFr: c.lieuxAVisiterFr ?? '', lieuxAVisiterEn: c.lieuxAVisiterEn ?? '', lieuxAVisiterAr: c.lieuxAVisiterAr ?? '',
      conseilsVoyageFr: c.conseilsVoyageFr ?? '', conseilsVoyageEn: c.conseilsVoyageEn ?? '', conseilsVoyageAr: c.conseilsVoyageAr ?? '',
      isActive: c.isActive,
      images: ensureSingleMain(c.images ?? []),
    });
    setEditId(c.id); setOpen(true); setRelatedVisas([]);
    const token = localStorage.getItem('token');
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/${c.id}/visa-types`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    if (Array.isArray(data)) setRelatedVisas(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce pays ?')) return;
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_API_URL}/api/admin/countries/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    toast({ title: 'Pays supprimé' }); load();
  };

  // ─── Derived ────────────────────────────────────────────────────────────────

  const flagPhoto = (c: Country) => c.images?.find(i => i.imageType === 'FLAG')?.url ?? null;

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Pays</h1>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(empty); setEditId(null); setUrlInput(''); } }}>
            <DialogTrigger asChild>
              <Button><Plus className="w-4 h-4 me-2" /> Ajouter un pays</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editId ? 'Modifier' : 'Nouveau'} pays</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="general" className="mt-4">
                <TabsList className="grid grid-cols-4 w-full">
                  <TabsTrigger value="general">Général</TabsTrigger>
                  <TabsTrigger value="content">Contenu</TabsTrigger>
                  <TabsTrigger value="images">
                    Images {form.images.length > 0 && <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">{form.images.length}</Badge>}
                  </TabsTrigger>
                  <TabsTrigger value="visas" disabled={!editId}>
                    Visas {editId && relatedVisas.length > 0 && <Badge variant="secondary" className="ms-2 h-5 px-1.5 text-xs">{relatedVisas.length}</Badge>}
                  </TabsTrigger>
                </TabsList>

                {/* GENERAL */}
                <TabsContent value="general" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Code pays (ex: tr)</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
                    <div className="flex items-end gap-2"><Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} /><Label>Actif</Label></div>
                    <div><Label>Nom (FR)</Label><Input value={form.nameFr} onChange={e => setForm(f => ({ ...f, nameFr: e.target.value }))} /></div>
                    <div><Label>Nom (EN)</Label><Input value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} /></div>
                    <div className="col-span-2"><Label>Nom (AR)</Label><Input value={form.nameAr} onChange={e => setForm(f => ({ ...f, nameAr: e.target.value }))} dir="rtl" /></div>
                  </div>
                  <div><Label>Description (FR)</Label><Textarea rows={3} value={form.descriptionFr} onChange={e => setForm(f => ({ ...f, descriptionFr: e.target.value }))} /></div>
                  <div><Label>Description (EN)</Label><Textarea rows={3} value={form.descriptionEn} onChange={e => setForm(f => ({ ...f, descriptionEn: e.target.value }))} /></div>
                  <div><Label>Description (AR)</Label><Textarea rows={3} value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))} dir="rtl" /></div>
                </TabsContent>

                {/* CONTENT */}
                <TabsContent value="content" className="space-y-4 mt-4">
                  <p className="text-xs text-muted-foreground">Ces champs sont des textes libres (multilangue).</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Points forts (FR)</Label><Textarea rows={3} value={form.pointFortsFr} onChange={e => setForm(f => ({ ...f, pointFortsFr: e.target.value }))} /></div>
                    <div><Label>Points forts (EN)</Label><Textarea rows={3} value={form.pointFortsEn} onChange={e => setForm(f => ({ ...f, pointFortsEn: e.target.value }))} /></div>
                    <div className="col-span-2"><Label>Points forts (AR)</Label><Textarea rows={2} value={form.pointFortsAr} onChange={e => setForm(f => ({ ...f, pointFortsAr: e.target.value }))} dir="rtl" /></div>

                    <div><Label>Lieux à visiter (FR)</Label><Textarea rows={3} value={form.lieuxAVisiterFr} onChange={e => setForm(f => ({ ...f, lieuxAVisiterFr: e.target.value }))} /></div>
                    <div><Label>Lieux à visiter (EN)</Label><Textarea rows={3} value={form.lieuxAVisiterEn} onChange={e => setForm(f => ({ ...f, lieuxAVisiterEn: e.target.value }))} /></div>
                    <div className="col-span-2"><Label>Lieux à visiter (AR)</Label><Textarea rows={2} value={form.lieuxAVisiterAr} onChange={e => setForm(f => ({ ...f, lieuxAVisiterAr: e.target.value }))} dir="rtl" /></div>

                    <div><Label>Conseils voyage (FR)</Label><Textarea rows={3} value={form.conseilsVoyageFr} onChange={e => setForm(f => ({ ...f, conseilsVoyageFr: e.target.value }))} /></div>
                    <div><Label>Conseils voyage (EN)</Label><Textarea rows={3} value={form.conseilsVoyageEn} onChange={e => setForm(f => ({ ...f, conseilsVoyageEn: e.target.value }))} /></div>
                    <div className="col-span-2"><Label>Conseils voyage (AR)</Label><Textarea rows={2} value={form.conseilsVoyageAr} onChange={e => setForm(f => ({ ...f, conseilsVoyageAr: e.target.value }))} dir="rtl" /></div>
                  </div>
                </TabsContent>

                {/* IMAGES */}
                <TabsContent value="images" className="space-y-4 mt-4">
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                    <div className="grid grid-cols-3 gap-2 items-end">
                      <div className="col-span-1">
                        <Label className="text-xs">Type</Label>
                        <Select value={pendingType} onValueChange={v => setPendingType(v as ImageType)}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FLAG">Drapeau</SelectItem>
                            <SelectItem value="HERO">Bannière</SelectItem>
                            <SelectItem value="GALLERY">Galerie</SelectItem>
                            <SelectItem value="THUMBNAIL">Miniature</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={addImageFromFile} />
                        <Button type="button" variant="secondary" className="w-full" onClick={() => fileRef.current?.click()} disabled={uploading}>
                          {uploading ? <Loader2 className="w-4 h-4 animate-spin me-2" /> : <Upload className="w-4 h-4 me-2" />}
                          Uploader
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="…ou coller une URL" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                             onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImageFromUrl(); } }} className="h-9" />
                      <Button type="button" variant="outline" onClick={addImageFromUrl}>Ajouter URL</Button>
                    </div>
                  </div>

                  {form.images.length === 0 ? (
                      <div className="border border-dashed rounded-lg py-12 text-center text-muted-foreground">
                        <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Aucune image.</p>
                      </div>
                  ) : (
                      <div className="space-y-2">
                        {form.images.map((img, i) => (
                            <div key={img.id} className="flex items-center gap-3 rounded-lg border bg-card p-2">
                              <img src={img.url} alt="" className="w-20 h-14 object-cover rounded" />
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={`text-xs ${TYPE_COLOR[img.imageType]}`}>{TYPE_LABEL[img.imageType]}</Badge>
                                  {img.isMain && <Badge className="text-xs bg-amber-500 hover:bg-amber-500"><Star className="w-3 h-3 me-1" />Principale</Badge>}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Select value={img.imageType} onValueChange={v => changeType(img.id, v as ImageType)}>
                                    <SelectTrigger className="h-7 text-xs w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="FLAG">Drapeau</SelectItem>
                                      <SelectItem value="HERO">Bannière</SelectItem>
                                      <SelectItem value="GALLERY">Galerie</SelectItem>
                                      <SelectItem value="THUMBNAIL">Miniature</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <p className="text-xs text-muted-foreground truncate flex-1">{img.url}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === 0} onClick={() => moveImage(img.id, -1)}><ArrowUp className="w-3.5 h-3.5" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={i === form.images.length - 1} onClick={() => moveImage(img.id, 1)}><ArrowDown className="w-3.5 h-3.5" /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" disabled={img.isMain} onClick={() => setAsMain(img.id)}><Star className={`w-3.5 h-3.5 ${img.isMain ? 'fill-amber-500 text-amber-500' : ''}`} /></Button>
                                <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteImage(img.id)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </TabsContent>

                {/* VISAS */}
                <TabsContent value="visas" className="space-y-3 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Ticket className="w-4 h-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Types de visa liés à ce pays</p>
                    <Badge variant="secondary" className="ms-auto">{relatedVisas.length}</Badge>
                  </div>
                  {relatedVisas.length === 0 ? (
                      <div className="border border-dashed rounded-lg py-10 text-center text-muted-foreground text-sm">
                        Aucun visa associé. Créez-en un depuis « Types de visa ».
                      </div>
                  ) : (
                      <div className="space-y-2">
                        {relatedVisas.map(v => (
                            <div key={v.id} className="rounded-lg border bg-card p-3 flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium">{v.nameFr || v.nameEn}</p>
                                  {v.isActive
                                      ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 text-[10px]">Actif</Badge>
                                      : <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">Inactif</Badge>}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Séjour: {v.duration} j · Délai: {v.processingDelay} j
                                </p>
                              </div>
                              <div className="text-end shrink-0">
                                <p className="font-semibold">{Number(v.price).toLocaleString()} {v.currency}</p>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </TabsContent>
              </Tabs>

              <Button className="w-full mt-6" onClick={handleSave}>{editId ? 'Mettre à jour' : 'Créer'}</Button>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Photo</TableHead>
                  <TableHead>Pays</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Images</TableHead>
                  <TableHead>Actif</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {countries.map(c => (
                    <TableRow key={c.id}>
                      <TableCell>
                        {flagPhoto(c)
                            ? <img src={flagPhoto(c)!} alt="" className="w-10 h-10 object-cover rounded-full" />
                            : <div className="w-10 h-10 bg-muted rounded-full" />}
                      </TableCell>
                      <TableCell className="font-medium">{c.nameFr}</TableCell>
                      <TableCell>{c.code.toUpperCase()}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.images?.length ?? 0} image(s)</TableCell>
                      <TableCell>
                        <span className={`inline-block w-2 h-2 rounded-full ${c.isActive ? 'bg-green-500' : 'bg-destructive'}`} />
                      </TableCell>
                      <TableCell className="text-end space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                ))}
                {countries.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun pays</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
  );
};

export default CountriesAdmin;