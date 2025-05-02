import * as React from "react";
import { Transition } from "@headlessui/react";
import { X, CheckCircle, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  title: string;
  description?: string;
  duration?: number;
  variant?: "success" | "error" | "warning" | "info";
};

export function Toast({
  open,
  setOpen,
  title,
  description,
  duration = 3000,
  variant = "info"
}: ToastProps) {
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        setOpen(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, setOpen]);

  // Menentukan icon dan warna berdasarkan variant
  const getVariantDetails = () => {
    switch (variant) {
      case "success":
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: "bg-green-50 dark:bg-green-900/30",
          borderColor: "border-green-400 dark:border-green-800",
          textColor: "text-green-800 dark:text-green-200",
          iconColor: "text-green-500 dark:text-green-400"
        };
      case "error":
        return {
          icon: <XCircle className="h-5 w-5" />,
          bgColor: "bg-red-50 dark:bg-red-900/30",
          borderColor: "border-red-400 dark:border-red-800",
          textColor: "text-red-800 dark:text-red-200",
          iconColor: "text-red-500 dark:text-red-400"
        };
      case "warning":
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: "bg-amber-50 dark:bg-amber-900/30",
          borderColor: "border-amber-400 dark:border-amber-800",
          textColor: "text-amber-800 dark:text-amber-200",
          iconColor: "text-amber-500 dark:text-amber-400"
        };
      case "info":
      default:
        return {
          icon: <Info className="h-5 w-5" />,
          bgColor: "bg-blue-50 dark:bg-blue-900/30",
          borderColor: "border-blue-400 dark:border-blue-800",
          textColor: "text-blue-800 dark:text-blue-200",
          iconColor: "text-blue-500 dark:text-blue-400"
        };
    }
  };

  const { icon, bgColor, borderColor, textColor, iconColor } = getVariantDetails();

  return (
    <div
      aria-live="assertive"
      className="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
    >
      <div className="flex w-full flex-col items-center space-y-4 sm:items-end">
        <Transition
          show={open}
          as={React.Fragment}
          enter="transform ease-out duration-300 transition"
          enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
          enterTo="translate-y-0 opacity-100 sm:translate-x-0"
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className={cn(
              "pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg border shadow-lg",
              bgColor,
              borderColor
            )}
          >
            <div className="p-4">
              <div className="flex items-start">
                <div className={cn("flex-shrink-0", iconColor)}>
                  {icon}
                </div>
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className={cn("text-sm font-medium", textColor)}>{title}</p>
                  {description && (
                    <p className={cn("mt-1 text-sm opacity-90", textColor)}>
                      {description}
                    </p>
                  )}
                </div>
                <div className="ml-4 flex flex-shrink-0">
                  <button
                    type="button"
                    className={cn(
                      "inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                      textColor,
                      "focus:ring-opacity-50 hover:opacity-75"
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  );
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<{
    id: string;
    title: string;
    description?: string;
    variant: "success" | "error" | "warning" | "info";
    duration?: number;
  }[]>([]);

  // Fungsi untuk menampilkan toast baru
  const showToast = React.useCallback(
    (
      title: string,
      description?: string,
      variant: "success" | "error" | "warning" | "info" = "info",
      duration = 3000
    ) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    []
  );

  // Buat versi global untuk showToast
  React.useEffect(() => {
    // @ts-ignore
    window.showToast = showToast;
    
    return () => {
      // @ts-ignore
      delete window.showToast;
    };
  }, [showToast]);

  return (
    <>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          open={true}
          setOpen={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          duration={toast.duration}
        />
      ))}
    </>
  );
}

// Helper functions
export function useToast() {
  const showToast = React.useCallback(
    (
      title: string,
      description?: string,
      variant: "success" | "error" | "warning" | "info" = "info",
      duration = 3000
    ) => {
      // @ts-ignore
      if (typeof window !== "undefined" && window.showToast) {
        // @ts-ignore
        window.showToast(title, description, variant, duration);
      }
    },
    []
  );

  return { showToast };
} 