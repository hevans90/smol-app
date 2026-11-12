import type { TreeSummary } from '../../../_utils/atlas';
import { strategyOf } from '../../../_utils/atlas';
import { MechanicIcon } from '../farm/Mechanic';
import { MemberAvatar } from '../farm/MemberAvatar';
import { profileHref } from './links';
import { personName, type PersonRef } from './model';
import { Meter, Panel } from './Panel';

export type AtlasProfile = {
  summary: TreeSummary;
  /** the guild member whose main tree is most alike */
  twin?: { user: PersonRef; similarity: number };
};

export const AtlasPanel = ({
  atlas,
  isMe,
  sharing,
}: {
  atlas?: AtlasProfile;
  isMe: boolean;
  /** shares their atlas, whether or not there's a tree this league yet; undefined while loading */
  sharing?: boolean;
}) => {
  if (!atlas) {
    if (sharing === undefined) return null;
    return (
      <Panel title="Atlas">
        <div className="text-sm text-primary-800">
          {sharing ? (
            'No atlas tree in this league yet'
          ) : isMe ? (
            <>
              Not shared. <a href="/mechanics">Share it on the Farm page</a>
            </>
          ) : (
            'Not shared'
          )}
        </div>
      </Panel>
    );
  }

  const { summary, twin } = atlas;
  const strategy = strategyOf(summary);

  return (
    <Panel
      title="Atlas"
      aside={
        <a href="/mechanics" className="text-primary-800 no-underline hover:text-primary-300">
          {summary.name || 'Main tree'} · {summary.allocated} points
        </a>
      }
    >
      {strategy.length ? (
        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {strategy.map((mechanic) => (
            <li key={mechanic.key} title={mechanic.highlights.join(', ')}>
              <div className="flex items-center gap-2">
                <MechanicIcon mechanic={mechanic.key} className="h-5 w-5" />
                <span className="flex-1 truncate text-sm text-primary-500">{mechanic.label}</span>
                <span className="text-xs text-primary-800">{Math.round(mechanic.share * 100)}%</span>
              </div>
              <Meter value={mechanic.share} className="ml-7 mt-1" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-sm text-primary-800">No clear strategy yet</div>
      )}

      {summary.keystones.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {summary.keystones.map(({ name, mechanic }) => (
            <span
              key={name}
              className="flex items-center gap-1 rounded-full border border-primary-900 bg-gray-950/60 py-0.5 pl-0.5 pr-2 text-xs text-primary-500"
            >
              <MechanicIcon mechanic={mechanic} className="h-4 w-4" />
              {name}
            </span>
          ))}
        </div>
      )}

      {twin && (
        <a
          href={profileHref(twin.user)}
          className="mt-5 flex items-center gap-3 rounded-md border border-gray-800 bg-gray-950/50 p-2.5 no-underline hover:border-primary-900"
        >
          <MemberAvatar user={twin.user} className="h-8 w-8" />
          <span className="min-w-0 flex-1">
            <span className="block text-xs uppercase tracking-wider text-primary-800">
              Atlas twin
            </span>
            <span className="block truncate text-sm text-primary-400">{personName(twin.user)}</span>
          </span>
          <span className="font-fontinSmallcaps text-xl text-primary-400">
            {Math.round(twin.similarity * 100)}%
          </span>
        </a>
      )}
    </Panel>
  );
};
