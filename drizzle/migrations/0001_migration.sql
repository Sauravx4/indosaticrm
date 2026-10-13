create policy "members read docs" on storage.objects for select to authenticated using (bucket_id='documents' and public.is_member(auth.uid()));
create policy "writers upload docs" on storage.objects for insert to authenticated with check (bucket_id='documents' and (public.can_orders(auth.uid()) or public.can_payments(auth.uid())));
create policy "admin delete docs" on storage.objects for delete to authenticated using (bucket_id='documents' and public.has_role(auth.uid(),'admin'));
drop policy "order mgrs write" on public.attachments;
create policy "writers add attachments" on public.attachments for insert to authenticated with check (public.can_orders(auth.uid()) or public.can_payments(auth.uid()));