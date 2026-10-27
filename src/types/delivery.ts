export type DeliveryRecipient = {
  key: string;
  recipientDetailId: number | null;
  name: string;
  address: string;
  phones: string[];
  billCount: number;
  serialCount: number;
  bills: { key: string; receiveCode: string; receiveBusinessId: number | null; receiveWalkinId: number | null; remarks: string[]; media: { proof: string[]; signatures: string[] }; serials: { id: string | number; serialNo: string; completed: boolean }[] }[];
};

export type Deliveries = { recipientCount: number; billCount: number; serialCount: number; recipients: DeliveryRecipient[] };
