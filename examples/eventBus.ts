/// <reference path="../types.d.ts" />
clear();

class EventBusMessage extends Event {
  constructor(public data: any) {
    super('message');
  }
}

class EventBus extends EventTarget {
  constructor() {
    super();
  }
  emit(event: any, data: any) {
    this.dispatchEvent(new EventBusMessage({ event, data }));
  }
}

const eventBus = new EventBus();

function* eventBusGenerator() {
  while (true) {
    window.promise = new Promise(resolve => eventBus.addEventListener('message', (e) => resolve(e), { once: true }));
    yield window.promise; 
  }
}

setInterval(() => {
  eventBus.emit('tick', Date.now());
}, 1000);

let i = 0;
for await (const message of eventBusGenerator()) {
  if (i > 5) break;
  i++;
  log(message);
}

log('complete', window.promise);
