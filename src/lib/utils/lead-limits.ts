export const MAX_BULK_LEADS = 100;
export const BULK_CONCURRENCY = 10;

// Kanban shows every open lead up to this cap, but only the latest few
// closed ones: Won and Lost columns grow forever.
export const KANBAN_OPEN_LEAD_CAP = 500;
export const KANBAN_CLOSED_LEAD_CAP = 25;
