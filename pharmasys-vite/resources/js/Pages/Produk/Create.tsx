import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/InputError'; 
import { Progress } from "@/components/ui/progress"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { AlertCircle } from "lucide-react"; 
import { useState, useEffect } from 'react';

interface PurchaseDetail {
    id: number;
    purchase_id: number;
    purchase_no: string;
    supplier: string;
    nama_produk: string;
    jumlah: number;
    kemasan: string;
    harga_satuan: number;
    expired?: string;
    available_quantity: number;
}

interface ProdukCreateProps {
    categories: Category[];
    availablePurchaseDetails: PurchaseDetail[];
    existingProductNames: string[]; // Added this prop
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Products', href: route('produk.index') },
    { title: 'Add Product', href: route('produk.create') },
];

export default function ProdukCreate() {
    const { categories, availablePurchaseDetails, existingProductNames: rawExistingProductNames } = usePage<ProdukCreateProps>().props;
    const existingProductNames = Array.isArray(rawExistingProductNames) ? rawExistingProductNames : []; // Safeguard
    const [preview, setPreview] = useState<string | null>(null);
    const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<PurchaseDetail | null>(null);
    const [maxQuantity, setMaxQuantity] = useState<number>(0);
    const [useCustomName, setUseCustomName] = useState<boolean>(false);

    const { data, setData, post, errors, processing, progress } = useForm({
        nama: '',
        custom_nama: '',
        purchase_detail_id: '',
        category_id: '',
        harga: '',
        quantity: 0,
        margin: '',
        image: null as File | null,
        expired_at: '', 
    });

    useEffect(() => {
        if (selectedPurchaseDetail) {
            setMaxQuantity(selectedPurchaseDetail.available_quantity);
            setData(data => ({
                ...data,
                nama: selectedPurchaseDetail.nama_produk,
                expired_at: selectedPurchaseDetail.expired || '', 
            }));
            
            const costPrice = selectedPurchaseDetail.harga_satuan;
            const marginPercent = data.margin ? parseFloat(data.margin) : 20; // Default margin 20% if not set
            const sellingPrice = costPrice * (1 + (marginPercent / 100));
            setData('harga', Math.round(sellingPrice).toString());
        } else {
            setMaxQuantity(0);
        }
    }, [selectedPurchaseDetail, data.margin, setData]); // Added data.margin and setData to dependencies

    useEffect(() => {
        if (selectedPurchaseDetail?.harga_satuan && data.margin) {
            const marginPercent = parseFloat(data.margin);
            const sellingPrice = selectedPurchaseDetail.harga_satuan * (1 + (marginPercent / 100));
            setData('harga', Math.round(sellingPrice).toString());
        } else if (selectedPurchaseDetail?.harga_satuan && !data.margin) {
            // If margin is cleared, recalculate with default margin (e.g., 20%) or set to cost price
            const costPrice = selectedPurchaseDetail.harga_satuan;
            const defaultMargin = 20; // Or 0 if you want price to revert to cost
            const sellingPrice = costPrice * (1 + (defaultMargin / 100));
            setData('harga', Math.round(sellingPrice).toString());
        }
    }, [data.margin, selectedPurchaseDetail, setData]); // Added setData to dependencies

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (selectedPurchaseDetail && data.quantity > maxQuantity) {
            alert(`Jumlah tidak boleh melebihi ${maxQuantity}`);
            return;
        }
        post(route('produk.store'));
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        if (fileList && fileList.length > 0) {
            const file = fileList[0];
            setData('image', file);
            setPreview(URL.createObjectURL(file));
        } else {
            setData('image', null);
            setPreview(null);
        }
    };

    const handlePurchaseDetailSelect = (detailId: string) => {
        const detail = availablePurchaseDetails.find(d => d.id.toString() === detailId);
        setData('purchase_detail_id', detailId);
        setSelectedPurchaseDetail(detail || null);
    };

    const itemsAlreadyProductCount = availablePurchaseDetails.filter(detail => existingProductNames.includes(detail.nama_produk)).length;
    const totalSourceItems = availablePurchaseDetails.length;
    let summaryMessage = '';
    if (totalSourceItems > 0) {
        if (itemsAlreadyProductCount === totalSourceItems) {
            summaryMessage = "Semua item sumber yang tersedia sudah terdaftar sebagai produk.";
        } else {
            summaryMessage = `${itemsAlreadyProductCount} dari ${totalSourceItems} item sumber sudah terdaftar sebagai produk.`;
        }
    }

    return (
        <AppLayout>
            <Head title="Add Product" />
            <Card>
                <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                    <CardDescription>Fill in the details of the new product.</CardDescription>
                </CardHeader>
                <CardContent>
                    {availablePurchaseDetails.length === 0 ? (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Perhatian!</AlertTitle>
                            <AlertDescription>
                                Tidak ada data purchase yang tersedia. Anda perlu menambahkan purchase terlebih dahulu.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Informasi</AlertTitle>
                            <AlertDescription>
                                Produk yang ditambahkan harus sesuai dengan data purchase. Jumlah produk tidak boleh melebihi jumlah pada purchase.
                                {summaryMessage && <div className="mt-2">{summaryMessage}</div>}
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kolom Kiri */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="purchase_detail_id">Purchase Detail (Source) *</Label>
                                    <Select 
                                        value={data.purchase_detail_id ? String(data.purchase_detail_id) : ""}
                                        onValueChange={handlePurchaseDetailSelect}
                                    >
                                        <SelectTrigger className="mt-1 block w-full">
                                            <SelectValue placeholder="Select purchase detail source" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-80 overflow-y-auto">
                                            {availablePurchaseDetails.map((detail) => {
                                                const isAlreadyProduct = existingProductNames.includes(detail.nama_produk);
                                                return (
                                                    <SelectItem 
                                                        key={detail.id} 
                                                        value={String(detail.id)}
                                                        // Apply a visual style if the product name already exists
                                                        style={isAlreadyProduct ? { color: 'green', fontWeight: 'bold' } : {}}
                                                    >
                                                        {detail.nama_produk} - {detail.purchase_no} ({detail.supplier}) - {detail.available_quantity} {detail.kemasan}
                                                        {isAlreadyProduct && <span className="ml-1 text-xs">(Product Exists)</span>}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.purchase_detail_id} className="mt-2" />
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
                                        value={data.category_id || ''} 
                                        onValueChange={(value) => setData('category_id', value === '' ? '' : value)}
                                    >
                                        <SelectTrigger className="mt-1 block w-full">
                                            <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-80 overflow-y-auto">
                                            <SelectItem value="_none">No Category</SelectItem>
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
                                    <Label htmlFor="harga">Selling Price * (Calculated)</Label>
                                    <Input
                                        id="harga"
                                        name="harga"
                                        type="number"
                                        value={data.harga}
                                        className="mt-1 block w-full"
                                        required
                                        min="0"
                                        disabled 
                                    />
                                    <InputError message={errors.harga} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="quantity">Quantity * {selectedPurchaseDetail && `(Max: ${maxQuantity})`}</Label>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        value={data.quantity}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 0;
                                            setData('quantity', value);
                                        }}
                                        className={`mt-1 block w-full ${selectedPurchaseDetail && data.quantity > maxQuantity ? 'border-red-500' : ''}`}
                                        required
                                        min="0"
                                    />
                                    {selectedPurchaseDetail && data.quantity > maxQuantity && (
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
                                    <Label htmlFor="expired_at">Expiry Date (from purchase)</Label>
                                    <Input
                                        id="expired_at"
                                        name="expired_at"
                                        type="date"
                                        value={data.expired_at}
                                        className="mt-1 block w-full"
                                        disabled
                                    />
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Expiry date is automatically set from the selected purchase
                                    </p>
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
                                    {progress && (
                                        <Progress value={progress.percentage} className="w-full mt-2" />
                                    )}
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
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : 'Save Product'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
