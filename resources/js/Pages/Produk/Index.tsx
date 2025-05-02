import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse, type Produk, type Category } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Plus } from 'lucide-react';
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

interface ProdukWithRelations extends Produk {
    category: Category | null;
}

interface ProdukIndexProps {
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
    const { produk: produkData, flash, filters, pageTitle, links } = usePage<ProdukIndexProps>().props;
    
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={pageTitle || "Products"} />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <CardTitle>{pageTitle || 'Products'}</CardTitle>
                            <CardDescription>Manage your products.</CardDescription>
                        </div>
                        <div className="flex space-x-2">
                            {links && (
                                <div className="flex space-x-2 mr-4">
                                    {links.all && <Link href={links.all} className="text-sm text-blue-500 hover:underline">All Products</Link>}
                                    {links.outstock && <Link href={links.outstock} className="text-sm text-blue-500 hover:underline">Out of Stock</Link>}
                                    {links.expired && <Link href={links.expired} className="text-sm text-blue-500 hover:underline">Expired</Link>}
                                </div>
                            )}
                            <Link href={route('produk.create')}>
                                <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
                            </Link>
                        </div>
                    </div>
                    <FlashMessage flash={flash} />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                            <Select value={String(filters.perPage)} onValueChange={handlePerPageChange}>
                                <SelectTrigger className="w-[70px]">
                                    <SelectValue placeholder={filters.perPage} />
                                </SelectTrigger>
                                <SelectContent>
                                    {[10, 25, 50, 100].map(val => (
                                        <SelectItem key={val} value={String(val)}>{val}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">entries</span>
                        </div>
                        <div className="w-full max-w-sm">
                            <Input 
                                type="search" 
                                placeholder="Search products..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Margin</TableHead>
                                <TableHead>Expiry Date</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {produkData.data.length > 0 ? (
                                produkData.data.map((p) => (
                                    <TableRow key={p.id}>
                                        <TableCell className="font-medium flex items-center space-x-2">
                                            {p.image ? (
                                                <img src={`/storage/${p.image}`} alt={p.nama} className="h-10 w-10 object-cover rounded" />
                                            ) : (
                                                <div className="h-10 w-10 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                                                    No img
                                                </div>
                                            )}
                                            <span>{p.nama}</span>
                                        </TableCell>
                                        <TableCell>{p.category?.name ?? '-'}</TableCell>
                                        <TableCell>Rp {p.harga.toLocaleString('id-ID')}</TableCell>
                                        <TableCell>{p.quantity ?? '-'}</TableCell>
                                        <TableCell>{p.margin != null ? `${p.margin}%` : '-'}</TableCell>
                                        <TableCell>
                                            {p.expired_at ? format(new Date(p.expired_at), 'dd MMM yyyy') : '-'}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Link href={route('produk.edit', p.id)}>
                                                <Button variant="outline" size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                                                    Edit
                                                </Button>
                                            </Link>
                                            <Link
                                                href={route('produk.destroy', p.id)}
                                                method="delete"
                                                as="button" 
                                                onBefore={() => confirm('Are you sure?')}
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 text-white px-3 py-2"
                                            >
                                                Delete
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        No products found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination links={produkData.links} meta={produkData.meta} className="mt-4"/>
                </CardContent>
            </Card>
        </AppLayout>
    );
} 