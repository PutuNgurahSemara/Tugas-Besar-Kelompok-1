import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category } from '@/types';
import { type PageProps } from '@/types/inertia';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react'; // Added router
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

// Define Produk type locally since it's not exported from @/types
interface Produk {
    id: number;
    nama: string;
    category_id: number | null;
    harga: number;
    // quantity: number; // Not directly edited here, derived from batches
    margin: number | null;
    // expired_at: string | null; // Not directly edited here, derived from batches
    image: string | null;
}

// This Purchase interface might be unused now if purchase source selection is fully removed
interface Purchase {
    id: number;
    product: string;
    quantity: number;
    available_quantity: number;
    expiry_date?: string;
    cost_price?: number;
}

interface ProdukEditProps extends PageProps {
    produk: Produk & { 
        category: Category | null;
    };
    categories: Category[];
    [key: string]: any; 
}

type FormData = {
    nama: string;
    custom_nama: string;
    category_id: string | null;
    harga: string;
    margin: string;
    image: File | null;
    _method: string;
}

export default function ProdukEdit() {
    const { produk, categories } = usePage<ProdukEditProps>().props;
    const [preview, setPreview] = useState<string | null>(produk.image ? `/storage/${produk.image}` : null);
    const [useCustomName, setUseCustomName] = useState<boolean>(false);
    
    const { data, setData, post, errors, processing, progress } = useForm<FormData>({
        nama: produk.nama || '',
        custom_nama: '', 
        category_id: produk.category_id ? String(produk.category_id) : null,
        harga: produk.harga ? String(produk.harga) : '',
        margin: produk.margin !== null ? String(produk.margin) : '',
        image: null,
        _method: 'PUT'
    });

    useEffect(() => {
        // This useEffect is kept from the previous state; its original problematic logic 
        // (related to produk.purchase) was removed.
        // If specific initialization logic for `useCustomName` or `data.custom_nama` is needed
        // based on `produk.nama` alone, it can be added here carefully.
    }, []);

    // The old 'submit' function is dead code as handleFormSubmit is used.
    // function submit(e: React.FormEvent<HTMLFormElement>) { ... } 
    
    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const finalFormData = new (window as any).FormData();
        finalFormData.append('_method', 'PUT');
        finalFormData.append('nama', useCustomName && data.custom_nama ? data.custom_nama : data.nama);
        if (data.category_id) {
            finalFormData.append('category_id', data.category_id);
        } else {
            finalFormData.append('category_id', ''); // Send empty string for null
        }
        finalFormData.append('harga', data.harga);
        finalFormData.append('margin', data.margin);
        if (data.image) {
            finalFormData.append('image', data.image);
        }
        if (useCustomName && data.custom_nama) { 
            finalFormData.append('custom_nama', data.custom_nama);
        }

        router.post(route('produk.update', produk.id), finalFormData, {
            forceFormData: true, 
            onSuccess: () => {
                // Handle success (e.g., show alert, redirect)
            },
            onError: (formErrors: Record<string, string>) => {
                // Handle errors (e.g., display them using 'errors' from useForm or a state variable)
            }
        });
    };

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
                            Update product details below. Stock and expiry are managed via purchases.
                        </AlertDescription>
                    </Alert>
                    
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Kolom Kiri */}
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="current_nama">Product Name</Label>
                                    <Input
                                        id="current_nama"
                                        name="current_nama"
                                        value={data.nama} 
                                        onChange={(e) => setData('nama', e.target.value)}
                                        className="mt-1 block w-full"
                                        disabled={useCustomName} 
                                    />
                                    <InputError message={errors.nama} className="mt-2" />
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2">
                                    <input 
                                        type="checkbox" 
                                        id="useCustomName" 
                                        checked={useCustomName}
                                        onChange={(e) => {
                                            setUseCustomName(e.target.checked);
                                            if (!e.target.checked) {
                                                setData('custom_nama', ''); 
                                            } else {
                                                setData('custom_nama', data.nama); 
                                            }
                                        }} 
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
                                        value={data.category_id || '_none'} 
                                        onValueChange={(value) => setData('category_id', value === '_none' ? null : value)}
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
                                {/* Expiry Date field removed */}
                                {/* Quantity field removed */}
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
                                {processing ? 'Saving...' : 'Update Product'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
