import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Sale, type User, type SaleItem, type Produk } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermission } from '@/hooks/use-permission';
import { useState } from 'react';

interface SaleItemWithProduk extends SaleItem {
    produk: Produk | null;
}

interface SaleFull extends Sale {
    user: User | null;
    items: SaleItemWithProduk[];
}

interface SalesShowProps {
    sale: SaleFull;
    canDelete: boolean;
}

export default function SalesShow({ sale, canDelete }: SalesShowProps) {
    const { hasPermission } = usePermission();
    const [deleteDialog, setDeleteDialog] = useState({
        isOpen: false,
        saleId: 0,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Sales', href: route('sales.index') },
        { title: `Sale #${sale.id}`, href: route('sales.show', sale.id) },
    ];

    const totalItems = sale.items.reduce((sum, item) => sum + item.quantity, 0);

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
                router.visit(route('sales.index'));
            },
            onError: () => {
                setDeleteDialog({ isOpen: false, saleId: 0 });
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Sale Detail #${sale.id}`} />

            <div className="flex justify-between items-center mb-4">
                <Link href={route('sales.index')}>
                    <Button variant="secondary">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Sales List
                    </Button>
                </Link>
                {canDelete && hasPermission('delete-sale') && (
                    <Button 
                        variant="destructive"
                        onClick={() => handleDeleteClick(sale.id)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Sale
                    </Button>
                )}
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Sale Detail - Transaction ID: {sale.id}</CardTitle>
                    <CardDescription>
                        Date: {sale.created_at ? format(new Date(sale.created_at), 'dd MMM yyyy, HH:mm:ss') : 'N/A'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p><strong>Cashier:</strong> {sale.user?.name ?? 'N/A'}</p>
                            <p><strong>Payment Method:</strong> {sale.payment_method ?? 'N/A'}</p>
                        </div>
                        <div>
                            <p><strong>Total Items:</strong> {totalItems}</p>
                            <p><strong>Amount Paid:</strong> Rp {sale.amount_paid?.toLocaleString('id-ID') ?? 'N/A'}</p>
                            <p><strong>Total Price:</strong> Rp {sale.total_price.toLocaleString('id-ID')}</p>
                            <p><strong>Change:</strong> Rp {((sale.amount_paid ?? 0) - sale.total_price).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Items Sold</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Product Name</TableHead>
                                <TableHead className="text-right">Quantity</TableHead>
                                <TableHead className="text-right">Price per Item</TableHead>
                                <TableHead className="text-right">Subtotal</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sale.items && sale.items.length > 0 ? (
                                sale.items.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{item.produk?.nama ?? 'Product not found'}</TableCell>
                                        <TableCell className="text-right">{item.quantity}</TableCell>
                                        <TableCell className="text-right">Rp {item.price.toLocaleString('id-ID')}</TableCell>
                                        <TableCell className="text-right">Rp {(item.quantity * item.price).toLocaleString('id-ID')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">No items in this sale.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <DeleteConfirmationDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, saleId: 0 })}
                onConfirm={handleDeleteConfirm}
                title="Delete Sale"
                description={`Are you sure you want to delete this sale? This action cannot be undone.`}
            />
        </AppLayout>
    );
}
