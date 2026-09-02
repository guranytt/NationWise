import { Link } from 'react-router';
import { Button } from '../ui/Button';
import CountUp from '../ui/CountUp';

export default function HeroSection() {
  const today = new Date().toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <section className="pt-16 pb-12 border-b border-rule bg-paper">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-left mb-6">
          <p className="text-sm font-sans text-ink uppercase tracking-wide border-b border-rule pb-4 mb-8 inline-block w-full">
            Lagos, Nigeria — {today}
          </p>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-ink leading-tight mb-8 max-w-5xl">
            <CountUp end={347} /> declared candidates. <br className="hidden md:block"/>
            <CountUp end={1203} /> issues reported. <br className="hidden md:block"/>
            <CountUp end={36} /> states.
          </h1>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link to="/report">
              <Button size="lg" className="bg-ink text-paper hover:bg-ink/90 font-sans px-8 rounded-none border border-ink">
                File a Report
              </Button>
            </Link>
            <Link to="/candidates">
              <Button variant="outline" size="lg" className="text-ink border-rule hover:bg-rule/20 font-sans px-8 rounded-none">
                View Dossiers
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
