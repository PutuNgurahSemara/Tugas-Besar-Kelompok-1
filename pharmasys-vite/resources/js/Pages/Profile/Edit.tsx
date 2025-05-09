import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type User } from '@/types';
import { Head, usePage, useForm } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import InputError from '@/components/InputError';
import { FlashMessage } from '@/components/flash-message';

interface ProfileEditProps {
    mustVerifyEmail: boolean;
    status?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: route('dashboard') },
    { title: 'Profile', href: route('profile.edit') },
];

export default function Edit({ mustVerifyEmail, status }: ProfileEditProps) {
    const { auth, flash } = usePage<{ auth: { user: User }, flash: any }>().props;

    const { data: profileData, setData: setProfileData, patch: patchProfile, errors: profileErrors, processing: processingProfile, recentlySuccessful: recentlySuccessfulProfile } = useForm({
        name: auth.user.name,
        email: auth.user.email,
    });

    const submitProfile = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patchProfile(route('profile.update'));
    };

    const { data: passwordData, setData: setPasswordData, patch: patchPassword, errors: passwordErrors, processing: processingPassword, recentlySuccessful: recentlySuccessfulPassword, reset: resetPasswordFields } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submitPassword = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        patchPassword(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => resetPasswordFields(),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile" />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Profile Information</CardTitle>
                        <CardDescription>Update your account's profile information and email address.</CardDescription>
                        <FlashMessage flash={flash} />
                        {recentlySuccessfulProfile && <p className="text-sm text-green-600 dark:text-green-400">Saved.</p>}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitProfile} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData('name', e.target.value)}
                                    required
                                    autoFocus
                                    className="mt-1 block w-full"
                                />
                                <InputError message={profileErrors.name} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData('email', e.target.value)}
                                    required
                                    className="mt-1 block w-full"
                                />
                                <InputError message={profileErrors.email} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processingProfile}>
                                    {processingProfile ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Update Password</CardTitle>
                        <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
                        {recentlySuccessfulPassword && <p className="text-sm text-green-600 dark:text-green-400">Password Updated.</p>}
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submitPassword} className="space-y-4">
                            <div>
                                <Label htmlFor="current_password">Current Password</Label>
                                <Input
                                    id="current_password"
                                    type="password"
                                    value={passwordData.current_password}
                                    onChange={(e) => setPasswordData('current_password', e.target.value)}
                                    autoComplete="current-password"
                                    className="mt-1 block w-full"
                                />
                                <InputError message={passwordErrors.current_password} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="password">New Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={passwordData.password}
                                    onChange={(e) => setPasswordData('password', e.target.value)}
                                    autoComplete="new-password"
                                    className="mt-1 block w-full"
                                />
                                <InputError message={passwordErrors.password} className="mt-2" />
                            </div>

                            <div>
                                <Label htmlFor="password_confirmation">Confirm Password</Label>
                                <Input
                                    id="password_confirmation"
                                    type="password"
                                    value={passwordData.password_confirmation}
                                    onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                    autoComplete="new-password"
                                    className="mt-1 block w-full"
                                />
                                <InputError message={passwordErrors.password_confirmation} className="mt-2" />
                            </div>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processingPassword}>
                                    {processingPassword ? 'Saving...' : 'Save Password'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 