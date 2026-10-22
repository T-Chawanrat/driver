import AxiosInstance from "./http";
import type { Deliveries } from "../types/delivery";

export const getDeliveries = async () => {
  const { data } = await AxiosInstance.get<{ data: Deliveries }>("/driver/deliveries");
  return data.data;
};

export const getDeliverySummary = async () => {
  const { data } = await AxiosInstance.get<{ data: { truckCount: number } }>("/driver/deliveries/summary");
  return data.data;
};
