import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import {
  ARMOR_DEFENCE_TYPES,
  type ArmorDefenceType,
  type BaseType,
  type SortedBaseTypes,
} from '../models/base-types';
import { DiscreteSlider } from './react/ui/DiscreetSlider';

import { useMemo, useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { MultiSelect } from './react/ui/Select';
import type { SelectOption } from './react/ui/Select/base';

const DefenceSelection = ({
  className,
  sortedBaseTypes,
}: {
  className?: string;
  sortedBaseTypes: SortedBaseTypes;
}) => {
  const [selectedDefenceTypes, setSelectedDefenceTypes] = useState<
    ArmorDefenceType[]
  >([]);

  const [selectedHelmets, setselectedHelmets] = useState<string[]>([]);
  const [selectedBodyArmours, setSelectedBodyArmours] = useState<string[]>([]);
  const [selectedGloves, setSelectedGloves] = useState<string[]>([]);
  const [selectedBoots, setSelectedBoots] = useState<string[]>([]);

  const colourMap: { [key in ArmorDefenceType]: SelectOption['imgBg'] } = {
    DexInt: { primary: 'bg-green-700', secondary: 'bg-blue-700' },
    Dex: { primary: 'bg-green-700' },
    Int: { primary: 'bg-blue-700' },
    Str: { primary: 'bg-red-700' },
    StrDex: { primary: 'bg-red-700', secondary: 'bg-green-700' },
    StrInt: { primary: 'bg-red-700', secondary: 'bg-blue-700' },
  };

  const getFilteredItems = (category: keyof typeof sortedBaseTypes) =>
    useMemo(
      () =>
        sortedBaseTypes[category]
          .filter(
            (item) =>
              item.DefenceType &&
              selectedDefenceTypes.includes(item.DefenceType),
          )
          .map((item) => ({
            ...item,
            imgBg: item?.DefenceType ? colourMap[item.DefenceType] : undefined,
          })),
      [sortedBaseTypes, category, selectedDefenceTypes],
    );

  // Use the utility function for each category
  const helmets = getFilteredItems('Helmets');
  const bodyArmours = getFilteredItems('Body Armours');
  const gloves = getFilteredItems('Gloves');
  const boots = getFilteredItems('Boots');

  const clearSelections = () => {
    setselectedHelmets([]);
    setSelectedBodyArmours([]);
    setSelectedGloves([]);
    setSelectedBoots([]);
  };

  return (
    <div className={twMerge('mx-auto', className)}>
      <div className="flex flex-wrap gap-4 rounded-lg border border-primary-900 p-4 sm:gap-6">
        <div className="flex w-full items-center gap-6 md:mr-4 md:w-auto">
          <MultiSelect
            onSelectionChange={(val) => {
              clearSelections();
              setSelectedDefenceTypes(val as ArmorDefenceType[]);
            }}
            className="w-full md:w-72"
            placeholder="Select defence(s)"
            options={ARMOR_DEFENCE_TYPES.map((val) => ({
              value: val,
              display: val,
              imgSrc: `/attribute-icons/${val}.png`,
            }))}
          />
        </div>
        {[helmets, bodyArmours, gloves, boots].map((bases, index) => {
          const categoryMap: Record<
            number,
            {
              display: string;
              options: (BaseType & { imgBg?: SelectOption['imgBg'] })[];
              setter: React.Dispatch<React.SetStateAction<string[]>>;
            }
          > = {
            0: {
              display: 'Helmets',
              setter: setselectedHelmets,
              options: helmets,
            },
            1: {
              display: 'Body Armours',
              setter: setSelectedBodyArmours,
              options: bodyArmours,
            },
            2: {
              display: 'Gloves',
              setter: setSelectedGloves,
              options: gloves,
            },
            3: { display: 'Boots', setter: setSelectedBoots, options: boots },
          };

          const { display, options, setter } = categoryMap[index];

          return (
            <div
              key={index}
              className="flex w-[47%] flex-col items-center justify-between gap-2 md:w-52"
            >
              <span>{display}</span>
              <MultiSelect
                disabled={!selectedDefenceTypes.length}
                compactDisplay={true}
                className="w-full"
                key={selectedDefenceTypes.toString()}
                options={options.map((option) => ({
                  value: option.Name,
                  display: option.Name,
                  imgSrc: option.IconPath,
                  imgBg: option?.imgBg,
                }))}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const FilterLab = ({
  hasuraUri,
  sortedBaseTypes,
}: {
  hasuraUri: string;
  sortedBaseTypes: SortedBaseTypes;
}) => {
  const colorMap: string[] = [
    'bg-primary-800',
    'bg-primary-800',
    'bg-primary-600',
    'bg-primary-800',
    'bg-primary-400',
  ];

  const values = ['Regular', 'Semi', 'Very', 'Uber', 'OMEGA'];

  const images = [
    '/KEKWAIT.png',
    '/KEKW.png',
    '/KEKW_HYPER.png',
    '/KEKW_OMEGA.jpg',
    '/KEKW_ULTRA_OMEGA.jpg',
  ];

  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <div className="mt-40 flex h-full w-full flex-col gap-16">
          <section className="flex flex-col gap-1">
            <h2>Strictness</h2>
            <DiscreteSlider
              initialValue={values[1]}
              values={values}
              colors={colorMap}
              images={images}
              onChange={(val) => console.log(val)}
            />
          </section>

          <DefenceSelection
            className="w-full"
            sortedBaseTypes={sortedBaseTypes}
          />
        </div>
      </GraphQLAppWrapper>
    </>
  );
};
