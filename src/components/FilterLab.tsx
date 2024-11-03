import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import { DiscreteSlider } from './react/ui/DiscreetSlider';

export const FilterLab = ({ hasuraUri }: { hasuraUri: string }) => {
  const colorMap: string[] = [
    'bg-primary-800',
    'bg-primary-800',
    'bg-primary-600',
    'bg-primary-500',
    'bg-primary-400',
  ];

  const values = [
    'Semi Strict',
    'Strict',
    'Very Strict',
    'Uber Strict',
    'OMEGA Strict',
  ];

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
        <DiscreteSlider
          initialValue={values[1]}
          values={values}
          colors={colorMap}
          images={images}
          onChange={(val) => console.log(val)}
        />
      </GraphQLAppWrapper>
    </>
  );
};
