import { Buffer } from 'node:buffer';
import { BusinessRejection, validUnicode, validUuid } from '@navard/shared-kernel';
import { genealogyRootKinds } from './contracts.js';
import type {
  GenealogyAssociations,
  GenealogyContext,
  GenealogyEdge,
  GenealogyEvent,
  GenealogyNode,
  GenealogyProductionFact,
  GenealogyProductionReference,
  GenealogyQuery,
  GenealogyReceiptOrigin,
  GenealogyReference,
  GenealogyShippingEntry,
  GenealogyShippingReference,
  GenealogyShippingSources,
  GenealogySourcePorts,
  GenealogyTrace,
} from './contracts.js';

const limits = { depth: 32, nodes: 256, edges: 1024, rows: 256, calls: 1024, bytes: 256 * 1024 };
function reject(message: string): never {
  throw new BusinessRejection({ family: 'GUARD_INVARIANT', message });
}
function bounded(condition: boolean): void {
  if (!condition) reject('Trace exceeds bounded query limits');
}
function identity(value: unknown): asserts value is string {
  if (!validUuid(value)) reject('Invalid genealogy source identity');
}
function text(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    !value.trim() ||
    !validUnicode(value) ||
    /[\u0000-\u001f\u007f]/u.test(value) ||
    Buffer.byteLength(value, 'utf8') > 128
  )
    reject('Invalid genealogy source text');
}
function timestamp(value: unknown): void {
  if (value === undefined) return;
  if (
    typeof value !== 'string' ||
    value.length > 40 ||
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/u.exec(value)?.[0] !==
      value ||
    !Number.isFinite(Date.parse(value))
  )
    reject('Invalid genealogy source timestamp');
}
function kg(value: unknown): asserts value is string {
  if (
    typeof value !== 'string' ||
    /^(?:0|[1-9][0-9]{0,19})(?:\.[0-9]{1,18})?$/u.exec(value)?.[0] !== value ||
    !/[1-9]/u.test(value)
  )
    reject('Invalid genealogy source kg');
}
function key(kind: GenealogyNode['kind'], id: string): string {
  return `${kind}:${id}`;
}
interface Material {
  readonly fact: GenealogyProductionFact;
  readonly units: readonly string[];
  readonly parents: readonly string[];
  readonly child?: string;
  readonly kg?: string;
  readonly associations: GenealogyAssociations;
}
function material(fact: GenealogyProductionFact): Material {
  timestamp(fact.occurredAt);
  for (const id of [fact.id, fact.operationId, fact.productionOrderId, fact.salesOrderId])
    identity(id);
  const data = fact.data;
  const associations: GenealogyAssociations = {
    factId: fact.id,
    operationId: fact.operationId,
    productionOrderId: fact.productionOrderId,
    salesOrderId: fact.salesOrderId,
    ...(data.productBatchId === undefined ? {} : { batchId: data.productBatchId as string }),
  };
  if (data.productBatchId !== undefined) identity(data.productBatchId);
  let parents: string[] = [],
    child: string | undefined;
  if (['CONSUMPTION', 'OUTPUT', 'RESIDUAL', 'FINALIZED'].includes(fact.kind)) {
    identity(data.unitId);
    child = data.unitId;
  }
  if (fact.kind === 'OUTPUT') {
    if (!Array.isArray(data.sourceUnitIds) || !data.sourceUnitIds.length)
      reject('Invalid genealogy material source');
    bounded(data.sourceUnitIds.length <= limits.rows);
    parents = data.sourceUnitIds.map((id) => {
      identity(id);
      return id;
    });
    if (!['FINAL', 'WIP'].includes(data.disposition as string))
      reject('Invalid genealogy output disposition');
  } else if (fact.kind === 'RESIDUAL' || fact.kind === 'SCRAP') {
    identity(data.sourceUnitId);
    parents = [data.sourceUnitId];
    if (data.disposition !== fact.kind) reject('Invalid genealogy disposition');
  } else if (
    !['CONSUMPTION', 'FINALIZED', 'ENTRY', 'REFERRAL', 'DECLARATION'].includes(fact.kind)
  ) {
    reject('Invalid genealogy fact kind');
  }
  if (child && parents.includes(child)) reject('Invalid genealogy self lineage');
  if (['OUTPUT', 'RESIDUAL'].includes(fact.kind)) {
    if (typeof data.kind !== 'string' || !data.kind || data.kind.length > 64)
      reject('Invalid genealogy material kind');
    identity(data.locationId);
  }
  if (['CONSUMPTION', 'OUTPUT', 'RESIDUAL', 'SCRAP'].includes(fact.kind)) kg(data.kg);
  return {
    fact,
    parents: [...new Set(parents)],
    units: [...new Set([...parents, ...(child ? [child] : [])])],
    associations,
    ...(child ? { child } : {}),
    ...(typeof data.kg === 'string' ? { kg: data.kg } : {}),
  };
}
function matches(value: Material, ref: GenealogyProductionReference, id: string): boolean {
  return ref === 'UNIT'
    ? value.units.includes(id)
    : ref === 'FACT'
      ? value.fact.id === id
      : ref === 'OPERATION'
        ? value.fact.operationId === id
        : ref === 'ORDER'
          ? value.fact.productionOrderId === id
          : ref === 'SALES_ORDER'
            ? value.fact.salesOrderId === id
            : value.associations.batchId === id;
}
function event(value: Material): GenealogyEvent {
  return {
    ...value.associations,
    kind: value.fact.kind,
    ...(value.kg ? { kg: value.kg } : {}),
    ...(value.fact.occurredAt ? { occurredAt: value.fact.occurredAt } : {}),
  };
}
function entry(value: GenealogyShippingEntry): void {
  for (const id of [value.unitId, value.reservationId, value.itemId]) identity(id);
  kg(value.kg);
}
function validateShipping(value: GenealogyShippingSources): void {
  bounded(value.packages.length <= limits.rows && value.shipments.length <= limits.rows);
  for (const pkg of value.packages) {
    identity(pkg.id);
    identity(pkg.orderId);
    if (pkg.shipmentId !== undefined) identity(pkg.shipmentId);
    if (!['DRAFT', 'PACKED', 'ASSIGNED_TO_SHIPMENT', 'UNPACKED'].includes(pkg.state))
      reject('Invalid genealogy package state');
    bounded(pkg.entries.length <= limits.rows);
    pkg.entries.forEach(entry);
  }
  for (const shipment of value.shipments) {
    identity(shipment.id);
    identity(shipment.orderId);
    timestamp(shipment.dispatchedAt);
    if (!['DRAFT', 'READY', 'LOADING', 'DISPATCHED'].includes(shipment.state))
      reject('Invalid genealogy shipment state');
    bounded(shipment.dispatch.length <= limits.rows);
    for (const row of shipment.dispatch) {
      entry(row);
      identity(row.packageId);
    }
    if (shipment.state !== 'DISPATCHED' && shipment.dispatch.length)
      reject('Invalid genealogy actual dispatch');
  }
}
function shippingMatches(
  value: GenealogyShippingSources,
  ref: GenealogyShippingReference,
  id: string,
): boolean {
  return (
    value.packages.some((p) =>
      ref === 'UNIT'
        ? p.entries.some((e) => e.unitId === id)
        : ref === 'PACKAGE'
          ? p.id === id
          : ref === 'SALES_ORDER'
            ? p.orderId === id
            : false,
    ) ||
    value.shipments.some((s) =>
      ref === 'SHIPMENT'
        ? s.id === id
        : ref === 'SALES_ORDER'
          ? s.orderId === id
          : s.state === 'DISPATCHED' &&
            s.dispatch.some((e) => (ref === 'UNIT' ? e.unitId === id : e.packageId === id)),
    )
  );
}
function validateOrigin(value: GenealogyReceiptOrigin): void {
  for (const id of [
    value.receiptId,
    value.lotId,
    value.unitId,
    value.materialId,
    value.effectId,
    value.locationId,
  ])
    identity(id);
  kg(value.measuredKg);
  text(value.internalCode);
  if (value.productCode !== undefined) text(value.productCode);
  if (!['COIL', 'SHEET', 'ANGLE', 'BEAM', 'OTHER'].includes(value.type))
    reject('Invalid genealogy intake type');
  if (
    typeof value.count !== 'string' ||
    value.count.length > 20 ||
    /^(?:0|[1-9][0-9]*)$/u.exec(value.count)?.[0] !== value.count
  )
    reject('Invalid genealogy intake count');
}

