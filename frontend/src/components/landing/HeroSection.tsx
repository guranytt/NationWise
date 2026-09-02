import { Link } from 'react-router';
import { Button } from '../ui/Button';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-slate-50 pt-24 pb-16">
      {/* Dotted grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      {/* Soft vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/60 via-transparent to-slate-50 pointer-events-none" />

      {/* ── Floating UI cards ── */}

      {/* Top-left: Issue status badge */}
      <div className="absolute top-[18%] left-[6%] hidden lg:flex flex-col gap-2 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 w-56 animate-float" style={{ animationDelay: '0s' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
          <span className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full">In Progress</span>
        </div>
        <p className="text-sm font-bold text-slate-800 leading-snug">Broken streetlight on Herbert Macaulay Way</p>
        <p className="text-xs text-slate-400">Lagos • Electricity</p>
      </div>

      {/* Top-right: Resolved card */}
      <div className="absolute top-[14%] right-[7%] hidden lg:flex flex-col gap-2 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 w-52 animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">Resolved ✓</span>
        </div>
        <p className="text-sm font-bold text-slate-800 leading-snug">Water outage — Garki District</p>
        <p className="text-xs text-slate-400">FCT Abuja • Water</p>
      </div>

      {/* Bottom-left: Agency routing card */}
      <div className="absolute bottom-[22%] left-[5%] hidden lg:flex items-center gap-3 bg-slate-900 text-white rounded-2xl shadow-xl p-4 w-60 animate-float" style={{ animationDelay: '0.8s' }}>
        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
        </div>
        <div>
          <p className="text-xs text-slate-400">Routed to</p>
          <p className="text-sm font-bold">LASEPA Lagos</p>
        </div>
      </div>

      {/* Bottom-right: Stats pill */}
      <div className="absolute bottom-[20%] right-[6%] hidden lg:flex items-center gap-3 bg-white rounded-2xl shadow-lg border border-slate-100 p-4 animate-float" style={{ animationDelay: '2s' }}>
        <div className="text-3xl font-black text-primary-600">78%</div>
        <div>
          <p className="text-xs font-bold text-slate-800">Resolution</p>
          <p className="text-xs text-slate-400">rate nationwide</p>
        </div>
      </div>

      {/* ── Centre Content ── */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-primary-500 inline-block animate-pulse" />
          Civic Accountability Platform for Nigeria
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-slate-900 leading-[1.05] mb-6">
          Report it.<br />
          <span className="text-primary-600">Track it.</span><br />
          Fix it.
        </h1>

        <p className="text-lg md:text-xl text-slate-500 max-w-xl mx-auto mb-10 leading-relaxed">
          NationWise connects Nigerian citizens directly to the government agencies responsible for fixing their communities.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/report">
            <Button size="lg" className="bg-primary-600 text-white hover:bg-primary-700 text-base px-8 py-4 rounded-xl shadow-lg shadow-primary-200">
              Report an Issue
            </Button>
          </Link>
          <Link to="/issues">
            <Button variant="outline" size="lg" className="text-slate-700 border-slate-200 hover:bg-slate-100 text-base px-8 py-4 rounded-xl">
              Browse Issues →
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
