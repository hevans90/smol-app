import { useSubscription } from '@apollo/client';
import { twMerge, type ClassNameValue } from 'tailwind-merge';
import {
  RegisteredUsersDocument,
  type RegisteredUsersSubscription,
} from '../../graphql-api';

export const RegisteredUserCount = ({
  className,
}: {
  className?: ClassNameValue;
}) => {
  const { data } = useSubscription<RegisteredUsersSubscription>(
    RegisteredUsersDocument,
  );

  const count = data?.user_aggregate?.aggregate?.count;

  return count !== null ? (
    <div className={twMerge('', className)}>
      <span className="text-primary-300">{count ?? 0}</span> smol exiles
      registered
    </div>
  ) : null;
};
