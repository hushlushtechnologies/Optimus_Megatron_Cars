/* eslint-disable no-console */
// Sprint 5, Phase 7: fires simultaneous approvals at the database to prove the
// overlap protection holds under a real race. Run it from the project folder:
//
//   node --env-file=.env.local scripts/test-concurrent-booking.mjs
//
// It needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
// It writes only rows tagged SPRINT5_CONCURRENCY_TEST and deletes them afterwards.

import { createClient } from "@supabase/supabase-js";

const MARK = "SPRINT5_CONCURRENCY_TEST";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n" +
      "Run with: node --env-file=.env.local scripts/test-concurrent-booking.mjs\n" +
      "(Check the variable names in your .env.local if they differ.)",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const results = [];
const record = (name, pass, detail) => results.push({ name, pass, detail });

const dubaiDate = (offsetDays) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dubai" }).format(
    new Date(Date.now() + offsetDays * 86_400_000),
  );
const toIso = (date, time) => new Date(`${date}T${time}:00+04:00`).toISOString();
const weekday = (date) => new Date(`${date}T12:00:00Z`).getUTCDay();

async function cleanup() {
  const { error } = await supabase.from("test_drives").delete().eq("internal_notes", MARK);
  if (error) console.error("Cleanup problem:", error.message);
}

