import { type HTMLAttributes } from 'react';

// Interface untuk props, termasuk className opsional
interface InputErrorProps extends HTMLAttributes<HTMLParagraphElement> {
    message?: string;
}

export default function InputError({ message, className = '', ...props }: InputErrorProps) {
    // Jangan render apa pun jika tidak ada pesan error
    if (!message) {
        return null;
    }

    return (
        // Render pesan error dalam tag <p>
        <p {...props} className={`text-sm text-red-600 dark:text-red-400 ${className}`}>
            {message}
        </p>
    );
} 