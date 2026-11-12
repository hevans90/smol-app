import { formatDistanceToNowStrict } from 'date-fns';
import type { GuildBuildStatsSubscription } from '../../../graphql-api';
import { Button } from '../ui/Button';
import { Meter, Panel } from './Panel';
import {
  compact,
  guildPlacement,
  placementLabel,
  type PlacedStat,
  type ProfileCharacter,
  type ProfileStats,
} from './model';

const RESIST_CAP = 75;

const RESISTS: { key: keyof ProfileStats; label: string; colour: string }[] = [
  { key: 'fire_resist', label: 'Fire', colour: '#ca2424' },
  { key: 'cold_resist', label: 'Cold', colour: '#4179b1' },
  { key: 'lightning_resist', label: 'Lightning', colour: '#ffd900' },
  { key: 'chaos_resist', label: 'Chaos', colour: '#cd2285' },
];

const percent = (value: number) => `${Math.round(value)}%`;

const DETAILS: { key: keyof ProfileStats; label: string; format: (value: number) => string }[] = [
  { key: 'armour', label: 'Armour', format: compact },
  { key: 'evasion', label: 'Evasion', format: compact },
  { key: 'block_chance', label: 'Block', format: percent },
  { key: 'spell_block_chance', label: 'Spell block', format: percent },
  { key: 'spell_suppression_chance', label: 'Suppression', format: percent },
  { key: 'crit_chance', label: 'Crit chance', format: (value) => `${value.toFixed(1)}%` },
  { key: 'crit_multiplier', label: 'Crit multiplier', format: (value) => `${Math.round(value * 100)}%` },
  { key: 'attack_speed', label: 'Attacks / sec', format: (value) => value.toFixed(2) },
  { key: 'mana', label: 'Mana', format: compact },
  { key: 'ward', label: 'Ward', format: compact },
];

const HeadlineStat = ({
  label,
  value,
  placement,
}: {
  label: string;
  value: number;
  placement?: number;
}) => (
  <div className="rounded-md border border-gray-800 bg-gray-950/60 p-3">
    <div className="text-xs uppercase tracking-wider text-primary-800">{label}</div>
    <div className="mt-1 font-fontinSmallcaps text-3xl text-primary-400">{compact(value)}</div>
    {placement !== undefined ? (
      <>
        <Meter value={placement} className="mt-2" />
        <div className="mt-1 text-xs text-primary-600">{placementLabel(placement)} in the guild</div>
      </>
    ) : (
      <div className="mt-3 h-4" />
    )}
  </div>
);

export const BuildPanel = ({
  character,
  guild,
  onOpenSheet,
}: {
  character: ProfileCharacter;
  guild?: GuildBuildStatsSubscription['character'];
  onOpenSheet?: () => void;
}) => {
  const stats = character.stats;
  const openSheet = onOpenSheet && (
    <Button className="px-3 py-1.5 text-sm text-primary-500" onClick={onOpenSheet}>
      Gear and tree
    </Button>
  );

  if (!stats || stats.combined_dps + stats.total_ehp <= 0) {
    return (
      <Panel title="Build" aside={openSheet}>
        <div className="text-sm text-primary-800">
          Path of Building hasn't computed {character.name} yet. Builds are refreshed from the
          ladder every few minutes.
        </div>
      </Panel>
    );
  }

  const place = (stat: PlacedStat) => guildPlacement(guild, character.id, stat, stats[stat]);
  const headline: { stat: PlacedStat; label: string }[] = [
    { stat: 'combined_dps', label: 'DPS' },
    { stat: 'total_ehp', label: 'Effective HP' },
    { stat: 'life', label: 'Life' },
    ...(stats.energy_shield > 0
      ? [{ stat: 'energy_shield' as const, label: 'Energy shield' }]
      : []),
  ];
  const details = DETAILS.filter(
    ({ key }) =>
      (stats[key] as number) > 0 &&
      // every build reports the base 150% multiplier, crits or not
      (key !== 'crit_multiplier' || stats.crit_chance > 0),
  );

  return (
    <Panel
      title={stats.main_skill ?? 'Build'}
      aside={
        <div className="flex items-center gap-3">
          <span title={new Date(stats.updated_at).toLocaleString()}>
            Path of Building,{' '}
            {formatDistanceToNowStrict(new Date(stats.updated_at), { addSuffix: true })}
          </span>
          {openSheet}
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {headline.map(({ stat, label }) => (
          <HeadlineStat key={stat} label={label} value={stats[stat]} placement={place(stat)} />
        ))}
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-primary-800">
            Resistances
          </div>
          <div className="flex flex-col gap-2.5">
            {RESISTS.map(({ key, label, colour }) => {
              const value = stats[key] as number;
              const capped = value >= RESIST_CAP;
              return (
                <div key={key} className="grid grid-cols-[5.5rem_1fr_3rem] items-center gap-3">
                  <span className="text-sm text-primary-600">{label}</span>
                  <div className="relative h-2 rounded-full bg-gray-800">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full"
                      style={{
                        width: `${(Math.max(0, Math.min(value, 90)) / 90) * 100}%`,
                        background: colour,
                        opacity: capped ? 1 : 0.65,
                      }}
                    />
                    {/* the default cap */}
                    <div
                      className="absolute -inset-y-1 w-px bg-primary-300/70"
                      style={{ left: `${(RESIST_CAP / 90) * 100}%` }}
                    />
                  </div>
                  <span
                    className={
                      value < 0
                        ? 'text-right text-sm text-red-400'
                        : capped
                          ? 'text-right text-sm text-primary-300'
                          : 'text-right text-sm text-primary-600'
                    }
                  >
                    {percent(value)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs uppercase tracking-wider text-primary-800">
            Defence and offence
          </div>
          <dl className="m-0 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
            {details.map(({ key, label, format }) => (
              <div key={key} className="flex justify-between gap-2 border-b border-gray-800/80 pb-1">
                <dt className="text-primary-800">{label}</dt>
                <dd className="m-0 text-primary-500">{format(stats[key] as number)}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Panel>
  );
};
