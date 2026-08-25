revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.update_updated_at_column() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.admin_overview() from public, anon;
revoke all on function public.admin_beat_stats(uuid) from public, anon;
revoke all on function public.admin_events_daily(integer, uuid) from public, anon;
revoke all on function public.admin_users_overview() from public, anon;