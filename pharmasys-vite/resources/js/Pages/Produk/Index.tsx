import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ActionButton } from '@/components/action-button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Plus, Edit, Trash2, Eye, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Keep for now, might remove if table completely gone
import { Pagination } from '@/components/pagination';
import { FlashMessage } from '@/components/flash-message';
import { Input } from '@/components/ui/input'; // For search bar
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // For perPage and new filters
import { Badge } from '@/components/ui/badge'; // Added Badge import
import { format, differenceInDays, isPast, addDays } from 'date-fns'; // Import more date-fns functions
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

interface Category {
    id: number;
    name: string;
}

interface Produk {
    id: number;
    nama: string;
    harga: number;
    // quantity: number | null; // This seems to be a direct column, we'll use total_stock from controller
    margin: number | null;
    // expired_at: string | null; // This seems to be a direct column, we'll use earliest_expiry from controller
    category_id: number | null;
    image: string | null;
    created_at: string;
    updated_at: string;
}

interface ProdukWithRelations extends Produk {
    category: Category | null;
    total_stock: number; 
    available_stock: number; // Assuming this is also available or can be derived from total_stock if sales not tracked here
    earliest_expiry: string | null;
    is_out_of_stock: boolean; // From accessor
    is_low_stock: boolean; // From accessor
}

