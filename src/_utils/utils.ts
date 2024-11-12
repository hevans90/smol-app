import basesResponse from '../assets/bases/all-basetypes.json';
import {
  type ArmorDefenceType,
  type BaseItemResponse,
  type BaseType,
  type SortedBaseTypes,
  ARMOR_DEFENCE_TYPES,
  BASE_TYPE_CATEGORIES,
  exclusions,
} from '../models/base-types';

export const getSortedBaseItems = () => {
  const basesData = (basesResponse as { data: BaseItemResponse[] }).data.filter(
    (item) => BASE_TYPE_CATEGORIES.includes(item.ItemClassesName),
  );

  const baseItemsWithoutExclusions = filterExclusions(basesData, exclusions);

  const baseItemsWithDefenceTypes: BaseType[] = baseItemsWithoutExclusions.map(
    (item) => ({
      ...item,
      DefenceType: getDefenceType(item.IconPath),
    }),
  );

  return baseItemsWithDefenceTypes.reduce<SortedBaseTypes>((acc, obj) => {
    const key = obj.ItemClassesName;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {} as SortedBaseTypes);
};

const filterExclusions = (
  items: BaseItemResponse[],
  exclusions: { [key in keyof Partial<BaseItemResponse>]: string }[],
): BaseItemResponse[] =>
  items.filter(
    (item) =>
      !exclusions.some((exclusion) =>
        Object.entries(exclusion).some(([key, value]) =>
          item[key as keyof BaseItemResponse].includes(value),
        ),
      ),
  );

const getDefenceType = (iconPath: string): ArmorDefenceType | undefined =>
  ARMOR_DEFENCE_TYPES.find((defenceType) => iconPath.includes(defenceType)) as
    | ArmorDefenceType
    | undefined;
