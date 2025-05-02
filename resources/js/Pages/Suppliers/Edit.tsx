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
        name: supplier.name || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        company: supplier.company || '',
        address: supplier.address || '',
        product: supplier.product || '',
        comment: supplier.comment || '',
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
                            <Label htmlFor="name">Supplier Name *</Label>
                            <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} autoFocus required />
                            <InputError message={errors.name} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
                            <InputError message={errors.email} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" value={data.phone} onChange={e => setData('phone', e.target.value)} />
                            <InputError message={errors.phone} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company">Company</Label>
                            <Input id="company" value={data.company} onChange={e => setData('company', e.target.value)} />
                            <InputError message={errors.company} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="product">Product(s)</Label>
                            <Input id="product" value={data.product} onChange={e => setData('product', e.target.value)} />
                            <InputError message={errors.product} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea id="address" value={data.address} onChange={e => setData('address', e.target.value)} />
                            <InputError message={errors.address} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="comment">Comment</Label>
                            <Textarea id="comment" value={data.comment} onChange={e => setData('comment', e.target.value)} />
                            <InputError message={errors.comment} />
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