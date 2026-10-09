import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { withDatabase } from '../support/database-fixture.js';
import { completed } from '../support/receipt-harness.js';
import { productionApp } from '../support/production-harness.js';

function sqlState(code: string) {
  return (error: unknown): boolean =>
    typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}

void test('runtime cannot insert already-advanced production lifecycles or alter pinned bindings', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare();
      await assert.rejects(
        db.runtime.query(
          "INSERT INTO production.production_order(installation_id,authority_scope,customer_id,order_id,sales_order_id,item_id,record,state) SELECT installation_id,authority_scope,customer_id,$2::uuid,sales_order_id,item_id,record||jsonb_build_object('id',$2::uuid::text,'state','IN_PROGRESS'),'IN_PROGRESS' FROM production.production_order WHERE order_id=$1",
          [p.orderId, randomUUID()],
        ),
        sqlState('23514'),
      );
      await assert.rejects(
        db.runtime.query(
          "INSERT INTO production.operation(installation_id,authority_scope,customer_id,operation_id,order_id,record,state) SELECT installation_id,authority_scope,customer_id,$2::uuid,order_id,record||jsonb_build_object('id',$2::uuid::text,'state','COMPLETED'),'COMPLETED' FROM production.operation WHERE operation_id=$1",
          [p.ops[0], randomUUID()],
        ),
        sqlState('23514'),
      );
      await assert.rejects(
        db.runtime.query(
          "INSERT INTO production.allocation(installation_id,authority_scope,customer_id,allocation_id,order_id,record,state) SELECT installation_id,authority_scope,customer_id,$2::uuid,order_id,record||jsonb_build_object('id',$2::uuid::text,'state','ISSUED'),'ISSUED' FROM production.allocation WHERE allocation_id=$1",
          [p.allocationId, randomUUID()],
        ),
        sqlState('23514'),
      );
      await assert.rejects(
        db.runtime.query(
          "UPDATE production.production_order SET state='PARTIALLY_COMPLETED',record=record||jsonb_build_object('state','PARTIALLY_COMPLETED','route',jsonb_build_array()) WHERE order_id=$1",
          [p.orderId],
        ),
        sqlState('23514'),
      );
      await assert.rejects(
        db.runtime.query(
          "UPDATE production.operation SET state='COMPLETED',record=record||jsonb_build_object('state','COMPLETED','station','PLASMA') WHERE operation_id=$1",
          [p.ops[0]],
        ),
        sqlState('23514'),
      );
      await assert.rejects(
        db.runtime.query(
          "UPDATE production.allocation SET state='RELEASED',record=record||jsonb_build_object('state','RELEASED','kg','1') WHERE allocation_id=$1",
          [p.allocationId],
        ),
        sqlState('23514'),
      );
      await assert.rejects(
        db.runtime.query(
          "INSERT INTO production.operation(installation_id,authority_scope,customer_id,operation_id,order_id,record,state) SELECT installation_id,authority_scope,$3::uuid,$2::uuid,order_id,record||jsonb_build_object('id',$2::uuid::text,'state','PLANNED'),'PLANNED' FROM production.operation WHERE operation_id=$1",
          [p.ops[0], randomUUID(), h.people.otherCustomerId],
        ),
        sqlState('23503'),
      );
      assert.equal(
        (
          await db.owner.query<{ state: string }>(
            'SELECT state FROM production.production_order WHERE order_id=$1',
            [p.orderId],
          )
        ).rows[0]?.state,
        'IN_PROGRESS',
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            'SELECT count(*)::int AS n FROM production.operation WHERE order_id=$1',
            [p.orderId],
          )
        ).rows[0]?.n,
        1,
      );
      completed(await h.run(h.complete(p.ops[0]!, p.source).input), 'accepted');
    } finally {
      await h.app.stop();
    }
  }));

