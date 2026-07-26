import { AlertCircle, BarChart3, Clock, HeartHandshake, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { usdcToVnd } from '@/server/lib/bigint';
import { listCharities } from '@/server/service/charity.service';
import { getFulfillmentStats, listPledges } from '@/server/service/pledge.service';
import { LiveEventFeed } from '@/ui/components/pages/live-event-feed';
import { PledgeBoardClient } from '@/ui/components/pages/pledge-board-client';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>;
}) {
  const { empty } = await searchParams;
  const charities = await listCharities();
  const allPledges = await listPledges();
  // Demo flag: render the empty-board state without touching the database.
  const pledges = empty === '1' ? [] : allPledges;

  const firstCharity = charities[0];
  const stats = firstCharity ? await getFulfillmentStats(firstCharity.id) : null;

  const now = new Date();
  const overduePledges = pledges.filter((p) => p.status === 'active' && new Date(p.nextDue) < now);
  const dueSoonPledges = pledges.filter((p) => {
    if (p.status !== 'active') return false;
    const dueDate = new Date(p.nextDue);
    const diff = dueDate.getTime() - now.getTime();
    return diff > 0 && diff < 2 * 24 * 60 * 60 * 1000;
  });

  return (
    <div className="min-h-screen bg-purple-50/40">
      {/* Header */}
      <header className="bg-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <HeartHandshake className="w-6 h-6" aria-hidden="true" />
            Janji
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/pledge/new"
              className="inline-flex items-center gap-2 bg-white text-purple-700 font-bold px-4 h-11 rounded-lg text-base hover:bg-purple-50 transition-colors"
              data-testid="nav-new-pledge"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
              New Pledge
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Charity header */}
        {firstCharity && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-1" data-testid="charity-name">
              {firstCharity.name}
            </h1>
            <p className="text-slate-600">{firstCharity.description}</p>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Active Pledges"
              value={String(stats.activePledges)}
              icon={<HeartHandshake className="w-5 h-5 text-purple-600" aria-hidden="true" />}
              testId="stat-active"
            />
            <StatCard
              label="Fulfillment Rate"
              value={`${stats.fulfillmentRate}%`}
              icon={<TrendingUp className="w-5 h-5 text-purple-600" aria-hidden="true" />}
              testId="stat-rate"
            />
            <StatCard
              label="Overdue"
              value={String(stats.overdueCount)}
              icon={<AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />}
              accent={stats.overdueCount > 0 ? 'red' : undefined}
              testId="stat-overdue"
            />
            <StatCard
              label="Committed / cycle"
              value={`USDC ${stats.totalPledgedUsdc}`}
              sub={`≈ ${usdcToVnd(stats.totalPledgedUsdc)}`}
              icon={<BarChart3 className="w-5 h-5 text-purple-600" aria-hidden="true" />}
              testId="stat-usdc"
            />
          </div>
        )}

        {/* Alerts */}
        {overduePledges.length > 0 && (
          <div
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3"
            data-testid="overdue-alert"
          >
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-red-700">
                {overduePledges.length} pledge{overduePledges.length > 1 ? 's' : ''} overdue
              </p>
              <p className="text-red-600 text-sm">
                {overduePledges.map((p) => p.donorName).join(', ')}
              </p>
            </div>
          </div>
        )}

        {dueSoonPledges.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="font-semibold text-amber-800">Due within 48 hours</p>
              <p className="text-amber-700 text-sm">
                {dueSoonPledges.map((p) => p.donorName).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Pledge Board */}
        <PledgeBoardClient
          pledges={pledges.map((p) => ({
            ...p,
            nextDue: p.nextDue.toISOString(),
            createdAt: p.createdAt.toISOString(),
          }))}
          charityId={firstCharity?.id}
          initialRate={stats?.fulfillmentRate}
        />

        {/* Live Horizon event feed (SSE) */}
        {firstCharity && (
          <div className="mt-8">
            <LiveEventFeed charityId={firstCharity.id} />
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
  testId,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: 'red';
  testId?: string;
}) {
  const borderClass = accent === 'red' ? 'border-red-200' : 'border-purple-100';
  const bgClass = accent === 'red' ? 'bg-red-50' : 'bg-white';

  return (
    <div
      className={`${bgClass} ${borderClass} border rounded-xl p-5 shadow-sm`}
      data-testid={testId}
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-slate-500 text-sm mt-1">{label}</div>
      {sub && <div className="text-purple-600 text-xs font-semibold mt-0.5">{sub}</div>}
    </div>
  );
}
