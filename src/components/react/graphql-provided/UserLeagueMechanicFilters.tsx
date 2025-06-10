import { useStore } from '@nanostores/react';
import { IconTrash } from '@tabler/icons-react';
import { Fragment } from 'react';
import { isLeagueFilter, userListFilterStore } from '../../../_state/user-list';
import type { League_Type_Enum, LeaguesQuery } from '../../../graphql-api';
import { Select } from '../ui/Select';

export const leagueMap: { [key in League_Type_Enum]?: string } = {
  altar_eater: 'eater altars',
  altar_exarch: 'exarch altars',
  settlers_of_kalguur: 'shipping (kalguur)',
};

export const UserLeagueMechanicFilters = ({
  leagueQuery,
}: {
  leagueQuery: LeaguesQuery;
}) => {
  const filters = useStore(userListFilterStore);

  const addLeagueFilter = (value: League_Type_Enum) =>
    userListFilterStore.set([...filters, { league: value }]);

  const deleteLeagueFilter = (index: number) =>
    userListFilterStore.set([
      ...filters.slice(0, index),
      ...filters.slice(index + 1),
    ]);
  const clearLeagueFilters = () => userListFilterStore.set([]);

  const leagues = leagueQuery.league_type
    .map(({ value }) => ({
      value,
      display: leagueMap?.[value as League_Type_Enum] ?? value,
      imgSrc: `/league-icons/${value}.webp`,
    }))
    .filter(
      (league) =>
        !filters.find(
          (filter) => isLeagueFilter(filter) && filter.league === league.value,
        ),
    )
    .sort((a, b) => a.value.localeCompare(b.value));

  return (
    <div className="flex grow gap-2 rounded border-[1px] border-primary-900 bg-gray-900 p-2">
      <Select
        onSelectChange={(value) => addLeagueFilter(value as League_Type_Enum)}
        placeholder="Add Filter"
        showSelected={false}
        options={leagues}
      />
      <div className="flex h-10 grow items-center">
        {filters.map((filter, i) => (
          <Fragment key={i}>
            {isLeagueFilter(filter) ? (
              <button
                onClick={() => deleteLeagueFilter(i)}
                className="cursor-pointer bg-gray-900"
              >
                <img
                  title={filter.league}
                  className="h-10 w-10 p-1 hover:bg-gray-800 md:h-12 md:w-12"
                  src={`/league-icons/${filter.league}.webp`}
                />
              </button>
            ) : (
              filter
            )}
          </Fragment>
        ))}
        {!filters.length && (
          <div className="mr-2 flex grow justify-end">No filters</div>
        )}
        {filters.length ? (
          <div className="flex grow justify-end">
            <button
              onClick={clearLeagueFilters}
              className="flex items-center bg-gray-900 p-1 hover:bg-gray-800 hover:text-primary-500"
            >
              <IconTrash className="h-8 w-8 " />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
