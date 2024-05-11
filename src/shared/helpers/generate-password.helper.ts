import { LOWER_CHARACTERS, NUMBER_CHARACTERS, SPECIAL_CHARACTERS, UPPER_CHARACTERS } from 'shared/constants/common.constant';

export const generatePassword = () => {
  const password = [
    generateRandomString(UPPER_CHARACTERS),
    generateRandomString(LOWER_CHARACTERS),
    generateRandomString(NUMBER_CHARACTERS),
    generateRandomString(SPECIAL_CHARACTERS),
  ].join('');
  return password;
};

const generateRandomString = (characters: string) => {
  let result = '';
  // just take 2 characters
  for (let i = 0; i < 2; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
