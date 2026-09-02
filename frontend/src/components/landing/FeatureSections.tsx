import { Link } from 'react-router';

// ── Feature 1: Report — light section, left text, right mockup ──
function FeatureReport() {
  return (
    <div className="py-24 bg-white">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center max-w-6xl">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary-600 mb-4">Step 1</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
            Spot a problem.<br />Report it in minutes.
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed mb-8">
            Our streamlined reporting form guides you through describing the issue, selecting the right category, and pinpointing your state and LGA — no registration required.
          </p>
          <Link to="/report" className="inline-flex items-center gap-2 text-primary-600 font-bold text-lg hover:gap-3 transition-all">
            File a report <span>→</span>
          </Link>
        </div>

        {/* Report form mockup */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">New Issue Report</p>
            <div className="space-y-1">
              <div className="text-xs text-slate-400 font-medium">Issue Title</div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-800 border border-slate-100 font-medium">
                Collapsed drainage on Aba Road...
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-medium">Category</div>
                <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-800 border border-slate-100">Water & Sanitation</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-400 font-medium">State</div>
                <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-800 border border-slate-100">Rivers State</div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-slate-400 font-medium">Description</div>
              <div className="bg-slate-50 rounded-lg px-3 py-2.5 text-sm text-slate-500 border border-slate-100 h-16">
                The drainage has collapsed causing flooding of residential areas after every rainfall...
              </div>
            </div>
            <div className="pt-2">
              <div className="w-full bg-primary-600 text-white text-sm font-bold py-3 rounded-xl text-center">
                Submit Report
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature 2: Route — dark section, right text, left mockup ──
function FeatureRoute() {
  return (
    <div className="py-24 bg-slate-900">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center max-w-6xl">
        {/* Routing mockup */}
        <div className="order-2 md:order-1 bg-slate-800 rounded-3xl p-6 border border-slate-700">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Routing Engine</p>
          <div className="space-y-3">
            {[
              { label: 'Category', value: 'Roads & Transport', icon: '🛣️' },
              { label: 'State', value: 'Kano State', icon: '📍' },
              { label: 'LGA', value: 'Kano Municipal', icon: '🏘️' },
            ].map((row) => (
              <div key={row.label} className="flex items-center justify-between bg-slate-700/50 rounded-xl px-4 py-3">
                <span className="text-slate-400 text-sm">{row.icon} {row.label}</span>
                <span className="text-white text-sm font-semibold">{row.value}</span>
              </div>
            ))}

            <div className="flex items-center gap-2 py-2">
              <div className="flex-1 h-px bg-slate-700" />
              <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">Matched to</div>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            <div className="bg-primary-600/20 border border-primary-500/30 rounded-xl px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black shrink-0">KW</div>
                <div>
                  <p className="text-white font-bold">Kano State Public Works</p>
                  <p className="text-primary-300 text-sm">publicworks@kanostate.gov.ng</p>
                  <p className="text-slate-400 text-xs mt-1">Roads &amp; Infrastructure Directorate</p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <span className="text-primary-400 text-sm font-bold">2.5× faster</span>
              <span className="text-slate-500 text-sm"> than manual referrals</span>
            </div>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <p className="text-sm font-bold uppercase tracking-widest text-primary-400 mb-4">Step 2</p>
          <h2 className="text-4xl md:text-5xl font-black text-white leading-tight mb-6">
            We route it to the right agency. Automatically.
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            No more wondering who to call. Our routing engine maps every issue by category, state, and LGA to the specific government agency responsible — instantly.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Feature 3: Track — light section, left text, right timeline mockup ──
function FeatureTrack() {
  const history = [
    { status: 'Submitted', time: '2 days ago', color: 'bg-slate-400', textColor: 'text-slate-700', bg: 'bg-slate-50' },
    { status: 'Acknowledged', time: '1 day ago', color: 'bg-blue-400', textColor: 'text-blue-700', bg: 'bg-blue-50' },
    { status: 'In Progress', time: '5 hours ago', color: 'bg-yellow-400', textColor: 'text-yellow-700', bg: 'bg-yellow-50' },
  ];

  return (
    <div className="py-24 bg-white">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center max-w-6xl">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary-600 mb-4">Step 3</p>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6">
            Track every update. Publicly.
          </h2>
          <p className="text-lg text-slate-500 leading-relaxed mb-6">
            Every status change is logged and publicly visible. No more dead ends. Citizens, journalists, and NGOs can all see how quickly agencies respond.
          </p>
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-100">
            <span className="text-3xl font-black text-primary-600">40%</span>
            <p className="text-slate-600 text-sm leading-snug">fewer follow-up visits to government offices by citizens using NationWise</p>
          </div>
        </div>

        {/* Timeline mockup */}
        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-5">Status Timeline</p>
          <div className="relative space-y-4 before:absolute before:left-5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {history.map((entry, i) => (
              <div key={i} className="relative flex items-start gap-4 pl-2">
                <div className={`w-6 h-6 rounded-full ${entry.color} flex items-center justify-center shrink-0 z-10 mt-0.5 shadow-sm`}>
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
                <div className={`flex-1 ${entry.bg} rounded-xl px-4 py-3 border border-slate-100`}>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-bold ${entry.textColor}`}>{entry.status}</span>
                    <span className="text-xs text-slate-400">{entry.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {/* Pending resolved */}
            <div className="relative flex items-start gap-4 pl-2 opacity-40">
              <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-dashed border-slate-300 z-10 mt-0.5" />
              <div className="flex-1 bg-slate-50 rounded-xl px-4 py-3 border border-dashed border-slate-200">
                <span className="text-sm text-slate-400">Awaiting resolution...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeatureSections() {
  return (
    <>
      <FeatureReport />
      <FeatureRoute />
      <FeatureTrack />
    </>
  );
}
