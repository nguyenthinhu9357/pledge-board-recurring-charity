import { ArrowLeft, HeartHandshake } from 'lucide-react';
import Link from 'next/link';
import { listCharities } from '@/server/service/charity.service';
import { NewPledgeForm } from '@/ui/components/pages/new-pledge-form';

export const dynamic = 'force-dynamic';

export default async function NewPledgePage() {
  const charities = await listCharities();

  return (
    <div className="min-h-screen bg-purple-50/40">
      <header className="bg-purple-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <HeartHandshake className="w-6 h-6" aria-hidden="true" />
            Janji
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-purple-100 hover:text-white text-base font-medium"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            Back to board
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Make a public pledge</h1>
        <p className="text-slate-600 mb-8">
          Commit to give on a recurring cadence. Your pledge is recorded on the board with a small
          bonded USDC deposit, and you settle each cycle with a one-tap SEP-7 payment.
        </p>
        <NewPledgeForm charities={charities.map((c) => ({ id: c.id, name: c.name }))} />
      </main>
    </div>
  );
}