void test('source facts, route snapshots, product batches and MAKE links retain database immutability and least privilege', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare();
      completed(await h.run(h.complete(p.ops[0]!, p.source).input), 'accepted');
      const protectedTables = [
        'production.source_fact',
        'production.route_snapshot',
        'production.product_batch',
        'sales.make_reference',
      ] as const;
      for (const table of protectedTables) {
        assert.ok(
          (await db.owner.query<{ n: number }>(`SELECT count(*)::int AS n FROM ${table}`)).rows[0]!
            .n > 0,
        );
        await assert.rejects(db.runtime.query(`DELETE FROM ${table}`), sqlState('42501'));
        const selfAssignment =
          table === 'production.route_snapshot'
            ? 'route=route'
            : table === 'production.product_batch'
              ? 'batch_id=batch_id'
              : table === 'sales.make_reference'
                ? 'production_order_id=production_order_id'
                : 'data=data';
        await assert.rejects(
          db.runtime.query(`UPDATE ${table} SET ${selfAssignment}`),
          sqlState('42501'),
        );
        await assert.rejects(
          db.owner.query(`UPDATE ${table} SET ${selfAssignment}`),
          sqlState('23514'),
        );
        await assert.rejects(db.owner.query(`DELETE FROM ${table}`), sqlState('23514'));
      }
      await assert.rejects(
        db.runtime.query('ALTER TABLE production.source_fact DISABLE TRIGGER source_immutable'),
        sqlState('42501'),
      );
      await assert.rejects(
        db.runtime.query(
          'INSERT INTO production.source_fact(installation_id,authority_scope,customer_id,fact_id,order_id,operation_id,kind,data,issuer,subject,command_key,actor_role) SELECT installation_id,authority_scope,$1::uuid,$2::uuid,order_id,operation_id,kind,data,issuer,subject,command_key,actor_role FROM production.source_fact LIMIT 1',
          [h.people.otherCustomerId, randomUUID()],
        ),
        sqlState('23514'),
      );
      await assert.rejects(
        db.runtime.query(
          "INSERT INTO production.source_fact(installation_id,authority_scope,customer_id,fact_id,order_id,operation_id,kind,data,issuer,subject,command_key,actor_role) SELECT installation_id,authority_scope,customer_id,$1,order_id,operation_id,'CONSUMPTION',data,issuer,subject,command_key,actor_role FROM production.source_fact LIMIT 1",
          [randomUUID()],
        ),
        sqlState('23514'),
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            'SELECT count(*)::int AS n FROM production.product_batch',
          )
        ).rows[0]?.n,
        1,
      );
      assert.equal(
        (
          await db.owner.query<{ n: number }>(
            'SELECT count(*)::int AS n FROM production.source_fact',
          )
        ).rows[0]?.n,
        2,
      );
    } finally {
      await h.app.stop();
    }
  }));
void test('missing or null JSON identity bindings fail even at legal initial production states', async () =>
  withDatabase(async (db) => {
    const h = await productionApp(db);
    try {
      const p = await h.prepare();
      for (const record of [
        {},
        {
          id: null,
          customerId: null,
          salesOrderId: null,
          itemId: null,
          state: null,
          routeVersion: 0,
          route: [],
        },
      ]) {
        const id = randomUUID();
        await assert.rejects(
          db.runtime.query(
            "INSERT INTO production.production_order(installation_id,authority_scope,customer_id,order_id,sales_order_id,item_id,record,state) SELECT installation_id,authority_scope,customer_id,$2::uuid,sales_order_id,item_id,$3::jsonb,'DRAFT' FROM production.production_order WHERE order_id=$1",
            [p.orderId, id, JSON.stringify(record)],
          ),
          sqlState('23514'),
        );
        assert.equal(
          (
            await db.owner.query<{ n: number }>(
              'SELECT count(*)::int n FROM production.production_order WHERE order_id=$1',
              [id],
            )
          ).rows[0]?.n,
          0,
        );
      }
      for (const table of ['operation', 'allocation'] as const) {
        const column = table === 'operation' ? 'operation_id' : 'allocation_id',
          source = table === 'operation' ? p.ops[0] : p.allocationId;
        for (const record of [
          {},
          { id: null, productionOrderId: null, state: null, index: 0, station: 'PLASMA', kg: '1' },
        ]) {
          await assert.rejects(
            db.runtime.query(
              `INSERT INTO production.${table}(installation_id,authority_scope,customer_id,${column},order_id,record,state) SELECT installation_id,authority_scope,customer_id,$2::uuid,order_id,$3::jsonb,'PLANNED' FROM production.${table} WHERE ${column}=$1`,
              [source, randomUUID(), JSON.stringify(record)],
            ),
            sqlState('23514'),
          );
        }
      }
    } finally {
      await h.app.stop();
    }
  }));
