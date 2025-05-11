// Placeholder Page
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse, type Sale, type User, type SaleItem, type Produk } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Plus, Eye, Trash2 } from 'lucide-react'; // Added Eye, Trash2
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActionButton } from '@/components/action-button'; // Added ActionButton
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog'; // Added DeleteConfirmationDialog
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { FlashMessage } from '@/components/flash-message';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

// Definisikan tipe relasi jika belum ada
interface SaleWithRelations extends Sale {
    user: User | null; // Kasir yang mencatat
    items: (SaleItem & { produk: Produk | null })[]; // Item yang terjual
}

interface SalesIndexProps {
    sales: PaginatedResponse<SaleWithRelations>;
    filters: { 
        search: string | null;
        perPage: number;
    };
    [key: string]: any; // Add index signature
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Sales', href: route('sales.index') },
];

export default function SalesIndex() {
    const { sales: salesData, flash, filters } = usePage<SalesIndexProps>().props;
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        saleId: 0,
    });

    const handleDeleteClick = (id: number) => {
        setDeleteDialog({
            isOpen: true,
            saleId: id,
        });
    };

    const handleDeleteConfirm = () => {
        router.delete(route('sales.destroy', deleteDialog.saleId), {
            onSuccess: () => {
                setDeleteDialog({ isOpen: false, saleId: 0 });
            },
            onError: () => {
                setDeleteDialog({ isOpen: false, saleId: 0 });
            }
        });
    };

    const reloadData = useCallback(
        debounce((query, perPage) => {
            router.get(route('sales.index'), { search: query, perPage }, { preserveState: true, replace: true });
        }, 300),
        []
    );

    useEffect(() => {
        reloadData(searchQuery, filters.perPage);
    }, [searchQuery, filters.perPage, reloadData]);

    const handlePerPageChange = (value: string) => {
        router.get(route('sales.index'), { search: filters.search, perPage: parseInt(value, 10) }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales" />
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <CardTitle>Sales History</CardTitle>
                            <CardDescription>View past sales transactions.</CardDescription>
                        </div>
                         {/* Tombol ke halaman POS/Create Sale */}
                        <Link href={route('sales.create')}>
                            <Button size="sm"><Plus className="mr-2 h-4 w-4" /> Add Sale</Button>
                        </Link>
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
                                placeholder="Search by transaction ID..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                             /> 
                        </div>
                    </div>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead><TableHead>Items</TableHead><TableHead>Total Price</TableHead><TableHead>Date</TableHead><TableHead>Cashier</TableHead><TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {salesData.data.length > 0 ? (
                                salesData.data.map((sale) => (
                                    <TableRow key={sale.id}>
                                        <TableCell className="font-medium">{sale.id}</TableCell>
                                        <TableCell>
                                            {/* Tampilkan beberapa item pertama atau jumlah item */}
                                            {sale.items?.slice(0, 2).map(item => item.produk?.nama).join(', ')}
                                            {sale.items?.length > 2 ? ' ...' : ''}
                                            ({sale.items?.length || 0} items)
                                        </TableCell>
                                        <TableCell>Rp {sale.total_price?.toLocaleString('id-ID') ?? '-'}</TableCell> 
                                        <TableCell>{sale.created_at ? format(new Date(sale.created_at), 'dd MMM yyyy, HH:mm') : '-'}</TableCell>
                                        <TableCell>{sale.user?.name ?? '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Assuming a sales.show route exists for viewing details */}
                                                <ActionButton
                                                    icon={Eye}
                                                    tooltip="View Details"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('sales.show', sale.id))}
                                                />
                                                <ActionButton
                                                    icon={Trash2}
                                                    tooltip="Delete Sale"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteClick(sale.id)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        No sales records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination links={salesData.links} meta={salesData.meta} className="mt-4"/>
                </CardContent>
            </Card>
            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, saleId: 0 })}
                onConfirm={handleDeleteConfirm}
                title="Delete Sale"
                description={`Are you sure you want to delete this sale (ID: ${deleteDialog.saleId})? This action might not be reversible.`}
            />
        </AppLayout>
    );
}
