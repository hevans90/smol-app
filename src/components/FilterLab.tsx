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
import Select from './react/ui/Select';

const DefenceSelection = ({
  className,
  sortedBaseTypes,
}: {
  className?: string;
  sortedBaseTypes: SortedBaseTypes;
}) => {
  const [selectedDefenceType, setSelectedDefenceType] =
    useState<ArmorDefenceType | null>(null);

  const [selectedHelmets, setselectedHelmets] = useState<string[]>([]);
  const [selectedBodyArmours, setSelectedBodyArmours] = useState<string[]>([]);
  const [selectedGloves, setSelectedGloves] = useState<string[]>([]);
  const [selectedBoots, setSelectedBoots] = useState<string[]>([]);

  const helmets = useMemo(
    () =>
      sortedBaseTypes.Helmets.filter(
        (item) => item.DefenceType === selectedDefenceType,
      ),
    [selectedDefenceType],
  );

  const bodyArmours = useMemo(
    () =>
      sortedBaseTypes['Body Armours'].filter(
        (item) => item.DefenceType === selectedDefenceType,
      ),
    [selectedDefenceType],
  );

  const gloves = useMemo(
    () =>
      sortedBaseTypes.Gloves.filter(
        (item) => item.DefenceType === selectedDefenceType,
      ),
    [selectedDefenceType],
  );

  const boots = useMemo(
    () =>
      sortedBaseTypes.Boots.filter(
        (item) => item.DefenceType === selectedDefenceType,
      ),
    [selectedDefenceType],
  );

  const clearSelections = () => {
    setselectedHelmets([]);
    setSelectedBodyArmours([]);
    setSelectedGloves([]);
    setSelectedBoots([]);
  };

  return (
    <div className={twMerge('mx-auto', className)}>
      <div className="flex gap-8 rounded-lg border border-primary-900 p-4">
        <div className="mr-12 flex items-center gap-6">
          <h2 className="text-primary-light m-0">Defence</h2>

          <Select
            className="h-10"
            onSelectChange={(value) => {
              clearSelections();
              setSelectedDefenceType(value as ArmorDefenceType);
            }}
            placeholder="Select defence"
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
              options: BaseType[];
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
            <>
              {selectedDefenceType && (
                <div className="flex flex-col items-center gap-2">
                  <span>{display}</span>
                  <Select
                    className="md:w-48"
                    key={selectedDefenceType}
                    options={options.map((option) => ({
                      value: option.Name,
                      display: option.Name,
                      imgSrc: option.IconPath,
                    }))}
                  />
                </div>
              )}
            </>
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
    'bg-primary-500',
    'bg-primary-400',
  ];

  const values = ['Semi', 'Regular', 'Very', 'Uber', 'OMEGA'];

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
