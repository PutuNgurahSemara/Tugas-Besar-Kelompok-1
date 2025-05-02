import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/hooks/use-translation';
import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';

// Interface untuk data permission
interface SpatiePermission {
    id: number;
    name: string;
    guard_name: string;
}

interface PermissionEditProps {
    permission: SpatiePermission;
}

// Breadcrumb untuk halaman Permission Edit dinamis
const getBreadcrumbs = (name: string): BreadcrumbItem[] => [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Access Control', href: '#' },
    { title: 'Permissions', href: route('permissions.index') },
    { title: `Edit: ${name}`, href: '#' },
];

export default function PermissionsEdit({ permission }: PermissionEditProps) {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Inisialisasi form dengan useForm dan data permission yang ada
    const { data, setData, errors, put, processing } = useForm<SpatiePermission>({
        id: permission.id,
        name: permission.name,
        guard_name: permission.guard_name,
    });

    // Handle submit form
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        put(route('permissions.update', permission.id), {
            onSuccess: () => {
                setIsSubmitting(false);
                router.visit(route('permissions.index'));
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    return (
        <AppLayout breadcrumbs={getBreadcrumbs(permission.name)}>
            <Head title={t('edit.permission')} />

            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold tracking-tight">
                    {t('edit.permission')}: {permission.name}
                </h2>
                <Link href={route('permissions.index')}>
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('back')}
                    </Button>
                </Link>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <CardTitle>{t('permission.details')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="name">{t('name')}</Label>
                            <Input 
                                id="name"
                                type="text"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="view-users, create-product, etc."
                                className={errors.name ? 'border-red-500' : ''}
                                autoFocus
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name}</p>
                            )}
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {t('permission.name.format')}
                            </p>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="guard_name">{t('guard')}</Label>
                            <select
                                id="guard_name"
                                value={data.guard_name}
                                onChange={(e) => setData('guard_name', e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="web">web</option>
                                <option value="api">api</option>
                            </select>
                            {errors.guard_name && (
                                <p className="text-sm text-red-500">{errors.guard_name}</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Link href={route('permissions.index')}>
                            <Button variant="outline" type="button">{t('cancel')}</Button>
                        </Link>
                        <Button 
                            type="submit" 
                            className="bg-green-600 hover:bg-green-700"
                            disabled={processing || isSubmitting}
                        >
                            {isSubmitting ? t('saving') : t('save')}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </AppLayout>
    );
} 