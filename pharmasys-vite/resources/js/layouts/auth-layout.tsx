import * as React from 'react';
import { Head } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Pill, Bookmark, ClipboardList, Stethoscope, Heart } from 'lucide-react'; // Import icons

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string; 
  description?: string; 
  infoPanelContent?: React.ReactNode; 
}

export default function AuthLayout({ children, title, description, infoPanelContent }: AuthLayoutProps) {
  const hasInfoPanel = !!infoPanelContent;

  const pharmacyIcons = [
    { icon: Pill, color: 'text-green-500', delay: 0.2, top: '10%', left: '15%' },
    { icon: Bookmark, color: 'text-blue-500', delay: 0.4, top: '25%', left: '85%' },
    { icon: ClipboardList, color: 'text-amber-500', delay: 0.6, top: '85%', left: '25%' },
    { icon: Stethoscope, color: 'text-purple-500', delay: 0.8, top: '70%', left: '80%' },
    { icon: Heart, color: 'text-red-500', delay: 1.0, top: '5%', left: '70%' },
  ];

  return (
    <>
      <Head title={title || 'Login'} /> {/* Default title if not provided by page */}
      
      {/* Global Animated Background */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-950 dark:to-gray-900 overflow-hidden">
        {pharmacyIcons.map((iconInfo, index) => (
          <motion.div
            key={index}
            className={`absolute ${iconInfo.color} opacity-10 dark:opacity-20`}
            style={{
                top: iconInfo.top,
                left: iconInfo.left,
            }}
            initial={{ scale: 0, rotate: -30, opacity: 0, y: 0 }}
            animate={{ 
                scale: 1, 
                rotate: 0, 
                opacity: 0.1,
                y: ["0%", "2%", "0%"] 
            }}
            transition={{
                delay: iconInfo.delay, 
                duration: 1,       
                ease: "easeOut",   
                y: {
                    duration: 3 + Math.random() * 2, 
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut", 
                    delay: iconInfo.delay + 1 
                }
            }}
          >
            <iconInfo.icon size={100} />
          </motion.div>
        ))}
      </div>

      <div className={cn(
        'relative flex min-h-screen w-full', // z-index might be needed if content overlaps fixed background
        hasInfoPanel ? 'lg:grid lg:grid-cols-2' : 'items-center justify-center' 
      )}>
        {hasInfoPanel && (
          <div className="hidden lg:flex lg:flex-col items-center justify-center bg-gradient-to-br from-emerald-600 to-green-700 p-12 text-white dark:from-emerald-700 dark:to-green-800 relative z-10"> 
            {/* Added relative z-10 to ensure info panel is above the fixed background */}
            {infoPanelContent}
          </div>
        )}
        <div className={cn(
          'flex items-center justify-center w-full py-12 px-4 sm:px-6 lg:px-8',
          hasInfoPanel ? '' : 'max-w-md mx-auto' // Only apply max-w-md if it's a single centered panel
        )}>
          <div className="w-full max-w-md space-y-6">
            {(title || description) && ( // Only render this block if title or description is provided
              <div className="space-y-2 text-center">
                {title && <h1 className="text-3xl font-bold">{title}</h1>}
                {description && <p className="text-muted-foreground">{description}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
