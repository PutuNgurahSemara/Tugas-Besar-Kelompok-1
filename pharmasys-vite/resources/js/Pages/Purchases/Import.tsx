import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileSpreadsheet, Camera, Upload, Download } from "lucide-react";
import { useState, useRef } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Purchases', href: route('purchases.index') },
    { title: 'Import', href: route('purchases.import-page') },
];

export default function PurchaseImport() {
    const [activeTab, setActiveTab] = useState('excel');
    const [previewImages, setPreviewImages] = useState<string[]>([]);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [processing, setProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, progress, errors } = useForm({
        file: null as File | null,
        images: [] as File[],
    });

    const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('file', file);
            setAlert(null);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        // Limit to 10 images
        const selectedFiles = Array.from(files).slice(0, 10);
        setSelectedImages(selectedFiles);
        setData('images', selectedFiles);

        // Create previews
        const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
        setPreviewImages(newPreviews);
        setAlert(null);
    };

    const handleExcelSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!data.file) {
            setAlert({ type: 'error', message: 'Please select an Excel file to import' });
            return;
        }

        setProcessing(true);
        setAlert(null);

        const formData = new FormData();
        formData.append('file', data.file);

        router.post(route('purchases.import'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Excel file imported successfully!' });
                setProcessing(false);
                setData('file', null);
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
            onError: (errors) => {
                setAlert({ type: 'error', message: errors.file || 'Failed to import Excel file. Please check the format.' });
                setProcessing(false);
            }
        });
    };

    const handleImageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (selectedImages.length === 0) {
            setAlert({ type: 'error', message: 'Please select at least one image to import' });
            return;
        }

        setProcessing(true);
        setAlert(null);

        const formData = new FormData();
        selectedImages.forEach((image, index) => {
            formData.append(`images[${index}]`, image);
        });

        router.post(route('purchases.import-images'), formData, {
            forceFormData: true,
            onSuccess: () => {
                setAlert({ type: 'success', message: 'Images imported successfully!' });
                setProcessing(false);
                setSelectedImages([]);
                setPreviewImages([]);
                if (imageInputRef.current) imageInputRef.current.value = '';
            },
            onError: (errors) => {
                setAlert({ type: 'error', message: errors.images || 'Failed to import images. Please try again.' });
                setProcessing(false);
            }
        });
    };

    const downloadTemplate = () => {
        window.location.href = route('purchases.download-template');
    };

    return (
        <AppLayout>
            <Head title="Import Purchases" />
            <Card>
                <CardHeader>
                    <CardTitle>Import Purchase Data</CardTitle>
                    <CardDescription>Import purchase data from Excel files or invoice photos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {alert && (
                        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'} className="mb-4">
                            <AlertCircle className="h-5 w-5" />
                            <AlertTitle>{alert.type === 'success' ? 'Success' : 'Error'}</AlertTitle>
                            <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                    )}

                    <Tabs defaultValue="excel" value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="excel" className="flex items-center gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                Import from Excel
                            </TabsTrigger>
                            <TabsTrigger value="photo" className="flex items-center gap-2">
                                <Camera className="h-4 w-4" />
                                Import from Photos
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="excel" className="mt-4">
                            <div className="mb-4">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Information</AlertTitle>
                                    <AlertDescription>
                                        Please use the provided Excel template for importing purchase data. The file should have two sheets: "Faktur Utama" and "Detail Barang".
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <Button 
                                variant="secondary" 
                                onClick={downloadTemplate} 
                                className="mb-4 flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Download Template
                            </Button>

                            <form onSubmit={handleExcelSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="excel-file">Select Excel File</Label>
                                    <Input
                                        id="excel-file"
                                        type="file"
                                        ref={fileInputRef}
                                        accept=".xlsx,.xls,.csv"
                                        onChange={handleExcelFileChange}
                                        className="mt-1"
                                    />
                                    {progress && (
                                        <Progress value={progress.percentage} className="w-full mt-2" />
                                    )}
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Link href={route('purchases.index')}>
                                        <Button type="button" variant="secondary" disabled={processing}>
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing || !data.file}>
                                        {processing ? 'Importing...' : 'Import Excel'}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>

                        <TabsContent value="photo" className="mt-4">
                            <div className="mb-4">
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Information</AlertTitle>
                                    <AlertDescription>
                                        You can upload up to 10 invoice photos. Each photo will be processed as a separate invoice. Make sure the photos are clear and show all the necessary information.
                                    </AlertDescription>
                                </Alert>
                            </div>

                            <form onSubmit={handleImageSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="invoice-photos">Select Invoice Photos (Max 10)</Label>
                                    <Input
                                        id="invoice-photos"
                                        type="file"
                                        ref={imageInputRef}
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageChange}
                                        className="mt-1"
                                    />
                                    {progress && (
                                        <Progress value={progress.percentage} className="w-full mt-2" />
                                    )}
                                </div>

                                {previewImages.length > 0 && (
                                    <div className="mt-4">
                                        <Label>Selected Images ({previewImages.length})</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                                            {previewImages.map((preview, index) => (
                                                <div key={index} className="relative">
                                                    <img 
                                                        src={preview} 
                                                        alt={`Preview ${index + 1}`} 
                                                        className="h-24 w-full object-cover rounded border" 
                                                    />
                                                    <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white rounded-bl px-1">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-2">
                                    <Link href={route('purchases.index')}>
                                        <Button type="button" variant="secondary" disabled={processing}>
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing || selectedImages.length === 0}>
                                        {processing ? 'Importing...' : 'Import Photos'}
                                    </Button>
                                </div>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </AppLayout>
    );
}
