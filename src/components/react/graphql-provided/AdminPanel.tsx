import { useMutation, useQuery, useSubscription } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { twMerge } from 'tailwind-merge';
import {
  AdminUsersDocument,
  AppConfigDocument,
  KnownLeaguesDocument,
  PipelineStatusDocument,
  SetLeagueDocument,
  SetUserAdminDocument,
  type AdminUsersSubscription,
  type AppConfigSubscription,
  type KnownLeaguesSubscription,
  type PipelineStatusQuery,
  type SetLeagueMutation,
  type SetLeagueMutationVariables,
  type SetUserAdminMutation,
  type SetUserAdminMutationVariables,
} from '../../../graphql-api';
import { useAdminAccess } from '../../../hooks/useAdminAccess';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';

const Card: React.FC<{
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, children, className }) => (
  <section
    className={twMerge(
      'flex flex-col gap-4 rounded-md border border-primary-900 border-opacity-40 bg-gray-900 p-6',
      className,
    )}
  >
    <h2 className="m-0 border-b border-primary-900 border-opacity-40 pb-2 font-fontinSmallcaps text-xl text-primary-500">
      {title}
    </h2>
    {children}
  </section>
);

const LeagueControl = () => {
  const { data, loading } =
    useSubscription<AppConfigSubscription>(AppConfigDocument);
  const { data: leaguesData } =
    useSubscription<KnownLeaguesSubscription>(KnownLeaguesDocument);
  const [setLeague, { loading: saving }] = useMutation<
    SetLeagueMutation,
    SetLeagueMutationVariables
  >(SetLeagueDocument);

  const [draft, setDraft] = useState('');
  // league name awaiting confirmation, from either the swap dropdown or the
  // free-text input
  const [pending, setPending] = useState<string | null>(null);
  const [selectResetKey, setSelectResetKey] = useState(0);

  const config = data?.app_config_by_pk;
  const trimmed = draft.trim();
  const changed = trimmed !== '' && trimmed !== config?.league_name;

  // leagues the app already has ladder data for (minus the active one and a
  // historical garbage row with an empty id from a failed GGG sync)
  const knownLeagues = (leaguesData?.league ?? []).filter(
    (league) => league.id !== '' && league.id !== config?.league_name,
  );

  const reset = () => {
    setPending(null);
    setDraft('');
    setSelectResetKey((key) => key + 1);
  };

  const submit = async () => {
    if (!pending) return;
    try {
      await setLeague({ variables: { leagueName: pending } });
      toast.success('League updated — the server is resyncing now');
      reset();
    } catch (error: any) {
      toast.error(`Could not update league: ${error.message}`);
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div>
        <div className="text-sm text-primary-800 opacity-70">Active league</div>
        <div className="text-lg text-primary-300">{config?.league_name}</div>
        {config?.updated_at && (
          <div className="text-xs text-primary-800 opacity-50">
            last changed {formatDistanceToNow(new Date(config.updated_at))} ago
            {!config.league && ' · no ladder data synced yet'}
          </div>
        )}
      </div>

      {pending ? (
        <div className="flex flex-col gap-2 rounded border border-red-900 border-opacity-60 bg-gray-800 bg-opacity-40 p-3">
          <span className="text-sm text-red-400">
            Switch the whole app to{' '}
            <span className="font-bold text-primary-300">{pending}</span>? This
            repoints the ladder, stats sweep and frontend.
          </span>
          <div className="flex items-center gap-3">
            <button
              className="rounded bg-red-800 px-4 py-2 text-white hover:bg-red-900"
              disabled={saving}
              onClick={submit}
            >
              {saving ? 'Saving…' : 'Confirm'}
            </button>
            <button
              className="rounded bg-gray-800 px-4 py-2 hover:bg-gray-700"
              onClick={reset}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-primary-800">
              Swap to a league the app already has data for
            </label>
            <Select
              key={selectResetKey}
              disabled={knownLeagues.length === 0}
              placeholder={
                knownLeagues.length === 0
                  ? 'No other leagues with data'
                  : 'Select a league…'
              }
              options={knownLeagues.map((league) => ({
                value: league.id,
                display: `${league.id} (${new Date(
                  league.start_at,
                ).toLocaleDateString()} – ${new Date(
                  league.end_at,
                ).toLocaleDateString()})`,
              }))}
              onSelectChange={(value) => value && setPending(value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-primary-800" htmlFor="league-input">
              …or add a new league (exact league id, e.g.{' '}
              <span className="italic">
                SDRT Smol Djinn Rescue Team (PL78726)
              </span>
              )
            </label>
            <input
              id="league-input"
              className="rounded bg-gray-800 px-3 py-2 text-primary-300 placeholder:text-primary-800 placeholder:opacity-40"
              placeholder={config?.league_name}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <button
              className="self-start rounded bg-primary-800 px-4 py-2 text-white enabled:hover:bg-primary-900 disabled:opacity-40"
              disabled={!changed || saving}
              onClick={() => setPending(trimmed)}
            >
              Change league
            </button>
          </div>
        </>
      )}
    </>
  );
};

type AdminUser = AdminUsersSubscription['user'][number];

const displayName = (user: AdminUser) =>
  user.poe_name ?? user.discord_name ?? user.id;

const avatarUrl = (user: AdminUser) =>
  user.discord_avatar && user.discord_user_id
    ? `https://cdn.discordapp.com/avatars/${user.discord_user_id}/${user.discord_avatar}.png`
    : undefined;

const Avatar = ({ user }: { user: AdminUser }) => {
  const src = avatarUrl(user);
  return src ? (
    <img src={src} className="h-6 w-6 shrink-0 rounded-full" />
  ) : (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs text-primary-800">
      {displayName(user).charAt(0).toUpperCase()}
    </span>
  );
};

const AdminUsers = () => {
  const { data, loading } =
    useSubscription<AdminUsersSubscription>(AdminUsersDocument);
  const [setUserAdmin] = useMutation<
    SetUserAdminMutation,
    SetUserAdminMutationVariables
  >(SetUserAdminDocument);

  const myId = localStorage.getItem('hasura_user_id')?.trim();

  const [selectedName, setSelectedName] = useState('');
  // remounts the Select after a grant so its internal selection resets
  const [selectResetKey, setSelectResetKey] = useState(0);

  const users = data?.user ?? [];
  const admins = users.filter((user) => user.admin);
  const candidates = users.filter((user) => !user.admin);

  const setAdmin = async (user: AdminUser, admin: boolean) => {
    const name = displayName(user);
    // also enforced by the hasura update check on user
    if (user.id === myId && !admin) {
      toast.error('You cannot remove your own admin access');
      return;
    }
    try {
      await setUserAdmin({ variables: { id: user.id, admin } });
      toast.success(`${name} is ${admin ? 'now' : 'no longer'} an admin`);
    } catch (error: any) {
      toast.error(`Could not update ${name}: ${error.message}`);
    }
  };

  const grant = async () => {
    const user = candidates.find(
      (candidate) => displayName(candidate) === selectedName,
    );
    if (!user) return;
    await setAdmin(user, true);
    setSelectedName('');
    setSelectResetKey((key) => key + 1);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <ul className="m-0 flex max-h-72 list-none flex-col gap-1 overflow-y-auto p-0">
        {admins.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between gap-4 rounded px-2 py-1.5 hover:bg-gray-800"
          >
            <span className="flex items-center gap-2 truncate">
              <Avatar user={user} />
              <span className="truncate">{displayName(user)}</span>
              {user.id === myId && (
                <span className="text-xs text-primary-800 opacity-60">
                  (you)
                </span>
              )}
            </span>
            {user.id !== myId && (
              <button
                className="rounded bg-gray-800 px-3 py-1 text-sm text-primary-800 hover:bg-red-900 hover:text-white"
                onClick={() => setAdmin(user, false)}
              >
                Remove
              </button>
            )}
          </li>
        ))}
        {admins.length === 0 && (
          <li className="px-2 py-1.5 text-sm text-primary-800 opacity-60">
            No admins yet.
          </li>
        )}
      </ul>

      <div className="flex flex-col gap-2 border-t border-primary-900 border-opacity-40 pt-4">
        <label className="text-sm text-primary-800">
          Grant admin access — anyone who has logged in appears here (type to
          search)
        </label>
        <div className="flex items-center gap-2">
          <Select
            key={selectResetKey}
            className="grow"
            disabled={candidates.length === 0}
            placeholder={
              candidates.length === 0
                ? 'No other users to promote'
                : 'Select a user…'
            }
            options={candidates.map((candidate) => ({
              value: displayName(candidate),
              imgSrc: avatarUrl(candidate),
            }))}
            onSelectChange={setSelectedName}
          />
          <button
            className="shrink-0 rounded bg-primary-800 px-4 py-2 text-white enabled:hover:bg-primary-900 disabled:opacity-40"
            disabled={!selectedName}
            onClick={grant}
          >
            Make admin
          </button>
        </div>
      </div>
    </>
  );
};

const PipelineStatus = () => {
  const { data, loading } = useQuery<PipelineStatusQuery>(
    PipelineStatusDocument,
    { pollInterval: 60_000 },
  );

  if (loading)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Spinner />
      </div>
    );

  const characters = data?.character_aggregate.aggregate?.count ?? 0;
  const withStats = data?.character_stats_aggregate.aggregate?.count ?? 0;
  const lastUpdate = data?.character_stats_aggregate.aggregate?.max?.updated_at;
  const coverage =
    characters > 0 ? Math.round((withStats / characters) * 100) : 0;

  const stats = [
    { label: 'Characters tracked', value: characters.toLocaleString() },
    { label: 'With PoB stats', value: withStats.toLocaleString() },
    { label: 'Stats coverage', value: `${coverage}%` },
    {
      label: 'Last stats update',
      value: lastUpdate
        ? `${formatDistanceToNow(new Date(lastUpdate))} ago`
        : 'never',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center rounded bg-gray-800 px-3 py-4"
        >
          <span className="text-xl text-primary-300">{stat.value}</span>
          <span className="text-center text-xs text-primary-800 opacity-70">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export const AdminPanel = () => {
  const { isAdmin, adminPending, loading } = useAdminAccess();

  if (loading || adminPending) {
    return (
      <div className="flex w-full flex-col items-center gap-3 py-24">
        <Spinner />
        {adminPending && <span>Elevating your access…</span>}
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="w-full py-24 text-center text-primary-800">
        <div className="font-fontinSmallcaps text-2xl text-primary-500">
          Not authorised
        </div>
        You need admin access to view this page.
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="m-0 text-2xl xl:text-3xl">Admin</h1>

      <PipelineStatus />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Path of Exile league">
          <LeagueControl />
        </Card>
        <Card title="Admins">
          <AdminUsers />
        </Card>
      </div>
    </div>
  );
};
