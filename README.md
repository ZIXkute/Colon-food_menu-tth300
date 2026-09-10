# Food Menu Manager (frontend only)

A Vite + React app for managing a restaurant menu — view, add, edit, and delete
dishes. No backend yet: data lives in memory (React state) and resets on
refresh.

## Setup (VS Code / PowerShell)

Open this folder in VS Code, then in the integrated terminal:

```powershell
cd food-menu-manager
npm install
```

Run it:

```powershell
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`) — open it in
your browser.

## Project structure

```
food-menu-manager/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx      # React entry point
    ├── App.jsx        # All CRUD logic + the 3 views (Dashboard, Full Menu, Add/Edit)
    └── index.css      # Base reset
```

## Next step: wiring a backend

`App.jsx` keeps everything in `dishes` (a `useState` array) and three handler
functions: `handleSubmit`, `handleDelete`, `toggleAvailable`. When you add an
Express backend, these map directly onto:

- `GET /dishes` → replaces the seed data on load
- `POST /dishes` → inside `handleSubmit` (create branch)
- `PUT /dishes/:id` → inside `handleSubmit` (edit branch)
- `DELETE /dishes/:id` → inside `handleDelete`
