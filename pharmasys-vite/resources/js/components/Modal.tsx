// resources/js/components/modal.tsx
import { X } from 'lucide-react';
import { CardContainer } from './ui/3d-card'; // Import CardContainer
import { cn } from '@/lib/utils'; // Import cn from utils

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  containerClassName?: string; // Optional class for CardContainer
}

export const Modal = ({ isOpen, onClose, title, children, containerClassName }: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <CardContainer containerClassName={cn("w-full max-w-2xl", containerClassName)}>
        {/* Apply glossy/transparent effect and consistent sizing here */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-xl shadow-2xl p-6 w-full transform-gpu transition-all duration-300 ease-out">
          {/* Removed CardBody explicit usage, CardContainer handles the direct child */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
            <button 
              onClick={onClose} 
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          {children}
        </div>
      </CardContainer>
    </div>
  );
};