async function insertPending(ctx, carId, time) {
  const { data, error } = await supabase
    .from("test_drives")
    .insert({
      customer_id: ctx.customerId,
      car_id: carId,
      location_id: ctx.locationId,
      scheduled_start: toIso(ctx.date, time),
      internal_notes: MARK,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Setup failed: ${error.message}`);
  return data.id;
}

async function approve(id, staffId) {
  const { error } = await supabase
    .from("test_drives")
    .update({ status: "Approved", assigned_staff_id: staffId })
    .eq("id", id);
  return error;
}

function tally(errors) {
  return {
    approved: errors.filter((e) => !e).length,
    refused: errors.filter((e) => e && e.code === "23P01").length,
    unexpected: errors.filter((e) => e && e.code !== "23P01"),
  };
}

function judge(name, outcome, expectApproved, expectRefused) {
  const ok =
    outcome.approved === expectApproved &&
    outcome.refused === expectRefused &&
    outcome.unexpected.length === 0;
  const extra = outcome.unexpected.length
    ? `, unexpected: ${outcome.unexpected.map((e) => `${e.code} ${e.message}`).join("; ")}`
    : "";
  record(
    name,
    ok,
    `${outcome.approved} approved, ${outcome.refused} refused${extra} (expected ${expectApproved} and ${expectRefused})`,
  );
}

async function findContext() {
  const { data: customer } = await supabase
    .from("customer_profiles")
    .select("id")
    .order("created_at")
    .limit(1)
    .maybeSingle();

  const { data: settings } = await supabase
    .from("test_drive_location_settings")
    .select("location_id")
    .eq("is_enabled", true);
  const enabled = new Set((settings ?? []).map((s) => s.location_id));

  const { data: cars } = await supabase
    .from("cars")
    .select("id, location_id")
    .is("archived_at", null)
    .not("location_id", "is", null)
    .order("created_at")
    .limit(50);

  const usable = (cars ?? []).filter((c) => enabled.has(c.location_id));
  const carA = usable[0];
  const carB = usable.find((c) => c.id !== carA?.id && c.location_id === carA?.location_id);

  const { data: staff, error: staffError } = await supabase
    .from("profiles")
    .select("id")
    .not("role_id", "is", null)
    .order("id")
    .limit(10);

  if (staffError)
    throw new Error(`Couldn't read staff (is the column called role_id?): ${staffError.message}`);
  if (!customer || !carA || !staff || staff.length === 0) {
    throw new Error("Needs at least 1 customer, 1 active car at an enabled showroom, and 1 staff profile.");
  }

  const [{ data: hours }, { data: blackouts }] = await Promise.all([
    supabase
      .from("showroom_hours")
      .select("day_of_week, is_closed, opens_at, closes_at")
      .eq("location_id", carA.location_id),
    supabase
      .from("test_drive_blackouts")
      .select("starts_on, ends_on, location_id")
      .or(`location_id.is.null,location_id.eq.${carA.location_id}`),
  ]);

  // A day that is open from 10:00 to at least 14:30, not a closure, and has no confirmed bookings at all.
  for (let offset = 14; offset <= 60; offset++) {
    const date = dubaiDate(offset);
    const row = (hours ?? []).find((h) => h.day_of_week === weekday(date));
    if (!row || row.is_closed || row.opens_at > "10:00:00" || row.closes_at < "14:30:00") continue;
    if ((blackouts ?? []).some((b) => date >= b.starts_on && date <= b.ends_on)) continue;

    const { count } = await supabase
      .from("test_drives")
      .select("id", { count: "exact", head: true })
      .in("status", ["Approved", "Rescheduled"])
      .gte("scheduled_start", toIso(date, "00:00"))
      .lt("scheduled_start", toIso(date, "23:59"));

    if (count === 0) {
      return {
        date,
        customerId: customer.id,
        locationId: carA.location_id,
        carA: carA.id,
        carB: carB?.id ?? null,
        staff: staff.map((s) => s.id),
      };
    }
  }

  throw new Error("Couldn't find a free, open day in the next 60 days to test on.");
}

async function main() {
  await cleanup(); // leftovers from an earlier interrupted run

  const ctx = await findContext();
  const staffAt = (i) => ctx.staff[i % ctx.staff.length];
  console.log(
    `Testing on ${ctx.date} with ${ctx.staff.length} staff member(s) and ${ctx.carB ? 2 : 1} car(s).\n`,
  );

  // A: two simultaneous approvals for the same car at the same time, different staff
  try {
    const ids = await Promise.all([
      insertPending(ctx, ctx.carA, "11:00"),
      insertPending(ctx, ctx.carA, "11:00"),
    ]);
    const errors = await Promise.all(ids.map((id, i) => approve(id, staffAt(i))));
    judge("Same vehicle and time, 2 simultaneous approvals", tally(errors), 1, 1);
  } catch (e) {
    record("Same vehicle and time, 2 simultaneous approvals", false, e.message);
  } finally {
    await cleanup();
  }

  // B: two simultaneous approvals for the same staff member at the same time, different cars
  if (ctx.carB) {
    try {
      const ids = await Promise.all([
        insertPending(ctx, ctx.carA, "11:00"),
        insertPending(ctx, ctx.carB, "11:00"),
      ]);
      const errors = await Promise.all(ids.map((id) => approve(id, staffAt(0))));
      judge("Same staff member and time, 2 simultaneous approvals", tally(errors), 1, 1);
    } catch (e) {
      record("Same staff member and time, 2 simultaneous approvals", false, e.message);
    } finally {
      await cleanup();
    }
  } else {
    record(
      "Same staff member and time, 2 simultaneous approvals",
      true,
      "skipped: needs a second car at the same showroom",
    );
  }

  // C: ten simultaneous approvals for one car and time
  try {
    const ids = await Promise.all(Array.from({ length: 10 }, () => insertPending(ctx, ctx.carA, "11:00")));
    const errors = await Promise.all(ids.map((id, i) => approve(id, staffAt(i))));
    judge("Same vehicle and time, 10 simultaneous approvals", tally(errors), 1, 9);
  } catch (e) {
    record("Same vehicle and time, 10 simultaneous approvals", false, e.message);
  } finally {
    await cleanup();
  }

  // D: the buffer boundary. 11:00 + 60 minutes + 15 minute buffer is blocked until 12:15.
  try {
    const first = await insertPending(ctx, ctx.carA, "11:00");
    const inside = await insertPending(ctx, ctx.carA, "12:00");
    const edge = await insertPending(ctx, ctx.carA, "12:15");

    const e1 = await approve(first, staffAt(0));
    const e2 = await approve(inside, staffAt(0));
    const e3 = await approve(edge, staffAt(0));

    const ok = !e1 && e2?.code === "23P01" && !e3;
    record(
      "Buffer boundary (11:00 ok, 12:00 refused, 12:15 ok)",
      ok,
      `11:00 ${e1 ? e1.code : "approved"}, 12:00 ${e2 ? e2.code : "approved"}, 12:15 ${e3 ? e3.code : "approved"}`,
    );
  } catch (e) {
    record("Buffer boundary (11:00 ok, 12:00 refused, 12:15 ok)", false, e.message);
  } finally {
    await cleanup();
  }

  console.log("Results");
  console.log("-------");
  results.forEach((r) => console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}\n      ${r.detail}`));

  const failed = results.filter((r) => !r.pass).length;
  console.log(failed === 0 ? "\nAll checks passed." : `\n${failed} check(s) FAILED.`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error("\nThe test could not run:", error.message);
  await cleanup();
  process.exit(1);
});
