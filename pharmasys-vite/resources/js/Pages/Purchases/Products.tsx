import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

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
}

interface Props {
    purchaseDetails: PurchaseDetailProps[];
}

export default function Products({ purchaseDetails }: Props) {
    // Calculate days until expiry for a given date
    const getDaysUntilExpiry = (expiryDate: string | null) => {
        if (!expiryDate) return null;
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    // Get badge color based on expiry days
    const getExpiryBadgeColor = (days: number | null): "default" | "destructive" | "secondary" => {
        if (days === null) return 'secondary';
        if (days < 0) return 'destructive';
        if (days < 90) return 'default';
        return 'secondary';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    };

    return (
        <AppLayout>
            <Head title="Purchased Products" />
            
            <div className="container mx-auto py-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Purchased Products</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {purchaseDetails.map((detail) => {
                        const daysUntilExpiry = getDaysUntilExpiry(detail.expired);
                        const expiryBadgeColor = getExpiryBadgeColor(daysUntilExpiry);

                        return (
                            <Card key={detail.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <CardTitle className="text-lg">{detail.nama_produk}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[200px]">
                                        <div className="space-y-2">
                                            <div>
                                                <span className="font-semibold">Supplier:</span>
                                                <p className="text-sm">{detail.supplier}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Purchase Info:</span>
                                                <p className="text-sm">
                                                    No: {detail.purchase_no}<br />
                                                    Date: {detail.purchase_date}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Stock:</span>
                                                <p className="text-sm">{detail.jumlah} {detail.kemasan}</p>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Price:</span>
                                                <p className="text-sm">
                                                    Unit: {formatCurrency(detail.harga_satuan)}<br />
                                                    Total: {formatCurrency(detail.total)}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="font-semibold">Expiry:</span><br />
                                                <Badge variant={expiryBadgeColor}>
                                                    {detail.expired ? (
                                                        <>
                                                            {detail.expired}
                                                            {daysUntilExpiry !== null && (
                                                                <span className="ml-1">
                                                                    ({daysUntilExpiry} days {daysUntilExpiry < 0 ? 'ago' : 'left'})
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        'No expiry date'
                                                    )}
                                                </Badge>
                                            </div>
                                        </div>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </AppLayout>
    );
}