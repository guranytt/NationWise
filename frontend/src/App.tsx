import { Outlet } from 'react-router';
import { ThemeProvider } from './contexts/ThemeContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <Outlet />
      <Toaster 
        position="bottom-right"
        toastOptions={{
          className: 'dark:bg-[#111916] dark:text-white dark:border dark:border-white/10 glass-card',
        }}
      />
    </ThemeProvider>
  );
}

export default App;
