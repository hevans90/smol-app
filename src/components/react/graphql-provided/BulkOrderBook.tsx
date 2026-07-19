import { useMutation, useSubscription } from '@apollo/client';
import { useStore } from '@nanostores/react';
import { search as fuzzySearch } from 'fast-fuzzy';
import { IconSearch } from '@tabler/icons-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  bulkFuzzySearchStore,
  bulkShowCancelledStore,
  bulkShowCompletedStore,
  bulkSortStore,
  type BulkOrderSort,
} from '../../../_state/bulk-orders';
import {
  buildBulkEmbed,
  notifyBulkDiscord,
  type BulkDiscordUser,
} from '../../../_utils/bulk-discord';
import { useMyHasuraUser } from '../../../hooks/useMyHasuraId';
import {
  BulkOrdersDocument,
  DeleteBulkOrderContributionDocument,
  DeleteBulkOrderDocument,
  InsertBulkOrderContributionDocument,
  InsertBulkOrderDocument,
  UpdateBulkOrderDocument,
  type BulkOrdersSubscription,
  type DeleteBulkOrderContributionMutation,
  type DeleteBulkOrderContributionMutationVariables,
  type DeleteBulkOrderMutation,
  type DeleteBulkOrderMutationVariables,
  type InsertBulkOrderContributionMutation,
  type InsertBulkOrderContributionMutationVariables,
  type InsertBulkOrderMutation,
  type InsertBulkOrderMutationVariables,
  type UpdateBulkOrderMutation,
  type UpdateBulkOrderMutationVariables,
} from '../../../graphql-api';
import { Button } from '../ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeading,
} from '../ui/Dialog';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { Toggle } from '../ui/Toggle';
import { BulkOrderCard, type BulkOrderWithContributions } from './BulkOrderCard';
import { BulkOrderForm, type BulkOrderFormValues } from './BulkOrderForm';
import {
  BulkContributeDialog,
  type BulkContributeValues,
} from './BulkContributeDialog';

const SORT_OPTIONS: { value: BulkOrderSort; display: string }[] = [
  { value: 'newest', display: 'Newest first' },
  { value: 'closest-to-complete', display: 'Closest to complete' },
  { value: 'largest', display: 'Largest quantity' },
];

const sumOf = (order: BulkOrderWithContributions) =>
  order.contributions.reduce((acc, c) => acc + c.quantity, 0);

