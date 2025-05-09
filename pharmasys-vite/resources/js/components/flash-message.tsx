import { usePage } from '@inertiajs/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type FlashMessage as FlashMessageType } from '@/types'; // Pastikan tipe ini ada

interface FlashMessageProps {
    flash: FlashMessageType | null;
    className?: string;
}

export function FlashMessage({ flash, className }: FlashMessageProps) {
    if (!flash?.message) {
        return null;
    }

    const type = flash.type || 'info'; // Default to info

    const iconMap = {
        success: <CheckCircle className="h-4 w-4" />,
        error: <AlertCircle className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <AlertCircle className="h-4 w-4" />,
    };

    const variantMap = {
        success: 'default', // Sesuaikan variant Alert jika ada
        error: 'destructive',
        info: 'default', 
        warning: 'default',
    };

    return (
        <Alert 
            // @ts-ignore - Biarkan jika variantMap tidak 100% cocok dgn AlertProps['variant']
            variant={variantMap[type]} 
            className={cn('my-4', className)}
        >
            {iconMap[type]}
            <AlertTitle className="capitalize">{type}</AlertTitle>
            <AlertDescription>{flash.message}</AlertDescription>
        </Alert>
    );
} 