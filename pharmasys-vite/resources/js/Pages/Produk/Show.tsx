import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth'; // Import useAuth

interface Category {
    id: number;
    name: string;
}

interface Produk { // This is the base product model structure
    id: number;
    nama: string;
    harga: number;
    // quantity: number; // Stock will come from totalStock prop
    margin?: number;
    // expired_at?: string; // Expiry will come from earliestExpiryDate prop
    category_id?: number;
    category?: Category;
    image?: string;
    created_at: string;
    updated_at: string;
}

interface ProdukShowProps {
    produk: Produk;
    totalStock: number;
    earliestExpiryDate: string | null;
    // stockByExpiry is also passed but not used in this specific part of the UI
}

export default function ProdukShow({ produk, totalStock, earliestExpiryDate }: ProdukShowProps) {
    const { hasRole } = useAuth(); // Get hasRole function
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Products', href: route('produk.index') },
        { title: produk.nama, href: route('produk.show', produk.id) },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Produk - ${produk.nama}`} />
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Detail Produk</h2>
                <div className="space-x-2">
                    {/* Conditionally render Edit button */}
                    {hasRole('admin') && (
                        <Link href={route('produk.edit', produk.id)}>
                            <Button variant="secondary">Edit Produk</Button>
                        </Link>
                    )}
                    <Link href={route('produk.index')}>
                        <Button variant="ghost">Kembali</Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Informasi Produk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nama Produk</p>
                                <p className="font-medium">{produk.nama}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Kategori</p>
                                <p className="font-medium">{produk.category?.name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Harga</p>
                                <p className="font-medium">Rp {produk.harga.toLocaleString('id-ID')}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Stok</p>
                                <p className="font-medium">{totalStock ?? '0'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Margin</p>
                                <p className="font-medium">{produk.margin ? `${produk.margin}%` : '-'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Tanggal Kedaluwarsa</p>
                                <p className="font-medium">
                                    {earliestExpiryDate 
                                        ? format(new Date(earliestExpiryDate), 'dd MMM yyyy')
                                        : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Dibuat Pada</p>
                                <p className="font-medium">
                                    {format(new Date(produk.created_at), 'dd MMM yyyy HH:mm')}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Terakhir Diubah</p>
                                <p className="font-medium">
                                    {format(new Date(produk.updated_at), 'dd MMM yyyy HH:mm')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Gambar Produk</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        {produk.image ? (
                            <img 
                                src={`/storage/${produk.image}`} 
                                alt={produk.nama} 
                                className="max-w-full h-auto rounded-md"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-40 w-full bg-gray-100 rounded-md">
                                <p className="text-muted-foreground">Tidak ada gambar</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
