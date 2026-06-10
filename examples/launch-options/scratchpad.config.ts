export default {
  url: 'https://example.com',
  headless: false,
  launchOptions: {
    args: [
      '--remote-debugging-port=9222',
      '--remote-allow-origins=*',
    ],
  },
};
