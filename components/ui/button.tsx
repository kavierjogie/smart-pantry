'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-[background-color,border-color,color,box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none',
  {
    variants: {
      variant: {
        default: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:bg-emerald-800 disabled:!bg-slate-200 disabled:!text-slate-500',
        destructive: 'bg-red-500 text-white shadow-sm hover:bg-red-600 active:bg-red-700 disabled:!bg-red-100 disabled:!text-red-400',
        outline: 'border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground active:bg-slate-200 disabled:!border-slate-200 disabled:!bg-slate-100 disabled:!text-slate-400',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/60 disabled:!bg-slate-100 disabled:!text-slate-400',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-slate-200 disabled:!text-slate-400',
        link: 'text-emerald-600 underline-offset-4 hover:underline active:text-emerald-800 disabled:!text-slate-400',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
