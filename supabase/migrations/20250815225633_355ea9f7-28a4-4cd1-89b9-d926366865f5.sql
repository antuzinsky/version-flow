-- Enable required extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- Helper function to auto-update updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- CLIENTS
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  company text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;

-- RLS policies for clients
drop policy if exists "Clients are viewable by owner" on public.clients;
create policy "Clients are viewable by owner"
  on public.clients for select to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Clients can be inserted by owner" on public.clients;
create policy "Clients can be inserted by owner"
  on public.clients for insert to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Clients can be updated by owner" on public.clients;
create policy "Clients can be updated by owner"
  on public.clients for update to authenticated
  using (owner_id = auth.uid());

drop policy if exists "Clients can be deleted by owner" on public.clients;
create policy "Clients can be deleted by owner"
  on public.clients for delete to authenticated
  using (owner_id = auth.uid());

-- Trigger for clients
drop trigger if exists update_clients_updated_at on public.clients;
create trigger update_clients_updated_at
  before update on public.clients
  for each row execute function public.update_updated_at_column();

-- PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_client_id on public.projects(client_id);

alter table public.projects enable row level security;

-- RLS: access based on owning client
drop policy if exists "Projects accessible via owned client" on public.projects;
create policy "Projects accessible via owned client"
  on public.projects for select to authenticated
  using (exists (
    select 1 from public.clients c
    where c.id = projects.client_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Projects insert via owned client" on public.projects;
create policy "Projects insert via owned client"
  on public.projects for insert to authenticated
  with check (exists (
    select 1 from public.clients c
    where c.id = client_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Projects update via owned client" on public.projects;
create policy "Projects update via owned client"
  on public.projects for update to authenticated
  using (exists (
    select 1 from public.clients c
    where c.id = projects.client_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Projects delete via owned client" on public.projects;
create policy "Projects delete via owned client"
  on public.projects for delete to authenticated
  using (exists (
    select 1 from public.clients c
    where c.id = projects.client_id and c.owner_id = auth.uid()
  ));

-- Trigger for projects
drop trigger if exists update_projects_updated_at on public.projects;
create trigger update_projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at_column();

-- DOCUMENTS
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  file_path text,
  file_name text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_documents_project_id on public.documents(project_id);

alter table public.documents enable row level security;

-- RLS: access via owning client through project
drop policy if exists "Documents accessible via owned client" on public.documents;
create policy "Documents accessible via owned client"
  on public.documents for select to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    where p.id = documents.project_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Documents insert via owned client" on public.documents;
create policy "Documents insert via owned client"
  on public.documents for insert to authenticated
  with check (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    where p.id = project_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Documents update via owned client" on public.documents;
create policy "Documents update via owned client"
  on public.documents for update to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    where p.id = documents.project_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Documents delete via owned client" on public.documents;
create policy "Documents delete via owned client"
  on public.documents for delete to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    where p.id = documents.project_id and c.owner_id = auth.uid()
  ));

-- Trigger for documents
drop trigger if exists update_documents_updated_at on public.documents;
create trigger update_documents_updated_at
  before update on public.documents
  for each row execute function public.update_updated_at_column();

-- DOCUMENT VERSIONS
create table if not exists public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version_number integer,
  content text,
  file_path text,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  unique (document_id, version_number)
);

create index if not exists idx_document_versions_document_id on public.document_versions(document_id);

-- Auto-increment version number per document
create or replace function public.set_document_version_number()
returns trigger as $$
begin
  if new.version_number is null then
    select coalesce(max(version_number) + 1, 1)
      into new.version_number
    from public.document_versions
    where document_id = new.document_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_document_version_number on public.document_versions;
create trigger set_document_version_number
  before insert on public.document_versions
  for each row execute function public.set_document_version_number();

alter table public.document_versions enable row level security;

-- RLS policies for document_versions via owning client
drop policy if exists "Versions accessible via owned client" on public.document_versions;
create policy "Versions accessible via owned client"
  on public.document_versions for select to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    join public.documents d on d.project_id = p.id
    where d.id = document_versions.document_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Versions insert via owned client" on public.document_versions;
create policy "Versions insert via owned client"
  on public.document_versions for insert to authenticated
  with check (
    created_by = auth.uid() and exists (
      select 1 from public.clients c
      join public.projects p on p.client_id = c.id
      join public.documents d on d.project_id = p.id
      where d.id = document_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Versions update via owned client" on public.document_versions;
create policy "Versions update via owned client"
  on public.document_versions for update to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    join public.documents d on d.project_id = p.id
    where d.id = document_versions.document_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Versions delete via owned client" on public.document_versions;
create policy "Versions delete via owned client"
  on public.document_versions for delete to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    join public.documents d on d.project_id = p.id
    where d.id = document_versions.document_id and c.owner_id = auth.uid()
  ));

-- SHARES (for link-based sharing; access via Edge Function)
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  token text not null unique,
  can_edit boolean not null default false,
  expires_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shares_document_id on public.shares(document_id);

alter table public.shares enable row level security;

-- Validate share expiry with trigger (can't use CHECK with now())
create or replace function public.validate_share_expiry()
returns trigger as $$
begin
  if new.expires_at is not null and new.expires_at <= now() then
    raise exception 'expires_at must be in the future';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists validate_share_expiry on public.shares;
create trigger validate_share_expiry
  before insert or update on public.shares
  for each row execute function public.validate_share_expiry();

-- RLS for shares via owning client
drop policy if exists "Shares accessible via owned client" on public.shares;
create policy "Shares accessible via owned client"
  on public.shares for select to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    join public.documents d on d.project_id = p.id
    where d.id = shares.document_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Shares insert via owned client" on public.shares;
create policy "Shares insert via owned client"
  on public.shares for insert to authenticated
  with check (
    created_by = auth.uid() and exists (
      select 1 from public.clients c
      join public.projects p on p.client_id = c.id
      join public.documents d on d.project_id = p.id
      where d.id = document_id and c.owner_id = auth.uid()
    )
  );

drop policy if exists "Shares update via owned client" on public.shares;
create policy "Shares update via owned client"
  on public.shares for update to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    join public.documents d on d.project_id = p.id
    where d.id = shares.document_id and c.owner_id = auth.uid()
  ));

drop policy if exists "Shares delete via owned client" on public.shares;
create policy "Shares delete via owned client"
  on public.shares for delete to authenticated
  using (exists (
    select 1 from public.clients c
    join public.projects p on p.client_id = c.id
    join public.documents d on d.project_id = p.id
    where d.id = shares.document_id and c.owner_id = auth.uid()
  ));

-- STORAGE: Private bucket for documents
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Storage RLS policies for user-scoped folders (/{user_id}/...)
-- SELECT
drop policy if exists "Read own files in documents bucket" on storage.objects;
create policy "Read own files in documents bucket"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- INSERT
drop policy if exists "Upload own files to documents bucket" on storage.objects;
create policy "Upload own files to documents bucket"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- UPDATE
drop policy if exists "Update own files in documents bucket" on storage.objects;
create policy "Update own files in documents bucket"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- DELETE
drop policy if exists "Delete own files in documents bucket" on storage.objects;
create policy "Delete own files in documents bucket"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );