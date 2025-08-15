-- Fix security warnings by setting search_path for functions

-- Fix update_updated_at_column function
create or replace function public.update_updated_at_column()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Fix set_document_version_number function
create or replace function public.set_document_version_number()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.version_number is null then
    select coalesce(max(version_number) + 1, 1)
      into new.version_number
    from public.document_versions
    where document_id = new.document_id;
  end if;
  return new;
end;
$$;

-- Fix validate_share_expiry function
create or replace function public.validate_share_expiry()
returns trigger 
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.expires_at is not null and new.expires_at <= now() then
    raise exception 'expires_at must be in the future';
  end if;
  return new;
end;
$$;