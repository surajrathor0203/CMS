import Cookies from 'js-cookie';

export const setCookie = (name, value, options = {}) => {
  Cookies.set(name, value, { expires: 7, ...options });
};

export const getCookie = (name) => {
  return Cookies.get(name);
};

export const removeCookie = (name) => {
  Cookies.remove(name);
};

export const setUserCookie = (userData) => {
  setCookie('user', JSON.stringify(userData));
  setCookie('token', userData.token);
};

export const getUserFromCookie = () => {
  const userCookie = getCookie('user');
  return userCookie ? JSON.parse(userCookie) : null;
};

// console.log(getUserFromCookie());

export const clearUserCookies = () => {
  removeCookie('user');
  removeCookie('token');
};
