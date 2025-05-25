import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useToast } from '@/components/ui/toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

// Interface Produk
interface Produk {
    id: number;
    nama: string;
    harga: number;
    quantity: number; // This is the available stock from backend
    image?: string;
}

// Komponen InputError sederhana
function InputError({ message, className = "" }: { message?: string; className?: string }) {
    if (!message) return null;
    return <div className={`text-red-500 text-xs mt-1 ${className}`}>{message}</div>;
}

// Props for SalesCreate page (assuming 'products' comes from controller)
interface SalesCreatePageProps {
    products: Produk[];
    // Add other props if any, e.g., errors, flash messages if not handled by usePage directly
    [key: string]: any; // To satisfy PageProps constraint if needed
}

interface CartItem extends Produk {
    cart_quantity: number; // Quantity of this item in the cart
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Sales', href: route('sales.index') },
    { title: 'Add Sale', href: route('sales.create') },
];

export default function SalesCreate() {
    const { t } = useTranslation();
    const { showToast } = useToast();
    
    // Use SalesCreatePageProps for type safety with usePage
    const { products = [] } = usePage<SalesCreatePageProps>().props; 

    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    // Unused state variables, can be removed if not planned for future use
    // const [showSuccessModal, setShowSuccessModal] = useState(false);
    // const [showErrorModal, setShowErrorModal] = useState(false);
    // const [errorMessage, setErrorMessage] = useState('');
    const [animateCartPulse, setAnimateCartPulse] = useState(false);


    const { data, setData, post, errors, processing, reset } = useForm({
        payment_method: 'Cash',
        amount_paid: '',
        items: null, // Add items here so errors.items is a known key
    });

    // Filter produk berdasarkan search term
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter((p: Produk) =>
            p.nama.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    // Tambah produk ke keranjang
    const addToCart = (product: Produk) => {
        setCart(currentCart => {
            const existingItem = currentCart.find((item: CartItem) => item.id === product.id);
            if (existingItem) {
                // Check against original product quantity (max available stock)
                if (existingItem.cart_quantity < product.quantity) { 
                    return currentCart.map((item: CartItem) =>
                        item.id === product.id
                            ? { ...item, cart_quantity: item.cart_quantity + 1 }
                            : item
                    );
                } else {
                    // Reverting to multi-argument string-based showToast based on TS errors
                    showToast(t('error'), t('stock.not.enough.cart') + ": " + product.nama, 'error'); 
                    return currentCart; // Not enough stock to add more
                }
            } else {
                if (product.quantity > 0) { // Check if product has any stock
                    return [...currentCart, { ...product, cart_quantity: 1 }];
                } else {
                    // Reverting to multi-argument string-based showToast
                    showToast(t('error'), t('out.of.stock.cart') + ": " + product.nama, 'error'); 
                    return currentCart; // Product is out of stock
                }
            }
        });
        // Simple pulse animation for cart
        setAnimateCartPulse(true);
        setTimeout(() => setAnimateCartPulse(false), 700);
    };

    // Update kuantitas di keranjang
    const updateCartQuantity = (productId: number, newQuantityInput: number) => {
        setCart(currentCart => {
            const itemToUpdate = currentCart.find((item: CartItem) => item.id === productId);
            if (!itemToUpdate) return currentCart;

            // product.quantity here refers to the original stock passed when item was added
            const maxQuantity = itemToUpdate.quantity; 
            const validatedQuantity = Math.max(1, Math.min(newQuantityInput, maxQuantity));
            
            return currentCart.map((item: CartItem) =>
                item.id === productId
                    ? { ...item, cart_quantity: validatedQuantity }
                    : item
            );
        });
    };

    // Hapus item dari keranjang
    const removeFromCart = (productId: number) => {
        setCart(currentCart => currentCart.filter((item: CartItem) => item.id !== productId));
    };

    // Hitung total
    const totalPrice = useMemo(() => {
        return cart.reduce((total, item) => total + (item.harga * item.cart_quantity), 0);
    }, [cart]);

    // Hitung kembalian
    const changeAmount = useMemo(() => {
        const paid = parseFloat(data.amount_paid);
        if (!isNaN(paid) && paid >= totalPrice) {
            return paid - totalPrice;
        }
        return null; 
    }, [data.amount_paid, totalPrice]);

    // Submit form
    function submitSale(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (cart.length === 0) {
            showToast(t('error'), t('cart.empty.to.submit'), 'error');
            return;
        }
        const dataToSend = {
            payment_method: data.payment_method,
            amount_paid: data.amount_paid || '0', // Ensure amount_paid is not empty string
            items: cart.map((item: CartItem) => ({
                produk_id: item.id,
                quantity: item.cart_quantity,
                price: item.harga 
            })),
            total_price: totalPrice, // Send calculated total price
        };
        
        router.post(route('sales.store'), dataToSend, { // dataToSend is the second argument, options is the third
            onSuccess: () => {
                setCart([]);
                reset('amount_paid', 'payment_method'); // Reset only relevant fields
                // Reverting to multi-argument string-based showToast
                showToast(
                    t('payment.success'),
                    t('transaction.saved'),
                    'success', // Assuming 'success' is a valid variant string for your toast
                    5000
                );
            },
            onError: (formErrors: Record<string, string>) => { // Explicitly type errors
                let errorMsg = t('transaction.error.generic');
                if (formErrors.items && typeof formErrors.items === 'string') {
                    errorMsg = formErrors.items;
                } else if (Object.values(formErrors).length > 0) {
                    errorMsg = Object.values(formErrors)[0];
                }
                // Reverting to multi-argument string-based showToast
                showToast(
                    t('payment.failed'),
                    errorMsg,
                    'error', // Assuming 'error' is a valid variant string
                    5000
                );
            }
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={t('sales.pos')} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Daftar Produk (Kiri) */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('products.title')}</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder={t('search.products')}
                                className="pl-8 w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ScrollArea className="h-[500px]">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {filteredProducts.map((product: Produk) => (
                                    <Card
                                        key={product.id}
                                        className={`overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-102 hover:shadow-lg dark:hover:border-slate-700 ${product.quantity === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={() => product.quantity !== 0 && addToCart(product)}
                                        title={product.quantity === 0 ? t('out.of.stock') : `${t('add.to.cart')}: ${product.nama}`}
                                    >
                                        {product.image ? (
                                            <img 
                                                src={`/storage/produk_images/${product.image}`} 
                                                alt={product.nama}
                                                className="h-24 w-full object-cover rounded-lg"
                                                onError={(e) => {
                                                    const img = e.target as HTMLImageElement;
                                                    // Coba beberapa path alternatif
                                                    const alternativePaths = [
                                                        `/storage/${product.image}`,
                                                        `/storage/app/public/${product.image}`,
                                                        `/storage/app/public/produk_images/${product.image}`,
                                                        `/images/${product.image}`
                                                    ];
                                                    
                                                    const tryNextPath = (index: number) => {
                                                        if (index < alternativePaths.length) {
                                                            img.src = alternativePaths[index];
                                                            img.onerror = () => tryNextPath(index + 1);
                                                        } else {
                                                            img.src = '/images/placeholder-product-custom.svg';
                                                        }
                                                    };
                                                    
                                                    tryNextPath(0);
                                                }}
                                            />
                                        ) : (
                                            <div className="h-24 w-full rounded-lg bg-muted flex items-center justify-center">
                                                <img 
                                                    src="/images/placeholder-product-custom.svg"
                                                    alt="Placeholder Product"
                                                    className="w-16 h-16 object-contain"
                                                />
                                            </div>
                                        )}
                                        <div className="p-2 text-sm">
                                            <p className="font-medium truncate">{product.nama}</p>
                                            <p className="text-muted-foreground">Rp {product.harga.toLocaleString('id-ID')}</p>
                                            <p className={`text-xs ${product.quantity === 0 ? 'text-red-500' : 'text-gray-500'}`}>{t('stock')} {product.quantity ?? 0}</p>
                                        </div>
                                    </Card>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <p className="col-span-full text-center text-muted-foreground mt-4">{t('no.products')}</p>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Kolom Keranjang & Pembayaran (Kanan) */}
                <Card className={`lg:col-span-1 transition-colors duration-300 ease-in-out ${animateCartPulse ? 'border-green-500 border-2' : ''}`}>
                    <CardHeader>
                        <CardTitle>{t('cart')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitSale} className="flex flex-col h-full">
                            <ScrollArea className="flex-grow mb-4">
                                {cart.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">{t('cart.empty')}</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="pr-2">{t('item')}</TableHead>
                                                <TableHead className="w-20 text-center">{t('qty')}</TableHead>
                                                <TableHead className="w-28 text-right pr-2">{t('subtotal')}</TableHead>
                                                <TableHead className="w-12 text-center">{t('del')}</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item: CartItem) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium text-xs truncate pr-2">{item.nama}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            max={item.quantity} // Max is original stock of product
                                                            value={item.cart_quantity}
                                                            onChange={(e) => updateCartQuantity(item.id, parseInt(e.target.value) || 1)}
                                                            className="h-8 w-16 text-center mx-auto"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-xs text-right pr-2">Rp {(item.harga * item.cart_quantity).toLocaleString('id-ID')}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 mx-auto" onClick={() => removeFromCart(item.id)}>
                                                            <X className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </ScrollArea>

                            <div className="border-t pt-4 space-y-4 mt-auto">
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>{t('total')}</span>
                                    <span>Rp {totalPrice.toLocaleString('id-ID', {minimumFractionDigits: 0, maximumFractionDigits: 0})}</span>
                                </div>
                                <div>
                                    <Label htmlFor="payment_method">{t('Metode Pembayaran')}</Label>
                                    <Select 
                                        value={data.payment_method} 
                                        onValueChange={(value) => setData('payment_method', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih Metode Pembayaran" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="card">Card</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                            <SelectItem value="qris">QRIS</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.payment_method as string | undefined} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="amount_paid">{t('amount.paid')}</Label>
                                    <Input
                                        id="amount_paid"
                                        type="number"
                                        placeholder={t('enter.amount')}
                                        value={data.amount_paid}
                                        onChange={(e) => setData('amount_paid', e.target.value)}
                                        min={totalPrice} // Ensure amount paid is at least total price
                                    />
                                    <InputError message={errors.amount_paid as string | undefined} className="mt-2" />
                                </div>
                                {changeAmount !== null && changeAmount >= 0 && (
                                    <div className="flex justify-between font-semibold text-md text-blue-600">
                                        <span>{t('change')}</span>
                                        <span>Rp {changeAmount.toLocaleString('id-ID')}</span>
                                    </div>
                                )}
                                <Button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    disabled={processing || cart.length === 0 || parseFloat(data.amount_paid) < totalPrice}
                                >
                                    {processing ? t('processing') : t('complete.sale')}
                                </Button>
                                {/* Display general 'items' error if it exists and is a string from form errors */}
                                {errors.items && typeof errors.items === 'string' ? (
                                    <InputError message={errors.items} className="mt-2 text-center" />
                                ) : null}
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
