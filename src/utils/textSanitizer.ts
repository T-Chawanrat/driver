export const removeSpaces = (value: string) => value.replace(/\s/g, "");

export const preventSpaceKey = (event: Pick<KeyboardEvent, "key" | "code" | "preventDefault">) => {
  if (event.key !== " " && event.code !== "Space") return false;
  event.preventDefault();
  return true;
};
