import { IconTrash } from '@tabler/icons-react';
import ReactTimeAgo from 'react-time-ago';
import { twMerge } from 'tailwind-merge';
import { getWikiImgSrcFromUrl } from '../../../_utils/utils';
import type { BulkOrdersSubscription } from '../../../graphql-api';
import { Button } from '../ui/Button';
import { BulkProgressBar, type BulkProgressSegment } from '../ui/BulkProgressBar';

export type BulkOrderWithContributions =
  BulkOrdersSubscription['bulk_order'][number];

export type BulkOrderStatus = 'active' | 'complete' | 'cancelled';

export const bulkOrderStatus = (
  order: Pick<BulkOrderWithContributions, 'cancelled_at' | 'completed_at'>,
): BulkOrderStatus => {
  if (order.cancelled_at) return 'cancelled';
  if (order.completed_at) return 'complete';
  return 'active';
};

const statusChipClass: Record<BulkOrderStatus, string> = {
  active: 'bg-primary-900 text-primary-300',
  complete: 'bg-emerald-900 text-emerald-300',
  cancelled: 'bg-red-950 text-red-400',
};

const statusLabel: Record<BulkOrderStatus, string> = {
  active: 'Active',
  complete: 'Complete',
  cancelled: 'Cancelled',
};

const contributorDisplayName = (
  user: BulkOrderWithContributions['user'],
) => user.poe_name ?? user.discord_name ?? 'Unknown';

const ContributorAvatar = ({
  user,
}: {
  user: BulkOrderWithContributions['user'];
}) => {
  if (user.discord_user_id && user.discord_avatar) {
    return (
      <img
        title={contributorDisplayName(user)}
        className="h-6 w-6 rounded-full border-2 border-gray-900"
        src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.discord_avatar}.png`}
      />
    );
  }
  return (
    <div
      title={contributorDisplayName(user)}
      className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-900 bg-gray-700 text-[10px] text-primary-300"
    >
      {contributorDisplayName(user).charAt(0).toUpperCase()}
    </div>
  );
};

export const BulkOrderCard = ({
  order,
  myUserId,
  onContribute,
  onEdit,
  onCancel,
  onUncancel,
  onDelete,
  onWithdraw,
}: {
  order: BulkOrderWithContributions;
  myUserId: string | undefined;
  onContribute: (order: BulkOrderWithContributions) => void;
  onEdit: (order: BulkOrderWithContributions) => void;
  onCancel: (order: BulkOrderWithContributions) => void;
  onUncancel: (order: BulkOrderWithContributions) => void;
  onDelete: (order: BulkOrderWithContributions) => void;
  onWithdraw: (contribution: { id: string; quantity: number }) => void;
}) => {
  const status = bulkOrderStatus(order);
  const sum = order.contributions.reduce((acc, c) => acc + c.quantity, 0);
  const remaining = Math.max(0, order.quantity - sum);
  const isMine = !!myUserId && order.user_id === myUserId;

  const icon =
    order.icon_url ??
    (order.link_url ? getWikiImgSrcFromUrl(order.link_url) : null) ??
    '/order-types/other.webp';

  // group contributions per user for the stacked progress bar segments,
  // preserving first-contribution order (contributions arrive created_at asc)
  const segmentsByUser = new Map<string, BulkProgressSegment>();
  for (const contribution of order.contributions) {
    const existing = segmentsByUser.get(contribution.user.id);
    if (existing) {
      existing.quantity += contribution.quantity;
    } else {
      segmentsByUser.set(contribution.user.id, {
        userId: contribution.user.id,
        name: contributorDisplayName(contribution.user),
        quantity: contribution.quantity,
      });
    }
  }
  const segments = [...segmentsByUser.values()];

  const myContributions = myUserId
    ? order.contributions.filter((c) => c.user.id === myUserId)
    : [];

  return (
    <div
      className={twMerge(
        'flex flex-col gap-3 rounded-md border border-primary-900 border-opacity-40 bg-gray-900 p-4',
        status === 'cancelled' && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <img
          src={icon}
          className="h-12 w-12 shrink-0 object-contain"
          alt={order.item_name}
          onError={(e) => {
            // custom/free-text items guess a wiki icon URL that doesn't
            // always exist — fall back to the generic icon rather than a
            // broken image
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/order-types/other.webp';
          }}
        />
        <div className="min-w-0 grow">
          <div className="flex items-center gap-2">
            {order.link_url ? (
              <a
                href={order.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-lg text-primary-300"
              >
                {order.item_name}
              </a>
            ) : (
              <span className="truncate text-lg text-primary-300">
                {order.item_name}
              </span>
            )}
            <span className="shrink-0 text-sm text-primary-800">
              ×{order.quantity.toLocaleString()}
            </span>
          </div>
          {order.description && (
            <div className="truncate text-sm text-primary-800 opacity-80">
              {order.description}
            </div>
          )}
          <div className="mt-0.5 flex items-center gap-2 text-xs text-primary-800">
            <span>
              {contributorDisplayName(order.user)}
              {isMine && ' (you)'}
            </span>
            <span aria-hidden>·</span>
            <ReactTimeAgo date={new Date(order.created_at)} />
          </div>
        </div>
        <span
          className={twMerge(
            'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs',
            statusChipClass[status],
          )}
        >
          {statusLabel[status]}
        </span>
      </div>

      <BulkProgressBar total={order.quantity} segments={segments} />

      {segments.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {segments.map((segment) => (
            <ContributorAvatar
              key={segment.userId}
              user={
                order.contributions.find((c) => c.user.id === segment.userId)!
                  .user
              }
            />
          ))}
          <span className="ml-1 text-xs text-primary-800">
            {segments.length} contributor{segments.length === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {myContributions.length > 0 && status === 'active' && (
        <div className="flex flex-col gap-1 rounded bg-gray-800 bg-opacity-50 p-2 text-xs text-primary-300">
          {myContributions.map((c) => (
            <div key={c.id} className="flex items-center justify-between">
              <span>You contributed {c.quantity.toLocaleString()}</span>
              <button
                className="text-primary-800 underline hover:text-red-400"
                onClick={() => onWithdraw(c)}
              >
                Withdraw
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {status === 'active' && remaining > 0 && (
          <Button
            className="h-auto border-primary-500 bg-primary-900 bg-opacity-30"
            onClick={() => onContribute(order)}
          >
            Contribute
          </Button>
        )}
        {isMine && status === 'active' && (
          <>
            <Button className="h-auto" onClick={() => onEdit(order)}>
              Edit
            </Button>
            <Button
              className="h-auto hover:border-red-500 hover:text-red-400"
              onClick={() => onCancel(order)}
            >
              Cancel
            </Button>
          </>
        )}
        {isMine && status === 'cancelled' && (
          <Button className="h-auto" onClick={() => onUncancel(order)}>
            Reopen
          </Button>
        )}
        {isMine && order.contributions.length === 0 && (
          <button
            title="Delete order"
            className="ml-auto text-primary-900 hover:text-red-400"
            onClick={() => onDelete(order)}
          >
            <IconTrash size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
