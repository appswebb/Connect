import { Compass, UserSearch, MessageCircle, Users, Globe2, Radio } from "lucide-react";

export const connectNavigationItems = [
["feed", "Início", Compass],
    ["queue", "Conectar", UserSearch],
    ["chat", "Chat", MessageCircle],
    ["people", "Pessoas", Users],
    ["rooms", "Salas", Globe2],
    ["lives", "Ao vivo", Radio],
] as const;
