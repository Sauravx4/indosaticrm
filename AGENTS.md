<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Order balances/statuses come from the `order_summary` view plus `src/lib/crm.ts` helpers; never store calculated balances (keeps them always correct).
- Permissions are enforced by RLS via `can_orders` / `can_payments` / `has_role`; UI checks only hide buttons.
- Payments are never edited or deleted; corrections use reversal (DB trigger enforces) for a clean financial trail.
- Signed-in pages live under `src/routes/_authenticated/`; the layout there holds the sidebar.
