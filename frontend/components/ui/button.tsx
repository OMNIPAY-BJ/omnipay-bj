import { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

type ButtonProps = {
  href?: string;
  className?: string;
  children?: React.ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button(props: ButtonProps) {
  const { href, className, children, ...rest } = props;
  const baseClassName = `rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-slate-900 hover:bg-emerald-400 ${className ?? ''}`;

  if (href) {
    return (
      <a href={href} className={baseClassName}>
        {children}
      </a>
    );
  }

  return (
    <button
      {...rest}
      className={baseClassName}
    >
      {children}
    </button>
  );
}
