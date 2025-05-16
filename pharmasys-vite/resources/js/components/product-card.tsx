"use client";
import React from "react";
import { cn } from "@/lib/utils";
import { CardContainer, CardBody, CardItem } from "./ui/3d-card"; // useMouseEnter is not needed here directly
import { BackgroundGradient } from "./ui/background-gradient";
import { Package, CalendarDays, DollarSign, AlertTriangle, Tag, Layers } from "lucide-react";
import { Badge } from "./ui/badge";
import { router } from '@inertiajs/react';

export interface ProductCardData {
  id: number;
  nama_produk: string;
  nama_supplier?: string;
  stok_tersedia: number;
  harga_beli: number;
  harga_jual: number;
  tanggal_kadaluarsa?: string;
  kategori?: string;
  is_listed_as_product?: boolean;
  image?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

export const ProductCard = ({ product, className }: ProductCardProps) => {
  const isOutOfStock = product.stok_tersedia === 0;
  const isLowStock = product.stok_tersedia > 0 && product.stok_tersedia < 10;
  let isExpiringSoon = false;
  let formattedExpiryDate: string | null = null;

  if (product.tanggal_kadaluarsa) {
    const expiryDateObj = new Date(product.tanggal_kadaluarsa);
    if (!isNaN(expiryDateObj.getTime())) {
      isExpiringSoon = expiryDateObj < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      formattedExpiryDate = expiryDateObj.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  }

  const cardInnerContent = (
    <>
      <CardItem translateZ={20} className="flex items-start justify-between w-full">
        {product.image ? (
          <img 
            src={`/storage/produk_images/${product.image}`} 
            alt={product.nama_produk}
            className="w-16 h-16 object-cover rounded-lg"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              // Coba beberapa path alternatif
              const alternativePaths = [
                `/storage/${product.image}`,
                `/storage/app/public/${product.image}`,
                `/storage/app/public/produk_images/${product.image}`,
                `/images/${product.image}`
              ];
              
              const tryNextPath = (index: number) => {
                if (index < alternativePaths.length) {
                  img.src = alternativePaths[index];
                  img.onerror = () => tryNextPath(index + 1);
                } else {
                  img.src = '/images/placeholder-product-custom.svg';
                }
              };
              
              tryNextPath(0);
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700/50 flex items-center justify-center">
            <img 
              src="/images/placeholder-product-custom.svg"
              alt="Placeholder Product"
              className="w-12 h-12 object-contain"
            />
          </div>
        )}
        <div className="flex flex-col items-end space-y-1">
          {product.is_listed_as_product ? (
             <Badge variant="default" className="text-xs bg-green-100 text-green-700 border-green-300 dark:bg-green-700/30 dark:text-green-300 dark:border-green-600">
                Terdaftar
             </Badge>
          ) : (
             <Badge variant="outline" className="text-xs bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-700/30 dark:text-gray-300 dark:border-gray-600">
                Belum Terdaftar
             </Badge>
          )}
          {product.kategori && (
            <Badge variant="outline" className={cn(
              "text-xs",
              product.is_listed_as_product 
                ? "border-green-400 text-green-700 dark:border-green-500 dark:text-green-300" 
                : "border-emerald-500 text-emerald-600 dark:border-emerald-400 dark:text-emerald-300"
            )}>
              <Layers size={12} className="mr-1" /> {product.kategori}
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="text-xs bg-red-600 text-white border-red-700">
              <AlertTriangle size={12} className="mr-1" /> Habis
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="default" className="text-xs bg-yellow-400 text-yellow-800 border-yellow-500">
              <AlertTriangle size={12} className="mr-1" /> Stok Rendah
            </Badge>
          )}
        </div>
      </CardItem>

      <CardItem translateZ={30} className="w-full mt-3">
        <h3 className="font-semibold text-lg text-gray-800 dark:text-white balance group-hover/card:text-emerald-500 transition-colors">
          {product.nama_produk}
        </h3>
        {product.nama_supplier && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Supplier: {product.nama_supplier}
          </p>
        )}
      </CardItem>
      
      <div className="space-y-1.5 text-sm mt-3 flex-grow flex flex-col justify-end">
        <CardItem translateZ={25} className="w-full">
          <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
            <span className="flex items-center"><Layers size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" /> Stok:</span>
            <span className={cn(
                "font-medium", 
                isOutOfStock ? "text-red-500 dark:text-red-400" : 
                isLowStock ? "text-yellow-500 dark:text-yellow-400" : "text-gray-900 dark:text-white"
            )}>
              {product.stok_tersedia}
            </span>
          </div>
        </CardItem>
        <CardItem translateZ={25} className="w-full">
          <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
            <span className="flex items-center"><DollarSign size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" /> Harga Beli:</span>
            <span className="font-medium text-gray-900 dark:text-white">Rp {product.harga_beli.toLocaleString('id-ID')}</span>
          </div>
        </CardItem>
        <CardItem translateZ={25} className="w-full">
          <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
            <span className="flex items-center"><Tag size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" /> Harga Jual:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {product.harga_jual > 0 ? `Rp ${product.harga_jual.toLocaleString('id-ID')}` : "N/A (Gudang)"}
            </span>
          </div>
        </CardItem>
        {formattedExpiryDate && (
          <CardItem translateZ={25} className="w-full">
            <div className="flex items-center justify-between text-gray-700 dark:text-gray-300">
              <span className="flex items-center"><CalendarDays size={14} className="mr-1.5 text-gray-400 dark:text-gray-500" /> Kadaluarsa:</span>
              <span className={cn("font-medium", isExpiringSoon ? "text-orange-500 dark:text-orange-400" : "text-gray-900 dark:text-white")}>
                {formattedExpiryDate}
              </span>
            </div>
          </CardItem>
        )}
      </div>
    </>
  );
  
  const handleCardClick = () => {
    if (!product.is_listed_as_product) {
      const queryParams: Record<string, string | number | undefined> = {
        nama: product.nama_produk,
        harga_beli: product.harga_beli,
      };
      Object.keys(queryParams).forEach(key => queryParams[key] === undefined && delete queryParams[key]);
      router.visit(route('produk.create', queryParams));
    }
  };

  const cardWrapperClassName = cn(
    "list-none h-full",
    !product.is_listed_as_product && "cursor-pointer",
    className
  );
  
  const cardBodyBaseClasses = "w-full h-full rounded-xl p-4 border flex flex-col";

  return (
    <li className={cardWrapperClassName} onClick={handleCardClick}> 
      <CardContainer 
        containerClassName="w-full h-full group" // Added 'group' here for BackgroundGradient's internal group-hover
        className={cn(
            "relative", 
            !product.is_listed_as_product && "bg-gray-50 dark:bg-black dark:border-white/[0.2] border-black/[0.1]"
        )}
      >
        {product.is_listed_as_product ? (
          <BackgroundGradient 
            className={cn(cardBodyBaseClasses, "bg-white dark:bg-gray-900 border-transparent dark:border-white/[0.1]")}
            roundedClassName="rounded-xl" 
            gradientColors={["#10B981", "#34D399", "#059669"]}
            animate={true} // Keep animate true; BackgroundGradient now handles hover internally
          >
            {cardInnerContent}
          </BackgroundGradient>
        ) : (
          <CardBody className={cn(cardBodyBaseClasses, "bg-gray-50 dark:bg-black dark:border-white/[0.2] border-black/[0.1] relative group/card dark:hover:shadow-2xl dark:hover:shadow-emerald-500/[0.1]")}>
            {cardInnerContent}
          </CardBody>
        )}
      </CardContainer>
    </li>
  );
};
