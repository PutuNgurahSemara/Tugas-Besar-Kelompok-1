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
    jumlah: string; // QTY
    kemasan: string; // SATUAN
    harga_satuan: string; // HARGA SATUAN
    gross: string; // QTY * HARGA SATUAN (auto-calculated)
    discount_percentage: string; // DISC (%) (input)
    sub_total: string; // GROSS - (GROSS * DISC (%)) (auto-calculated, formerly 'total')
    [key: string]: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Purchases', href: route('purchases.index') },
    { title: 'Add Purchase', href: route('purchases.create') },
];

export default function PurchaseCreate() {
    const { categories, suppliers, errors: pageErrors } = usePage<PurchaseCreateProps>().props;
    // State untuk header
    const [header, setHeader] = useState({
        no_faktur: '',
        pbf: '',
        tanggal_faktur: '',
        jatuh_tempo: '',
        // jumlah: '', // Will be derived from details.length for submission
        // total: '', // Will be calculated server-side or derived for display
        tanggal_pembayaran: '', // This is now handled by the separate tanggalPembayaran state
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
            gross: '0',
            discount_percentage: '0',
            sub_total: '0',
        },
    ]);
    const [processing, setProcessing] = useState(false);
    // Tambahkan state status
    const [status, setStatus] = useState('UNPAID');
    // State untuk tanggal pembayaran & status
    const [tanggalPembayaran, setTanggalPembayaran] = useState('');
    const [ppnPercentage, setPpnPercentage] = useState('0'); // State for PPN

    // Hitung jumlah produk otomatis
    const jumlahProduk = details.length;

    // Calculate totals for display
    const subTotalDisplay = details.reduce((sum, d) => sum + (parseFloat(d.sub_total) || 0), 0); // DPP
    const ppnAmountDisplay = (subTotalDisplay * (parseFloat(ppnPercentage) || 0)) / 100;
    const grandTotalDisplay = subTotalDisplay + ppnAmountDisplay; // Harus Dibayar

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

        const qty = parseFloat(newDetails[index].jumlah) || 0;
        const unitPrice = parseFloat(newDetails[index].harga_satuan) || 0;
        const discPercentage = parseFloat(newDetails[index].discount_percentage) || 0;

        const gross = qty * unitPrice;
        newDetails[index].gross = gross.toFixed(2);

        const discountAmount = (gross * discPercentage) / 100;
        const subTotal = gross - discountAmount;
        newDetails[index].sub_total = subTotal.toFixed(2);
        
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
                gross: '0',
                discount_percentage: '0',
                sub_total: '0',
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
            no_faktur: header.no_faktur,
            pbf: header.pbf,
            tanggal_faktur: header.tanggal_faktur,
            jatuh_tempo: header.jatuh_tempo,
            keterangan: header.keterangan,
            supplier_id: header.supplier_id,
            jumlah: details.length,
            tanggal_pembayaran: tanggalPembayaran || null,
            ppn_percentage: parseFloat(ppnPercentage) || 0,
            details: details.map(detail => ({
                nama_produk: detail.nama_produk,
                expired: detail.expired,
                jumlah: parseInt(detail.jumlah) || 0,
                kemasan: detail.kemasan,
                harga_satuan: parseFloat(detail.harga_satuan) || 0,
                gross: parseFloat(detail.gross) || 0,
                discount_percentage: parseFloat(detail.discount_percentage) || 0,
                total: parseFloat(detail.sub_total) || 0, // 'total' in backend is item's sub_total
            })),
        };

        router.post(route('purchases.store'), formData as any, {
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Pembelian berhasil disimpan!' });
                setProcessing(false);
                // Optionally reset form:
                // setHeader({ no_faktur: '', pbf: '', tanggal_faktur: '', jatuh_tempo: '', keterangan: '', supplier_id: '' });
                // setDetails([{ nama_produk: '', expired: '', jumlah: '', kemasan: '', harga_satuan: '', total: '' }]);
                // setTanggalPembayaran('');
            },
            onError: (errors) => { // Capture errors from Inertia props
                if (errors.general) {
                    setAlert({ type: 'error', message: errors.general });
                } else {
                    // Concatenate other field-specific errors or show a generic one
                    const errorMessages = Object.values(errors).join(' \n');
                    setAlert({ type: 'error', message: errorMessages || 'Gagal menyimpan pembelian. Mohon cek data Anda.' });
                }
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
                                    <Label htmlFor="ppn_percentage">PPN (%)</Label>
                                    <Input 
                                        id="ppn_percentage" 
                                        name="ppn_percentage" 
                                        type="number"
                                        value={ppnPercentage} 
                                        onChange={(e) => setPpnPercentage(e.target.value)} 
                                        min="0" max="100" step="0.01"
                                        placeholder="e.g. 11"
                                    />
                                </div>
                                <div className="space-y-1 mt-1">
                                    <p className="text-sm flex justify-between">Subtotal: <span className="font-semibold">Rp. {subTotalDisplay.toLocaleString('id-ID')}</span></p>
                                    <p className="text-sm flex justify-between">PPN ({ppnPercentage || 0}%): <span className="font-semibold">Rp. {ppnAmountDisplay.toLocaleString('id-ID')}</span></p>
                                    <p className="text-lg flex justify-between text-green-400">Grand Total: <span className="font-bold">Rp. {grandTotalDisplay.toLocaleString('id-ID')}</span></p>
                                </div>
                            </div>
                        </div>
                        {/* Detail Produk */}
                        <div className="mt-8">
                            <h3 className="font-semibold mb-2">Detail Produk</h3>
                            {details.map((detail, idx) => (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-8 gap-2 mb-3 items-end border p-3 rounded-lg relative shadow-sm">
                                    <div className="md:col-span-2"> {/* Nama Produk wider */}
                                        <Label htmlFor={`nama_produk_${idx}`}>Nama Produk (URAIAN)</Label>
                                        <Input id={`nama_produk_${idx}`} name="nama_produk" value={detail.nama_produk} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor={`jumlah_${idx}`}>QTY (JUMLAH)</Label>
                                        <Input id={`jumlah_${idx}`} name="jumlah" type="number" value={detail.jumlah} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor={`expired_${idx}`}>ED</Label>
                                        <Input id={`expired_${idx}`} name="expired" type="date" value={detail.expired} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor={`kemasan_${idx}`}>SATUAN (KMSN)</Label>
                                        <Input id={`kemasan_${idx}`} name="kemasan" value={detail.kemasan} onChange={e => handleDetailChange(idx, e)} required />
                                    </div>
                                    <div>
                                        <Label htmlFor={`harga_satuan_${idx}`}>HARGA SATUAN</Label>
                                        <Input id={`harga_satuan_${idx}`} name="harga_satuan" type="number" value={detail.harga_satuan} onChange={e => handleDetailChange(idx, e)} required step="0.01"/>
                                    </div>
                                    <div>
                                        <Label htmlFor={`gross_${idx}`}>GROSS</Label>
                                        <Input id={`gross_${idx}`} name="gross" type="number" value={detail.gross} readOnly className="bg-gray-100 dark:bg-gray-700"/>
                                    </div>
                                    <div>
                                        <Label htmlFor={`discount_percentage_${idx}`}>DISC (%)</Label>
                                        <Input id={`discount_percentage_${idx}`} name="discount_percentage" type="number" value={detail.discount_percentage} onChange={e => handleDetailChange(idx, e)} step="0.01" min="0" max="100"/>
                                    </div>
                                    <div className="md:col-span-8"> {/* SUB TOTAL full width below */}
                                        <Label htmlFor={`sub_total_${idx}`}>SUB TOTAL (Item)</Label>
                                        <Input id={`sub_total_${idx}`} name="sub_total" type="number" value={detail.sub_total} readOnly className="bg-gray-100 dark:bg-gray-700 font-semibold"/>
                                    </div>
                                    {details.length > 1 && (
                                        <div className="md:col-span-8 flex justify-end pt-1">
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
