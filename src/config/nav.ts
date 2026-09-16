import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Car,
  UserCircle,
  Target,
  CalendarClock,
  BookmarkCheck,
  MailQuestion,
  BarChart3,
  LineChart,
  Tag,
  CreditCard,
  MessageSquare,
  ScrollText,
  Newspaper,
  BookOpen,
  Star,
  Wrench,
  Image as ImageIcon,
  Bell,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: "Main",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Users", href: "/admin/users", icon: Users },
      { label: "Inventory", href: "/admin/inventory", icon: Car },
      { label: "Customers", href: "/admin/customers", icon: UserCircle },
      { label: "Leads", href: "/admin/leads", icon: Target },
      { label: "Test Drives", href: "/admin/test-drives", icon: CalendarClock },
      {
        label: "Reservations",
        href: "/admin/reservations",
        icon: BookmarkCheck,
      },
      {
        label: "Enquiry Requests",
        href: "/admin/enquiries",
        icon: MailQuestion,
      },
    ],
  },
  {
    title: "CRM",
    items: [
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
      { label: "Analytics", href: "/admin/analytics", icon: LineChart },
      { label: "Offers & Promotions", href: "/admin/offers", icon: Tag },
      { label: "Payments", href: "/admin/payments", icon: CreditCard },
      {
        label: "Communications",
        href: "/admin/communications",
        icon: MessageSquare,
      },
      { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Car News", href: "/admin/news", icon: Newspaper },
      { label: "Buyer Guides", href: "/admin/guides", icon: BookOpen },
      { label: "Expert Reviews", href: "/admin/reviews", icon: Star },
      {
        label: "Maintenance Tutorials",
        href: "/admin/tutorials",
        icon: Wrench,
      },
      { label: "Media Library", href: "/admin/media", icon: ImageIcon },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Notifications", href: "/admin/notifications", icon: Bell },
      { label: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];
