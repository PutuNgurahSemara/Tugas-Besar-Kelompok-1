import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ActionButton } from '@/components/action-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, differenceInDays, isPast, addDays } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';
// Using window.toast instead of sonner to avoid dependency issues
import { Search, PackagePlus, Package, Edit } from 'lucide-react';

// Define auth type for use in the component
interface AuthType {
    user: {
        id: number;
        name: string;
        email: string;
        // Add other user properties as needed
    };
}

// Extend the Window interface to include Laravel and toast
interface CustomWindow extends Window {
    Laravel?: {
        user?: {
            id: number;
            name: string;
            email: string;
            // Add other user properties as needed
        };
    };
    toast?: {
        success: (message: string) => void;
        error: (message: string) => void;
    };
}

declare const window: CustomWindow;

interface Category {
    id: number;
    name: string;
}

interface Produk {
    id: number;
    nama: string;
    harga: number;
    margin: number | null;
    category_id: number | null;
    image: string | null;
    status: string;
    created_at: string;
    updated_at: string;
}

interface ProdukWithRelations extends Produk {
    category: Category | null;
    total_stock: number;
    earliest_expiry: string | null;
}

interface DraftsProps {
    produk: PaginatedResponse<ProdukWithRelations>;
    filters: {
        search?: string;
        perPage?: number;
    };
    links: {
        index: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Products', href: route('produk.index') },
    { title: 'Draft Products', href: route('produk.drafts') },
];

export default function Drafts({ produk, filters, links }: DraftsProps) {
    // Simple auth object with default values
    const auth: AuthType = {
        user: {
            id: 0,
            name: 'Admin',
            email: 'admin@example.com'
        }
    };
    const [search, setSearch] = useState(filters.search || '');
    const [perPage, setPerPage] = useState(filters.perPage?.toString() || '10');
    const [isActivating, setIsActivating] = useState<number | null>(null);

    // Handle search with debounce
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            router.get(
                route('produk.drafts'),
                { search: value, perPage },
                { preserveState: true, replace: true }
            );
        }, 500),
        [perPage]
    );

    // Handle per page change
    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        router.get(
            route('produk.drafts'),
            { search, perPage: value },
            { preserveState: true, replace: true }
        );
    };

    // Handle activate product
    const handleActivate = async (id: number) => {
        if (!confirm('Are you sure you want to activate this product? It will be available in the main product list.')) {
            return;
        }

        setIsActivating(id);
        try {
            const response = await fetch(route('produk.activate', id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const data = await response.json();
            
            if (response.ok) {
                // Using window.toast instead of sonner
                window.toast?.success('Product activated successfully');
                router.reload({ only: ['produk'] });
            } else {
                throw new Error(data.message || 'Failed to activate product');
            }
        } catch (error) {
            console.error('Error activating product:', error);
            window.toast?.error('Failed to activate product');
        } finally {
            setIsActivating(null);
        }
    };

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Draft Products" />
            <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Draft Products</h1>
                        <p className="text-muted-foreground">
                            Review and activate products that have been purchased but not yet activated
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={links.index}>
                            View Active Products
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                            <div className="relative w-full md:max-w-sm">
                                <Input
                                    type="search"
                                    placeholder="Search products..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        debouncedSearch(e.target.value);
                                    }}
                                    className="pl-8"
                                />
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={perPage}
                                    onValueChange={handlePerPageChange}
                                >
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Items per page" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10 per page</SelectItem>
                                        <SelectItem value="25">25 per page</SelectItem>
                                        <SelectItem value="50">50 per page</SelectItem>
                                        <SelectItem value="100">100 per page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {produk.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <PackagePlus className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-medium">No draft products</h3>
                                <p className="mb-4 mt-1 max-w-xs text-sm text-muted-foreground">
                                    All purchased products have been activated.
                                </p>
                                <Button asChild>
                                    <Link href={links.index}>Go to active products</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">Stock</TableHead>
                                            <TableHead>Expiry Date</TableHead>
                                            <TableHead className="text-right">Price</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {produk.data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        {item.image ? (
                                                            <img
                                                                src={`/storage/${item.image}`}
                                                                alt={item.nama}
                                                                className="h-10 w-10 rounded-md object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                                                                <Package className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-medium">{item.nama}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                Added {format(new Date(item.created_at), 'MMM d, yyyy')}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {item.category?.name || 'Uncategorized'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant={item.total_stock > 0 ? 'default' : 'destructive'}>
                                                        {item.total_stock} in stock
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {item.earliest_expiry ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Badge 
                                                                        variant={
                                                                            isPast(new Date(item.earliest_expiry)) 
                                                                                ? 'destructive' as const
                                                                                : differenceInDays(new Date(item.earliest_expiry), new Date()) <= 30 
                                                                                    ? 'secondary' as const
                                                                                    : 'default' as const
                                                                        }
                                                                    >
                                                                        {format(new Date(item.earliest_expiry), 'MMM d, yyyy')}
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {isPast(new Date(item.earliest_expiry)) 
                                                                        ? 'Expired' 
                                                                        : `Expires in ${differenceInDays(new Date(item.earliest_expiry), new Date())} days`
                                                                    }
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <Badge variant="secondary">No expiry</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 0,
                                                        maximumFractionDigits: 0,
                                                    }).format(item.harga)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="secondary"
                                                            size="sm"
                                                            asChild
                                                            className="h-8"
                                                        >
                                                            <Link href={route('produk.edit', item.id)}>
                                                                <Edit className="mr-1 h-3 w-3" /> Edit
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={() => handleActivate(item.id)}
                                                            disabled={isActivating === item.id}
                                                        >
                                                            {isActivating === item.id ? 'Activating...' : 'Activate'}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {produk.data.length > 0 && (
                            <div className="mt-4">
                                <Pagination links={produk.links} meta={produk as any} />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
