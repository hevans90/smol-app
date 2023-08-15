import {
  ForwardedRef,
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import { twMerge } from 'tailwind-merge';
import { Spinner } from './Spinner';

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'prefix'
> & { children?: ReactNode; loading?: boolean };

export const Button = forwardRef(function Button(
  { children, className, loading, ...rest }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return (
    <button
      {...rest}
      className={twMerge(
        'justify-center leading-3 p-2 border-primary-800 rounded-md border-[1px] hover:border-primary-500 hover:text-primary-500 outline-none ',
        className
      )}
      ref={ref}
    >
      {children}
      {loading ? <Spinner width={20} /> : null}
    </button>
  );
});
