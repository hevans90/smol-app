import { map } from 'nanostores';

type PoEStore = {
  token: string;
  expiry: string;
  username: string;
};

export const poeStore = map<PoEStore>({
  token: '',
  expiry: '',
  username: '',
});
