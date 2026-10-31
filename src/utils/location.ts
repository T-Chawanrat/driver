export type CurrentLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export const getCurrentLocation = () =>
  new Promise<CurrentLocation | null>((resolve) => {
    if (!window.isSecureContext || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const { latitude, longitude, accuracy } = coords;
        resolve(Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(accuracy)
          ? { latitude, longitude, accuracy }
          : null);
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
