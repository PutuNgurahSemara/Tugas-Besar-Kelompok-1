import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, User, Lock, AtSign, Key, Heart, Pill, Stethoscope, ClipboardList, Bookmark, Archive } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from '@/hooks/use-translation';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t } = useTranslation();
    const [loaded, setLoaded] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    // Animasi loading halaman
    useEffect(() => {
        setLoaded(true);
    }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // Array ikon farmasi yang akan dianimasi
    const pharmacyIcons = [
        { icon: Pill, color: 'text-green-500', delay: 0.2, top: '10%', left: '15%' },
        { icon: Bookmark, color: 'text-blue-500', delay: 0.4, top: '25%', left: '85%' },
        { icon: ClipboardList, color: 'text-amber-500', delay: 0.6, top: '85%', left: '25%' },
        { icon: Stethoscope, color: 'text-purple-500', delay: 0.8, top: '70%', left: '80%' },
        { icon: Heart, color: 'text-red-500', delay: 1.0, top: '5%', left: '70%' },
    ];

    return (
        <AuthLayout title={t('login')} description={t('login.credentials')}>
            <Head title={t('login')} />

            {/* Background dengan gradient dan animasi ikon farmasi */}
            <div className="fixed inset-0 -z-10 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-950 dark:to-gray-900 overflow-hidden">
                {pharmacyIcons.map((icon, index) => (
                    <motion.div
                        key={index}
                        className={`absolute ${icon.color} opacity-10 dark:opacity-20`}
                        style={{
                            top: icon.top,
                            left: icon.left,
                        }}
                        initial={{ scale: 0, rotate: -30, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 0.1 }}
                        transition={{
                            delay: icon.delay,
                            duration: 1,
                            ease: "easeOut",
                        }}
                    >
                        <icon.icon size={100} />
                    </motion.div>
                ))}
            </div>

            {/* Logo dan judul aplikasi */}
            <motion.div 
                className="flex flex-col items-center justify-center mb-8"
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg mb-4">
                    <span className="font-bold text-xl text-white">PMS</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-700">
                    PharmaSys
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-6"
            >
                <form className="flex flex-col gap-5" onSubmit={submit}>
                    <div className="grid gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {t('email')}
                            </Label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <AtSign className="h-4 w-4 text-gray-400" />
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="admin@pharmasys.com"
                                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm transition duration-150 ease-in-out focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-emerald-500"
                                />
                            </div>
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div className="grid gap-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('password')}
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={route('password.request')}
                                        className="text-sm font-medium text-emerald-600 transition duration-150 ease-in-out hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
                                        tabIndex={5}
                                    >
                                        {t('forgot.password')}
                                    </TextLink>
                                )}
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                    <Key className="h-4 w-4 text-gray-400" />
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="········"
                                    className="pl-10 block w-full rounded-md border-gray-300 shadow-sm transition duration-150 ease-in-out focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-emerald-500"
                                />
                            </div>
                            <InputError message={errors.password} className="mt-1" />
                        </div>

                        <div className="flex items-center space-x-2 mt-1">
                            <Checkbox
                                id="remember"
                                name="remember"
                                checked={data.remember}
                                onClick={() => setData('remember', !data.remember)}
                                tabIndex={3}
                                className="rounded border-gray-300 text-emerald-600 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:checked:bg-emerald-500 dark:focus:border-emerald-500 dark:focus:ring-emerald-500"
                            />
                            <Label htmlFor="remember" className="text-sm text-gray-600 dark:text-gray-400">
                                {t('remember.me')}
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full transform rounded-md bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition duration-200 ease-in-out hover:opacity-90 active:scale-95 disabled:opacity-50 dark:from-emerald-600 dark:to-green-700"
                            tabIndex={4}
                            disabled={processing}
                        >
                            {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {t('login')}
                        </Button>
                    </div>

                    <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        {t('no.account')}{' '}
                        <TextLink
                            href={route('register')}
                            tabIndex={6}
                            className="font-medium text-emerald-600 transition duration-150 ease-in-out hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200"
                        >
                            {t('contact.admin')}
                        </TextLink>
                    </div>

                    <div className="mt-6 border-t pt-4 dark:border-gray-700">
                        <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">{t('demo.credentials')}</p>
                        <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">Admin: admin@pharmasys.com / password</p>
                        <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">Kasir: cashier@pharmasys.com / password</p>
                    </div>
                </form>

                {status && <div className="mt-6 text-center text-sm font-medium text-green-600 dark:text-green-400">{status}</div>}
            </motion.div>
        </AuthLayout>
    );
}