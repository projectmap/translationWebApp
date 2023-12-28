import { saveToLocalDb } from './db';
import { CONTACT_US_KEY } from './constants';

const contactConditionCb = ({ sameOrigin, request }) =>
  !sameOrigin && !request.destination && request.url.includes('api/contact');

const contactHandlerCb = async ({ request }) => {
  const clonedRequest = request.clone();

  const isOnline = 'onLine' in navigator && navigator.onLine;

  try {
    if (isOnline) {
      return fetch(request);
    }

    const clonedRequestBody = await clonedRequest.text(); // Read the body as text
    const clonedBody = JSON.parse(clonedRequestBody); // Parse the body as JSON

    await saveToLocalDb({
      data: clonedBody,
      key: CONTACT_US_KEY,
    });

    const customResponseBody = JSON.stringify({
      success:
        'Your message has been saved to local it will be sent when online.',
    });
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

export { contactConditionCb, contactHandlerCb };
