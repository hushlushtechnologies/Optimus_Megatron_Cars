# Test drive notifications

## What exists today

In-app notifications only. They are rows in `public.notifications`, shown in the bell. Nothing is sent by
email or WhatsApp, and nothing in the product claims otherwise.

| Event                 | Recipients                                                               | Type                                           | Source                                                 |
| --------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------ |
| New request           | Everyone holding `test_drives.approve` (except the creator and the host) | `test_drive_new_request`                       | Trigger `test_drives_14_notify`                        |
| Created with a host   | The host                                                                 | `test_drive_assigned`                          | Trigger                                                |
| Approved              | Requester, host                                                          | `test_drive_approved`                          | Trigger                                                |
| Rejected              | Requester, host                                                          | `test_drive_rejected`                          | Trigger                                                |
| Cancelled             | Requester, host                                                          | `test_drive_cancelled`                         | Trigger                                                |
| Completed             | Requester, host                                                          | `test_drive_completed`                         | Trigger                                                |
| Assigned / reassigned | New host, previous host                                                  | `test_drive_assigned`, `test_drive_reassigned` | App code (assign and reschedule actions)               |
| Rescheduled           | Host                                                                     | `test_drive_rescheduled`                       | App code (reschedule action)                           |
| Reminder              | Host                                                                     | `test_drive_reminder`                          | Job `test-drive-reminders` (pg_cron, every 15 minutes) |
| Overdue               | Host                                                                     | `test_drive_overdue`                           | Same job                                               |

The person who performs an action is never notified about it.

## Configuration (per showroom, `test_drive_location_settings`)

- `reminder_minutes_before`: how long before the start a reminder is created. 0 turns reminders off.
- `overdue_after_minutes`: how long after the end an open appointment counts as overdue.

Who is told about new requests follows the permission system (`role_permission_grants`), not role names.

## Rules that must be kept

- Notifications are written by the database (triggers and the job), never by the browser.
- A notification failure must never block the action that caused it.
- Reminders and overdue alerts use a dedupe key containing the test drive and its start time, so they cannot
  repeat, and a rescheduled appointment gets a new one.
- Deleting a test drive deletes its notifications.

## Adding an external channel later (email, WhatsApp)

Not built. When a provider is chosen, the intended shape is:

1. An outbox table (for example `outbound_messages`) with one row per message: channel, recipient address,
   template, the test drive it relates to, status, provider reference, timestamps and error.
2. Rows are written only when a channel is switched on and configured. An unconfigured channel writes nothing.
3. A server-side worker sends pending rows and records the provider's reference.
4. The status becomes `delivered` ONLY when the provider confirms it (usually a webhook). Until then it is
   `sent` or `pending`, and the screens must say so. A message that has not been confirmed is never shown
   as delivered.
5. Customer messages (confirmation, reminder) read their data from the `test_drive_list` view. Contact
   details and consent come from the customer record.
6. Failures are visible to staff, with a retry, rather than silently dropped.
