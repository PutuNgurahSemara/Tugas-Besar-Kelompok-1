// Placeholder Page
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, useForm, Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import InputError from "@/components/InputError";
import { FlashMessage } from '@/components/flash-message';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Upload, Image, Info, Globe, DollarSign } from 'lucide-react';

// Interface untuk data setting yang diterima dari controller
interface SettingsData {
    app_name: string;
    app_currency: string;
    app_logo?: File | null;
    app_favicon?: File | null;
    language?: string;
    current_logo?: string;
    current_favicon?: string;
    remove_logo?: boolean;
    remove_favicon?: boolean;
}

interface SettingsIndexProps {
    settings: {
        app_name: string;
        app_currency: string;
        app_logo?: string | null;
        app_favicon?: string | null;
        language?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Settings', href: route('settings.index') },
    { title: 'General Settings', href: route('settings.index') },
];

export default function SettingsIndex() {
    const { settings, flash } = usePage<SettingsIndexProps>().props;
    const [activeTab, setActiveTab] = useState("general");
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

    // Inisialisasi form dengan data setting yang ada
    const { data, setData, post, errors, processing, reset } = useForm<SettingsData>({
        app_name: settings.app_name || 'PharmaSys',
        app_currency: settings.app_currency || 'Rp',
        app_logo: null,
        app_favicon: null,
        language: settings.language || 'id',
        current_logo: settings.app_logo || null,
        current_favicon: settings.app_favicon || null,
        remove_logo: false,
        remove_favicon: false,
    });

    useEffect(() => {
        // Set preview untuk logo dan favicon yang sudah ada
        if (settings.app_logo) {
            setLogoPreview(`/storage/${settings.app_logo}`);
        }
        if (settings.app_favicon) {
            setFaviconPreview(`/storage/${settings.app_favicon}`);
        }
    }, [settings]);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        post(route('settings.update'), {
            preserveScroll: true,
            onSuccess: () => {
                // Reset file inputs setelah submit berhasil
                reset('app_logo', 'app_favicon');
            }
        });
    }

    // Handler untuk file logo
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('app_logo', file);
            
            // Set preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            
            // Reset remove flag jika user memilih file baru
            setData('remove_logo', false);
        }
    };
    
    // Handler untuk file favicon
    const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('app_favicon', file);
            
            // Set preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setFaviconPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
            
            // Reset remove flag jika user memilih file baru
            setData('remove_favicon', false);
        }
    };
    
    // Handler untuk menghapus logo
    const handleRemoveLogo = () => {
        setData('remove_logo', true);
        setData('app_logo', null);
        setLogoPreview(null);
    };
    
    // Handler untuk menghapus favicon
    const handleRemoveFavicon = () => {
        setData('remove_favicon', true);
        setData('app_favicon', null);
        setFaviconPreview(null);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="General Settings" />
            
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">General Settings</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Konfigurasi pengaturan dasar aplikasi PharmaSys
                </p>
            </div>
            
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6 w-full max-w-md">
                    <TabsTrigger value="general" className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4" />
                        <span>Umum</span>
                    </TabsTrigger>
                    <TabsTrigger value="appearance" className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        <span>Tampilan</span>
                    </TabsTrigger>
                    <TabsTrigger value="language" className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>Bahasa</span>
                    </TabsTrigger>
                </TabsList>
                
                <form onSubmit={submit} className="space-y-6">
                    <FlashMessage flash={flash} />
                
                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pengaturan Umum</CardTitle>
                                <CardDescription>Informasi dasar aplikasi</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <Label htmlFor="app_name">Nama Aplikasi *</Label>
                                        <Input
                                            id="app_name"
                                            name="app_name"
                                            value={data.app_name}
                                            onChange={(e) => setData('app_name', e.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Nama untuk aplikasi ini
                                        </p>
                                        <InputError message={errors.app_name} className="mt-2" />
                                    </div>
                                    
                                    <div>
                                        <Label htmlFor="app_currency">Mata Uang *</Label>
                                        <Input
                                            id="app_currency"
                                            name="app_currency"
                                            value={data.app_currency}
                                            onChange={(e) => setData('app_currency', e.target.value)}
                                            className="mt-1 block w-full"
                                            required
                                        />
                                        <p className="text-sm text-gray-500 mt-1">
                                            Simbol mata uang (contoh: Rp, $, €)
                                        </p>
                                        <InputError message={errors.app_currency} className="mt-2" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="appearance" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Logo & Favicon</CardTitle>
                                <CardDescription>Identitas visual aplikasi</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <Label htmlFor="app_logo">Upload Logo</Label>
                                    <div className="mt-2 flex items-center gap-4">
                                        {logoPreview && (
                                            <div className="relative">
                                                <img 
                                                    src={logoPreview} 
                                                    alt="Logo Preview" 
                                                    className="h-16 w-auto object-contain rounded border p-1"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <Input 
                                                id="app_logo" 
                                                name="app_logo" 
                                                type="file" 
                                                onChange={handleLogoChange} 
                                                className="mt-1 block w-full cursor-pointer"
                                                accept="image/*"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                Disarankan ukuran gambar 150px x 150px
                                            </p>
                                        </div>
                                        {logoPreview && (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={handleRemoveLogo}
                                            >
                                                Hapus
                                            </Button>
                                        )}
                                    </div>
                                    <InputError message={errors.app_logo} className="mt-1" />
                                </div>

                                <div>
                                    <Label htmlFor="app_favicon">Upload Favicon</Label>
                                    <div className="mt-2 flex items-center gap-4">
                                        {faviconPreview && (
                                            <div className="relative">
                                                <img 
                                                    src={faviconPreview} 
                                                    alt="Favicon Preview" 
                                                    className="h-12 w-auto object-contain rounded border p-1"
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <Input 
                                                id="app_favicon" 
                                                name="app_favicon" 
                                                type="file" 
                                                onChange={handleFaviconChange} 
                                                className="mt-1 block w-full cursor-pointer"
                                                accept="image/*"
                                            />
                                            <p className="text-sm text-gray-500 mt-1">
                                                Disarankan ukuran gambar 16px x 16px atau 32px x 32px
                                            </p>
                                        </div>
                                        {faviconPreview && (
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={handleRemoveFavicon}
                                            >
                                                Hapus
                                            </Button>
                                        )}
                                    </div>
                                    <InputError message={errors.app_favicon} className="mt-1" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="language" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Pengaturan Bahasa</CardTitle>
                                <CardDescription>Konfigurasi bahasa aplikasi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="language">Bahasa Default</Label>
                                        <select
                                            id="language"
                                            name="language"
                                            value={data.language}
                                            onChange={(e) => setData('language', e.target.value)}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 h-10 px-3"
                                        >
                                            <option value="id">Indonesia</option>
                                            <option value="en">English</option>
                                        </select>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Bahasa utama yang digunakan dalam aplikasi
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <div className="flex items-center justify-end space-x-4 pt-4">
                        <Button type="button" variant="outline" onClick={() => reset()}>
                            Reset
                        </Button>
                        <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700">
                            {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                        </Button>
                    </div>
                </form>
            </Tabs>
        </AppLayout>
    );
} 