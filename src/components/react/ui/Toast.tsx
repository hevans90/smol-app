import { IconX } from '@tabler/icons-react';
import type { ReactNode } from 'react';

export function Toast({
  children,
  onClose,
  icon,
}: {
  children: ReactNode | string;
  onClose: () => void;
  icon?: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between space-x-2 rounded border border-primary-800 bg-gray-800 p-2 shadow-md"
      data-test="toast-notification"
    >
      {icon}
      <div className="text-md leading-4 text-primary-500 [grid-area:_title]">
        {children}
      </div>
      <button
        aria-label="Close"
        data-test="close-button"
        onClick={onClose}
        className="text-grey-700"
      >
        <span aria-hidden>
          <IconX />
        </span>
        <span className="sr-only">Close</span>
      </button>
    </div>
  );
}
