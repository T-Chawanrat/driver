export type MockDeliveryBill = { receiveCode: string; serials: string[] };
export type MockDeliveryRecipient = { id: number; name: string; address: string; bills: MockDeliveryBill[] };

export const mockDeliveryRecipients: MockDeliveryRecipient[] = [
  { id: 1, name: "บริษัท ไทยเทค จำกัด", address: "99/12 ถนนบางนา-ตราด แขวงบางนา เขตบางนา กรุงเทพมหานคร 10260", bills: [
    { receiveCode: "DOA000021202609300001", serials: ["SN-24090011", "SN-24090012", "SN-24090013"] },
    { receiveCode: "DOA000021202609300002", serials: ["SN-24090014", "SN-24090015"] },
  ] },
  { id: 2, name: "ร้านเจริญการค้า", address: "55/8 ถนนศรีนครินทร์ ตำบลบางเมือง อำเภอเมืองสมุทรปราการ สมุทรปราการ 10270", bills: [
    { receiveCode: "DOA000021202609300003", serials: ["SN-24090016", "SN-24090017", "SN-24090018", "SN-24090019"] },
  ] },
  { id: 3, name: "บริษัท เอสที โลจิสติกส์ จำกัด", address: "88/9 ถนนลาดกระบัง แขวงลาดกระบัง เขตลาดกระบัง กรุงเทพมหานคร 10520", bills: [
    { receiveCode: "DOA000021202609300004", serials: ["SN-24090020"] },
    { receiveCode: "DOA000021202609300005", serials: ["SN-24090021", "SN-24090022"] },
  ] },
];
