// Hosted SQL acceptance probe. All synthetic users/workspaces/data live inside
// one transaction which ALWAYS rolls back. Does not send mail, create sessions,
// impersonate real users or modify real records. Not an authenticated browser test.
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import postgres from 'postgres';

const env = parse(readFileSync('.env.local'));
const value = env.MUMBAI_DATABASE_URL;
if (!value) throw new Error('MUMBAI_DATABASE_URL is required; never falls back to DATABASE_URL.');
const target = new URL(value);
const ref = 'tjuviivlguablbkbkfdx';
if (target.pathname !== '/postgres' || !(target.hostname === `db.${ref}.supabase.co` ||
  (target.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(target.username) === `postgres.${ref}`))) {
  throw new Error('Refusing unexpected database target.');
}
const sql = postgres(value, { max: 1, prepare: false, connect_timeout: 10, onnotice: () => {} });
const ids = { admin: randomUUID(), operator: randomUUID(), outsider: randomUUID(), org: randomUUID(), other: randomUUID() };
const rollback = new Error('expected rollback');
let stage = 'connect';
let passed = 0;
const pass = label => { passed++; console.log(`PASS ${label}`); };
try {
  try {
    await sql.begin(async tx => {
      await tx`set local statement_timeout = '15s'`;
      stage = 'isolated fixtures';
      for (const id of [ids.admin, ids.operator, ids.outsider]) {
        await tx`insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data)
          values(${id},${`verification-${id}@example.invalid`},now(),'{}')`;
      }
      for (const id of [ids.org, ids.other]) {
        await tx`insert into public.organizations(id,name,slug) values(${id},'Temporary verification workspace',${`verify-${id}`})`;
      }
      await tx`insert into public.organization_members(organization_id,user_id,role,status) values
        (${ids.org},${ids.admin},'super_admin','active'),(${ids.org},${ids.operator},'operations','active'),
        (${ids.other},${ids.outsider},'operations','active')`;
      async function asUser(id) {
        await tx`reset role`;
        await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub: id, role: 'authenticated', aal: 'aal2' })}, true)`;
        await tx`set local role authenticated`;
      }
      await asUser(ids.admin);
      stage = 'owner create/edit';
      const [owner] = await tx`insert into public.owners(organization_id,legal_name,email,phone,is_active)
        values(${ids.org},'Test owner','owner@example.invalid','',true) returning id`;
      assert.equal((await tx`update public.owners set legal_name='Edited owner' where id=${owner.id} returning legal_name`)[0].legal_name,'Edited owner');
      pass(stage);
      stage = 'property create/edit/unit/amenity';
      const input = { name: 'Temporary verification property', slug: `verify-${randomUUID()}`, propertyType: 'apartment', addressLine1: 'Test address only', ownerId: owner.id, basePrice: 2400, bedrooms: 2 };
      const [property] = await tx`select public.create_property_complete(${ids.org},${tx.json(input)}::jsonb) as id`;
      assert.equal((await tx`update public.properties set name='Edited property' where id=${property.id} returning name`)[0].name,'Edited property');
      assert.equal((await tx`update public.property_units set max_guests=4 where property_id=${property.id} returning max_guests`)[0].max_guests,4);
      const [amenity] = await tx`insert into public.property_amenities(organization_id,property_id,amenity_key,details) values(${ids.org},${property.id},'wifi','Test only') returning id`;
      assert.equal((await tx`delete from public.property_amenities where id=${amenity.id} returning id`).length,1);
      pass(stage);
      await asUser(ids.operator);
      stage = 'guest create/edit';
      const [guest] = await tx`insert into public.guests(organization_id,first_name,last_name,email,phone,identity_verified)
        values(${ids.org},'Test','Guest','guest@example.invalid','',false) returning id`;
      assert.equal((await tx`update public.guests set first_name='Edited' where id=${guest.id} returning first_name`)[0].first_name,'Edited');
      pass(stage);
      stage = 'booking create/edit/cancel';
      const [booking] = await tx`insert into public.bookings(organization_id,property_id,guest_id,check_in_date,check_out_date,status,total_guests,total_price,booking_source)
        values(${ids.org},${property.id},${guest.id},'2035-01-01','2035-01-03','confirmed',2,4800,'direct') returning id`;
      await tx`select public.update_booking(${ids.org},${booking.id},${property.id},${guest.id},'2035-01-02','2035-01-04','confirmed',2,5000,'direct')`;
      assert.equal(Number((await tx`select total_price from public.bookings where id=${booking.id}`)[0].total_price),5000);
      await tx`select public.cancel_booking(${ids.org},${booking.id})`;
      assert.equal((await tx`select status from public.bookings where id=${booking.id}`)[0].status,'cancelled');
      pass(stage);
      stage = 'cleaning task create/complete';
      const [task] = await tx`insert into public.operation_tasks(organization_id,property_id,kind,title,due_date,created_by)
        values(${ids.org},${property.id},'cleaning','Test only','2035-01-04',${ids.operator}) returning id`;
      assert.equal((await tx`update public.operation_tasks set status='completed',version=2 where id=${task.id} returning status`)[0].status,'completed');
      pass(stage);
      stage = 'expense create/void';
      const [expense] = await tx`insert into public.expenses(organization_id,property_id,description,category,amount,incurred_on,created_by)
        values(${ids.org},${property.id},'Test only','supplies',12.50,'2035-01-04',${ids.operator}) returning id`;
      assert.equal((await tx`update public.expenses set status='void',void_reason='Test only',version=2 where id=${expense.id} returning status`)[0].status,'void');
      pass(stage);
      stage = 'report';
      assert.equal((await tx`select * from public.operating_report(${ids.org},'2035-01-01','2035-01-31')`).length,1);
      pass(stage);
      await asUser(ids.admin);
      stage = 'guest import and replay';
      const rows = [{ first_name: 'Imported', last_name: 'Guest', email: 'import@example.invalid', phone: '' }];
      assert.equal((await tx`select public.import_guests(${ids.org},${tx.json(rows)}::jsonb) as result`)[0].result.imported,1);
      assert.equal((await tx`select public.import_guests(${ids.org},${tx.json(rows)}::jsonb) as result`)[0].result.already_imported,true);
      pass(stage);
      stage = 'settings and automation draft';
      assert.equal((await tx`update public.organizations set timezone='Asia/Kolkata' where id=${ids.org} returning id`).length,1);
      assert.equal((await tx`insert into public.automation_drafts(organization_id) values(${ids.org}) returning version`)[0].version,1);
      pass(stage);
      stage = 'cross-workspace read denial';
      await asUser(ids.outsider);
      assert.equal((await tx`select id from public.guests where id=${guest.id}`).length,0);
      assert.equal((await tx`select id from public.bookings where id=${booking.id}`).length,0);
      assert.equal((await tx`select id from public.properties where id=${property.id}`).length,0);
      pass(stage);
      throw rollback;
    });
  } catch (error) { if (error !== rollback) throw error; }
  stage = 'rollback verification';
  assert.equal((await sql`select id from public.organizations where id in (${ids.org},${ids.other})`).length,0);
  assert.equal((await sql`select id from auth.users where id in (${ids.admin},${ids.operator},${ids.outsider})`).length,0);
  pass(stage);
  console.log(`${passed} hosted SQL workflow checks passed; no test records retained. Browser/Auth/SMTP acceptance is separate.`);
} catch (error) {
  console.error(`FAIL ${stage}; code=${error.code ?? 'assertion_or_connection_failure'}; table=${error.table_name ?? 'unknown'}; column=${error.column_name ?? 'unknown'}. Transaction rolled back; no credentials or record contents logged.`);
  process.exitCode = 1;
} finally { await sql.end({ timeout: 5 }); }
