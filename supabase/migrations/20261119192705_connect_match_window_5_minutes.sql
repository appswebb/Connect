-- A janela para os dois conversarem e aceitarem o match passa de 3 para 5 minutos.
-- Altera só o literal da definição atual de enter_queue(text, text); grants e search_path são preservados.
do $$
declare
  d text;
  n text;
begin
  select pg_get_functiondef(p.oid) into d
  from pg_proc p
  where p.pronamespace = 'public'::regnamespace
    and p.proname = 'enter_queue'
    and pg_get_function_identity_arguments(p.oid) = 'p_state_code text, p_city text';
  if d is null then
    raise exception 'enter_queue(text, text) não encontrada';
  end if;
  n := replace(d, 'interval ''3 minutes''', 'interval ''5 minutes''');
  if n = d then
    raise exception 'literal de 3 minutos não encontrado na função';
  end if;
  execute n;
end
$$;
