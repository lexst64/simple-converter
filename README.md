# Simple Converter Frontend

A modern, fast, and user-friendly file conversion web application built with **Vue 3**, **Vite**, **TypeScript**, and **Tailwind CSS**. The application allows users to upload, convert, and download files of various video, image, and audio formats. It utilizes **Google OAuth** for user authentication and tracks conversion progress in real-time.

---

## Features

- **Google Authentication:** Secure and quick sign-in using Google Identity Services.
- **Batch Processing:** Upload and convert multiple files concurrently.
- **Wide Format Support:** Convert between popular video, image, and audio formats.
- **Real-Time Progress:** Tracks conversion status and percentage in real-time via Server-Sent Events (SSE).
- **Conversion History:** Access and redownload files from past conversion jobs.
- **User Profiles:** Manage user account settings and active session details.

---

## How to Run the Frontend

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js:** version `^20.19.0` or `>=22.12.0` (as defined in `package.json`).
- **npm** (Node Package Manager).

### 1. Install Dependencies

In the root of the project directory, run:

```bash
npm install
```

### 2. Configure the Backend API URL

By default, the frontend is configured to communicate with a local backend server running at `http://localhost:3000/api/v1`. If your backend is running elsewhere, you can configure it in `src/main.ts`.

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

This will run TypeScript type checking via `vue-tsc` and compile the files into static assets in the `dist` directory.

### 5. Lint and Code Quality Check

To run code quality and styling checks using ESLint and Oxlint:

```bash
npm run lint
```

---

## FAQ

TODO

---

## Contacts

- **Author:** Oleksii Stoliarchuk
- **GitHub Repository:** [lexst64/simple-converter](https://github.com/lexst64/simple-converter)
- **Report Issues:** Please open an issue in the [GitHub Issues tracker](https://github.com/lexst64/simple-converter/issues) for bug reports or feature requests.
