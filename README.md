# Avkash

**Open-source leave management for modern teams.**

Avkash is an HR management platform that streamlines leave requests, approvals, and team visibility — with deep Slack integration so your team never has to leave their communication hub.

<!-- Add a screenshot or banner image here -->
<!-- ![Avkash Dashboard](screenshot.png) -->

## Features

- **Leave Management** — Simple requests, approvals, and tracking for time off
- **Slack Integration** — Handle leave requests, get notifications, and manage approvals directly in Slack
- **Team Management** — Organize your company structure with teams and roles
- **Policy Configuration** — Define custom leave policies and work calendars
- **Timeline View** — Visual dashboard showing who's on leave at a glance
- **Self-Hostable** — Run Avkash on your own infrastructure

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **UI:** React 19, Ant Design, Tailwind CSS
- **Backend & Database:** Supabase (PostgreSQL + Auth + RLS)
- **Integrations:** Slack API, Razorpay
- **Language:** TypeScript

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 20
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/get-started) (for running Supabase locally)
- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/zero8dotdev/avkash.git
   cd avkash
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

4. **Start local Supabase:**

   ```bash
   supabase start
   ```

   The CLI will output your local credentials — use them to fill in the Supabase variables in `.env.local`.

5. **Run database migrations:**

   ```bash
   supabase db reset
   ```

6. **Start the dev server:**

   ```bash
   pnpm dev
   ```

   Open https://localhost:3000 to see the app.

## Environment Variables

| Variable                                | Description                                                           |
| --------------------------------------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`              | Public URL for your Supabase project. Provided by `supabase start`.   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`         | Public anonymous key for Supabase. Provided by `supabase start`.      |
| `SUPABASE_DIRECT_URL`                   | Direct PostgreSQL connection string. Provided by `supabase start`.    |
| `SUPABASE_SERVICE_ROLE_KEY`             | Secret service role key (bypasses RLS). Provided by `supabase start`. |
| `NEXT_PUBLIC_SLACK_CLIENT_ID`           | Client ID for your Slack OAuth App.                                   |
| `SLACK_CLIENT_SECRET`                   | Client Secret for your Slack OAuth App.                               |
| `SLACK_REDIRECT_URI`                    | Redirect URI for Supabase Auth callback.                              |
| `RAZORPAY_KEY_ID`                       | Razorpay Key ID for payment processing.                               |
| `RAZORPAY_KEY_SECRET`                   | Razorpay Key Secret.                                                  |
| `RAZORPAY_WEBHOOK_SECRET`               | Secret for verifying Razorpay webhooks.                               |
| `NEXT_PUBLIC_REDIRECT_URL`              | Base URL of your application (e.g., `https://localhost:3000/`).       |
| `NEXT_PUBLIC_REDIRECT_PATH_AFTER_OAUTH` | Path to redirect to after OAuth login (e.g., `welcome`).              |

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a pull request.

## License

This project is licensed under the [Business Source License 1.1](LICENSE). You are free to self-host Avkash for internal use. After the change date (2030-02-07), the license converts to Apache License 2.0.
