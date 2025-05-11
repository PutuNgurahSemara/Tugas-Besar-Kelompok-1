import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, AtSign, Key, Heart, Pill, Stethoscope, ClipboardList, Bookmark, Archive, Package, DollarSign, Users } from 'lucide-react'; // Removed User, Lock as they are not directly used here after changes
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
import { BackgroundGradient } from '@/components/ui/background-gradient';

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
    // const [loaded, setLoaded] = useState(false); // Not strictly necessary if animations are handled by framer-motion initial/animate
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    // useEffect(() => {
    //     setLoaded(true);
    // }, []);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    // InfoPanel for the left side of the two-panel layout
    const InfoPanel = () => (
        <div className="flex flex-col justify-center h-full text-center lg:text-left">
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
                className="mb-8"
            >
                <div className="inline-block p-3 bg-white/20 rounded-lg backdrop-blur-sm mb-6">
                    <Pill size={48} className="text-white" />
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">
                    Selamat Datang di <span className="text-emerald-300">PharmaSys</span>
                </h1>
                <p className="text-lg lg:text-xl text-gray-200 mb-6">
                    Solusi Manajemen Apotek Terintegrasi untuk Efisiensi dan Pertumbuhan Bisnis Anda.
                </p>
            </motion.div>
            
            <motion.ul 
                className="space-y-4 text-base lg:text-lg"
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.2, delayChildren: 0.8 } }
                }}
            >
                {[
                    { icon: Package, text: "Manajemen Inventaris Cerdas" },
                    { icon: DollarSign, text: "Transaksi Penjualan Cepat & Akurat" },
                    { icon: ClipboardList, text: "Laporan Analitik Mendalam" },
                    { icon: Users, text: "Pengelolaan Pengguna & Hak Akses" },
                ].map((item, idx) => (
                    <motion.li 
                        key={idx} 
                        className="flex items-center"
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" }}
                        }}
                    >
                        <item.icon className="h-6 w-6 mr-3 text-emerald-300 shrink-0" />
                        <span>{item.text}</span>
                    </motion.li>
                ))}
            </motion.ul>
        </div>
    );

    return (
        <AuthLayout infoPanelContent={<InfoPanel />}>
            <Head title={t('login')} />
            
            {/* This single div is the root child for AuthLayout's main content area (right panel) */}
            <div className="w-full h-full flex flex-col items-center justify-center">
                
                {/* Logo and application title - centered above the form card */}
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

                <BackgroundGradient
                    containerClassName="rounded-[22px] w-full" 
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-100 dark:border-gray-700" 
                    gradientColors={["#10B981", "#34D399", "#059669"]} 
                >
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
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
                                    className="mt-4 w-full transform rounded-md bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition duration-200 ease-in-out hover:from-emerald-400 hover:to-green-500 active:scale-95 disabled:opacity-50 dark:from-emerald-600 dark:to-green-700 dark:hover:from-emerald-500 dark:hover:to-green-600"
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
                </BackgroundGradient>
            </div>
        </AuthLayout>
    );
}
