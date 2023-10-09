import axios from 'axios';

import { AUTH_URL } from '../config';
import LoginInput from '../types/LoginInput';
import Token from '../types/Token';

export const loginUser = async (loginInput: LoginInput) => {
  // TODO: implement actual login
  // console.log('logging user in:', loginInput.email);
  // await sleep(1000);
  // console.log('logged in');
  const res = await axios.post(`${AUTH_URL}/login`, loginInput);
  console.log(res);

  const authToken: Token = '';
  const refreshToken: Token = '';

  return {
    authToken: authToken,
    refreshToken: refreshToken,
  };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
