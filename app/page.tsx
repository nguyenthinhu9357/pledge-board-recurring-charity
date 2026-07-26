import { Activity, BellRing, HeartHandshake, Layers, QrCode, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-purple-600 to-fuchsia-500 text-white">
        <div className="absolute inset-0 opacity-15" aria-hidden="true">
          <div className="absolute top-12 left-8 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-fuchsia-300 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 py-20 md:py-32">
          <div className="flex items-center gap-3 mb-7">
            <div className="bg-white/20 p-2.5 rounded-xl">
              <HeartHandshake className="w-7 h-7 text-white" aria-hidden="true" />
            </div>
            <span className="font-bold tracking-wide uppercase text-sm text-purple-100">Janji</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] mb-6 max-w-3xl">
            Keep your promise
            <br />
            <span className="text-purple-200">to give</span> — on-chain.
          </h1>
          <p className="text-lg md:text-xl text-purple-50 max-w-2xl mb-10 leading-relaxed">
            Janji turns a charitable intention into a public on-chain pledge. Bond a small USDC
            deposit into the pledge registry, get a reminder every giving cycle, then fulfill with
            one tap via a pre-filled SEP-7 payment to the charity&rsquo;s muxed Stellar account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-white text-purple-700 font-bold px-8 h-12 rounded-xl text-base hover:bg-purple-50 transition-colors shadow-lg"
              data-testid="cta-dashboard"
            >
              <Activity className="w-5 h-5" aria-hidden="true" />
              View Pledge Board
            </Link>
            <Link
              href="/pledge/new"
              className="inline-flex items-center justify-center gap-2 border-2 border-white text-white font-bold px-8 h-12 rounded-xl text-base hover:bg-white/10 transition-colors"
              data-testid="cta-pledge"
            >
              <HeartHandshake className="w-5 h-5" aria-hidden="true" />
              Make a Pledge
            </Link>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-purple-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-purple-200">7</div>
            <div className="text-purple-300 text-sm mt-1">Public Pledges</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-200">USDC 396</div>
            <div className="text-purple-300 text-sm mt-1">Committed / cycle</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-200">71%</div>
            <div className="text-purple-300 text-sm mt-1">Fulfillment Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-200">10.3M ₫</div>
            <div className="text-purple-300 text-sm mt-1">Cycle value (VND)</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-14">
            Built for faith communities and recurring givers
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<ShieldCheck className="w-8 h-8 text-purple-600" aria-hidden="true" />}
              title="Bonded, public commitment"
              body="A pledge deposits a small USDC bond into a Soroban pledge registry. Your intention becomes verifiable on-chain proof, not just a private promise."
            />
            <FeatureCard
              icon={<QrCode className="w-8 h-8 text-purple-600" aria-hidden="true" />}
              title="One-tap SEP-7 giving"
              body="Each cycle, open a pre-filled SEP-7 URI and QR. Sign with your own wallet; USDC settles straight to the charity's muxed account for clean attribution."
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8 text-purple-600" aria-hidden="true" />}
              title="Live fulfillment dashboard"
              body="Coordinators see committed pledges, overdue alerts, and a Horizon SSE event feed. Fulfillment rates update live as gifts land on-chain."
            />
          </div>
        </div>
      </section>

      {/* Persona callout */}
      <section className="py-16 bg-purple-50 border-t border-purple-100">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="inline-block bg-white rounded-2xl shadow-md px-8 py-7 mb-8 border border-purple-100">
            <div className="flex justify-center mb-4">
              <Layers className="w-7 h-7 text-purple-500" aria-hidden="true" />
            </div>
            <p className="text-lg text-slate-700 mb-4 leading-relaxed">
              &ldquo;I sell vegetables at Ben Thanh market. Every month I want to give to the
              temple, but I forget or the cash slips away. Janji reminds me and lets me give 30,000
              dong from my phone in one tap — and the temple can see I kept my promise.&rdquo;
            </p>
            <div className="font-semibold text-purple-700">Nguyen Thi Lan</div>
            <div className="text-slate-500 text-sm">
              Market vendor, Ho Chi Minh City, Vietnam (₫)
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 bg-purple-600 text-white font-bold px-8 h-12 rounded-xl text-base hover:bg-purple-700 transition-colors"
          >
            <BellRing className="w-5 h-5" aria-hidden="true" />
            See the live board
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-5 h-5 text-purple-400" aria-hidden="true" />
            <span className="font-semibold text-white">Janji</span>
          </div>
          <p className="text-sm text-center">
            Built on Stellar Testnet · Track C — Community &amp; Social Impact · APAC Hackathon 2026
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-purple-50 rounded-2xl p-8 border border-purple-100 hover:shadow-md transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{body}</p>
    </div>
  );
}
