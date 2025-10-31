import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useStore } from '@nanostores/react';
import { search as fuzzySearch } from 'fast-fuzzy';
import { discordStore } from '../../../_state/discord.state';

import { isAfter, subWeeks } from 'date-fns';

import {
  DeleteUserItemOrderDocument,
  FulfillUserItemOrderDocument,
  InsertUserItemOrderDocument,
  Item_Order_Type_Enum,
  OrderTypesDocument,
  UpdateUserItemOrderDocument,
  UserItemOrdersDocument,
  type DeleteUserItemOrderMutation,
  type DeleteUserItemOrderMutationVariables,
  type FulfillUserItemOrderMutation,
  type FulfillUserItemOrderMutationVariables,
  type InsertUserItemOrderMutation,
  type InsertUserItemOrderMutationVariables,
  type OrderTypesQuery,
  type UpdateUserItemOrderMutation,
  type UpdateUserItemOrderMutationVariables,
  type UserItemOrdersSubscription,
} from '../../../graphql-api';
import { Spinner } from '../ui/Spinner';

import { IconAlertCircle, IconSearch, IconTrash } from '@tabler/icons-react';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactTimeAgo from 'react-time-ago';
import invariant from 'tiny-invariant';
import {
  orderBookFuzzySearchStore,
  orderBookShowFulfilledStore,
  orderBookShowInactiveStore,
  orderBookTypeFiltersStore,
} from '../../../_state/order-book';
import { useMyHasuraUser } from '../../../hooks/useMyHasuraId';
import { Button } from '../ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeading,
} from '../ui/Dialog';
import { Toggle } from '../ui/Toggle';
import { OrderBookFilters } from './OrderBookFilters';
import { OrderForm, type OrderFormInputs } from './OrderForm';
TimeAgo.addDefaultLocale(en);

const priorityOrderLimit = 2;

const getWikiImgSrcFromUrl = (url: string) => {
  // i.e. https://www.poewiki.net/wiki/Ming%27s_Heart
  const itemName = url.split('/').pop();

  return `https://www.poewiki.net/wiki/Special:FilePath/${itemName}_inventory_icon.png`;
};

