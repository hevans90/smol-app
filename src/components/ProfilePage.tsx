import GraphQLAppWrapper from '../_utils/GraphQLAppWrapper';
import PoECharacters from './react/PoECharacters';
import PoEProfile from './react/PoEProfile';

export const ProfilePage = ({ hasuraUri }: { hasuraUri: string }) => {
  return (
    <>
      <GraphQLAppWrapper uri={hasuraUri}>
        <PoEProfile />
        <PoECharacters />
      </GraphQLAppWrapper>
    </>
  );
};
