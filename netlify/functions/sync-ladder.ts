import { schedule } from '@netlify/functions';
import { POE_USER_AGENT } from '../lib/poe';
import { hasuraUrl } from '../lib/require-user';

/**
 * Copies the private league's ladder into the `character` table every five
 * minutes. League membership (the `league_member` view, which gates order
 * writes) is derived from that table, so this runs here rather than on the
 * go server, which has a history of falling over. This is the only writer
 * of the league and character tables; the go server just reads the ladder
 * to compute PoB stats.
 *
 * Scheduled functions run on production deploys only and cannot be invoked
 * by URL.
 */

type LadderEntry = {
  rank: number;
  dead?: boolean;
  retired?: boolean;
  character?: {
    id: string;
    name: string;
    level: number;
    class: string;
    experience?: number;
  };
  account?: {
    name: string;
    challenges?: { completed?: number };
    twitch?: { name?: string };
  };
};

type League = {
  id?: string;
  realm?: string;
  url?: string;
  startAt?: string;
  endAt?: string;
  description?: string;
  category?: { id?: string; current?: boolean };
  registerAt?: string;
  delveEvent?: boolean;
  rules?: { id: string; name: string; description?: string }[];
};

type LadderPage = {
  league?: League;
  ladder?: { total?: number; entries?: LadderEntry[] };
};

const REQUEST_TIMEOUT_MS = 10_000;
// safety stop for pagination; the private league is nowhere near this
const MAX_ENTRIES = 2000;
// stand-in when GGG omits a date (the columns are NOT NULL)
const ZERO_TIME = '0001-01-01T00:00:00Z';

