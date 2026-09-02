export default function HowItWorks() {
  const steps = [
    {
      title: 'Report',
      description: 'See an infrastructure issue? Take a photo, provide details, and submit a report on NationWise.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      )
    },
    {
      title: 'Route',
      description: 'We automatically route your report to the correct government agency or parastatal responsible.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      title: 'Resolve',
      description: 'Track the status of your issue publicly. Agencies are held accountable for timely resolution.',
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-sm font-bold text-primary-600 uppercase tracking-widest mb-2">How It Works</h2>
          <h3 className="text-3xl md:text-4xl font-bold text-slate-900">From Report to Resolution</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-12 relative max-w-5xl mx-auto">
          {/* Connecting line for desktop */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-slate-100 border-t-2 border-dashed border-slate-200" />
          
          {steps.map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center group">
              <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-50 shadow-lg flex items-center justify-center text-primary-600 mb-6 group-hover:scale-110 group-hover:border-primary-100 transition-transform duration-300">
                {step.icon}
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h4>
              <p className="text-slate-600 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
