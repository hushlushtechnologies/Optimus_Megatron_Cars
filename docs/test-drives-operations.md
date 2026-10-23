# Test drives: operations

Everything here is run in the Supabase SQL editor. Use it carefully: it bypasses the app's own checks.

## Roles and permissions

Test drive permission keys: create, edit, reschedule, approve, assign, cancel, check_in, complete,
host, settings, export (all prefixed `test_drives.`). Super Admin always has all of them.

Give a role a permission (the role takes effect at the next page load):

```sql
insert into public.role_permission_grants (role_id, permission)
select r.id, 'test_drives.export'
from public.roles r
where r.name = 'Manager'
  and not exists (select 1 from public.role_permission_grants g
                  where g.role_id = r.id and g.permission = 'test_drives.export');
```

Take it away:

```sql
delete from public.role_permission_grants
where permission = 'test_drives.export'
  and role_id = (select id from public.roles where name = 'Manager');
```

`test_drives.host` decides who appears in the Host lists. A person with a blank name shows as
"Unnamed staff": set it with `update public.profiles set full_name = '...' where id = '...'`.

## Showrooms

Settings per showroom (turn test drives on or off, slot length, buffer, notice, reminders):

```sql
update public.test_drive_location_settings
set is_enabled = true, default_duration_minutes = 60, buffer_minutes = 15
where location_id = (select id from public.locations where name = 'Dubai');
```

Opening hours (day 0 is Sunday, 6 is Saturday; times are Dubai time):

```sql
update public.showroom_hours
set is_closed = false, opens_at = '09:00', closes_at = '19:00'
where location_id = (select id from public.locations where name = 'Dubai') and day_of_week = 1;
```

Close a showroom for a date range (a null location closes every showroom):

```sql
insert into public.test_drive_blackouts (location_id, starts_on, ends_on, reason)
values ((select id from public.locations where name = 'Dubai'), '2026-12-02', '2026-12-03', 'National Day');
```

Staff leave:

```sql
insert into public.test_drive_staff_unavailability (staff_id, starts_at, ends_at, reason)
values ('<profile id>', '2026-12-10 00:00+04', '2026-12-15 00:00+04', 'Annual leave');
```

## Archived test drives

Archive and restore are in the app (Archive toggle on the list). Both are logged on the test drive's timeline.

## Audit log (who bulk-changed or exported what)

```sql
select a.created_at at time zone 'Asia/Dubai' as dubai_time, p.full_name as who, a.kind, a.row_count, a.detail
from public.test_drive_audit_log a
left join public.profiles p on p.id = a.actor_id
order by a.created_at desc
limit 50;
```

Search text is never stored in the audit log, because it can contain phone numbers.

## Not connected

Email and WhatsApp are not connected. Nothing in the app says a message was sent. The places to connect
them are described in `docs/test-drive-notifications.md` and `docs/test-drive-check-in.md`.
