import { formatDistanceToNowStrict } from 'date-fns';
import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { strategyOf } from '../../../_utils/atlas';
import { TREE_COLOURS } from '../../../_utils/atlas-geometry';
import { AtlasTreeThumb, type ThumbLayer } from '../atlas/AtlasTree';
import { MechanicBar } from './MechanicBar';
import type { FarmMember } from './types';

// Mechanic rows shown before the rest collapse into "+n more".
const MAX_ROWS = 5;

export const MemberCard = ({
  member,
  isMe,
  onOpen,
}: {
  member: FarmMember;
  isMe: boolean;
  onOpen: (treeIndex: number) => void;
}) => {
  const { user, data } = member;
  const [treeIndex, setTreeIndex] = useState(member.mainIndex);
  const [hovered, setHovered] = useState<string>();
  const { summary, hashes } = member.trees[treeIndex] ?? member.trees[0];

  const strategy = strategyOf(summary);
  const rows = strategy.slice(0, MAX_ROWS);
  const more = summary.mechanics.length - rows.length;

  const layers = useMemo<ThumbLayer[]>(() => {
    const allocated = { colour: TREE_COLOURS.allocated, hashes };
    if (!hovered) return [allocated];
    return [
      allocated,
      {
        colour: TREE_COLOURS.highlight,
        hashes: new Set([...hashes].filter((hash) => data.nodes[hash]?.mechanic === hovered)),
      },
    ];
  }, [hashes, hovered, data]);

  const name = user.discord_name ?? user.poe_name ?? '';

  return (
    <article
      className={twMerge(
        'flex flex-col gap-3 rounded border bg-gray-900 p-3',
        isMe ? 'border-primary-800' : 'border-gray-800',
      )}
    >
      <header className="flex items-center gap-2">
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
        <div className="min-w-0 flex-1">
          <div className="truncate text-primary-500">
            {name}
            {isMe && <span className="ml-1 text-primary-800">(you)</span>}
          </div>
          <div className="truncate text-xs text-primary-800">
            {summary.allocated}
            {data.totalPoints ? ` / ${data.totalPoints}` : ''} points ·{' '}
            {formatDistanceToNowStrict(new Date(member.fetchedAt), { addSuffix: true })}
          </div>
        </div>
        {member.similarity !== undefined && (
          <div
            className="shrink-0 text-right text-xs text-primary-800"
            title="Share of atlas passives you both took"
          >
            <div className="text-sm tabular-nums text-primary-500">
              {Math.round(member.similarity * 100)}%
            </div>
            like yours
          </div>
        )}
      </header>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onOpen(treeIndex)}
          aria-label={`Open ${name}'s atlas tree`}
          className="w-36 shrink-0 self-start rounded border border-gray-800 bg-gray-950 p-1 hover:border-primary-800 hover:bg-gray-950"
        >
          <AtlasTreeThumb
            data={data}
            layers={layers}
            label={`${name}'s atlas tree`}
            className="w-full"
          />
        </button>

        <div
          className="flex min-w-0 flex-1 flex-col gap-2"
          onMouseLeave={() => setHovered(undefined)}
        >
          {rows.length === 0 && (
            <span className="text-sm text-primary-900">No mechanic stands out</span>
          )}
          {rows.map((mechanic) => (
            <div key={mechanic.key} onMouseEnter={() => setHovered(mechanic.key)}>
              <MechanicBar
                compact
                mechanic={mechanic.key}
                label={mechanic.label}
                fraction={mechanic.share}
                value={`${Math.round(mechanic.share * 100)}%`}
                title={mechanic.highlights.join('\n')}
                active={hovered === mechanic.key}
              />
            </div>
          ))}
          {more > 0 && (
            <span
              className="text-xs text-primary-800"
              title={summary.mechanics
                .slice(rows.length)
                .map(({ label, share }) => `${label} ${Math.round(share * 100)}%`)
                .join('\n')}
            >
              +{more} more
            </span>
          )}
        </div>
      </div>

      {summary.keystones.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {summary.keystones.map((keystone) => (
            <span
              key={keystone.name}
              title={data.mechanics[keystone.mechanic]}
              className="rounded border border-gray-700 px-1.5 py-0.5 text-xs text-primary-600"
            >
              {keystone.name}
            </span>
          ))}
        </div>
      )}

      {member.trees.length > 1 && (
        <div className="flex flex-wrap gap-1">
          {member.trees.map(({ tree, summary: each }, index) => (
            <button
              key={index}
              type="button"
              aria-pressed={index === treeIndex}
              onClick={() => setTreeIndex(index)}
              className={twMerge(
                'rounded border px-2 py-0.5 text-xs',
                index === treeIndex
                  ? 'border-primary-500 bg-gray-800 text-primary-300'
                  : 'border-primary-900 bg-transparent text-primary-800 hover:border-primary-800',
              )}
            >
              {tree.name} · {each.allocated}
              {member.mainKnown && index === member.mainIndex && ' · selected'}
            </button>
          ))}
        </div>
      )}
    </article>
  );
};
