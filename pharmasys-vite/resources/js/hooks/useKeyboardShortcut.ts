import { useEffect } from 'react';
import { router } from '@inertiajs/react';

export const useKeyboardShortcut = () => {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Prevent default browser behavior for shortcuts if needed
            // e.preventDefault();

            // Ctrl+K for Search (Placeholder)
            if (e.ctrlKey && (e.key === 'k' || e.key === 'K')) {
                console.log('Ctrl+K pressed - Search Action Placeholder');
                // Add search functionality here, e.g., open a search modal
            }

            // Ctrl+N for New Transaction (Sales Create)
            if (e.ctrlKey && (e.key === 'n' || e.key === 'N')) {
                console.log('Ctrl+N pressed - Navigating to New Sale');
                router.visit('/sales/create');
            }
        };

        document.addEventListener('keydown', handleKeyPress);

        // Cleanup function to remove the event listener
        return () => {
            document.removeEventListener('keydown', handleKeyPress);
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount
};
