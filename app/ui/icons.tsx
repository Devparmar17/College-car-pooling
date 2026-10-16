import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 20, children, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h14V9.5" />
  </Icon>
);

export const SearchIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
);

export const PlusIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const TicketIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2z" />
    <path d="M14 6v12" strokeDasharray="2 2" />
  </Icon>
);

export const UserIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
  </Icon>
);

export const SwapIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" />
  </Icon>
);

export const BackIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Icon>
);

export const StarIcon = (p: Props) => (
  <Icon {...p} fill="currentColor" stroke="none">
    <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1L3.2 9.4l6.1-.8z" />
  </Icon>
);

export const CheckIcon = (p: Props) => (
  <Icon {...p}>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </Icon>
);

export const CloseIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const ShieldIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.5 3.2 8.3 7.5 9.5 4.3-1.2 7.5-5 7.5-9.5V6z" />
    <path d="m8.5 12 2.5 2.5 4.5-5" />
  </Icon>
);

export const CarIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M5 11l1.6-4.2a2 2 0 0 1 1.9-1.3h7a2 2 0 0 1 1.9 1.3L19 11" />
    <rect x="3" y="11" width="18" height="6" rx="2" />
    <path d="M6 17v2M18 17v2" />
    <circle cx="7.5" cy="14" r="1" fill="currentColor" stroke="none" />
    <circle cx="16.5" cy="14" r="1" fill="currentColor" stroke="none" />
  </Icon>
);

export const ScooterIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="6" cy="17" r="3" />
    <circle cx="18" cy="17" r="3" />
    <path d="M9 17h6l2-7h-3M14 5h3l1 5" />
  </Icon>
);

export const SeatIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M7 4v9h10" />
    <path d="M7 13l-1 7M17 13v7M7 4h3" />
  </Icon>
);

export const LeafIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M5 19C5 10 10 5 20 4c0 10-5 15-14 15z" />
    <path d="M5 19 13 11" />
  </Icon>
);

export const RupeeIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M7 4h11M7 9h11M7 4h3a5 5 0 0 1 0 10H7l8 7" />
  </Icon>
);

export const ClockIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const GridIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </Icon>
);

export const RepeatIcon = (p: Props) => (
  <Icon {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    <path d="M9 14.5l2 2 4-4" />
  </Icon>
);

export const WomanIcon = (p: Props) => (
  <Icon {...p}>
    <circle cx="12" cy="9" r="5" />
    <path d="M12 14v7M9 18h6" />
  </Icon>
);

export const BuildingIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M3 10.5 12 5l9 5.5" />
    <path d="M5 10.5V19M9.5 10.5V19M14.5 10.5V19M19 10.5V19M3 19.5h18" />
  </Icon>
);

export const PhoneIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M6.6 3.5h2.7l1.4 4-2 1.3a12 12 0 0 0 6.5 6.5l1.3-2 4 1.4v2.7a2 2 0 0 1-2.2 2A17 17 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" />
  </Icon>
);

export const ChatIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5z" />
    <path d="M8.5 8.5h7M8.5 11.5h4.5" />
  </Icon>
);

export const SendIcon = (p: Props) => (
  <Icon {...p}>
    <path d="M4 12 20 4l-6 16-2.5-6.5z" />
    <path d="m11.5 13.5 3-3" />
  </Icon>
);
