import { useQuery, useSubscription } from '@apollo/client';
import { useEffect, useMemo, useState } from 'react';
import {
  atlasSimilarity,
  loadAtlasData,
  summariseTree,
  type AtlasData,
  type AtlasTree,
} from '../../../_utils/atlas';
import {
  AtlasSnapshotsDocument,
  GuildBuildStatsDocument,
  LeagueDocument,
  ProfileBulkContributionsDocument,
  ProfileBulkOrdersDocument,
  ProfileCharactersDocument,
  ProfileOrdersDocument,
  ProfileUserDocument,
  UsersSubDocument,
  type AtlasSnapshotsSubscription,
  type AtlasSnapshotsSubscriptionVariables,
  type GuildBuildStatsSubscription,
  type GuildBuildStatsSubscriptionVariables,
  type LeagueQuery,
  type ProfileBulkContributionsSubscription,
  type ProfileBulkContributionsSubscriptionVariables,
  type ProfileBulkOrdersSubscription,
  type ProfileBulkOrdersSubscriptionVariables,
  type ProfileCharactersSubscription,
  type ProfileCharactersSubscriptionVariables,
  type ProfileOrdersSubscription,
  type ProfileOrdersSubscriptionVariables,
  type ProfileUserSubscription,
  type ProfileUserSubscriptionVariables,
  type UsersSubSubscription,
} from '../../../graphql-api';
import useCharacterItems from '../../../hooks/useCharacterItems';
import { CharacterSheet } from '../character-sheet/CharacterSheet';
import { CharacterStatSheet } from '../character-sheet/CharacterStatSheet';
import { AccountPanel } from '../profile/AccountPanel';
import { AtlasPanel, type AtlasProfile } from '../profile/AtlasPanel';
import { BuildPanel } from '../profile/BuildPanel';
import { CharacterRoster } from '../profile/CharacterRoster';
import { AlliesPanel, LedgerPanel } from '../profile/LedgerPanel';
import { profileHref } from '../profile/links';
import { badgesFor, buildLedger, type ProfileCharacter } from '../profile/model';
import { ProfileHero } from '../profile/ProfileHero';
import { ModalDrawer } from '../ui/ModalDrawer';
import { Spinner } from '../ui/Spinner';

// _ilike treats _ and % as wildcards, and account names can contain _
const exactLike = (value: string) => value.replace(/[\\%_]/g, (char) => `\\${char}`);

/** Whose profile: ?id=<user id>, ?account=<PoE account>, or your own. */
type Target = { id: string } | { account: string };

const readTarget = (): Target => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const account = params.get('account');
  if (id) return { id };
  if (account) return { account };
  // bare /profile is your own: put your id in the URL so it can be shared
  const mine = localStorage.getItem('hasura_user_id')?.trim() ?? '';
  if (mine) window.history.replaceState(window.history.state, '', profileHref({ id: mine }));
  return { id: mine };
};

// The tree that stands for a member: the one they pinned, the one GGG flags,
// the latest edited, or the one with the most points (as on the Farm page).
const mainTree = (trees: AtlasTree[], pinned?: number | null) => {
  if (pinned != null && trees[pinned]?.hashes.length) return trees[pinned];
  const withPoints = trees.filter(({ hashes }) => hashes.length);
  return (
    withPoints.find(({ active }) => active) ??
    [...withPoints]
      .filter(({ changed_at }) => changed_at)
      .sort((a, b) => ((a.changed_at ?? '') < (b.changed_at ?? '') ? 1 : -1))[0] ??
    [...withPoints].sort((a, b) => b.hashes.length - a.hashes.length)[0]
  );
};

