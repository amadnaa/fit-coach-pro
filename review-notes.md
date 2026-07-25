# App Review Notes — La Fuerza

Paste into App Store Connect → App Review Information → Notes, and Play Console → App access declaration.

---

## Notes for the reviewer

> La Fuerza is a private coaching app for the clients of a single personal trainer. It is intentionally login-gated: the coach creates each client's account personally as part of her paid coaching service, so there is **no public self-signup**. This is the intended design, not an incomplete feature — the app serves an existing closed coach–client relationship (similar to a gym's member app).
>
> **Demo accounts for review** (full access, pre-populated with realistic data):
>
> - Coach account: `[demo-coach email]` / `[password]`
> - Client account: `[demo-client email]` / `[password]`
>
> The client account shows the typical client experience (assigned workout plan, logging, nutrition, progress, check-ins). The coach account shows how accounts and plans are managed.
>
> **Sign in with Apple:** not offered because the app has no third-party or social login of any kind (Guideline 4.8 does not apply). Authentication is email + password only, with accounts provisioned by the coach.
>
> **Account deletion:** available in-app at Profile → Privacy & Security → Delete Account (Guideline 5.1.1(v)).
>
> **User-generated content:** clients can only upload content (photos, logs) visible to themselves and their own coach. There is no public feed, no client-to-client interaction, and no content discovery, so no reporting/blocking mechanism is applicable.

---

## Play Console — "App access" section

Select **"All or some functionality is restricted"** and add the same two demo credentials with this instruction:

> Log in with the provided credentials. Accounts are created by the coach for her paying clients; there is no self-signup by design.

## Before submitting
- [ ] Create the two demo accounts in production Supabase and fill in the credentials above.
- [ ] Populate the demo client with a workout plan, some logged workouts, food logs, and a check-in so the reviewer sees a working app, not empty screens.
- [ ] Verify both demo logins on a real device the morning of submission.
