import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/InputError'; // Komponen untuk menampilkan error validasi
import { Progress } from "@/components/ui/progress"; // Untuk progress upload
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; // Tambahkan alert
import { AlertCircle } from "lucide-react"; // Ikon alert
import { useState, useEffect } from 'react';

// Interface for purchase detail
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
    [key: string]: any;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Products', href: route('produk.index') },
    { title: 'Add Product', href: route('produk.create') },
];

export default function ProdukCreate() {
    const { categories, availablePurchaseDetails } = usePage<ProdukCreateProps>().props;
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
        expired_at: '', // Add this field
    });

    // Update data when purchase detail is selected
    useEffect(() => {
        if (selectedPurchaseDetail) {
            setMaxQuantity(selectedPurchaseDetail.available_quantity);
            setData(data => ({
                ...data,
                nama: selectedPurchaseDetail.nama_produk,
                expired_at: selectedPurchaseDetail.expired || '', // Set the expiry date
            }));
            
            // Calculate default selling price (cost price + margin 20%)
            const costPrice = selectedPurchaseDetail.harga_satuan;
            const marginPercent = data.margin ? parseFloat(data.margin) : 20;
            const sellingPrice = costPrice * (1 + (marginPercent / 100));
            setData('harga', Math.round(sellingPrice).toString());
        } else {
            setMaxQuantity(0);
        }
    }, [selectedPurchaseDetail]);

    // Update price when margin changes
    useEffect(() => {
        if (selectedPurchaseDetail?.harga_satuan && data.margin) {
            const marginPercent = parseFloat(data.margin);
            const sellingPrice = selectedPurchaseDetail.harga_satuan * (1 + (marginPercent / 100));
            setData('harga', Math.round(sellingPrice).toString());
        }
    }, [data.margin]);

    // Clean up the preview URL when component unmounts
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, []);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        
        // Validate before submit
        if (selectedPurchaseDetail && data.quantity > maxQuantity) {
            alert(`Jumlah tidak boleh melebihi ${maxQuantity}`);
            return;
        }
        
        post(route('produk.store'));
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        
        // Clean up previous preview if it exists
        if (preview) {
            URL.revokeObjectURL(preview);
            setPreview(null);
        }
        
        if (fileList && fileList.length > 0) {
            const file = fileList[0];
            setData('image', file);
            
            // Create a new preview URL
            setPreview(URL.createObjectURL(file));
        } else {
            setData('image', null);
        }
    };

    const handlePurchaseDetailSelect = (detailId: string) => {
        const detail = availablePurchaseDetails.find(d => d.id.toString() === detailId);
        setData('purchase_detail_id', detailId);
        setSelectedPurchaseDetail(detail || null);
    };

    return (
        <AppLayout>
            <Head title="Add Product" />
            <Card>
                <CardHeader>
                    <CardTitle>Add New Product</CardTitle>
                    <CardDescription>Fill in the details of the new product.</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Display purchase information */}
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
                                            {availablePurchaseDetails.map((detail) => (
                                                <SelectItem key={detail.id} value={String(detail.id)}>
                                                    {detail.nama_produk} - {detail.purchase_no} ({detail.supplier}) - {detail.available_quantity} {detail.kemasan}
                                                </SelectItem>
                                            ))}
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
