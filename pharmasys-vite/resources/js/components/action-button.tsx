import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import React from 'react';

interface ActionButtonProps extends ButtonProps {
  icon: LucideIcon;
  tooltip: string;
  children?: React.ReactNode;
  showText?: boolean;
  className?: string;
}

export function ActionButton({
  icon: Icon,
  tooltip,
  children,
  showText = false,
  className,
  ...props
}: ActionButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size={showText ? 'default' : 'icon'}
            className={cn(
              'transition-all duration-200 hover:scale-105',
              className
            )}
            {...props}
          >
            <Icon className={cn('h-4 w-4', showText && 'mr-2')} />
            {showText && children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}