import { formatDistanceToNowStrict } from 'date-fns';
import { useState, type ReactNode } from 'react';
import { MemberAvatar } from '../farm/MemberAvatar';
import { profileHref } from './links';
import { compact, personName, type ActivityEvent, type Ledger, type PersonRef } from './model';
import { Panel } from './Panel';

const Person = ({ user }: { user: PersonRef }) => (
  <a href={profileHref({ id: user.id })} className="text-primary-400 no-underline hover:text-primary-300">
    {personName(user)}
  </a>
);

const Item = ({ children }: { children: ReactNode }) => (
  <span className="text-primary-300">{children}</span>
);

const describe = (event: ActivityEvent): ReactNode => {
  const quantity = event.quantity ? `${compact(event.quantity)}× ` : '';
  switch (event.kind) {
    case 'requested':
      return <>Ordered <Item>{event.item}</Item></>;
    case 'received':
      return <><Person user={event.other!} /> fulfilled <Item>{event.item}</Item></>;
    case 'fulfilled':
      return <>Fulfilled <Item>{event.item}</Item> for <Person user={event.other!} /></>;
    case 'contributed':
      return <>Gave {quantity}<Item>{event.item}</Item> to <Person user={event.other!} /></>;
    case 'bulk-requested':
      return <>Asked for {quantity}<Item>{event.item}</Item></>;
    case 'bulk-completed':
      return <>Bulk order for <Item>{event.item}</Item> completed</>;
  }
};

const MARKER: Record<ActivityEvent['kind'], string> = {
  requested: 'bg-gray-600',
  'bulk-requested': 'bg-gray-600',
  received: 'bg-discord-400',
  'bulk-completed': 'bg-discord-400',
  fulfilled: 'bg-emerald-400',
  contributed: 'bg-emerald-400',
};

// one side of the trade summary: "↑ 6 orders · 160 bulk"
const Side = ({
  label,
  orders,
  bulk,
  tone,
}: {
  label: string;
  orders: number;
  bulk: number;
  tone: string;
}) => (
  <div className="flex shrink-0 items-baseline gap-1.5 text-sm">
    <span className={`text-xs uppercase tracking-wider ${tone}`}>{label}</span>
    <span className="font-fontinSmallcaps text-lg text-primary-400">{compact(orders)}</span>
    <span className="text-xs text-primary-800">{orders === 1 ? 'order' : 'orders'}</span>
    <span className="font-fontinSmallcaps text-lg text-primary-400">{compact(bulk)}</span>
    <span className="text-xs text-primary-800">bulk</span>
  </div>
);

const SHOWN = 5;

/** The members this one trades with most, either way. */
export const AlliesPanel = ({ allies }: { allies: Ledger['allies'] }) => (
  <Panel title="Trades most with">
    <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
      {allies.map(({ user, gave, got }) => (
        <li key={user.id} className="flex items-center gap-2 text-sm">
          <MemberAvatar user={user} className="h-7 w-7 text-[10px]" />
          <Person user={user} />
          <span className="ml-auto text-xs text-primary-800">
            {got > 0 && <span className="text-emerald-300/80">given {got}</span>}
            {got > 0 && gave > 0 && ' · '}
            {gave > 0 && <span className="text-discord-300/80">received {gave}</span>}
          </span>
        </li>
      ))}
    </ul>
  </Panel>
);

export const LedgerPanel = ({ ledger }: { ledger: Ledger }) => {
  const [showAll, setShowAll] = useState(false);
  // trades either way: an order fulfilled, or a hand-in to a bulk order
  const given = ledger.fulfilled + ledger.bulkGivenOrders;
  const received = ledger.received + ledger.bulkReceivedContributions;
  const activity = showAll ? ledger.activity : ledger.activity.slice(0, SHOWN);
  const open = ledger.openOrders + ledger.openBulk;

  return (
    <Panel
      title="Orders"
      aside={
        open > 0 && (
          <span>
            Open:{' '}
            {ledger.openOrders > 0 && (
              <a href="/order-book" className="no-underline">
                {ledger.openOrders} {ledger.openOrders === 1 ? 'order' : 'orders'}
              </a>
            )}
            {ledger.openOrders > 0 && ledger.openBulk > 0 && ', '}
            {ledger.openBulk > 0 && (
              <a href="/order-book?view=bulk" className="no-underline">
                {ledger.openBulk} bulk
              </a>
            )}
          </span>
        )
      }
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Side
          label="Given"
          orders={ledger.fulfilled}
          bulk={ledger.bulkGiven}
          tone="text-emerald-300/80"
        />
        {/* the share of trades where this member was the one giving */}
        <div
          className="flex h-1 min-w-[4rem] flex-1 gap-0.5 overflow-hidden rounded-full bg-gray-800"
          title={`${given} given, ${received} received`}
        >
          {given > 0 && <div className="rounded-full bg-emerald-400/80" style={{ flex: given }} />}
          {received > 0 && (
            <div className="rounded-full bg-discord-400/80" style={{ flex: received }} />
          )}
        </div>
        <Side
          label="Received"
          orders={ledger.received}
          bulk={ledger.bulkReceived}
          tone="text-discord-300/80"
        />
      </div>

      {ledger.activity.length === 0 ? (
        <div className="mt-3 text-sm text-primary-800">No orders this league</div>
      ) : (
        <ol className="m-0 mt-3 flex list-none flex-col divide-y divide-gray-800/70 border-t border-gray-800/70 p-0">
          {activity.map((event) => (
            <li key={event.id} className="flex items-center gap-2 py-1 text-sm">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${MARKER[event.kind]}`} />
              {event.icon ? (
                <img src={event.icon} alt="" className="h-5 w-5 shrink-0 object-contain" />
              ) : (
                <span className="h-5 w-5 shrink-0" />
              )}
              <span className="min-w-0 flex-1 truncate text-primary-600">{describe(event)}</span>
              <span
                className="shrink-0 text-xs text-primary-800"
                title={new Date(event.at).toLocaleString()}
              >
                {formatDistanceToNowStrict(new Date(event.at))}
              </span>
            </li>
          ))}
        </ol>
      )}
      {ledger.activity.length > SHOWN && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="mt-1 bg-transparent p-0 text-xs text-primary-800 underline hover:bg-transparent hover:text-primary-300"
        >
          {showAll ? 'Show less' : `${ledger.activity.length - SHOWN} more`}
        </button>
      )}
    </Panel>
  );
};
