const edges = [[1, 10], [10, 30], [30, 40], [40, 100], [30, -50], [-50, 40]];

const g: Map<any, any> = new Map()
for (const [u, v] of edges) {
  if (!g.has(u)) g.set(u, []);
  if (!g.has(v)) g.set(v, []);
  g.get(u).push(v);
}

clear();
log(g)