export const ProfileScreen = () => {
  const [target] = useState(readTarget);
  const myId = localStorage.getItem('hasura_user_id')?.trim();

  const { data: leagueData } = useQuery<LeagueQuery>(LeagueDocument);
  const league = leagueData?.app_config_by_pk?.league_name;
  const gameVersion = leagueData?.app_config_by_pk?.game_version;

  const { data: userData, loading: userLoading } = useSubscription<
    ProfileUserSubscription,
    ProfileUserSubscriptionVariables
  >(ProfileUserDocument, {
    variables: {
      where:
        'id' in target
          ? { id: { _eq: target.id } }
          : { poe_name: { _ilike: exactLike(target.account) } },
    },
    skip: 'id' in target && !target.id,
  });
  const user = userData?.user[0];
  const accountName = user?.poe_name ?? ('account' in target ? target.account : '');
  const isMe = !!user && user.id === myId;

  const { data: characterData } = useSubscription<
    ProfileCharactersSubscription,
    ProfileCharactersSubscriptionVariables
  >(ProfileCharactersDocument, {
    variables: { account: exactLike(accountName), league: league ?? '' },
    skip: !accountName || !league,
  });
  const { data: guildData } = useSubscription<
    GuildBuildStatsSubscription,
    GuildBuildStatsSubscriptionVariables
  >(GuildBuildStatsDocument, { variables: { league: league ?? '' }, skip: !league });

  const tradeVariables = { userId: user?.id ?? '', league: league ?? '' };
  const skipTrades = !user || !league;
  const { data: orderData } = useSubscription<
    ProfileOrdersSubscription,
    ProfileOrdersSubscriptionVariables
  >(ProfileOrdersDocument, { variables: tradeVariables, skip: skipTrades });
  const { data: contributionData } = useSubscription<
    ProfileBulkContributionsSubscription,
    ProfileBulkContributionsSubscriptionVariables
  >(ProfileBulkContributionsDocument, { variables: tradeVariables, skip: skipTrades });
  const { data: bulkData } = useSubscription<
    ProfileBulkOrdersSubscription,
    ProfileBulkOrdersSubscriptionVariables
  >(ProfileBulkOrdersDocument, { variables: tradeVariables, skip: skipTrades });

  const { data: snapshotData } = useSubscription<
    AtlasSnapshotsSubscription,
    AtlasSnapshotsSubscriptionVariables
  >(AtlasSnapshotsDocument, { variables: { league: league ?? '' }, skip: !league });
  const { data: usersData } = useSubscription<UsersSubSubscription>(UsersSubDocument);

  const [atlasData, setAtlasData] = useState<AtlasData | null>();
  useEffect(() => {
    if (!gameVersion) return;
    let live = true;
    void loadAtlasData(gameVersion).then((loaded) => live && setAtlasData(loaded ?? null));
    return () => {
      live = false;
    };
  }, [gameVersion]);

  // ---- derived ---------------------------------------------------------------

  const characters = useMemo<ProfileCharacter[]>(
    () =>
      [...(characterData?.character ?? [])].sort(
        (a, b) => b.level - a.level || Number(b.experience) - Number(a.experience),
      ),
    [characterData],
  );
  const [featuredId, setFeaturedId] = useState<string>();
  const featured = characters.find(({ id }) => id === featuredId) ?? characters[0];

  const ledger = useMemo(
    () =>
      user && orderData && contributionData && bulkData
        ? buildLedger(
            user.id,
            orderData.user_item_order,
            contributionData.bulk_order_contribution,
            bulkData.bulk_order,
          )
        : undefined,
    [user, orderData, contributionData, bulkData],
  );

  const atlas = useMemo<AtlasProfile | undefined>(() => {
    if (!user || !atlasData || !snapshotData) return undefined;
    const mains = new Map<string, Set<number>>();
    let summary;
    for (const snapshot of snapshotData.atlas_snapshot) {
      if (snapshot.tree_version !== atlasData.version) continue;
      const tree = mainTree(snapshot.trees as AtlasTree[], snapshot.pinned_tree);
      if (!tree) continue;
      mains.set(snapshot.user_id, new Set(tree.hashes));
      if (snapshot.user_id === user.id) summary = summariseTree(tree, atlasData);
    }
    if (!summary) return undefined;

    const mine = mains.get(user.id)!;
    const users = new Map((usersData?.user ?? []).map((other) => [other.id, other]));
    let twin: AtlasProfile['twin'];
    for (const [otherId, hashes] of mains) {
      const other = users.get(otherId);
      if (otherId === user.id || !other) continue;
      const similarity = atlasSimilarity(mine, hashes);
      if (!twin || similarity > twin.similarity) twin = { user: other, similarity };
    }
    return { summary, twin };
  }, [user, atlasData, snapshotData, usersData]);

  const badges = badgesFor({ characters, ledger, sharesAtlas: !!atlas });

  // ---- gear and tree drawer (as on the ladder) -------------------------------

  const [sheetOpen, setSheetOpen] = useState(false);
  const {
    items,
    character: sheetCharacter,
    passiveTree,
    loading: sheetLoading,
    fetchItems,
  } = useCharacterItems();
  const openSheet = (character: ProfileCharacter) => {
    setSheetOpen(true);
    void fetchItems(character.poe_account_name, 'pc', character.name);
  };

  // ---- render ----------------------------------------------------------------

  if (userLoading || !league || (!user && !accountName)) {
    return (
      <div className="mt-24 flex w-full justify-center">
        {userLoading || !league ? (
          <Spinner />
        ) : (
          <span className="text-primary-800">No such member</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 px-4 pb-16 pt-6">
      <ProfileHero
        user={user}
        accountName={accountName}
        featured={featured}
        league={league}
        badges={badges}
        isAdmin={user?.admin}
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {featured && (
            <BuildPanel
              character={featured}
              guild={guildData?.character}
              onOpenSheet={() => openSheet(featured)}
            />
          )}
          {characters.length > 1 && (
            <CharacterRoster
              characters={characters}
              featuredId={featured?.id}
              onFeature={setFeaturedId}
            />
          )}
          {ledger && <LedgerPanel ledger={ledger} />}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          {user && <AtlasPanel atlas={atlas} isMe={isMe} />}
          {ledger && ledger.allies.length > 0 && <AlliesPanel allies={ledger.allies} />}
          {isMe && <AccountPanel />}
        </div>
      </div>

      <ModalDrawer isOpen={sheetOpen} onClose={() => setSheetOpen(false)}>
        {sheetLoading || !featured ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : sheetCharacter && passiveTree && items?.length ? (
          <CharacterSheet
            accountName={featured.poe_account_name}
            items={items}
            character={sheetCharacter}
            passiveTreeItems={passiveTree.items}
            characterId={featured.id}
          />
        ) : (
          <div className="flex h-full flex-col items-center gap-2 overflow-y-auto">
            <div className="font-fontinSmallcaps text-xl text-primary-500">{featured.name}</div>
            <div className="mb-2 text-sm text-primary-800">
              Couldn't load the gear: the profile may be private.
            </div>
            <CharacterStatSheet characterId={featured.id} />
          </div>
        )}
      </ModalDrawer>
    </div>
  );
};
