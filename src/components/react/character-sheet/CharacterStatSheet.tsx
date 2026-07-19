import { useQuery } from '@apollo/client';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';
import { twMerge } from 'tailwind-merge';
import {
  CharacterStatsSheetDocument,
  type CharacterStatsSheetQuery,
  type CharacterStatsSheetQueryVariables,
} from '../../../graphql-api';
import { Spinner } from '../ui/Spinner';

const compact = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const formatBig = (value: number) =>
  value >= 10_000 ? compact.format(value) : Math.round(value).toLocaleString();

const formatPercent = (value: number) => `${Math.round(value)}%`;

const StatSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="w-full">
    <h3 className="font-fontinSmallcaps mb-1 border-b border-primary-900 border-opacity-40 pb-1 text-base text-primary-500">
      {title}
    </h3>
    <dl className="flex flex-col gap-0.5">{children}</dl>
  </div>
);

const StatRow: React.FC<{
  label: string;
  value: string;
  valueClassName?: string;
  muted?: boolean;
}> = ({ label, value, valueClassName, muted }) => (
  <div
    className={twMerge(
      'flex items-baseline justify-between gap-4 text-sm',
      muted && 'opacity-40',
    )}
  >
    <dt className="text-primary-800">{label}</dt>
    <dd
      className={twMerge(
        'text-primary-300 [font-variant-numeric:tabular-nums]',
        valueClassName,
      )}
    >
      {value}
    </dd>
  </div>
);

export const CharacterStatSheet: React.FC<{
  characterId: string;
  className?: string;
}> = ({ characterId, className }) => {
  const { data, loading } = useQuery<
    CharacterStatsSheetQuery,
    CharacterStatsSheetQueryVariables
  >(CharacterStatsSheetDocument, { variables: { characterId } });

  const stats = data?.character_stats_by_pk;

  if (loading) {
    return (
      <div className={twMerge('flex w-56 justify-center py-8', className)}>
        <Spinner />
      </div>
    );
  }

  if (!stats) {
    return (
      <div
        className={twMerge(
          'w-56 py-4 text-center text-sm text-primary-800 opacity-60',
          className,
        )}
      >
        No PoB stats for this character yet — the profile may be private.
      </div>
    );
  }

  const resistances = [
    {
      label: 'Fire',
      value: stats.fire_resist,
      className: 'text-poeItem-fire',
    },
    {
      label: 'Cold',
      value: stats.cold_resist,
      className: 'text-poeItem-cold',
    },
    {
      label: 'Lightning',
      value: stats.lightning_resist,
      className: 'text-poeItem-lightning',
    },
    { label: 'Chaos', value: stats.chaos_resist, className: 'text-[#d02090]' },
  ];

  return (
    <div className={twMerge('flex w-56 flex-col items-center gap-4', className)}>
      {/* Hero: the number the leaderboard ranks by */}
      <div className="flex flex-col items-center">
        {stats.main_skill && (
          <div className="font-fontinSmallcaps text-lg text-primary-400">
            {stats.main_skill}
          </div>
        )}
        <div className="text-3xl text-primary-300">
          {compact.format(stats.combined_dps)}
        </div>
        <div className="text-xs uppercase tracking-wide text-primary-800 opacity-70">
          combined DPS
        </div>
      </div>

      <StatSection title="Offence">
        <StatRow
          label="Hit DPS"
          value={formatBig(stats.total_dps)}
          muted={stats.total_dps === 0}
        />
        <StatRow
          label="DoT DPS"
          value={formatBig(stats.total_dot_dps)}
          muted={stats.total_dot_dps === 0}
        />
        <StatRow
          label="Full DPS"
          value={formatBig(stats.full_dps)}
          muted={stats.full_dps === 0}
        />
        <StatRow
          label="Crit chance"
          value={`${stats.crit_chance.toFixed(2)}%`}
          muted={stats.crit_chance === 0}
        />
        <StatRow
          label="Crit multiplier"
          value={formatPercent(stats.crit_multiplier * 100)}
          muted={stats.crit_multiplier === 0}
        />
        <StatRow
          label="Speed"
          value={`${stats.attack_speed.toFixed(2)}/s`}
          muted={stats.attack_speed === 0}
        />
      </StatSection>

      <StatSection title="Defence">
        <StatRow
          label="Effective HP"
          value={formatBig(stats.total_ehp)}
          valueClassName="text-primary-400"
        />
        <StatRow
          label="Life"
          value={formatBig(stats.life)}
          valueClassName="text-red-400"
        />
        {stats.life_unreserved !== stats.life && (
          <StatRow
            label="Unreserved life"
            value={formatBig(stats.life_unreserved)}
            valueClassName="text-red-400"
          />
        )}
        <StatRow
          label="Energy shield"
          value={formatBig(stats.energy_shield)}
          valueClassName="text-sky-300"
          muted={stats.energy_shield === 0}
        />
        <StatRow
          label="Ward"
          value={formatBig(stats.ward)}
          muted={stats.ward === 0}
        />
        <StatRow
          label="Mana"
          value={formatBig(stats.mana)}
          valueClassName="text-blue-400"
          muted={stats.mana === 0}
        />
        <StatRow
          label="Armour"
          value={formatBig(stats.armour)}
          muted={stats.armour === 0}
        />
        <StatRow
          label="Evasion"
          value={formatBig(stats.evasion)}
          muted={stats.evasion === 0}
        />
        <StatRow
          label="Block"
          value={formatPercent(stats.block_chance)}
          muted={stats.block_chance === 0}
        />
        <StatRow
          label="Spell block"
          value={formatPercent(stats.spell_block_chance)}
          muted={stats.spell_block_chance === 0}
        />
        <StatRow
          label="Spell suppression"
          value={formatPercent(stats.spell_suppression_chance)}
          muted={stats.spell_suppression_chance === 0}
        />
      </StatSection>

      <StatSection title="Resistances">
        <div className="grid grid-cols-4 gap-1 pt-1">
          {resistances.map((resistance) => (
            <div
              key={resistance.label}
              className="flex flex-col items-center rounded bg-gray-900 px-1 py-2"
            >
              <span
                className={twMerge(
                  'text-base [font-variant-numeric:tabular-nums]',
                  resistance.className,
                )}
              >
                {formatPercent(resistance.value)}
              </span>
              <span className="text-[10px] uppercase tracking-wide text-primary-800 opacity-70">
                {resistance.label}
              </span>
            </div>
          ))}
        </div>
      </StatSection>

      <div className="text-center text-xs text-primary-800 opacity-50">
        Computed with Path of Building · updated{' '}
        {formatDistanceToNow(new Date(stats.updated_at))} ago
      </div>
    </div>
  );
};
