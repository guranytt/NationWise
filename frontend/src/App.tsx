import { Outlet } from 'react-router';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';

export default function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
