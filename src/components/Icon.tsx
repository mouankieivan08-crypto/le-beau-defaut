/** Jeu d'icônes maison — trait 1.6, sans dépendance externe. */

export type IconName =
  | "armchair"
  | "bag"
  | "box"
  | "search"
  | "heart"
  | "heart-filled"
  | "cart"
  | "user"
  | "users"
  | "menu"
  | "close"
  | "check"
  | "check-circle"
  | "chevron-right"
  | "chevron-down"
  | "chevron-left"
  | "star"
  | "star-filled"
  | "truck"
  | "package"
  | "shield"
  | "tag"
  | "plus"
  | "trash"
  | "edit"
  | "eye"
  | "alert"
  | "logout"
  | "grid"
  | "list"
  | "settings"
  | "wallet"
  | "chart"
  | "message"
  | "bell"
  | "filter"
  | "pin"
  | "phone"
  | "mail"
  | "camera"
  | "upload"
  | "clock"
  | "sparkle"
  | "home"
  | "lamp"
  | "medal"
  | "arrow-right"
  | "arrow-left"
  | "refresh"
  | "download"
  | "info"
  | "copy";

const P: Record<IconName, string> = {
  armchair:
    "M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M5 11a2 2 0 0 0-2 2v3h18v-3a2 2 0 0 0-2-2M5 11h14M5 16v3M19 16v3M7 11V9h10v2",
  bag: "M6 8h12l1 12H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2",
  box: "M3 8.5 12 4l9 4.5M3 8.5V16l9 4.5M3 8.5l9 4.5m0 0v7.5m0-7.5 9-4.5M21 8.5V16l-9 4.5",
  search: "M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm6-2 4 4",
  heart: "M12 20s-7-4.6-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.4 12 20 12 20Z",
  "heart-filled": "M12 20s-7-4.6-7-9.4A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 7 2.6C19 15.4 12 20 12 20Z",
  cart: "M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6M9 21h.01M18 21h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0",
  users: "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 8a6 6 0 0 1 12 0M16 5.2a3.5 3.5 0 0 1 0 6.6M18 20a6 6 0 0 0-2-4.5",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  check: "M4 12.5 9.5 18 20 6.5",
  "check-circle": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-3.5-9.2L11 14.5l4.8-5",
  "chevron-right": "M9 5l7 7-7 7",
  "chevron-left": "M15 5l-7 7 7 7",
  "chevron-down": "M5 9l7 7 7-7",
  star: "m12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.2-5.4-2.9-5.4 2.9 1-6.2L3.2 10l6.1-.9L12 3.5Z",
  "star-filled": "m12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.2-5.4-2.9-5.4 2.9 1-6.2L3.2 10l6.1-.9L12 3.5Z",
  truck: "M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6ZM7 19a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 7 19Zm10 0a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
  package: "M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Zm0 0 9 4.5m0 0 9-4.5m-9 4.5V20M7.5 6.2l9 4.6",
  shield: "M12 3.5 5 6.2v5.3c0 4.3 2.9 7.7 7 9 4.1-1.3 7-4.7 7-9V6.2L12 3.5Zm-3 8.3 2.3 2.3 4.2-4.4",
  tag: "M4 12.5V5a1 1 0 0 1 1-1h7.5L21 12.5 13.5 20 4 12.5Zm4-4.7h.01",
  plus: "M12 5v14M5 12h14",
  trash: "M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13M10 11v6M14 11v6",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 2.8a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6Z",
  alert: "M12 4 2.5 20h19L12 4Zm0 6v5m0 3h.01",
  logout: "M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 8l-4 4 4 4M6 12h10",
  grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  settings:
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8-3-1.8-.6a6.4 6.4 0 0 0-.7-1.7l.9-1.7-1.4-1.4-1.7.9a6.4 6.4 0 0 0-1.7-.7L12.6 4h-2l-.6 1.8c-.6.2-1.2.4-1.7.7l-1.7-.9-1.4 1.4.9 1.7c-.3.5-.5 1.1-.7 1.7L4 12v2l1.4.6c.2.6.4 1.2.7 1.7l-.9 1.7 1.4 1.4 1.7-.9c.5.3 1.1.5 1.7.7l.6 1.8h2l.6-1.8c.6-.2 1.2-.4 1.7-.7l1.7.9 1.4-1.4-.9-1.7c.3-.5.5-1.1.7-1.7L20 14v-2Z",
  wallet: "M3 7.5A2.5 2.5 0 0 1 5.5 5H18v3M3 7.5V18a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3M3 7.5h16a1 1 0 0 1 1 1v2.5m0 0h-4a2 2 0 1 0 0 4h4v-4Z",
  chart: "M4 20V10M10 20V4m6 16v-7m6 7V8M3 20h18",
  message: "M4 5h16v11H9l-5 4V5Z",
  bell: "M6 16V11a6 6 0 1 1 12 0v5l2 3H4l2-3Zm4 3a2 2 0 0 0 4 0",
  filter: "M3 5h18l-7 8v6l-4-2v-4L3 5Z",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  phone: "M7 3.5 9.5 8 7.8 10a12 12 0 0 0 5.4 5.4L15 13.7 19.5 16l-1 3a2 2 0 0 1-2.2 1.4C9.5 19.5 4.5 14.5 3.6 7.7A2 2 0 0 1 5 5.5l2-2Z",
  mail: "M3 6h18v12H3V6Zm0 0 9 7 9-7",
  camera: "M4 8h3l1.5-2h7L17 8h3v11H4V8Zm8 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  upload: "M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13.5V12l3.5 2",
  sparkle: "M12 3c.9 4.9 2.1 6.1 7 7-4.9.9-6.1 2.1-7 7-.9-4.9-2.1-6.1-7-7 4.9-.9 6.1-2.1 7-7Z",
  home: "M4 11 12 4l8 7v9H4v-9Zm6 9v-6h4v6",
  lamp: "M12 3v3m-6 6 6-6 6 6H6Zm0 0a6 6 0 0 0 12 0M12 12v8m-3 0h6",
  medal: "M12 14a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 0v7l-3-2-3 2m6-7 3 7 3-2 3 2",
  "arrow-right": "M4 12h16m-6-6 6 6-6 6",
  "arrow-left": "M20 12H4m6-6-6 6 6 6",
  refresh: "M20 11a8 8 0 1 0-1.5 5.5M20 5v6h-6",
  download: "M12 4v12m0 0 4.5-4.5M12 16l-4.5-4.5M4 18v2h16v-2",
  copy: "M9 9V5.5A1.5 1.5 0 0 1 10.5 4h8A1.5 1.5 0 0 1 20 5.5v8a1.5 1.5 0 0 1-1.5 1.5H15M5.5 9h8A1.5 1.5 0 0 1 15 10.5v8A1.5 1.5 0 0 1 13.5 20h-8A1.5 1.5 0 0 1 4 18.5v-8A1.5 1.5 0 0 1 5.5 9Z",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-9v5m0-8h.01",
};

const FILLED: IconName[] = ["heart-filled", "star-filled"];

export default function Icon({
  name,
  size = 18,
  className = "",
  strokeWidth = 1.6,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const filled = FILLED.includes(name);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={P[name]} />
    </svg>
  );
}
