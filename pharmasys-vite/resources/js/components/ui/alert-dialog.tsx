import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({ open, onOpenChange, children }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
};

const AlertDialogContent: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ 
  children, 
  className 
}) => {
  return (
    <DialogContent className={cn("sm:max-w-[425px]", className)}>
      {children}
    </DialogContent>
  );
};

const AlertDialogHeader: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ 
  children, 
  className 
}) => {
  return (
    <DialogHeader className={className}>
      {children}
    </DialogHeader>
  );
};

const AlertDialogFooter: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ 
  children, 
  className 
}) => {
  return (
    <DialogFooter className={cn("gap-2", className)}>
      {children}
    </DialogFooter>
  );
};

const AlertDialogTitle: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ 
  children, 
  className 
}) => {
  return (
    <DialogTitle className={className}>
      {children}
    </DialogTitle>
  );
};

const AlertDialogDescription: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ 
  children, 
  className 
}) => {
  return (
    <DialogDescription className={className}>
      {children}
    </DialogDescription>
  );
};

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <Button className={className} {...props}>
      {children}
    </Button>
  );
};

const AlertDialogCancel: React.FC<AlertDialogActionProps> = ({ 
  children, 
  className,
  ...props 
}) => {
  return (
    <Button variant="ghost" className={cn("mt-2 sm:mt-0", className)} {...props}>
      {children}
    </Button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
