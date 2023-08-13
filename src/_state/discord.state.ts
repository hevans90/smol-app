import { map } from 'nanostores';
import type { AuthStore } from './models';

export const discordStore = map<AuthStore>({
  token: '',
  expiry: '',
  username: '',
  id: '',
});
