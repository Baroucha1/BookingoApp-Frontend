import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { seedDocumentTypes, type DocumentTypeMock } from '@/lib/mockAdminData';

const empty: Omit<DocumentTypeMock, 'id'> = {
  key: '', labelFr: '', labelEn: '', labelAr: '', description: '',
};

const DocumentTypesAdmin = () => {
  const [items, setItems] = useState<DocumentTypeMock[]>(seedDocumentTypes);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const reset = () => { setForm(empty); setEditId(null); };

  const handleSave = () => {
    if (!form.key.trim() || !form.labelFr.trim()) {
      toast({ title: 'Erreur', description: 'Clé et libellé FR requis', variant: 'destructive' });
      return;
    }
    const normKey = form.key.trim().toLowerCase().replace(/\s+/g, '_');
    if (items.some(i => i.key === normKey && i.id !== editId)) {
      toast({ title: 'Erreur', description: 'Cette clé existe déjà', variant: 'destructive' });
      return;
    }
    if (editId) {
      setItems(prev => prev.map(i => i.id === editId ? { ...i, ...form, key: normKey } : i));
      toast({ title: 'Document mis à jour' });
    } else {
      setItems(prev => [...prev, { id: `dt-${crypto.randomUUID()}`, ...form, key: normKey }]);
      toast({ title: 'Document créé' });
    }
    setOpen(false); reset();
  };

  const handleEdit = (it: DocumentTypeMock) => {
    setForm({ key: it.key, labelFr: it.labelFr, labelEn: it.labelEn, labelAr: it.labelAr, description: it.description });
    setEditId(it.id); setOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce type de document ?')) return;
    setItems(prev => prev.filter(i => i.id !== id));
    toast({ title: 'Document supprimé' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Types de documents</h1>
          <p className="text-sm text-muted-foreground mt-1">Catalogue des documents pouvant être attachés aux types de visa</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 me-2" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editId ? 'Modifier' : 'Nouveau'} type de document</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <Label>Clé technique</Label>
                <Input value={form.key} onChange={e => setForm(f => ({ ...f, key: e.target.value }))} placeholder="ex: passport" />
                <p className="text-xs text-muted-foreground mt-1">Identifiant unique en minuscules, sans espaces</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Libellé (FR)</Label><Input value={form.labelFr} onChange={e => setForm(f => ({ ...f, labelFr: e.target.value }))} /></div>
                <div><Label>Libellé (EN)</Label><Input value={form.labelEn} onChange={e => setForm(f => ({ ...f, labelEn: e.target.value }))} /></div>
                <div className="col-span-2"><Label>Libellé (AR)</Label><Input value={form.labelAr} onChange={e => setForm(f => ({ ...f, labelAr: e.target.value }))} dir="rtl" /></div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails ou exigences spécifiques" />
              </div>
              <Button className="w-full" onClick={handleSave}>{editId ? 'Mettre à jour' : 'Créer'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clé</TableHead>
                <TableHead>Libellé FR</TableHead>
                <TableHead>Libellé EN</TableHead>
                <TableHead>Libellé AR</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(it => (
                <TableRow key={it.id}>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{it.key}</Badge></TableCell>
                  <TableCell className="font-medium">{it.labelFr}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{it.labelEn}</TableCell>
                  <TableCell className="text-sm text-muted-foreground" dir="rtl">{it.labelAr}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{it.description}</TableCell>
                  <TableCell className="text-end space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(it)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(it.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun document</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentTypesAdmin;
