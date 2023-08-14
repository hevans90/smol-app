import { useStore } from '@nanostores/react';
import { IconTrash } from '@tabler/icons-react';
import { Fragment } from 'react';
import { isLeagueFilter, userListFilterStore } from '../../../_state/user-list';
import type { League_Type_Enum, LeaguesQuery } from '../../../graphql-api';
import Select from '../ui/Select';

export const UserListFilters = ({
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
      imgSrc: `/league-icons/${value}.webp`,
    }))
    .filter(
      (league) =>
        !filters.find(
          (filter) => isLeagueFilter(filter) && filter.league === league.value
        )
    )
    .sort((a, b) => a.value.localeCompare(b.value));

  return (
    <div className="flex grow gap-2 p-2 border-[1px] border-primary-900 rounded bg-gray-900">
      <Select
        onSelectChange={(value) => addLeagueFilter(value as League_Type_Enum)}
        placeholder="Add Filter"
        showSelected={false}
        options={leagues}
      />
      <div className="flex items-center h-10 grow">
        {filters.map((filter, i) => (
          <Fragment key={i}>
            {isLeagueFilter(filter) ? (
              <button
                onClick={() => deleteLeagueFilter(i)}
                className="cursor-pointer"
              >
                <img
                  title={filter.league}
                  className="w-10 h-10 md:w-12 md:h-12 p-1 hover:bg-gray-800"
                  src={`/league-icons/${filter.league}.webp`}
                />
              </button>
            ) : (
              filter
            )}
          </Fragment>
        ))}
        {!filters.length && (
          <div className="grow flex justify-end mr-2">No filters</div>
        )}
        {filters.length ? (
          <div className="grow flex justify-end">
            <button
              onClick={clearLeagueFilters}
              className="hover:text-primary-500 hover:bg-gray-800 p-1 flex items-center"
            >
              <IconTrash className="w-8 h-8 md:w-10 md:h-10" />
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
