import { Link, useLocation } from 'react-router';
import ThemeToggle from '../ui/ThemeToggle';
import { Menu, X, ShieldAlert, Users, Scale, FileBarChart2 } from 'lucide-react';
import { useState } from 'react';

export default function GlassNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Candidates', path: '/candidates', icon: <Users className="w-4 h-4 mr-2" /> },
    { name: 'Compare', path: '/compare', icon: <Scale className="w-4 h-4 mr-2" /> },
    { name: 'Issues', path: '/issues', icon: <FileBarChart2 className="w-4 h-4 mr-2" /> },
    { name: 'State of Nation', path: '/state-of-the-nation', icon: <ShieldAlert className="w-4 h-4 mr-2" /> },
  ];

  return (
    <nav className="fixed w-full z-50 top-0 left-0 border-b border-black/10 dark:border-white/10 bg-white/40 dark:bg-[#0A0F0D]/60 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="font-display font-bold text-xl tracking-tight text-nw-primary dark:text-nw-primary-light">
                NationWise
              </span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center text-sm font-medium transition-colors hover:text-nw-primary dark:hover:text-nw-primary-light ${
                  location.pathname.startsWith(link.path) 
                    ? 'text-nw-primary dark:text-nw-primary-light' 
                    : 'text-nw-text-light-muted dark:text-nw-text-dark-muted'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            
            <div className="pl-4 border-l border-black/10 dark:border-white/10 flex items-center space-x-4">
              <ThemeToggle />
              <Link 
                to="/report" 
                className="btn-primary flex items-center text-sm py-1.5"
              >
                Report Issue
              </Link>
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-4">
            <ThemeToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-nw-text-light-muted dark:text-nw-text-dark-muted hover:text-nw-text-light dark:hover:text-nw-text-dark"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden glass-panel border-b border-black/10 dark:border-white/10">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                  location.pathname.startsWith(link.path) 
                    ? 'bg-nw-primary/10 text-nw-primary dark:text-nw-primary-light' 
                    : 'text-nw-text-light dark:text-nw-text-dark hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {link.icon}
                {link.name}
              </Link>
            ))}
            <Link
              to="/report"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full flex justify-center items-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-nw-primary hover:bg-nw-primary-light"
            >
              Report Issue
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
