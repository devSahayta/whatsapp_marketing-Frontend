import React from "react";

export default function SamvaadikAIMark({ size = 20, className = "", title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <circle cx="24" cy="24" r="24" fill="#0f766e" />
      <circle
        cx="24"
        cy="24"
        r="16"
        fill="none"
        stroke="#fff"
        strokeOpacity=".35"
        strokeWidth="1.6"
      />
      <path
        d="M24 13.5Q26.52 21.48 34.5 24Q26.52 26.52 24 34.5Q21.48 26.52 13.5 24Q21.48 21.48 24 13.5Z"
        fill="#fff"
      />
      <circle cx="35.89" cy="13.29" r="3.2" fill="#c4456b" />
      <circle cx="12.11" cy="34.71" r="2.4" fill="#c7c7f5" />
    </svg>
  );
}
