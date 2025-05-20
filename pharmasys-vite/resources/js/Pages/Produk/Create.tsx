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
    existingProductsData: Record<string, ExistingProductData>;
    defaultProfitMargin: number;
    initialCategoryId?: number | null;
    initialProductName?: string | null;
    initialProductImage?: string | null;
    initialMargin?: number | null;
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Products', href: route('produk.index') },
    { title: 'Add Product', href: route('produk.create') },
];

export default function ProdukCreate() {
    const { 
        categories, 
        availablePurchaseDetails, 
        existingProductsData, 
        defaultProfitMargin,
        initialCategoryId,
        initialProductName,
        initialProductImage,
        initialMargin 
    } = usePage<ProdukCreateProps>().props;
    const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
    const [existingImageDisplay, setExistingImageDisplay] = useState<string | null>(initialProductImage ? `/storage/${initialProductImage}` : null);
    const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState<PurchaseDetail | null>(null);
    const [maxQuantity, setMaxQuantity] = useState<number>(0);
    const [useCustomName, setUseCustomName] = useState<boolean>(!initialProductName); // Default to false if restocking (name is prefilled)

    const { data, setData, post, errors, processing, progress } = useForm({
        nama: initialProductName || '', 
        custom_nama: '',
        purchase_detail_id: '',
        category_id: initialCategoryId ? String(initialCategoryId) : '', 
        harga: '', 
        quantity: 0,
        margin: (initialMargin !== null && initialMargin !== undefined) 
                ? String(initialMargin) 
                : (defaultProfitMargin?.toString() || '20'),
        image: null as File | null,
        expired_at: '', 
    });

    // This useEffect was for initial prop setting, but useForm and useState initializers now handle this.
    // useEffect(() => {
    //     // Effect for when coming from "Restock" button (initial props)
    //     if (initialProductName) {
    //         setData(currentData => ({
    //             ...currentData,
    //             nama: initialProductName,
    //             category_id: initialCategoryId ? String(initialCategoryId) : '',
    //             margin: (initialMargin !== null && initialMargin !== undefined) 
    //                     ? String(initialMargin) 
    //                     : (defaultProfitMargin?.toString() || '20'),
    //         }));
    //         if (initialProductImage) {
    //             setExistingImageDisplay(`/storage/${initialProductImage}`);
    //         }
    //         setUseCustomName(false); // Don't use custom name if prefilled from existing product
    //     }
    // }, [initialProductName, initialCategoryId, initialProductImage, initialMargin, defaultProfitMargin, setData]);
    
    useEffect(() => {
        // This effect handles changes when a purchase_detail_id is selected from the dropdown
        if (selectedPurchaseDetail) {
            setMaxQuantity(selectedPurchaseDetail.available_quantity);
            const existingProdData = existingProductsData[selectedPurchaseDetail.nama_produk];
            
            // Determine initial margin: 1. User's current input, 2. Existing product's margin, 3. Default setting, 4. Fallback '20'
            let initialMargin = data.margin; // Keep if user already typed something
            if (initialMargin === '' || initialMargin === (defaultProfitMargin?.toString() || '20')) { // If it's still default or empty
                if (existingProdData && existingProdData.margin !== null) {
                    initialMargin = String(existingProdData.margin);
                } else {
                    initialMargin = defaultProfitMargin?.toString() || '20';
                }
            }

            setData(currentData => ({
                ...currentData,
                nama: selectedPurchaseDetail.nama_produk,
                expired_at: selectedPurchaseDetail.expired || '',
                category_id: existingProdData?.category_id ? String(existingProdData.category_id) : '',
                margin: initialMargin,
            }));

            if (existingProdData) {
                setExistingImageDisplay(existingProdData.image ? `/storage/${existingProdData.image}` : null);
                setUseCustomName(false); 
            } else { 
                setExistingImageDisplay(null);
            }
            
            // Trigger price calculation
            const costPrice = selectedPurchaseDetail.harga_satuan;
            const marginToUse = parseFloat(initialMargin);
            if (!isNaN(marginToUse)) {
                const sellingPrice = costPrice * (1 + (marginToUse / 100));
                setData('harga', Math.round(sellingPrice).toString());
            } else {
                setData('harga', ''); // Clear price if margin is invalid
            }

        } else { 
            setMaxQuantity(0);
            setExistingImageDisplay(initialProductImage ? `/storage/${initialProductImage}` : null);
            setData(currentData => ({ 
                ...currentData,
                nama: initialProductName || '', // Revert to initial or empty
                expired_at: '', // Clear as no purchase detail is selected
                harga: '', // Will be recalculated or should be empty
                margin: (initialMargin !== null && initialMargin !== undefined) 
                        ? String(initialMargin) 
                        : (defaultProfitMargin?.toString() || '20'),
                category_id: initialCategoryId ? String(initialCategoryId) : '',
                custom_nama: initialProductName ? '' : currentData.custom_nama, // Clear custom_nama if reverting
                purchase_detail_id: '', // Clear selected purchase
                quantity: 0,
            }));
            setUseCustomName(!initialProductName); // Revert useCustomName based on initialProductName
        }
    }, [
        selectedPurchaseDetail, 
        existingProductsData, 
        setData, 
        initialProductName, 
        initialCategoryId, 
        initialProductImage, 
        initialMargin, 
        defaultProfitMargin
    ]);


    useEffect(() => {
        // Recalculate price if margin changes AND a purchase detail is selected
        if (selectedPurchaseDetail?.harga_satuan && data.margin) {
            const marginPercent = parseFloat(data.margin);
            if (!isNaN(marginPercent)) {
                const sellingPrice = selectedPurchaseDetail.harga_satuan * (1 + (marginPercent / 100));
                setData('harga', Math.round(sellingPrice).toString());
            }
        } else if (selectedPurchaseDetail?.harga_satuan && data.margin === '') {
            // If margin is cleared, use default from settings or existing product's margin
            const costPrice = selectedPurchaseDetail.harga_satuan;
            const existingProdMargin = existingProductsData[selectedPurchaseDetail.nama_produk]?.margin;
            const marginToSet = (existingProdMargin !== null && existingProdMargin !== undefined) 
                ? String(existingProdMargin) 
                : (defaultProfitMargin?.toString() || '20');
            
            const sellingPrice = costPrice * (1 + (parseFloat(marginToSet) / 100));
            setData('harga', Math.round(sellingPrice).toString());
            setData('margin', marginToSet);
        }
    }, [data.margin, selectedPurchaseDetail, existingProductsData, setData, defaultProfitMargin]);


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
        if (!detail) return;
        
        setData('purchase_detail_id', detailId);
        setSelectedPurchaseDetail(detail);
        
        // Check if this product is registered
        const isProductRegistered = existingProductsData[detail.nama_produk] !== undefined;
        
        // If product is registered, use its data, otherwise use the purchase detail data
        const existingProduct = isProductRegistered ? existingProductsData[detail.nama_produk] : null;
        
        setData(currentData => ({
            ...currentData,
            nama: detail.nama_produk,
            category_id: existingProduct?.category_id ? String(existingProduct.category_id) : '',
            margin: existingProduct?.margin !== null && existingProduct?.margin !== undefined 
                ? String(existingProduct.margin) 
                : (defaultProfitMargin?.toString() || '20'),
            harga: '', // Will be calculated in useEffect
            quantity: 1, // Default to 1
            custom_nama: '', // Reset custom name
            expired_at: detail.expired || ''
        }));
    };

    // Calculate summary information
    const itemsAlreadyProductCount = availablePurchaseDetails.filter(
        detail => existingProductsData[detail.nama_produk] !== undefined
    ).length;
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
                                                // Check if this product name exists in the existing products
                                                const isProductRegistered = existingProductsData[detail.nama_produk] !== undefined;
                                                
                                                return (
                                                    <SelectItem 
                                                        key={detail.id} 
                                                        value={String(detail.id)}
                                                        style={isProductRegistered ? { color: '#10B981', fontWeight: 'bold' } : {}}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span>
                                                                {detail.nama_produk} - {detail.purchase_no} ({detail.supplier}) - Stok: {detail.available_quantity} {detail.kemasan}
                                                            </span>
                                                            {isProductRegistered && (
                                                                <span className="ml-2 text-xs text-muted-foreground">
                                                                    (Akan restock produk yang ada)
                                                                </span>
                                                            )}
                                                        </div>
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
