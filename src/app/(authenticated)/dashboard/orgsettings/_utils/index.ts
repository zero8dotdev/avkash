const predefinedColors = [
  "#f7ab9b",
  "#b5f5c1",
  "#b1bdf1",
  "#faedbc",
  "#deb6ed",
  "#b5ece1",
  "#dcaba5",
  "#bfd5eb",
  "#e2cfaf",
  "#9be3b9",
  "#f5b680",
  "#BDC3C7",
  "#5df3fd",
  "#8fd2ff",
  "#e7afff",
];

export default predefinedColors;

export interface LeaveTypes {
  // define the leave type here as modeled in the backend
  name: string;
  isActive: boolean;
  color: string;
  leaveTypeId: string;
}

export type Emoji = {
  id: string;
  shortCode: string;
  native: string;
  size: string;
  fallback: string;
  set: string;
  skin: string;
};
