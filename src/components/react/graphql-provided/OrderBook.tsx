import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useStore } from '@nanostores/react';
import { discordStore } from '../../../_state/discord.state';
import {
  DeleteUserItemOrderDocument,
  DeleteUserItemOrderMutation,
  DeleteUserItemOrderMutationVariables,
  FulfillUserItemOrderDocument,
  FulfillUserItemOrderMutation,
  FulfillUserItemOrderMutationVariables,
  InsertUserItemOrderDocument,
  InsertUserItemOrderMutation,
  InsertUserItemOrderMutationVariables,
  Item_Order_Type_Enum,
  OrderTypesDocument,
  OrderTypesQuery,
  UpdateUserItemOrderDocument,
  UpdateUserItemOrderMutation,
  UpdateUserItemOrderMutationVariables,
  UserItemOrdersDocument,
  UserItemOrdersSubscription,
} from '../../../graphql-api';
import { Spinner } from '../ui/Spinner';

import { IconTrash } from '@tabler/icons-react';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en.json';
import { useMemo, useState } from 'react';
import ReactTimeAgo from 'react-time-ago';
import invariant from 'tiny-invariant';
import {
  orderBookShowFulfilledStore,
  orderBookTypeFiltersStore,
} from '../../../_state/order-book';
import { useMyHasuraId } from '../../../hooks/useMyHasuraId';
import { Button } from '../ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeading,
} from '../ui/Dialog';
import { OrderBookFilters } from './OrderBookFilters';
import { OrderForm, type OrderFormInputs } from './OrderForm';
TimeAgo.addDefaultLocale(en);

export const OrderBook = () => {
  const { data: orders, loading } = useSubscription<UserItemOrdersSubscription>(
    UserItemOrdersDocument
  );

  const { data: orderTypes } = useQuery<OrderTypesQuery>(OrderTypesDocument);

  const showFulfilled = useStore(orderBookShowFulfilledStore);
  const typeFilters = useStore(orderBookTypeFiltersStore);

  const filteredOrders = useMemo(() => {
    let result = orders?.user_item_order;

    if (!showFulfilled) {
      result = result?.filter(({ fulfilled_by_user }) => !fulfilled_by_user);
    }

    result = result?.filter(({ type }) => {
      const enabledOrderTypes = Object.entries(typeFilters)
        .filter(([_, value]) => !!value)
        .map(([type]) => type);

      return enabledOrderTypes.includes(type);
    });

    return result;
  }, [showFulfilled, typeFilters, loading, orders]);

  const myUserId = useMyHasuraId();

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

  const { id: myDiscordId } = useStore(discordStore);

  const [fulfillModalOpen, setFulfillModalOpen] = useState(false);
  const [fulfillModalState, setFulfillModalState] = useState<{
    orderId: string;
    discordUserId: string;
    message: string;
    fulfillment: 'DM' | 'gstash';
  }>({
    discordUserId: '',
    fulfillment: 'gstash',
    message: '',
    orderId: '',
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
        fulfilledBy: myUserId,
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

  if (loading) return <Spinner />;
  return (
    <>
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
            <th className="w-20">type</th>
            <th className="w-96"></th>
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
              },
              i
            ) => {
              const isMe = user.discord_user_id === myDiscordId;
              const orderFulfilled = !!fulfilled_by_user;

              return (
                <tr
                  key={i}
                  className={orderFulfilled ? 'bg-gray-900 opacity-60' : ''}
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
                            discordUserId: user.discord_user_id,
                            orderId,
                            message: description,
                            fulfillment: 'gstash',
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
              orderTypes={orderTypes}
              onSubmit={(data) => {
                createItemOrder({
                  variables: {
                    type: data.type ?? Item_Order_Type_Enum.Other,
                    description: data.description as string,
                    linkUrl: data.linkUrl ?? '',
                    userId: myUserId,
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
          <DialogDescription className="mb-4">
            You are about to fulfill an order for{' '}
            <span className="text-primary-500">
              {fulfillModalState?.message}
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
              checked={fulfillModalState?.fulfillment === 'gstash'}
              onChange={() =>
                setFulfillModalState({
                  ...fulfillModalState,
                  fulfillment: 'gstash',
                })
              }
            />
            <span className="ml-2">Guild Stash 1</span>
          </label>

          <Button onClick={() => handleOrderFulfillment()}>Fulfill</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};