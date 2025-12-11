import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold uppercase tracking-wide disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none brutal-button",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary active:bg-primary",
        destructive:
          "bg-destructive text-white hover:bg-destructive active:bg-destructive",
        outline:
          "bg-background border-3 border-foreground hover:bg-accent active:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary active:bg-secondary",
        ghost:
          "border-0 shadow-none hover:bg-accent active:bg-accent hover:translate-x-0 hover:translate-y-0 active:translate-x-0 active:translate-y-0",
        link: "text-primary underline-offset-4 hover:underline border-0 shadow-none",
      },
      size: {
        default: "h-10 px-6 py-2 has-[>svg]:px-4",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3 text-xs",
        lg: "h-12 px-8 has-[>svg]:px-6 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
