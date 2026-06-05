import https from 'https';
import http from 'http';

let cachedABN = process.env.ABN || '00000000000';

/**
 * Fetch ABN from external source
 * Tries to fetch from https://sami-s.dev/.well-known/abn.txt
 * Falls back to environment variable if fetch fails
 */
function fetchABNFromDomain(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    const timeout = 5000;

    const request = protocol.get(url, { timeout }, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          const abn = data.trim();
          if (abn && abn.length === 11 && /^\d+$/.test(abn)) {
            resolve(abn);
          } else {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });

    request.on('error', () => {
      resolve(null);
    });

    request.on('timeout', () => {
      request.abort();
      resolve(null);
    });
  });
}

/**
 * Initialize ABN on startup - tries to fetch once
 */
export async function initializeABN() {
  const url = 'https://sami-s.dev/.well-known/abn.txt';

  try {
    const fetched = await fetchABNFromDomain(url);
    if (fetched) {
      cachedABN = fetched;
      console.log('[ABNConfig] Fetched ABN from sami-s.dev');
      return fetched;
    }
  } catch (error) {
    console.warn('[ABNConfig] Failed to fetch ABN:', error.message);
  }

  console.log('[ABNConfig] Using ABN from environment:', maskABN(cachedABN));
  return cachedABN;
}

/**
 * Get the ABN value
 */
export function getABN() {
  return cachedABN;
}

/**
 * Get masked ABN for display (XXXX78901)
 */
export function maskABN() {
  const abn = cachedABN;
  if (!abn || abn.length < 5) return 'XXXX';
  return 'X'.repeat(abn.length - 5) + abn.slice(-5);
}

export default {
  initializeABN,
  getABN,
  maskABN
};
