import { useMemo } from 'react';
import { twMerge } from 'tailwind-merge';
import type { AtlasData } from '../../../_utils/atlas';
import { TREE_COLOURS } from '../../../_utils/atlas-geometry';
import { AtlasTreeThumb, type ThumbLayer } from '../atlas/AtlasTree';
import { HeatLegend, heatColour, type GuildHeat } from './AtlasDialog';
import { MechanicBar, MechanicIcon } from './MechanicBar';
import type { FarmMember } from './types';

/**
 * The guild at a glance: how many members build around each mechanic (click
 * to filter the cards below), which mechanics nobody covers, and everyone's
 * trees overlaid as a heat map.
 */
export const GuildOverview = ({
  members,
  data,
  heat,
  selected,
  onToggle,
  onClear,
  onOpenHeat,
}: {
  members: FarmMember[];
  /** the current tree version's lookup, for the list of mechanics */
  data: AtlasData;
  heat?: GuildHeat;
  selected: string[];
  onToggle: (mechanic: string) => void;
  onClear: () => void;
  onOpenHeat: () => void;
}) => {
  const { farmed, uncovered } = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { strategy } of members) {
      for (const mechanic of strategy) counts.set(mechanic, (counts.get(mechanic) ?? 0) + 1);
    }
    const generic = new Set(data.generic);
    const farmable = [
      ...new Set(Object.values(data.nodes).map(({ mechanic }) => mechanic)),
    ].filter((mechanic) => !generic.has(mechanic));
    const label = (mechanic: string) => data.mechanics[mechanic] ?? mechanic;
    return {
      farmed: [...counts]
        .map(([mechanic, count]) => ({ mechanic, count, label: label(mechanic) }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
      uncovered: farmable
        .filter((mechanic) => !counts.has(mechanic))
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

  return (
    <section className="grid gap-6 rounded border border-gray-800 bg-gray-900 p-4 lg:grid-cols-[1fr_18rem]">
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

        <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          {farmed.map(({ mechanic, count, label }) => {
            const active = selected.includes(mechanic);
            return (
              <button
                key={mechanic}
                type="button"
                aria-pressed={active}
                onClick={() => onToggle(mechanic)}
                className={twMerge(
                  'rounded border bg-transparent p-2 text-left hover:bg-gray-800',
                  active ? 'border-primary-500 bg-gray-800' : 'border-transparent',
                )}
              >
                <MechanicBar
                  mechanic={mechanic}
                  label={label}
                  fraction={count / members.length}
                  value={`${count} of ${members.length}`}
                  active={active}
                />
              </button>
            );
          })}
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
            className="rounded border border-gray-800 bg-gray-950 p-1 hover:border-primary-800 hover:bg-gray-950"
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
    </section>
  );
};
