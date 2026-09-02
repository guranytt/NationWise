export default function Footer() {
  return (
    <footer className="bg-paper text-ink py-12 border-t border-rule mt-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-rule pb-8 mb-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 border border-ink bg-paper flex items-center justify-center text-ink font-serif font-bold text-lg">
                N
              </div>
            <span className="font-serif font-bold text-xl text-ink tracking-tight uppercase">NationWise</span>
          </div>
          
          <div className="flex gap-6 font-sans text-sm uppercase tracking-widest">
            <a href="#" className="hover:underline transition-all">About the Registry</a>
            <a href="#" className="hover:underline transition-all">Privacy Policy</a>
            <a href="#" className="hover:underline transition-all">Terms of Access</a>
          </div>
        </div>
        
        <div className="font-sans text-xs text-ink opacity-70 text-center md:text-left">
          &copy; {new Date().getFullYear()} NationWise. Official Civic Accountability Platform.
        </div>
      </div>
    </footer>
  );
}
