import { useMemo, useState, type FocusEvent, type MouseEvent, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { STRATEGY_SHARE_THRESHOLD, strategyOf, type AtlasData } from '../../../_utils/atlas';
import { TREE_COLOURS } from '../../../_utils/atlas-geometry';
import { AtlasTreeThumb, type ThumbLayer } from '../atlas/AtlasTree';
import { HeatLegend, heatColour, type GuildHeat } from './AtlasDialog';
import { MechanicIcon } from './MechanicBar';
import { MemberAvatar, memberName } from './MemberAvatar';
import type { FarmMember } from './types';

// How much of a member's tree a mechanic takes, in four steps of one hue
// (brighter = more). The first step is below the strategy threshold: a dabble.
const SHARE_STEPS = [
  { from: 0, label: `under ${STRATEGY_SHARE_THRESHOLD * 100}%` },
  { from: STRATEGY_SHARE_THRESHOLD, label: `${STRATEGY_SHARE_THRESHOLD * 100}%` },
  { from: 0.25, label: '25%' },
  { from: 0.4, label: '40%+' },
];
const shareColour = (share: number) => {
  let step = 0;
  SHARE_STEPS.forEach(({ from }, index) => {
    if (share >= from) step = index;
  });
  return TREE_COLOURS.heat[step];
};
const percent = (share: number) => `${Math.round(share * 100)}%`;

type Hover = { left: number; top?: number; bottom?: number; content: ReactNode };

/**
 * The guild at a glance. A grid of mechanics (rows) against members
 * (columns): a filled cell means that member's tree invests in that
 * mechanic, brighter for a bigger share; hovering a cell or a member says
 * exactly what. Rows filter the cards below, columns open the member's tree.
 * Beside it, everyone's tree overlaid as a heat map.
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
        left: Math.min(rect.left, window.innerWidth - 304),
        // below the target, or above it in the lower half of the screen
        ...(rect.top > window.innerHeight / 2
          ? { bottom: window.innerHeight - rect.top + 8 }
          : { top: rect.bottom + 8 }),
        content,
      });
    };
  const hide = () => setHover(undefined);

  const { rows, uncovered } = useMemo(() => {
    const label = (mechanic: string) => data.mechanics[mechanic] ?? mechanic;
    // mechanic -> member id -> that mechanic's slice of their main tree
    const byMechanic = new Map<
      string,
      Map<string, FarmMember['trees'][number]['summary']['mechanics'][number]>
    >();
    const farmers = new Map<string, number>();
    for (const member of members) {
      const { summary } = member.trees[member.mainIndex];
      for (const mechanic of summary.mechanics) {
        if (!byMechanic.has(mechanic.key)) byMechanic.set(mechanic.key, new Map());
        byMechanic.get(mechanic.key)!.set(member.user.id, mechanic);
      }
      for (const mechanic of member.strategy) {
        farmers.set(mechanic, (farmers.get(mechanic) ?? 0) + 1);
      }
    }

    const generic = new Set(data.generic);
    const farmable = [
      ...new Set(Object.values(data.nodes).map(({ mechanic }) => mechanic)),
    ].filter((mechanic) => !generic.has(mechanic));

    return {
      // only mechanics someone actually builds around get a row; dabbles in
      // them still show as dim cells
      rows: [...farmers]
        .map(([mechanic, count]) => ({
          mechanic,
          count,
          label: label(mechanic),
          cells: byMechanic.get(mechanic) ?? new Map(),
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      uncovered: farmable
        .filter((mechanic) => !farmers.has(mechanic))
        .map((mechanic) => ({ mechanic, label: label(mechanic) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    };
  }, [members, data]);

  const heatLayers = useMemo<ThumbLayer[]>(() => {
    if (!heat) return [];
    const byColour = new Map<string, Set<number>>();
    for (const [hash, count] of heat.counts) {
      const colour = heatColour(count, heat.members);
      if (!byColour.has(colour)) byColour.set(colour, new Set());
      byColour.get(colour)!.add(hash);
    }
    // dimmest first, so the nodes most members took end up on top
    return TREE_COLOURS.heat
      .filter((colour) => byColour.has(colour))
      .map((colour) => ({ colour, hashes: byColour.get(colour)! }));
  }, [heat]);

  const memberCard = (member: FarmMember) => {
    const { tree, summary } = member.trees[member.mainIndex];
    const strategy = strategyOf(summary);
    return (
      <>
        <div className="flex items-center gap-2">
          <MemberAvatar user={member.user} className="h-6 w-6" />
          <span className="truncate text-primary-400">{memberName(member.user)}</span>
        </div>
        <div className="mb-2 mt-1 text-xs text-primary-800">
          {tree.name} · {summary.allocated} points
        </div>
        {strategy.length === 0 && (
          <div className="text-primary-800">No mechanic stands out</div>
        )}
        {strategy.map((mechanic) => (
          <div key={mechanic.key} className="flex items-center gap-2 py-0.5">
            <MechanicIcon mechanic={mechanic.key} className="h-5 w-5" />
            <span className="flex-1 truncate text-primary-500">{mechanic.label}</span>
            <span className="tabular-nums text-primary-800">{percent(mechanic.share)}</span>
          </div>
        ))}
      </>
    );
  };

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

        <div className="overflow-x-auto pb-1" onMouseLeave={hide}>
          <table className="border-separate border-spacing-0.5">
            <thead>
              <tr>
                <td />
                {members.map((member) => (
                  <th key={member.user.id} className="p-0 pb-1 font-normal">
                    <button
                      type="button"
                      aria-label={`Open ${memberName(member.user)}'s atlas tree`}
                      onClick={() => onOpenMember(member)}
                      onMouseEnter={show(memberCard(member))}
                      onFocus={show(memberCard(member))}
                      onBlur={hide}
                      className="block rounded-full bg-transparent p-0 hover:bg-transparent hover:ring-2 hover:ring-primary-800"
                    >
                      <MemberAvatar user={member.user} className="h-7 w-7" />
                    </button>
                  </th>
                ))}
                <td />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ mechanic, label, count, cells }) => {
                const active = selected.includes(mechanic);
                return (
                  <tr key={mechanic}>
                    <th className="p-0 pr-2 text-left font-normal">
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => onToggle(mechanic)}
                        onMouseEnter={hide}
                        className={twMerge(
                          'flex w-full items-center gap-2 whitespace-nowrap rounded border bg-transparent px-1.5 py-0.5 text-sm hover:bg-gray-800',
                          active
                            ? 'border-primary-500 bg-gray-800 text-primary-300'
                            : 'border-transparent text-primary-500',
                        )}
                      >
                        <MechanicIcon mechanic={mechanic} className="h-5 w-5" />
                        {label}
                      </button>
                    </th>
                    {members.map((member) => {
                      const cell = cells.get(member.user.id);
                      if (!cell) {
                        return (
                          <td key={member.user.id} className="p-0" onMouseEnter={hide}>
                            <div className="h-7 w-7 rounded-sm bg-gray-950" />
                          </td>
                        );
                      }
                      const detail = (
                        <>
                          <div className="flex items-center gap-2">
                            <MemberAvatar user={member.user} className="h-6 w-6" />
                            <span className="truncate text-primary-400">
                              {memberName(member.user)}
                            </span>
                          </div>
                          <div className="mb-2 mt-1 flex items-center gap-2">
                            <MechanicIcon mechanic={mechanic} className="h-5 w-5" />
                            <span className="flex-1 text-primary-500">{label}</span>
                            <span className="tabular-nums text-primary-800">
                              {percent(cell.share)} of tree
                            </span>
                          </div>
                          {cell.highlights.map((name: string) => (
                            <div key={name} className="truncate text-xs text-primary-800">
                              {name}
                            </div>
                          ))}
                        </>
                      );
                      return (
                        <td key={member.user.id} className="p-0">
                          <button
                            type="button"
                            aria-label={`${memberName(member.user)}: ${label} ${percent(cell.share)}`}
                            onClick={() => onOpenMember(member)}
                            onMouseEnter={show(detail)}
                            onFocus={show(detail)}
                            onBlur={hide}
                            className="block h-7 w-7 rounded-sm p-0 hover:ring-2 hover:ring-primary-300"
                            style={{ backgroundColor: shareColour(cell.share) }}
                          />
                        </td>
                      );
                    })}
                    <td
                      className="pl-2 text-right text-xs tabular-nums text-primary-800"
                      title={`${count} of ${members.length} members build around ${label}`}
                    >
                      {count}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-primary-800">
          <span>Share of tree</span>
          {SHARE_STEPS.map(({ label }, index) => (
            <span key={label} className="flex items-center gap-1">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: TREE_COLOURS.heat[index] }}
              />
              {label}
            </span>
          ))}
        </div>

        {uncovered.length > 0 && (
          <div>
            <h3 className="m-0 mb-2 text-sm font-normal text-primary-800">Nobody farms</h3>
            <div className="flex flex-wrap gap-1.5">
              {uncovered.map(({ mechanic, label }) => (
                <span
                  key={mechanic}
                  className="flex items-center gap-1.5 rounded border border-gray-800 px-2 py-1 text-xs text-primary-800"
                >
                  <MechanicIcon mechanic={mechanic} className="h-4 w-4 text-[10px]" />
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {heat && (
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-lg text-primary-500">Guild atlas</h2>
          <button
            type="button"
            onClick={onOpenHeat}
            aria-label="Open the guild atlas"
            className="max-w-xs rounded border border-gray-800 bg-gray-950 p-1 hover:border-primary-800 hover:bg-gray-950"
          >
            <AtlasTreeThumb
              data={heat.data}
              layers={heatLayers}
              label="Every sharing member's atlas overlaid"
              className="w-full"
            />
          </button>
          <HeatLegend members={heat.members} />
        </div>
      )}

      {hover && (
        <div
          role="tooltip"
          className="pointer-events-none fixed z-40 w-72 rounded border border-primary-900 bg-gray-950 p-3 text-sm shadow-lg"
          style={{ left: Math.max(hover.left, 8), top: hover.top, bottom: hover.bottom }}
        >
          {hover.content}
        </div>
      )}
    </section>
  );
};
