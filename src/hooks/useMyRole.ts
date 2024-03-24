import { jwtDecode } from 'jwt-decode';

type Role = 'user' | 'dev';

export const useMyRole = (): Role => {
  const myToken = localStorage.getItem('hasura_token');

  if (!myToken) {
    return 'user';
  }

  const decoded: {
    hasuraUserId: string;
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': string[];
      'x-hasura-default-role': string;
    };
  } = jwtDecode(myToken);

  return decoded['https://hasura.io/jwt/claims'][
    'x-hasura-default-role'
  ] as Role;
};
