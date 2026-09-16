export const kpis = [
  {
    id: "revenue",
    label: "Revenue (This Month)",
    value: 4820000,
    prefix: "AED ",
    change: 12.4,
    trend: [18, 22, 19, 26, 24, 30, 28, 34, 31, 38, 36, 42],
  },
  {
    id: "available-cars",
    label: "Available Cars",
    value: 186,
    change: 4.1,
    trend: [12, 14, 13, 15, 16, 15, 17, 18, 17, 19, 18, 20],
  },
  {
    id: "customers",
    label: "Total Customers",
    value: 2143,
    change: 8.7,
    trend: [8, 10, 9, 12, 13, 12, 15, 16, 15, 18, 17, 20],
  },
  {
    id: "pending",
    label: "Pending Test Drives / Reservations",
    value: 27,
    change: -3.2,
    trend: [20, 22, 25, 23, 21, 24, 22, 20, 19, 18, 20, 19],
  },
];

export const actionAlerts = [
  { id: "1", message: "3 leads unassigned for over 24 hours" },
  { id: "2", message: "2 reservations awaiting payment confirmation" },
  { id: "3", message: "1 vehicle listing missing required documents" },
];

export const revenueTrend = [
  { month: "Jan", revenue: 2.9 },
  { month: "Feb", revenue: 3.1 },
  { month: "Mar", revenue: 3.4 },
  { month: "Apr", revenue: 3.2 },
  { month: "May", revenue: 3.8 },
  { month: "Jun", revenue: 4.0 },
  { month: "Jul", revenue: 3.9 },
  { month: "Aug", revenue: 4.3 },
  { month: "Sep", revenue: 4.1 },
  { month: "Oct", revenue: 4.5 },
  { month: "Nov", revenue: 4.6 },
  { month: "Dec", revenue: 4.82 },
];

export const inventoryStatus = [
  { name: "Available", value: 186, color: "#d4af37" },
  { name: "Reserved", value: 42, color: "#60a5fa" },
  { name: "Sold", value: 118, color: "#34d399" },
  { name: "In Service", value: 9, color: "#94a3b8" },
];

export const fastestSelling = [
  { id: "1", name: "Porsche 911 GT3", location: "Dubai", daysToSell: 3 },
  {
    id: "2",
    name: "Range Rover Autobiography",
    location: "Abu Dhabi",
    daysToSell: 5,
  },
  { id: "3", name: "Mercedes-AMG G63", location: "Dubai", daysToSell: 6 },
  {
    id: "4",
    name: "Bentley Continental GT",
    location: "Sharjah",
    daysToSell: 8,
  },
];

export const topSalesExecutive = {
  name: "Fatima Al Suwaidi",
  location: "Dubai Showroom",
  dealsClosed: 14,
  revenue: 1620000,
};

export const conversion = {
  leads: 340,
  testDrives: 128,
  reservations: 54,
  sold: 31,
};

export const recentActivity = [
  {
    id: "1",
    label: "New lead from website",
    detail: "Interested in Lamborghini Urus",
    time: "12 minutes ago",
  },
  {
    id: "2",
    label: "Reservation confirmed",
    detail: "Range Rover Autobiography — Ahmed R.",
    time: "55 minutes ago",
  },
  {
    id: "3",
    label: "Test drive completed",
    detail: "Porsche 911 GT3 — Sara M.",
    time: "3 hours ago",
  },
  {
    id: "4",
    label: "Payment received",
    detail: "AED 25,000 token — Bentley GT",
    time: "6 hours ago",
  },
  {
    id: "5",
    label: "New vehicle listed",
    detail: "McLaren 720S — Dubai",
    time: "1 day ago",
  },
];

export const upcomingTestDrives = [
  {
    id: "1",
    customer: "Khalid M.",
    car: "Ferrari Roma",
    time: "Today, 4:30 PM",
  },
  {
    id: "2",
    customer: "Layla H.",
    car: "Rolls-Royce Ghost",
    time: "Tomorrow, 11:00 AM",
  },
  {
    id: "3",
    customer: "Omar S.",
    car: "BMW M5 Competition",
    time: "Tomorrow, 2:00 PM",
  },
];

export const leadSummary = [
  { source: "Website", count: 148 },
  { source: "WhatsApp", count: 96 },
  { source: "Showroom Walk-in", count: 62 },
  { source: "Referral", count: 34 },
];
