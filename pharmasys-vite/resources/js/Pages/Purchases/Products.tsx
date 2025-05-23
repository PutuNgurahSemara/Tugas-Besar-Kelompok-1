import { Head, Link, router } from '@inertiajs/react'; // Added router
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { ProductCard, type ProductCardData } from '@/components/product-card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PlusCircle, Package, Search as SearchIcon, Filter as FilterIcon, X as ClearIcon, ListPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import { useState, useMemo, useEffect } from 'react'; // Added useState, useMemo, useEffect
import { debounce } from 'lodash'; // For debouncing search

interface PurchaseDetailProps {
    id: number;
    nama_produk: string;
    supplier: string;
    expired: string | null;
    jumlah: number;
    kemasan: string;
    harga_satuan: number;
    total: number;
    purchase_no: string;
    purchase_date: string;
    is_listed_as_product: boolean;
    is_directly_linked_to_product: boolean;
    produk_id_terkait?: number | null;
    kategori_produk?: string | null;
}

interface Props {
    purchaseDetails: PurchaseDetailProps[];
    filters?: { // Optional filters prop if passed from controller
        search?: string;
        supplier?: string;
        category?: string;
    }
}

export default function Products({ purchaseDetails, filters: initialFilters }: Props) {
    const [searchTerm, setSearchTerm] = useState(initialFilters?.search || '');
    const [selectedSupplier, setSelectedSupplier] = useState(initialFilters?.supplier || 'all');
    const [selectedCategory, setSelectedCategory] = useState(initialFilters?.category || 'all');
    const [registerAllDialogOpen, setRegisterAllDialogOpen] = useState(false);
    const [isRegistering, setIsRegistering] = useState(false);
    const [defaultMargin, setDefaultMargin] = useState(20); // Default value as fallback
    
    // Use default margin from props or fallback to 20%
    useEffect(() => {
        console.log('Using default margin: 20%');
        setDefaultMargin(20); // Default margin 20%
        
        // Add event listener for warehouse updates
        const handleWarehouseUpdate = () => {
            console.log('Warehouse update event received, reloading data...');
            router.reload({
                only: ['purchaseDetails'],
                onSuccess: () => {
                    console.log('Warehouse data reloaded successfully');
                },
                onError: (error) => {
                    console.error('Error reloading warehouse data:', error);
                }
            });
        };

        window.addEventListener('warehouse:updated', handleWarehouseUpdate);
        
        // Cleanup
        return () => {
            window.removeEventListener('warehouse:updated', handleWarehouseUpdate);
        };
    }, []);

    // Debounced search effect (optional, good for performance if API based)
    // For client-side filtering, direct filtering is fine.
    // If you want to persist filters in URL and make backend filter, you'd use router.get
    // For now, this is client-side filtering.

    const uniqueSuppliers = useMemo(() => {
        const suppliers = new Set(purchaseDetails.map(detail => detail.supplier));
        return ["all", ...Array.from(suppliers)];
    }, [purchaseDetails]);

    const uniqueCategories = useMemo(() => {
        const categories = new Set(purchaseDetails.map(detail => detail.kategori_produk).filter(Boolean) as string[]);
        return ["all", ...Array.from(categories)];
    }, [purchaseDetails]);
    
    const filteredPurchaseDetails = useMemo(() => {
        return purchaseDetails.filter(detail => {
            const nameMatch = detail.nama_produk.toLowerCase().includes(searchTerm.toLowerCase());
            const supplierMatch = selectedSupplier === 'all' || detail.supplier === selectedSupplier;
            const categoryMatch = selectedCategory === 'all' || detail.kategori_produk === selectedCategory;
            return nameMatch && supplierMatch && categoryMatch;
        });
    }, [purchaseDetails, searchTerm, selectedSupplier, selectedCategory]);


    const transformToProductCardData = (detail: PurchaseDetailProps): ProductCardData => {
        return {
            id: detail.id,
            nama_produk: detail.nama_produk,
            nama_supplier: detail.supplier,
            stok_tersedia: detail.jumlah,
            harga_beli: detail.harga_satuan,
            harga_jual: 0, // Selling price would typically come from the main 'produks' table
            tanggal_kadaluarsa: detail.expired || undefined, // Use OR to default null to undefined
            kategori: detail.kategori_produk || undefined, // Use OR to default null to undefined
            is_listed_as_product: detail.is_listed_as_product,
        };
    };
    
    // Function to handle registering all unregistered products
    const handleRegisterAllProducts = async () => {
        setIsRegistering(true);
        
        // Get all unregistered products
        const unregisteredProducts = purchaseDetails.filter(detail => !detail.is_listed_as_product);
        
        if (unregisteredProducts.length === 0) {
            alert('Semua produk sudah terdaftar!');
            setIsRegistering(false);
            setRegisterAllDialogOpen(false);
            return;
        }
        
        // Process products one by one using a for...of loop instead of recursion
        let processed = 0;
        let failed = 0;
        
        for (const product of unregisteredProducts) {
            try {
                // Create form data
                const formData = new FormData();
                formData.append('nama', product.nama_produk);
                formData.append('harga', product.harga_satuan.toString());
                formData.append('margin', defaultMargin.toString());
                formData.append('quantity', product.jumlah.toString());
                if (product.kategori_produk) {
                    formData.append('category_id', product.kategori_produk);
                }
                if (product.expired) {
                    formData.append('expired_at', product.expired);
                }
                formData.append('purchase_detail_id', product.id.toString());
                formData.append('is_from_warehouse', 'true');
                formData.append('supplier', product.supplier || '');
                
                // Use axios directly instead of Inertia's router to avoid scroll issues
                await axios.post(route('produk.store'), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-Inertia': 'true'
                    }
                });
                
                processed++;
                console.log('Product registered successfully:', product.nama_produk);
                
                // Small delay between requests to prevent overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                console.error('Failed to register product:', product.nama_produk, error);
                failed++;
                // Continue with next product even if this one failed
                await new Promise(resolve => setTimeout(resolve, 300));
            }
        }
        
        // Update UI after all requests are done
        setIsRegistering(false);
        setRegisterAllDialogOpen(false);
        
        if (processed > 0) {
            // Show summary first
            alert(`${processed} produk berhasil didaftarkan! ${failed} produk gagal didaftarkan.`);
            
            // Then do a full page reload to ensure all data is fresh
            window.location.reload();
        } else {
            alert('Tidak ada produk yang berhasil didaftarkan. Silakan coba lagi.');
        }
    };

    return (
        <AppLayout>
            <Head title="Gudang (Purchased Items)" />
            
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gudang - Item Pembelian</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Daftar item yang telah dibeli dan tersedia di gudang. Telusuri atau filter untuk menemukan item.
                        </p>
                    </div>
                    <Button 
                        onClick={() => setRegisterAllDialogOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <ListPlus className="mr-2 h-4 w-4" />
                        Masukkan Semua Produk
                    </Button>
                </div>

                {/* Search and Filter Section */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <FilterIcon className="mr-2 h-5 w-5" />
                            Filter & Pencarian
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Input 
                                type="text"
                                placeholder="Cari nama produk..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        </div>
                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueSuppliers.map(supplier => (
                                    <SelectItem key={supplier} value={supplier}>
                                        {supplier === 'all' ? 'Semua Supplier' : supplier}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Semua Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                {uniqueCategories.map(category => (
                                    <SelectItem key={category} value={category}>
                                        {category === 'all' ? 'Semua Kategori' : category}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>


                {purchaseDetails.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-700 rounded-md shadow-sm dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300">
                        {(() => {
                            const totalItems = purchaseDetails.length; // Original total
                            const listedInOriginal = purchaseDetails.filter(d => d.is_listed_as_product).length;
                            const displayedItems = filteredPurchaseDetails.length;
                            
                            let message = `${displayedItems} dari ${totalItems} item pembelian ditampilkan. `;
                            message += `${listedInOriginal} dari total ${totalItems} item telah terdaftar sebagai produk.`;
                            if (listedInOriginal < totalItems) {
                                message += " Item yang belum terdaftar mungkin perlu ditambahkan ke daftar produk utama.";
                            }
                            return message;
                        })()}
                    </div>
                )}

                {filteredPurchaseDetails.length === 0 ? (
                    <div className="text-center py-12">
                        <Package size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                            {searchTerm || selectedSupplier !== 'all' || selectedCategory !== 'all' 
                                ? "Tidak ada item yang cocok" 
                                : "Belum Ada Item di Gudang"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            {searchTerm || selectedSupplier !== 'all' || selectedCategory !== 'all' 
                                ? "Coba ubah filter atau kata kunci pencarian Anda."
                                : "Data item dari pembelian akan muncul di sini."}
                        </p>
                        {!searchTerm && selectedSupplier === 'all' && selectedCategory === 'all' && (
                             <Link href={route('purchases.create')}>
                                <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Catat Pembelian Baru
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                        {filteredPurchaseDetails.map((detail) => {
                            const productCardData = transformToProductCardData(detail);
                            return (
                                <ProductCard 
                                    key={`purchase-detail-${detail.id}`} 
                                    product={productCardData}
                                />
                            );
                        })}
                    </ul>
                )}
            </div>
            
            {/* Register All Products Confirmation Dialog */}
            <Dialog open={registerAllDialogOpen} onOpenChange={setRegisterAllDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Masukkan Semua Produk</DialogTitle>
                        <DialogDescription>
                            Apakah Anda yakin ingin mendaftarkan semua produk yang belum terdaftar ke halaman produk?
                            Produk akan didaftarkan tanpa gambar dengan data yang tersedia di gudang.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setRegisterAllDialogOpen(false)} disabled={isRegistering}>
                            Batal
                        </Button>
                        <Button 
                            onClick={handleRegisterAllProducts} 
                            disabled={isRegistering}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            {isRegistering ? 'Memproses...' : 'Ya, Daftarkan Semua'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
