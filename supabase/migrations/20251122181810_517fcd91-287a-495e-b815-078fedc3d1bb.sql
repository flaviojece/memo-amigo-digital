-- Atualizar a função handle_new_user para suportar escolha de role no cadastro
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer 
set search_path = public
as $$
declare
  user_type text;
begin
  -- Criar perfil
  insert into public.profiles (id, email, full_name)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  
  -- Pegar o tipo de usuário escolhido no cadastro (padrão: patient)
  user_type := coalesce(new.raw_user_meta_data->>'user_type', 'patient');
  
  -- Atribuir role 'user' sempre (role básica)
  insert into public.user_roles (user_id, role)
  values (new.id, 'user');
  
  -- Se escolheu ser anjo, adicionar role 'angel' também
  if user_type = 'angel' then
    insert into public.user_roles (user_id, role)
    values (new.id, 'angel');
  end if;
  
  return new;
end;
$$;