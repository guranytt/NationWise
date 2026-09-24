import { Link } from 'react-router';
import { Shield, TrendingUp, ArrowRight, Users } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';

export default function LandingPage() {
  return (
    <div className="space-y-24 animate-in fade-in duration-700 pb-12">
      {/* Hero Section */}
      <section className="text-center space-y-8 mt-12 md:mt-24">
        <h1 className="text-5xl md:text-7xl font-display font-bold text-nw-text-light dark:text-nw-text-dark tracking-tight leading-tight">
          Empowering Civic <br className="hidden md:block" />
          <span className="text-nw-primary dark:text-nw-primary-light">Intelligence</span>
        </h1>
        <p className="text-lg md:text-xl text-nw-text-light-muted dark:text-nw-text-dark-muted max-w-2xl mx-auto leading-relaxed">
          Navigate Nigerian politics with AI-driven candidate insights, track the true cost of living, and report civic issues directly to responsible agencies.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
          <Link to="/candidates" className="btn-primary w-full sm:w-auto px-8 py-3.5 text-lg flex items-center justify-center group">
            Explore Candidates
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/report" className="btn-secondary w-full sm:w-auto px-8 py-3.5 text-lg flex items-center justify-center">
            Report an Issue
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <GlassCard hoverEffect className="space-y-4">
          <div className="w-12 h-12 bg-nw-primary/20 rounded-xl flex items-center justify-center mb-6">
            <Users className="w-6 h-6 text-nw-primary" />
          </div>
          <h3 className="text-xl font-semibold text-nw-text-light dark:text-nw-text-dark">Candidate Adventures</h3>
          <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted leading-relaxed">
            Dive into AI-generated interactive profiles of political candidates based on their official documents. Chat with their profile to get specific answers.
          </p>
        </GlassCard>

        <GlassCard hoverEffect className="space-y-4">
          <div className="w-12 h-12 bg-nw-accent/20 rounded-xl flex items-center justify-center mb-6">
            <TrendingUp className="w-6 h-6 text-nw-accent" />
          </div>
          <h3 className="text-xl font-semibold text-nw-text-light dark:text-nw-text-dark">State of the Nation</h3>
          <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted leading-relaxed">
            A crowdsourced, real-time price tracker for essential household goods. Watch trends across states with our verified outlier-filtering system.
          </p>
        </GlassCard>

        <GlassCard hoverEffect className="space-y-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-xl font-semibold text-nw-text-light dark:text-nw-text-dark">Direct Civic Action</h3>
          <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted leading-relaxed">
            Report infrastructure and civic issues in your area. Our system automatically routes and emails the correct government agency in real-time.
          </p>
        </GlassCard>
      </section>

      {/* Call to Action */}
      <section className="max-w-4xl mx-auto text-center bg-black/5 dark:bg-white/5 rounded-3xl p-12 border border-black/10 dark:border-white/10 backdrop-blur-sm">
        <h2 className="text-3xl font-display font-bold text-nw-text-light dark:text-nw-text-dark mb-4">
          Take part in building a better Nigeria
        </h2>
        <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted mb-8 max-w-xl mx-auto">
          Whether you're researching candidates, submitting market prices, or reporting an issue, every action contributes to transparency.
        </p>
        <Link to="/state-of-the-nation" className="btn-primary inline-flex px-8 py-3">
          View Market Data
        </Link>
      </section>
    </div>
  );
}
