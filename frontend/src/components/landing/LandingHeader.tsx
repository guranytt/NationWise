import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Button } from '../ui/Button';

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-sm py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold text-lg">
            N
          </div>
          <span className={`font-bold text-xl tracking-tight transition-colors ${
            scrolled ? 'text-slate-900' : 'text-white'
          }`}>
            Nation<span className={scrolled ? 'text-primary-600' : 'text-primary-300'}>Wise</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link 
            to="/issues" 
            className={`font-medium transition-colors ${
              scrolled ? 'text-slate-600 hover:text-primary-600' : 'text-slate-100 hover:text-white'
            }`}
          >
            Issue Feed
          </Link>
          <Link to="/report">
            <Button variant={scrolled ? 'primary' : 'outline'} className={!scrolled ? 'bg-white/10 text-white border-white/30 hover:bg-white/20' : ''}>
              Report Issue
            </Button>
          </Link>
        </nav>

        <div className="md:hidden">
          <Link to="/report">
            <Button variant={scrolled ? 'primary' : 'outline'} size="sm" className={!scrolled ? 'bg-white/10 text-white border-white/30' : ''}>
              Report
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
