# Simple Converter Frontend

A modern, fast, and user-friendly file conversion web application built with **Vue 3**, **Vite**, **TypeScript**, **Pinia**, **PrimeVue** and **Tailwind CSS**. Users upload video, image and audio files, pick a target format, and download the converted results. Sign-in uses **Google OAuth**, and conversion progress is tracked in real time.

This repository is the frontend only. It needs the companion backend, `simple-converter-backend`, which handles authentication, file storage and the conversion jobs.

---

## Features

- **Google Authentication:** Sign in with Google Identity Services. Every page except the sign-in page requires a signed-in user.
- **Batch Conversion:** Add several files (drag and drop anywhere on the page, or use the file picker), choose a target format per file or for all selected files at once, and convert them together. At most 3 files are uploaded and converted at the same time (`MAX_CONCURRENT_CONVERSIONS`); the rest wait as `queued`.
- **Wide Format Support:** The list of supported video, image and audio formats comes from the backend.
- **Upload and Conversion Progress:** Each file shows its upload percentage, then its conversion progress, updated in real time over a WebSocket.
- **Cancellation:** Cancel a single file or all running conversions. Cancelling is client-side only: it aborts an in-progress upload and stops tracking the job, but a job already created on the backend keeps running there.
- **Conversions Survive Navigation:** Conversions keep running, and their state stays visible, when you leave the converter page and come back.
- **1 GB Per-File Limit:** Files larger than 1 GB are rejected (with a notification) whether they are dropped or picked.
- **Conversion History:** Browse past completed conversions, re-download or delete them. History loads 20 entries at a time, with a "Load more" button.
- **Profile:** Shows your Google name, avatar and (masked) email, with a logout button.
- **Light / Dark / Auto Theme:** Follows the system theme by default; your choice is remembered.
- **Feedback Form:** Send feedback (optionally with your email) through [Web3Forms](https://web3forms.com/).

---

## Tech Stack

- **Framework:** Vue 3 (Composition API, `<script setup>`), Vue Router, TypeScript
- **State:** Pinia with `pinia-plugin-persistedstate`
- **UI:** PrimeVue 5 (Aura-based theme), PrimeIcons, Tailwind CSS 4 with `tailwindcss-primeui`
- **HTTP:** Axios
- **Tooling:** Vite, Vitest + Vue Test Utils (jsdom), `vue-tsc`, ESLint, Oxlint, Prettier

---

## How to Run the Frontend

### Prerequisites

- **Node.js:** version `^20.19.0` or `>=22.12.0` (as defined in `package.json`).
- **npm** (Node Package Manager).
- A running instance of the `simple-converter-backend`.

### 1. Install Dependencies

In the root of the project directory, run:

```bash
npm install
```

This also runs the `prepare` script, which points Git at the repository's hooks (see [Testing](#testing)).

### 2. Configure Environment Variables

Configuration is read from Vite environment variables (see `src/config.ts`). Copy the example file and fill in the values:

```bash
cp .env.example .env
```

| Variable                    | Purpose                                                                                     | If missing                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_API_URL`              | Base URL of the backend API, e.g. `http://localhost:3000/api/v1` (the value in `.env.example`). | There is no built-in default: API requests go to the frontend's own origin and will fail unless something proxies them.          |
| `VITE_GOOGLE_CLIENT_ID`     | Google OAuth client ID used by the "Sign in with Google" button.                            | Google sign-in will not work.                                                                                                    |
| `VITE_WEB3FORMS_ACCESS_KEY` | Web3Forms access key for the feedback form.                                                 | Submitting feedback fails with a "Web3Forms access key is not configured." error.                                                |
| `VITE_PRIMEUI_LICENSE`      | PrimeUI license key (free community or commercial).                                         | PrimeVue shows an "Invalid PrimeUI License" banner; the app otherwise works.                                                     |

`.env` is git-ignored. Vite reads these variables at build time, so restart the dev server or rebuild after changing them.

### 3. Start the Development Server

Start Vite's local development server with hot-reload:

```bash
npm run dev
```

The server will typically start at `http://localhost:5173/`. Open this address in your web browser.

### 4. Compile and Minify for Production

To build a production-ready bundle:

```bash
npm run build
```

This runs TypeScript type checking via `vue-tsc` in parallel with `vite build`, which outputs static assets to the `dist` directory. Preview the production build locally with:

```bash
npm run preview
```

### 5. Lint and Code Quality Check

To run Oxlint and then ESLint (both with `--fix`, so they modify files):

```bash
npm run lint
```

### Scripts

| Script               | Description                                            |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Start the Vite dev server.                             |
| `npm run build`      | Type-check and build for production.                   |
| `npm run preview`    | Serve the production build locally.                    |
| `npm test`           | Run the unit and component tests once (`vitest run`).  |
| `npm run test:unit`  | Run Vitest in watch mode.                              |
| `npm run type-check` | Type-check with `vue-tsc --build`.                     |
| `npm run lint`       | Run Oxlint and ESLint with auto-fix.                   |

---

## Testing

Unit and component tests use Vitest with Vue Test Utils in a jsdom environment. They live in `src/__tests__/*.spec.ts`.

```bash
npm test           # run once
npm run test:unit  # watch mode
```

A pre-commit hook in `.githooks/pre-commit` runs `npm test` before every commit and aborts the commit if the tests fail. It is enabled by the `prepare` script (`git config core.hooksPath .githooks`), which runs automatically on `npm install`. Skip it for a single commit with `git commit --no-verify`.

---

## Project Structure

```
src/
├── api/          # Axios client: base URL, auth header, logout on 401
├── assets/       # Global styles (Tailwind)
├── components/   # UI components: converter (file list, format selector), history, drop zone, header/footer, theme toggle, toasts
├── composables/  # useAuth (token/user state, login/logout), useFileSizeLimit
├── router/       # Routes and the auth guard
├── services/     # Backend calls (auth, converter) and the Web3Forms feedback call
├── stores/       # Pinia stores: files, conversion pipeline, formats, history, theme, toasts
├── types/        # Shared TypeScript types (API, auth, user, toast)
├── views/        # Route pages: home, converter, history, profile, feedback, sign-in
├── __tests__/    # Unit and component tests
├── config.ts     # Environment configuration
├── theme.ts      # PrimeVue theme preset and options
├── utils.ts      # Helpers, including MAX_FILE_SIZE
├── App.vue
└── main.ts
```

---

## How Conversion Works

For each file, `src/stores/useConversionStore.ts` (using `src/services/converter.service.ts`):

1. Waits for a free slot (at most `MAX_CONCURRENT_CONVERSIONS` run at once).
2. Requests a presigned upload URL from the backend (`POST /files/upload-request`) and uploads the file directly to it, reporting upload progress. A file that was already uploaded (e.g. after a failed or cancelled attempt) is not uploaded again.
3. Creates a conversion job (`POST /conversions/job`) with the uploaded file and target format.
4. Opens a WebSocket to `/conversions/job/:id/status` and updates the file's status and progress from its messages until the job completes, fails or is cancelled.
5. On completion, fetches the job to get the output file ID. Downloading asks the backend for a signed download URL (`GET /files/:id`) and opens it.

---

## FAQ

TODO

---

## Contacts

- **Author:** Oleksii Stoliarchuk
- **GitHub Repository:** [lexst64/simple-converter](https://github.com/lexst64/simple-converter)
- **Report Issues:** Please open an issue in the [GitHub Issues tracker](https://github.com/lexst64/simple-converter/issues) for bug reports or feature requests.
