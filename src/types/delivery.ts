export type DeliveryRecipient = {
  key: string;
  name: string;
  address: string;
  phones: string[];
  billCount: number;
  serialCount: number;
  bills: { key: string; receiveCode: string; remarks: string[]; media: { proof: string[]; signatures: string[] }; serials: { id: string | number; serialNo: string; completed: boolean }[] }[];
};

export type Deliveries = { recipientCount: number; billCount: number; serialCount: number; recipients: DeliveryRecipient[] };