export const BulkOrderBook = () => {
  const { data: orders, loading } = useSubscription<BulkOrdersSubscription>(
    BulkOrdersDocument,
  );
  const { data: myUser } = useMyHasuraUser();
  const myUserId = myUser?.id;

  const showCompleted = useStore(bulkShowCompletedStore);
  const showCancelled = useStore(bulkShowCancelledStore);
  const sort = useStore(bulkSortStore);
  const fuzzyQuery = useStore(bulkFuzzySearchStore);

  const [insertBulkOrder] = useMutation<
    InsertBulkOrderMutation,
    InsertBulkOrderMutationVariables
  >(InsertBulkOrderDocument);
  const [updateBulkOrder] = useMutation<
    UpdateBulkOrderMutation,
    UpdateBulkOrderMutationVariables
  >(UpdateBulkOrderDocument);
  const [deleteBulkOrder] = useMutation<
    DeleteBulkOrderMutation,
    DeleteBulkOrderMutationVariables
  >(DeleteBulkOrderDocument);
  const [insertContribution] = useMutation<
    InsertBulkOrderContributionMutation,
    InsertBulkOrderContributionMutationVariables
  >(InsertBulkOrderContributionDocument);
  const [deleteContribution] = useMutation<
    DeleteBulkOrderContributionMutation,
    DeleteBulkOrderContributionMutationVariables
  >(DeleteBulkOrderContributionDocument);

  const [formOpen, setFormOpen] = useState(false);
  const [editingOrder, setEditingOrder] =
    useState<BulkOrderWithContributions | null>(null);
  const [contributeOrder, setContributeOrder] =
    useState<BulkOrderWithContributions | null>(null);
  const [cancelOrder, setCancelOrder] =
    useState<BulkOrderWithContributions | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Cmd/Ctrl+O opens the create dialog, same convention as the item order book
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const comboPressed = (e.metaKey || e.ctrlKey) && e.key === 'o';
      const target = e.target as HTMLElement | null;
      const isTypingTarget =
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);
      if (comboPressed && !isTypingTarget) {
        e.preventDefault();
        setEditingOrder(null);
        setFormOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ?createBulkOrder=true deep link, mirroring OrderBook's ?createOrder=true
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('createBulkOrder') === 'true') {
        setFormOpen(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      if (formOpen && !editingOrder) {
        url.searchParams.set('createBulkOrder', 'true');
      } else {
        url.searchParams.delete('createBulkOrder');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {}
  }, [formOpen, editingOrder]);

  const allOrders = orders?.bulk_order ?? [];

  // handleContribute closes over allOrders at the render it was created in.
  // If a mutation is in flight when the subscription pushes newer data (e.g.
  // the very contribution that causes our own to be rejected), that render
  // creates a NEW handleContribute closure — but the already-in-flight call
  // still runs its OLD one, whose .catch() would read stale pre-conflict
  // data. A ref sidesteps that: it always holds the latest value regardless
  // of which render's closure is executing when the mutation resolves.
  const allOrdersRef = useRef(allOrders);
  allOrdersRef.current = allOrders;

  const filteredOrders = useMemo(() => {
    let result = allOrders;

    if (!showCompleted) {
      result = result.filter((o) => !o.completed_at);
    }
    if (!showCancelled) {
      result = result.filter((o) => !o.cancelled_at);
    }

    if (fuzzyQuery) {
      result = fuzzySearch(fuzzyQuery, result, {
        keySelector: (order) => [
          order.item_name,
          order.description ?? ' ',
          order.user.poe_name ?? order.user.discord_name ?? ' ',
        ],
        threshold: 0.8,
        ignoreCase: true,
      });
    }

    const sorted = [...result];
    switch (sort) {
      case 'largest':
        sorted.sort((a, b) => b.quantity - a.quantity);
        break;
      case 'closest-to-complete': {
        const remainingOf = (o: BulkOrderWithContributions) =>
          o.quantity - sumOf(o);
        sorted.sort((a, b) => remainingOf(a) - remainingOf(b));
        break;
      }
      case 'newest':
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
    }

    return sorted;
  }, [allOrders, showCompleted, showCancelled, fuzzyQuery, sort]);

  const hiddenCount = allOrders.length - filteredOrders.length;

  const asDiscordUser = (user: BulkOrderWithContributions['user']) => user;

  // Any insert-contribution error means the order changed underneath the
  // user (overshoot, or someone else completed/cancelled it in the
  // meantime) — the DB trigger that caught this doesn't surface a parseable
  // reason to the client, so the friendly message is derived from the
  // freshest state the live subscription has for this order instead of the
  // raw GraphQL error.
  const explainContributionFailure = (orderId: string) => {
    const current = allOrdersRef.current.find((o) => o.id === orderId);
    if (!current) return 'This order no longer exists.';
    if (current.cancelled_at) return 'This order was just cancelled.';
    if (current.completed_at) return 'This order was just completed.';
    const remaining = current.quantity - sumOf(current);
    return `Someone beat you to it — only ${remaining} remaining now.`;
  };

  const handleCreateOrEdit = async (values: BulkOrderFormValues) => {
    if (!myUserId || !myUser) return;

    if (editingOrder) {
      const oldQuantity = editingOrder.quantity;
      try {
        const { data } = await updateBulkOrder({
          variables: {
            id: editingOrder.id,
            description: values.description ?? null,
            quantity: values.quantity,
            linkUrl: editingOrder.link_url ?? null,
            cancelledAt: editingOrder.cancelled_at ?? null,
          },
        });
        const updated = data?.update_bulk_order_by_pk;
        if (updated && values.quantity > oldQuantity) {
          await notifyBulkDiscord(
            buildBulkEmbed({
              type: 'quantityRaised',
              order: {
                id: editingOrder.id,
                item_name: editingOrder.item_name,
                icon_url: editingOrder.icon_url,
                link_url: editingOrder.link_url,
                description: values.description ?? editingOrder.description,
                quantity: values.quantity,
              },
              owner: asDiscordUser(editingOrder.user),
              oldQuantity,
              newQuantity: values.quantity,
              sum: sumOf(editingOrder),
              origin: window.location.origin,
            }),
          );
        }
        toast.success('Bulk order updated');
        setFormOpen(false);
        setEditingOrder(null);
      } catch (error: any) {
        toast.error(`Could not update order: ${error.message}`);
      }
      return;
    }

    try {
      const { data } = await insertBulkOrder({
        variables: {
          userId: myUserId,
          itemName: values.itemName,
          quantity: values.quantity,
          description: values.description ?? null,
          iconUrl: values.iconUrl ?? null,
        },
      });
      const created = data?.insert_bulk_order_one;
      if (created) {
        await notifyBulkDiscord(
          buildBulkEmbed({
            type: 'created',
            order: created,
            owner: asDiscordUser(myUser),
            origin: window.location.origin,
          }),
        );
      }
      toast.success('Bulk order created');
      setFormOpen(false);
    } catch (error: any) {
      toast.error(`Could not create order: ${error.message}`);
    }
  };

  const handleContribute = async (
    order: BulkOrderWithContributions,
    values: BulkContributeValues,
  ) => {
    if (!myUserId || !myUser) return;
    try {
      const { data } = await insertContribution({
        variables: {
          bulkOrderId: order.id,
          userId: myUserId,
          quantity: values.quantity,
          delivery: values.delivery,
          note: values.note ?? null,
        },
      });
      const inserted = data?.insert_bulk_order_contribution_one;
      if (!inserted) return;

      const parent = inserted.bulk_order;
      if (parent.completed_at) {
        const contributors = parent.contributions.map((c) => c.user);
        await notifyBulkDiscord(
          buildBulkEmbed({
            type: 'completed',
            order,
            owner: asDiscordUser(order.user),
            finalContributor: asDiscordUser(myUser),
            contributionQty: values.quantity,
            contributors,
            delivery: values.delivery,
            note: values.note,
            origin: window.location.origin,
          }),
        );
        toast.success(`🎉 You completed the order for ${order.item_name}!`);
      } else {
        const sumAfter = parent.contributions.reduce(
          (acc, c) => acc + c.quantity,
          0,
        );
        await notifyBulkDiscord(
          buildBulkEmbed({
            type: 'contribution',
            order,
            owner: asDiscordUser(order.user),
            contributor: asDiscordUser(myUser),
            contributionQty: values.quantity,
            sumAfter,
            delivery: values.delivery,
            note: values.note,
            origin: window.location.origin,
          }),
        );
        toast.success(
          `Contributed ${values.quantity}× ${order.item_name} — ${order.quantity - sumAfter} to go`,
        );
      }
      setContributeOrder(null);
    } catch (error: any) {
      toast.error(explainContributionFailure(order.id));
    }
  };

  const handleWithdraw = async (
    order: BulkOrderWithContributions,
    contribution: { id: string; quantity: number },
  ) => {
    if (!myUser) return;
    const sumBefore = sumOf(order);
    const sumAfter = sumBefore - contribution.quantity;
    const reopened = !!order.completed_at && sumAfter < order.quantity;
    try {
      await deleteContribution({ variables: { id: contribution.id } });
      await notifyBulkDiscord(
        buildBulkEmbed({
          type: 'withdrawal',
          order,
          owner: asDiscordUser(order.user),
          contributor: asDiscordUser(myUser),
          withdrawnQty: contribution.quantity,
          sumAfter,
          reopened,
          origin: window.location.origin,
        }),
      );
      toast.success('Contribution withdrawn');
    } catch (error: any) {
      toast.error(`Could not withdraw: ${error.message}`);
    }
  };

  const handleConfirmCancel = async (order: BulkOrderWithContributions) => {
    try {
      await updateBulkOrder({
        variables: {
          id: order.id,
          description: order.description ?? null,
          quantity: order.quantity,
          linkUrl: order.link_url ?? null,
          cancelledAt: new Date().toISOString(),
        },
      });
      if (order.contributions.length > 0) {
        const contributors = order.contributions.map((c) => c.user);
        await notifyBulkDiscord(
          buildBulkEmbed({
            type: 'cancelled',
            order,
            owner: asDiscordUser(order.user),
            sumAtCancellation: sumOf(order),
            contributors,
            origin: window.location.origin,
          }),
        );
      }
      toast.success('Bulk order cancelled');
      setCancelOrder(null);
    } catch (error: any) {
      toast.error(`Could not cancel order: ${error.message}`);
    }
  };

  const handleUncancel = async (order: BulkOrderWithContributions) => {
    try {
      await updateBulkOrder({
        variables: {
          id: order.id,
          description: order.description ?? null,
          quantity: order.quantity,
          linkUrl: order.link_url ?? null,
          cancelledAt: null,
        },
      });
      await notifyBulkDiscord(
        buildBulkEmbed({
          type: 'uncancelled',
          order,
          owner: asDiscordUser(order.user),
          origin: window.location.origin,
        }),
      );
      toast.success('Bulk order reopened');
    } catch (error: any) {
      toast.error(`Could not reopen order: ${error.message}`);
    }
  };

  const handleDelete = async (order: BulkOrderWithContributions) => {
    try {
      const { data } = await deleteBulkOrder({ variables: { id: order.id } });
      if (!data?.delete_bulk_order_by_pk) {
        toast.error(
          'This order now has contributions — cancel it instead of deleting.',
        );
        return;
      }
      toast.success('Bulk order deleted');
    } catch (error: any) {
      toast.error(`Could not delete order: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative mt-32 flex h-[calc(100vh-8rem)] w-full flex-col gap-3 px-4">
      <div className="absolute -top-6 flex gap-2">
        <span className="text-primary-600">{filteredOrders.length}</span>
        <span className="text-primary-900">bulk orders</span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <h1 className="mb-0 hidden sm:inline">Bulk Orders</h1>
        <div className="flex grow items-center gap-2">
          <IconSearch />
          <input
            ref={inputRef}
            placeholder="search by item, description, or user"
            defaultValue={fuzzyQuery}
            onChange={(e) =>
              bulkFuzzySearchStore.set(e.target.value.trim())
            }
            className="max-w-md grow border-[1px] border-primary-800 bg-gray-800"
          />
        </div>
        <div className="hidden gap-4 md:flex">
          <Toggle
            autoHide={false}
            value={showCompleted}
            onChange={() => bulkShowCompletedStore.set(!showCompleted)}
            label="Completed"
          />
          <Toggle
            autoHide={false}
            value={showCancelled}
            onChange={() => bulkShowCancelledStore.set(!showCancelled)}
            label="Cancelled"
          />
        </div>
        <Select
          className="w-48"
          placeholder="Sort"
          options={SORT_OPTIONS}
          defaultIndex={SORT_OPTIONS.findIndex((o) => o.value === sort)}
          onSelectChange={(value) =>
            bulkSortStore.set(value as BulkOrderSort)
          }
        />
        <Button
          className="h-auto text-lg"
          onClick={() => {
            setEditingOrder(null);
            setFormOpen(true);
          }}
        >
          Create Bulk Order
        </Button>
      </div>

      <div className="h-full overflow-y-auto pb-4">
        {filteredOrders.length === 0 && allOrders.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-primary-800">
            <div className="font-fontinSmallcaps text-2xl text-primary-500">
              No bulk orders yet
            </div>
            <div>Ask the guild for a big batch of currency in one place.</div>
            <Button
              className="h-auto text-lg"
              onClick={() => {
                setEditingOrder(null);
                setFormOpen(true);
              }}
            >
              Create Bulk Order
            </Button>
          </div>
        )}

        {filteredOrders.length === 0 && allOrders.length > 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-primary-800">
            <div>{hiddenCount} bulk orders hidden by filters</div>
            <button
              className="text-primary-500 underline"
              onClick={() => {
                bulkShowCompletedStore.set(true);
                bulkShowCancelledStore.set(true);
                bulkFuzzySearchStore.set('');
                if (inputRef.current) inputRef.current.value = '';
              }}
            >
              Reset filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => (
            <BulkOrderCard
              key={order.id}
              order={order}
              myUserId={myUserId}
              onContribute={setContributeOrder}
              onEdit={(o) => {
                setEditingOrder(o);
                setFormOpen(true);
              }}
              onCancel={setCancelOrder}
              onUncancel={handleUncancel}
              onDelete={handleDelete}
              onWithdraw={(contribution) => handleWithdraw(order, contribution)}
            />
          ))}
        </div>
      </div>

      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingOrder(null);
        }}
      >
        <DialogContent className="w-[36rem] max-w-[95vw]">
          <DialogHeading>
            {editingOrder ? 'Edit Bulk Order' : 'Create Bulk Order'}
          </DialogHeading>
          <BulkOrderForm
            mode={editingOrder ? 'edit' : 'create'}
            order={editingOrder ?? undefined}
            contributedSum={editingOrder ? sumOf(editingOrder) : 0}
            onSubmit={handleCreateOrEdit}
            onClose={() => {
              setFormOpen(false);
              setEditingOrder(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {contributeOrder && (
        <BulkContributeDialog
          order={contributeOrder}
          myUser={myUser as BulkDiscordUser | undefined}
          open={!!contributeOrder}
          onOpenChange={(open) => {
            if (!open) setContributeOrder(null);
          }}
          onSubmit={(values) => handleContribute(contributeOrder, values)}
        />
      )}

      <Dialog
        open={!!cancelOrder}
        onOpenChange={(open) => {
          if (!open) setCancelOrder(null);
        }}
      >
        <DialogContent>
          <DialogHeading>Cancel Bulk Order</DialogHeading>
          {cancelOrder && (
            <>
              <DialogDescription className="mb-4 max-w-md">
                Cancel the order for {cancelOrder.quantity}×{' '}
                {cancelOrder.item_name}?
                {cancelOrder.contributions.length > 0 ? (
                  <>
                    {' '}
                    <strong>
                      {sumOf(cancelOrder)} has already been contributed by{' '}
                      {
                        new Set(cancelOrder.contributions.map((c) => c.user.id))
                          .size
                      }{' '}
                      people
                    </strong>{' '}
                    — they will be notified.
                  </>
                ) : (
                  ' No one has contributed yet.'
                )}
              </DialogDescription>
              <div className="flex gap-3">
                <Button
                  className="h-auto hover:border-red-500 hover:text-red-400"
                  onClick={() => handleConfirmCancel(cancelOrder)}
                >
                  Confirm cancel
                </Button>
                <Button className="h-auto" onClick={() => setCancelOrder(null)}>
                  Never mind
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
