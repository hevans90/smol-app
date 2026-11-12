import { useMemo, useState, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { strategyOf, type AtlasData } from '../../../_utils/atlas';
import { TREE_COLOURS, type TreeLayer } from '../../../_utils/atlas-geometry';
import { AtlasTreeExplorer } from '../atlas/AtlasTree';
import { profileHref } from '../profile/links';
import { Dialog, DialogContent, DialogHeading } from '../ui/Dialog';
import { MechanicRow, notableCount } from './Mechanic';
import type { FarmMember } from './types';

const Shell = ({
  title,
  onClose,
  tree,
  side,
}: {
  title: ReactNode;
  onClose: () => void;
  tree: ReactNode;
  side: ReactNode;
}) => (
  <Dialog open onOpenChange={(open) => !open && onClose()}>
    <DialogContent className="h-[92vh] w-[min(1500px,96vw)] gap-3 p-4">
      <div className="flex items-center justify-between gap-4">
        <DialogHeading className="m-0 truncate text-xl text-primary-500">
          {title}
        </DialogHeading>
        <button
          type="button"
          onClick={onClose}
          className="bg-transparent px-2 text-sm text-primary-800 underline hover:bg-transparent hover:text-primary-300"
        >
          Close
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="min-h-[50vh] lg:min-h-0">{tree}</div>
        <div className="min-h-0 overflow-y-auto pr-1">{side}</div>
      </div>
    </DialogContent>
  </Dialog>
);

/** One member's atlas, full size, with what it is built from alongside. */
export const MemberAtlasDialog = ({
  member,
  initialTree,
  onClose,
}: {
  member: FarmMember;
  initialTree: number;
  onClose: () => void;
}) => {
  const [treeIndex, setTreeIndex] = useState(initialTree);
  const [highlight, setHighlight] = useState<Set<number>>();
  const { summary, hashes } = member.trees[treeIndex] ?? member.trees[0];
  const { data } = member;

  const layers = useMemo(() => [{ colour: TREE_COLOURS.allocated, hashes }], [hashes]);

  // allocated notables and keystones of each mechanic, with their hashes so
  // hovering one can find it on the tree
  const byMechanic = useMemo(() => {
    const groups = new Map<string, { hash: number; name: string; keystone: boolean }[]>();
    const all = new Map<string, Set<number>>();
    for (const hash of hashes) {
      const node = data.nodes[hash];
      if (!node) continue;
      if (!all.has(node.mechanic)) all.set(node.mechanic, new Set());
      all.get(node.mechanic)!.add(hash);
      if (node.kind !== 'notable' && node.kind !== 'keystone') continue;
      if (!groups.has(node.mechanic)) groups.set(node.mechanic, []);
      groups.get(node.mechanic)!.push({
        hash,
        name: node.name,
        keystone: node.kind === 'keystone',
      });
    }
    for (const list of groups.values()) {
      list.sort(
        (a, b) => Number(b.keystone) - Number(a.keystone) || a.name.localeCompare(b.name),
      );
    }
    return { groups, all };
  }, [hashes, data]);

  const strategy = strategyOf(summary);
  // what the tree is built around first, then the dabbles and upkeep, dimmed
  const sections = [...summary.mechanics, ...summary.generic].map((mechanic) => ({
    ...mechanic,
    minor: !strategy.includes(mechanic),
  }));

  return (
    <Shell
      onClose={onClose}
      title={
        <a
          href={profileHref(member.user)}
          className="text-inherit no-underline hover:text-primary-300"
        >
          {member.user.discord_name ?? member.user.poe_name}
        </a>
      }
      tree={
        <AtlasTreeExplorer
          data={data}
          layers={layers}
          highlight={highlight}
          showRoutes
          className="h-full"
        />
      }
      side={
        <div className="flex flex-col gap-4" onMouseLeave={() => setHighlight(undefined)}>
          {member.trees.length > 1 && (
            <div className="flex flex-wrap gap-1">
              {member.trees.map(({ tree, summary: each }, index) => (
                <button
                  key={index}
                  type="button"
                  aria-pressed={index === treeIndex}
                  onClick={() => setTreeIndex(index)}
                  className={twMerge(
                    'rounded border px-2 py-1 text-xs',
                    index === treeIndex
                      ? 'border-primary-500 bg-gray-800 text-primary-300'
                      : 'border-primary-900 bg-transparent text-primary-800 hover:border-primary-800',
                  )}
                >
                  {tree.name} · {each.allocated}
                </button>
              ))}
            </div>
          )}
          <div className="text-sm text-primary-800">
            {summary.allocated}
            {data.totalPoints ? ` / ${data.totalPoints}` : ''} points
            {summary.unknown > 0 && (
              <span className="ml-2 text-red-400">
                {summary.unknown} unrecognised nodes
              </span>
            )}
          </div>

          {sections.map((section) => (
            <div
              key={section.key}
              className={section.minor ? 'opacity-70' : undefined}
              onMouseEnter={() => setHighlight(byMechanic.all.get(section.key))}
            >
              <MechanicRow
                mechanic={section.key}
                label={section.label}
                note={notableCount(section.highlights)}
              >
                <ul className="m-0 mt-1 list-none pl-8 text-xs">
                  {(byMechanic.groups.get(section.key) ?? []).map((node) => (
                    <li
                      key={node.hash}
                      onMouseEnter={(event) => {
                        event.stopPropagation();
                        setHighlight(new Set([node.hash]));
                      }}
                      className={twMerge(
                        'cursor-default truncate py-0.5 hover:text-primary-300',
                        node.keystone ? 'text-primary-500' : 'text-primary-800',
                      )}
                    >
                      {node.name}
                    </li>
                  ))}
                </ul>
              </MechanicRow>
            </div>
          ))}
        </div>
      }
    />
  );
};

export type GuildHeat = {
  data: AtlasData;
  /** hash -> how many sharing members allocated it */
  counts: Map<number, number>;
  members: number;
};

/** Which heat step a node allocated by `count` of `members` falls in. */
export const heatColour = (count: number, members: number) => {
  const steps = TREE_COLOURS.heat;
  const step = Math.min(
    steps.length - 1,
    Math.floor(((count - 1) / Math.max(members - 1, 1)) * steps.length),
  );
  return steps[Math.max(step, 0)];
};

/** The heat map as tree layers, dimmest first: the same for preview and dialog. */
export const heatLayers = ({ counts, members }: GuildHeat): TreeLayer[] => {
  const byColour = new Map<string, Set<number>>();
  for (const [hash, count] of counts) {
    const colour = heatColour(count, members);
    if (!byColour.has(colour)) byColour.set(colour, new Set());
    byColour.get(colour)!.add(hash);
  }
  return TREE_COLOURS.heat
    .filter((colour) => byColour.has(colour))
    .map((colour) => ({ colour, hashes: byColour.get(colour)! }));
};

export const HeatLegend = ({ members }: { members: number }) => (
  <div className="flex items-center gap-2 text-xs text-primary-800">
    <span>1</span>
    <span className="flex gap-0.5">
      {TREE_COLOURS.heat.map((colour) => (
        <span key={colour} className="h-2 w-6 rounded-sm" style={{ backgroundColor: colour }} />
      ))}
    </span>
    <span>
      {members} {members === 1 ? 'member' : 'members'}
    </span>
  </div>
);

/** Every sharing member's atlas overlaid: brighter = taken by more people. */
export const GuildAtlasDialog = ({
  heat,
  onClose,
}: {
  heat: GuildHeat;
  onClose: () => void;
}) => {
  const layers = useMemo(() => heatLayers(heat), [heat]);

  // the notables most members took
  const popular = useMemo(
    () =>
      [...heat.counts]
        .map(([hash, count]) => ({ hash, count, node: heat.data.nodes[hash] }))
        .filter(({ node }) => node?.kind === 'notable' || node?.kind === 'keystone')
        .sort((a, b) => b.count - a.count || a.node.name.localeCompare(b.node.name))
        .slice(0, 40),
    [heat],
  );
  const [highlight, setHighlight] = useState<Set<number>>();

  return (
    <Shell
      onClose={onClose}
      title="Guild atlas"
      tree={
        <AtlasTreeExplorer
          data={heat.data}
          layers={layers}
          highlight={highlight}
          noteFor={(hash) => {
            const count = heat.counts.get(hash);
            return count ? `${count} of ${heat.members} members` : undefined;
          }}
          className="h-full"
        />
      }
      side={
        <div className="flex flex-col gap-3" onMouseLeave={() => setHighlight(undefined)}>
          <HeatLegend members={heat.members} />
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-primary-800">
                <th className="font-normal">Most taken</th>
                <th className="text-right font-normal">Members</th>
              </tr>
            </thead>
            <tbody>
              {popular.map(({ hash, count, node }) => (
                <tr
                  key={hash}
                  onMouseEnter={() => setHighlight(new Set([hash]))}
                  className="cursor-default hover:text-primary-300"
                >
                  <td className="truncate py-0.5">
                    <span className={node.kind === 'keystone' ? 'text-primary-500' : undefined}>
                      {node.name}
                    </span>
                    <span className="ml-2 text-xs text-primary-900">
                      {heat.data.mechanics[node.mechanic]}
                    </span>
                  </td>
                  <td className="text-right tabular-nums">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
};
