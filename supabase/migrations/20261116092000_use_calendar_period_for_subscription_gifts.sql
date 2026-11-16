alter table public.subscription_gifts add column if not exists billing_interval text;
update public.subscription_gifts set billing_interval = case when duration_days = 365 then 'year' else 'month' end where billing_interval is null;
alter table public.subscription_gifts alter column billing_interval set not null;
alter table public.subscription_gifts drop constraint if exists subscription_gifts_billing_interval_check;
alter table public.subscription_gifts add constraint subscription_gifts_billing_interval_check check (billing_interval in ('month','year'));

create or replace function public.apply_subscription_gift_payment(p_gift_id uuid, p_payment_id text, p_amount numeric, p_currency text, p_raw_event jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_gift public.subscription_gifts%rowtype; v_base timestamptz; v_start timestamptz; v_end timestamptz;
begin
  if coalesce(p_currency, '') <> 'BRL' then raise exception 'Moeda do pagamento inválida.'; end if;
  select * into v_gift from public.subscription_gifts where id = p_gift_id for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'gift_not_found'); end if;
  if abs(coalesce(p_amount, 0) - v_gift.amount_brl) > 0.009 then raise exception 'Valor do pagamento não corresponde ao presente.'; end if;
  if v_gift.status = 'paid' then return jsonb_build_object('ok', true, 'already_applied', true, 'ends_at', v_gift.ends_at); end if;
  if v_gift.status <> 'pending' then return jsonb_build_object('ok', false, 'reason', 'gift_not_pending'); end if;
  select greatest(coalesce(q.unlimited_until, now()), now()) into v_base from (select 1) seed left join public.queue_entitlements q on q.user_id = v_gift.recipient_id;
  v_start := v_base;
  v_end := v_start + case when v_gift.billing_interval = 'year' then interval '1 year' else interval '1 month' end;
  update public.subscription_gifts set status='paid', provider_payment_id=p_payment_id, paid_at=now(), starts_at=v_start, ends_at=v_end, updated_at=now() where id=v_gift.id;
  insert into public.queue_entitlements(user_id, unlimited_until, updated_at) values(v_gift.recipient_id, v_end, now())
    on conflict (user_id) do update set unlimited_until=greatest(coalesce(public.queue_entitlements.unlimited_until, now()), v_end), updated_at=now();
  insert into public.notifications(recipient_id, actor_id, type, title, body, entity_type, entity_id)
    values(v_gift.recipient_id, v_gift.sender_id, 'subscription_gift_received', 'Você ganhou uma assinatura CONNECT!',
      case when v_gift.billing_interval = 'month' then 'Você recebeu 1 mês de CONNECT.' else 'Você recebeu 1 ano de CONNECT.' end, 'subscription_gift', v_gift.id);
  return jsonb_build_object('ok', true, 'ends_at', v_end);
end; $$;
revoke all on function public.apply_subscription_gift_payment(uuid, text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.apply_subscription_gift_payment(uuid, text, numeric, text, jsonb) to service_role;