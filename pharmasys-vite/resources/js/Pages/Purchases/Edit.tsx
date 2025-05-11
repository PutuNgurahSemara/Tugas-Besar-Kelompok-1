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
    jumlah: string; // QTY
    kemasan: string; // SATUAN
    harga_satuan: string; // HARGA SATUAN
    gross: string; // QTY * HARGA SATUAN (auto-calculated)
    discount_percentage: string; // DISC (%) (input)
    sub_total: string; // GROSS - (GROSS * DISC (%)) (auto-calculated, formerly 'total')
    [key: string]: any; 
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
                id: d.id || null,
                nama_produk: d.nama_produk || '',
                expired: formatDateForInput(d.expired),
                jumlah: d.jumlah?.toString() || '0',
                kemasan: d.kemasan || '',
                harga_satuan: d.harga_satuan?.toString() || '0',
                // Calculate gross and discount_percentage if not available, assume 0 discount initially
                // Backend should ideally provide these if they are stored.
                // For now, we'll calculate gross and assume discount_percentage is 0 if not present.
                // And sub_total will be d.total from backend.
                gross: (parseFloat(d.jumlah?.toString() || '0') * parseFloat(d.harga_satuan?.toString() || '0')).toFixed(2),
                discount_percentage: d.discount_percentage?.toString() || '0', // Assuming it might come from backend
                sub_total: d.total?.toString() || '0', // This 'total' from backend is the item's sub_total
            }))
            : [ // Default for new row if purchase had no details (should not happen for edit)
                {
                    id: null,
                    nama_produk: '',
                    expired: '',
                    jumlah: '0',
                    kemasan: '',
                    harga_satuan: '0',
                    gross: '0',
                    discount_percentage: '0',
                    sub_total: '0',
                },
            ]
    );
    const [processing, setProcessing] = useState(false);
    const [tanggalPembayaran, setTanggalPembayaran] = useState(formatDateForInput(purchase.tanggal_pembayaran));
    const [status, setStatus] = useState(purchase.tanggal_pembayaran ? 'PAID' : 'UNPAID');
    const [ppnPercentage, setPpnPercentage] = useState<string>(purchase.ppn_percentage?.toString() || '0');

    const jumlahProduk = details.length;
    const subTotalDisplay = details.reduce((sum: number, d: DetailItem) => sum + (parseFloat(d.sub_total) || 0), 0);
    const ppnAmountDisplay = (subTotalDisplay * (parseFloat(ppnPercentage) || 0)) / 100;
    const grandTotalDisplay = subTotalDisplay + ppnAmountDisplay;
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
            ...header,
            jumlah: details.length,
            tanggal_pembayaran: tanggalPembayaran || null,
            ppn_percentage: parseFloat(ppnPercentage) || 0,
            details: details.map((d: DetailItem) => ({
                id: d.id || null,
                nama_produk: d.nama_produk,
                expired: d.expired,
                jumlah: parseInt(d.jumlah) || 0,
                kemasan: d.kemasan,
                harga_satuan: parseFloat(d.harga_satuan) || 0,
                gross: parseFloat(d.gross) || 0, // Send gross
                discount_percentage: parseFloat(d.discount_percentage) || 0, // Send discount_percentage
                total: parseFloat(d.sub_total) || 0, // Send item's sub_total as 'total'
            })),
        };

        router.put(route('purchases.update', purchase.id), payload as any, {
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Pembelian berhasil diperbarui!' });
                setProcessing(false);
            },
            onError: (formErrors) => { // Changed 'errors' to 'formErrors' to avoid conflict with pageErrors from props
                // pageErrors from usePage().props contains errors from the initial page load or previous validation errors.
                // formErrors argument here contains the errors specific to THIS form submission.
                let specificErrorMessage = '';
                if (formErrors) {
                    specificErrorMessage = Object.values(formErrors).flat().join(' ');
                }

                if (formErrors.general) {
                    setAlert({ type: 'error', message: formErrors.general });
                } else if (specificErrorMessage) {
                    setAlert({ type: 'error', message: specificErrorMessage });
                } else {
                    setAlert({ type: 'error', message: 'Gagal memperbarui pembelian. Mohon cek data Anda.' });
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

    const addDetailRow = () => {
        setDetails([
            ...details,
            {
                id: null,
                nama_produk: '',
                expired: '',
                jumlah: '0',
                kemasan: '',
                harga_satuan: '0',
                gross: '0',
                discount_percentage: '0',
                sub_total: '0',
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
                        <div className="mt-8">
                            <h3 className="font-semibold mb-2">Detail Produk</h3>
                            {details.map((detail: DetailItem, idx: number) => (
                                <div key={detail.id || `new-${idx}`} className="grid grid-cols-1 md:grid-cols-8 gap-2 mb-3 items-end border p-3 rounded-lg relative shadow-sm">
                                    <div className="md:col-span-2">
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
                                    <div className="md:col-span-8">
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
