// Branded button/link styling via cva (SPEC §3, §8.5). Variants map to
// TpGroup DS button intents using design tokens only. Every interactive
// instance meets the 44x44 CSS px target-size minimum (WCAG 2.2 §2.5.8).
import { cva, type VariantProps } from 'class-variance-authority';
import type { ButtonHTMLAttributes } from 'react';

export const buttonVariants = cva(
  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-5 py-2.5 text-base font-medium transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-brand-primary text-white hover:bg-brand-primary/90',
        secondary: 'bg-brand-secondary text-white hover:bg-brand-secondary/90',
        outline: 'border border-border bg-bg text-text hover:bg-surface',
        ghost: 'bg-transparent text-brand-accent hover:bg-surface',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', block: false },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({ variant, block, className, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={buttonVariants({ variant, block, className })}
      {...rest}
    />
  );
}
