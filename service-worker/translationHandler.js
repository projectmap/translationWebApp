import { getLocalData, saveToLocalDb } from './db';

const tranlationDataCondtionCb = ({ sameOrigin, request }) =>
  !sameOrigin && !request.destination && request.url.includes('api');

const tranlationDataHandlerCb = async ({ request, url }) => {
  const isOnline = 'onLine' in navigator && navigator.onLine;

  const path = url.pathname;

  try {
    if (isOnline) {
      const res = await fetch(request);
      const clonedRes = res.clone();

      const clonedResponseBody = await clonedRes.text(); // Read the body as text
      const clonedBody = JSON.parse(clonedResponseBody); // Parse the body as JSON

      await saveToLocalDb({ data: clonedBody, key: path });

      return res;
    }

    const localData = await getLocalData(path);

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

export { tranlationDataCondtionCb, tranlationDataHandlerCb };
