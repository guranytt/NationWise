import { Link } from 'react-router';

export default function Header() {
  return (
    <header className="bg-paper border-b border-rule sticky top-0 z-30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 border border-ink bg-paper flex items-center justify-center text-ink font-serif font-bold text-lg">
            N
          </div>
          <span className="font-serif font-bold text-xl text-ink tracking-tight uppercase">NationWise</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 font-sans text-sm">
          <Link to="/issues" className="text-ink hover:underline transition-all">
            Public Records
          </Link>
          <Link to="/candidates" className="text-ink hover:underline transition-all">
            Candidate Directory
          </Link>
          <Link to="/leaderboard" className="text-ink hover:underline transition-all">
            Rankings
          </Link>
          <Link to="/compare" className="text-ink hover:underline transition-all">
            Compare
          </Link>
          <Link to="/report" className="px-4 py-1.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors">
            File Report
          </Link>
        </nav>

        {/* Mobile menu button could go here */}
        <div className="md:hidden">
          <Link to="/report" className="font-sans text-xs px-3 py-1.5 border border-ink text-ink hover:bg-ink hover:text-paper transition-colors">
            Report
          </Link>
        </div>
      </div>
    </header>
  );
}
