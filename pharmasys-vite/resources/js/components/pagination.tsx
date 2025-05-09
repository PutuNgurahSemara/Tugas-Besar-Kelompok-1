import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { type PaginationLink, type PaginationMeta } from '@/types'; // Pastikan tipe ini ada

interface PaginationProps {
    links: PaginationLink[];
    meta: PaginationMeta;
    className?: string;
}

export function Pagination({ links, meta, className }: PaginationProps) {
    // Log props yang diterima oleh komponen Pagination
    console.log('Pagination Component Received Meta:', meta);
    console.log('Pagination Component Received Links:', links);

    // Jika links tidak ada atau kurang dari 3 (prev, next), atau meta tidak valid, jangan tampilkan
    if (!links || links.length <= 3 || !meta) {
        return null;
    }

    // Pastikan properties meta ada dan valid
    const from = meta.from || 0;
    const to = meta.to || 0;
    const total = meta.total || 0;

    return (
        <nav className={cn('flex items-center justify-between', className)}>
            <div className="text-sm text-muted-foreground">
                Showing {from} to {to} of {total} results
            </div>
            <div className="flex items-center space-x-1">
                {links.map((link, index) => {
                    if (!link.url) {
                        return (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                disabled
                                className="opacity-50 cursor-not-allowed"
                            />
                        );
                    }
                    return (
                        <Link key={index} href={link.url}>
                            <Button
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={cn(link.active && 'font-bold')}
                            />
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
} 