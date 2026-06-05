export async function getAccessToken(env, clientId, clientSecret) {
  throw new Error('PayPal integration has been removed');
}

export async function createOrder(env, token, amount, currency = 'AUD') {
  throw new Error('PayPal integration has been removed');
}

export async function captureOrder(env, token, orderId) {
  throw new Error('PayPal integration has been removed');
}
