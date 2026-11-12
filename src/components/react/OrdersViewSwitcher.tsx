import { twMerge } from 'tailwind-merge';

export type OrdersView = 'orders' | 'bulk';

// Segmented pill switching between the two order views on /order-book.
// Deep-linkable via ?view=bulk (see OrdersPage.tsx), so this is plain links
// rather than client-side state — a shared URL to a friend lands them on the
// right view even before hydration.
export const OrdersViewSwitcher = ({ active }: { active: OrdersView }) => {
  const tabClass = (isActive: boolean) =>
    twMerge(
      'rounded-md px-4 py-1.5 text-sm no-underline transition-colors',
      isActive
        ? 'bg-primary-800 text-white'
        : 'text-primary-800 hover:bg-gray-800 hover:text-primary-500',
    );

  return (
    <div className="mx-auto mt-3 flex w-fit shrink-0 gap-1 rounded-md border border-primary-900 border-opacity-40 bg-gray-900 p-1">
      <a href="/order-book" className={tabClass(active === 'orders')}>
        Item Orders
      </a>
      <a href="/order-book?view=bulk" className={tabClass(active === 'bulk')}>
        Bulk Orders
      </a>
    </div>
  );
};
