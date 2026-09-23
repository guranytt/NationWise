import { Link } from 'react-router';

export default function Footer() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10 bg-white/40 dark:bg-white/5 backdrop-blur-md mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="font-display font-bold text-xl text-nw-primary dark:text-nw-primary-light mb-4 block">
              NationWise
            </Link>
            <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted text-sm max-w-md">
              Empowering citizens with AI-driven insights into political candidates, tracking household economics, and streamlining civic issue reporting.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-nw-text-light dark:text-nw-text-dark mb-4 text-sm uppercase tracking-wider">Features</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/candidates" className="text-nw-text-light-muted hover:text-nw-primary transition-colors dark:text-nw-text-dark-muted dark:hover:text-nw-primary-light">Candidate Directory</Link>
              </li>
              <li>
                <Link to="/compare" className="text-nw-text-light-muted hover:text-nw-primary transition-colors dark:text-nw-text-dark-muted dark:hover:text-nw-primary-light">Compare Candidates</Link>
              </li>
              <li>
                <Link to="/state-of-the-nation" className="text-nw-text-light-muted hover:text-nw-primary transition-colors dark:text-nw-text-dark-muted dark:hover:text-nw-primary-light">State of the Nation</Link>
              </li>
              <li>
                <Link to="/issues" className="text-nw-text-light-muted hover:text-nw-primary transition-colors dark:text-nw-text-dark-muted dark:hover:text-nw-primary-light">Civic Issues</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-nw-text-light dark:text-nw-text-dark mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-nw-text-light-muted hover:text-nw-primary transition-colors dark:text-nw-text-dark-muted dark:hover:text-nw-primary-light">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="text-nw-text-light-muted hover:text-nw-primary transition-colors dark:text-nw-text-dark-muted dark:hover:text-nw-primary-light">Terms of Service</a>
              </li>
              <li>
                <a href="#" className="text-nw-text-light-muted hover:text-nw-primary transition-colors dark:text-nw-text-dark-muted dark:hover:text-nw-primary-light">Data Sources</a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-black/10 dark:border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-nw-text-light-muted dark:text-nw-text-dark-muted text-xs">
            &copy; {new Date().getFullYear()} NationWise. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