interface ProdukIndexProps extends Record<string, unknown> {
    produk: PaginatedResponse<ProdukWithRelations>;
    filters: {
        search: string | null;
        perPage: number;
    };
    pageTitle?: string;
    links?: {
        all?: string;
        outstock?: string;
        expired?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Products', href: route('produk.index') },
];

export default function ProdukIndex() {
    const { produk: produkData, flash, filters, pageTitle, links } = usePage<Record<string, any>>().props;
    
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        productId: 0,
        productName: '',
    });

    const reloadData = useCallback(
        debounce((query, perPage) => {
            const currentUrl = window.location.pathname;
            router.get(currentUrl, { 
                search: query, 
                perPage: perPage 
            }, { 
                preserveState: true,
                replace: true 
            });
        }, 300),
        []
    );

    useEffect(() => {
        reloadData(searchQuery, filters.perPage);
    }, [searchQuery, filters.perPage, reloadData]);

    const handlePerPageChange = (value: string) => {
        const newPerPage = parseInt(value, 10);
        const currentUrl = window.location.pathname;
        router.get(currentUrl, { 
            search: filters.search,
            perPage: newPerPage 
        }, { 
            preserveState: true,
            replace: true 
        });
    };

    const handleDeleteClick = (id: number, name: string) => {
        setDeleteDialog({
            isOpen: true,
            productId: id,
            productName: name,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('produk.destroy', deleteDialog.productId), {
            onSuccess: () => {
                setDeleteDialog({ isOpen: false, productId: 0, productName: '' });
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle || "Products"} />
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-semibold">{pageTitle || 'Products'}</h1>
                <div className="flex flex-wrap items-center gap-2">
                    <ActionButton
                        icon={FileSpreadsheet}
                        tooltip="Export to Excel"
                        variant="secondary"
                        onClick={() => window.location.href = route('produk.export')}
                    >
                        Export
                    </ActionButton>
                    <ActionButton
                        icon={Plus}
                        tooltip="Add new product"
                        onClick={() => router.visit(route('produk.create'))}
                    >
                        Add Product
                    </ActionButton>
                </div>
            </div>
            <FlashMessage flash={flash} />

            {/* Search and Filter Controls */}
            <div className="my-4 flex flex-wrap items-center gap-4">
                <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={String(filters.perPage)} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Items per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {[10, 20, 50, 100].map(val => (
                            <SelectItem key={val} value={String(val)}>{val} per page</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select 
                    value={filters.sort_price || ''} 
                    onValueChange={(value) => {
                        const currentUrl = window.location.pathname;
                        router.get(currentUrl, { 
                            ...filters,
                            search: searchQuery,
                            sort_price: value === 'default_sort' ? undefined : value // Handle special value
                        }, { 
                            preserveState: true, 
                            replace: true 
                        });
                    }}
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by price" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="default_sort">Newest First</SelectItem> {/* Renamed label */}
                        <SelectItem value="asc">Price: Low to High</SelectItem>
                        <SelectItem value="desc">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
                {/* TODO: Add "Newly Added" filter here later */}
            </div>
            
            {/* Links for special views - can be styled as buttons or tabs */}
            <div className="mb-4 flex space-x-2">
                {links?.all && <Link href={links.all}><Button variant={pageTitle === 'All Products' ? 'default' : 'secondary'}>All Products</Button></Link>}
                {links?.outstock && <Link href={links.outstock}><Button variant={pageTitle === 'Low Stock Products' ? 'default' : 'secondary'}>Low Stock</Button></Link>}
                {links?.expired && <Link href={links.expired}><Button variant={pageTitle === 'Expired and Near-Expiry Products' ? 'default' : 'secondary'}>Expired/Near Expiry</Button></Link>}
            </div>

            {/* Card Grid Layout */}
            {produkData.data.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {produkData.data.map((product: ProdukWithRelations) => {
                        const expiryDate = product.earliest_expiry ? new Date(product.earliest_expiry) : null;
                        let expiryText = '-';
                        let expiryBadgeClass = '';

                        if (expiryDate) {
                            const daysLeft = differenceInDays(expiryDate, new Date());
                            expiryText = format(expiryDate, 'dd MMM yyyy');
                            if (isPast(expiryDate)) {
                                expiryBadgeClass = 'bg-red-500 text-white';
                                expiryText += ` (Expired ${differenceInDays(new Date(), expiryDate)} days ago)`;
                            } else if (daysLeft <= 30) {
                                expiryBadgeClass = 'bg-yellow-500 text-black';
                                expiryText += ` (${daysLeft} days left)`;
                            }
                        }

                        return (
                            <Card 
                                key={product.id} 
                                className="flex flex-col transition-all duration-300 ease-in-out hover:scale-102 hover:shadow-lg dark:hover:border-slate-700"
                            >
                                <CardHeader>
                                    {product.image && (
                                        <img 
                                            src={`/storage/${product.image}`} 
                                            alt={product.nama} 
                                            className="w-full h-40 object-cover rounded-t-md mb-2" 
                                        />
                                    )}
                                    <CardTitle className="text-lg truncate">{product.nama}</CardTitle>
                                    <CardDescription>{product.category?.name || 'No category'}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-2">
                                    <div className="flex items-center">
                                        <p className="mr-2"><span className="font-semibold">Stock:</span> {product.available_stock ?? '0'}</p>
                                        {product.is_out_of_stock && (
                                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                                        )}
                                        {!product.is_out_of_stock && product.is_low_stock && (
                                            <Badge variant="secondary" className="bg-yellow-500 text-black text-xs">Low Stock</Badge>
                                        )}
                                    </div>
                                    <p><span className="font-semibold">Price:</span> Rp {product.harga.toLocaleString('id-ID')}</p>
                                    <div>
                                        <span className="font-semibold">Expiry: </span>
                                        {expiryDate ? (
                                            <Badge className={expiryBadgeClass}>{expiryText}</Badge>
                                        ) : (
                                            <span>-</span>
                                        )}
                                    </div>
                                </CardContent>
                                <div className="p-4 border-t mt-auto">
                                    <div className="flex items-center justify-end gap-2">
                                        <ActionButton
                                            icon={Eye}
                                            tooltip="View details"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.visit(route('produk.show', product.id))}
                                        />
                                        <ActionButton
                                            icon={Edit}
                                            tooltip="Edit product"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => router.visit(route('produk.edit', product.id))}
                                        />
                                        <ActionButton
                                            icon={Trash2}
                                            tooltip="Delete product"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteClick(product.id, product.nama)}
                                        />
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10">
                    <p className="text-xl text-gray-500">No products found.</p>
                    <p className="mt-2">Please add new products or adjust your filters.</p>
                </div>
            )}
            
            {produkData.data.length > 0 && (
                <div className="mt-6">
                    <Pagination links={produkData.links} meta={produkData.meta} />
                </div>
            )}
            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, productId: 0, productName: '' })}
                onConfirm={handleDeleteConfirm}
                title="Delete Product"
                description={`Are you sure you want to delete the product "${deleteDialog.productName}"? Related sales data will remain stored.`}
            />
        </AppLayout>
    );
}
