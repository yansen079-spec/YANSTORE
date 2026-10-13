-- YanStore: auto-reply once for each new customer conversation.
-- Run in Supabase SQL Editor as project owner. No service key in website.
-- Uses an existing approved admin user ID as the sender.
create or replace function public.yanstore_chat_auto_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  customer uuid;
  admin_sender uuid;
begin
  select t.customer_id into customer
  from public.yanstore_chat_threads t
  where t.id = new.thread_id;

  -- Only customer messages can trigger the automatic response.
  if customer is null or new.sender_id is distinct from customer then
    return new;
  end if;

  -- Reply only to the first customer message of a conversation.
  if exists (
    select 1 from public.yanstore_chat_messages m
    where m.thread_id = new.thread_id and m.id <> new.id
  ) then
    return new;
  end if;

  select a.user_id into admin_sender
  from public.yanstore_chat_admins a
  order by a.user_id
  limit 1;

  if admin_sender is null then
    raise notice 'YanStore auto reply skipped: no registered chat admin';
    return new;
  end if;

  insert into public.yanstore_chat_messages (thread_id, sender_id, body)
  values (
    new.thread_id,
    admin_sender,
    'Halo kak! 👋 Selamat datang di YanStore. Pesan kakak sudah kami terima. Ini balasan otomatis; admin akan membalas secepatnya ya! 💚'
  );
  return new;
end;
$$;

revoke all on function public.yanstore_chat_auto_reply() from public, anon, authenticated;
drop trigger if exists yanstore_chat_auto_reply_trigger on public.yanstore_chat_messages;
create trigger yanstore_chat_auto_reply_trigger
after insert on public.yanstore_chat_messages
for each row execute function public.yanstore_chat_auto_reply();
