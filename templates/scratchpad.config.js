import * as Scratchpad from '@heymp/scratchpad';

export default Scratchpad.defineConfig({
  devtools: true,
  url: 'https://www.google.com',
  playwright: async (args) => {
    const { page } = args;
    await Scratchpad.rerouteDocument(page, './pages');
  }
});
