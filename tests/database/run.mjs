// In-memory PostgreSQL only: never reads .env, accepts no connection URL.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { btree_gist } from '@electric-sql/pglite/contrib/btree_gist';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const db = new PGlite({ extensions: { btree_gist, pgcrypto } });
let passed = 0;
const uuid = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const user = n => uuid(100 + n);
const org = n => uuid(n);
const property = n => uuid(200 + n);
const guest = n => uuid(300 + n);
async function test(name, fn) {
  await db.exec('BEGIN');
  try { await fn(); passed++; console.log(`PASS ${name}`); }
  finally { await db.exec('ROLLBACK'); }
}
async function asUser(n, aal = 'aal1') {
  await db.exec('RESET ROLE');
  await db.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: user(n), aal })]);
  await db.exec('SET LOCAL ROLE authenticated');
}
async function count(table) { return Number((await db.query(`SELECT count(*) AS n FROM public.${table}`)).rows[0].n); }
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id uuid PRIMARY KEY, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb DEFAULT '{}');
    CREATE TABLE auth.mfa_factors (id uuid DEFAULT gen_random_uuid(), user_id uuid, status text);
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claims', true), '')::jsonb $$;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT (auth.jwt()->>'sub')::uuid $$;
    GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA auth TO anon, authenticated, service_role;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  `);
  const journal = JSON.parse(await readFile(new URL('../../drizzle/meta/_journal.json', import.meta.url)));
  for (const entry of journal.entries) {
    const sql = await readFile(new URL(`../../drizzle/${entry.tag}.sql`, import.meta.url), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint')) if (statement.trim()) await db.exec(statement);
  }
  console.log(`PASS clean installation of ${journal.entries.length} migrations`);
  for (let n = 1; n <= 8; n++) await db.query('INSERT INTO auth.users(id,email,email_confirmed_at) VALUES ($1,$2,now())', [user(n), `user${n}@example.test`]);
  await db.query('INSERT INTO public.organizations(id,name,slug) VALUES ($1,\'A\',\'a\'),($2,\'B\',\'b\')', [org(1),org(2)]);
  for (const [n,o,role,status] of [[1,1,'super_admin','active'],[2,1,'admin','active'],[3,1,'operations','active'],[4,1,'owner','active'],[5,1,'vendor','active'],[6,1,'owner','suspended'],[7,2,'super_admin','active']]) {
    await db.query('INSERT INTO public.organization_members(organization_id,user_id,role,status) VALUES($1,$2,$3,$4)',[org(o),user(n),role,status]);
  }
  await db.query('INSERT INTO public.owners(id,organization_id,user_id,legal_name) VALUES($1,$2,$3,\'Owner A\'),($4,$2,$5,\'Suspended\')', [uuid(401),org(1),user(4),uuid(402),user(6)]);
  for (const [n,o,owner] of [[1,1,401],[2,1,402],[3,2,null]]) {
    await db.query("INSERT INTO public.properties(id,organization_id,owner_id,name,slug,property_type,address_line_1) VALUES($1,$2,$3,'Property',$4,'apartment','Test address')",[property(n),org(o),owner?uuid(owner):null,`p${n}`]);
    await db.query("INSERT INTO public.guests(id,organization_id,first_name,last_name) VALUES($1,$2,'Test','Guest')",[guest(n),org(o)]);
    await db.query("INSERT INTO public.bookings(organization_id,property_id,guest_id,check_in_date,check_out_date) VALUES($1,$2,$3,'2030-01-01','2030-01-03')",[org(o),property(n),guest(n)]);
  }
  for (const [n,properties,guests] of [[1,2,2],[2,2,2],[3,2,2],[4,1,0],[5,0,0],[6,0,0],[7,1,1],[8,0,0]]) {
    await test(`role/user ${n}: properties, guests, bookings tenant isolation`, async () => {
      await asUser(n); assert.equal(await count('properties'),properties); assert.equal(await count('guests'),guests); assert.equal(await count('bookings'),properties);
    });
  }
  await test('anonymous callers cannot invoke privileged property RPC', async () => {
    await db.exec('SET LOCAL ROLE anon');
    await assert.rejects(db.query('SELECT public.can_read_property($1,$2)',[org(1),property(1)]),/permission denied/);
  });
  await test('admin can read teammate profiles',async()=>{ await asUser(1); assert.equal(await count('users'),6); });
  const propertyInput = { name: 'New property', slug: 'new-property', propertyType: 'apartment', addressLine1: 'Test address', basePrice: 4500, ownerId: uuid(401), bedrooms: 2 };
  await test('property creation atomically persists unit, owner, price and audit',async()=>{
    await asUser(1);
    const result = await db.query('SELECT public.create_property_complete($1,$2) AS id',[org(1),JSON.stringify(propertyInput)]);
    const id = result.rows[0].id;
    const saved = (await db.query('SELECT owner_id,base_price FROM public.properties WHERE id=$1',[id])).rows[0];
    assert.equal(saved.owner_id,uuid(401)); assert.equal(Number(saved.base_price),4500);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.property_units WHERE property_id=$1',[id])).rows[0].n,1);
    assert.equal((await db.query('SELECT count(*)::int AS n FROM public.audit_logs WHERE entity_id=$1',[id])).rows[0].n,1);
  });
  await test('failed property settings roll back property, unit and audit',async()=>{
    await asUser(1); await db.exec('SAVEPOINT create_test');
    await assert.rejects(db.query('SELECT public.create_property_complete($1,$2)',[org(1),JSON.stringify({...propertyInput,checkInTime:'invalid'})]));
    await db.exec('ROLLBACK TO SAVEPOINT create_test');
    assert.equal((await db.query("SELECT count(*)::int AS n FROM public.properties WHERE slug='new-property'")).rows[0].n,0);
  });
  await test('admin can update units and operations cannot',async()=>{
    await db.query("INSERT INTO public.property_units(organization_id,property_id,name) VALUES($1,$2,'Main unit')",[org(1),property(1)]);
    await asUser(1);
    assert.equal((await db.query('UPDATE public.property_units SET max_guests=6 WHERE property_id=$1 RETURNING id',[property(1)])).rows.length,1);
    await asUser(3);
    assert.equal((await db.query('UPDATE public.property_units SET max_guests=9 WHERE property_id=$1 RETURNING id',[property(1)])).rows.length,0);
  });
  await test('owner cannot read internal documents',async()=>{
    await db.query("INSERT INTO public.property_documents(organization_id,property_id,storage_key,file_name,visibility) VALUES($1,$2,'internal','internal','internal'),($1,$2,'owner','owner','owner')",[org(1),property(1)]);
    await asUser(4); assert.equal(await count('property_documents'),1);
  });
  await test('suspended owner helper returns false even for linked property',async()=>{
    await asUser(6); assert.equal((await db.query('SELECT public.can_read_property($1,$2) AS allowed',[org(1),property(2)])).rows[0].allowed,false);
  });
  await test('enrolled administrator at AAL1 cannot bypass MFA through database',async()=>{
    await db.query("INSERT INTO auth.mfa_factors(user_id,status) VALUES($1,'verified')",[user(1)]);
    await asUser(1); assert.equal(await count('properties'),0);
    await asUser(1,'aal2'); assert.equal(await count('properties'),2);
  });
  await test('database MFA rollout rejects unenrolled administrators',async()=>{
    await db.exec('UPDATE private.security_settings SET require_admin_mfa = true');
    await asUser(1); assert.equal(await count('properties'),0);
    await asUser(3); assert.equal(await count('properties'),2);
  });
  await test('cross-tenant booking references are rejected',async()=>{
    await asUser(3);
    await assert.rejects(db.query("INSERT INTO public.bookings(organization_id,property_id,guest_id,check_in_date,check_out_date) VALUES($1,$2,$3,'2030-02-01','2030-02-03')",[org(1),property(3),guest(1)]),/row-level security/);
  });
  await test('overlapping bookings are rejected by the database',async()=>{
    await asUser(3);
    await assert.rejects(db.query("INSERT INTO public.bookings(organization_id,property_id,guest_id,check_in_date,check_out_date) VALUES($1,$2,$3,'2030-01-02','2030-01-04')",[org(1),property(1),guest(1)]),/bookings_no_active_overlap/);
  });
  await test('adjacent bookings are accepted',async()=>{
    await asUser(3); await db.query("INSERT INTO public.bookings(organization_id,property_id,guest_id,check_in_date,check_out_date) VALUES($1,$2,$3,'2030-01-03','2030-01-04')",[org(1),property(1),guest(1)]);
  });
  await test('last super admin cannot be demoted',async()=>{
    await asUser(1); await assert.rejects(db.query("SELECT public.change_member_role($1,$2,'admin')",[org(1),user(1)]),/last active super admin/);
  });
  await test('administrator cannot escalate to super admin',async()=>{
    await asUser(2); await assert.rejects(db.query("SELECT public.change_member_role($1,$2,'super_admin')",[org(1),user(2)]),/Only a super admin/);
  });
  await test('administrator cannot suspend self',async()=>{
    await asUser(1); await assert.rejects(db.query("SELECT public.change_member_status($1,$2,'suspended')",[org(1),user(1)]),/own access/);
  });
  await test('old invitation does not restore suspended member',async()=>{
    await db.query("INSERT INTO public.organization_invitations(organization_id,email,role,expires_at) VALUES($1,'user6@example.test','admin',now()+interval '1 day')",[org(1)]);
    await asUser(6); await assert.rejects(db.query('SELECT public.accept_organization_invitation()'),/Contact your workspace/);
  });
  await test('invitation accepts once and does not escalate an existing member',async()=>{
    await db.query("INSERT INTO public.organization_invitations(organization_id,email,role,expires_at) VALUES($1,'user3@example.test','super_admin',now()+interval '1 day')",[org(1)]);
    await asUser(3); await db.query('SELECT public.accept_organization_invitation()');
    assert.equal((await db.query('SELECT role FROM public.organization_members WHERE user_id=$1',[user(3)])).rows[0].role,'operations');
    assert.equal((await db.query('SELECT public.accept_organization_invitation() AS org')).rows[0].org,null);
  });
  await test('unverified email cannot accept invitation',async()=>{
    await db.query('UPDATE auth.users SET email_confirmed_at=NULL WHERE id=$1',[user(8)]);
    await asUser(8); await assert.rejects(db.query('SELECT public.accept_organization_invitation()'),/Verified email/);
  });
  await test('shared rate limiter rejects attempt over quota',async()=>{
    await db.exec('SET LOCAL ROLE service_role');
    assert.equal((await db.query("SELECT public.consume_request_limit('test-key',2,60) AS ok")).rows[0].ok,true);
    assert.equal((await db.query("SELECT public.consume_request_limit('test-key',2,60) AS ok")).rows[0].ok,true);
    assert.equal((await db.query("SELECT public.consume_request_limit('test-key',2,60) AS ok")).rows[0].ok,false);
  });
  await test('client cannot choose rate limits',async()=>{
    await asUser(1); await assert.rejects(db.query("SELECT public.consume_request_limit('test-key',100,60)"),/permission denied/);
  });
  await test('all public tables have RLS enabled',async()=>{
    assert.equal((await db.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname='public' AND NOT rowsecurity")).rows[0].n,0);
  });
  console.log(`${passed} database security tests passed`);
} finally { await db.close(); }
