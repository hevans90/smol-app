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
import { useMemo, useState } from 'react';
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
import { OrderBookFilters } from './OrderBookFilters';
import { OrderForm, type OrderFormInputs } from './OrderForm';
TimeAgo.addLocale(en);

const priorityOrderLimit = 2;

export const OrderBook = () => {
  const { data: orders, loading } = useSubscription<UserItemOrdersSubscription>(
    UserItemOrdersDocument
  );

  const { data: orderTypes } = useQuery<OrderTypesQuery>(OrderTypesDocument);

  const { id: myDiscordId } = useStore(discordStore);
  const fuzzyQuery = useStore(orderBookFuzzySearchStore);
  const showInactive = useStore(orderBookShowInactiveStore);
  const showFulfilled = useStore(orderBookShowFulfilledStore);
  const typeFilters = useStore(orderBookTypeFiltersStore);

  const filteredOrders = useMemo(() => {
    let result = orders?.user_item_order;

    if (!showFulfilled) {
      result = result?.filter(({ fulfilled_by_user }) => !fulfilled_by_user);
    }
    if (!showInactive) {
      result = result?.filter(
        ({ priority, updated_at }) =>
          priority || isAfter(new Date(updated_at), subWeeks(new Date(), 1))
      );
    }

    result = result?.filter(({ type }) => {
      const enabledOrderTypes = Object.entries(typeFilters)
        .filter(([_, value]) => !!value)
        .map(([type]) => type);

      return enabledOrderTypes.includes(type);
    });
    if (result && fuzzyQuery) {
      result = fuzzySearch(fuzzyQuery, result, {
        keySelector: (order) => [
          order.description as string,
          order.user.discord_name as string,
        ],
        threshold: 0.9,
        ignoreSymbols: false,
      });
    }

    return result;
  }, [showFulfilled, showInactive, typeFilters, loading, orders, fuzzyQuery]);

  const myUnfilfilledPriorityOrders = useMemo(
    () =>
      filteredOrders?.filter(
        (order) =>
          order.user.discord_user_id === myDiscordId &&
          !order?.fulfilled_by_user
      ),
    [filteredOrders]
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

  const handleOrderFulfillment = async () => {
    invariant(fulfillModalState);
    await notifyDiscordUser(fulfillModalState);

    await fulfillItemOrder({
      variables: {
        fulfilledBy: userProfile?.id as string,
        orderId: fulfillModalState.orderId,
      },
    });

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

  if (loading || userLoading) return <Spinner />;
  return (
    <>
      <div className="flex items-center mb-2 gap-6">
        <h1 className="mb-0">Item Orders</h1>
        <div className="flex items-center gap-2">
          <IconSearch />
          <input
            placeholder="search by user or description"
            defaultValue={fuzzyQuery}
            onChange={(e) =>
              orderBookFuzzySearchStore.set(e.target.value.trim())
            }
            className="border-primary-800 bg-gray-800 grow border-[1px] min-w-[10rem] md:min-w-[15rem] lg:min-w-[25rem] "
          ></input>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          className="text-xl h-auto"
          onClick={() => {
            setCreateModalOpen(true);
          }}
        >
          Create Order
        </Button>
        {orderTypes && <OrderBookFilters orderTypes={orderTypes} />}
      </div>
      <table className="my-4 table-auto w-full">
        <thead>
          <tr className="border-b-primary-800 border-b-[1px]">
            <th className="w-44">
              <div className="flex items-center gap-2 mb-2">
                <img src="/discord-logo.svg" className="h-8" />
              </div>
            </th>
            <th></th>
            <th className="w-20">type</th>
            <th className="w-96">description</th>
            <th className="hidden lg:table-cell">updated</th>
            <th></th>
            <th></th>
            <th></th>
            <th className="w-44 ">fulfilled by</th>
          </tr>
        </thead>
        <tbody>
          {filteredOrders?.map(
            (
              {
                description,
                link_url,
                updated_at,
                id: orderId,
                user,
                fulfilled_by_user,
                type,
                priority,
              },
              i
            ) => {
              const guild = 'Smol Groop Found';
              const inSmolGuild = user.guild === guild;
              const myUserIsInSmolGuild = userProfile?.guild === guild;
              const isMe = user.discord_user_id === myDiscordId;
              const orderFulfilled = !!fulfilled_by_user;

              return (
                <tr
                  key={i}
                  className={
                    orderFulfilled
                      ? 'bg-gray-900 opacity-60'
                      : inSmolGuild
                      ? 'bg-primary-900 bg-opacity-20'
                      : ''
                  }
                >
                  <td>
                    <div
                      className={`flex items-center gap-2 my-2 ${
                        i === 0 && 'mt-4'
                      }`}
                    >
                      {user?.discord_user_id ? (
                        <>
                          {user.discord_avatar ? (
                            <img
                              className="rounded-full h-8 w-8"
                              src={`https://cdn.discordapp.com/avatars/${user?.discord_user_id}/${user?.discord_avatar}.png`}
                            />
                          ) : (
                            <div className="rounded-full bg-discord-500 h-8 w-8 flex items-center justify-center">
                              <img src="/discord-logo.svg" className="h-4" />
                            </div>
                          )}

                          {user?.discord_name}
                          {isMe && (
                            <div className="text-primary-500">(you)</div>
                          )}
                        </>
                      ) : (
                        'no discord linked'
                      )}
                    </div>
                  </td>

                  <td>
                    {priority ? (
                      <div title="priority order">
                        <IconAlertCircle />
                      </div>
                    ) : null}
                  </td>

                  <td>
                    <div className="flex justify-center">
                      <img
                        className="w-10 h-10 md:w-12 md:h-12 p-1"
                        src={`/order-types/${type}.webp`}
                      />
                    </div>
                  </td>

                  <td>
                    {link_url ? (
                      <a href={link_url} target="_blank">
                        {description}
                      </a>
                    ) : (
                      description
                    )}
                  </td>

                  <td className="text-center hidden lg:table-cell">
                    <ReactTimeAgo date={new Date(updated_at)} locale="en-GB" />
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
                            });
                          }}
                        >
                          Update
                        </Button>
                      </>
                    )}
                  </td>
                  <td>
                    {isMe && !orderFulfilled && (
                      <button
                        className="p-1 opacity-50 rounded-full bg-primary-900  text-primary-500 hover:text-primary-300 hover:opacity-75"
                        onClick={() =>
                          deleteItemOrder({
                            variables: { orderId },
                          })
                        }
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
                  <td>
                    <div
                      className={`flex items-center gap-2 my-2 ${
                        i === 0 && 'mt-4'
                      }`}
                    >
                      {fulfilled_by_user && (
                        <>
                          {fulfilled_by_user.discord_avatar ? (
                            <img
                              className="rounded-full h-8 w-8"
                              src={`https://cdn.discordapp.com/avatars/${fulfilled_by_user.discord_user_id}/${fulfilled_by_user.discord_avatar}.png`}
                            />
                          ) : (
                            <div className="rounded-full bg-discord-500 h-8 w-8 flex items-center justify-center">
                              <img src="/discord-logo.svg" className="h-4" />
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
                </tr>
              );
            }
          )}
          {!filteredOrders?.length && (
            <tr>
              <td className="text-lg">
                <div className="mt-4">No orders found</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent>
          <DialogHeading>Update Order</DialogHeading>
          {orderTypes && (
            <OrderForm
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
                  },
                });
                setCreateModalOpen(false);
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
            <div className="flex flex-col mb-4">
              <span className="text-red-400 mb-2">
                {fulfillModalState.discordUserName} is not in the Smol Guild
              </span>
              {!fulfillModalState.fulfillerInSmolGuild && (
                <>
                  <span className="text-red-400 mb-2 font-bold">
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

          <Button onClick={() => handleOrderFulfillment()}>Fulfill</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};
