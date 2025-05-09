import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Supplier } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Textarea } from '@/components/ui/textarea';

interface SuppliersEditProps {
    supplier: Supplier;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Suppliers', href: route('suppliers.index') },
    { title: 'Edit', href: '#' },
];

export default function SuppliersEdit({ supplier }: SuppliersEditProps) {
    const { data, setData, put, errors, processing } = useForm({
        company: supplier.company || '',
        phone: supplier.phone || '',
        note: supplier.note || '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(route('suppliers.update', supplier.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Supplier - ${supplier.name}`} />
            <Card>
                <form onSubmit={submit}>
                    <CardHeader>
                        <CardTitle>Edit Supplier</CardTitle>
                        <CardDescription>Update the supplier details.</CardDescription>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="company">Nama Perusahaan *</Label>
                            <Input id="company" value={data.company} onChange={e => setData('company', e.target.value)} autoFocus required />
                            <InputError message={errors.company} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">No. WhatsApp (bisa dihubungi) *</Label>
                            <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} required />
                            <InputError message={errors.phone} />
                            <div className="text-xs text-muted-foreground">Nomor ini akan digunakan untuk direct ke WhatsApp di menu supplier.</div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="note">Keterangan</Label>
                            <Textarea id="note" value={data.note} onChange={e => setData('note', e.target.value)} />
                            <InputError message={errors.note} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Link href={route('suppliers.index')}>
                            <Button type="button" variant="outline" disabled={processing}>Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>Update Supplier</Button>
                    </CardFooter>
                </form>
            </Card>
        </AppLayout>
    );
} 