import { Link } from 'react-router';
import { Button } from '../ui/Button';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded flex items-center justify-center text-white font-bold text-lg">
            N
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">Nation<span className="text-primary-600">Wise</span></span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/issues" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
            Issues
          </Link>
          <Link to="/candidates" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
            Candidates
          </Link>
          <Link to="/leaderboard" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
            Leaderboard
          </Link>
          <Link to="/compare" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">
            Compare
          </Link>
          <Link to="/report">
            <Button variant="primary">Report Issue</Button>
          </Link>
        </nav>

        {/* Mobile menu button could go here */}
        <div className="md:hidden">
          <Link to="/report">
            <Button variant="primary" size="sm">Report</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
