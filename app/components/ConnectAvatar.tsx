import { initials } from "../lib/connect-utils";
import type { Profile } from "../types/connect";

type ConnectAvatarProps = { p: Profile; size?: string };

export default function ConnectAvatar({ p, size = "" }: ConnectAvatarProps) {
  return (
    <div className={"avatar " + size}>
      {p.avatar_url ? <img src={p.avatar_url} alt={p.display_name} /> : initials(p.display_name)}
    </div>
  );
}
