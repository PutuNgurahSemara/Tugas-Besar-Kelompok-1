import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface AppLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  isCollapsed?: boolean;
}

export default function AppLogo({ 
  className, 
  size = 'md', 
  showText = false, 
  isCollapsed = false,
  ...props 
}: AppLogoProps) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Tambahkan animasi ketika logo pertama kali dimuat
    const logoIcon = document.querySelector('.logo-icon');
    if (logoIcon) {
      logoIcon.classList.add('animate-pulse');
      setTimeout(() => {
        logoIcon.classList.remove('animate-pulse');
      }, 1500);
    }
  }, []);
  
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11"
  }
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  // Jika collapsed, tidak menampilkan logo sama sekali kecuali pada header
  if (isCollapsed && !showText) {
    return null;
  }

  return (
    <div className={cn("flex items-center transition-all duration-300", className)}>
      <div 
        className={cn(
          "logo-icon bg-gradient-to-br from-green-500 to-green-700 text-white flex aspect-square items-center justify-center rounded-md shadow-md transform transition-transform hover:scale-105", 
          sizeClasses[size]
        )}
      >
        <span className="font-bold text-xs">PMS</span>
      </div>
      
      {showText && !isCollapsed && (
        <div className="overflow-hidden transition-all duration-300 ml-2">
          <h1 className={cn(
            "font-semibold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600 transition-opacity duration-300",
            textSizeClasses[size]
          )}>
            PharmaSys
          </h1>
        </div>
      )}
    </div>
  );
}
