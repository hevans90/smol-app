import { Fragment, useState } from 'react';

import { Switch } from '@headlessui/react';
import { cva } from 'class-variance-authority';

import { twMerge } from 'tailwind-merge';

const switchVariants = cva(
  'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-100 ease-in-out focus:outline-none',
  {
    variants: {
      enabled: {
        true: 'bg-primary-900 hover:bg-primary-800',
        false: 'bg-gray-700 hover:bg-gray-500',
      },
      size: {
        sm: 'h-4 w-7',
        md: 'h-6 w-11',
        lg: 'h-8 w-14',
      },
    },
  },
);

const switchSpanVariants = cva(
  'pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-100 ease-in-out',
  {
    variants: {
      enabled: {
        true: '',
        false: '',
      },
      size: {
        sm: 'h-3 w-3',
        md: 'h-5 w-5',
        lg: 'h-7 w-7',
      },
    },
    compoundVariants: [
      {
        enabled: true,
        size: 'sm',
        class: 'translate-x-3',
      },
      {
        enabled: false,
        size: 'sm',
        class: 'translate-x-0',
      },
      {
        enabled: true,
        size: 'md',
        class: 'translate-x-5',
      },
      {
        enabled: false,
        size: 'md',
        class: 'translate-x-0',
      },
      {
        enabled: true,
        size: 'lg',
        class: 'translate-x-6',
      },
      {
        enabled: false,
        size: 'lg',
        class: 'translate-x-0',
      },
    ],
  },
);

function Toggle({
  label,
  name,
  onChange,
  value = false,
  size = 'md',
  autoHide = true,
}: {
  label?: string;
  name?: string;
  onChange?: () => void;
  value?: boolean;
  size?: 'sm' | 'md' | 'lg';
  autoHide?: boolean;
}) {
  const [enabled, setEnabled] = useState(value);

  return (
    <Switch.Group as={Fragment}>
      <div className="flex items-center">
        <>
          {label && (
            <Switch.Label
              className={twMerge(
                'mr-2 text-md leading-4 text-grey-700 lg:block',
                autoHide && 'hidden',
              )}
            >
              {label}
            </Switch.Label>
          )}
        </>
        <Switch
          checked={value}
          name={name}
          onChange={() => {
            setEnabled(!enabled);
            if (onChange) {
              onChange();
            }
          }}
          className={switchVariants({ enabled, size })}
        >
          <span
            aria-hidden="true"
            className={switchSpanVariants({ enabled, size })}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
}

export { Toggle };
