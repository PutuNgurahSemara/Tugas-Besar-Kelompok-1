// Placeholder Page
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, PaginatedResponse, Purchase, Supplier, Category, PurchaseDetail } from '../../types/index';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react'; // Added Eye, Edit, Trash2
import { useState, useRef } from 'react';
import { Modal } from '@/components/Modal';
import { ActionButton } from '@/components/action-button'; // Assuming ActionButton is available

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { FlashMessage } from '@/components/flash-message';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Download } from "lucide-react"; // Import Download icon
import { Badge } from '@/components/ui/badge'; // Added Badge import

interface PurchasesIndexProps {
    purchases: PaginatedResponse<Purchase>;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Purchases', href: route('purchases.index') },
];

export default function PurchasesIndex() {
    const { purchases, flash } = usePage<PurchasesIndexProps>().props;
    const [showModal, setShowModal] = useState(false);
    const [selectedDetails, setSelectedDetails] = useState<PurchaseDetail[]>([]);
    const [selectedFaktur, setSelectedFaktur] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importAlert, setImportAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleShowDetails = (purchase: Purchase) => {
        setSelectedDetails(purchase.details || []);
        setSelectedFaktur(purchase.no_faktur || '');
        setShowModal(true);
    };
    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedDetails([]);
        setSelectedFaktur('');
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        setImportAlert(null);
        router.post(route('purchases.import'), formData, {
            forceFormData: true,
            onSuccess: () => setImportAlert({ type: 'success', message: 'Import berhasil!' }),
            onError: () => setImportAlert({ type: 'error', message: 'Import gagal. Pastikan format file sudah benar.' }),
        });
    };

    const handleDelete = (id: number) => {
        if (!confirm('Yakin ingin menghapus faktur ini?')) return;
        router.delete(route('purchases.destroy', id), {
            onSuccess: () => setImportAlert({ type: 'success', message: 'Faktur berhasil dihapus!' }),
            onError: () => setImportAlert({ type: 'error', message: 'Gagal menghapus faktur.' }),
        });
    };

    return (
        <AppLayout>
            <Head title="Purchases" />

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Purchases</CardTitle>
                            <CardDescription>Manage product purchase records.</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('purchases.import-page')}>
                                <Button variant="secondary" size="sm">
                                    Import Data
                                </Button>
                            </Link>
                            <Link href={route('purchases.create')}>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Purchase
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <FlashMessage flash={flash} />
                </CardHeader>
                <CardContent>
                    {importAlert && (
                        <Alert variant={importAlert.type === 'success' ? undefined : 'destructive'} className="mb-4">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle>{importAlert.type === 'success' ? 'Sukses' : 'Gagal'}</AlertTitle>
                            <AlertDescription>{importAlert.message}</AlertDescription>
                        </Alert>
                    )}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No Faktur</TableHead>
                                <TableHead>PBF</TableHead>
                                <TableHead>Tanggal Faktur</TableHead>
                                <TableHead>Jatuh Tempo</TableHead>
                                <TableHead>Subtotal</TableHead>
                                <TableHead>PPN (%)</TableHead>
                                <TableHead>PPN Amount</TableHead>
                                <TableHead>Grand Total</TableHead>
                                <TableHead>Pembayaran</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases.data.length > 0 ? (
                                purchases.data.map((purchase: Purchase & { subtotal?: number; ppn_percentage?: number; ppn_amount?: number }) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell>{purchase.no_faktur || '-'}</TableCell>
                                        <TableCell>{purchase.pbf || '-'}</TableCell>
                                        <TableCell>{purchase.tanggal_faktur ? format(new Date(purchase.tanggal_faktur), 'dd MMM yyyy') : '-'}</TableCell>
                                        <TableCell>{purchase.jatuh_tempo ? format(new Date(purchase.jatuh_tempo), 'dd MMM yyyy') : '-'}</TableCell>
                                        <TableCell>{typeof purchase.subtotal === 'number' ? `Rp ${purchase.subtotal.toLocaleString('id-ID')}` : '-'}</TableCell>
                                        <TableCell>{typeof purchase.ppn_percentage === 'number' ? `${purchase.ppn_percentage}%` : '-'}</TableCell>
                                        <TableCell>{typeof purchase.ppn_amount === 'number' ? `Rp ${purchase.ppn_amount.toLocaleString('id-ID')}` : '-'}</TableCell>
                                        <TableCell>{purchase.total ? `Rp ${purchase.total.toLocaleString('id-ID')}` : '-'}</TableCell>
                                        <TableCell>
                                            {purchase.tanggal_pembayaran ? (
                                                <>
                                                    {format(new Date(purchase.tanggal_pembayaran), 'dd MMM yyyy')}
                                                    <Badge variant="default" className="ml-2 bg-green-500 text-white">Paid</Badge>
                                                </>
                                            ) : (
                                                <Badge variant="secondary">Unpaid</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{purchase.keterangan || '-'}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {purchase.details && purchase.details.length > 0 && (
                                                    <ActionButton
                                                        icon={Eye}
                                                        tooltip="View Details"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleShowDetails(purchase)}
                                                    />
                                                )}
                                                <ActionButton
                                                    icon={Edit}
                                                    tooltip="Edit Purchase"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(route('purchases.edit', purchase.id))}
                                                />
                                                <ActionButton
                                                    icon={Trash2}
                                                    tooltip="Delete Purchase"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(purchase.id)}
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                        No purchase records found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <Pagination links={purchases.links} meta={purchases.meta} className="mt-4"/>
                </CardContent>
            </Card>

            {/* Modal Detail Produk */}
            {showModal && (
                <Modal isOpen={showModal} onClose={handleCloseModal} title={`Detail Produk Faktur: ${selectedFaktur}`}>
                    <div className="p-2" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                        {selectedDetails.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Nama Produk</TableHead>
                                        <TableHead>Expired</TableHead>
                                        <TableHead>Jumlah</TableHead>
                                        <TableHead>Kemasan</TableHead>
                                        <TableHead>Harga Satuan</TableHead>
                                        <TableHead>Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {selectedDetails.map((detail, i) => (
                                        <TableRow key={i}>
                                            <TableCell>{i + 1}</TableCell>
                                            <TableCell>{detail.nama_produk}</TableCell>
                                            <TableCell>{detail.expired}</TableCell>
                                            <TableCell>{detail.jumlah}</TableCell>
                                            <TableCell>{detail.kemasan}</TableCell>
                                            <TableCell>{detail.harga_satuan}</TableCell>
                                            <TableCell>{detail.total}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div>Tidak ada detail produk.</div>
                        )}
                        <div className="mt-4 flex justify-end">
                            <Button onClick={handleCloseModal}>Tutup</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AppLayout>
    );
}
