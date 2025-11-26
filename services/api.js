/**
 * A safe version of the fetch API that retries the request if it fails
 * and logs a warning message to the console.
 *
 * @param {string} url - The URL to fetch.
 * @param {object} options - The options to pass to the fetch method.
 * @param {number} retries - The number of retries left, defaults to 2.
 * @param {number} delay - The delay between retries in milliseconds, defaults to 1000.
 * @returns {Promise} A promise that resolves to the response of the fetch request.
 */
export const safeFetch = async (url, options, retries = 2, delay = 1000) => {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries > 0) {
      console.warn(`Retrying... attempts left: ${retries}`);
      await new Promise((res) => setTimeout(res, delay));
      return safeFetch(url, options, retries - 1, delay);
    }
    throw err;
  }
};
