import { saveToLocalDb, getLocalData } from './db';

import { PUBLIC_WORK } from './constants';

const publicWorkApiConditionCb = ({ sameOrigin, url }) =>
  !sameOrigin && url.pathname === '/api/work-public/';

const publicWorkApiHandlerCb = async ({ request }) => {
  const isOnline = 'onLine' in navigator && navigator.onLine;

  try {
    if (isOnline) {
      const res = await fetch(request);
      const clonedRes = res.clone();

      const clonedResponseBody = await clonedRes.text(); // Read the body as text
      const clonedBody = JSON.parse(clonedResponseBody); // Parse the body as JSON

      await saveToLocalDb({ data: clonedBody, key: PUBLIC_WORK });

      return res;
    }

    const localData = await getLocalData(PUBLIC_WORK);

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

export { publicWorkApiConditionCb, publicWorkApiHandlerCb };
