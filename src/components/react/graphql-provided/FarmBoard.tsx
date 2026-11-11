import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { useStore } from '@nanostores/react';
import { IconRefresh, IconTrash } from '@tabler/icons-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { farmFilterStore } from '../../../_state/farm';
import {
  CURRENT_ATLAS_VERSION,
  loadAtlasData,
  strategyOf,
  summariseTree,
  type AtlasData,
  type AtlasTree,
  type TreeSummary,
} from '../../../_utils/atlas';
import {
  AtlasSnapshotsDocument,
  DeleteUserLeagueMechanicDocument,
  InsertUserLeagueMechanicDocument,
  LeagueDocument,
  LeaguesDocument,
  UsersSubDocument,
  type AtlasSnapshotsSubscription,
  type AtlasSnapshotsSubscriptionVariables,
  type DeleteUserLeagueMechanicMutation,
  type DeleteUserLeagueMechanicMutationVariables,
  type InsertUserLeagueMechanicMutation,
  type InsertUserLeagueMechanicMutationVariables,
  type League_Type_Enum,
  type LeagueQuery,
  type LeaguesQuery,
  type UsersSubSubscription,
} from '../../../graphql-api';
import { useAtlasConnection } from '../../../hooks/useAtlasConnection';
import { startAtlasConnect } from '../../auth/poe-auth/PoEAuth';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';

type FarmUser = UsersSubSubscription['user'][number];
type Snapshot = AtlasSnapshotsSubscription['atlas_snapshot'][number];

type FarmRow = {
  user: FarmUser;
  snapshot?: Snapshot;
  /** undefined while the lookup for the snapshot's tree version is loading */
  trees?: TreeSummary[];
  /** tree version with no generated lookup in this build */
  unsupportedVersion?: string;
  deduced: Set<string>;
  tagged: Set<string>;
};

const MechanicChip = ({
  mechanic,
  label,
  hasIcon,
  share,
  title,
  muted,
}: {
  mechanic: string;
  label: string;
  hasIcon: boolean;
  share?: number;
  title?: string;
  muted?: boolean;
}) => (
  <span
    title={title}
    className={twMerge(
      'flex items-center gap-1.5 rounded border border-primary-900 bg-gray-900 px-2 py-1 text-sm',
      muted && 'border-gray-700 opacity-70',
    )}
  >
    {hasIcon && (
      <img src={`/league-icons/${mechanic}.webp`} alt="" className="h-6 w-6" />
    )}
    <span className="text-primary-500">{label}</span>
    {share !== undefined && (
      <span className="text-primary-800">{Math.round(share * 100)}%</span>
    )}
  </span>
);

// The opt-in. Sharing means the server keeps a PoE token for the member, so
// this spells out exactly what that token is and does before they approve it
// on pathofexile.com. Keep it in step with POE_ATLAS_SCOPES, the sync
// schedule in netlify/functions/sync-atlas.ts and removeConnection().
const ShareAtlasPanel = () => (
  <section className="max-w-3xl rounded border border-primary-900 bg-gray-900 p-4">
    <h2 className="m-0 text-lg text-primary-500">Share your atlas</h2>
    <dl className="my-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
      <dt className="text-primary-800">Guild sees</dt>
      <dd className="m-0">
        The mechanics and keystones your atlas trees are built around.
      </dd>
      <dt className="text-primary-800">You approve</dt>
      <dd className="m-0">
        One Path of Exile permission: reading your league account, which is
        where your atlas passive trees are. It cannot read your stash,
        characters or profile, and cannot change anything.
      </dd>
      <dt className="text-primary-800">Server keeps</dt>
      <dd className="m-0">
        An access key limited to that permission, stored encrypted. It is
        used to re-read your atlas every 30 minutes, so the page stays
        current without you opening it.
      </dd>
      <dt className="text-primary-800">To stop</dt>
      <dd className="m-0">
        "Stop sharing" on this page revokes the key and deletes it and your
        atlas from the app.
      </dd>
    </dl>
    <Button
      className="px-3 py-2 leading-5 text-primary-500"
      onClick={() => void startAtlasConnect()}
    >
      Share my atlas
    </Button>
  </section>
);

