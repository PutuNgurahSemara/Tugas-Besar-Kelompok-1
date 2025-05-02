import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Produk } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/InputError';
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Tambahkan interface untuk purchase
interface PurchaseItem {
    id: number;
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total: number;
    expired?: string;
    available_quantity?: number;
}
interface Purchase {
    id: number;
    items: PurchaseItem[];
}

interface ProdukEditProps {
    produk: Produk & { 
        category: Category | null;
        purchase: Purchase | null;
    };
    categories: Category[];
    availablePurchases: Purchase[];
}

export default function ProdukEdit() {
    const { produk, categories, availablePurchases } = usePage<ProdukEditProps>().props;
    const [preview, setPreview] = useState<string | null>(produk.image ? `/storage/${produk.image}` : null);
    const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(produk.purchase);
    const [maxQuantity, setMaxQuantity] = useState<number>(
        produk.purchase ? 
        produk.purchase.items.reduce((total, item) => total + item.quantity, 0) : 
        Infinity
    );
    const [useCustomName, setUseCustomName] = useState<boolean>(false);
    
    const { data, setData, post, errors, processing, progress } = useForm({
        nama: produk.nama || '',
        custom_nama: '', // Tambahkan field untuk nama custom
        purchase_id: produk.purchase?.id ? String(produk.purchase.id) : '',
        category_id: produk.category_id ? String(produk.category_id) : '',
        harga: produk.harga ? String(produk.harga) : '',
        quantity: produk.quantity || 0,
        margin: produk.margin !== null ? String(produk.margin) : '',
        expired_at: produk.expired_at || '',
        image: null as File | null,
        _method: 'PUT' // For method spoofing
    });

    // Update data ketika purchase dipilih
    useEffect(() => {
        if (selectedPurchase) {
            // Hitung jumlah maksimum yang diperbolehkan (jumlah tersedia + jumlah produk saat ini)
            setMaxQuantity(
                selectedPurchase.id === produk.purchase?.id ? 
                selectedPurchase.items.reduce((total, item) => total + item.quantity, 0) : 
                selectedPurchase.items.reduce((total, item) => total + item.quantity, 0)
            );
            
            // Jika bukan purchase yang sama dengan produk saat ini, reset nama produk
            if (selectedPurchase.id !== produk.purchase?.id) {
                setData('nama', selectedPurchase.items[0].product_name);
            }
            
            // Isi tanggal expired jika tersedia dan belum diisi
            if (selectedPurchase.items[0].expired && !data.expired_at) {
                setData('expired_at', selectedPurchase.items[0].expired);
            }
            
            // Hitung harga jual default jika margin berubah
            if (selectedPurchase.items[0].unit_price && data.margin) {
                const marginPercent = parseFloat(data.margin);
                const sellingPrice = selectedPurchase.items[0].unit_price * (1 + (marginPercent / 100));
                setData('harga', Math.round(sellingPrice).toString());
            }
        } else {
            // Jika tidak ada purchase yang dipilih, tidak ada batasan jumlah
            setMaxQuantity(Infinity);
        }
    }, [selectedPurchase]);

    // Update harga ketika margin berubah
    useEffect(() => {
        if (selectedPurchase?.items[0].unit_price && data.margin) {
            const marginPercent = parseFloat(data.margin);
            const sellingPrice = selectedPurchase.items[0].unit_price * (1 + (marginPercent / 100));
            setData('harga', Math.round(sellingPrice).toString());
        }
    }, [data.margin]);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        
        // Validasi sebelum submit
        if (selectedPurchase && data.quantity > maxQuantity) {
            alert(`Jumlah tidak boleh melebihi ${maxQuantity}`);
            return;
        }
        
        post(route('produk.update', produk.id));
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('image', file);
            setPreview(URL.createObjectURL(file));
        } else {
            setData('image', null);
            setPreview(produk.image ? `/storage/${produk.image}` : null);
        }
    };
    
    const handlePurchaseSelect = (purchaseId: string) => {
        const purchase = availablePurchases.find(p => p.id.toString() === purchaseId);
        setData('purchase_id', purchaseId);
        setSelectedPurchase(purchase || null);
    };
    
    // Check if product name is custom (different from purchase product name)
    useEffect(() => {
        if (produk.purchase && produk.nama !== produk.purchase.items[0].product_name) {
            setUseCustomName(true);
            setData('custom_nama', produk.nama);
        }
    }, []);
    
    // Buat breadcrumbs
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Products', href: route('produk.index') },
        { title: `Edit ${produk.nama}`, href: route('produk.edit', produk.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${produk.nama}`} />
            <Card>
                <CardHeader>
                    <CardTitle>Edit Product</CardTitle>
                    <CardDescription>Update the product information.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Informasi</AlertTitle>
                        <AlertDescription>
                            Produk yang diedit harus sesuai dengan data purchase. Jumlah produk tidak boleh melebihi jumlah pada purchase.
                        </AlertDescription>
                    </Alert>
                    
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kolom Kiri */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="purchase_id">Purchase (Source)</Label>
                                    <Select 
                                        value={data.purchase_id ? String(data.purchase_id) : ""}
                                        onValueChange={handlePurchaseSelect}
                                    >
                                        <SelectTrigger className="mt-1 block w-full">
                                            <SelectValue placeholder="Select purchase source" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-80 overflow-y-auto">
                                            {availablePurchases.map((purchase) => (
                                                <SelectItem key={purchase.id} value={String(purchase.id)}>
                                                    {purchase.items[0].product_name} (Available: {purchase.items.reduce((total, item) => total + item.quantity, 0)})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.purchase_id} className="mt-2" />
                                </div>
                                
                                <div>
                                    <Label htmlFor="nama">Product Name from Purchase</Label>
                                    <Input
                                        id="nama"
                                        name="nama"
                                        value={data.nama}
                                        onChange={(e) => setData('nama', e.target.value)}
                                        className="mt-1 block w-full"
                                        disabled={true}
                                    />
                                    <InputError message={errors.nama} className="mt-2" />
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2">
                                    <input 
                                        type="checkbox" 
                                        id="useCustomName" 
                                        checked={useCustomName}
                                        onChange={(e) => setUseCustomName(e.target.checked)} 
                                    />
                                    <Label htmlFor="useCustomName" className="cursor-pointer">
                                        Gunakan nama produk custom
                                    </Label>
                                </div>
                                
                                {useCustomName && (
                                    <div>
                                        <Label htmlFor="custom_nama">Custom Product Name *</Label>
                                        <Input
                                            id="custom_nama"
                                            name="custom_nama"
                                            value={data.custom_nama}
                                            onChange={(e) => setData('custom_nama', e.target.value)}
                                            className="mt-1 block w-full"
                                            required={useCustomName}
                                        />
                                        <InputError message={errors.custom_nama} className="mt-2" />
                                    </div>
                                )}
                                
                                <div>
                                    <Label htmlFor="category_id">Category</Label>
                                    <Select 
                                        name="category_id"
                                        value={data.category_id || 'null'} 
                                        onValueChange={(value) => setData('category_id', value === 'null' ? null : value)}
                                    >
                                        <SelectTrigger className="mt-1 block w-full">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-80 overflow-y-auto">
                                            <SelectItem value="null">No Category</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={String(category.id)}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.category_id} className="mt-2" />
                                </div>
                            </div>

                            {/* Kolom Kanan */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="harga">Selling Price *</Label>
                                    <Input
                                        id="harga"
                                        name="harga"
                                        type="number"
                                        value={data.harga}
                                        onChange={(e) => setData('harga', e.target.value)}
                                        className="mt-1 block w-full"
                                        required
                                        min="0"
                                    />
                                    <InputError message={errors.harga} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="quantity">Quantity * {selectedPurchase && `(Max: ${maxQuantity})`}</Label>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        value={data.quantity}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 0;
                                            setData('quantity', value);
                                        }}
                                        className={`mt-1 block w-full ${selectedPurchase && data.quantity > maxQuantity ? 'border-red-500' : ''}`}
                                        required
                                        min="0"
                                    />
                                    {selectedPurchase && data.quantity > maxQuantity && (
                                        <p className="text-sm text-red-500 mt-1">
                                            Jumlah tidak boleh melebihi {maxQuantity}
                                        </p>
                                    )}
                                    <InputError message={errors.quantity} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="margin">Margin (%)</Label>
                                    <Input
                                        id="margin"
                                        name="margin"
                                        type="number"
                                        value={data.margin}
                                        onChange={(e) => setData('margin', e.target.value)}
                                        className="mt-1 block w-full"
                                        min="0" max="100" step="0.01"
                                    />
                                    <InputError message={errors.margin} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="expired_at">Expiry Date</Label>
                                    <Input
                                        id="expired_at"
                                        name="expired_at"
                                        type="date"
                                        value={data.expired_at}
                                        onChange={(e) => setData('expired_at', e.target.value)}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.expired_at} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="image">Product Image</Label>
                                    <Input
                                        id="image"
                                        name="image"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="mt-1 block w-full"
                                    />
                                    {/* Tampilkan Progress Bar */} 
                                    {progress && (
                                        <Progress value={progress.percentage} className="w-full mt-2" />
                                    )}
                                    {/* Tampilkan Preview */} 
                                    {preview && (
                                        <div className="mt-4">
                                            <img src={preview} alt="Preview" className="h-20 w-20 object-cover rounded" />
                                        </div>
                                    )}
                                    <InputError message={errors.image} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => window.history.back()}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing || (selectedPurchase && data.quantity > maxQuantity)}>
                                {processing ? 'Saving...' : 'Update Product'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
} 