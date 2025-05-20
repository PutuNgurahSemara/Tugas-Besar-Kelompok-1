import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Supplier } from '@/types';
import { Head, Link, usePage, router } from '@inertiajs/react';

declare global {
    interface Window {
        toastr?: {
            success: (message: string, title?: string, options?: any) => void;
            error: (message: string, title?: string, options?: any) => void;
            info: (message: string, title?: string, options?: any) => void;
            warning: (message: string, title?: string, options?: any) => void;
        };
    }
}
import type { PageProps } from '@/types/inertia';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/InputError';
import { Progress } from "@/components/ui/progress";
import { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import axios from 'axios';

type Product = {
    id: number;
    name: string;
};

interface PurchaseEditPageProps extends PageProps {
    purchase: any;
    suppliers: Supplier[];
    products: Product[];
    categories: Category[];
    [key: string]: unknown;
}



interface DetailItem {
    id?: number;
    product_id?: string | number;
    product_name?: string;
    nama_produk: string;
    expired: string;
    jumlah: string;
    kemasan: string;
    harga_satuan: string;
    gross: string;
    discount_percentage: string;
    sub_total: string;
    [key: string]: string | number | undefined;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Purchases', href: route('purchases.index') },
    { title: 'Edit Purchase', href: '#' },
];

export default function PurchaseEdit({
    purchase: initialPurchase,
    suppliers: initialSuppliers,
    products: productsProp = [],
    categories
}: PurchaseEditPageProps) {
    // State untuk daftar produk yang tersedia
    const [availableProducts, setAvailableProducts] = useState<Product[]>(productsProp);
    
    // State untuk menyimpan riwayat input obat
    const [productHistory, setProductHistory] = useState<Set<string>>(new Set(
        productsProp.map((p: Product) => p.name.toLowerCase())
    ));

    // Update availableProducts ketika productsProp berubah
    useEffect(() => {
        setAvailableProducts(productsProp);
    }, [productsProp]);

    // State untuk header form
    const [header, setHeader] = useState(() => {
        // Format tanggal ke YYYY-MM-DD untuk input type="date"
        const formatDate = (dateString: string | null) => {
            if (!dateString) return '';
            try {
                const date = new Date(dateString);
                // Pastikan tanggal valid sebelum diformat
                if (isNaN(date.getTime())) return '';
                return date.toISOString().split('T')[0];
            } catch (e) {
                return '';
            }
        };

        // Pastikan supplier_id selalu string dan valid
        const getSupplierId = () => {
            if (initialPurchase.supplier_id) {
                return String(initialPurchase.supplier_id);
            }
            if (initialPurchase.supplier?.id) {
                return String(initialPurchase.supplier.id);
            }
            return '';
        };

        return {
            no_faktur: initialPurchase.no_faktur || '',
            supplier_id: getSupplierId(),
            tanggal_faktur: formatDate(initialPurchase.tanggal_invoice || initialPurchase.tanggal_faktur || ''),
            jatuh_tempo: formatDate(initialPurchase.tanggal_jatuh_tempo || initialPurchase.jatuh_tempo || ''),
            tanggal_pembayaran: formatDate(initialPurchase.tanggal_pembayaran || ''),
            keterangan: initialPurchase.catatan || initialPurchase.keterangan || '',
        };
    });
    
    // State untuk detail produk
    const [details, setDetails] = useState<DetailItem[]>(() => {
        if (initialPurchase.details?.length) {
            return initialPurchase.details.map((detail: any) => {
                const jumlah = parseFloat(detail.jumlah) || 0;
                const hargaSatuan = parseFloat(detail.harga_satuan) || 0;
                const diskon = parseFloat(detail.discount_percentage || detail.diskon || '0') || 0;
                const gross = parseFloat(detail.gross) || (jumlah * hargaSatuan);
                const subTotal = parseFloat(detail.sub_total) || (gross - (gross * diskon / 100));
                const productName = detail.product?.name || detail.nama_produk || detail.product_name || '';
                
                // Format tanggal kadaluarsa ke YYYY-MM-DD
                const formatExpiredDate = (dateString: string | null) => {
                    if (!dateString) return '';
                    try {
                        const date = new Date(dateString);
                        // Pastikan tanggal valid
                        if (isNaN(date.getTime())) return '';
                        return date.toISOString().split('T')[0];
                    } catch (e) {
                        return '';
                    }
                };
                
                // Tambahkan ke riwayat produk
                if (productName) {
                    setProductHistory(prev => new Set(prev).add(productName.toLowerCase()));
                }
                
                return {
                    id: detail.id,
                    product_id: detail.product_id,
                    product_name: productName,
                    nama_produk: productName,
                    expired: formatExpiredDate(detail.expired_date || detail.expired || ''),
                    jumlah: jumlah.toString(),
                    kemasan: detail.kemasan || '',
                    harga_satuan: hargaSatuan.toString(),
                    gross: gross.toString(),
                    discount_percentage: diskon.toString(),
                    sub_total: subTotal.toString(),
                };
            });
        }
        
        return [{
            nama_produk: '',
            expired: '',
            jumlah: '',
            kemasan: '',
            harga_satuan: '',
            gross: '0',
            discount_percentage: '0',
            sub_total: '0',
        }];
    });

    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState(initialPurchase.status || 'UNPAID');
    const [ppnPercentage, setPpnPercentage] = useState(initialPurchase.ppn_percentage?.toString() || '0');
    
    // Update status berdasarkan tanggal pembayaran
    useEffect(() => {
        if (header.tanggal_pembayaran) setStatus('PAID');
        else setStatus('UNPAID');
    }, [header.tanggal_pembayaran]);

    // Fungsi untuk mencari produk
    const searchProducts = (query: string) => {
        const searchTerm = query.trim().toLowerCase();
        
        // Tambahkan ke riwayat pencarian jika lebih dari 1 karakter
        if (searchTerm.length > 1) {
            setProductHistory(prev => {
                const newHistory = new Set(prev);
                newHistory.add(searchTerm.toLowerCase());
                return newHistory;
            });
        }
    };

    // Daftar kemasan yang sudah ada
    const existingKemasan: string[] = useMemo(() => {
        const kemasanSet = new Set<string>();
        categories.forEach((category: Category) => {
            kemasanSet.add(category.name);
        });
        return Array.from(kemasanSet).sort();
    }, [categories]);

    // Hitung jumlah produk
    const jumlahProduk = details.length;

    // Hitung total
    const subTotalDisplay = details.reduce((sum, d) => sum + (parseFloat(d.sub_total) || 0), 0);
    const ppnAmountDisplay = (subTotalDisplay * (parseFloat(ppnPercentage) || 0)) / 100;
    const grandTotalDisplay = subTotalDisplay + ppnAmountDisplay;

    // Handler perubahan header
    const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setHeader(prev => ({ ...prev, [name]: value }));
    };
    
    // Handler perubahan tanggal pembayaran
    const handleTanggalPembayaranChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setHeader(prev => ({ ...prev, tanggal_pembayaran: newValue }));
    };

    // Handler perubahan detail produk
    const handleDetailChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newDetails = [...details];
        const field = e.target.name;
        const value = e.target.value;
        
        // Pastikan field yang diubah adalah field yang valid pada DetailItem
        if (field in newDetails[index]) {
            // Update nilai field yang berubah dengan tipe yang sesuai
            newDetails[index] = {
                ...newDetails[index],
                [field]: value
            };

            // Jika field yang berubah adalah nama_produk dan ada tombol enter
            if (field === 'nama_produk' && e.nativeEvent instanceof KeyboardEvent && e.nativeEvent.key === 'Enter') {
                e.preventDefault();
                if (value && !availableProducts.some(p => p.name === value)) {
                    handleAddNewProduct(index, value);
                    return; // Keluar dari fungsi karena handleAddNewProduct akan memperbarui state
                }
            }

            // Hitung ulang jika field yang berubah mempengaruhi perhitungan
            if (['jumlah', 'harga_satuan', 'discount_percentage'].includes(field)) {
                const qty = parseFloat(newDetails[index].jumlah) || 0;
                const unitPrice = parseFloat(newDetails[index].harga_satuan) || 0;
                const discPercentage = parseFloat(newDetails[index].discount_percentage) || 0;

                const gross = qty * unitPrice;
                const discountAmount = (gross * discPercentage) / 100;
                const subTotal = gross - discountAmount;
                
                newDetails[index] = {
                    ...newDetails[index],
                    gross: gross.toFixed(2),
                    sub_total: subTotal.toFixed(2)
                };
            }
            
            setDetails(newDetails);
        }
    };

    // Tambah produk baru
    const handleAddNewProduct = (index: number, productName: string) => {
        const trimmedName = productName.trim();
        if (!trimmedName) return;
        
        // Cek apakah produk sudah ada
        const productExists = availableProducts.some(p => 
            p.name.toLowerCase() === trimmedName.toLowerCase()
        );
        
        // Update available products jika produk belum ada
        if (!productExists) {
            const newProduct = {
                id: Date.now(), // ID sementara
                name: trimmedName
            };
            
            setAvailableProducts(prev => [...prev, newProduct]);
        }
        
        // Update input field dengan nama produk
        setDetails(prev => {
            const newDetails = [...prev];
            newDetails[index] = {
                ...newDetails[index],
                nama_produk: trimmedName,
                product_name: trimmedName
            };
            return newDetails;
        });
        
        // Tambahkan ke riwayat produk
        setProductHistory(prev => {
            const newHistory = new Set(prev);
            newHistory.add(trimmedName.toLowerCase());
            return newHistory;
        });
    };

    // Tambahkan semua produk yang tersedia ke daftar pembelian
    const handleAddAllProducts = () => {
        if (availableProducts.length === 0) return;
        
        setDetails(prevDetails => {
            // Buat Set dari nama produk yang sudah ada untuk pencarian yang lebih cepat
            const existingProductNames = new Set(
                prevDetails.map(d => d.nama_produk.toLowerCase())
            );
            
            // Filter produk yang belum ada di details
            const newProducts = availableProducts.filter((product: Product) => 
                !existingProductNames.has(product.name.toLowerCase())
            );
            
            if (newProducts.length === 0) {
                // Tidak ada produk baru untuk ditambahkan
                return prevDetails;
            }
            
            // Buat detail baru untuk setiap produk yang belum ada
            const newDetails = newProducts.map((product: Product) => ({
                nama_produk: product.name,
                expired: '',
                jumlah: '1',
                kemasan: '',
                harga_satuan: '0',
                gross: '0',
                discount_percentage: '0',
                sub_total: '0',
                product_id: product.id,
                product_name: product.name
            }));
            
            // Gabungkan dengan details yang sudah ada
            const updatedDetails = [...prevDetails, ...newDetails];
            
            // Tampilkan notifikasi
            alert(`Berhasil menambahkan ${newProducts.length} produk ke daftar pembelian`);
            
            return updatedDetails;
        });
    };

    // Tambah baris detail
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
            }
        ]);
    };

    // Hapus baris detail
    const removeDetailRow = (index: number) => {
        if (details.length <= 1) return;
        
        const newDetails = details.filter((_, i) => i !== index);
        setDetails(newDetails);
    };

    // Handle submit form
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validasi form hanya untuk field yang diubah
        const isFormChanged = 
            header.no_faktur !== initialPurchase.no_faktur ||
            header.supplier_id !== String(initialPurchase.supplier_id) ||
            header.tanggal_faktur !== initialPurchase.tanggal_faktur ||
            header.jatuh_tempo !== initialPurchase.jatuh_tempo ||
            header.keterangan !== (initialPurchase.keterangan || '') ||
            status !== initialPurchase.status ||
            ppnPercentage !== String(initialPurchase.ppn_percentage || '0');
            
        // Jika ada perubahan pada header, lakukan validasi
        if (isFormChanged) {
            const requiredFields = [];
            
            // Hanya validasi field yang berubah
            if (header.no_faktur !== initialPurchase.no_faktur) {
                requiredFields.push({ field: header.no_faktur, name: 'Nomor Faktur' });
            }
            if (header.supplier_id !== String(initialPurchase.supplier_id)) {
                requiredFields.push({ field: header.supplier_id, name: 'PBF' });
            }
            if (header.tanggal_faktur !== initialPurchase.tanggal_faktur) {
                requiredFields.push({ field: header.tanggal_faktur, name: 'Tanggal Faktur' });
            }
            if (header.jatuh_tempo !== initialPurchase.jatuh_tempo) {
                requiredFields.push({ field: header.jatuh_tempo, name: 'Jatuh Tempo' });
            }
            
            const missingFields = requiredFields.filter(field => !field.field).map(field => field.name);
            
            if (missingFields.length > 0) {
                alert(`Harap isi semua field yang diperlukan: ${missingFields.join(', ')}`);
                return;
            }
        }
        
        // Buat salinan details untuk dimodifikasi
        const updatedDetails = [...details];
        
        // Set default value untuk field yang kosong pada setiap detail
        updatedDetails.forEach(detail => {
            if (!detail.harga_satuan || isNaN(parseFloat(detail.harga_satuan))) {
                detail.harga_satuan = '0';
            }
            if (!detail.jumlah || isNaN(parseFloat(detail.jumlah))) {
                detail.jumlah = '0';
            }
            if (!detail.discount_percentage || isNaN(parseFloat(detail.discount_percentage))) {
                detail.discount_percentage = '0';
            }
            
            // Hitung ulang gross dan sub_total
            const jumlah = parseFloat(detail.jumlah) || 0;
            const hargaSatuan = parseFloat(detail.harga_satuan) || 0;
            const diskon = parseFloat(detail.discount_percentage) || 0;
            
            detail.gross = (jumlah * hargaSatuan).toString();
            const totalDiskon = (parseFloat(detail.gross) * diskon) / 100;
            detail.sub_total = (parseFloat(detail.gross) - totalDiskon).toString();
        });
        
        // Update state details dengan nilai yang sudah dihitung ulang
        setDetails(updatedDetails);
        
        // Validasi detail produk hanya jika ada perubahan
        const isDetailsChanged = JSON.stringify(updatedDetails) !== JSON.stringify(initialPurchase.details || []);
        
        if (isDetailsChanged) {
            if (updatedDetails.length === 0) {
                alert('Minimal harus ada 1 produk');
                return;
            }
            
            const invalidDetails = updatedDetails.some(detail => {
                return !detail.nama_produk || !detail.jumlah || !detail.harga_satuan || !detail.expired;
            });
            
            if (invalidDetails) {
                alert('Semua produk harus memiliki nama, jumlah, harga, dan tanggal kadaluarsa');
                return;
            }
        }
        
        setProcessing(true);

        // Siapkan data untuk dikirim ke server
        const formData = new FormData();
        
        // Tambahkan CSRF token
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
            formData.append('_token', csrfToken);
        }
        
        // Data header
        formData.append('_method', 'PUT');
        formData.append('no_faktur', header.no_faktur || '');
        
        // Pastikan supplier_id yang dikirim valid
        console.log('Initial Purchase:', {
            supplier_id: initialPurchase.supplier_id,
            supplier: initialPurchase.supplier,
            header_supplier_id: header.supplier_id
        });
        
        // Dapatkan supplier_id dari sumber yang paling mungkin
        const getSupplierId = () => {
            // Coba dari header terlebih dahulu
            if (header.supplier_id) return header.supplier_id;
            
            // Coba dari initialPurchase.supplier_id
            if (initialPurchase.supplier_id) return String(initialPurchase.supplier_id);
            
            // Coba dari relasi supplier jika ada
            if (initialPurchase.supplier?.id) return String(initialPurchase.supplier.id);
            
            return '';
        };
        
        const finalSupplierId = getSupplierId();
        console.log('Final Supplier ID to send:', finalSupplierId);
        
        if (!finalSupplierId) {
            alert('Supplier tidak valid. Silakan pilih supplier yang valid.');
            setProcessing(false);
            return;
        }
        
        // Selalu kirim supplier_id dan pbf dengan nilai yang sama
        formData.set('supplier_id', finalSupplierId);
        formData.set('pbf', finalSupplierId);
        
        formData.append('tanggal_faktur', header.tanggal_faktur || new Date().toISOString().split('T')[0]);
        formData.append('tanggal_invoice', header.tanggal_faktur || new Date().toISOString().split('T')[0]);
        formData.append('jatuh_tempo', header.jatuh_tempo || '');
        formData.append('status', status || 'UNPAID');
        formData.append('keterangan', header.keterangan || '');
        formData.append('ppn_percentage', ppnPercentage || '0');
        formData.append('catatan', header.keterangan || '');
        
        // Hitung total jumlah produk
        const totalJumlah = updatedDetails.reduce((sum, detail) => {
            return sum + (parseFloat(detail.jumlah) || 0);
        }, 0);
        formData.append('jumlah', String(totalJumlah));
        
        // Hitung total pembelian
        const totalPembelian = updatedDetails.reduce((sum, detail) => {
            return sum + (parseFloat(detail.sub_total) || 0);
        }, 0);
        formData.append('total', String(totalPembelian));
        
        if (status === 'PAID' && header.tanggal_pembayaran) {
            formData.append('tanggal_pembayaran', header.tanggal_pembayaran);
        }
        
        // Tambahkan detail produk
        updatedDetails.forEach((detail, index) => {
            const detailData = {
                id: detail.id || '',
                product_id: detail.product_id || '',
                product_name: detail.nama_produk || '',
                nama_produk: detail.nama_produk || '',
                jumlah: detail.jumlah || '0',
                kemasan: detail.kemasan || '',
                harga_satuan: detail.harga_satuan || '0',
                diskon: detail.discount_percentage || '0',
                sub_total: detail.sub_total || '0',
                expired: detail.expired || '',
                expired_date: detail.expired || '',
                gross: detail.gross || '0',
                total: detail.sub_total || '0'
            };
            
            // Tambahkan semua field ke formData
            Object.entries(detailData).forEach(([key, value]) => {
                formData.append(`details[${index}][${key}]`, String(value));
            });
        });
        
        try {
            console.log('Mengirim data:', Object.fromEntries(formData.entries()));

            // Kirim data ke server menggunakan Inertia.js router
            await router.post(route('purchases.update', initialPurchase.id), formData, {
                onSuccess: () => {
                    // Redirect ke halaman daftar pembelian dengan pesan sukses
                    router.visit(route('purchases.index'), {
                        onSuccess: () => {
                            if (typeof window !== 'undefined' && window.toastr) {
                                window.toastr.success('Pembelian berhasil diperbarui');
                            } else {
                                alert('Pembelian berhasil diperbarui');
                            }
                        }
                    });
                },
                onError: (errors) => {
                    console.error('Error updating purchase:', errors);
                    let errorMessage = 'Terjadi kesalahan saat menyimpan perubahan.';
                    
                    if (errors?.message) {
                        errorMessage = errors.message;
                    } else if (typeof errors === 'object') {
                        const errorMessages = Object.values(errors).flat();
                        if (errorMessages.length > 0) {
                            errorMessage = errorMessages.join('\n');
                        }
                    }
                    
                    alert(errorMessage);
                    setProcessing(false);
                },
                onFinish: () => {
                    setProcessing(false);
                },
                preserveScroll: true,
                forceFormData: true
            });
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            alert('Terjadi kesalahan saat memproses permintaan. Silakan coba lagi.');
            setProcessing(false);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Edit Purchase" />
            
            <div className="space-y-6">

                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">Edit Purchase</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" method="POST">
                    <input type="hidden" name="_token" value={String(usePage().props.csrf_token || '')} />
                    <input type="hidden" name="_method" value="PUT" />
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Umum</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="no_faktur">No. Faktur</Label>
                                <Input
                                    id="no_faktur"
                                    name="no_faktur"
                                    value={header.no_faktur}
                                    onChange={handleHeaderChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="supplier_id">PBF</Label>
                                <select
                                    id="supplier_id"
                                    name="supplier_id"
                                    value={header.supplier_id}
                                    onChange={handleHeaderChange}
                                    className="w-full bg-background text-foreground"
                                    required
                                >
                                    <option value="">Pilih PBF</option>
                                    {initialSuppliers.map((supplier) => (
                                        <option key={supplier.id} value={supplier.id}>
                                            {supplier.company}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tanggal_faktur">Tanggal Faktur</Label>
                                <Input
                                    type="date"
                                    id="tanggal_faktur"
                                    name="tanggal_faktur"
                                    value={header.tanggal_faktur}
                                    onChange={handleHeaderChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="jatuh_tempo">Jatuh Tempo</Label>
                                <Input
                                    type="date"
                                    id="jatuh_tempo"
                                    name="jatuh_tempo"
                                    value={header.jatuh_tempo}
                                    onChange={handleHeaderChange}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Status</Label>
                                <div className="flex items-center space-x-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="UNPAID"
                                            checked={status === 'UNPAID'}
                                            onChange={() => setStatus('UNPAID')}
                                            className="mr-2"
                                        />
                                        Belum Lunas
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            value="PAID"
                                            checked={status === 'PAID'}
                                            onChange={() => setStatus('PAID')}
                                            className="mr-2"
                                        />
                                        Lunas
                                    </label>
                                </div>
                            </div>

                            {status === 'PAID' && (
                                <div className="space-y-2">
                                    <Label htmlFor="tanggal_pembayaran">Tanggal Pembayaran</Label>
                                    <Input
                                        type="date"
                                        id="tanggal_pembayaran"
                                        name="tanggal_pembayaran"
                                        value={header.tanggal_pembayaran}
                                        onChange={handleHeaderChange}
                                        required={status === 'PAID'}
                                    />
                                </div>
                            )}

                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="keterangan">Keterangan</Label>
                                <textarea
                                    id="keterangan"
                                    name="keterangan"
                                    value={header.keterangan || ''}
                                    onChange={(e) => 
                                        setHeader(prev => ({ ...prev, keterangan: e.target.value }))
                                    }
                                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500"
                                    rows={3}
                                    placeholder="Masukkan keterangan (opsional)"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Detail Produk</CardTitle>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={addDetailRow}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tambah Produk
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {details.map((detail, index) => (
                                    <div key={index} className="border rounded-lg p-4 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <Label>Nama Produk</Label>
                                                <div className="relative">
                                                    <Input
                                                        value={detail.nama_produk}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            const newDetails = [...details];
                                                            newDetails[index].nama_produk = value;
                                                            setDetails(newDetails);
                                                            
                                                            // Cari produk saat mengetik
                                                            if (value.length > 1) {
                                                                searchProducts(value);
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddNewProduct(index, detail.nama_produk);
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            // Saat input kehilangan fokus, pastikan nilai tersimpan
                                                            if (detail.nama_produk.trim()) {
                                                                handleAddNewProduct(index, detail.nama_produk);
                                                            }
                                                        }}
                                                        list={`products-list-${index}`}
                                                        placeholder="Cari atau tambah obat"
                                                        className="w-full"
                                                        required
                                                    />
                                                    <datalist id={`products-list-${index}`}>
                                                        {availableProducts.map((product) => (
                                                            <option key={product.id} value={product.name}>
                                                                {product.name}
                                                            </option>
                                                        ))}
                                                    </datalist>
                                                    {detail.nama_produk && (
                                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newDetails = [...details];
                                                                    newDetails[index].nama_produk = '';
                                                                    setDetails(newDetails);
                                                                }}
                                                                className="text-muted-foreground hover:text-foreground"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label>Expired</Label>
                                                <Input
                                                    type="date"
                                                    value={detail.expired}
                                                    onChange={(e) => {
                                                        const newDetails = [...details];
                                                        newDetails[index].expired = e.target.value;
                                                        setDetails(newDetails);
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Jumlah</Label>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    value={detail.jumlah}
                                                    onChange={(e) => {
                                                        const newDetails = [...details];
                                                        newDetails[index].jumlah = e.target.value;
                                                        
                                                        // Hitung ulang
                                                        const qty = parseFloat(e.target.value) || 0;
                                                        const price = parseFloat(newDetails[index].harga_satuan) || 0;
                                                        const discount = parseFloat(newDetails[index].discount_percentage) || 0;
                                                        
                                                        const gross = qty * price;
                                                        const discountAmount = (gross * discount) / 100;
                                                        const subTotal = gross - discountAmount;
                                                        
                                                        newDetails[index].gross = gross.toString();
                                                        newDetails[index].sub_total = subTotal.toString();
                                                        
                                                        setDetails(newDetails);
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Kemasan</Label>
                                                <select
                                                    value={detail.kemasan}
                                                    onChange={(e) => {
                                                        const newDetails = [...details];
                                                        newDetails[index].kemasan = e.target.value;
                                                        setDetails(newDetails);
                                                    }}
                                                    className="w-full px-3 py-2 border rounded-md bg-background text-foreground"
                                                    required
                                                >
                                                    <option value="">Pilih Kemasan</option>
                                                    {existingKemasan.map((kemasan, i) => (
                                                        <option key={i} value={kemasan}>
                                                            {kemasan}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Harga Satuan</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    value={detail.harga_satuan}
                                                    onChange={(e) => {
                                                        const newDetails = [...details];
                                                        newDetails[index].harga_satuan = e.target.value;
                                                        
                                                        // Hitung ulang
                                                        const qty = parseFloat(newDetails[index].jumlah) || 0;
                                                        const price = parseFloat(e.target.value) || 0;
                                                        const discount = parseFloat(newDetails[index].discount_percentage) || 0;
                                                        
                                                        const gross = qty * price;
                                                        const discountAmount = (gross * discount) / 100;
                                                        const subTotal = gross - discountAmount;
                                                        
                                                        newDetails[index].gross = gross.toString();
                                                        newDetails[index].sub_total = subTotal.toString();
                                                        
                                                        setDetails(newDetails);
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Diskon (%)</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={detail.discount_percentage}
                                                    onChange={(e) => {
                                                        const newDetails = [...details];
                                                        newDetails[index].discount_percentage = e.target.value;
                                                        
                                                        // Hitung ulang
                                                        const qty = parseFloat(newDetails[index].jumlah) || 0;
                                                        const price = parseFloat(newDetails[index].harga_satuan) || 0;
                                                        const discount = parseFloat(e.target.value) || 0;
                                                        
                                                        const gross = qty * price;
                                                        const discountAmount = (gross * discount) / 100;
                                                        const subTotal = gross - discountAmount;
                                                        
                                                        newDetails[index].gross = gross.toString();
                                                        newDetails[index].sub_total = subTotal.toString();
                                                        
                                                        setDetails(newDetails);
                                                    }}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Sub Total</Label>
                                                <Input
                                                    type="text"
                                                    value={new Intl.NumberFormat('id-ID', {
                                                        style: 'currency',
                                                        currency: 'IDR',
                                                        minimumFractionDigits: 0,
                                                    }).format(parseFloat(detail.sub_total) || 0)}
                                                    readOnly
                                                    className="font-medium"
                                                />
                                            </div>

                                            <div className="flex items-end">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="icon"
                                                    onClick={() => removeDetailRow(index)}
                                                    className="text-destructive"
                                                    disabled={details.length <= 1}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Ringkasan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span>Total Produk:</span>
                                <span className="font-medium">{jumlahProduk} item</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span className="font-medium">
                                    {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                    }).format(subTotalDisplay)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <div className="flex items-center space-x-2">
                                    <span>PPN ({ppnPercentage}%):</span>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={ppnPercentage}
                                        onChange={(e) => setPpnPercentage(e.target.value)}
                                        className="w-20 h-8"
                                    />
                                </div>
                                <span className="font-medium">
                                    {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                    }).format(ppnAmountDisplay)}
                                </span>
                            </div>

                            <div className="flex justify-between border-t pt-2">
                                <span className="font-bold">Total:</span>
                                <span className="font-bold text-lg">
                                    {new Intl.NumberFormat('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 0,
                                    }).format(grandTotalDisplay)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end space-x-4">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => window.history.back()}
                            disabled={processing}
                        >
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
