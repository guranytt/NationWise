import { Outlet } from 'react-router';
import LandingHeader from '../landing/LandingHeader';
import Footer from './Footer';

export default function LandingLayout() {
  return (
    <div className="flex flex-col min-h-screen font-sans text-slate-900 bg-white">
      <LandingHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
