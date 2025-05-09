import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Supplier } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import type { PageProps } from '@/types/inertia';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/InputError';
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PurchaseCreateProps extends PageProps {
    categories: Category[];
    suppliers: Supplier[];
    [key: string]: unknown;
}

interface DetailItem {
    nama_produk: string;
    expired: string;
    jumlah: string;
    kemasan: string;
    harga_satuan: string;
    total: string;
    [key: string]: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Purchases', href: route('purchases.index') },
    { title: 'Add Purchase', href: route('purchases.create') },
];

export default function PurchaseCreate() {
    const { categories, suppliers } = usePage<PurchaseCreateProps>().props;
    // State untuk header
    const [header, setHeader] = useState({
        no_faktur: '',
        pbf: '',
        tanggal_faktur: '',
        jatuh_tempo: '',
        jumlah: '',
        total: '',
        tanggal_pembayaran: '',
        keterangan: '',
        supplier_id: '',
    });
    // State untuk detail produk dinamis
    const [details, setDetails] = useState<DetailItem[]>([
        {
            nama_produk: '',
            expired: '',
            jumlah: '',
            kemasan: '',
            harga_satuan: '',
            total: '',
        },
    ]);
    const [processing, setProcessing] = useState(false);
    // Tambahkan state status
    const [status, setStatus] = useState('UNPAID');
    // State untuk tanggal pembayaran & status
    const [tanggalPembayaran, setTanggalPembayaran] = useState('');
    // Hitung jumlah produk otomatis
    const jumlahProduk = details.length;
    // Hitung total otomatis
    const total = details.reduce((sum, d) => sum + (parseFloat(d.total) || 0), 0);
    // Jika tanggal pembayaran diisi, status otomatis 'PAID'
    useEffect(() => {
        if (tanggalPembayaran) setStatus('PAID');
        else setStatus('UNPAID');
    }, [tanggalPembayaran]);
    // Handler perubahan header
    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHeader({ ...header, [e.target.name]: e.target.value });
    };
    // Handler perubahan detail produk
    const handleDetailChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newDetails = [...details];
        const field = e.target.name as keyof DetailItem;
        newDetails[index][field] = e.target.value;
        // Hitung total otomatis jika jumlah & harga_satuan diisi
        if ((field === 'jumlah' || field === 'harga_satuan') && newDetails[index].jumlah && newDetails[index].harga_satuan) {
            newDetails[index].total = (parseFloat(newDetails[index].jumlah) * parseFloat(newDetails[index].harga_satuan)).toString();
        }
        setDetails(newDetails);
    };
    // Tambah baris detail produk
    const addDetailRow = () => {
        setDetails([
            ...details,
            {
                nama_produk: '',
                expired: '',
                jumlah: '',
                kemasan: '',
                harga_satuan: '',
                total: '',
            },
        ]);
    };
    // Hapus baris detail produk
    const removeDetailRow = (index: number) => {
        const newDetails = details.filter((_, i) => i !== index);
        setDetails(newDetails);
    };
    // Handler perubahan supplier
    const handleSupplierChange = (value: string) => {
        const selected = suppliers.find(s => String(s.id) === value);
        setHeader({
            ...header,
            supplier_id: value,
            pbf: selected ? selected.company : '',
        });
    };
    // State untuk alert
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    // Submit form
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);
        setAlert(null);
        const formData = {
            ...header,
            details: details.map(detail => ({
                ...detail,
                jumlah: parseInt(detail.jumlah) || 0,
                harga_satuan: parseFloat(detail.harga_satuan) || 0,
                total: parseFloat(detail.total) || 0
            }))
        };
        
        router.post(route('purchases.store'), formData as any, {
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Pembelian berhasil disimpan!' });
                setProcessing(false);
            },
            onError: () => {
                setAlert({ type: 'error', message: 'Gagal menyimpan pembelian. Mohon cek data Anda.' });
                setProcessing(false);
            },
        });
    };
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Add Purchase" />
            <Card>
                <CardHeader>
                    <CardTitle>Tambah Pembelian Baru</CardTitle>
                    <CardDescription>Input data pembelian sesuai format terbaru.</CardDescription>
                </CardHeader>
                <CardContent>
                    {alert && (
                        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'} className="mb-4">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle>{alert.type === 'success' ? 'Sukses' : 'Gagal'}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Header */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="no_faktur">No Faktur</Label>
                                    <Input id="no_faktur" name="no_faktur" value={header.no_faktur} onChange={handleHeaderChange} required />
                                </div>
                                <div>
                                    <Label htmlFor="pbf">Supplier (PBF)</Label>
                                    <Select 
                                        value={header.supplier_id || "_none"}
                                        onValueChange={handleSupplierChange}
                                    >
                                        <SelectTrigger className="w-full bg-gray-900 text-white border-gray-700">
                                            <SelectValue placeholder="Pilih Supplier" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 text-white">
                                            <SelectItem value="_none">Select Supplier</SelectItem>
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.company}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="tanggal_faktur">Tanggal Faktur</Label>
                                    <Input id="tanggal_faktur" name="tanggal_faktur" type="date" value={header.tanggal_faktur} onChange={handleHeaderChange} required />
                                </div>
                                <div>
                                    <Label htmlFor="jatuh_tempo">Jatuh Tempo</Label>
                                    <Input id="jatuh_tempo" name="jatuh_tempo" type="date" value={header.jatuh_tempo} onChange={handleHeaderChange} required />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label>Jumlah produk yang dipesan</Label>
                                    <div className="bg-gray-800 text-white rounded px-3 py-2 font-bold">{jumlahProduk}</div>
                                </div>
                                <div>
                                    <Label>Tanggal Pembayaran & Status</Label>
                                    <div className="flex gap-2 items-center">
                                    <Input
                                            id="tanggal_pembayaran"
                                            name="tanggal_pembayaran"
                                            type="date"
                                            value={tanggalPembayaran}
                                            onChange={e => setTanggalPembayaran(e.target.value)}
                                            className="w-1/2"
                                    />
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${status === 'PAID' ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-300'}`}>{status === 'PAID' ? 'Sudah Dibayar' : 'Belum Dibayar'}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="keterangan">Keterangan</Label>
                                    <Input id="keterangan" name="keterangan" value={header.keterangan} onChange={handleHeaderChange} />
                                </div>
                                <div>
                                    <Label>Total</Label>
                                    <div className="bg-gray-800 text-green-400 rounded px-3 py-2 font-bold">Rp. {total.toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                        </div>
                        {/* Detail Produk */}
                        <div className="mt-8">
                            <h3 className="font-semibold mb-2">Detail Produk</h3>
                            {details.map((detail, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-2 items-end border p-2 rounded relative">
                                    <div>
                                        <Label>Nama Produk</Label>
                                        <Input name="nama_produk" value={detail.nama_produk} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label>Expired</Label>
                                        <Input name="expired" type="date" value={detail.expired} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label>Jumlah</Label>
                                        <Input name="jumlah" type="number" value={detail.jumlah} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label>Kemasan</Label>
                                        <Input name="kemasan" value={detail.kemasan} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label>Harga Satuan</Label>
                                        <Input name="harga_satuan" type="number" value={detail.harga_satuan} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label>Total</Label>
                                        <Input name="total" type="number" value={detail.total} readOnly />
                                    </div>
                                    {details.length > 1 && (
                                        <div className="col-span-full flex justify-end">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() => {
                                                    if (confirm('Yakin ingin menghapus produk ini?')) removeDetailRow(idx);
                                                }}
                                                className="mt-2 flex items-center gap-1"
                                            >
                                                <Trash2 size={16} /> Hapus
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Button type="button" onClick={addDetailRow} className="mt-2">Tambah Produk</Button>
                        </div>
                        {/* Tombol Aksi */}
                        <div className="flex items-center justify-end space-x-4 mt-6">
                            <Link href={route('purchases.index')} className="text-sm text-gray-600 hover:text-gray-900">
                                Cancel
                            </Link>
                            <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700 text-white">
                                {processing ? 'Saving...' : 'Simpan'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}