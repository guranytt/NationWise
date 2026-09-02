export default function StatsBar() {
  const stats = [
    { value: '2,400+', label: 'Issues Reported' },
    { value: '36', label: 'States Covered' },
    { value: '150+', label: 'Agencies Connected' },
    { value: '78%', label: 'Resolution Rate' },
  ];

  return (
    <section className="bg-slate-900 py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x-0 md:divide-x divide-slate-700">
          {stats.map((stat, i) => (
            <div key={i} className={`px-10 py-6 text-center ${i > 0 ? 'border-t border-slate-700 md:border-t-0' : ''}`}>
              <div className="text-5xl md:text-6xl font-black text-white tracking-tight mb-2">
                {stat.value}
              </div>
              <div className="text-slate-400 text-sm font-medium uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