export const FarmBoard = () => {
  const myUserId = localStorage.getItem('hasura_user_id')?.trim();

  const { data: userData, loading: usersLoading } =
    useSubscription<UsersSubSubscription>(UsersSubDocument);
  const { data: leagueTypes } = useQuery<LeaguesQuery>(LeaguesDocument);
  const { data: leagueData } = useQuery<LeagueQuery>(LeagueDocument);
  const league = leagueData?.app_config_by_pk?.league_name ?? '';

  const { data: snapshotData } = useSubscription<
    AtlasSnapshotsSubscription,
    AtlasSnapshotsSubscriptionVariables
  >(AtlasSnapshotsDocument, { variables: { league }, skip: !league });

  const [insertTag] = useMutation<
    InsertUserLeagueMechanicMutation,
    InsertUserLeagueMechanicMutationVariables
  >(InsertUserLeagueMechanicDocument);
  const [deleteTag] = useMutation<
    DeleteUserLeagueMechanicMutation,
    DeleteUserLeagueMechanicMutationVariables
  >(DeleteUserLeagueMechanicDocument);

  const {
    connection,
    syncNow,
    disconnect,
    busy,
    error: actionError,
  } = useAtlasConnection();
  const selected = useStore(farmFilterStore);

  // ---- atlas lookups, one per tree version in use -------------------------
  const [atlasByVersion, setAtlasByVersion] = useState<
    Record<string, AtlasData | null>
  >({});
  const versionsNeeded = useMemo(
    () => [
      ...new Set([
        CURRENT_ATLAS_VERSION,
        ...(snapshotData?.atlas_snapshot ?? []).map((s) => s.tree_version),
      ]),
    ],
    [snapshotData],
  );
  useEffect(() => {
    for (const version of versionsNeeded) {
      if (version in atlasByVersion) continue;
      void loadAtlasData(version).then((data) =>
        // null = this build has no lookup for that version
        setAtlasByVersion((current) => ({ ...current, [version]: data ?? null })),
      );
    }
  }, [versionsNeeded]);

  const labels = atlasByVersion[CURRENT_ATLAS_VERSION]?.mechanics ?? {};
  const labelOf = (mechanic: string) => labels[mechanic] ?? mechanic;
  // the league_type enum doubles as the list of mechanics that have an icon
  const iconMechanics = useMemo(
    () => new Set((leagueTypes?.league_type ?? []).map(({ value }) => value)),
    [leagueTypes],
  );

  const rows = useMemo<FarmRow[]>(() => {
    const snapshots = new Map(
      (snapshotData?.atlas_snapshot ?? []).map((s) => [s.user_id, s]),
    );
    return (userData?.user ?? []).map((user) => {
      const snapshot = snapshots.get(user.id);
      const data = snapshot ? atlasByVersion[snapshot.tree_version] : undefined;
      const trees =
        snapshot && data
          ? (snapshot.trees as AtlasTree[])
              .map((tree) => summariseTree(tree, data))
              .filter((tree) => tree.allocated > 0 || tree.unknown > 0)
          : undefined;
      return {
        user,
        snapshot,
        trees,
        unsupportedVersion:
          snapshot && data === null ? snapshot.tree_version : undefined,
        deduced: new Set(
          (trees ?? []).flatMap((tree) => strategyOf(tree).map(({ key }) => key)),
        ),
        tagged: new Set<string>(
          user.user_league_mechanics.map(({ mechanic }) => mechanic),
        ),
      };
    });
  }, [userData, snapshotData, atlasByVersion]);

  // only members with something to show, me first, most recently synced next
  const activeRows = useMemo(
    () =>
      rows
        .filter(
          ({ user, snapshot, tagged }) =>
            user.id === myUserId || snapshot || tagged.size > 0,
        )
        .sort((a, b) => {
          if ((a.user.id === myUserId) !== (b.user.id === myUserId)) {
            return a.user.id === myUserId ? -1 : 1;
          }
          const aTime = a.snapshot?.fetched_at ?? '';
          const bTime = b.snapshot?.fetched_at ?? '';
          if (aTime !== bTime) return aTime < bTime ? 1 : -1;
          return (a.user.discord_name ?? '').localeCompare(b.user.discord_name ?? '');
        }),
    [rows, myUserId],
  );

  const overview = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { deduced, tagged } of activeRows) {
      for (const mechanic of new Set([...deduced, ...tagged])) {
        counts.set(mechanic, (counts.get(mechanic) ?? 0) + 1);
      }
    }
    return [...counts].sort(
      (a, b) => b[1] - a[1] || labelOf(a[0]).localeCompare(labelOf(b[0])),
    );
  }, [activeRows, labels]);

  const visibleRows = activeRows.filter(
    ({ user, deduced, tagged }) =>
      user.id === myUserId ||
      selected.every((mechanic) => deduced.has(mechanic) || tagged.has(mechanic)),
  );

  const toggleFilter = (mechanic: string) =>
    farmFilterStore.set(
      selected.includes(mechanic)
        ? selected.filter((key) => key !== mechanic)
        : [...selected, mechanic],
    );

  if (usersLoading || !userData) {
    return (
      <div className="mt-48 flex w-full justify-center">
        <Spinner />
      </div>
    );
  }

  const needsReconnect = connection?.last_error === 'reconnect_needed';

  return (
    <div className="mt-48 flex w-full flex-col gap-6 px-4">
      {/* my atlas */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="m-0">Farm</h1>
        {connection && !needsReconnect && (
          <>
            <Button
              className="flex items-center gap-2 px-3 py-2 leading-5 text-primary-500"
              disabled={!!busy}
              onClick={() => void syncNow()}
            >
              <IconRefresh size={16} />
              {busy === 'sync' ? 'Syncing…' : 'Sync now'}
            </Button>
            <span className="text-sm text-primary-800">
              {connection.last_error === 'no_league_account'
                ? 'No character in the league yet'
                : connection.last_synced_at
                  ? `Synced ${formatDistanceToNowStrict(
                      new Date(connection.last_synced_at),
                      { addSuffix: true },
                    )}, refreshes every 30 minutes`
                  : 'Not synced yet'}
            </span>
          </>
        )}
        {needsReconnect && (
          <>
            <span className="text-sm text-red-400">
              Path of Exile no longer accepts your atlas key
            </span>
            <Button
              className="px-3 py-2 leading-5 text-primary-500"
              onClick={() => void startAtlasConnect()}
            >
              Reconnect atlas
            </Button>
          </>
        )}
        {connection && (
          <button
            type="button"
            disabled={!!busy}
            onClick={() => void disconnect()}
            className="bg-transparent px-2 text-sm text-primary-800 underline hover:bg-transparent hover:text-primary-300"
          >
            {busy === 'disconnect' ? 'Stopping…' : 'Stop sharing'}
          </button>
        )}
        {connection?.last_error &&
          !needsReconnect &&
          connection.last_error !== 'no_league_account' && (
            <span className="text-sm text-red-400">Last sync failed</span>
          )}
        {actionError?.kind === 'rate-limited' && (
          <span className="text-sm text-red-400">
            Try again in {actionError.retryAfterSeconds}s
          </span>
        )}
        {actionError?.kind === 'failed' && (
          <span className="text-sm text-red-400">That didn't work, try again</span>
        )}
      </div>

      {myUserId && connection === null && <ShareAtlasPanel />}

      {/* guild overview */}
      {overview.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {overview.map(([mechanic, count]) => {
            const active = selected.includes(mechanic);
            return (
              <button
                key={mechanic}
                type="button"
                aria-pressed={active}
                onClick={() => toggleFilter(mechanic)}
                className={twMerge(
                  'flex items-center gap-2 rounded border px-3 py-2',
                  active
                    ? 'border-primary-500 bg-gray-800'
                    : 'border-primary-900 bg-gray-900 hover:border-primary-800',
                )}
              >
                {iconMechanics.has(mechanic) && (
                  <img
                    src={`/league-icons/${mechanic}.webp`}
                    alt=""
                    className="h-8 w-8"
                  />
                )}
                <span className="text-primary-500">{labelOf(mechanic)}</span>
                <span className="text-primary-800">{count}</span>
              </button>
            );
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => farmFilterStore.set([])}
              className="bg-transparent px-2 text-sm text-primary-800 underline hover:bg-transparent hover:text-primary-300"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* members */}
      <table className="w-full table-auto border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-sm text-primary-800">
            <th className="w-48 font-normal">Member</th>
            <th className="font-normal">Atlas</th>
            <th className="hidden font-normal lg:table-cell">Keystones</th>
            <th className="font-normal">Tagged</th>
            <th className="hidden w-28 font-normal md:table-cell">Synced</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map(
            ({ user, snapshot, trees, unsupportedVersion, deduced, tagged }) => {
              const isMe = user.id === myUserId;
              const untagged = (leagueTypes?.league_type ?? [])
                .filter(({ value }) => !tagged.has(value))
                .map(({ value }) => ({
                  value,
                  display: labelOf(value),
                  imgSrc: `/league-icons/${value}.webp`,
                }))
                .sort((a, b) => a.display.localeCompare(b.display));

              return (
                <tr key={user.id} className="align-top">
                  <td>
                    <div className="flex items-center gap-2">
                      {user.discord_avatar ? (
                        <img
                          className="h-8 w-8 rounded-full"
                          src={`https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.discord_avatar}.png`}
                          alt=""
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-discord-500">
                          <img src="/discord-logo.svg" className="h-4" alt="" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="truncate">
                          {user.discord_name ?? user.poe_name}
                          {isMe && (
                            <span className="ml-1 text-primary-500">(you)</span>
                          )}
                        </div>
                        {user.poe_name && (
                          <a
                            className="block truncate text-xs"
                            href={`https://www.pathofexile.com/account/view-profile/${user.poe_name.replace('#', '-')}`}
                            target="_blank"
                          >
                            {user.poe_name}
                          </a>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    {!snapshot ? (
                      <span className="text-sm text-primary-900">Not shared</span>
                    ) : unsupportedVersion ? (
                      <span className="text-sm text-primary-900">
                        Atlas {unsupportedVersion} not supported
                      </span>
                    ) : !trees ? (
                      <Spinner width={20} />
                    ) : trees.length === 0 ? (
                      <span className="text-sm text-primary-900">
                        No atlas points allocated
                      </span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {trees.map((tree, index) => {
                          const strategy = strategyOf(tree);
                          const minor = tree.mechanics.filter(
                            (mechanic) => !strategy.includes(mechanic),
                          );
                          return (
                            <div key={index} className="flex flex-col gap-1">
                              {trees.length > 1 && (
                                <span className="text-xs text-primary-800">
                                  {tree.name} · {tree.allocated} points
                                </span>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {strategy.map((mechanic) => (
                                  <MechanicChip
                                    key={mechanic.key}
                                    mechanic={mechanic.key}
                                    label={mechanic.label}
                                    hasIcon={iconMechanics.has(mechanic.key)}
                                    share={mechanic.share}
                                    title={mechanic.highlights.join('\n')}
                                  />
                                ))}
                                {minor.length > 0 && (
                                  <span
                                    className="self-center text-xs text-primary-800"
                                    title={minor
                                      .map(
                                        ({ label, share }) =>
                                          `${label} ${Math.round(share * 100)}%`,
                                      )
                                      .join('\n')}
                                  >
                                    +{minor.length} minor
                                  </span>
                                )}
                              </div>
                              {tree.unknown > 0 && (
                                <span className="text-xs text-red-400">
                                  {tree.unknown} unrecognised nodes
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </td>

                  <td className="hidden lg:table-cell">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        ...new Map(
                          (trees ?? [])
                            .flatMap((tree) => tree.keystones)
                            .map((keystone) => [keystone.name, keystone]),
                        ).values(),
                      ].map((keystone) => (
                        <span
                          key={keystone.name}
                          title={labelOf(keystone.mechanic)}
                          className="rounded border border-gray-700 px-1.5 py-0.5 text-xs text-primary-600"
                        >
                          {keystone.name}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      {[...user.user_league_mechanics]
                        .sort((a, b) => a.mechanic.localeCompare(b.mechanic))
                        .map(({ mechanic, id }) => (
                          <div className="relative h-8 w-8" key={id}>
                            <img
                              title={labelOf(mechanic)}
                              src={`/league-icons/${mechanic}.webp`}
                              alt={labelOf(mechanic)}
                              className={
                                deduced.has(mechanic) ? 'opacity-50' : undefined
                              }
                            />
                            {isMe && (
                              <button
                                aria-label={`Remove ${labelOf(mechanic)}`}
                                className="absolute -right-2 -top-2 rounded-full bg-primary-900 p-0.5 text-primary-500 opacity-60 hover:text-primary-300 hover:opacity-100"
                                onClick={() =>
                                  deleteTag({ variables: { mechanicId: id } })
                                }
                              >
                                <IconTrash size={14} />
                              </button>
                            )}
                          </div>
                        ))}
                      {isMe && (
                        <Select
                          onSelectChange={(value) =>
                            value &&
                            insertTag({
                              variables: {
                                mechanic: value as League_Type_Enum,
                                userId: user.id,
                              },
                            })
                          }
                          placeholder="Add"
                          showSelected={false}
                          options={untagged}
                        />
                      )}
                    </div>
                  </td>

                  <td className="hidden text-sm text-primary-800 md:table-cell">
                    {snapshot &&
                      formatDistanceToNowStrict(new Date(snapshot.fetched_at), {
                        addSuffix: true,
                      })}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table>
    </div>
  );
};
