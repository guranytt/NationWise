import { Outlet } from 'react-router';
import GlassNavbar from './GlassNavbar';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated gradient mesh background for dark mode */}
      <div className="fixed inset-0 z-[-1] hidden dark:block">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-800/10 blur-[120px] mix-blend-screen" />
      </div>
      
      <GlassNavbar />
      <main className="flex-grow pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
