export type DriverScreen = "HOME" | "JOBS" | "DELIVERY_CREATE" | "DELIVERY_SCAN" | "CLOSE" | "ISSUES" | "MENU" | "PROFILE" | "JOB_HISTORY" | "CONTACT" | "DELIVERIES" | "RECIPIENT_CLOSE" | "MILEAGE_OPEN" | "MILEAGE_CLOSE";
export type Navigate = (screen: DriverScreen, id?: number) => void;
export type Option = { id: number; name: string; code?: string | null };
