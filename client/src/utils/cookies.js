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
  // Make sure we preserve all user fields from the response
  const userToStore = {
    ...userData,
    user: {
      ...userData.user,
      // Only set default values if fields are undefined/null
      username: userData.user.username || userData.user.username,
      cochingName: userData.user.cochingName || userData.user.cochingName,  // Changed from subject
      address: userData.user.address || userData.user.address
    }
  };
  setCookie('user', JSON.stringify(userToStore));
  setCookie('token', userData.token);
};

export const getUserFromCookie = () => {
  const userCookie = getCookie('user');
  return userCookie ? JSON.parse(userCookie) : null;
};

export const clearUserCookies = () => {
  removeCookie('user');
  removeCookie('token');
};
