import { useQuery, useSubscription } from '@apollo/client';
import { useStore } from '@nanostores/react';
import { IconRefresh } from '@tabler/icons-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { farmFilterStore } from '../../../_state/farm';
import {
  atlasSimilarity,
  loadAtlasData,
  strategyOf,
  summariseTree,
  type AtlasData,
  type AtlasTree,
} from '../../../_utils/atlas';
import {
  AtlasSnapshotsDocument,
  LeagueDocument,
  UsersSubDocument,
  type AtlasSnapshotsSubscription,
  type AtlasSnapshotsSubscriptionVariables,
  type LeagueQuery,
  type UsersSubSubscription,
} from '../../../graphql-api';
import { useAtlasConnection } from '../../../hooks/useAtlasConnection';
import { startAtlasConnect } from '../../auth/poe-auth/PoEAuth';
import { AtlasTreeDefs } from '../atlas/AtlasTree';
import {
  GuildAtlasDialog,
  MemberAtlasDialog,
  type GuildHeat,
} from '../farm/AtlasDialog';
import { GuildOverview } from '../farm/GuildOverview';
import { MemberCard } from '../farm/MemberCard';
import type { FarmMember, FarmTree } from '../farm/types';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

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

type Open = { kind: 'member'; userId: string; tree: number } | { kind: 'guild' };

