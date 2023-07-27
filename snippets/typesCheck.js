clear();
function* generator(limit) {
  for (let i = 0; i < limit; i++) {
    yield i;
  }
}

const set = new Set([1,2]);
const map = new Map([[1,2]]);

const gen = generator(10);
log([1,3]);
log(gen);
log(gen.next());
log([...gen]);
log(set);
log(map);
log(set.values());
log([...set.values()]);
log([...set.entries()]);
