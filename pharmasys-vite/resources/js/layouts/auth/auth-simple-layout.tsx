import { Link } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';
import { Pill } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

interface AuthLayoutProps {
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children }: PropsWithChildren<AuthLayoutProps>) {
    return (
        <div className="relative flex min-h-svh items-center justify-center bg-emerald-50 p-4 dark:bg-gray-900 sm:p-6 md:p-10">
            <div className="absolute right-4 top-4 md:right-6 md:top-6">
                <ThemeToggle />
            </div>

            <div className="flex w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-gray-800">
                <div className="hidden w-1/2 flex-col items-center justify-center bg-gradient-to-br from-emerald-500 to-green-600 p-12 text-white dark:from-emerald-600 dark:to-green-700 md:flex">
                    <img src="/assets/images/logo.png" alt="PharmaSys Logo" className="h-24 w-24 object-contain" />
                    <h1 className="mt-6 text-center text-3xl font-bold">PharmaSys</h1>
                    <p className="mt-2 text-center text-emerald-100">Solusi Lengkap Manajemen Apotek</p>
                </div>

                <div className="w-full p-8 md:w-1/2 md:p-12">
                    <div className="mb-8 flex flex-col items-center">
                        <Link href="/" className="mb-4 md:hidden">
                            <img src="/assets/images/logo.png" alt="PharmaSys Logo" className="h-10 w-10 object-contain" />
                        </Link>
                        <h2 className="text-center text-2xl font-bold text-gray-800 dark:text-white">Selamat Datang Kembali</h2>
                        <p className="mt-1 text-center text-sm text-gray-600 dark:text-gray-400">Masuk ke akun Anda untuk melanjutkan</p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
