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
import { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Plus } from "lucide-react";

interface Product {
    id: number;
    name: string;
    // tambahkan field lain yang diperlukan
}

interface PurchaseCreateProps extends PageProps {
    categories: Category[];
    suppliers: Supplier[];
    products: Product[];
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
    const { categories, suppliers, products: initialProducts = [], errors: pageErrors } = usePage<PurchaseCreateProps>().props;
    
    // Gunakan useRef untuk menyimpan daftar produk yang sudah diinput
    const availableProductsRef = useRef<{id: number, name: string}[]>(initialProducts);
    const [availableProducts, setAvailableProducts] = useState<{id: number, name: string}[]>(
        () => {
            try {
                // Coba ambil dari localStorage jika ada, jika tidak gunakan initialProducts
                const savedProducts = localStorage.getItem('availableProducts');
                return savedProducts ? JSON.parse(savedProducts) : initialProducts;
            } catch (error) {
                console.error('Error loading products from localStorage:', error);
                return initialProducts;
            }
        }
    );

    // Update ref dan localStorage saat availableProducts berubah
    useEffect(() => {
        availableProductsRef.current = availableProducts;
        try {
            localStorage.setItem('availableProducts', JSON.stringify(availableProducts));
        } catch (error) {
            console.error('Error saving products to localStorage:', error);
        }
    }, [availableProducts]);
    
    // Daftar kemasan yang sudah ada
    const existingKemasan: string[] = useMemo(() => {
        const kemasanSet = new Set<string>();
        categories.forEach((category: Category) => {
            kemasanSet.add(category.name);
        });
        return Array.from(kemasanSet).sort();
    }, [categories]);
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
    // Handler    // Menambahkan produk baru ke daftar yang tersedia
    const handleAddNewProduct = (index: number, productName: string) => {
        if (!productName.trim()) return;
        
        // Cek apakah produk sudah ada
        const productExists = availableProducts.some(p => 
            p.name.toLowerCase() === productName.toLowerCase()
        );
        
        if (!productExists) {
            const newProduct = {
                id: Date.now(), // ID sementara
                name: productName.trim()
            };
            
            const updatedProducts = [...availableProducts, newProduct];
            setAvailableProducts(updatedProducts);
            
            // Update input field dengan nama produk yang baru ditambahkan
            const newDetails = [...details];
            newDetails[index] = {
                ...newDetails[index],
                nama_produk: productName.trim()
            };
            setDetails(newDetails);
        }
    };
    // Handler perubahan detail produk
    const handleDetailChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newDetails = [...details];
        const field = e.target.name as keyof DetailItem;
        const value = e.target.value;
        
        newDetails[index][field] = value;

        // Jika field yang berubah adalah nama_produk dan ada tombol enter
        if (field === 'nama_produk' && e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.key === 'Enter') {
            e.preventDefault();
            if (value && !availableProducts.some(p => p.name === value)) {
                handleAddNewProduct(index, value);
            }
        }

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
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        
        // Validasi form
        const validationErrors: Record<string, string> = {};
        
        if (!header.no_faktur) validationErrors.no_faktur = 'No Faktur harus diisi';
        if (!header.supplier_id) validationErrors.supplier_id = 'PBF harus dipilih';
        if (!header.tanggal_faktur) validationErrors.tanggal_faktur = 'Tanggal Faktur harus diisi';
        if (!header.jatuh_tempo) validationErrors.jatuh_tempo = 'Jatuh Tempo harus diisi';
        
        // Validasi detail produk
        details.forEach((detail, index) => {
            if (!detail.nama_produk) {
                validationErrors[`details.${index}.nama_produk`] = 'Nama produk harus diisi';
            }
            if (!detail.expired) {
                validationErrors[`details.${index}.expired`] = 'Tanggal kadaluarsa harus diisi';
            }
            if (!detail.jumlah || parseFloat(detail.jumlah) <= 0) {
                validationErrors[`details.${index}.jumlah`] = 'Jumlah harus lebih dari 0';
            }
            if (!detail.harga_satuan || parseFloat(detail.harga_satuan) <= 0) {
                validationErrors[`details.${index}.harga_satuan`] = 'Harga satuan harus lebih dari 0';
            }
        });
        
        if (Object.keys(validationErrors).length > 0) {
            setAlert({
                type: 'error',
                message: 'Terdapat kesalahan pada form:\n' + 
                    Object.entries(validationErrors).map(([field, msg]) => `- ${msg}`).join('\n')
            });
            setProcessing(false);
            return;
        }
        
