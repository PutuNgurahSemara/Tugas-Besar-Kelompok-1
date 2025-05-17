import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, AtSign, Key, Heart, Pill, Stethoscope, ClipboardList, Bookmark, Archive, Package, DollarSign, Users, CheckCircle2, BarChart4, Bell, ShieldCheck } from 'lucide-react';
import { FormEventHandler, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';
import { useTranslation } from '@/hooks/use-translation';
import { BackgroundGradient } from '@/components/ui/background-gradient';
import { cn } from '@/lib/utils';
import { Spotlight } from '@/components/ui/spotlight';
import { CardSpotlight } from '@/components/ui/card-spotlight';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

// Feature showcase with animation
const FeatureShowcase = () => {
    const features = [
        {
            icon: Package,
            title: "Smart Inventory",
            description: "Pantau stok secara real-time dengan sistem prediksi kebutuhan obat",
            color: "from-emerald-500 to-green-400",
            highlight: "Hemat 40% waktu pengelolaan stok"
        },
        {
            icon: DollarSign,
            title: "Express Checkout",
            description: "Proses transaksi dalam hitungan detik dengan scanner terintegrasi",
            color: "from-cyan-500 to-blue-400",
            highlight: "Tingkatkan kepuasan pelanggan"
        },
        {
            icon: BarChart4,
            title: "Business Intelligence",
            description: "Analisis tren penjualan dan prediksi pendapatan dengan AI",
            color: "from-purple-500 to-indigo-400",
            highlight: "Visualisasi data interaktif"
        },
        {
            icon: Bell,
            title: "Smart Alerts",
            description: "Notifikasi cerdas untuk stok kritis dan obat mendekati kadaluarsa",
            color: "from-amber-500 to-orange-400",
            highlight: "Kurangi kerugian hingga 25%"
        },
        {
            icon: Users,
            title: "Customer Management",
            description: "Kelola data pelanggan dan riwayat pembelian untuk layanan personal",
            color: "from-pink-500 to-rose-400",
            highlight: "Tingkatkan loyalitas pelanggan"
        }
    ];
    
    const [currentFeature, setCurrentFeature] = useState(0);
    
    useEffect(() => {
        // Atur interval untuk rotasi fitur tanpa animasi yang kompleks
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % features.length);
        }, 5000);
        
        return () => clearInterval(interval);
    }, []);
    
    const feature = features[currentFeature];
    const Icon = feature.icon;
    
    return (
        <div className="h-[220px] flex items-center justify-center bg-emerald-900/30 rounded-lg border border-emerald-500/20 w-full">
            <motion.div 
                key={currentFeature}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center p-4 w-full"
            >
                <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br border border-white/10 shadow-lg flex items-center justify-center mb-4 p-3 bg-opacity-20 backdrop-blur-sm" 
                    style={{ backgroundImage: `linear-gradient(to bottom right, ${feature.color.split(' ')[0].replace('from-', '')}, ${feature.color.split(' ')[1].replace('to-', '')})` }}>
                    <Icon className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm max-w-xs mx-auto">{feature.description}</p>
                
                <div className="mt-3 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full inline-block border border-white/5">
                    <p className="text-xs font-medium text-emerald-300">{feature.highlight}</p>
                </div>
                
                <div className="flex justify-center mt-6 space-x-1">
                    {features.map((_, idx) => (
                        <div 
                            key={idx} 
                            className={`w-2 h-2 rounded-full ${idx === currentFeature ? 'bg-emerald-400' : 'bg-white/20'}`}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
};

export default function Login({ status, canResetPassword }: LoginProps) {
    const { t } = useTranslation();
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-950 to-black relative overflow-hidden">
            <Head title="Login" />
            
            {/* Background grid pattern */}
            <div
                className={cn(
                    "pointer-events-none absolute inset-0 [background-size:40px_40px] select-none",
                    "[background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)]",
                )}
            />
            
            {/* Light effect elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] -z-10"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/5 rounded-full blur-[80px] -z-10"></div>
            
            {/* Spotlight effect */}
            <Spotlight
                className="-top-40 left-0 md:-top-20 md:left-60"
                fill="#10b981"
            />
            
            {/* Glass card container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-5xl relative z-10"
            >
                <CardSpotlight className="flex flex-col md:flex-row overflow-hidden rounded-[20px] h-full w-full">
                    {/* Card spotlight effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-emerald-500/5"></div>
                    
                    {/* Login side */}
                    <div className="p-8 relative w-full md:w-1/2">
                        <div className="absolute inset-0 pointer-events-none border-r border-emerald-500/10 md:block hidden"></div>
                    {/* Logo and title */}
                    <motion.div 
                        className="flex justify-center mb-6 relative z-10"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-lg">
                            <img src="/assets/images/logo.png" alt="PharmaSys Logo" className="h-20 w-20 object-contain" />
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="relative z-10"
                    >
                        <h2 className="text-3xl font-bold text-center bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent mb-2">PharmaSys</h2>
                        <p className="text-center text-gray-300 mb-6">Solusi Terdepan untuk Apotek Modern</p>
                    </motion.div>
                    
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="relative z-10"
                    >
                        <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-200">
                                    {t('email')}
                                </Label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <AtSign className="h-5 w-5 text-gray-400" />
                                    </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            required
                                            autoFocus
                                            autoComplete="username"
                                            tabIndex={1}
                                            placeholder="email@example.com"
                                            className="pl-10 block w-full rounded-md border border-emerald-500/20 bg-black/30 py-2 px-3 text-sm text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
                                        />
                                </div>
                                <InputError message={errors.email} className="mt-1" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-200">
                                        {t('password')}
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={route('password.request')}
                                            tabIndex={5}
                                            className="text-xs font-medium text-emerald-300 transition duration-150 ease-in-out hover:text-emerald-200"
                                        >
                                            {t('forgot.password')}
                                        </TextLink>
                                    )}
                                </div>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <Key className="h-5 w-5 text-gray-400" />
                                    </div>
                                        <Input
                                            id="password"
                                            type="password"
                                            name="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            required
                                            autoComplete="current-password"
                                            tabIndex={2}
                                            placeholder="········"
                                            className="pl-10 block w-full rounded-md border border-emerald-500/20 bg-black/30 py-2 px-3 text-sm text-white placeholder:text-gray-400 focus:border-emerald-500 focus:ring focus:ring-emerald-500 focus:ring-opacity-50 transition-all duration-200"
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
                                    className="rounded border-gray-500 text-emerald-500 shadow-sm focus:border-emerald-300 focus:ring focus:ring-emerald-200 focus:ring-opacity-50 bg-white/10"
                                />
                                <Label htmlFor="remember" className="text-sm text-gray-300">
                                    {t('remember.me')}
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                className={cn(
                                    "mt-4 w-full transform rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md",
                                    "transition-all duration-300 ease-out hover:bg-emerald-400 active:scale-95 disabled:opacity-50",
                                    "relative overflow-hidden group"
                                )}
                                tabIndex={4}
                                disabled={processing}
                            >
                                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-400 to-green-500 opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                                <span className="absolute inset-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB4PSIwIiB5PSIwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiIGZpbGw9IiNmZmZmZmYxMCIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3QgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNwYXR0ZXJuKSIgb3BhY2l0eT0iMC4xIi8+PC9zdmc+')]  opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
                                <span className="relative flex items-center justify-center">
                                    {processing && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                                    {t('login')}
                                </span>
                            </Button>
                        </div> 

                        <div className="mt-4 text-center text-sm text-gray-300">
                            {t('no.account')}{' '}
                            <TextLink
                                href={route('register')}
                                tabIndex={6}
                                className="font-medium text-emerald-300 transition duration-150 ease-in-out hover:text-emerald-200"
                            >
                                {t('contact.admin')}
                            </TextLink>
                        </div>

                        </form>
                        {status && <div className="mt-6 text-center text-sm font-medium text-emerald-300">{status}</div>}
                    </motion.div>
                    </div>
                    
                    {/* Features side */}
                    <div className="p-8 relative bg-gradient-to-br from-emerald-950/50 to-black/50 w-full md:w-1/2 flex flex-col">
                        <div className="flex items-center gap-3 mb-6 relative z-20">
                            <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center border border-gray-200 shadow-lg">
                                <img src="/assets/images/logo.png" alt="PharmaSys Logo" className="h-7 w-7 object-contain" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white bg-gradient-to-b from-white to-emerald-200 bg-clip-text text-transparent">
                                    PharmaSys
                                </h3>
                                <p className="text-gray-300 text-sm">Solusi Apotek Modern</p>
                            </div>
                        </div>
                        
                        <div className="text-center mt-2 mb-6">
                            <h4 className="text-lg font-medium text-emerald-300 mb-1">Selamat Datang</h4>
                            <p className="text-gray-300 text-sm">Tingkatkan efisiensi dan pertumbuhan bisnis apotek Anda dengan sistem terintegrasi kami</p>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center items-center relative z-20 w-full">
                            <FeatureShowcase />                            
                        </div>
                    </div>
                </CardSpotlight>
            </motion.div>
        </div>
    );
}
