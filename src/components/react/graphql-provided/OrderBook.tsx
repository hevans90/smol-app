import { useMutation, useSubscription } from '@apollo/client';
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
import { useEffect, useState } from 'react';
import ReactTimeAgo from 'react-time-ago';
import { useMyHasuraId } from '../../../hooks/useMyHasuraId';
import { Button } from '../ui/Button';
import { Dialog, DialogContent, DialogHeading } from '../ui/Dialog';
import { OrderForm, type OrderFormInputs } from './OrderForm';
TimeAgo.addDefaultLocale(en);

export const OrderBook = () => {
  const { data: orders, loading } = useSubscription<UserItemOrdersSubscription>(
    UserItemOrdersDocument
  );

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

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateModalState, setUpdateModalState] = useState<
    OrderFormInputs & { orderId: string }
  >();

  useEffect(() => {
    console.log('order book', updateModalOpen);
  }, [updateModalOpen]);

  if (loading) return <Spinner />;
  return (
    <>
      <table className="my-4 table-auto w-full">
        <thead>
          <tr className="border-b-primary-800 border-b-[1px]">
            <th className="w-44">
              <div className="flex items-center gap-2 mb-2">
                <img src="/discord-logo.svg" className="h-8" />
              </div>
            </th>
            <th className="w-44 hidden lg:table-cell">
              <div className="flex items-center gap-2 mb-2">
                <img src="/poe-logo-original.png" className="h-12" />
              </div>
            </th>
            <th>orders</th>
            <th className="hidden lg:table-cell">updated</th>
            <th>
              <Button
                onClick={() => {
                  setCreateModalOpen(true);
                }}
              >
                Create Order
              </Button>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {orders?.user_item_order.map(
            ({ description, link_url, updated_at, id: orderId, user }, i) => {
              const isMe = user.discord_user_id === myDiscordId;

              return (
                <tr key={i}>
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
                  <td className="hidden lg:table-cell">
                    <div
                      className={`flex items-center gap-2 my-2 ${
                        i === 0 && 'mt-4'
                      }`}
                    >
                      <a
                        className="hover:text-primary-500 flex items-center my-1"
                        href={`https://www.pathofexile.com/account/view-profile/${user.poe_name}`}
                        target="_blank"
                      >
                        {user?.poe_name}
                      </a>
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
                    {isMe && (
                      <>
                        <Button
                          onClick={() => {
                            setUpdateModalOpen(true);
                            setUpdateModalState({
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
                    {isMe && (
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
                </tr>
              );
            }
          )}
        </tbody>
      </table>
      <Dialog open={updateModalOpen} onOpenChange={setUpdateModalOpen}>
        <DialogContent>
          <DialogHeading>Update Order</DialogHeading>
          <OrderForm
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
        </DialogContent>
      </Dialog>
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeading>Create Order</DialogHeading>
          <OrderForm
            onSubmit={(data) => {
              createItemOrder({
                variables: {
                  description: data.description as string,
                  linkUrl: data.linkUrl ?? '',
                  userId: myUserId,
                },
              });
              setCreateModalOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
