# Test drive check-in

## What exists today

Staff check customers in. There is no QR check-in, and nothing simulates one.

- The check-in dialog (reached from the detail page, the table, the calendar and the check-in desk)
  verifies the appointment and asks the staff member to confirm the customer's identity.
  This is a staff confirmation, not an automated identity check.
- `checkInTestDriveAction` checks permission (`test_drives.check_in`), status, whether the customer has
  already checked in, that the record hasn't changed since the dialog opened, and the check-in window.
  Then it calls `performTestDriveCheckIn`.
- The database stamps `checked_in_at` and `checked_in_by` itself (the app cannot supply either), applies the
  permission and window rules again (`enforce_test_drive_check_in_rules`) and refuses a second check-in.
- The check-in window opens `check_in_opens_minutes_before` minutes before the start (a showroom setting,
  default 60) and closes when the appointment ends.

## Rules that must be kept

- Every check-in goes through `performTestDriveCheckIn`. Do not write `checked_in_at` from anywhere else.
- The arrival time and the person are stamped by the database. Never trust a time or user sent by a client.
- A new test drive cannot be inserted already checked in.
- A check-in cannot be changed once recorded. There is intentionally no undo; a correction needs an
  administrator, ideally through a future permissioned, audited undo.

## Adding QR check-in later (not built)

1. A table of check-in tokens (for example `test_drive_check_in_tokens`): test drive, a hash of the token,
   expiry, used-at. Store only a hash, never the token itself.
2. Issue a token when an appointment is confirmed. It travels in the confirmation message or a QR code
   (the customer's email or WhatsApp is not connected today, so nothing is sent).
3. A server route validates the token: it exists, has not expired, has not been used, belongs to a confirmed
   appointment that is inside the check-in window.
4. The route then calls `performTestDriveCheckIn` with `source: "qr"` (add that value to `CheckInSource`).
   The permission to check in a customer then belongs to the validated token or the scanning staff member,
   to be decided when this is built.
5. Mark the token used in the same step, and record that the check-in came from a QR code.

Until then the desk and the dialog are the only ways in.
