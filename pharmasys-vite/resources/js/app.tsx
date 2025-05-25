import './bootstrap';
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { ThemeProvider } from '@/components/theme-provider';
import { Suspense, lazy, ComponentType } from 'react';
import { ToastContainer } from '@/components/ui/toast';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Tambahkan loading indicator
const LoadingIndicator = () => (
  <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Hilangkan preload komponen untuk mencegah error
// const preloadComponents = () => {
//   // Preload yang menyebabkan masalah
// };

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        try {
            // Menggunakan dynamic import untuk meningkatkan performance
            const pages = import.meta.glob('./Pages/**/*.tsx');
            
            // Gunakan lazy loading dengan suspense untuk meningkatkan performa
            const lazyComponent = lazy(() => {
                const page = pages[`./Pages/${name}.tsx`];
                
                if (!page) {
                    throw new Error(`Page not found: ${name}`);
                }
                
                return page() as Promise<{ default: ComponentType<any> }>;
            });
            
            // Jangan lakukan preload untuk mencegah error
            
            return lazyComponent;
        } catch (error) {
            console.error('Error resolving page component:', error);
            throw error;
        }
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        try {
            root.render(
                <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
                    <Suspense fallback={<LoadingIndicator />}>
                        <App {...props} />
                        <ToastContainer />
                    </Suspense>
                </ThemeProvider>
            );
        } catch (error) {
            console.error('Error rendering app:', error);
            // Fallback jika terjadi error
            root.render(
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column' }}>
                    <h1 style={{ color: 'red', marginBottom: '20px' }}>Terjadi kesalahan saat memuat aplikasi</h1>
                    <p>Silakan refresh halaman atau hubungi administrator.</p>
                </div>
            );
        }
    },
    progress: {
        color: '#16a34a', // Warna hijau - primary color
        delay: 150, // Kurangi delay untuk feedback yang lebih cepat
        includeCSS: true,
        showSpinner: true,
    },
});