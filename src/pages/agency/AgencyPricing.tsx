import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Sparkles, Tag, Clock, FilePlus2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { agencyVisaCatalog, getAgencyPrice, currentAgency, findGroup } from '@/lib/mockAdminData';

const fmtMoney = (a: number, c: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(a);

const AgencyPricing = () => {
  const group = findGroup(currentAgency.groupId);
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('all');

  const countries = useMemo(() => Array.from(new Set(agencyVisaCatalog.map(v => v.countryName))), []);

  const items = agencyVisaCatalog
    .filter(v => !search || v.visaTypeName.toLowerCase().includes(search.toLowerCase()) || v.countryName.toLowerCase().includes(search.toLowerCase()))
    .filter(v => country === 'all' || v.countryName === country)
    .map(v => ({ ...v, ...getAgencyPrice(v.id, currentAgency.groupId) }));

  return (
    <div className="space-y-4">
      {/* Banner */}
      <Card className="bg-gradient-accent text-accent-foreground border-0 shadow-elegant animate-fade-in-up">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider opacity-80">Votre groupe</div>
            <div className="text-xl font-bold flex items-center gap-2">
              {group?.name ?? 'Standard'}
              {group && <Badge className="bg-white/20 text-accent-foreground border-0 text-[10px]"><ShieldCheck className="w-3 h-3 me-1" />Vérifié</Badge>}
            </div>
            <div className="text-sm opacity-90 mt-1">{group?.description ?? 'Tarifs standards appliqués.'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="animate-fade-in-up"><CardContent className="p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un visa…" value={search} onChange={e => setSearch(e.target.value)} className="ps-9" />
        </div>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les pays</SelectItem>
            {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardContent></Card>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((v, i) => (
          <Card key={v.id} className="card-hover animate-fade-in-up overflow-hidden relative" style={{ animationDelay: `${i * 40}ms` }}>
            {v.isDiscounted && (
              <div className="absolute top-3 end-3 z-10">
                <Badge className="bg-gradient-accent text-accent-foreground border-0 shadow-elegant">
                  <Tag className="w-3 h-3 me-1" />Votre prix
                </Badge>
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl">{v.flagEmoji}</span>
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{v.countryName}</CardTitle>
                  <div className="text-xs text-muted-foreground truncate">{v.visaTypeName}</div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{v.processingTime}</span>
                <span>·</span>
                <span>{v.durationDays} jours</span>
              </div>
              <div className="border-t pt-3">
                {v.isDiscounted ? (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground line-through">{fmtMoney(v.base, v.currency)}</div>
                    <div className="text-2xl font-bold text-primary">{fmtMoney(v.price, v.currency)}</div>
                    <div className="text-[10px] text-accent font-medium">
                      Économie {fmtMoney(v.base - v.price, v.currency)} ({Math.round((1 - v.price / v.base) * 100)}%)
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-2xl font-bold">{fmtMoney(v.price, v.currency)}</div>
                    <Badge variant="outline" className="text-[10px]">Prix standard</Badge>
                  </div>
                )}
              </div>
              <Button asChild size="sm" className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                <Link to="/agency/new-application"><FilePlus2 className="w-4 h-4 me-1" />Nouvelle demande</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison table */}
      <Card className="animate-fade-in-up">
        <CardHeader><CardTitle className="text-base">Comparatif des tarifs</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Pays</TableHead>
              <TableHead>Visa</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead className="text-end">Prix standard</TableHead>
              <TableHead className="text-end">Votre prix</TableHead>
              <TableHead className="text-end">Économie</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {items.map(v => (
                <TableRow key={v.id} className="row-hover">
                  <TableCell><span className="me-1">{v.flagEmoji}</span>{v.countryName}</TableCell>
                  <TableCell>{v.visaTypeName}</TableCell>
                  <TableCell className="text-xs">{v.durationDays}j</TableCell>
                  <TableCell className={`text-end ${v.isDiscounted ? 'line-through text-muted-foreground' : 'font-semibold'}`}>{fmtMoney(v.base, v.currency)}</TableCell>
                  <TableCell className="text-end font-bold text-primary">{fmtMoney(v.price, v.currency)}</TableCell>
                  <TableCell className="text-end">
                    {v.isDiscounted
                      ? <span className="text-accent font-medium">-{fmtMoney(v.base - v.price, v.currency)}</span>
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgencyPricing;
