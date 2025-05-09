import React from 'react';
import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

interface InputErrorProps {
    message?: string;
    className?: string;
}

export default function InputError({ message, className = '' }: InputErrorProps) {
    if (!message) return null;
    return <div className={`text-red-500 text-xs mt-1 ${className}`}>{message}</div>;
}
