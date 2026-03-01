// ─── Constants ───────────────────────────────────────────────────────────────
export const SERVO_TYPES = [
  { label: "Dynamixel AX-12A", value: "ax12a", min: 0, max: 1023, defaultValue: 512 },
  { label: "Dynamixel MX-28", value: "mx28", min: 0, max: 4095, defaultValue: 2048 },
  { label: "Dynamixel XL-320", value: "xl320", min: 0, max: 1023, defaultValue: 512 },
  { label: "Custom Servo", value: "custom", min: null, max: null },
];

export const SERVO_TYPES_SIDEBAR = [
    { label: "Dynamixel AX-12A (0–1023)", value: "ax12a", min: 0, max: 1023, defaultValue: 512 },
    { label: "Dynamixel MX-28 (0–4095)",  value: "mx28",  min: 0, max: 4095, defaultValue: 2048 },
    { label: "Dynamixel XL-320 (0–1023)", value: "xl320", min: 0, max: 1023, defaultValue: 512 },
    { label: "Servo Custom",               value: "custom", min: null, max: null },
  ];
