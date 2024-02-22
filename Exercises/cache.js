"use strict";

const fs = require("node:fs");
const crypto = require("node:crypto");

const generateKey = (...args) => {
  const key = crypto.createHash("sha256").update(args.join("**")).digest("hex");

  return key;
};

const memoize = (fn, opts = {}) => {
  const cache = new Map();
  const events = {};

  const defaultOpts = {
    timeout: null,
    maxSize: 10,
    maxCount: 10,
    ...opts,
  };

  const memoized = (...args) => {
    args.splice(defaultOpts.maxCount);

    const key = generateKey(...args);

    const record = cache.get(key);

    if (record !== undefined) {
      console.log("read from cache");
      return record;
    }

    const result = fn(...args);
    cache.set(key, result);
    memoized.emit("add", result);

    return result;
  };

  memoized.clear = () => {
    cache.clear();
    memoized.emit("clear");
  };

  memoized.add = (key, result) => {
    if (defaultOpts.maxSize > cache.size) {
      cache.delete(cache.keys()[0]);
    }
    cache.set(key, result);
  };

  memoized.del = (key) => {
    const data = cache.get(key);
    cache.delete(key);
    memoize.emit("del", data);
  };

  memoized.on = (eventName, listener) => {
    events[eventName] = listener;
  };

  memoized.emit = (eventName, ...args) => {
    if (events[eventName]) return events[eventName](...args);
  };

  memoized.on("add", (data) => {
    console.log("data added - ", data);
  });

  memoized.on("del", (data) => {
    console.log("data deleted - ", data);
  });

  memoized.on("clear", () => {
    console.log("cache cleared");
  });

  if (defaultOpts.timeout) {
    setTimeout(() => {
      memoized.clear();
      console.log("cache is expiration");
    }, defaultOpts.timeout);
  }

  return memoized;
};

const sum = (a, b) => a + b;

const memoizedSum = memoize(sum, {
  maxCount: 2,
  timeout: 1000,
});

memoizedSum.on("add", (data) => {
  console.log("my add", data);
});

console.log(memoizedSum(1, 2, 3));
console.log(memoizedSum(1, 2, 3));
console.log(memoizedSum(1, 3));

// memoizeAsync.readFile("cache.js", "utf8", (err, data) => {
//   console.log("data length:", data.length);
// });

// memoizeAsync.readFile("cache.js", "utf8", (err, data) => {
//   console.log("data length:", data.length);
// });
