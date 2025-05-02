// Bootstrap file for initializing global components and configurations

// Performance optimizations
// Detect connection speed
function detectConnectionSpeed() {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    if (connection) {
        // Save to localStorage for use throughout the app
        localStorage.setItem('connectionType', connection.effectiveType);
        localStorage.setItem('connectionSpeed', connection.downlink + 'Mbps');
        
        // Add change listener
        connection.addEventListener('change', () => {
            localStorage.setItem('connectionType', connection.effectiveType);
            localStorage.setItem('connectionSpeed', connection.downlink + 'Mbps');
        });
    }
}

// Detect device capability
function detectDeviceCapability() {
    // Check memory if available
    if ((navigator as any).deviceMemory) {
        localStorage.setItem('deviceMemory', (navigator as any).deviceMemory + 'GB');
    }
    
    // Check hardware concurrency (CPU cores)
    if (navigator.hardwareConcurrency) {
        localStorage.setItem('cpuCores', navigator.hardwareConcurrency.toString());
    }
}

// Initialize performance measurements
function initPerformance() {
    if (window.performance) {
        // Add listener for important page metrics
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                // Log important metrics 
                if (entry.entryType === 'navigation') {
                    const navigationEntry = entry as PerformanceNavigationTiming;
                    console.log('Page load time:', navigationEntry.loadEventEnd - navigationEntry.startTime);
                }
            }
        });
        
        observer.observe({ entryTypes: ['navigation', 'resource'] });
    }
}

// Run optimizations
function initOptimizations() {
    detectConnectionSpeed();
    detectDeviceCapability();
    initPerformance();
    
    // Add theme change listener to save theme preferences
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', (e) => {
        const theme = e.matches ? 'dark' : 'light';
        
        // Only set if user hasn't manually chosen a theme
        if (!localStorage.getItem('vite-ui-theme')) {
            document.documentElement.classList.toggle('dark', e.matches);
        }
    });
    
    // Initialize IntersectionObserver for lazy loading components
    window.lazyLoadObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyElement = entry.target as HTMLElement;
                    if (lazyElement.dataset.src) {
                        lazyElement.setAttribute('src', lazyElement.dataset.src);
                        delete lazyElement.dataset.src;
                    }
                    observer.unobserve(lazyElement);
                }
            });
        },
        { rootMargin: '200px' }
    );
}

// Call on app boot
document.addEventListener('DOMContentLoaded', initOptimizations);

// Add global declarations
declare global {
    interface Window {
        lazyLoadObserver: IntersectionObserver;
    }
}

export {}; 