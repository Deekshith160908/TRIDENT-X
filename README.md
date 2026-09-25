# TrustLens AI

Advanced threat intelligence and AI-driven URL analysis to protect against phishing, homograph attacks, and malicious payloads.

## Features
- **Deterministic Heuristic Engine**: Checks for SSL, raw IPs, punycode/homographs, subdomain stacking, suspicious TLDs, and URL shorteners.
- **AI Threat Analysis**: Powered by Gemini 2.5 Flash, providing dynamic threat vector identification and recommendations.
- **Score Synthesis**: Composite Trust Score (0-100) mixing deterministic signals and AI contextual insights.
- **History & Auditing**: Stores all scan metadata and signals in a PostgreSQL database using Drizzle ORM.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Lucide Icons, Axios.
- **Backend**: Node.js, Express, TypeScript, `@google/genai`, Drizzle ORM, Zod.
- **Database**: PostgreSQL.

## Getting Started

1. **Prerequisites**
   Ensure you have Node.js (v20+) and a PostgreSQL instance running.

2. **Environment Variables**
   Navigate to the `backend` directory and create a `.env` file from the example:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Fill in your `GEMINI_API_KEY` and `DATABASE_URL`.

3. **Install Dependencies**
   Run the following from the project root:
   ```bash
   npm run install:all
   ```

4. **Initialize Database**
   Push the Drizzle schema to your PostgreSQL database:
   ```bash
   npm run db:push
   ```

5. **Run the Application**
   Start both the backend API and frontend Vite dev server concurrently:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.
