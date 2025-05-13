import { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import { router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SaleItem {
    id: number;
    quantity: number;
    price: number;
    produk: {
        nama: string;
    }
}

interface Sale {
    id: number;
    kode_transaksi: string;
    total_price: number;
    created_at: string;
    items: SaleItem[];
    user: {
        name: string;
        role: string;
    };
}

interface Props {
    sales: {
        data: Sale[];
        links: any;
        meta: any;
    };
}

export default function SalesHistory({ sales }: Props) {
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const canDelete = (window as any).auth?.user?.role === 'admin';

    const handleDelete = (id: number) => {
        if (confirm('Yakin ingin menghapus transaksi ini?')) {
            router.delete(route('sales.destroy', id), {
                onSuccess: () => {
                    // The page will automatically refresh with updated data
                },
            });
        }
    };

    return (
        <AppLayout>
            <Head title="Riwayat Transaksi" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Riwayat Transaksi</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Kasir</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.data.map((sale, index) => (
                                        <TableRow key={sale.id}>
                                            <TableCell>{sales.meta.from + index}</TableCell>
                                            <TableCell>{format(new Date(sale.created_at), 'dd MMM yyyy HH:mm')}</TableCell>
                                            <TableCell>{sale.user?.name || '-'}</TableCell>
                                            <TableCell>Rp {sale.total_price.toLocaleString('id-ID')}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        onClick={() => {
                                                            setSelectedSale(sale);
                                                            setShowDetailModal(true);
                                                        }}
                                                        variant="secondary"
                                                        size="sm"
                                                    >
                                                        Detail
                                                    </Button>
                                                    {canDelete && (
                                                        <Button
                                                            onClick={() => handleDelete(sale.id)}
                                                            variant="destructive"
                                                            size="sm"
                                                        >
                                                            Hapus
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Detail Transaksi</DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="mt-4 max-h-[60vh]">
                        {selectedSale && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>Tanggal</div>
                                    <div>{format(new Date(selectedSale.created_at), 'dd MMM yyyy HH:mm')}</div>
                                    <div>Kasir</div>
                                    <div>{selectedSale.user?.name || '-'}</div>
                                </div>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Produk</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Harga</TableHead>
                                            <TableHead>Subtotal</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedSale.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>{item.produk.nama}</TableCell>
                                                <TableCell>{item.quantity}</TableCell>
                                                <TableCell>Rp {item.price.toLocaleString('id-ID')}</TableCell>
                                                <TableCell>
                                                    Rp {(item.quantity * item.price).toLocaleString('id-ID')}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                <div className="text-right font-semibold">
                                    Total: Rp {selectedSale.total_price.toLocaleString('id-ID')}
                                </div>
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
