/// <reference lib="dom" />

const requestTimeoutMs = 5000;

const internalHeaders = {
  "x-internal-key": process.env.INTERNAL_SERVICE_KEY!,
};

const requestWithRetry = async (fn: () => Promise<any>, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};

export const internalGet = async (url: string, params?: any) => {
  return requestWithRetry(async () => {
    const requestUrl = params
      ? `${url}?${new URLSearchParams(params).toString()}`
      : url;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const res = await fetch(requestUrl, {
        method: "GET",
        headers: internalHeaders,
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  });
};

export const internalPost = async (url: string, body?: any) => {
  return requestWithRetry(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          ...internalHeaders,
          "content-type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }
      return res.json();
    } finally {
      clearTimeout(timeout);
    }
  });
};
