// Placeholder Page
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type PaginatedResponse, type Purchase, type Supplier, type Category } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit2, CheckCircle, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { FlashMessage } from '@/components/flash-message';
import { format } from 'date-fns';

// Definisikan tipe Purchase dengan relasi (jika belum ada di types/index.d.ts)
// Pastikan Purchase di types/index.d.ts memiliki properti ini
interface PurchaseWithRelations extends Purchase {
    supplier: Supplier | null; // Supplier bisa null jika tidak wajib
    category: Category | null; // Category bisa null jika tidak wajib
}

interface PurchasesIndexProps {
    purchases: PaginatedResponse<PurchaseWithRelations>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Purchases', href: route('purchases.index') },
];

export default function PurchasesIndex() {
    const { purchases, flash } = usePage<PurchasesIndexProps>().props;
    const [detailItems, setDetailItems] = useState<any[] | null>(null);
    const [showDetail, setShowDetail] = useState(false);

    const handleShowDetail = (items: any[]) => {
        setDetailItems(items);
        setShowDetail(true);
    };
    const handleCloseDetail = () => {
        setShowDetail(false);
        setDetailItems(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchases" />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Purchases</CardTitle>
                            <CardDescription>Manage product purchase records.</CardDescription>
                        </div>
                        <Link href={route('purchases.create')}>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Purchase
                            </Button>
                        </Link>
                    </div>
                    <FlashMessage flash={flash} />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[80px]">ID</TableHead>
                                <TableHead>No Faktur</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Tanggal Faktur</TableHead>
                                <TableHead>Jatuh Tempo</TableHead>
                                <TableHead>Tgl Bayar</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="w-[220px] text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases.data.length > 0 ? (
                                purchases.data.map((purchase) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell>{purchase.id}</TableCell>
                                        <TableCell>{purchase.invoice_number}</TableCell>
                                        <TableCell>{purchase.supplier?.name ?? '-'}</TableCell>
                                        <TableCell>{purchase.invoice_date ? format(new Date(purchase.invoice_date), 'dd MMM yyyy') : '-'}</TableCell>
                                        <TableCell>{purchase.due_date ? format(new Date(purchase.due_date), 'dd MMM yyyy') : '-'}</TableCell>
                                        <TableCell>{purchase.payment_date ? format(new Date(purchase.payment_date), 'dd MMM yyyy') : '-'}</TableCell>
                                        <TableCell>
                                            <span className={
                                                purchase.status === 'PAID'
                                                    ? 'text-green-600 font-semibold'
                                                    : 'text-yellow-600 font-semibold'
                                            }>
                                                {purchase.status === 'PAID' ? 'Lunas' : 'Belum Terbayar'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {purchase.total ? 'Rp ' + Number(purchase.total).toLocaleString('id-ID') : '-'}
                                        </TableCell>
                                        <TableCell>{purchase.note ?? '-'}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button variant="secondary" size="sm" onClick={() => handleShowDetail(purchase.items)} title="Lihat Detail Produk">
                                                <Eye className="w-4 h-4 mr-1" /> Detail Produk
                                            </Button>
                                            <Link href={route('purchases.edit', purchase.id)}>
                                                <Button variant="outline" size="sm" title="Edit Faktur">
                                                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                                                </Button>
                                            </Link>
                                            {purchase.status === 'UNPAID' && (
                                                <Button
                                                    variant="success"
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => {
                                                        if (confirm('Tandai pembelian ini sebagai Lunas?')) {
                                                            router.put(route('purchases.update', purchase.id), {
                                                                ...purchase,
                                                                status: 'PAID',
                                                            });
                                                        }
                                                    }}
                                                    title="Tandai Lunas"
                                                >
                                                    <CheckCircle className="w-4 h-4 mr-1" /> Tandai Lunas
                                                </Button>
                                            )}
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                onClick={() => {
                                                    if (confirm('Yakin ingin menghapus faktur ini?')) {
                                                        router.delete(route('purchases.destroy', purchase.id));
                                                    }
                                                }}
                                                title="Hapus Faktur"
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" /> Hapus
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                        No purchase records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination links={purchases.links} meta={purchases.meta} className="mt-4"/>

                    {/* Modal/Alert Detail Produk */}
                    {showDetail && detailItems && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 min-w-[350px] max-w-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="font-bold text-lg">Detail Produk di Faktur</div>
                                    <Button variant="ghost" size="sm" onClick={handleCloseDetail}>Tutup</Button>
                                </div>
                                <table className="min-w-full border text-sm mb-2">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-800">
                                            <th className="p-2 border">Nama Produk</th>
                                            <th className="p-2 border">Expired</th>
                                            <th className="p-2 border">Jumlah</th>
                                            <th className="p-2 border">Kemasan</th>
                                            <th className="p-2 border">Harga Satuan</th>
                                            <th className="p-2 border">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {detailItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-2 border">{item.product_name}</td>
                                                <td className="p-2 border">{item.expired ? format(new Date(item.expired), 'dd MMM yyyy') : '-'}</td>
                                                <td className="p-2 border">{item.quantity}</td>
                                                <td className="p-2 border">{item.unit}</td>
                                                <td className="p-2 border">Rp {Number(item.unit_price).toLocaleString('id-ID')}</td>
                                                <td className="p-2 border">Rp {Number(item.total).toLocaleString('id-ID')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
} 