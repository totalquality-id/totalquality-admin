// src/routes.js
//
// Satu sumber kebenaran untuk menu sidebar dan definisi route, supaya URL,
// label, dan ikon tidak pernah lagi tidak sinkron.

import {
  Home,
  Image,
  Briefcase,
  Calendar,
  Newspaper,
  MessageSquare,
  ClipboardList,
  FileText,
  BarChart,
  HeadphonesIcon,
} from "lucide-react";

export const NAV_ITEMS = [
  { path: "/", label: "Dashboard", icon: Home, end: true },
  { path: "/hero", label: "Hero Image", icon: Image },
  { path: "/services", label: "Services", icon: Briefcase },
  { path: "/events", label: "Events", icon: Calendar },
  { path: "/articles", label: "Articles", icon: Newspaper },
  { path: "/careers", label: "Careers", icon: FileText },
  { path: "/applications", label: "Applications", icon: ClipboardList },
  { path: "/forum", label: "Forum", icon: MessageSquare },
  { path: "/consultations", label: "Consultations", icon: HeadphonesIcon },
  { path: "/assessments", label: "Assessments", icon: BarChart },
];

/** Judul halaman untuk header, dicocokkan dari path teraktif. */
export function titleForPath(pathname) {
  const match = NAV_ITEMS.filter(
    (item) => item.path !== "/" && pathname.startsWith(item.path)
  ).sort((a, b) => b.path.length - a.path.length)[0];

  return match?.label ?? "Dashboard";
}
