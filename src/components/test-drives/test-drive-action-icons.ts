import {
  Ban,
  BadgeCheck,
  CalendarClock,
  Check,
  LogIn,
  Pencil,
  UserCog,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import type { TestDriveActionKey } from "@/src/lib/utils/test-drive-actions";

export const TEST_DRIVE_ACTION_ICON: Record<TestDriveActionKey, LucideIcon> = {
  approve: Check,
  reject: X,
  assign_staff: UserCog,
  reassign_staff: UserCog,
  edit: Pencil,
  reschedule: CalendarClock,
  cancel: Ban,
  check_in: LogIn,
  complete: BadgeCheck,
  no_show: UserX,
};
