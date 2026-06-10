Proposal: Support custom Playwright chromium.launch() options

Problem

Currently, @heymp/scratchpad hardcodes the chromium.launch() call to only accept headless and devtools:

const browser = await playwright['chromium'].launch({
  headless: !!processor.opts.headless,
  devtools: !!processor.opts.devtools
});

There's no way to pass additional launch arguments (e.g. --remote-debugging-port, --remote-allow-origins=*) which are needed for use cases like connecting external tools via CDP.

Use Case

I want to open a CDP port so an external agent (e.g. an AI browser automation tool) can connect to the scratchpad-launched browser:

export default Scratchpad.defineConfig({
  url: 'https://www.redhat.com/en/dashboard',
  headless: false,
  launchOptions: {
    args: [
      '--remote-debugging-port=9222',
      '--remote-allow-origins=*'
    ]
  }
});

Suggested Change

Add a launchOptions field to the Config type that passes through to Playwright's chromium.launch(). The existing headless and devtools fields would continue to work as top-level shortcuts but launchOptions
would allow full control.

Config type change:

import type { LaunchOptions } from 'playwright';
export type Config = {
  headless?: boolean;
  devtools?: boolean;
  tsWrite?: boolean;
  url?: string;
  login?: boolean;
  rerouteDir?: string;
  bypassCSP?: boolean;
  launchOptions?: LaunchOptions;
  playwright?: (page: PlaywrightConfig) => Promise<void>;
};

browser.ts change:

const browser = await playwright['chromium'].launch({
  headless: !!processor.opts.headless,
  devtools: !!processor.opts.devtools,
  ...processor.opts.launchOptions,
});

Top-level headless/devtools would take precedence unless you'd prefer the spread to win (just swap the order). Using Playwright's own LaunchOptions type keeps the API future-proof without scratchpad needing to
track new Playwright features.

Scope

• Add launchOptions?: LaunchOptions to the Config type in src/config.ts
• Spread it into the chromium.launch() call in src/browser.ts
• No breaking changes to existing configs
