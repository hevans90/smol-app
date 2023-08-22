export const errorMap = {
  USER_LIMIT_REACHED:
    'Signups are now closed for Trial of the Smol. Come back next league!',
  MULTIPLE_USERS:
    'Somehow you have managed to create multiple users. This is bad.',
};

export type ErrorTypes = keyof typeof errorMap;
