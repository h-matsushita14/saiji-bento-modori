exports.handler = async (event) => {
  const gasApiUrl = process.env.GAS_API_URL;

  if (!gasApiUrl) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GAS_API_URL is not defined in environment variables.' }),
    };
  }

  // GETリクエストの場合
  if (event.httpMethod === 'GET') {
    const url = event.queryStringParameters
      ? `${gasApiUrl}?${new URLSearchParams(event.queryStringParameters).toString()}`
      : gasApiUrl;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  // POSTリクエストの場合
  if (event.httpMethod === 'POST') {
    try {
      const response = await fetch(gasApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: event.body,
        redirect: 'follow'
      });
      const data = await response.json();
      return {
        statusCode: 200,
        body: JSON.stringify(data),
      };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  return {
    statusCode: 405,
    body: 'Method Not Allowed',
  };
};