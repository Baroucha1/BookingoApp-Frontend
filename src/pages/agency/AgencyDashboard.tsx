import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Clock, CheckCircle2, XCircle, Wallet, FilePlus2, ArrowRight, TrendingUp,
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  seedAgencyApplications, seedAgencyPayments, APP_STATUS_LABEL, APP_STATUS_COLOR, currentAgency,
} from '@/lib/mockAdminData';

const STATUS_COLORS = {
  PENDING: 'hsl(38 92% 50%)',
  UNDER_REVIEW: 'hsl(199 89% 48%)',
  APPROVED: 'hsl(160 84% 39%)',
  REJECTED: 'hsl(0 84% 60%)',
};

const fmtMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

const AgencyDashboard = () => {
  const apps = seedAgencyApplications;
  const payments = seedAgencyPayments;

  const stats = useMemo(() => {
    const total = apps.length;
    const pending = apps.filter(a => a.status === 'PENDING').length;
    const approved = apps.filter(a => a.status === 'APPROVED').length;
    const rejected = apps.filter(a => a.status === 'REJECTED').length;
    const review = apps.filter(a => a.status === 'UNDER_REVIEW').length;
    const totalSpentEUR = payments.filter(p => p.status === 'paid' && p.currency === 'EUR').reduce((s, p) => s + p.amount, 0);
    const totalSpentDZD = payments.filter(p => p.status === 'paid' && p.currency === 'DZD').reduce((s, p) => s + p.amount, 0);
    return { total, pending, approved, rejected, review, totalSpentEUR, totalSpentDZD };
  }, [apps, payments]);

  // Apps over time: group by date (last ~10 days)
  const lineData = useMemo(() => {
    const map = new Map<string, number>();
    apps.forEach(a => {
      const d = new Date(a.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      map.set(d, (map.get(d) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count })).reverse();
  }, [apps]);

  const pieData = [
    { name: 'En attente', value: stats.pending, color: STATUS_COLORS.PENDING },
    { name: 'En cours', value: stats.review, color: STATUS_COLORS.UNDER_REVIEW },
    { name: 'Approuvées', value: stats.approved, color: STATUS_COLORS.APPROVED },
    { name: 'Rejetées', value: stats.rejected, color: STATUS_COLORS.REJECTED },
  ].filter(d => d.value > 0);

  const recentApps = [...apps].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 5);
  const recentPayments = [...payments].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5);

  const kpis = [
    { label: 'Total demandes', value: stats.total, icon: FileText, color: 'from-primary to-primary-glow' },
    { label: 'En attente', value: stats.pending, icon: Clock, color: 'from-[hsl(38_92%_50%)] to-[hsl(38_92%_60%)]' },
    { label: 'Approuvées', value: stats.approved, icon: CheckCircle2, color: 'from-[hsl(160_84%_39%)] to-[hsl(160_84%_50%)]' },
    { label: 'Rejetées', value: stats.rejected, icon: XCircle, color: 'from-destructive to-[hsl(0_84%_70%)]' },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-hero p-6 md:p-8 shadow-elegant text-white relative overflow-hidden animate-fade-in-up">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-5 -bottom-5 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/80">Bienvenue,</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{currentAgency.companyName}</h1>
            <p className="text-sm text-white/80 mt-2">Gérez vos demandes de visa pour vos clients en toute simplicité.</p>
          </div>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 shadow-lg">
            <Link to="/agency/new-application"><FilePlus2 className="w-4 h-4 me-1" /> Nouvelle demande</Link>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Card key={k.label} className="card-hover animate-fade-in-up overflow-hidden" style={{ animationDelay: `${i * 60}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{k.label}</div>
                  <div className="text-3xl font-bold mt-1">{k.value}</div>
                </div>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${k.color} flex items-center justify-center shadow-elegant`}>
                  <k.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Spending */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="card-hover animate-fade-in-up">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total dépensé (EUR)</div>
              <div className="text-2xl font-bold mt-1">{fmtMoney(stats.totalSpentEUR, 'EUR')}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-accent" /> Stripe</div>
            </div>
            <Wallet className="w-10 h-10 text-secondary" />
          </CardContent>
        </Card>
        <Card className="card-hover animate-fade-in-up">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Total dépensé (DZD)</div>
              <div className="text-2xl font-bold mt-1">{fmtMoney(stats.totalSpentDZD, 'DZD')}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-accent" /> SATIM</div>
            </div>
            <Wallet className="w-10 h-10 text-accent" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-base">Demandes dans le temps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(var(--secondary))' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="text-base">Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                    {pieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Demandes récentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agency/applications">Voir tout <ArrowRight className="w-3 h-3 ms-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentApps.map(a => (
              <Link key={a.id} to="/agency/applications" className="flex items-center justify-between p-3 rounded-lg border row-hover">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{a.reference}</div>
                  <div className="text-xs text-muted-foreground truncate">{a.countryName} · {a.visaTypeName}</div>
                </div>
                <Badge variant="outline" className={`${APP_STATUS_COLOR[a.status]} text-[10px] shrink-0 ms-2`}>
                  {APP_STATUS_LABEL[a.status]}
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Paiements récents</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/agency/payments">Voir tout <ArrowRight className="w-3 h-3 ms-1" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPayments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border row-hover">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{p.reference}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.method} · {p.applicationRef}</div>
                </div>
                <div className="text-end shrink-0 ms-2">
                  <div className="text-sm font-semibold">{fmtMoney(p.amount, p.currency)}</div>
                  <Badge variant="outline" className={`text-[10px] mt-0.5 ${
                    p.status === 'paid' ? 'border-accent text-accent' :
                    p.status === 'pending' ? 'border-[hsl(38_92%_50%)] text-[hsl(38_92%_50%)]' :
                    p.status === 'refunded' ? 'border-muted-foreground text-muted-foreground' :
                    'border-destructive text-destructive'
                  }`}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgencyDashboard;