const getJson = async (url: string, headers: Record<string, string> = {}) => {
  const response = await fetch(url, {
    headers: { 'User-Agent': POE_USER_AGENT, ...headers },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`${response.status} from ${url}`);
  return response.json();
};

const hasura = async <T>(query: string, variables: object = {}): Promise<T> => {
  const response = await fetch(hasuraUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': process.env.HASURA_ADMIN_SECRET as string,
    },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const result = (await response.json()) as { data?: T; errors?: unknown };
  if (!result.data || result.errors) {
    throw new Error(`hasura: ${JSON.stringify(result.errors ?? result)}`);
  }
  return result.data;
};

// Walks every page of a ladder. `fetchPage` returns one page starting at
// `offset`; the first page also carries the league details.
const collectLadder = async (
  pageSize: number,
  fetchPage: (offset: number) => Promise<LadderPage>,
) => {
  const first = await fetchPage(0);
  const entries = [...(first.ladder?.entries ?? [])];
  const total = Math.min(first.ladder?.total ?? entries.length, MAX_ENTRIES);

  while (entries.length < total) {
    const page = await fetchPage(entries.length);
    const pageEntries = page.ladder?.entries ?? [];
    if (!pageEntries.length) break;
    entries.push(...pageEntries);
    if (pageEntries.length < pageSize) break;
  }

  return { league: first.league, entries };
};

// Documented API, using the app's own client credentials.
const fetchLadderWithOAuth = async (leagueName: string) => {
  const tokenResponse = await fetch('https://www.pathofexile.com/oauth/token', {
    method: 'POST',
    headers: {
      'User-Agent': POE_USER_AGENT,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: 'smolapp',
      client_secret: process.env.POE_CLIENT_SECRET as string,
      grant_type: 'client_credentials',
      scope: 'service:leagues service:leagues:ladder',
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const { access_token } = (await tokenResponse.json()) as {
    access_token?: string;
  };
  if (!access_token) throw new Error(`no service token (${tokenResponse.status})`);

  const base = `https://api.pathofexile.com/league/${encodeURIComponent(leagueName)}/ladder`;
  return collectLadder(500, (offset) =>
    getJson(`${base}?limit=500&offset=${offset}`, {
      Authorization: `Bearer ${access_token}`,
    }),
  );
};

// The website's older endpoint, which serves private league ladders with no
// credentials. Undocumented, so it is only the fallback. League fields come
// back at the top level here instead of under `league`.
const fetchLadderPublicly = async (leagueName: string) => {
  const base = `https://www.pathofexile.com/api/leagues/${encodeURIComponent(leagueName)}`;
  return collectLadder(200, async (offset) => {
    const { ladder, ...league } = (await getJson(
      `${base}?ladder=1&ladderLimit=200&ladderOffset=${offset}`,
    )) as League & { ladder?: LadderPage['ladder'] };
    return { league, ladder };
  });
};

const saveLeague = async (league: League) => {
  const categoryId = league.category?.id || null;

  await hasura(
    `mutation SaveLeague(
      $categories: [league_category_insert_input!]!
      $league: league_insert_input!
      $rules: [league_rules_insert_input!]!
    ) {
      insert_league_category(
        objects: $categories
        on_conflict: { constraint: league_category_pkey, update_columns: [current] }
      ) { affected_rows }
      insert_league_one(
        object: $league
        on_conflict: {
          constraint: league_pkey
          update_columns: [realm, url, start_at, end_at, description, category_id, register_at, delve_event]
        }
      ) { id }
      insert_league_rules(
        objects: $rules
        on_conflict: { constraint: league_rules_pkey, update_columns: [name, description, league_id] }
      ) { affected_rows }
    }`,
    {
      categories: categoryId
        ? [{ id: categoryId, current: league.category?.current ?? false }]
        : [],
      league: {
        id: league.id,
        realm: league.realm ?? 'pc',
        url: league.url || null,
        start_at: league.startAt ?? ZERO_TIME,
        end_at: league.endAt ?? ZERO_TIME,
        description: league.description || null,
        category_id: categoryId,
        register_at: league.registerAt ?? ZERO_TIME,
        delve_event: league.delveEvent ?? false,
      },
      rules: (league.rules ?? []).map((rule) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description ?? null,
        league_id: league.id,
      })),
    },
  );
};

const saveCharacters = async (entries: LadderEntry[], leagueName: string) => {
  // one row per character id: a single upsert statement cannot touch the
  // same row twice
  const byId = new Map<string, object>();
  for (const entry of entries) {
    if (!entry.character?.id || !entry.account?.name) continue;
    byId.set(entry.character.id, {
      id: entry.character.id,
      rank: entry.rank,
      poe_account_name: entry.account.name,
      name: entry.character.name,
      class: entry.character.class,
      level: entry.character.level,
      experience: entry.character.experience ?? 0,
      retired: entry.retired ?? false,
      dead: entry.dead ?? false,
      challenges: entry.account.challenges?.completed ?? 0,
      twitch: entry.account.twitch?.name ?? '',
      league: leagueName,
    });
  }
  if (!byId.size) return 0;

  const { insert_character } = await hasura<{
    insert_character: { affected_rows: number };
  }>(
    `mutation SaveCharacters($characters: [character_insert_input!]!) {
      insert_character(
        objects: $characters
        on_conflict: {
          constraint: character_pkey
          update_columns: [rank, poe_account_name, name, class, level, experience, retired, dead, challenges, twitch, league]
        }
      ) { affected_rows }
    }`,
    { characters: [...byId.values()] },
  );
  return insert_character.affected_rows;
};

export const syncLadder = async () => {
  const { app_config_by_pk } = await hasura<{
    app_config_by_pk: { league_name: string } | null;
  }>(`query ConfiguredLeague { app_config_by_pk(id: 1) { league_name } }`);
  const leagueName = app_config_by_pk?.league_name;
  if (!leagueName) throw new Error('no league configured in app_config');

  let source = 'oauth';
  let result: Awaited<ReturnType<typeof collectLadder>>;
  try {
    result = await fetchLadderWithOAuth(leagueName);
  } catch (e) {
    console.error('Documented ladder API failed, trying the public one:', e);
    source = 'public';
    result = await fetchLadderPublicly(leagueName);
  }

  // League details are nice-to-have (ladder page header); never let them
  // block the character sync that membership depends on. An empty id means
  // GGG returned no league — saving that would create a garbage row.
  if (result.league?.id) {
    try {
      await saveLeague(result.league);
    } catch (e) {
      console.error('Could not save league details:', e);
    }
  }

  const saved = await saveCharacters(result.entries, leagueName);
  return { leagueName, source, entries: result.entries.length, saved };
};

export const handler = schedule('*/5 * * * *', async () => {
  try {
    console.log('Ladder synced', await syncLadder());
    return { statusCode: 200 };
  } catch (e) {
    console.error('Ladder sync failed:', e);
    return { statusCode: 500 };
  }
});
