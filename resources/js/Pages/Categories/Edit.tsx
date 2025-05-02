import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Category } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

interface CategoriesEditProps {
    category: Category;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Categories', href: route('categories.index') },
    { title: 'Edit', href: '#' }, // Dinamis atau sesuaikan
];

export default function CategoriesEdit({ category }: CategoriesEditProps) {
    const { data, setData, put, errors, processing } = useForm({
        name: category.name || '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(route('categories.update', category.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Category - ${category.name}`} />

            <Card>
                <form onSubmit={submit}>
                    <CardHeader>
                        <CardTitle>Edit Category</CardTitle>
                        <CardDescription>Update the category details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Category Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                autoFocus
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            <InputError message={errors.name} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Link href={route('categories.index')}>
                            <Button type="button" variant="outline" disabled={processing}>
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            Update Category
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </AppLayout>
    );
} 