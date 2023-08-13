import spinner from '../../../icons/spinner.svg';

export const Spinner = (props: { width?: number; height?: number }) => {
  return <img src={spinner} {...props} />;
};
