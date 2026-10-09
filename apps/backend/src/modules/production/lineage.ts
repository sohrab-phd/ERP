import { BusinessRejection } from '@navard/shared-kernel';
interface Input {
  readonly unitId: string;
  readonly kg: string;
}
interface Output {
  readonly kg: string;
  readonly sourceUnitIds: readonly string[];
}
interface Disposition {
  readonly kg: string;
  readonly sourceUnitId: string;
}
const scale = 10n ** 18n;
function amount(value: string): bigint {
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole!) * scale + BigInt(fraction.padEnd(18, '0'));
}
/** Bounded exact capacity proof; links name possible contributing parents, not invented per-parent weights. */
export function validateLineageCapacity(
  inputs: readonly Input[],
  outputs: readonly Output[],
  dispositions: readonly Disposition[],
): void {
  const count = inputs.length + outputs.length + 2,
    sink = count - 1;
  const capacity = Array.from({ length: count }, () => Array<bigint>(count).fill(0n));
  const total = outputs.reduce((n, o) => n + amount(o.kg), 0n);
  for (const [i, input] of inputs.entries()) {
    const left = dispositions
      .filter((d) => d.sourceUnitId === input.unitId)
      .reduce((n, d) => n + amount(d.kg), 0n);
    const available = amount(input.kg) - left;
    if (available < 0n) fail();
    capacity[0]![i + 1] = available;
    for (const [j, output] of outputs.entries())
      if (output.sourceUnitIds.includes(input.unitId))
        capacity[i + 1]![inputs.length + j + 1] = total;
  }
  for (const [j, output] of outputs.entries())
    capacity[inputs.length + j + 1]![sink] = amount(output.kg);
  let flow = 0n;
  while (flow < total) {
    const parent = Array<number>(count).fill(-1),
      queue = [0];
    parent[0] = 0;
    for (let q = 0; q < queue.length && parent[sink] === -1; q++) {
      const u = queue[q]!;
      for (let v = 0; v < count; v++)
        if (parent[v] === -1 && capacity[u]![v]! > 0n) {
          parent[v] = u;
          queue.push(v);
        }
    }
    if (parent[sink] === -1) fail();
    let increment = total - flow;
    for (let v = sink; v !== 0; v = parent[v]!)
      increment = capacity[parent[v]!]![v]! < increment ? capacity[parent[v]!]![v]! : increment;
    for (let v = sink; v !== 0; v = parent[v]!) {
      const u = parent[v]!;
      capacity[u]![v] = capacity[u]![v]! - increment;
      capacity[v]![u] = capacity[v]![u]! + increment;
    }
    flow += increment;
  }
}
function fail(): never {
  throw new BusinessRejection({
    family: 'GUARD_INVARIANT',
    message: 'Result lineage exceeds aggregate consumed source kg',
  });
}
