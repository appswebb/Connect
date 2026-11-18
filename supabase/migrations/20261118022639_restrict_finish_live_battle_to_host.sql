create or replace function public.finish_live_battle(p_battle_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_user uuid := auth.uid();
  v_b public.live_battles%rowtype;
  v_host_score bigint;
  v_challenger_score bigint;
  v_winner uuid;
begin
  if v_user is null then
    raise exception 'Authentication required';
  end if;

  select * into v_b
  from public.live_battles
  where id = p_battle_id
  for update;

  if not found then
    raise exception 'Batalha não encontrada.';
  end if;

  if v_user <> v_b.host_user_id then
    raise exception 'Somente o anfitrião da live pode finalizar a batalha.';
  end if;

  if v_b.status <> 'active' then
    return jsonb_build_object('status', v_b.status, 'winner_user_id', v_b.winner_user_id);
  end if;

  if v_b.ends_at is null or now() < v_b.ends_at then
    raise exception 'A batalha ainda está acontecendo.';
  end if;

  select
    coalesce(max(score) filter (where user_id = v_b.host_user_id), 0),
    coalesce(max(score) filter (where user_id = v_b.challenger_user_id), 0)
  into v_host_score, v_challenger_score
  from public.live_battle_scores
  where battle_id = p_battle_id;

  if v_host_score = v_challenger_score then
    v_winner := null;
  elsif v_host_score > v_challenger_score then
    v_winner := v_b.host_user_id;
  else
    v_winner := v_b.challenger_user_id;
  end if;

  update public.live_battles
  set status = 'ended', winner_user_id = v_winner
  where id = p_battle_id;

  return jsonb_build_object(
    'status', 'ended',
    'winner_user_id', v_winner,
    'host_score', v_host_score,
    'challenger_score', v_challenger_score
  );
end;
$function$;
