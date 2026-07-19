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
    // fixed + out-of-flow so it never disturbs OrderBook's/BulkOrderBook's
    // own top-margin and viewport-height math (both assume they own the
    // full flow below the nav)
    <div className="fixed left-1/2 top-20 z-20 flex w-fit -translate-x-1/2 gap-1 rounded-md border border-primary-900 border-opacity-40 bg-gray-900 p-1 shadow-lg md:top-16">
      <a href="/order-book" className={tabClass(active === 'orders')}>
        Item Orders
      </a>
      <a href="/order-book?view=bulk" className={tabClass(active === 'bulk')}>
        Bulk Orders
      </a>
    </div>
  );
};
