import { map } from 'nanostores';
import type { AuthStore } from './models';

export const poeStore = map<AuthStore>({
  token: '',
  expiry: '',
  username: '',
  id: '',
});
