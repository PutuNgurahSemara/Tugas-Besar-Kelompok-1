import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';

interface PurchaseShowProps {
    purchase: {
        id: number;
        [key: string]: any;
    };
    [key: string]: any;  // Add index signature for PageProps
}

export default function PurchaseShow() {
    const { purchase } = usePage<PurchaseShowProps>().props;
    
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Purchases', href: route('purchases.index') },
        { title: 'View Purchase', href: route('purchases.show', purchase.id) },
    ];

    // ...rest of the component code...
}