export default function CategoriesGrid() {
  const categories = [
    { name: 'Roads & Transport', count: '1,204', icon: '🛣️', desc: 'Potholes, damaged bridges, traffic infrastructure' },
    { name: 'Power & Energy', count: '853', icon: '⚡', desc: 'Power outages, faulty transformers, illegal connections' },
    { name: 'Water & Sanitation', count: '412', icon: '💧', desc: 'Water supply failures, drainage collapses' },
    { name: 'Waste Management', count: '320', icon: '🗑️', desc: 'Uncollected refuse, illegal dumpsites' },
    { name: 'Healthcare', count: '156', icon: '🏥', desc: 'Drug shortages, broken equipment, staff absence' },
    { name: 'Education', count: '218', icon: '🏫', desc: 'School dilapidation, teacher absences, lack of materials' },
  ];

  return (
    <section className="py-24 bg-slate-50 border-t border-slate-100">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 items-end mb-14">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
              Every sector.<br />Every state.
            </h2>
          </div>
          <div>
            <p className="text-lg text-slate-500 leading-relaxed">
              NationWise covers the full spectrum of public infrastructure — routing each report to the specific agency mandated to fix it.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categories.map((cat, i) => (
            <div
              key={i}
              className="group bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:border-primary-100 hover:-translate-y-1 transition-all duration-200 cursor-pointer"
            >
              <div className="text-3xl mb-4">{cat.icon}</div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-1 rounded-full ml-2 whitespace-nowrap shrink-0">{cat.count}</span>
              </div>
              <p className="text-sm text-slate-500">{cat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
