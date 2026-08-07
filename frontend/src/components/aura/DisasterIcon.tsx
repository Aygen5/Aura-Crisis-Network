import type { DisasterType } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type Props = {
  type: DisasterType | string | number;
  className?: string;
  animated?: boolean;
};

export function DisasterIcon({ type, className, animated = true }: Props) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("h-full w-full", className),
  };

  let normalizedType = "";
  if (typeof type === "number") {
    switch (type) {
      case 0:
        normalizedType = "earthquake";
        break;
      case 1:
        normalizedType = "flood";
        break;
      case 2:
        normalizedType = "wildfire";
        break;
      case 3:
        normalizedType = "landslide";
        break;
      case 4:
        normalizedType = "medical";
        break;
      default:
        normalizedType = "report";
        break;
    }
  } else if (typeof type === "string") {
    normalizedType = type.toLowerCase();
  }

  switch (normalizedType) {
    case "earthquake":
      return (
        <svg {...common}>
          <path d="M2 12h3l2.4-6 3 12 3-9 2.2 5 1.6-3H22">
            {animated && (
              <animate
                attributeName="stroke-dasharray"
                values="0 60;60 0"
                dur="2.4s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </svg>
      );
    case "flood":
      return (
        <svg {...common}>
          <path d="M12 2.5s5.2 5.4 5.2 9.2A5.2 5.2 0 0 1 12 17a5.2 5.2 0 0 1-5.2-5.3C6.8 7.9 12 2.5 12 2.5Z" />
          <path d="M2 19.4c1.7 0 1.7 1.4 3.3 1.4s1.7-1.4 3.4-1.4 1.7 1.4 3.3 1.4 1.7-1.4 3.3-1.4 1.7 1.4 3.4 1.4 1.6-1.4 3.3-1.4">
            {animated && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0.6;0 -0.6;0 0.6"
                dur="2.8s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </svg>
      );
    case "wildfire":
      return (
        <svg {...common}>
          <path d="M12 21.5c3.6 0 6.2-2.4 6.2-5.7 0-4.4-4.3-6-3.5-11.3-2.6.9-5 3.6-5 6.4 0 1.3.5 2.2.5 2.9 0 1-.8 1.7-1.6 1.7-1 0-1.7-.9-1.8-2.1-1 1.3-1 2.7-1 3.6 0 2.7 2.4 4.5 6.2 4.5Z">
            {animated && (
              <animateTransform
                attributeName="transform"
                type="scale"
                additive="sum"
                values="1 1;1 1.07;1 1"
                dur="1.8s"
                repeatCount="indefinite"
              />
            )}
          </path>
        </svg>
      );
    case "landslide":
      return (
        <svg {...common}>
          <path d="M2 20h20" />
          <path d="M3 20 12 6l4.5 7" />
          <circle cx="16" cy="17" r="1.6">
            {animated && (
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 -1.5;0 0;0 -1.5"
                dur="2.2s"
                repeatCount="indefinite"
              />
            )}
          </circle>
          <circle cx="20" cy="19" r="1" />
        </svg>
      );
    case "medical":
      return (
        <svg {...common}>
          <path d="M2 12h5l2-4 3 8 2.5-4H22">
            {animated && (
              <animate
                attributeName="opacity"
                values="1;0.35;1"
                dur="1.6s"
                repeatCount="indefinite"
              />
            )}
          </path>
          <path d="M18 3v4M16 5h4" />
        </svg>
      );
    case "report":
    default:
      return (
        <svg {...common}>
          <path d="M12 3.5v3M12 20.5v-3M3.5 12h3M20.5 12h-3" />
          <circle cx="12" cy="12" r="3.4" />
          <circle cx="12" cy="12" r="7">
            {animated && (
              <animate
                attributeName="opacity"
                values="0.15;0.7;0.15"
                dur="2.6s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        </svg>
      );
  }
}
