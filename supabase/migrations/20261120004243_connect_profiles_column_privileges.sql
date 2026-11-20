-- Antes: authenticated podia atualizar QUALQUER coluna da própria linha (a RLS só confere o id),
-- inclusive is_demo (some da comunidade) e created_at (forja o selo "NOVO"). Agora só as 11 colunas que o app edita.
revoke all on table public.profiles from anon;
revoke truncate, references, trigger, delete on table public.profiles from authenticated;
revoke update on table public.profiles from authenticated;
grant update (display_name, username, gender, gender_description, looking_for, avatar_url, banner_url, bio, state_code, city, location_visible)
  on table public.profiles to authenticated;
