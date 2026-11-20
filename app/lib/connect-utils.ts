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

/** Contador de notificações: mostra o número exato até 20 e "20+" acima disso. */
export const NOTIFICATION_COUNT_CAP = 20;
export const formatNotificationCount = (count: number) =>
  count > NOTIFICATION_COUNT_CAP ? NOTIFICATION_COUNT_CAP + "+" : String(Math.max(0, count));

/**
 * Normaliza o texto da busca de pessoas. O escape de curingas (% _ \\) e o uso em SQL são feitos
 * no banco (`list_community_profiles`, com format %L), então aqui só tiramos o "@", espaços e limitamos o tamanho.
 * Não removemos "_": ele é válido em usernames.
 */
export const sanitizeSearchTerm = (term: string) =>
  term.normalize("NFC").replace(/^\s*@/, "").replace(/\s+/g, " ").trim().slice(0, 60);
