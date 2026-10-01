import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Globe, FileText, Clock, CheckCircle, Users, CreditCard, FileCheck, Wallet,
  Tag, MapPin, ArrowUpRight, TrendingUp, TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';
import {
  seedClients, seedAgencies, seedAdmins, seedPayments, mockApplicationsLite,
  APP_STATUS_LABEL, currentAdminUser,
} from '@/lib/mockAdminData';
import { useAuth } from '@/hooks/useAuth';



type DbCounts = {
  visaTypes: number; total: number; pending: number; approved: number; underReview: number; rejected: number;
};

type RecentApp = {
  id: string;
  country: string;
  visa_type: string;
  status: string;
  created_at: string;
};

const KPI = ({
               title, value, icon: Icon, accent = 'primary', delta, delay = 0,
             }: { title: string; value: string | number; icon: any; accent?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'warning'; delta?: { value: string; up: boolean }; delay?: number }) => {
  const tone: Record<string, string> = {
    primary: 'from-primary/15 to-primary/5 text-primary',
    secondary: 'from-secondary/15 to-secondary/5 text-secondary',
    accent: 'from-accent/15 to-accent/5 text-accent',
    destructive: 'from-destructive/15 to-destructive/5 text-destructive',
    warning: 'from-[hsl(var(--warning))]/15 to-[hsl(var(--warning))]/5 text-[hsl(var(--warning))]',
  };
  return (
      <Card
          className="card-hover animate-fade-in-up overflow-hidden relative"
          style={{ animationDelay: `${delay}ms` }}
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${tone[accent]}`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${tone[accent]} flex items-center justify-center`}>
            <Icon className="w-4 h-4" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{value}</div>
          {delta && (
              <div className={`flex items-center gap-1 text-xs mt-1 ${delta.up ? 'text-accent' : 'text-destructive'}`}>
                {delta.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {delta.value}
                <span className="text-muted-foreground ms-1">vs. le mois dernier</span>
              </div>
          )}
        </CardContent>
      </Card>
  );
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30',
  processing: 'bg-secondary/15 text-secondary border-secondary/30',
  approved: 'bg-accent/15 text-accent border-accent/30',
  rejected: 'bg-destructive/15 text-destructive border-destructive/30',
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [db, setDb] = useState<DbCounts>({ visaTypes: 0, total: 0, pending: 0, approved: 0, underReview: 0, rejected: 0 });
  const [recent, setRecent] = useState<RecentApp[]>([]);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDb({
        visaTypes: data.visaTypes ?? 0,
        total: data.total ?? 0,
        pending: data.pending ?? 0,
        approved: data.approved ?? 0,
        underReview: data.underReview ?? 0,
        rejected: data.rejected ?? 0,
      });
      setRecent(data.recent ?? []);
    };
    load();
  }, []);


  // --- Display name for greeting ---
  const displayName = useMemo(() => {
    const email = user?.email ?? currentAdminUser.email;
    const raw = email.split('@')[0].split(/[._-]/)[0] || 'Admin';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [user]);

  // --- Derived stats from mock data ---
  const stats = useMemo(() => {
    const totalUsers = seedClients.length + seedAgencies.length + seedAdmins.length;
    const paymentsPending = seedPayments.filter(p => p.status === 'pending').length;
    const paymentsCompleted = seedPayments.filter(p => p.status === 'paid').length;
    const documentsToVerify = 12; // mock signal
    return { totalUsers, paymentsPending, paymentsCompleted, documentsToVerify };
  }, []);

  // --- Charts data ---
  const lineData = useMemo(() => {
    const months = ['Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr'];
    return months.map((m, i) => ({
      month: m,
      applications: 18 + i * 6 + (i % 2 === 0 ? 4 : -2),
      approved: 12 + i * 5,
    }));
  }, []);

  const pieData = useMemo(() => {
    const total = Math.max(db.total, 1);
    const fallback = [
      { name: 'Approuvées', value: db.approved || 24, color: 'hsl(var(--accent))' },
      { name: 'En cours', value: db.underReview || 12, color: 'hsl(var(--secondary))' },
      { name: 'En attente', value: db.pending || 8, color: 'hsl(var(--warning))' },
      { name: 'Rejetées', value: db.rejected || 4, color: 'hsl(var(--destructive))' },
    ];
    return fallback.filter(d => d.value > 0).length ? fallback : [{ name: '—', value: total, color: 'hsl(var(--muted))' }];
  }, [db]);

  const pieTotal = useMemo(() => pieData.reduce((s, d) => s + d.value, 0), [pieData]);

  const paymentBarData = useMemo(() => {
    const paid = seedPayments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.currency === 'EUR' ? p.amount : p.amount / 130), 0);
    const pending = seedPayments.filter(p => p.status === 'pending').reduce((s, p) => s + (p.currency === 'EUR' ? p.amount : p.amount / 130), 0);
    const refunded = seedPayments.filter(p => p.status === 'refunded').reduce((s, p) => s + (p.currency === 'EUR' ? p.amount : p.amount / 130), 0);
    return [
      { name: 'Payés', amount: Math.round(paid), fill: 'hsl(var(--accent))' },
      { name: 'En attente', amount: Math.round(pending), fill: 'hsl(var(--warning))' },
      { name: 'Remboursés', amount: Math.round(refunded), fill: 'hsl(var(--destructive))' },
    ];
  }, []);

  const recentPayments = useMemo(() => seedPayments.slice(0, 5), []);

  const fmtDate = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  return (
      <div className="space-y-6">
        {/* Hero / quick actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Bienvenue, {displayName} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">Aperçu en temps réel de votre plateforme eVisa.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/assets/admin/countries"><Button variant="outline" size="sm" className="gap-2"><MapPin className="w-4 h-4" />Ajouter un pays</Button></Link>
            <Link to="/assets/admin/visa-types"><Button variant="outline" size="sm" className="gap-2"><Globe className="w-4 h-4" />Type de visa</Button></Link>
            <Link to="/assets/admin/promo-codes"><Button size="sm" className="gap-2 bg-gradient-primary hover:opacity-90"><Tag className="w-4 h-4" />Code promo</Button></Link>
          </div>
        </div>

        {/* KPI grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI title="Types de visa" value={db.visaTypes} icon={Globe} accent="primary" delay={0} />
          <KPI title="Total demandes" value={db.total} icon={FileText} accent="secondary" delta={{ value: '+12.3%', up: true }} delay={50} />
          <KPI title="En attente" value={db.pending} icon={Clock} accent="warning" delta={{ value: '+8.4%', up: true }} delay={100} />
          <KPI title="Approuvées" value={db.approved} icon={CheckCircle} accent="accent" delta={{ value: '+8.1%', up: true }} delay={150} />
          <KPI title="Utilisateurs" value={stats.totalUsers} icon={Users} accent="primary" delay={200} />
          <KPI title="Paiements en attente" value={stats.paymentsPending} icon={Wallet} accent="warning" delay={250} />
          <KPI title="Paiements complétés" value={stats.paymentsCompleted} icon={CreditCard} accent="accent" delta={{ value: '+5.4%', up: true }} delay={300} />

          <KPI title="Documents à vérifier" value={stats.documentsToVerify} icon={FileCheck} accent="destructive" delay={350} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 card-hover animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <CardTitle className="text-base">Demandes au fil du temps</CardTitle>
              <CardDescription>6 derniers mois</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={lineData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="applications" name="Demandes" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="approved" name="Approuvées" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-hover animate-fade-in-up" style={{ animationDelay: '350ms' }}>
            <CardHeader>
              <CardTitle className="text-base">Statut des demandes</CardTitle>
              <CardDescription>Répartition globale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3} stroke="hsl(var(--card))">
                        {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xl font-bold tracking-tight">{pieTotal.toLocaleString('fr-FR')}</span>
                    <span className="text-[11px] text-muted-foreground">Total</span>
                  </div>
                </div>
                <div className="flex-1 space-y-2.5 text-sm min-w-0">
                  {pieData.map(d => {
                    const pct = pieTotal ? ((d.value / pieTotal) * 100).toFixed(1) : '0.0';
                    return (
                        <div key={d.name} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                          <span className="text-muted-foreground truncate">{d.name}</span>
                          <span className="ms-auto font-semibold whitespace-nowrap">
                        {d.value} <span className="text-xs text-muted-foreground">({pct}%)</span>
                      </span>
                        </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3 card-hover animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="text-base">Paiements (EUR équivalent)</CardTitle>
              <CardDescription>Vue agrégée toutes devises</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={paymentBarData} margin={{ left: -10, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="card-hover animate-fade-in-up" style={{ animationDelay: '450ms' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Demandes récentes</CardTitle>
                <CardDescription>5 dernières demandes</CardDescription>
              </div>
              <Link to="/assets/admin/applications" className="text-xs text-primary hover:underline flex items-center gap-1">
                Tout voir <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-start px-3 py-2 font-medium">Pays</th>
                    <th className="text-start px-3 py-2 font-medium">Visa</th>
                    <th className="text-start px-3 py-2 font-medium">Statut</th>
                    <th className="text-end px-3 py-2 font-medium">Date</th>
                  </tr>
                  </thead>
                  <tbody>
                  {(recent.length ? recent : Object.values(mockApplicationsLite).slice(0, 5).map(a => ({
                    id: a.id, country: a.country, visa_type: a.visaType, status: 'pending', created_at: new Date().toISOString(),
                  }))).map(r => (
                      <tr key={r.id} className="row-hover border-t">
                        <td className="px-3 py-2.5 font-medium">{r.country}</td>
                        <td className="px-3 py-2.5 text-muted-foreground truncate max-w-[180px]">{r.visa_type}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={STATUS_COLOR[r.status] ?? ''}>
                            {APP_STATUS_LABEL[(r.status?.toUpperCase() as any)] ?? r.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-end text-xs text-muted-foreground">{fmtDate(r.created_at)}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="card-hover animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Paiements récents</CardTitle>
                <CardDescription>Dernières transactions</CardDescription>
              </div>
              <Link to="/assets/admin/payments" className="text-xs text-primary hover:underline flex items-center gap-1">
                Tout voir <ArrowUpRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-start px-3 py-2 font-medium">Réf.</th>
                    <th className="text-start px-3 py-2 font-medium">Méthode</th>
                    <th className="text-start px-3 py-2 font-medium">Statut</th>
                    <th className="text-end px-3 py-2 font-medium">Montant</th>
                  </tr>
                  </thead>
                  <tbody>
                  {recentPayments.map(p => (
                      <tr key={p.id} className="row-hover border-t">
                        <td className="px-3 py-2.5 font-mono text-xs">{p.reference}</td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className="text-[10px]">{p.method}</Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={STATUS_COLOR[p.status] ?? ''}>{p.status}</Badge>
                        </td>
                        <td className="px-3 py-2.5 text-end font-semibold">
                          {p.amount.toLocaleString('fr-FR')} <span className="text-xs text-muted-foreground">{p.currency}</span>
                        </td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
  );
};

export default AdminDashboard;