        // Siapkan data untuk dikirim
        const formData = new FormData();
        
        // Data header
        formData.append('no_faktur', header.no_faktur);
        formData.append('supplier_id', header.supplier_id);
        
        // Dapatkan data supplier yang dipilih
        const selectedSupplier = suppliers.find(s => String(s.id) === header.supplier_id);
        if (!selectedSupplier) {
            setAlert({
                type: 'error',
                message: 'Supplier tidak valid. Silakan pilih supplier yang benar.'
            });
            setProcessing(false);
            return;
        }
        
        // Gunakan nama perusahaan supplier yang sesuai dengan ID-nya
        formData.append('pbf', selectedSupplier.company);
        formData.append('tanggal_faktur', header.tanggal_faktur);
        formData.append('tanggal_invoice', header.tanggal_faktur);
        formData.append('jatuh_tempo', header.jatuh_tempo);
        formData.append('status', status);
        formData.append('keterangan', header.keterangan || '');
        formData.append('ppn_percentage', ppnPercentage);
        
        // Hitung total jumlah produk
        const totalJumlah = details.reduce((sum, detail) => {
            return sum + (parseFloat(detail.jumlah) || 0);
        }, 0);
        formData.append('jumlah', String(totalJumlah));
        
        // Hitung total pembelian
        const totalPembelian = details.reduce((sum, detail) => {
            return sum + (parseFloat(detail.sub_total) || 0);
        }, 0);
        formData.append('total', String(totalPembelian));
        
        if (status === 'PAID' && tanggalPembayaran) {
            formData.append('tanggal_pembayaran', tanggalPembayaran);
        }
        
        // Tambahkan detail produk
        details.forEach((detail, index) => {
            const jumlah = parseFloat(detail.jumlah) || 0;
            const hargaSatuan = parseFloat(detail.harga_satuan) || 0;
            const diskon = parseFloat(detail.discount_percentage) || 0;
            const gross = jumlah * hargaSatuan;
            const subTotal = gross - (gross * diskon / 100);
            
            const detailData = {
                product_id: '', // Ini akan diisi oleh backend
                product_name: detail.nama_produk,
                nama_produk: detail.nama_produk, // Tambahkan field nama_produk
                expired: detail.expired,
                jumlah: jumlah,
                kemasan: detail.kemasan || '',
                harga_satuan: hargaSatuan,
                diskon: diskon,
                sub_total: subTotal,
                expired_date: detail.expired,
                gross: gross,
                total: subTotal
            };
            
            // Tambahkan semua field ke formData
            Object.entries(detailData).forEach(([key, value]) => {
                formData.append(`details[${index}][${key}]`, String(value));
            });
        });

