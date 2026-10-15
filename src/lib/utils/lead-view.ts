// A plain module (not a "use client" file) so the server page can read these
// values. Importing constants from a client module into a server component
// hands you a reference object instead of the actual value.
export type LeadView = "kanban" | "table";
export const LEAD_VIEW_COOKIE = "omc-leads-view";
