// resources/js/layouts/app-layout.tsx
import { type PropsWithChildren, useState, useEffect } from 'react';
import { Sidebar } from '@/components/app-sidebar';
import { AppHeader } from '@/components/app-header';
import { cn } from '@/lib/utils';
import { FlashMessage } from '@/components/flash-message';
import { usePage } from '@inertiajs/react';

export function AppLayout({ children }: PropsWithChildren) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [breakpoint, setBreakpoint] = useState<'mobile'|'tablet'|'desktop'>('desktop');

  // Deteksi breakpoint untuk layout responsif
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        setBreakpoint('mobile');
        setSidebarOpen(false); // Tutup sidebar secara default di mobile
      } else if (width >= 640 && width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
        setSidebarOpen(true); // Buka sidebar secara default di desktop
      }
    };

    // Initial check
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Main content dengan padding yang menyesuaikan dengan status sidebar
  const contentClasses = cn(
    "flex flex-col flex-grow min-h-screen bg-gray-100 dark:bg-gray-950 transition-all duration-300 ease-in-out", 
    {
      "pl-16": !sidebarOpen && breakpoint !== 'mobile',
      "pl-64": sidebarOpen && breakpoint !== 'mobile',
      "pl-0": breakpoint === 'mobile',
    }
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className={contentClasses}>
        <AppHeader />
        
        <main className="flex-grow p-4">
          {/* Notifikasi flash message global */}
          <FlashMessage flash={usePage().props.flash || (usePage().props.success ? { type: 'success', message: usePage().props.success } : usePage().props.error ? { type: 'error', message: usePage().props.error } : null)} />
          {children}
        </main>
      </div>
    </div>
  );
}

// Tambahkan default export
export default AppLayout;