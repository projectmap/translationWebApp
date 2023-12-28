import { savePlainDataToLocalDb, getPlainLocalData } from './db';

const coverApiConditionCb = ({ sameOrigin, request, url }) =>
  !sameOrigin &&
  request.destination === 'image' &&
  url.pathname.includes('cover');

const converApiHandlerCb = async ({ url }) => {
  const isOnline = 'onLine' in navigator && navigator.onLine;

  const key = url.pathname;
  try {
    if (isOnline) {
      const requestOptions = {
        redirect: 'follow',
      };

      const res = await fetch(url.href, requestOptions);

      const clonedRes = res.clone();
      const data = await clonedRes.blob();

      await savePlainDataToLocalDb({ data, key });

      return res;
    }

    const localData = await getPlainLocalData(key);

    const customResponseBody = localData.data;

    const customResponseInit = {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'image/jpeg' },
    };

    return new Response(customResponseBody, customResponseInit);
  } catch (error) {
    console.error('Error', error);
  }
};

export { coverApiConditionCb, converApiHandlerCb };
