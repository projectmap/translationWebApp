import { saveToLocalDb, getLocalData } from './db';
import { API_USER, OFFLINE_CREDENTIAL } from './constants';

const offlineUserInfo = '/api/auth/offline-user/';
const userInfo = '/api/user/';

const userDataConditionCb = ({ sameOrigin, url }) =>
  !sameOrigin &&
  (url.pathname === userInfo || url.pathname === offlineUserInfo);

const userDataHandlerCb = async ({ request, url }) => {
  const isOnline = 'onLine' in navigator && navigator.onLine;

  const key = url.pathname === offlineUserInfo ? OFFLINE_CREDENTIAL : API_USER;
  try {
    if (isOnline) {
      const res = await fetch(request);
      const clonedRes = res.clone();

      const clonedResponseBody = await clonedRes.text(); // Read the body as text
      const clonedBody = JSON.parse(clonedResponseBody); // Parse the body as JSON

      await saveToLocalDb({ data: clonedBody, key });

      return res;
    }

    const localData = await getLocalData(key);

    const customResponseBody = JSON.stringify(localData);
    const customResponseInit = {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'application/json' },
    };

    return new Response(customResponseBody, customResponseInit);
  } catch (error) {
    console.error('Error', error);
  }
};

export { userDataConditionCb, userDataHandlerCb };