        // Kirim data ke server
        router.post(route('purchases.store'), formData, {
            onSuccess: () => {
                // Simpan daftar produk yang sudah ada
                const existingProducts = [...availableProducts];
                
                // Reset form setelah berhasil disimpan
                setHeader({
                    no_faktur: '',
                    pbf: '',
                    tanggal_faktur: '',
                    jatuh_tempo: '',
                    tanggal_pembayaran: '',
                    keterangan: '',
                    supplier_id: ''
                });
                setDetails([{
                    nama_produk: '',
                    expired: '',
                    jumlah: '1',
                    kemasan: '',
                    harga_satuan: '0',
                    gross: '0.00',
                    discount_percentage: '0',
                    sub_total: '0.00'
                }]);
                setPpnPercentage('0');
                
                // Kembalikan daftar produk yang sudah ada
                setAvailableProducts(existingProducts);
                
                // Tampilkan pesan sukses
                setAlert({
                    type: 'success',
                    message: 'Pembelian berhasil disimpan!'
                });
            },
            onError: (errors) => {
                console.error('Error menyimpan pembelian:', errors);
                
                // Cek error validasi
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.entries(errors)
                        .map(([field, message]) => `${field}: ${message}`)
                        .join('\n');
                    
                    setAlert({
                        type: 'error',
                        message: `Gagal menyimpan pembelian.\n\n${errorMessages}`
                    });
                } else if (errors && typeof errors === 'string') {
                    setAlert({
                        type: 'error',
                        message: `Gagal menyimpan pembelian: ${errors}`
                    });
                } else {
                    setAlert({
                        type: 'error',
                        message: 'Terjadi kesalahan saat menyimpan pembelian. Silakan coba lagi.'
                    });
                }
                
                // Tampilkan error di console untuk debugging
                console.error('Detail error:', errors);
            }
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
                                    <Label htmlFor="pbf" className="text-gray-900 dark:text-white">Supplier (PBF)</Label>
                                    <Select 
                                        value={header.supplier_id || "_none"}
                                        onValueChange={handleSupplierChange}
                                    >
                                        <SelectTrigger className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                                            <SelectValue placeholder="Pilih Supplier" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                                            <SelectItem value="_none">Pilih Supplier</SelectItem>
                                            {suppliers.map(s => (
                                                <SelectItem key={s.id} value={String(s.id)} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                                    {s.company}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {alert?.type === 'error' && alert.message.includes('PBF') && (
                                        <p className="text-sm text-red-500 mt-1">PBF harus dipilih</p>
                                    )}
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
                                    <div className="md:col-span-2">
                                        <Label htmlFor={`nama_produk_${idx}`}>Nama Produk (URAIAN)</Label>
                                        <div className="relative">
                                            <div className="flex">
                                                <Input
                                                    id={`nama_produk_${idx}`}
                                                    name="nama_produk"
                                                    value={detail.nama_produk}
                                                    onChange={e => handleDetailChange(idx, e)}
                                                    onKeyDown={e => e.key === 'Enter' && e.preventDefault()}
                                                    list={`product-list-${idx}`}
                                                    autoComplete="off"
                                                    className="w-full pr-8"
                                                    placeholder="Ketik nama produk..."
                                                    required
                                                />
                                                {detail.nama_produk && !availableProducts.some((p: {name: string}) => p.name === detail.nama_produk) && (
                                                    <button
                                                        type="button"
                                                        className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded flex items-center gap-1"
                                                        onClick={() => handleAddNewProduct(idx, detail.nama_produk)}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Tambah
                                                    </button>
                                                )}
                                            </div>
                                            <datalist id={`product-list-${idx}`}>
                                                {availableProducts.map((product) => (
                                                    <option key={product.id} value={product.name} />
                                                ))}
                                            </datalist>
                                            <datalist id={`kemasan-list-${idx}`}>
                                                {existingKemasan.map((kemasan, i) => (
                                                    <option key={i} value={kemasan} />
                                                ))}
                                            </datalist>
                                            <div className="absolute right-2 top-2.5 text-xs text-gray-400">
                                                {detail.kemasan && existingKemasan.includes(detail.kemasan) ? '✓' : 'Baru'}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor={`expired_${idx}`}>KADALUARSA</Label>
                                        <Input 
                                            id={`expired_${idx}`} 
                                            name="expired" 
                                            type="date" 
                                            value={detail.expired} 
                                            onChange={e => handleDetailChange(idx, e)} 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`jumlah_${idx}`}>KUANTITAS (QTY)</Label>
                                        <Input 
                                            id={`jumlah_${idx}`} 
                                            name="jumlah" 
                                            type="number" 
                                            min="1" 
                                            value={detail.jumlah} 
                                            onChange={e => handleDetailChange(idx, e)} 
                                            required 
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor={`kemasan_${idx}`}>KATEGORI KEMASAN</Label>
                                        <div className="relative">
                                            <Input
                                                id={`kemasan_${idx}`}
                                                name="kemasan"
                                                value={detail.kemasan}
                                                onChange={e => handleDetailChange(idx, e)}
                                                list={`kemasan-list-${idx}`}
                                                autoComplete="off"
                                                className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                                                placeholder="Pilih atau ketik kemasan..."
                                            />
                                            <datalist id={`kemasan-list-${idx}`}>
                                                {existingKemasan.map((kemasan, i) => (
                                                    <option key={i} value={kemasan} />
                                                ))}
                                            </datalist>
                                            <div className="absolute right-2 top-2.5 text-xs text-gray-400">
                                                {detail.kemasan && existingKemasan.includes(detail.kemasan) ? '✓' : 'Baru'}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor={`harga_satuan_${idx}`}>HARGA SATUAN</Label>
                                        <Input 
                                            id={`harga_satuan_${idx}`} 
                                            name="harga_satuan" 
                                            type="number" 
                                            value={detail.harga_satuan} 
                                            onChange={e => handleDetailChange(idx, e)} 
                                            required 
                                            step="0.01"
                                            min="0"
                                        />
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
