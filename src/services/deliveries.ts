import AxiosInstance from "./http";
import type { Deliveries } from "../types/delivery";

export const getDeliveries = async () => {
  const { data } = await AxiosInstance.get<{ data: Deliveries }>("/driver/deliveries");
  return data.data;
};

export const getDeliveryRecipient = async (params: Record<string, number | undefined>) => {
  const { data } = await AxiosInstance.get<{ data: Deliveries }>("/driver/deliveries", { params });
  return data.data.recipients[0] || null;
};

export const getDeliverySummary = async () => {
  const { data } = await AxiosInstance.get<{ data: { truckCount: number } }>("/driver/deliveries/summary");
  return data.data;
};
