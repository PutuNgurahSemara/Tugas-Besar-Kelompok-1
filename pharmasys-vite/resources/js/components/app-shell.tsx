import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const appShellVariants = cva("flex min-h-screen", {
  variants: {
    variant: {
      default: "flex-col",
      sidebar: "flex-row",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface AppShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof appShellVariants> {}

const AppShell = React.forwardRef<HTMLDivElement, AppShellProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(appShellVariants({ variant, className }))}
        {...props}
      />
    );
  }
);
AppShell.displayName = "AppShell";

export { AppShell };