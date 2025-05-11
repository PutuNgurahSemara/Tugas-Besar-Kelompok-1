"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, useAnimation, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Link } from '@inertiajs/react';
import { cn } from "@/lib/utils";
// Removed generic Icon import, will render item.icon directly
// import { Icon } from "@/components/icon"; 
import type { LucideProps } from "lucide-react"; // Import LucideProps for better typing

export interface DockItemType {
  id: string; // Unique ID for key
  title: string;
  icon: React.ComponentType<LucideProps>; // Expecting a Lucide icon component directly
  href: string;
  onClick?: () => void;
  current?: boolean; // To indicate active route
}

interface FloatingDockProps {
  items: DockItemType[];
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
  onItemClick?: (item: DockItemType) => void; // Callback for item click
}

export const FloatingDock = ({
  items,
  className,
  itemClassName,
  iconClassName,
  onItemClick,
}: FloatingDockProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const controls = useAnimation();
  const dockRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(Infinity);

  useEffect(() => {
    controls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    });
  }, [controls]);
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dockRef.current) {
        const { clientX } = event;
        const { left } = dockRef.current.getBoundingClientRect();
        mouseX.set(clientX - left);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(Infinity);
    setHoveredIndex(null);
  };


  return (
    <motion.div
      ref={dockRef}
      className={cn(
        "fixed bottom-4 left-1/2 -translate-x-1/2", // Center horizontally
        "flex items-end h-14 p-2 gap-2",
        "bg-gray-800/70 dark:bg-gray-900/70 backdrop-blur-md",
        "rounded-full border border-gray-700 dark:border-gray-600 shadow-lg",
        className
      )}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
    >
      {items.map((item, idx) => {
        const distance = useTransform(mouseX, (val) => {
            const bounds = dockRef.current?.children[idx]?.getBoundingClientRect();
            return val && bounds ? val - bounds.left - bounds.width / 2 : 0;
        });

        // Spring animation for scale
        const widthSync = useSpring(
            useTransform(distance, [-100, 0, 100], [40, 80, 40]),
            {
                mass: 0.4,
                stiffness: 150,
                damping: 12,
            }
        );
        
        const commonLinkClasses = cn(
            "relative aspect-square rounded-full flex items-center justify-center cursor-pointer",
            "transition-all duration-200 ease-out",
            item.current ? "bg-emerald-600" : "bg-gray-700/50 hover:bg-gray-600/80 dark:bg-gray-800/50 dark:hover:bg-gray-700/80",
            itemClassName
        );
        
        const iconClasses = cn(
            "h-6 w-6 transition-colors duration-200",
            item.current ? "text-white" : "text-gray-300 dark:text-gray-400 group-hover:text-white",
            iconClassName
        );

        return (
          <motion.div
            key={item.id || item.title}
            className="relative group"
            onHoverStart={() => setHoveredIndex(idx)}
            onHoverEnd={() => setHoveredIndex(null)}
            style={{ width: widthSync }}
          >
            {hoveredIndex === idx && (
              <motion.div
                className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.15 }}
              >
                {item.title}
              </motion.div>
            )}
            <Link
              href={item.href}
              onClick={() => onItemClick && onItemClick(item)}
              className={commonLinkClasses}
              aria-label={item.title}
            >
              {/* Render the icon component directly */}
              <item.icon className={iconClasses} /> 
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
