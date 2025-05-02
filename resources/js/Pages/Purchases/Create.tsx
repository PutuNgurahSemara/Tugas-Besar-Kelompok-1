import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category, type Supplier } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import InputError from '@/components/InputError';
import { Progress } from "@/components/ui/progress";
import { useState } from 'react';

interface PurchaseCreateProps {
    categories: Category[];
    suppliers: Supplier[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Purchases', href: route('purchases.index') },
    { title: 'Add Purchase', href: route('purchases.create') },
];

export default function PurchaseCreate() {
    const { suppliers } = usePage<PurchaseCreateProps>().props;

    const { data, setData, post, errors, processing } = useForm({
        invoice_number: '',
        supplier_id: '',
        invoice_date: '',
        due_date: '',
        payment_date: '',
        status: 'UNPAID',
        note: '',
        items: [
            { product_name: '', expired: '', quantity: 1, unit: '', unit_price: 0, total: 0 }
        ]
    });

    // Update item di tabel produk
    const updateItem = (idx: number, key: string, value: any) => {
        const items = [...data.items];
        items[idx] = { ...items[idx], [key]: value };
        if (key === 'quantity' || key === 'unit_price') {
            const qty = key === 'quantity' ? value : items[idx].quantity;
            const price = key === 'unit_price' ? value : items[idx].unit_price;
            items[idx].total = (parseFloat(qty) || 0) * (parseFloat(price) || 0);
        }
        setData('items', items);
    };

    const addItem = () => {
        setData('items', [
            ...data.items,
            { product_name: '', expired: '', quantity: 1, unit: '', unit_price: 0, total: 0 }
        ]);
    };

    const removeItem = (idx: number) => {
        if (data.items.length === 1) return;
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const totalFaktur = data.items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);

    function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setData('total', totalFaktur);
        post(route('purchases.store'));
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tambah Faktur Pembelian" />
            <Card>
                <CardHeader>
                    <CardTitle>Tambah Faktur Pembelian</CardTitle>
                    <CardDescription>Input data faktur dan detail barang pembelian dari PBF.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-8">
                        {/* Data Faktur */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="invoice_number">No Faktur *</Label>
                                    <Input
                                        id="invoice_number"
                                        name="invoice_number"
                                        value={data.invoice_number}
                                        onChange={e => setData('invoice_number', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.invoice_number} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="supplier_id">PBF *</Label>
                                    <Select
                                        name="supplier_id"
                                        value={data.supplier_id ? String(data.supplier_id) : ''}
                                        onValueChange={value => setData('supplier_id', value)}
                                    >
                                        <SelectTrigger className="mt-1 block w-full">
                                            <SelectValue placeholder="Pilih PBF" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map(supplier => (
                                                <SelectItem key={supplier.id} value={String(supplier.id)}>
                                                    {supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.supplier_id} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="invoice_date">Tanggal Faktur *</Label>
                                    <Input
                                        id="invoice_date"
                                        name="invoice_date"
                                        type="date"
                                        value={data.invoice_date}
                                        onChange={e => setData('invoice_date', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.invoice_date} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="due_date">Jatuh Tempo</Label>
                                    <Input
                                        id="due_date"
                                        name="due_date"
                                        type="date"
                                        value={data.due_date}
                                        onChange={e => setData('due_date', e.target.value)}
                                    />
                                    <InputError message={errors.due_date} className="mt-2" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="payment_date">Tanggal Pembayaran</Label>
                                    <Input
                                        id="payment_date"
                                        name="payment_date"
                                        type="date"
                                        value={data.payment_date}
                                        onChange={e => setData('payment_date', e.target.value)}
                                    />
                                    <InputError message={errors.payment_date} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        name="status"
                                        value={data.status}
                                        onValueChange={value => setData('status', value)}
                                    >
                                        <SelectTrigger className="mt-1 block w-full">
                                            <SelectValue placeholder="Pilih status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="UNPAID">Belum Terbayar</SelectItem>
                                            <SelectItem value="PAID">Lunas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError message={errors.status} className="mt-2" />
                                </div>
                                <div>
                                    <Label htmlFor="note">Keterangan</Label>
                                    <Input
                                        id="note"
                                        name="note"
                                        value={data.note}
                                        onChange={e => setData('note', e.target.value)}
                                    />
                                    <InputError message={errors.note} className="mt-2" />
                                </div>
                                <div>
                                    <Label>Total Faktur</Label>
                                    <div className="font-bold text-lg">Rp {totalFaktur.toLocaleString('id-ID')}</div>
                                </div>
                            </div>
                        </div>

                        {/* Tabel Produk */}
                        <div>
                            <Label className="mb-2 block">Detail Barang</Label>
                            <div className="overflow-x-auto">
                                <table className="min-w-full border text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-800">
                                            <th className="p-2 border">Nama Produk</th>
                                            <th className="p-2 border">Expired</th>
                                            <th className="p-2 border">Jumlah</th>
                                            <th className="p-2 border">Kemasan</th>
                                            <th className="p-2 border">Harga Satuan</th>
                                            <th className="p-2 border">Total</th>
                                            <th className="p-2 border"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="p-2 border">
                                                    <Label htmlFor={`product_name_${idx}`}>Nama Produk</Label>
                                                    <Input
                                                        id={`product_name_${idx}`}
                                                        name={`items[${idx}].product_name`}
                                                        value={item.product_name}
                                                        onChange={e => updateItem(idx, 'product_name', e.target.value)}
                                                        required
                                                    />
                                                    <InputError message={errors[`items.${idx}.product_name`]} />
                                                </td>
                                                <td className="p-2 border">
                                                    <Label htmlFor={`expired_${idx}`}>Expired</Label>
                                                    <Input
                                                        id={`expired_${idx}`}
                                                        name={`items[${idx}].expired`}
                                                        type="date"
                                                        value={item.expired}
                                                        onChange={e => updateItem(idx, 'expired', e.target.value)}
                                                    />
                                                    <InputError message={errors[`items.${idx}.expired`]} />
                                                </td>
                                                <td className="p-2 border">
                                                    <Label htmlFor={`quantity_${idx}`}>Jumlah</Label>
                                                    <Input
                                                        id={`quantity_${idx}`}
                                                        name={`items[${idx}].quantity`}
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                        required
                                                    />
                                                    <InputError message={errors[`items.${idx}.quantity`]} />
                                                </td>
                                                <td className="p-2 border">
                                                    <Label htmlFor={`unit_${idx}`}>Kemasan</Label>
                                                    <Input
                                                        id={`unit_${idx}`}
                                                        name={`items[${idx}].unit`}
                                                        value={item.unit}
                                                        onChange={e => updateItem(idx, 'unit', e.target.value)}
                                                    />
                                                    <InputError message={errors[`items.${idx}.unit`]} />
                                                </td>
                                                <td className="p-2 border">
                                                    <Label htmlFor={`unit_price_${idx}`}>Harga Satuan</Label>
                                                    <Input
                                                        id={`unit_price_${idx}`}
                                                        name={`items[${idx}].unit_price`}
                                                        type="number"
                                                        min={0}
                                                        value={item.unit_price}
                                                        onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        required
                                                    />
                                                    <InputError message={errors[`items.${idx}.unit_price`]} />
                                                </td>
                                                <td className="p-2 border">
                                                    <Label htmlFor={`total_${idx}`}>Total</Label>
                                                    <Input
                                                        id={`total_${idx}`}
                                                        name={`items[${idx}].total`}
                                                        value={item.total}
                                                        readOnly
                                                    />
                                                </td>
                                                <td className="p-2 border">
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => removeItem(idx)}
                                                        disabled={data.items.length === 1}
                                                    >
                                                        Hapus
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Button type="button" className="mt-2" onClick={addItem}>
                                Tambah Produk
                            </Button>
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex items-center justify-end space-x-4 mt-6">
                            <Link href={route('purchases.index')} className="text-sm text-gray-600 hover:text-gray-900">
                                Batal
                            </Link>
                            <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700 text-white">
                                {processing ? 'Menyimpan...' : 'Simpan Faktur'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppLayout>
    );
} 