/** A bounded reconstruction from immutable material links; association references never propagate. */
export class GenealogyProjection {
  constructor(private readonly ports: GenealogySourcePorts) {}

  async trace(
    context: GenealogyContext,
    query: GenealogyQuery,
    root: GenealogyReference,
  ): Promise<GenealogyTrace | undefined> {
    if (
      !genealogyRootKinds.includes(root.kind) ||
      !validUuid(root.id) ||
      !validUuid(context.customerId) ||
      !['TraceForward', 'TraceBackward'].includes(query)
    )
      reject('Invalid genealogy query');
    const nodes = new Map<string, GenealogyNode>(),
      edges = new Map<string, GenealogyEdge>();
    const queue: { ref: GenealogyReference; depth: number }[] = [],
      scheduled = new Set<string>();
    const productions = new Map<string, readonly Material[]>(),
      shipping = new Map<string, GenealogyShippingSources>();
    let calls = 0;
    const call = async <T>(work: () => Promise<T>): Promise<T> => {
      bounded(++calls <= limits.calls);
      return work();
    };
    const production = async (ref: GenealogyProductionReference, id: string) => {
      const cacheKey = key(ref, id);
      let rows = productions.get(cacheKey);
      if (!rows) {
        const facts = await call(() => this.ports.production.facts(context, ref, id));
        bounded(facts.length <= limits.rows);
        rows = facts
          .map(material)
          .filter((m) => matches(m, ref, id))
          .sort((a, b) => a.fact.id.localeCompare(b.fact.id));
        productions.set(cacheKey, rows);
      }
      return rows;
    };
    const shipments = async (ref: GenealogyShippingReference, id: string) => {
      const cacheKey = key(ref, id);
      let rows = shipping.get(cacheKey);
      if (!rows) {
        rows = await call(() => this.ports.shipping.sources(context, ref, id));
        validateShipping(rows);
        shipping.set(cacheKey, rows);
      }
      return rows;
    };
    const node = (kind: GenealogyNode['kind'], id: string, extra: Partial<GenealogyNode> = {}) => {
      const k = key(kind, id),
        old = nodes.get(k);
      if (!old) bounded(nodes.size < limits.nodes);
      nodes.set(k, { key: k, kind, id, events: [], ...old, ...extra });
    };
    const schedule = (ref: GenealogyReference, depth: number) => {
      const k = key(ref.kind, ref.id);
      if (scheduled.has(k)) return;
      bounded(depth <= limits.depth);
      node(ref.kind, ref.id);
      scheduled.add(k);
      queue.push({ ref, depth });
    };
    const publish = (edge: GenealogyEdge, ref: GenealogyReference, depth: number) => {
      const current = key(ref.kind, ref.id),
        next = query === 'TraceForward' ? edge.to : edge.from;
      if ((query === 'TraceForward' ? edge.from : edge.to) !== current) return;
      if (!edges.has(edge.key)) bounded(edges.size < limits.edges);
      edges.set(edge.key, edge);
      const split = next.indexOf(':'),
        kind = next.slice(0, split) as GenealogyNode['kind'],
        id = next.slice(split + 1);
      if (kind === 'SCRAP') {
        bounded(depth + 1 <= limits.depth);
        node(kind, id);
      } else schedule({ kind, id }, depth + 1);
    };
    const related = async (id: string) => {
      const facts = await production('UNIT', id),
        sources = await shipments('UNIT', id);
      return facts.length > 0 || shippingMatches(sources, 'UNIT', id);
    };
    const origins = async (ref: 'UNIT' | 'LOT' | 'RECEIPT', id: string) => {
      const rows = await call(() => this.ports.inventory.origins(context, ref, id));
      bounded(rows.length <= limits.rows);
      rows.forEach(validateOrigin);
      return rows.filter((o) =>
        ref === 'UNIT' ? o.unitId === id : ref === 'LOT' ? o.lotId === id : o.receiptId === id,
      );
    };
    const originEdges = (o: GenealogyReceiptOrigin, ref: GenealogyReference, depth: number) => {
      const intake = {
        internalCode: o.internalCode,
        type: o.type,
        count: o.count,
        measuredKg: o.measuredKg,
        ...(o.productCode === undefined ? {} : { productCode: o.productCode }),
      };
      for (const [from, to] of [
        [key('RECEIPT', o.receiptId), key('LOT', o.lotId)],
        [key('LOT', o.lotId), key('UNIT', o.unitId)],
      ])
        publish(
          {
            key: `ORIGIN:${o.receiptId}:${from}:${to}`,
            from: from!,
            to: to!,
            kind: 'ORIGIN',
            kg: o.measuredKg,
            kgMeaning: 'RECEIPT_TOTAL',
          },
          ref,
          depth,
        );
      for (const [kind, id] of [
        ['RECEIPT', o.receiptId],
        ['LOT', o.lotId],
        ['UNIT', o.unitId],
      ] as const)
        if (nodes.has(key(kind, id))) node(kind, id, { intake });
    };
    const productionEdges = (m: Material, ref: GenealogyReference, depth: number) => {
      const f = m.fact;
      if (m.units.includes(ref.id) && ref.kind === 'UNIT') {
        const n = nodes.get(key('UNIT', ref.id))!;
        node('UNIT', ref.id, { events: [...n.events.filter((e) => e.factId !== f.id), event(m)] });
      }
      for (const parent of m.parents) {
        const to = f.kind === 'SCRAP' ? key('SCRAP', f.id) : key('UNIT', m.child!);
        const from = key('UNIT', parent);
        publish(
          {
            key: `${f.kind}:${f.id}:${from}:${to}`,
            from,
            to,
            kind: f.kind as 'OUTPUT' | 'RESIDUAL' | 'SCRAP',
            kg: m.kg!,
            kgMeaning: f.kind === 'SCRAP' ? 'SCRAP_TOTAL' : 'RESULT_TOTAL',
            ...m.associations,
          },
          ref,
          depth,
        );
      }
    };
    const shippingEdges = (
      sources: GenealogyShippingSources,
      ref: GenealogyReference,
      depth: number,
    ) => {
      for (const p of sources.packages) {
        if (ref.kind === 'PACKAGE' && ref.id === p.id) node('PACKAGE', p.id, { state: p.state });
        for (const e of p.entries) {
          const from = key('UNIT', e.unitId),
            to = key('PACKAGE', p.id);
          publish(
            {
              key: `PACKAGE:${p.id}:${e.reservationId}:${e.unitId}`,
              from,
              to,
              kind: 'PACKAGE_CONTENT',
              kg: e.kg,
              kgMeaning: 'PACKAGE_CONTENT',
              salesOrderId: p.orderId,
              reservationId: e.reservationId,
              itemId: e.itemId,
            },
            ref,
            depth,
          );
        }
      }
      for (const s of sources.shipments) {
        if (ref.kind === 'SHIPMENT' && ref.id === s.id)
          node('SHIPMENT', s.id, {
            state: s.state,
            ...(s.dispatchedAt ? { dispatchedAt: s.dispatchedAt } : {}),
          });
        if (s.state !== 'DISPATCHED') continue;
        for (const e of s.dispatch) {
          if (
            query === 'TraceForward' &&
            !nodes.has(key('UNIT', e.unitId)) &&
            root.kind !== 'PACKAGE' &&
            root.kind !== 'SALES_ORDER'
          )
            continue;
          const from = key('PACKAGE', e.packageId),
            to = key('SHIPMENT', s.id);
          const edge: GenealogyEdge = {
            key: `DISPATCH:${s.id}:${e.packageId}:${e.reservationId}:${e.unitId}`,
            from,
            to,
            kind: 'DISPATCH',
            kg: e.kg,
            kgMeaning: 'DISPATCH_CONTENT',
            salesOrderId: s.orderId,
            reservationId: e.reservationId,
            itemId: e.itemId,
            unitId: e.unitId,
          };
          publish(edge, ref, depth);
          // A later reachable Unit can join an already visited shared package.
          if (
            query === 'TraceForward' &&
            ref.kind === 'UNIT' &&
            ref.id === e.unitId &&
            edges.has(`PACKAGE:${e.packageId}:${e.reservationId}:${e.unitId}`)
          )
            publish(edge, { kind: 'PACKAGE', id: e.packageId }, depth + 1);
        }
      }
    };
    let known = false;
    if (root.kind === 'UNIT') known = await related(root.id);
    else if (root.kind === 'LOT' || root.kind === 'RECEIPT') {
      const selected: GenealogyReceiptOrigin[] = [];
      for (const o of await origins(root.kind, root.id))
        if (await related(o.unitId)) selected.push(o);
      known = selected.length > 0;
    } else if (root.kind === 'PACKAGE' || root.kind === 'SHIPMENT')
      known = shippingMatches(await shipments(root.kind, root.id), root.kind, root.id);
    else {
      const facts = await production(root.kind, root.id);
      const sources = root.kind === 'SALES_ORDER' ? await shipments(root.kind, root.id) : undefined;
      known =
        facts.length > 0 ||
        (sources !== undefined && shippingMatches(sources, 'SALES_ORDER', root.id));
      if (known) {
        node(root.kind, root.id);
        const seeds = new Map<string, GenealogyReference>();
        for (const f of facts)
          for (const id of f.units) seeds.set(key('UNIT', id), { kind: 'UNIT', id });
        if (sources) {
          for (const p of sources.packages.filter((p) => p.orderId === root.id))
            seeds.set(key('PACKAGE', p.id), { kind: 'PACKAGE', id: p.id });
          for (const s of sources.shipments.filter((s) => s.orderId === root.id))
            seeds.set(key('SHIPMENT', s.id), { kind: 'SHIPMENT', id: s.id });
        }
        node(root.kind, root.id, {
          events: [...new Map(facts.map((f) => [f.fact.id, event(f)])).values()],
          references: [...seeds.values()].sort((a, b) =>
            key(a.kind, a.id).localeCompare(key(b.kind, b.id)),
          ),
        });
        for (const seed of seeds.values()) schedule(seed, 0);
      }
    }
    if (!known) return undefined;
    schedule(root, 0);
    for (let index = 0; index < queue.length; index++) {
      const { ref, depth } = queue[index]!;
      if (ref.kind === 'UNIT') {
        if (!(await related(ref.id))) reject('Genealogy source relationship unavailable');
        const unit = await call(() => this.ports.inventory.unit(context, ref.id));
        if (!unit || unit.id !== ref.id) reject('Genealogy source Unit unavailable');
        identity(unit.lotId);
        text(unit.kind);
        text(unit.state);
        node('UNIT', ref.id, { state: unit.state, materialKind: unit.kind, lotId: unit.lotId });
        for (const f of await production('UNIT', ref.id)) productionEdges(f, ref, depth);
        shippingEdges(await shipments('UNIT', ref.id), ref, depth);
        for (const o of await origins('UNIT', ref.id)) originEdges(o, ref, depth);
      } else if (ref.kind === 'LOT' || ref.kind === 'RECEIPT') {
        for (const o of await origins(ref.kind, ref.id))
          if (await related(o.unitId)) originEdges(o, ref, depth);
      } else if (ref.kind === 'PACKAGE' || ref.kind === 'SHIPMENT')
        shippingEdges(await shipments(ref.kind, ref.id), ref, depth);
    }
    const result: GenealogyTrace = {
      query,
      root: { ...root },
      nodes: [...nodes.values()]
        .map((n) => ({
          ...n,
          events: [...n.events].sort((a, b) => (a.factId ?? '').localeCompare(b.factId ?? '')),
        }))
        .sort((a, b) => a.key.localeCompare(b.key)),
      edges: [...edges.values()].sort((a, b) => a.key.localeCompare(b.key)),
    };
    bounded(Buffer.byteLength(JSON.stringify(result), 'utf8') <= limits.bytes);
    return result;
  }
}
