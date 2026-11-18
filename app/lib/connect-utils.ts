export const initials = (s: string) =>
  s
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0] || "")
    .join("")
    .toUpperCase();
export const ago = (d: string) => {
  const n = Math.max(0, Date.now() - new Date(d).getTime());
  return n < 60000
    ? "agora"
    : n < 3600000
      ? Math.floor(n / 60000) + " min"
      : n < 86400000
        ? Math.floor(n / 3600000) + " h"
        : Math.floor(n / 86400000) + " d";
};
