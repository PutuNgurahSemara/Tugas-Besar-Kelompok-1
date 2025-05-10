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

interface ExistingProductData {
    id: number;
    category_id: number | null;
    margin: number | null;
    image: string | null;
}

interface ProdukCreateProps {
    categories: Category[];
    availablePurchaseDetails: PurchaseDetail[];
    existingProductsData: Record<string, ExistingProductData>; // Changed from existingProductNames
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Products', href: route('produk.index') },
    { title: 'Add Product', href: route('produk.create') },
];

export default function ProdukCreate() {
    const { categories, availablePurchaseDetails, existingProductsData } = usePage<ProdukCreateProps>().props;
    const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
    const [existingImageDisplay, setExistingImageDisplay] = useState<string | null>(null);
    const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<PurchaseDetail | null>(null);
    const [maxQuantity, setMaxQuantity] = useState<number>(0);
    const [useCustomName, setUseCustomName] = useState<boolean>(false);

    const { data, setData, post, errors, processing, progress } = useForm({
        nama: '', // Will be set from purchase detail or custom_nama
        custom_nama: '',
        purchase_detail_id: '',
        category_id: '', // Will be string for Select, or null when sending
        harga: '', // Calculated, read-only
        quantity: 0,
        margin: '', // User input, defaults or from existing product
        image: null as File | null,
        expired_at: '', // Informational, from purchase detail
    });

    useEffect(() => {
        if (selectedPurchaseDetail) {
            setMaxQuantity(selectedPurchaseDetail.available_quantity);
            const existingProdData = existingProductsData[selectedPurchaseDetail.nama_produk];
            let currentMargin = data.margin; // Preserve user-typed margin if any

            if (existingProdData) { // Product with this name exists (restocking)
                setData(currentData => ({
                    ...currentData,
                    nama: selectedPurchaseDetail.nama_produk, // Default to purchase name
                    expired_at: selectedPurchaseDetail.expired || '',
                    category_id: existingProdData.category_id ? String(existingProdData.category_id) : '',
                    // Only set margin if not already touched by user, or if it's the initial load for this selection
                    margin: currentData.margin === '' && existingProdData.margin !== null ? String(existingProdData.margin) : currentData.margin || '20', 
                }));
                setExistingImageDisplay(existingProdData.image ? `/storage/${existingProdData.image}` : null);
                setUseCustomName(false); // Default to not using custom name for existing products
            } else { // New product
                setExistingImageDisplay(null);
                setData(currentData => ({
                    ...currentData,
                    nama: selectedPurchaseDetail.nama_produk,
                    expired_at: selectedPurchaseDetail.expired || '',
                    category_id: '', // Reset for new product
                    margin: currentData.margin || '20', // Default margin if not set
                }));
            }
            // Trigger price calculation based on (potentially pre-filled) margin
            const costPrice = selectedPurchaseDetail.harga_satuan;
            const marginToUse = parseFloat(data.margin || (existingProdData?.margin?.toString() ?? '20'));
            const sellingPrice = costPrice * (1 + (marginToUse / 100));
            setData('harga', Math.round(sellingPrice).toString());

        } else { // No purchase detail selected
            setMaxQuantity(0);
            setExistingImageDisplay(null);
            setData(currentData => ({ // Reset form fields
                ...currentData,
                nama: '',
                expired_at: '',
                harga: '',
                margin: '',
                category_id: '',
                custom_nama: '',
                purchase_detail_id: '',
                quantity: 0,
            }));
            setUseCustomName(false);
        }
    }, [selectedPurchaseDetail, existingProductsData, setData]);


    useEffect(() => {
        // Recalculate price if margin changes AND a purchase detail is selected
        if (selectedPurchaseDetail?.harga_satuan && data.margin) {
            const marginPercent = parseFloat(data.margin);
            if (!isNaN(marginPercent)) {
                const sellingPrice = selectedPurchaseDetail.harga_satuan * (1 + (marginPercent / 100));
                setData('harga', Math.round(sellingPrice).toString());
            }
        } else if (selectedPurchaseDetail?.harga_satuan && data.margin === '') {
            // If margin is cleared, use default (e.g., 20% or existing product's margin if available)
            const costPrice = selectedPurchaseDetail.harga_satuan;
            const existingProdMargin = existingProductsData[selectedPurchaseDetail.nama_produk]?.margin;
            const defaultMargin = existingProdMargin !== null && existingProdMargin !== undefined ? existingProdMargin : 20;
            const sellingPrice = costPrice * (1 + (defaultMargin / 100));
            setData('harga', Math.round(sellingPrice).toString());
            setData('margin', String(defaultMargin)); // also update margin field to show the default being used
        }
    }, [data.margin, selectedPurchaseDetail, existingProductsData, setData]);


    useEffect(() => {
        return () => {
            if (newImagePreview) {
                URL.revokeObjectURL(newImagePreview);
            }
        };
    }, [newImagePreview]);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (selectedPurchaseDetail && data.quantity > maxQuantity) {
            alert(`Jumlah tidak boleh melebihi ${maxQuantity}`);
            return;
        }
        // Backend handles whether it's a new product or restock based on name
        // Send all relevant data; backend will pick what it needs.
        const submissionData = {
            ...data,
            category_id: data.category_id === '_none' ? null : data.category_id,
        };
        post(route('produk.store'), {
            data: submissionData,
            forceFormData: true, // Ensure data is sent as FormData for file upload
        } as any);
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (newImagePreview) {
            URL.revokeObjectURL(newImagePreview);
        }
        if (fileList && fileList.length > 0) {
            const file = fileList[0];
            setData('image', file);
            setNewImagePreview(URL.createObjectURL(file));
            setExistingImageDisplay(null); // Hide existing image if new one is chosen
        } else {
            setData('image', null);
            setNewImagePreview(null);
            // If user cancels file selection, restore existing image preview if applicable
            const existingProd = selectedPurchaseDetail ? existingProductsData[selectedPurchaseDetail.nama_produk] : null;
            if (existingProd?.image) {
                setExistingImageDisplay(`/storage/${existingProd.image}`);
            }
        }
    };

    const handlePurchaseDetailSelect = (detailId: string) => {
        const detail = availablePurchaseDetails.find(d => d.id.toString() === detailId);
        setData('purchase_detail_id', detailId); // Keep this to send to backend
        setSelectedPurchaseDetail(detail || null);
        // Reset fields that depend on selectedPurchaseDetail, they will be repopulated by useEffect
        setData(currentData => ({
            ...currentData,
            nama: '',
            expired_at: '',
            harga: '',
            margin: '', // Keep or reset margin? Let's keep user-entered margin for now.
            // category_id: '', // Keep or reset category?
        }));
    };

    const itemsAlreadyProductCount = availablePurchaseDetails.filter(detail => !!existingProductsData[detail.nama_produk]).length;
    const totalSourceItems = availablePurchaseDetails.length;
    let summaryMessage = '';
    if (totalSourceItems > 0) {
        if (itemsAlreadyProductCount === totalSourceItems) {
            summaryMessage = "Semua item sumber yang tersedia sudah terdaftar sebagai produk.";
        } else if (itemsAlreadyProductCount > 0) {
            summaryMessage = `${itemsAlreadyProductCount} dari ${totalSourceItems} item sumber sudah terdaftar sebagai produk.`;
        } else {
            summaryMessage = "Tidak ada item sumber yang cocok dengan produk terdaftar. Produk baru akan dibuat.";
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
                                {summaryMessage && <div className="mt-2 font-semibold">{summaryMessage}</div>}
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
                                                const isAlreadyProduct = !!existingProductsData[detail.nama_produk];
                                                return (
                                                    <SelectItem 
                                                        key={detail.id} 
                                                        value={String(detail.id)}
                                                        style={isAlreadyProduct ? { color: '#10B981', fontWeight: 'bold' } : {}}
                                                    >
                                                        {detail.nama_produk} - {detail.purchase_no} ({detail.supplier}) - Stok: {detail.available_quantity} {detail.kemasan}
                                                        {isAlreadyProduct && <span className="ml-1 text-xs text-gray-500">(Akan restock produk yang ada)</span>}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.purchase_detail_id} className="mt-2" />
                                </div>
                                
                                <div>
                                    <Label htmlFor="nama">Product Name (from Purchase)</Label>
                                    <Input
                                        id="nama"
                                        name="nama"
                                        value={data.nama}
                                        className="mt-1 block w-full bg-gray-100 dark:bg-gray-800"
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
                                        Gunakan nama produk custom (jika beda dari nama di faktur)
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
                                        value={data.category_id || '_none'} 
                                        onValueChange={(value) => setData('category_id', value === '_none' ? '' : value)}
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
                                    <Label htmlFor="margin">Margin (%)</Label>
                                    <Input
                                        id="margin"
                                        name="margin"
                                        type="number"
                                        value={data.margin}
                                        onChange={(e) => setData('margin', e.target.value)}
                                        className="mt-1 block w-full"
                                        min="0" max="100" step="0.01"
                                        placeholder="e.g. 20"
                                    />
                                    <InputError message={errors.margin} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="harga">Selling Price (Calculated)</Label>
                                    <Input
                                        id="harga"
                                        name="harga"
                                        type="number"
                                        value={data.harga}
                                        className="mt-1 block w-full bg-gray-100 dark:bg-gray-800"
                                        required
                                        min="0"
                                        disabled 
                                    />
                                    <InputError message={errors.harga} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="quantity">Quantity to Add * {selectedPurchaseDetail && `(Max Available: ${maxQuantity})`}</Label>
                                    <Input
                                        id="quantity"
                                        name="quantity"
                                        type="number"
                                        value={data.quantity.toString()} // Ensure value is string for input
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 0;
                                            setData('quantity', value);
                                        }}
                                        className={`mt-1 block w-full ${selectedPurchaseDetail && data.quantity > maxQuantity ? 'border-red-500' : ''}`}
                                        required
                                        min="1" // Should take at least 1
                                        max={maxQuantity > 0 ? maxQuantity : undefined} // Max attribute
                                    />
                                    {selectedPurchaseDetail && data.quantity > maxQuantity && (
                                        <p className="text-sm text-red-500 mt-1">
                                            Jumlah tidak boleh melebihi {maxQuantity}
                                        </p>
                                    )}
                                    <InputError message={errors.quantity} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="expired_at">Expiry Date (from purchase)</Label>
                                    <Input
                                        id="expired_at"
                                        name="expired_at"
                                        type="date"
                                        value={data.expired_at}
                                        className="mt-1 block w-full bg-gray-100 dark:bg-gray-800"
                                        disabled
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="image">Product Image</Label>
                                    {existingImageDisplay && !newImagePreview && (
                                        <div className="mt-2 mb-2">
                                            <p className="text-sm text-muted-foreground">Existing Image:</p>
                                            <img src={existingImageDisplay} alt="Existing product" className="h-20 w-20 object-cover rounded" />
                                            <p className="text-xs text-muted-foreground mt-1">Upload a new image below to change it.</p>
                                        </div>
                                    )}
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
                                    {newImagePreview && (
                                        <div className="mt-4">
                                            <p className="text-sm text-muted-foreground">New Image Preview:</p>
                                            <img src={newImagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
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
                            <Button type="submit" disabled={processing || (selectedPurchaseDetail && data.quantity > maxQuantity) || data.quantity <= 0}>
                                {processing ? 'Saving...' : 'Save Product'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
