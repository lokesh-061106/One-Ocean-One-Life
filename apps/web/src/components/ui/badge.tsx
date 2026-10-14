import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ocean-blue focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-ocean-blue text-white",
        secondary:
          "border-transparent bg-ocean-light text-ocean-blue",
        destructive:
          "border-transparent bg-ocean-danger text-white",
        outline: "text-ocean-text",
        success:
          "border-transparent bg-ocean-green text-white",
        warning:
          "border-transparent bg-ocean-warning text-white",
        coral:
          "border-transparent bg-ocean-coral text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
