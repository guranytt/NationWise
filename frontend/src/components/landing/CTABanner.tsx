import { Link } from 'react-router';
import { Button } from '../ui/Button';

export default function CTABanner() {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      {/* subtle green glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-primary-600/20 rounded-full blur-[80px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-4xl text-center relative z-10">
        <p className="text-sm font-bold uppercase tracking-widest text-primary-400 mb-4">Join the movement</p>
        <h2 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
          Your voice is the<br />
          <span className="text-primary-400">first step to change.</span>
        </h2>
        <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
          Thousands of Nigerians are already holding their government accountable. Report an issue today.
        </p>
        <Link to="/report">
          <Button size="lg" className="bg-primary-600 text-white hover:bg-primary-500 text-lg px-10 py-4 rounded-xl shadow-lg shadow-primary-900/50">
            Report an Issue Now
          </Button>
        </Link>
      </div>
    </section>
  );
}
