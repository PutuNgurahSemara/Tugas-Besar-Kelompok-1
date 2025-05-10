import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Supplier } from '@/types';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/InputError';
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface PurchaseEditProps {
    purchase: any;
    categories: Category[];
    suppliers: Supplier[];
    usedQuantity: number;
    existingProducts: string[];
    remainingQuantity: number;
    [key: string]: any;
}

interface DetailItem {
    id?: number | null;
    nama_produk: string;
    expired: string;
    jumlah: string;
    kemasan: string;
    harga_satuan: string;
    total: string;
    [key: string]: any; // Index signature for dynamic property access in handleDetailChange
}

export default function PurchaseEdit() {
    const { purchase, categories, suppliers, errors: pageErrors } = usePage<PurchaseEditProps>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Purchases', href: route('purchases.index') },
        { title: 'Edit Purchase', href: route('purchases.edit', purchase.id) },
    ];

    const [preview, setPreview] = useState<string | null>(null);

    const formatDateForInput = (dateString: string | null | undefined): string => {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
            return ''; 
        }
    };

    const [header, setHeader] = useState({
        no_faktur: purchase.no_faktur || '',
        pbf: purchase.pbf || '', // Assuming pbf (supplier name string) is what's needed for the Select
        supplier_id: purchase.supplier_id || '', // Keep supplier_id if available/needed
        tanggal_faktur: formatDateForInput(purchase.tanggal_faktur),
        jatuh_tempo: formatDateForInput(purchase.jatuh_tempo),
        jumlah: purchase.jumlah || '', // This should be the count of item types
        // total: purchase.total || '', // Total is calculated or comes from backend
        keterangan: purchase.keterangan || '',
    });
    const [details, setDetails] = useState(
        purchase.details && purchase.details.length > 0
            ? purchase.details.map((d: any) => ({
                id: d.id || null, // Keep track of existing detail IDs if needed for update
                nama_produk: d.nama_produk || '',
                expired: formatDateForInput(d.expired),
                jumlah: d.jumlah?.toString() || '',
                kemasan: d.kemasan || '',
                harga_satuan: d.harga_satuan?.toString() || '',
                total: d.total?.toString() || '',
            }))
            : [
                {
                    nama_produk: '',
                    expired: '',
                    jumlah: '',
                    kemasan: '',
                    harga_satuan: '',
                    total: '',
                },
            ]
    );
    const [processing, setProcessing] = useState(false);
    const [tanggalPembayaran, setTanggalPembayaran] = useState(formatDateForInput(purchase.tanggal_pembayaran));
    const [status, setStatus] = useState(purchase.tanggal_pembayaran ? 'PAID' : 'UNPAID'); // Derive status from actual payment date

    const jumlahProduk = details.length;
    const displayTotal = details.reduce((sum: number, d: DetailItem) => sum + (parseFloat(d.total) || 0), 0);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // This useForm hook seems unused for the main purchase form, consider removing if not needed.
    // const { data, setData, put, errors, processing: formProcessing } = useForm({
    //     product: purchase.product || '',
    //     category_id: purchase.category_id || '',
    //     supplier_id: purchase.supplier_id || '',
    //     cost_price: purchase.cost_price || '',
    //     quantity: purchase.quantity || 1,
    //     due_date: purchase.due_date || '',
    //     status: purchase.status || 'UNPAID',
    // });

    useEffect(() => {
        if (tanggalPembayaran) setStatus('PAID');
        else setStatus('UNPAID');
    }, [tanggalPembayaran]);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setProcessing(true);
        setAlert(null);

        const payload = {
            ...header, // no_faktur, pbf, supplier_id, tanggal_faktur, jatuh_tempo, keterangan
            jumlah: details.length, // Ensure 'jumlah' (count of item types) is correct
            tanggal_pembayaran: tanggalPembayaran || null, // Use the dedicated state, send null if empty
            details: details.map((d: DetailItem) => ({
                ...d,
                jumlah: parseInt(d.jumlah) || 0,
                harga_satuan: parseFloat(d.harga_satuan) || 0,
                total: parseFloat(d.total) || 0,
            })),
            // total will be recalculated by backend
        };

        router.put(route('purchases.update', purchase.id), payload as any, {
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Pembelian berhasil diperbarui!' });
                setProcessing(false);
            },
            onError: (errors) => { // Use pageErrors from usePage
                if (pageErrors.general) {
                    setAlert({ type: 'error', message: pageErrors.general });
                } else {
                    const errorMessages = Object.values(pageErrors).join(' \n');
                    setAlert({ type: 'error', message: errorMessages || 'Gagal memperbarui pembelian. Mohon cek data Anda.' });
                }
                setProcessing(false);
            },
        });
    }

    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setHeader({ ...header, [e.target.name]: e.target.value });
    };

    const handleDetailChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newDetails = [...details];
        newDetails[index][e.target.name] = e.target.value;
        if ((e.target.name === 'jumlah' || e.target.name === 'harga_satuan') && newDetails[index].jumlah && newDetails[index].harga_satuan) {
            newDetails[index].total = (parseFloat(newDetails[index].jumlah) * parseFloat(newDetails[index].harga_satuan)).toString();
        }
        setDetails(newDetails);
    };

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

    const removeDetailRow = (index: number) => {
        const newDetails = details.filter((_: any, i: number) => i !== index);
        setDetails(newDetails);
    };

    return (
        <AppLayout>
            <Head title="Edit Purchase" />
            <Card>
                <CardHeader>
                    <CardTitle>Edit Purchase</CardTitle>
                    <CardDescription>Update purchase information.</CardDescription>
                </CardHeader>
                <CardContent>
                    {alert && (
                        <Alert variant={alert.type === 'success' ? undefined : 'destructive'} className="mb-4">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle>{alert.type === 'success' ? 'Sukses' : 'Gagal'}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="no_faktur">No Faktur</Label>
                                    <Input id="no_faktur" name="no_faktur" value={header.no_faktur} onChange={handleHeaderChange} required />
                                </div>
                                <div>
                                    <Label htmlFor="pbf">Supplier (PBF)</Label>
                                    <Select
                                        value={header.supplier_id} // Bind to supplier_id
                                        onValueChange={val => {
                                            const selectedSupplier = suppliers.find(s => String(s.id) === val);
                                            setHeader({ 
                                                ...header, 
                                                supplier_id: val,
                                                pbf: selectedSupplier ? selectedSupplier.company : '' 
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="w-full bg-gray-900 text-white border-gray-700">
                                            <SelectValue placeholder="Pilih Supplier" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-900 text-white">
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
                                            name="tanggal_pembayaran" // This name attribute might conflict if header also has it.
                                                                        // The value is controlled by `tanggalPembayaran` state.
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
                                    <div className="bg-gray-800 text-green-400 rounded px-3 py-2 font-bold">Rp. {displayTotal.toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <h3 className="font-semibold mb-2">Detail Produk</h3>
                            {details.map((detail: any, idx: number) => (
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
                        <div className="flex items-center justify-end space-x-4 mt-6">
                            <Link href={route('purchases.index')} className="text-sm text-gray-600 hover:text-gray-900">
                                Cancel
                            </Link>
                            <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700 text-white">
                                {processing ? 'Saving...' : 'Update'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
