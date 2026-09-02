export default function TrustSection() {
  return (
    <section className="py-24 bg-primary-50">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Transparent. Accountable. <br className="hidden md:block"/>For Every Nigerian.</h2>
          <p className="text-lg text-slate-700">We believe in a Nigeria where public services work for everyone. NationWise bridges the gap between citizens and government agencies.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary-100">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Public Visibility</h3>
            <p className="text-slate-600 leading-relaxed">All reported issues are public. When citizens act together to highlight problems, they can't be ignored.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary-100">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Direct Routing</h3>
            <p className="text-slate-600 leading-relaxed">No more wondering who to call. We map issues directly to the specific state or federal agency responsible.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-primary-100">
            <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Data-Driven Advocacy</h3>
            <p className="text-slate-600 leading-relaxed">Our data helps journalists, NGOs, and civil society organizations advocate for better infrastructure funding.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
