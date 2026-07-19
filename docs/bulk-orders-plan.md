# Bulk Orders with Partial Fulfillment

## Context

The order book today handles single items: one row = one item, fulfilled whole by one person (`fulfilled_by` column). "I want 100 Screaming Essences of X" doesn't fit — the recent "bulk order form" only mass-creates *separate single orders*. This feature adds true quantity-based **bulk orders** where guild members fulfill **portions** ("I'll bring 30"), with live progress, a polished dedicated UI, and rich Discord notifications for every lifecycle event.

**User decisions (locked):** bulk view is a **tab/switcher on `/order-book`** (not a new route); contributions are **instant** ("I'm putting 30 in gstash now"), not pledges; Discord uses **rich embeds**; item picker uses a **stackables dataset sourced from RePoE** (`https://repoe-fork.github.io/base_items.json` — verified: 1,061 StackableCurrency incl. all 105 essences, fossils, 291 MapFragments, incubators, div cards; each with `release_state` and `visual_identity.dds_file` convertible via existing `mapDdsToPoeImageUrl` in `src/_utils/utils.ts:107`).

**Design principles** (from codebase review): don't touch `user_item_order` — two new tables; DB triggers are the atomic backstop for races, Hasura permission checks give *detectable* errors (`permission-error` is stable; trigger `RAISE` text is NOT visible to non-admin roles — never parse it client-side); friendly race errors come from live subscription data; contributions are **immutable** (withdraw = delete); `completed_at` is trigger-owned, never client-writable; `item_name` immutable after creation; **no priority concept** on bulk orders (removes cap interplay); mutation-first-then-notify (today's code notifies before mutating — a bug pattern we won't copy).

---

## 1. Database — one Hasura migration

`hasura/migrations/default/<ms-timestamp>_create_bulk_orders/{up,down}.sql` (timestamp via `python3 -c 'import time; print(int(time.time()*1000))'`).

### Tables

```sql
CREATE TABLE public.bulk_order (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public."user"(id) ON UPDATE restrict ON DELETE cascade,
    item_name text NOT NULL,
    description text,            -- optional owner note
    icon_url text,
    link_url text,
    quantity integer NOT NULL CONSTRAINT bulk_order_quantity_positive CHECK (quantity > 0),
    cancelled_at timestamptz,    -- set/cleared by owner (cancel / un-cancel)
    completed_at timestamptz,    -- TRIGGER-OWNED, never client-writable
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
-- + set_public_bulk_order_updated_at trigger (existing fn public.set_current_timestamp_updated_at)

CREATE TABLE public.bulk_order_contribution (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    bulk_order_id uuid NOT NULL REFERENCES public.bulk_order(id) ON UPDATE restrict ON DELETE cascade,
    user_id uuid NOT NULL REFERENCES public."user"(id) ON UPDATE restrict ON DELETE cascade,
    quantity integer NOT NULL CONSTRAINT bulk_order_contribution_quantity_positive CHECK (quantity > 0),
    delivery text NOT NULL DEFAULT 'gstash' CONSTRAINT bulk_order_contribution_delivery_valid CHECK (delivery IN ('gstash','dm')),
    note text,                   -- contributor's custom message, included in Discord embed
    created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bulk_order_contribution_bulk_order_id_idx ON public.bulk_order_contribution (bulk_order_id);
```

### Triggers (the concurrency backbone — all take `SELECT … FOR UPDATE` on the parent row first, serializing races)

1. **`bulk_order_contribution_guard`** — BEFORE INSERT on contribution: lock parent `FOR UPDATE`; reject if cancelled, completed, or `contributed_sum + NEW.quantity > parent.quantity` (`RAISE EXCEPTION` — backstop only, UI never parses it).
2. **`bulk_order_recompute_completed`** — AFTER INSERT OR DELETE on contribution: lock parent (`IF NOT FOUND RETURN NULL` — parent cascade-deleted); set `completed_at = now()` when sum ≥ quantity and it's null; clear it when sum < quantity and it's set (withdrawal auto-reopens). No recursion: the parent UPDATE only fires `updated_at` trigger + quantity guard (which is `ON UPDATE OF quantity` only).
3. **`bulk_order_quantity_guard`** — BEFORE UPDATE OF quantity on bulk_order: reject `NEW.quantity < contributed_sum`; re-derive `completed_at` (raising qty on a completed order **reopens** it; lowering to exactly the contributed sum completes it).

