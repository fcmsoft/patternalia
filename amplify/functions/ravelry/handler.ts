import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';

const RAVELRY_BASE = 'https://api.ravelry.com';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const accessKey = process.env['RAVELRY_ACCESS_KEY'];
  const secretKey = process.env['RAVELRY_SECRET_KEY'];

  if (!accessKey || !secretKey) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Missing Ravelry credentials' }) };
  }

  const auth = `Basic ${Buffer.from(`${accessKey}:${secretKey}`).toString('base64')}`;
  const rawPath = event.rawPath;
  const qs = event.rawQueryString ? `?${event.rawQueryString}` : '';

  let ravelryPath: string;
  const patternMatch = rawPath.match(/\/ravelry\/patterns\/(\d+)$/);

  if (rawPath.endsWith('/ravelry/search')) {
    ravelryPath = `/patterns/search.json${qs}`;
  } else if (patternMatch) {
    ravelryPath = `/patterns/${patternMatch[1]}.json${qs}`;
  } else {
    return { statusCode: 404, body: JSON.stringify({ message: 'Not found' }) };
  }

  try {
    const response = await fetch(`${RAVELRY_BASE}${ravelryPath}`, {
      headers: { Authorization: auth },
    });

    const data: unknown = await response.json();

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error('Ravelry proxy error:', err);
    return { statusCode: 502, body: JSON.stringify({ message: 'Ravelry request failed' }) };
  }
};
