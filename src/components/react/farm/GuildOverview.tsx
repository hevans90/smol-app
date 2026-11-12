import { useMemo, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import {
  hasTiers,
  strategyOf,
  tierOf,
  type AtlasData,
  type MechanicInvestment,
  type MechanicTier,
} from '../../../_utils/atlas';
import { AtlasTreeThumb } from '../atlas/AtlasTree';
import { HeatLegend, heatLayers, type GuildHeat } from './AtlasDialog';
import { MechanicIcon } from './Mechanic';
import { MemberAvatar, memberName } from './MemberAvatar';
import type { FarmMember } from './types';

type Tile = { mechanic: string; label: string; farmers: Farmer[] };

const TIER_GROUPS: { key: MechanicTier | 'other'; title: string; hint?: string }[] = [
  { key: 'primary', title: 'Primary', hint: 'Thread mechanics' },
  { key: 'secondary', title: 'Secondary' },
  { key: 'tertiary', title: 'Tertiary' },
  { key: 'other', title: 'Other' },
];

type Hover = { left: number; top?: number; bottom?: number; content: ReactNode };

type Farmer = {
  member: FarmMember;
  /** this mechanic's part of the member's main tree */
  investment: MechanicInvestment;
  /** the other mechanics that tree is built around */
  also: MechanicInvestment[];
};

/**
 * The guild at a glance: a tile per mechanic with the faces of everyone
 * whose tree is built around it, most invested first. Hovering a face says
 * what they took; clicking it opens their tree; clicking the tile filters
 * the cards below. Beside it, everyone's tree overlaid as a heat map.
 *
 * Each member counts once, by their main tree.
 */
export const GuildOverview = ({
  members,
  data,
  heat,
  selected,
  onToggle,
  onClear,
  onOpenHeat,
  onOpenMember,
}: {
  members: FarmMember[];
  /** the current tree version's lookup, for the list of mechanics */
  data: AtlasData;
  heat?: GuildHeat;
  selected: string[];
  onToggle: (mechanic: string) => void;
  onClear: () => void;
  onOpenHeat: () => void;
  onOpenMember: (member: FarmMember) => void;
}) => {
  const [hover, setHover] = useState<Hover>();
  const show =
    (content: ReactNode) =>
    (event: MouseEvent<HTMLElement> | FocusEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      setHover({
        // kept on screen: the card is 18rem wide
        left: Math.max(Math.min(rect.left, window.innerWidth - 304), 8),
        // below the face, or above it in the lower half of the screen
        ...(rect.top > window.innerHeight / 2
          ? { bottom: window.innerHeight - rect.top + 8 }
          : { top: rect.bottom + 8 }),
        content,
      });
    };
  const hide = () => setHover(undefined);

  const groups = useMemo(() => {
    const label = (mechanic: string) => data.mechanics[mechanic] ?? mechanic;
    const farmers = new Map<string, Farmer[]>();
    for (const member of members) {
      const strategy = strategyOf(member.trees[member.mainIndex].summary);
      for (const investment of strategy) {
        if (!farmers.has(investment.key)) farmers.set(investment.key, []);
        farmers.get(investment.key)!.push({
          member,
          investment,
          also: strategy.filter((other) => other !== investment),
        });
      }
    }

    const generic = new Set(data.generic);
    const farmable = [
      ...new Set([
        ...Object.values(data.nodes).map(({ mechanic }) => mechanic),
        ...farmers.keys(),
      ]),
    ].filter((mechanic) => !generic.has(mechanic));

    // farmed mechanics first (most farmers first), then the rest as empty tiles
    const tilesFor = (mechanics: string[]): Tile[] =>
      mechanics
        .map((mechanic) => ({
          mechanic,
          label: label(mechanic),
          farmers: (farmers.get(mechanic) ?? []).sort(
            (a, b) => b.investment.weight - a.investment.weight,
          ),
        }))
        .sort(
          (a, b) => b.farmers.length - a.farmers.length || a.label.localeCompare(b.label),
        );

    if (!hasTiers(data)) {
      return [{ key: 'all', title: undefined, hint: undefined, tiles: tilesFor(farmable) }];
    }
    return TIER_GROUPS.map(({ key, title, hint }) => ({
      key,
      title,
      hint,
      tiles: tilesFor(farmable.filter((mechanic) => (tierOf(data, mechanic) ?? 'other') === key)),
    })).filter(({ tiles }) => tiles.length);
  }, [members, data]);

  const layers = useMemo(() => (heat ? heatLayers(heat) : []), [heat]);

  const farmerCard = (label: string, { member, investment, also }: Farmer) => (
    <>
      <div className="flex items-center gap-2">
        <MemberAvatar user={member.user} className="h-6 w-6" />
        <span className="truncate text-primary-400">{memberName(member.user)}</span>
      </div>
      <div className="mb-1 mt-2 text-xs text-primary-800">{label}</div>
      {investment.highlights.length === 0 && (
        <div className="text-xs text-primary-800">Small passives only</div>
      )}
      {investment.highlights.map((name) => (
        <div key={name} className="truncate text-primary-500">
          {name}
        </div>
      ))}
      {also.length > 0 && (
        <>
          <div className="mb-1 mt-3 text-xs text-primary-800">Also farms</div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {also.map((other) => (
              <span key={other.key} className="flex items-center gap-1 text-primary-500">
                <MechanicIcon mechanic={other.key} className="h-4 w-4 text-[10px]" />
                {other.label}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  );

  return (
    <section className="grid gap-6 rounded border border-gray-800 bg-gray-900 p-4 xl:grid-cols-[1fr_18rem]">
      <div className="flex min-w-0 flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="m-0 text-lg text-primary-500">What the guild farms</h2>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="bg-transparent px-0 text-sm text-primary-800 underline hover:bg-transparent hover:text-primary-300"
            >
              Clear filter
            </button>
          )}
        </div>

        {groups.map(({ key, title, hint, tiles }) => (
          <div key={key} className="flex flex-col gap-2">
            {title && (
              <div className="flex items-baseline gap-2">
                <h3 className="m-0 text-sm font-normal uppercase tracking-wider text-primary-600">
                  {title}
                </h3>
                {hint && <span className="text-xs text-primary-800">{hint}</span>}
              </div>
            )}
            <div
              className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
              onMouseLeave={hide}
            >
              {tiles.map(({ mechanic, label, farmers }) => {
                const active = selected.includes(mechanic);
                if (!farmers.length) {
                  return (
                    <div
                      key={mechanic}
                      className="flex items-center gap-2 rounded border border-dashed border-gray-800 bg-gray-950/50 p-2 opacity-60"
                    >
                      <MechanicIcon mechanic={mechanic} className="h-7 w-7 grayscale" />
                      <span className="min-w-0 flex-1 truncate text-primary-800">{label}</span>
                      <span className="text-sm tabular-nums text-primary-900">0</span>
                    </div>
                  );
                }
                return (
                  <div
                    key={mechanic}
                    className={twMerge(
                      'flex flex-col gap-2 rounded border bg-gray-950 p-2',
                      active ? 'border-primary-500' : 'border-gray-800',
                    )}
                  >
                    <button
                      type="button"
                      aria-pressed={active}
                      onClick={() => onToggle(mechanic)}
                      onMouseEnter={hide}
                      title={active ? 'Show everyone' : `Show only ${label} farmers`}
                      className="flex items-center gap-2 rounded bg-transparent p-0 text-left hover:bg-transparent"
                    >
                      <MechanicIcon mechanic={mechanic} className="h-7 w-7" />
                      <span
                        className={twMerge(
                          'min-w-0 flex-1 truncate',
                          active ? 'text-primary-300' : 'text-primary-500',
                        )}
                      >
                        {label}
                      </span>
                      <span className="text-sm tabular-nums text-primary-800">
                        {farmers.length}
                      </span>
                    </button>
                    <div className="flex flex-wrap gap-1">
                      {farmers.map((farmer) => (
                        <button
                          key={farmer.member.user.id}
                          type="button"
                          aria-label={`${memberName(farmer.member.user)} farms ${label}: open their atlas tree`}
                          onClick={() => onOpenMember(farmer.member)}
                          onMouseEnter={show(farmerCard(label, farmer))}
                          onFocus={show(farmerCard(label, farmer))}
                          onBlur={hide}
                          className="rounded-full bg-transparent p-0 hover:bg-transparent hover:ring-2 hover:ring-primary-500"
                        >
                          <MemberAvatar user={farmer.member.user} className="h-7 w-7" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {heat && (
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-lg text-primary-500">Guild atlas</h2>
          <button
            type="button"
            onClick={onOpenHeat}
            disabled={!heat.members}
            aria-label="Open the guild atlas"
            className="relative max-w-xs rounded border border-gray-800 bg-gray-950 p-1 hover:border-primary-800 hover:bg-gray-950 disabled:cursor-default disabled:hover:border-gray-800"
          >
            <AtlasTreeThumb
              data={heat.data}
              layers={layers}
              label="Every sharing member's atlas overlaid"
              className={twMerge('w-full', !heat.members && 'opacity-75')}
            />
            {!heat.members && (
              <span className="absolute inset-0 flex items-center justify-center text-sm text-primary-500">
                Nobody sharing yet
              </span>
            )}
          </button>
          <HeatLegend members={heat.members} />
        </div>
      )}

      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-40 w-72 rounded border border-primary-900 bg-gray-950 p-3 text-sm shadow-lg"
          style={{ left: hover.left, top: hover.top, bottom: hover.bottom }}
        >
          {hover.content}
        </div>
      )}
    </section>
  );
};