`down.sql`: drop tables first (removes triggers), then the three functions.

---

## 2. Hasura metadata

New `hasura/metadata/databases/default/tables/public_bulk_order.yaml` + `public_bulk_order_contribution.yaml`, included in `tables.yaml` (alphabetical, after `public_app_config.yaml`). Template the yaml style from `public_user_item_order.yaml`; roles `user` and `dev` get **identical** blocks (repo convention).

**Permission matrix** (both roles):

| Table | Insert | Select | Update | Delete |
|---|---|---|---|---|
| `bulk_order` | own only (`user_id = X-Hasura-User-Id`); columns: user_id, item_name, description, icon_url, link_url, quantity (NOT cancelled_at/completed_at) | all rows, all columns, `allow_aggregations: true` | owner only; columns: **description, quantity, link_url, cancelled_at** (NOT item_name, NOT completed_at) | owner only **AND `_not: { contributions: {} }`** — hard delete only with zero contributions; otherwise cancel |
| `bulk_order_contribution` | own only AND parent active: `bulk_order: { cancelled_at: {_is_null: true}, completed_at: {_is_null: true} }` — gives stable `permission-error` on races; self-contribution to own order **allowed** | all rows, all columns, aggregations | **none — immutable** | own only AND parent active (withdraw) |

Relationships: `bulk_order.user`, `bulk_order.contributions` (array), `contribution.user`, `contribution.bulk_order`.

After apply: `pnpm go:schema` (pg_dump → `go-server/schema.sql`, run via docker exec like the character_stats work if no local pg_dump) + `cd go-server && sqlc generate` (no query changes; go-server otherwise untouched). Commit the schema diff.

---

## 3. GraphQL operations + codegen

New `src/graphql/bulk-orders.graphql` (style-match `user-item-orders.graphql`):

- `subscription BulkOrders` — `bulk_order(order_by: {created_at: desc})` with all columns, `user { id poe_name discord_name discord_user_id discord_avatar }`, `contributions(order_by: {created_at: asc}) { id quantity delivery note created_at user { id poe_name discord_name discord_user_id discord_avatar } }`. Sums computed client-side (needed per-contributor for the segmented bar anyway).
- `mutation InsertBulkOrder` → `insert_bulk_order_one`
- `mutation UpdateBulkOrder($id, $description, $quantity, $linkUrl, $cancelledAt)` → `update_bulk_order_by_pk` (one op covers edit / cancel / un-cancel: `cancelledAt: null` un-cancels)
- `mutation DeleteBulkOrder` → `delete_bulk_order_by_pk` (perm-blocked → returns null → UI treats as "cancel instead")
- `mutation InsertBulkOrderContribution` → `insert_bulk_order_contribution_one` **returning `bulk_order { id quantity completed_at contributions { quantity user { … } } }`** — the returned parent tells the client atomically whether THIS contribution completed the order (selects contribution-vs-completion embed without racing the subscription)
- `mutation DeleteBulkOrderContribution` → `delete_bulk_order_contribution_by_pk`

Run `npx graphql-codegen --config codegen.ts -r dotenv/config` against migrated local Hasura; commit `src/graphql-api.ts` + `graphql.schema.json`.

---

## 4. Discord — rich embeds

### New function `netlify/functions/discord-notify.ts`
Clone of `discord-notify-user.ts` (leave that one untouched — OrderBook depends on it) accepting `{ content?: string, embeds?: object[] }`, POSTing `{ content, embeds, username: 'smol-bot' }` to the existing `SMOL_DISCORD_ITEM_ORDER_WEBHOOK`. Reached at `/api/discord-notify` via the existing netlify.toml redirect.

**Critical Discord mechanic: mentions inside embeds do NOT ping.** So every message = `content` line carrying `<@id>` pings + one embed carrying the rich card.

### New shared builder `src/_utils/bulk-discord.ts`
Single source of truth — the in-dialog live preview and the actual send both call these builders, guaranteeing preview === sent message. Exports:
- `mention(user)` → `<@discord_user_id>` if linked else `**name**` (poe_name ?? discord_name; graceful no-ping degradation)
- `progressBar(sum, total)` → `▰▰▰▰▰▰▱▱▱▱ 60/100` (10 segments)
- `buildBulkEmbed(event, ctx)` → `{ content, embeds }` per the matrix below
- `notifyBulkDiscord(payload)` → fire-and-forget POST to `/api/discord-notify`, **always called AFTER the mutation succeeds**

