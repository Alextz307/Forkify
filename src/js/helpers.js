import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { TIMEOUT_SEC } from './config.js';

const timeout = function (s) {
  return new Promise(function (_, reject) {
    setTimeout(function () {
      reject(new Error(`Request took too long! Timeout after ${s} seconds.`));
    }, s * 1000);
  });
};

export const AJAX = async function (url, uploadData = undefined) {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadData),
    };

    const fetchPromise = uploadData ? fetch(url, options) : fetch(url);

    const response = await Promise.race([fetchPromise, timeout(TIMEOUT_SEC)]);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`${data.message} (${response.status})`);
    }

    return data;
  } catch (err) {
    throw err;
  }
};
