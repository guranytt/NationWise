export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-8 border-t border-slate-800">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl text-white tracking-tight">Nation<span className="text-primary-500">Wise</span></span>
          </div>
          
          <div className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} NationWise. Civic Accountability Platform for Nigeria.
          </div>
          
          <div className="flex gap-4 text-sm">
            <a href="#" className="hover:text-white transition-colors">About</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
