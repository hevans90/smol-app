import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import PoECharacters from './react/PoECharacters';
import Profile from './react/Profile';

export const ProfilePage = ({ hasuraUri }: { hasuraUri: string }) => {
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <Profile />
        <PoECharacters />
      </GraphQLAppWrapper>
    </>
  );
};
