/* Dados 100% fictícios usados apenas na demonstração pública "Ver por dentro".
   Nada aqui vem do Supabase e nada é gravado. */

export type DemoPerson = { id: string; name: string; user: string; city: string; uf: string; bio: string; hue: number };
export type DemoPost = { id: string; personId: string; body: string; when: string; likes: number; comments: string[]; art?: boolean };
export type DemoMessage = { id: string; mine: boolean; body: string; reply?: string };
export type DemoNotification = { id: string; kind: "message" | "follower" | "live" | "match" | "post"; title: string; body: string; when: string; unread: boolean };
export type DemoLive = { id: string; title: string; hostId: string; viewers: number; tag: string };

export const demoPeople: DemoPerson[] = [
  { id: "p1", name: "Marina Alves", user: "marina.alves", city: "Belo Horizonte", uf: "MG", bio: "Café, trilhas e boas conversas.", hue: 285 },
  { id: "p2", name: "Rafael Nogueira", user: "rafa.nog", city: "Recife", uf: "PE", bio: "Fotografia de rua e música ao vivo.", hue: 200 },
  { id: "p3", name: "Júlia Campos", user: "juliacampos", city: "Curitiba", uf: "PR", bio: "Livros, séries e um gato chamado Pixel.", hue: 340 },
  { id: "p4", name: "Caio Ferraz", user: "caioferraz", city: "Porto Alegre", uf: "RS", bio: "Violão, churrasco e futebol de domingo.", hue: 25 },
  { id: "p5", name: "Beatriz Lima", user: "bealima", city: "Salvador", uf: "BA", bio: "Dança, praia e novas amizades.", hue: 160 },
  { id: "p6", name: "Tiago Moreira", user: "tiagom", city: "São Paulo", uf: "SP", bio: "Dev de dia, DJ de fim de semana.", hue: 250 },
];

export const demoPosts: DemoPost[] = [
  { id: "d1", personId: "p1", body: "Primeira trilha do ano na Serra do Cipó. Quem anima a próxima? ⛰️", when: "12 min", likes: 24, comments: ["Eu topo! Me chama.", "Que vista incrível!"], art: true },
  { id: "d2", personId: "p3", body: "Alguém tem dica de livro para quem gostou de ficção científica leve?", when: "1 h", likes: 11, comments: ["Tenta 'O Guia do Mochileiro'!"] },
  { id: "d3", personId: "p2", body: "Show de ontem foi absurdo. Música ao vivo muda o dia da gente.", when: "3 h", likes: 38, comments: [] },
];

export const demoChats: { id: string; personId: string; last: string; messages: DemoMessage[] }[] = [
  { id: "c1", personId: "p1", last: "Combinado, sábado então!", messages: [
    { id: "m1", mine: false, body: "Oi! Vi que você também curte trilha 😊" },
    { id: "m2", mine: true, body: "Curto muito! Qual foi a melhor que você fez?" },
    { id: "m3", mine: false, body: "Serra do Cipó, sem dúvida. Vamos marcar uma?", reply: "Qual foi a melhor que você fez?" },
    { id: "m4", mine: true, body: "Combinado, sábado então!" },
  ] },
  { id: "c2", personId: "p4", last: "Manda o link da live!", messages: [
    { id: "m5", mine: false, body: "Vai ter transmissão hoje à noite?" },
    { id: "m6", mine: false, body: "Manda o link da live!" },
  ] },
  { id: "c3", personId: "p5", last: "Adorei o seu perfil 💜", messages: [
    { id: "m7", mine: false, body: "Adorei o seu perfil 💜" },
  ] },
];

export const demoNotifications: DemoNotification[] = [
  { id: "n1", kind: "message", title: "Nova mensagem", body: "Marina Alves enviou uma mensagem.", when: "agora", unread: true },
  { id: "n2", kind: "follower", title: "Novo seguidor", body: "Rafael Nogueira começou a seguir você.", when: "8 min", unread: true },
  { id: "n3", kind: "live", title: "Live começando", body: "Tiago Moreira entrou ao vivo.", when: "25 min", unread: false },
  { id: "n4", kind: "match", title: "Conexão aceita", body: "Júlia Campos aceitou conversar com você.", when: "2 h", unread: false },
  { id: "n5", kind: "post", title: "Nova publicação", body: "Beatriz Lima publicou no feed.", when: "4 h", unread: false },
];

export const demoLives: DemoLive[] = [
  { id: "l1", title: "Noite de violão e conversa", hostId: "p4", viewers: 42, tag: "Música" },
  { id: "l2", title: "Set de sábado — house e bossa", hostId: "p6", viewers: 118, tag: "DJ" },
  { id: "l3", title: "Bate-papo: livros do mês", hostId: "p3", viewers: 19, tag: "Livros" },
];

export const demoRoomMessages: Record<string, { who: string; hue: number; body: string }[]> = {
  BR: [
    { who: "Marina", hue: 285, body: "Bom dia, Brasil! Como está o clima por aí?" },
    { who: "Caio", hue: 25, body: "Sol forte no Sul hoje ☀️" },
    { who: "Beatriz", hue: 160, body: "Chuva em Salvador, mas o astral tá ótimo!" },
  ],
  default: [
    { who: "Júlia", hue: 340, body: "Alguém daqui para um café no fim de semana?" },
    { who: "Rafael", hue: 200, body: "Eu! Conheço um lugar ótimo." },
  ],
};

export const ufList = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export const initialsOf = (name: string) => name.split(" ").slice(0, 2).map(x => x[0] || "").join("").toUpperCase();