export const FarmBoard = () => {
  const myUserId = localStorage.getItem('hasura_user_id')?.trim();

  const { data: userData, loading: usersLoading } =
    useSubscription<UsersSubSubscription>(UsersSubDocument);
  const { data: leagueData } = useQuery<LeagueQuery>(LeagueDocument);
  const league = leagueData?.app_config_by_pk?.league_name ?? '';
  const gameVersion = leagueData?.app_config_by_pk?.game_version;

  const { data: snapshotData } = useSubscription<
    AtlasSnapshotsSubscription,
    AtlasSnapshotsSubscriptionVariables
  >(AtlasSnapshotsDocument, { variables: { league }, skip: !league });

  const {
    connection,
    syncNow,
    disconnect,
    pinTree,
    busy,
    error: actionError,
  } = useAtlasConnection();
  const selected = useStore(farmFilterStore);
  const [open, setOpen] = useState<Open>();

  // ---- the atlas tree of the league's game version --------------------------
  // undefined while loading, null when this build has no tree for it
  const [data, setData] = useState<AtlasData | null>();
  useEffect(() => {
    if (!gameVersion) return;
    let live = true;
    setData(undefined);
    void loadAtlasData(gameVersion).then((loaded) => live && setData(loaded ?? null));
    return () => {
      live = false;
    };
  }, [gameVersion]);

  // ---- members who share an atlas with points in it ------------------------
  const { members, resyncing } = useMemo(() => {
    const users = new Map((userData?.user ?? []).map((user) => [user.id, user]));
    const built: FarmMember[] = [];
    // synced before the league's game version changed: their hashes belong to
    // the old tree, and the next sync replaces them
    let resyncing = 0;
    if (!data) return { members: built, resyncing };

    for (const snapshot of snapshotData?.atlas_snapshot ?? []) {
      const user = users.get(snapshot.user_id);
      if (!user) continue;
      if (snapshot.tree_version !== data.version) {
        resyncing++;
        continue;
      }
      const trees: FarmTree[] = (snapshot.trees as AtlasTree[])
        .map((tree, index) => ({
          index,
          tree,
          summary: summariseTree(tree, data),
          hashes: new Set(tree.hashes),
        }))
        .filter(({ summary }) => summary.allocated > 0)
        .sort((a, b) => b.summary.allocated - a.summary.allocated);
      if (!trees.length) continue;

      const pinned = trees.findIndex(({ index }) => index === snapshot.pinned_tree);
      const flagged = trees.findIndex(({ tree }) => tree.active);
      const edited = trees.reduce(
        (latest, { tree }, index) =>
          tree.changed_at &&
          (latest < 0 || tree.changed_at > (trees[latest].tree.changed_at ?? ''))
            ? index
            : latest,
        -1,
      );
      const [mainIndex, mainSource]: [number, FarmMember['mainSource']] =
        pinned >= 0
          ? [pinned, 'pinned']
          : flagged >= 0
            ? [flagged, 'selected']
            : edited >= 0
              ? [edited, 'edited']
              : [0, 'points'];
      const main = trees[mainIndex];
      built.push({
        user,
        fetchedAt: snapshot.fetched_at,
        data,
        trees,
        mainIndex,
        mainSource,
        hashes: main.hashes,
        strategy: new Set(strategyOf(main.summary).map(({ key }) => key)),
      });
    }

    // most like me first, when I share; otherwise freshest first
    const mine = built.find(({ user }) => user.id === myUserId);
    for (const member of built) {
      if (mine && member !== mine) {
        member.similarity = atlasSimilarity(mine.hashes, member.hashes);
      }
    }
    built.sort((a, b) => {
      if ((a === mine) !== (b === mine)) return a === mine ? -1 : 1;
      if (mine) return (b.similarity ?? 0) - (a.similarity ?? 0);
      return a.fetchedAt < b.fetchedAt ? 1 : -1;
    });
    return { members: built, resyncing };
  }, [userData, snapshotData, data, myUserId]);

  // everyone's main tree overlaid
  const heat = useMemo<GuildHeat | undefined>(() => {
    if (!data || !members.length) return undefined;
    const counts = new Map<number, number>();
    for (const { hashes } of members) {
      for (const hash of hashes) counts.set(hash, (counts.get(hash) ?? 0) + 1);
    }
    return { data, counts, members: members.length };
  }, [members, data]);

  const visible = members.filter(
    ({ user, strategy }) =>
      user.id === myUserId || selected.every((mechanic) => strategy.has(mechanic)),
  );

  const toggleFilter = (mechanic: string) =>
    farmFilterStore.set(
      selected.includes(mechanic)
        ? selected.filter((key) => key !== mechanic)
        : [...selected, mechanic],
    );

  if (usersLoading || !userData) {
    return (
      <div className="mt-24 flex w-full justify-center">
        <Spinner />
      </div>
    );
  }

  const needsReconnect = connection?.last_error === 'reconnect_needed';
  const openMember =
    open?.kind === 'member'
      ? members.find(({ user }) => user.id === open.userId)
      : undefined;
  const notSharing = userData.user.length - (snapshotData?.atlas_snapshot.length ?? 0);

  return (
    <div className="mt-6 flex w-full flex-col gap-6 px-4 pb-16">
      {data && <AtlasTreeDefs data={data} />}

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

      {data === null && (
        <div className="text-sm text-red-400">
          No atlas tree for game version {gameVersion} in this build
        </div>
      )}

      {data && members.length > 0 && (
        <GuildOverview
          members={members}
          data={data}
          heat={heat}
          selected={selected}
          onToggle={toggleFilter}
          onClear={() => farmFilterStore.set([])}
          onOpenHeat={() => setOpen({ kind: 'guild' })}
          onOpenMember={(member) =>
            setOpen({ kind: 'member', userId: member.user.id, tree: member.mainIndex })
          }
        />
      )}

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-primary-800">
        <span>
          {visible.length === members.length
            ? `${members.length} sharing`
            : `${visible.length} of ${members.length} sharing`}
        </span>
        {notSharing > 0 && <span>{notSharing} not sharing</span>}
        {resyncing > 0 && <span>{resyncing} waiting to resync for {gameVersion}</span>}
        {data === undefined && <Spinner width={16} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visible.map((member) => (
          <MemberCard
            key={member.user.id}
            member={member}
            isMe={member.user.id === myUserId}
            onPin={pinTree}
            onOpen={(tree) =>
              setOpen({ kind: 'member', userId: member.user.id, tree })
            }
          />
        ))}
      </div>

      {openMember && open?.kind === 'member' && (
        <MemberAtlasDialog
          member={openMember}
          initialTree={open.tree}
          onClose={() => setOpen(undefined)}
        />
      )}
      {open?.kind === 'guild' && heat && (
        <GuildAtlasDialog heat={heat} onClose={() => setOpen(undefined)} />
      )}
    </div>
  );
};