### Message matrix (embed color / content ping / embed body)

| Event | Color | `content` (pings) | Embed |
|---|---|---|---|
| Created | gold `0xdfcf99` | *(none — announcement)* | title `📦 New bulk order: 100× Screaming Essence of Contempt`, thumbnail = icon_url, desc = owner name + optional note, field `Progress: ▱▱▱▱▱▱▱▱▱▱ 0/100`, footer link to /order-book?view=bulk |
| Contribution (partial) | blue `0x4179b1` | `<@owner>` | title `+30× Screaming Essence of Contempt`, desc = `{mention-less contributor name} contributed`, fields: Progress bar + `40 to go`, Delivery (`Guild Stash 1 shortly!` / `They'll DM you`), optional `📝 note` (the contributor's custom message) |
| Contribution completing the order | green `0x22c55e` | `<@owner>` | title `🎉 Complete: 100× …`, desc thanks final contributor, fields: full bar, **all contributors** (`name — qty` lines), delivery, note. Single message, no separate partial ping |
| Withdrawal | gray `0x6b7280` | `<@owner>` | title `−30× …`, desc `{contributor} withdrew`, field: recomputed bar (+ "reopened" note if it un-completed) |
| Cancelled (≥1 contribution) | red `0xdc2626` | all **deduped** contributor `<@id>`s | title `⚠️ Cancelled: 100× …`, desc = owner cancelled, `60 already contributed — check with them about anything you've sent`, contributor list |
| Cancelled (0 contributions) | — | *no message* | — |
| Quantity raised (incl. reopen) | gold | *(none)* | title `📈 100 → 150× …`, bar, `contributions welcome!` |
| Un-cancelled | gold | *(none)* | Created embed with `📦 Reopened:` title |
| Owner/contributor without Discord | — | ping degrades to bold name in content; creation/contribute dialogs show inline warning (`You won't be pinged…`) | names render fine in embeds |
| Self-contribution | — | skip the owner ping (contributor === owner) | normal embed |

---

## 5. Frontend

### View switcher on /order-book (user's choice)
- `src/components/OrdersPage.tsx`: render new `OrdersViewSwitcher` (segmented pill: **Item Orders | Bulk Orders**) above, and conditionally mount `<OrderBook/>` or `<BulkOrderBook/>` based on a `?view=bulk` URL param (synced via `history.replaceState`, same pattern OrderBook uses for `?createOrder=true`). Deep-linkable; `OrderBook.tsx` itself stays untouched.
- Cmd/Ctrl+O opens the create dialog of whichever view is active.

### New state `src/_state/bulk-orders.ts` (mirror `order-book.ts`)
`persistentAtom`s: `bulkShowCompleted` (false), `bulkShowCancelled` (false), `bulkSort` (`'newest' | 'closest-to-complete' | 'largest'`), plus in-memory fuzzy search atom. New keys with defaults ⇒ **no `index.astro` version bump**. No 2-week-inactive rule (bulk orders are long-lived; toggles replace it).

### Components (all under `src/components/react/` unless noted)

```
graphql-provided/BulkOrderBook.tsx
  useSubscription(BulkOrders); derives per order: sum, remaining, pct, isMine,
  status: 'active' | 'complete' | 'cancelled'
  filters: fast-fuzzy over item_name/description/owner name; toggles; sort Select
  (ui/Select — exercises the recently-fixed dynamic-options path)
  header: search, toggles, sort, count, "Create Bulk Order" Button
  contribution onError → toast built from LIVE SUB DATA ("Someone beat you to it —
  only N remaining"), never from trigger error text
  empty states: none-at-all (CTA panel) vs all-filtered ("N hidden — reset filters")
  grid: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 of cards

BulkOrderCard.tsx
  icon (icon_url ?? poewiki Special:FilePath fallback), item_name (link anchor),
  qty badge, owner avatar+name (+"(you)"), ReactTimeAgo, status chip
  (Active gold / Complete green / Cancelled red+dimmed like fulfilled rows),
  BulkProgressBar, contributor avatar stack,
  actions: Contribute (anyone incl. owner, while active & remaining>0) ·
  Edit / Cancel (owner, active) · Un-cancel (owner, cancelled) ·
  Trash (owner, ONLY when contributions.length === 0 — mirrors delete perm)
  own contribution rows get a "Withdraw" affordance (while parent active)

ui/BulkProgressBar.tsx  (generic, reusable)
  stacked per-contributor segments, deterministic color per userId from a small
  palette, hover Popover "{name}: {qty}", "{sum}/{total}" overlay,
  animated width transitions (the realtime-fill polish moment)

BulkOrderForm.tsx  (create + edit inside existing ui/Dialog)
  SEARCH-FIRST creation flow — the entire dialog is built around one typing
  experience, target: type → Enter → number → Enter, order created in <5s:

  1. Dialog opens with ONE prominent autofocused search input
     (placeholder: `Type what you need… e.g. "screaming contempt"`).
  2. Fuzzy dropdown (Popover, same pattern as OrderForm's quick-order search)
     over stackables.json ONLY (~1.8k currencies/essences/fragments/oils/
     catalysts/scarabs/div cards — CURRENCY ONLY, no uniques: bulk orders are
     for stackable quantities, uniques are already well served by the
     existing single-item order flow). Up to 8 results, each row: 32px item
     icon + name (matched substring highlighted) + muted category chip
     (Essence / Currency / Fragment / Div Card / …).
     fast-fuzzy tuned like searchUniquesByNameOrBase so partial multi-word
     queries match ("scr cont" → Screaming Essence of Contempt).
  3. Keyboard-complete: ↑/↓ move highlight, Enter selects, Esc closes;
     mouse hover/click equivalent. Last dropdown row is ALWAYS the escape
     hatch: `Use "«query»" as a custom item` (free text; icon guessed via
     poewiki Special:FilePath, editable wiki link) — no dead ends.
  4. Selection collapses the search into a selected-item banner (large icon,
     name, category, × to clear and re-search) and auto-focuses the quantity
     input: numeric with +10/+100 chips and stepper; Enter submits when valid.
  5. Below the fold (optional, never blocking the fast path): description
     textarea, poewiki link (reuse OrderForm's validation pattern),
     no-Discord warning banner.
  Edit mode: banner shown locked (item immutable), no ×; quantity min =
  contributed sum with inline hint; react-hook-form throughout.
  Submit → InsertBulkOrder → Created embed.

StackableItemPicker.tsx
  The reusable search component implementing steps 1–4 above: props
  { onSelect(item | customName), locked?, initial? }; wraps
  searchStackablesByName() (new, in src/_utils/utils.ts, fast-fuzzy over
  src/assets/stackables/stackables.json — CURRENCY/STACKABLES ONLY, no
  uniques: bulk orders model a quantity of a stackable item, uniques are
  single-item and already served by the existing order flow); debounced
  ~80ms; result rows share the icon+name markup of the existing unique
  quick-search Popover for visual consistency only (no shared data source)

BulkContributeDialog.tsx
  amount input clamped [1, remaining], re-clamped LIVE if subscription shrinks
  remaining while open ("someone just contributed" hint);
  quick chips: +10 · Half · All (remaining);
  delivery radio DM / Guild Stash 1 (mirror existing fulfill modal markup);
  optional note (140 chars) — the "custom discord message";
  ★ live Discord preview panel styled like a Discord message (smol-bot header +
  embed with color bar), rendered from the SAME builder as the real send,
  auto-switching to the 🎉 completion embed when amount === remaining;
  submit → InsertBulkOrderContribution → inspect returned parent.completed_at →
  send matching embed → success toast

Cancel confirm (inline dialog in BulkOrderBook)
  impact summary ("3 people contributed 60 — they'll be notified") + embed
  preview → UpdateBulkOrder(cancelledAt: now) → cancellation embed
```

### Stackables dataset
- `scrape-stackables.js` (repo root, sibling of `scrape-images.js`; one-off, output committed): fetch `https://repoe-fork.github.io/base_items.json`, filter `release_state === 'released'` + `item_class ∈ {StackableCurrency, DelveStackableSocketableCurrency, DelveSocketableCurrency, MapFragment, IncubatorStackable, DivinationCard}`, dedupe by name, map to `{ name, category, icon: mapDdsToPoeImageUrl(visual_identity.dds_file) }` (category = friendly label from item_class, with name-based split of StackableCurrency into essence/oil/catalyst/scarab/currency).
- Output `src/assets/stackables/stackables.json` (~1.8k entries — same ballpark as uniques.json).

---

## 6. Edge-case matrix

| Case | UI | Server backstop | Discord |
|---|---|---|---|
| Concurrent overshoot | clamp from live sub; on error → toast w/ fresh remaining | BEFORE INSERT guard (FOR UPDATE + sum) | none on failure |
| Exact fill | preview auto-switches to completion embed | AFTER trigger sets completed_at in same tx | single 🎉 message |
| Contribute to just-completed/cancelled | buttons hide on sub update | insert **permission check** → stable `permission-error` | — |
| Cancel w/ 0 vs N contributions | confirm shows impact | — | silent vs deduped-ping embed |
| Un-cancel | owner action on cancelled card | update perm allows clearing cancelled_at | Reopened embed |
| Qty lowered below contributed | form min = contributed | BEFORE UPDATE trigger rejects | — |
| Qty raised on completed order | edit allowed | trigger clears completed_at (reopens) | 📈 embed |
| Hard delete w/ contributions | trash hidden | delete perm filter (returns null) | cancel path is the notifying path |
| Self-contribution | allowed | allowed | owner ping skipped |
| Same user contributes twice | separate rows; bar merges per-user | allowed | pings each time |
| Withdraw after complete/cancel | button hidden | delete perm filter | — |
| Withdraw reopening a completed order | — | recompute trigger clears completed_at | withdrawal embed notes reopening |
| No Discord linked (either side) | inline warnings | — | bold-name fallback, never `<@null>` |
| Priority cap | N/A — no priority on bulk | — | — |
| `/api/update-sheet` | **not called** (sheet is user_item_order-only) — explicit non-goal | — | — |
| Mobile 375px | 1-col cards, dialogs max-w-[95vw], chips wrap | — | — |

---

## 7. Sequencing

1. Migration → apply locally (dockerized hasura-cli, as used for character_stats/app_config) → hand-test triggers in SQL (concurrent overshoot, exact fill, withdrawal reopen, qty guards).
2. Metadata yamls + tables.yaml → apply → role-based permission tests via curl with minted user JWTs (established local pattern).
3. `pnpm go:schema` mirror + sqlc regenerate (no-op expected) + commit.
4. `src/graphql/bulk-orders.graphql` → codegen → commit generated files.
5. `discord-notify.ts` + `bulk-discord.ts` builders (pure; written first so the preview consumes them).
6. `scrape-stackables.js` → `stackables.json` → `searchStackablesByName`.
7. State atoms + `OrdersViewSwitcher` + `OrdersPage.tsx` view switch + `?view=bulk` sync.
8. `BulkOrderBook` → `BulkOrderCard` → `BulkProgressBar` → `BulkOrderForm`/`StackableItemPicker` → `BulkContributeDialog` → cancel confirm. Mutation-then-notify wiring, toasts.
9. Polish pass: bar animations, empty states, keyboard flow, mobile.

## 8. Verification

- **SQL**: two-session concurrent contribution race (second blocks on FOR UPDATE then correctly rejects); overshoot; exact fill sets completed_at; withdrawal clears it; qty-below-contributed rejected; down.sql applies cleanly (`migrate apply --down 1` then re-up).
- **Permissions** (curl as role `user` with minted JWTs, two seeded users): can't insert as another user; can't touch item_name/completed_at; can't delete order with contributions; contribution into cancelled/completed order → `permission-error`.
- **Two-browser realtime test** (netlify serve for `/api/*` functions; point `SMOL_DISCORD_ITEM_ORDER_WEBHOOK` at a test channel or a local echo): A creates 100× → B contributes 30 (A's bar animates live, partial embed lands) → B contributes 70 (single 🎉) → A raises to 150 (reopens, 📈) → B withdraws (bar shrinks, withdrawal embed) → A cancels (deduped contributor pings). Verify preview === sent message.
- **Select regression**: sort dropdown + item picker with dynamic options (the recently-fixed BaseSelect path) in the **prod bundle** via `netlify serve` — this exact class of bug only reproduces there.
- **No-Discord path**: user with null discord_user_id on both sides — no `<@null>`, warnings render.
- **Keyboard-only creation flow**: open dialog (Cmd+O) → type "scr cont" → ↓/Enter to select → type "100" → Enter → order created, no mouse. Fuzzy quality spot-checks: "scr cont", "vent", "div card name fragment", garbage query → escape hatch row only.
- Existing order book unaffected (switcher aside); Cmd+O per view; `?view=bulk&createBulkOrder=true` deep link; mobile 375px; `pnpm build` green.

**Explicit non-goals**: no changes to `user_item_order` flows, no priority on bulk orders, no update-sheet export, no pledge/two-phase fulfillment, go-server untouched beyond the schema.sql mirror.
