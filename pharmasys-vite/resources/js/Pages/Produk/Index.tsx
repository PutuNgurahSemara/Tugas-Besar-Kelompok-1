import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { ActionButton } from '@/components/action-button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Plus, Edit, Trash2, Eye, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { FlashMessage } from '@/components/flash-message';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
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
    total_stock: number; // Added from controller
    earliest_expiry: string | null; // Added from controller
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
            <div className="mt-6 rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Expiry Date</TableHead>
                            <TableHead className="w-[140px]">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {produkData.data.map((product: ProdukWithRelations) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.nama}</TableCell>
                                <TableCell>{product.category?.name || '-'}</TableCell>
                                <TableCell>{product.total_stock ?? '0'}</TableCell>
                                <TableCell>Rp {product.harga.toLocaleString('id-ID')}</TableCell>
                                <TableCell>
                                    {product.earliest_expiry ? (
                                        <div className="flex items-center">
                                            <span className={
                                                new Date(product.earliest_expiry) <= new Date() 
                                                    ? 'text-red-500 font-medium' 
                                                    : new Date(product.earliest_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
                                                        ? 'text-yellow-500 font-medium' 
                                                        : ''
                                            }>
                                                {format(new Date(product.earliest_expiry), 'dd MMM yyyy')}
                                            </span>
                                            {new Date(product.earliest_expiry) <= new Date() && (
                                                <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">
                                                    Expired
                                                </span>
                                            )}
                                            {new Date(product.earliest_expiry) > new Date() && 
                                             new Date(product.earliest_expiry) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                                                <span className="ml-2 bg-yellow-100 text-yellow-600 text-xs px-2 py-0.5 rounded-full">
                                                    Expiring Soon
                                                </span>
                                            )}
                                        </div>
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <ActionButton
                                            icon={Eye}
                                            tooltip="View details"
                                            variant="ghost"
                                            onClick={() => router.visit(route('produk.show', product.id))}
                                        />
                                        <ActionButton
                                            icon={Edit}
                                            tooltip="Edit product"
                                            variant="ghost"
                                            onClick={() => router.visit(route('produk.edit', product.id))}
                                        />
                                        <ActionButton
                                            icon={Trash2}
                                            tooltip="Delete product"
                                            variant="ghost"
                                            onClick={() => handleDeleteClick(product.id, product.nama)}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {produkData.data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No products found. Please add new products.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {produkData.data.length > 0 && (
                <div className="mt-4">
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
