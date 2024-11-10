import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import PoECharacters from './react/PoECharacters';
import Profile from './react/Profile';

export const ProfilePage = ({ hasuraUri }: { hasuraUri: string }) => {
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <div className="mt-48 flex w-full flex-col items-center justify-center">
          <Profile />
          <PoECharacters />
        </div>
      </GraphQLAppWrapper>
    </>
  );
};
