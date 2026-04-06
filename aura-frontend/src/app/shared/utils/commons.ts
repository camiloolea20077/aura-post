export const normalize = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-');

export const stringToBase64 = (s: string): string => {
  return btoa(s);
};

export const base64ToString = (s: string): string => {
  return atob(s);
};
