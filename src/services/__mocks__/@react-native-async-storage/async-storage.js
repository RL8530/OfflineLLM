const asyncStorage = {};

export default {
  getItem: jest.fn((key) => {
    return Promise.resolve(asyncStorage[key] || null);
  }),

  setItem: jest.fn((key, value) => {
    asyncStorage[key] = value;
    return Promise.resolve();
  }),

  removeItem: jest.fn((key) => {
    delete asyncStorage[key];
    return Promise.resolve();
  }),

  clear: jest.fn(() => {
    Object.keys(asyncStorage).forEach((key) => {
      delete asyncStorage[key];
    });
    return Promise.resolve();
  }),

  getAllKeys: jest.fn(() => {
    return Promise.resolve(Object.keys(asyncStorage));
  }),
};
