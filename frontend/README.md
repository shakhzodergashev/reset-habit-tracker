# RESET frontend

The React app for RESET, built with Vite. For full setup instructions, see the [main README](../README.md).

## Commands

Run these inside `frontend/`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the app on http://localhost:5173 |
| `npm run build` | Type-check and build to `dist/` |
| `npm run lint` | Oxlint |
| `npm run preview` | Serve the production build locally |

The backend must be running on http://localhost:3000. In development, Vite forwards requests starting with `/api` to it (see `vite.config.ts`).
