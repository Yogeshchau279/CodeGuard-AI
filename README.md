# CodeGuard-AI

A full-stack AI-assisted code review workspace. The frontend is built with React and Vite; the backend uses Node.js, Express and MongoDB. Reviews use Google Gemini when configured and otherwise fall back to the built-in rule-based analyzer.

## Features

- Responsive React workspace with light/dark themes
- JWT authentication and bcrypt password hashing
- MongoDB review history scoped to the signed-in user
- Optional Gemini-powered code review with a local fallback
- 18 selectable languages and source-file language detection
- Source upload (up to 5 MB), line numbers, issue filters and line navigation
- Severity counts, estimated score, recommendations and review history
- Configurable frontend API URL

> The score is an application estimate, not an industry standard. The local analyzer checks predefined patterns; it does not compile or execute submitted code. AI findings are advisory and should be verified by a developer.

## Requirements

- Node.js 22.12 or newer (Node.js 24 is supported)
- npm
- MongoDB local instance or MongoDB Atlas account
- Gemini API key (optional)

## Project structure

```text
CodeGuard-AI/
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── Review.js
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── reviews.js
│   ├── services/
│   │   └── analyzer.js
│   ├── tests/
│   │   └── analyzer.test.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── .gitignore
├── package.json
├── package-lock.json
└── README.md
```

`client` contains the browser application. `server` contains the API, authentication, database models and code-analysis service. The root `package.json` provides commands for installing, running and checking both parts together. The three lockfiles are intentional: each npm package (root, client and server) has its own dependency tree.

## Windows setup (VS Code)

1. Extract the ZIP. Open the extracted `CodeGuard-AI` folder in VS Code. The folder you open must directly contain `client`, `server`, and the root `package.json`.
2. Open **Terminal → New Terminal** in VS Code. Confirm that the terminal is in the project root, then run:

   ```bash
   node -v
   npm -v
   npm install
   npm run install-all
   ```

3. Create `server/.env` by copying `server/.env.example`. On Windows, make sure the file is named `.env`, not `.env.txt`.
4. Edit `server/.env` and set a MongoDB connection string and a unique JWT secret. Gemini is optional.
5. Run the automated analyzer tests:

   ```bash
   npm test
   ```

6. Start the frontend and backend together:

   ```bash
   npm run dev
   ```

7. Open the frontend URL printed by Vite (normally `http://localhost:5173`). The API health endpoint is `http://localhost:5000/api/health`.

If port 5173 is already occupied, Vite may use 5174. Add that URL to `CORS_ORIGIN` in `server/.env` (comma-separated if both ports are needed), then restart the backend.

## Environment configuration

Create `server/.env` from `server/.env.example` and configure:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/codeguard_ai
JWT_SECRET=replace_with_a_long_random_secret
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
CORS_ORIGIN=http://localhost:5173
```

Replace the JWT placeholder with a long, random secret. You can generate one in PowerShell or the VS Code terminal with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the generated value into `JWT_SECRET`. Keep `server/.env` private and never commit it.

To use MongoDB Atlas:

1. Create a database user in **Database Access** and allow your current IP in **Network Access**.
2. In **Database → Connect → Drivers**, copy the Node.js connection string.
3. Replace `<db_password>` with the database user's password. URL-encode special characters in the password (for example `@`, `#`, `%`, `/` or `:`).
4. Include the database name `codeguard_ai` in the URI and paste it into `MONGODB_URI`.

To enable Gemini, create an API key in [Google AI Studio](https://aistudio.google.com/apikey) and add it to `GEMINI_API_KEY`. Keep this key only in `server/.env`; never put it in a `VITE_` variable or frontend source file. Restart the backend after changing environment variables.

Optionally create `client/.env` from `client/.env.example` to override `VITE_API_URL`. The local default is `http://localhost:5000/api`.

## Useful commands

Run these commands from the project root:

```bash
npm run dev       # Start frontend and backend
npm test          # Run local analyzer tests
npm run build     # Build the frontend for production
npm run check     # Run tests and build
npm run start     # Start the backend in production mode
```

## API routes

- `GET /api/health` — API, database and Gemini configuration status
- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — authenticate
- `POST /api/reviews` — analyze code (JWT required)
- `GET /api/reviews` — load the signed-in user's recent review history (JWT required)

## Gemini and local analyzer behavior

The backend tries Gemini first when `GEMINI_API_KEY` is configured. If the key is missing, the request fails, times out or returns an unusable response, the application falls back to the local analyzer. Each result includes a `source` value (`gemini` or `local`) so the UI can identify which analyzer produced it. A configured key alone does not prove the integration is working; submit a review and confirm that its source is `gemini`.

## Limitations and production considerations

- The local analyzer is a small set of pattern checks, not a compiler, full static-analysis engine or comprehensive security scanner. It can miss issues and produce false positives.
- Gemini output is advisory. Verify findings before applying changes. Do not submit passwords, API keys, private keys or confidential source code.
- The displayed score is an estimate, not an industry benchmark.
- Before public deployment, use HTTPS, restrict CORS to the deployed frontend, strengthen session handling (prefer secure HttpOnly cookies over browser localStorage), add per-user quotas, and define source-code retention and deletion policies.
