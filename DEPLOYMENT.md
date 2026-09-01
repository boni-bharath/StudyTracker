# Production deployment

## Status

The repository is prepared for a Vercel deployment, including the SPA deep-link rewrite in `vercel.json`. No Vercel project, production URL, or production deployment was available to this workspace during Phase 14, so deployment and authenticated production smoke testing have **not** been completed or claimed.

The Phase 13 security audit also requires two release checks before a production launch: normalize the few raw provider-error messages and perform a live two-user RLS-isolation test. See `SECURITY_AUDIT.md`.

## Deployment configuration

| Setting          | Value                                              |
| ---------------- | -------------------------------------------------- |
| Framework preset | Vite                                               |
| Install command  | `npm install` (Vercel default)                     |
| Build command    | `npm run build`                                    |
| Output directory | `dist`                                             |
| SPA fallback     | `vercel.json` rewrites all routes to `/index.html` |

`vercel.json` is required because the application uses `BrowserRouter`. Without the rewrite, a direct request for a client route can return a Vercel 404 before React runs.

## Exact Vercel procedure

1. Push this repository, including `vercel.json`, to the Git provider connected to the intended Vercel account. Do not commit `.env` or any credentials.
2. In Vercel, choose **Add New → Project**, import the repository, and leave the root directory at the repository root.
3. Confirm Vercel detects **Vite**. Set the build command to `npm run build` and the output directory to `dist` if they are not populated automatically.
4. Under **Settings → Environment Variables**, add the following variables for the **Production** environment:

   | Name                            | Value source                          |
   | ------------------------------- | ------------------------------------- |
   | `VITE_SUPABASE_URL`             | Supabase project URL                  |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon browser key |

   Do not add a service-role key, database password, personal access token, or any server secret. `VITE_` variables are compiled into the browser bundle and must be safe for public exposure.

5. Deploy from Vercel. Record the resulting HTTPS production URL, for example `https://your-project.vercel.app`.
6. In Supabase Dashboard, open **Authentication → URL Configuration** and set **Site URL** to that exact production URL. Add the exact URL to **Redirect URLs**. Keep required development URLs only if they are still actively needed; do not use a broad redirect allow-list in production.
7. If a custom domain is added, repeat the URL Configuration step with the exact custom-domain HTTPS URL and make it the Site URL. Verify the domain is active in Vercel before changing Supabase.
8. Redeploy after changing Vercel environment variables. Vite reads them at build time, not at browser runtime.

For a CLI deployment instead, authenticate interactively with Vercel, run `vercel` for a preview, set the two variables through Vercel’s environment-variable UI or CLI without echoing values, then run `vercel --prod`. Do not place secrets in command history, source files, or Git.

## Authentication behavior

The application uses email/password authentication. `/login` redirects an authenticated user to `/`; all other application routes use `ProtectedRoute` and redirect a signed-out user to `/login`. The Supabase Site URL is therefore necessary for confirmation-email and any future Auth redirect flows to return to production. The app does not use a service-role key.

## Production smoke test

Perform these steps against the actual production URL after the Supabase URL configuration is saved. Record the URL, date, test account, and result; do not record passwords or tokens.

1. Open the production URL and confirm `/` loads.
2. Sign in with a confirmed non-production test account.
3. Open Dashboard.
4. Open Subjects and create or select a test subject.
5. Open Study, start a session, then stop it.
6. Confirm the completed session in History.
7. Confirm derived totals/charts in Statistics and streak output.
8. Open Tasks (`/todos`) and verify todo behavior.
9. Open Settings and verify settings save.
10. Sign out and confirm a protected route redirects to `/login`.
11. In a fresh signed-out browser context, direct-navigate to `/`, `/study`, `/subjects`, `/statistics`, `/history`, `/todo`, `/todos`, and `/settings`. Each must load the SPA rather than a Vercel 404, then redirect to `/login`. `/todo` is a compatibility redirect to the canonical `/todos` route.
12. Sign in again and repeat direct navigation to verify each route renders its intended page.

Do not mark deployment successful until every required production test passes and the two Phase 13 release conditions are closed.

## References

- [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vercel rewrites](https://vercel.com/docs/routing/rewrites)
- [Supabase Auth URL configuration](https://supabase.com/docs/guides/auth/general-configuration)
