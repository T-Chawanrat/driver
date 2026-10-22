export type DriverScreen = "HOME" | "WORK_MENU" | "JOBS" | "DELIVERY_CREATE" | "DELIVERY_SCAN" | "CLOSE" | "ISSUES" | "MOCKUP_CHAT" | "MENU" | "PROFILE" | "JOB_HISTORY" | "CONTACT" | "DELIVERIES" | "MOCKUP_RECIPIENT_CLOSE" | "MILEAGE_OPEN" | "MILEAGE_CLOSE";
export type Navigate = (screen: DriverScreen, id?: number) => void;
export type Option = { id: number; name: string; code?: string | null };