export const OrderBook = () => {
  const { data: orders, loading } = useSubscription<UserItemOrdersSubscription>(
    UserItemOrdersDocument,
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const { data: orderTypes } = useQuery<OrderTypesQuery>(OrderTypesDocument);

  const { id: myDiscordId } = useStore(discordStore);
  const fuzzyQuery = useStore(orderBookFuzzySearchStore);
  const showInactive = useStore(orderBookShowInactiveStore);
  const showFulfilled = useStore(orderBookShowFulfilledStore);
  const typeFilters = useStore(orderBookTypeFiltersStore);

  const exportBaseDataToSpreadsheet = async () => {
    window.location.hostname !== 'localhost' &&
      fetch(`${window.location.origin}/api/update-sheet`);
  };

  const filteredOrders = useMemo(() => {
    let result = orders?.user_item_order;

    if (!showFulfilled) {
      result = result?.filter(({ fulfilled_by_user }) => !fulfilled_by_user);
    }
    if (!showInactive) {
      result = result?.filter(
        ({ priority, updated_at }) =>
          priority || isAfter(new Date(updated_at), subWeeks(new Date(), 2)),
      );
    }

    result = result?.filter(({ type }) => {
      const enabledOrderTypes = Object.entries(typeFilters)
        .filter(([_, value]) => !!value)
        .map(([type]) => type);

      return enabledOrderTypes.includes(type);
    });
    if (result?.length && fuzzyQuery?.length) {
      result = fuzzySearch(fuzzyQuery, result, {
        keySelector: (order) => [
          order.description ?? (' ' as string),
          order.user.discord_name ?? (' ' as string),
        ],
        threshold: 0.9,
        ignoreSymbols: false,
        ignoreCase: true,
      });
    }

    if (!result) {
      return [];
    }

    return result;
  }, [showFulfilled, showInactive, typeFilters, loading, orders, fuzzyQuery]);

  const myUnfilfilledPriorityOrders = useMemo(
    () =>
      orders?.user_item_order?.filter(
        (order) =>
          order.user.discord_user_id === myDiscordId &&
          order.priority &&
          !order?.fulfilled_by_user,
      ),
    [orders],
  );

  const { data: userProfile, loading: userLoading } = useMyHasuraUser();

  const [createItemOrder] = useMutation<
    InsertUserItemOrderMutation,
    InsertUserItemOrderMutationVariables
  >(InsertUserItemOrderDocument);

  const [updateItemOrder] = useMutation<
    UpdateUserItemOrderMutation,
    UpdateUserItemOrderMutationVariables
  >(UpdateUserItemOrderDocument);

  const [deleteItemOrder] = useMutation<
    DeleteUserItemOrderMutation,
    DeleteUserItemOrderMutationVariables
  >(DeleteUserItemOrderDocument);

  const [fulfillItemOrder] = useMutation<
    FulfillUserItemOrderMutation,
    FulfillUserItemOrderMutationVariables
  >(FulfillUserItemOrderDocument);

  const [fulfillmentInProgress, setFulfillmentInProgress] = useState(false);
  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [fulfillModalState, setFulfillModalState] = useState<{
    orderId: string;
    discordUserName?: string | null;
    discordUserId: string;
    message: string;
    fulfillment: 'DM' | 'gstash';
    fulfillerInSmolGuild: boolean;
    recipientInSmolGuild: boolean;
  }>({
    discordUserName: '',
    discordUserId: '',
    fulfillment: 'gstash',
    message: '',
    orderId: '',
    fulfillerInSmolGuild: false,
    recipientInSmolGuild: false,
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateModalState, setUpdateModalState] = useState<
    OrderFormInputs & { orderId: string }
  >();

  // Global hotkey: Cmd+O / Ctrl+O to open Create Order
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const comboPressed = (e.metaKey || e.ctrlKey) && (e.key === 'o' || e.key === 'O');

      // Avoid triggering while typing in inputs/textareas/contenteditable
      const target = e.target as HTMLElement | null;
      const isTypingTarget = !!target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        (target as HTMLElement).isContentEditable
      );

      if (comboPressed && !isTypingTarget) {
        e.preventDefault();
        setCreateModalOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleOrderFulfillment = async () => {
    invariant(fulfillModalState);
    setFulfillmentInProgress(true);
    await notifyDiscordUser(fulfillModalState);
    await fulfillItemOrder({
      variables: {
        fulfilledBy: userProfile?.id as string,
        orderId: fulfillModalState.orderId,
      },
    });
    setFulfillmentInProgress(false);

    await exportBaseDataToSpreadsheet();

    setFulfillModalOpen(false);
  };

  const notifyDiscordUser = async ({
    discordUserId,
    message,
    fulfillment,
  }: {
    discordUserId: string;
    message: string;
    fulfillment: 'DM' | 'gstash';
  }) =>
    fetch(`${window.location.origin}/api/discord-notify-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        discordUserId,
        message: `your order for \`${message}\` has been fulfilled by <@${myDiscordId}>. ${
          fulfillment === 'DM'
            ? 'They will message you.'
            : 'It will be in Guild Stash 1 shortly!'
        }`,
      }),
    });

  useEffect(() => {
    if (!loading && !userLoading) {
      inputRef?.current?.focus();
    }
  }, [loading, userLoading]);

  if (loading || userLoading)
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  return (
    <div
      id="order-book-container"
      className="relative mt-32 flex h-[calc(100vh-8rem)] w-full flex-col gap-2 px-4"
    >
      <div className="absolute -top-6 flex gap-2">
        <span className="text-primary-600">{filteredOrders?.length}</span>
        <span className="text-primary-900">orders</span>
      </div>
      <div className="flex  items-center gap-6  sm:w-full">
        <h1 className="mb-0 hidden sm:inline">Item Orders</h1>

        <Button
          className="h-auto text-xl sm:hidden"
          onClick={() => {
            setCreateModalOpen(true);
          }}
        >
          Create
        </Button>
        <div className="flex grow items-center gap-2">
          <IconSearch />
          <input
            ref={inputRef}
            placeholder="search by user or description"
            defaultValue={fuzzyQuery}
            onChange={(e) =>
              orderBookFuzzySearchStore.set(e.target.value.trim())
            }
            className="max-w-md grow border-[1px] border-primary-800 bg-gray-800"
          ></input>

          <div className="ml-4 hidden gap-4 md:flex">
            <Toggle
              autoHide={false}
              value={showFulfilled}
              onChange={() => orderBookShowFulfilledStore.set(!showFulfilled)}
              label="Fulfilled"
            />
            <Toggle
              autoHide={false}
              value={showInactive}
              onChange={() => orderBookShowInactiveStore.set(!showInactive)}
              label="Inactive (> 2 weeks)"
            />
          </div>
        </div>
      </div>
      <div className="flex w-[calc(100%-2rem)] gap-2 sm:w-full">
        <Button
          className="hidden h-auto text-xl sm:block"
          onClick={() => {
            setCreateModalOpen(true);
          }}
        >
          Create Order
        </Button>
        {orderTypes && <OrderBookFilters orderTypes={orderTypes} />}
      </div>
      <div className="h-full overflow-y-auto">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-gray-950">
            <tr>
              <th className="w-28 border-b border-primary-500">
                <div className="mb-2 flex items-center gap-2">
                  <img src="/discord-logo.svg" className="h-8 pt-1" />
                </div>
              </th>
              <th className="hidden w-20 border-b border-primary-500 lg:table-cell"></th>
              <th className="w-22 border-b border-primary-500">type</th>
              <th className="w-44 border-b border-primary-500 sm:w-64 md:w-72 lg:w-96">
                description
              </th>
              <th className="hidden border-b border-primary-500 lg:table-cell">
                updated
              </th>
              <th className="border-b border-primary-500"></th>
              <th className="border-b border-primary-500"></th>
              <th className="border-b border-primary-500"></th>
              {showFulfilled && (
                <th className="hidden w-44 border-b border-primary-500 lg:table-cell">
                  fulfilled by
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredOrders?.map(
              (
                {
                  description,
                  link_url,
                  icon_url,
                  updated_at,
                  id: orderId,
                  user,
                  fulfilled_by_user,
                  type,
                  priority,
                  item_base_type,
                  item_category,
                },
                i,
              ) => {
                const guild = 'Smol Groop Found';
                const inSmolGuild = user.guild === guild;
                const myUserIsInSmolGuild = userProfile?.guild === guild;
                const isMe = user.discord_user_id === myDiscordId;
                const orderFulfilled = !!fulfilled_by_user;

                return (
                  <tr
                    key={i}
                    className={orderFulfilled ? 'bg-gray-900 opacity-60' : ''}
                  >
                    <td>
                      <div
                        className={`my-2 flex items-center gap-2 ${
                          i === 0 && 'mt-4'
                        }`}
                      >
                        {user?.discord_user_id ? (
                          <>
                            {user.discord_avatar ? (
                              <img
                                className="h-8 w-8 rounded-full"
                                src={`https://cdn.discordapp.com/avatars/${user?.discord_user_id}/${user?.discord_avatar}.png`}
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-discord-500">
                                <img src="/discord-logo.svg" className="h-4" />
                              </div>
                            )}
                            {user?.discord_name}
                            {isMe && (
                              <div className="hidden text-primary-500 lg:block">
                                (you)
                              </div>
                            )}
                          </>
                        ) : (
                          'no discord linked'
                        )}
                      </div>
                    </td>

                    <td className="hidden lg:table-cell">
                      {priority ? (
                        <div className="mt-2 flex items-end justify-end">
                          <IconAlertCircle />
                        </div>
                      ) : null}
                    </td>

                    <td>
                      <div className="flex justify-center">
                        {icon_url ? (
                          <img
                            className="h-10 w-10 object-contain p-1 md:h-12 md:w-12"
                            src={icon_url}
                          />
                        ) : link_url ? (
                          <a href={link_url} target="_blank">
                            <img
                              className="h-10 object-cover p-1 md:h-12"
                              src={getWikiImgSrcFromUrl(link_url)}
                            />
                          </a>
                        ) : (
                          <img
                            className="h-10 w-10 p-1 md:h-12 md:w-12"
                            src={`/order-types/${type}.webp`}
                          />
                        )}
                      </div>
                    </td>

                    <td className="max-w-0 truncate">
                      {link_url ? (
                        <a href={link_url} target="_blank">
                          {description}
                        </a>
                      ) : (
                        description
                      )}
                    </td>

                    <td className="hidden text-center lg:table-cell">
                      <ReactTimeAgo
                        date={new Date(updated_at)}
                        locale="en-GB"
                      />
                    </td>
                    <td className="text-center">
                      {isMe && !orderFulfilled && (
                        <>
                          <Button
                            onClick={() => {
                              setUpdateModalOpen(true);
                              setUpdateModalState({
                                type,
                                description,
                                linkUrl: link_url,
                                orderId,
                                priority,
                                iconUrl: icon_url,
                                itemBaseType: item_base_type,
                                itemCategory: item_category,
                              });
                            }}
                          >
                            Update
                          </Button>
                        </>
                      )}
                    </td>
                    <td className="text-center">
                      {isMe && !orderFulfilled && (
                        <button
                          className="rounded-full bg-primary-900 p-1 text-primary-500  opacity-50 hover:text-primary-300 hover:opacity-75"
                          onClick={() => {
                            deleteItemOrder({
                              variables: { orderId },
                            });
                            exportBaseDataToSpreadsheet();
                          }}
                        >
                          <IconTrash size={25} />
                        </button>
                      )}
                    </td>
                    <td>
                      {!isMe && user.discord_user_id && !orderFulfilled && (
                        <Button
                          onClick={() => {
                            invariant(user.discord_user_id);
                            invariant(description);
                            setFulfillModalOpen(true);
                            setFulfillModalState({
                              discordUserName: user?.discord_name ?? null,
                              discordUserId: user.discord_user_id,
                              orderId,
                              message: description,
                              fulfillment:
                                inSmolGuild && myUserIsInSmolGuild
                                  ? 'gstash'
                                  : 'DM',
                              recipientInSmolGuild: inSmolGuild,
                              fulfillerInSmolGuild: myUserIsInSmolGuild,
                            });
                          }}
                        >
                          Fulfill
                        </Button>
                      )}
                    </td>
                    {showFulfilled && (
                      <td id="fulfilled-cell" className="hidden lg:table-cell">
                        <div
                          className={`my-2 flex items-center gap-2 ${
                            i === 0 && 'mt-4'
                          }`}
                        >
                          {fulfilled_by_user && (
                            <>
                              {fulfilled_by_user.discord_avatar ? (
                                <img
                                  className="h-8 w-8 rounded-full"
                                  src={`https://cdn.discordapp.com/avatars/${fulfilled_by_user.discord_user_id}/${fulfilled_by_user.discord_avatar}.png`}
                                />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-discord-500">
                                  <img
                                    src="/discord-logo.svg"
                                    className="h-4"
                                  />
                                </div>
                              )}

                              {fulfilled_by_user.discord_name}
                              {fulfilled_by_user.discord_user_id ===
                                myDiscordId && (
                                <div className="text-primary-500">(you)</div>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              },
            )}
            {!filteredOrders?.length && (
              <tr>
                <td className="text-lg" colSpan={3}>
                  <div className="mt-4">No orders found</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent>
          <DialogHeading>Update Order</DialogHeading>
          {orderTypes && (
            <OrderForm
              quickOrdersAvailable={false}
              allowPriority={
                (myUnfilfilledPriorityOrders?.length ?? 0) < priorityOrderLimit
              }
              orderTypes={orderTypes}
              data={updateModalState}
              onSubmit={(data) => {
                updateItemOrder({
                  variables: {
                    ...data,
                    orderId: updateModalState?.orderId ?? '',
                  },
                });
                setUpdateModalOpen(false);
                exportBaseDataToSpreadsheet();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeading>Create Order</DialogHeading>
          {orderTypes && (
            <OrderForm
              allowPriority={
                (myUnfilfilledPriorityOrders?.length ?? 0) < priorityOrderLimit
              }
              orderTypes={orderTypes}
              onSubmit={(data) => {
                createItemOrder({
                  variables: {
                    type: data.type ?? Item_Order_Type_Enum.Other,
                    description: data.description as string,
                    linkUrl: data.linkUrl ?? '',
                    userId: userProfile?.id as string,
                    priority: data.priority,
                    itemBaseType: data?.itemBaseType,
                    iconUrl: data?.iconUrl,
                    itemCategory: data?.itemCategory,
                  },
                });
                setCreateModalOpen(false);
                exportBaseDataToSpreadsheet();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={fulfillModalOpen} onOpenChange={setFulfillModalOpen}>
        <DialogContent>
          <DialogHeading>Fulfill Order</DialogHeading>

          <DialogDescription className="mb-4 max-w-xl">
            You are about to fulfill the order{' '}
            <span className="text-primary-500">
              {fulfillModalState?.message}
            </span>{' '}
            for
            <span className="text-green-500">
              {' '}
              {fulfillModalState.discordUserName}
            </span>
          </DialogDescription>

          <label className="mb-2 cursor-pointer hover:text-primary-500">
            <input
              type="radio"
              checked={fulfillModalState?.fulfillment === 'DM'}
              onChange={() =>
                setFulfillModalState({
                  ...fulfillModalState,
                  fulfillment: 'DM',
                })
              }
            />
            <span className="ml-2">Direct Message</span>
          </label>
          <label className="mb-4 cursor-pointer hover:text-primary-500">
            <input
              type="radio"
              disabled={
                !fulfillModalState.recipientInSmolGuild ||
                !fulfillModalState.fulfillerInSmolGuild
              }
              checked={fulfillModalState?.fulfillment === 'gstash'}
              onChange={() =>
                setFulfillModalState({
                  ...fulfillModalState,
                  fulfillment: 'gstash',
                })
              }
            />
            <span
              className={`ml-2 ${
                (!fulfillModalState.recipientInSmolGuild ||
                  !fulfillModalState.fulfillerInSmolGuild) &&
                'text-primary-900'
              }`}
            >
              Guild Stash 1
            </span>
          </label>
          {!fulfillModalState.recipientInSmolGuild && (
            <div className="mb-4 flex flex-col">
              <span className="mb-2 text-red-400">
                {fulfillModalState.discordUserName} is not in the Smol Guild
              </span>
              {!fulfillModalState.fulfillerInSmolGuild && (
                <>
                  <span className="mb-2 font-bold text-red-400">
                    YOU are not in the Smol Guild
                  </span>
                  <div>
                    (for smol-app to pickup your guild{' '}
                    <a href="/poe-profile">please go here</a> and{' '}
                    <span className="text-primary-500">Save your Guild</span>)
                  </div>
                </>
              )}
            </div>
          )}

          <Button
            onClick={() => handleOrderFulfillment()}
            disabled={fulfillmentInProgress}
          >
            {fulfillmentInProgress ? 'Fulfilling...' : 'Fulfill'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
