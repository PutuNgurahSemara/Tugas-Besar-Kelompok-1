import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/hooks/use-translation';

interface SpatieRole {
    id: number;
    name: string;
}

interface UsersEditProps {
    user: User & { roles: { id: number }[] };
    roles: SpatieRole[];
    userRoles: number[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Users', href: route('users.index') },
    { title: 'Edit', href: '#' },
];

export default function UsersEdit({ user, roles = [], userRoles = [] }: UsersEditProps) {
    const { t } = useTranslation();
    const { data, setData, put, errors, processing } = useForm({
        name: user.name || '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        roles: userRoles || [],
    });

    const handleRoleChange = (roleId: number, checked: boolean) => {
        const updatedRoles = checked
            ? [...data.roles, roleId]
            : data.roles.filter(id => id !== roleId);
        
        setData('roles', updatedRoles);
    };

    const submit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        put(route('users.update', user.id));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${t('edit')} ${user.name}`} />
            <Card>
                <form onSubmit={submit}>
                    <CardHeader>
                        <CardTitle>{t('edit')} {user.name}</CardTitle>
                        <CardDescription>{t('update.user.details')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t('name')} *</Label>
                                <Input id="name" value={data.name} onChange={e => setData('name', e.target.value)} autoFocus required />
                                <InputError message={errors.name} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('email')} *</Label>
                                <Input id="email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} required />
                                <InputError message={errors.email} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">{t('new.password')}</Label>
                                <Input id="password" type="password" value={data.password} onChange={e => setData('password', e.target.value)} />
                                <InputError message={errors.password} />
                                <p className="text-xs text-muted-foreground">{t('leave.blank.password')}</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">{t('confirm.new.password')}</Label>
                                <Input id="password_confirmation" type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} />
                                <InputError message={errors.password_confirmation} />
                            </div>
                        </div>
                        
                        {/* Roles Section */}
                        <div className="pt-4 border-t">
                            <Label className="text-lg font-medium">{t('roles')}</Label>
                            <p className="text-sm text-muted-foreground mb-4">{t('assign.roles.to.user')}</p>
                            
                            {roles.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                                    {roles.map(role => (
                                        <div key={role.id} className="flex items-center space-x-2 p-3 border rounded-md hover:bg-accent/50 transition-colors">
                                            <Checkbox 
                                                id={`role-${role.id}`}
                                                checked={data.roles.includes(role.id)}
                                                onCheckedChange={(checked) => handleRoleChange(role.id, !!checked)}
                                            />
                                            <div>
                                                <Label 
                                                    htmlFor={`role-${role.id}`}
                                                    className="cursor-pointer text-base font-medium capitalize"
                                                >
                                                    {role.name}
                                                </Label>
                                                {role.name === 'super-admin' && (
                                                    <Badge className="ml-2 bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-800/20 dark:text-red-300">
                                                        {t('admin')}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground p-4 border rounded-md">
                                    {t('no.roles.found')}
                                </div>
                            )}
                            
                            <InputError message={errors.roles} className="mt-2" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end space-x-2">
                        <Link href={route('users.index')}>
                            <Button type="button" variant="outline" disabled={processing}>{t('cancel')}</Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-green-600 hover:bg-green-700">{t('update.user')}</Button>
                    </CardFooter>
                </form>
            </Card>
        </AppLayout>
    );
} 