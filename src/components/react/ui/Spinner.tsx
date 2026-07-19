import spinner from '../../../icons/spinner.svg';

export const Spinner = ({
  width = 25,
  height,
}: {
  width?: number;
  height?: number;
} = {}) => {
  return <img src={spinner.src} width={width} height={height ?? width} />;
};
