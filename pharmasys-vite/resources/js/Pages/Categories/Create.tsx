import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Categories', href: route('categories.index') },
    { title: 'Create', href: route('categories.create') },
];

export default function CategoriesCreate() {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
    });

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('categories.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Category" />

            <Card>
                <form onSubmit={submit}>
                    <CardHeader>
                        <CardTitle>Create New Category</CardTitle>
                        <CardDescription>Create a new category for your products.</CardDescription>
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
                            Save Category
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </AppLayout>
    );
} 