export const mileageIsOpen = (driverId?: number) =>
  Boolean(driverId && sessionStorage.getItem(`driver_mileage_mock_${driverId}`) === "open");

export const setMileageOpen = (driverId: number, open: boolean) => {
  const key = `driver_mileage_mock_${driverId}`;
  if (open) sessionStorage.setItem(key, "open");
  else sessionStorage.removeItem(key);
};
