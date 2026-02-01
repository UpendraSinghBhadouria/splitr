
# Splitr - AI Splitwise

Splitr is a modern expense-sharing app designed to make splitting money with friends effortless and stress-free. Whether it’s trips, dinners, rent, or group activities, Splitr keeps track of who paid, who owes, and how to settle up — all in one place.

With an intuitive interface and real-time balance tracking, users can log shared expenses, split bills fairly, and clear debts quickly without awkward conversations. Splitr removes the confusion from group spending so you can focus on enjoying the moment, not doing the math.

From casual outings to long vacations, Splitr ensures everyone pays their fair share — accurately, transparently, and hassle-free.

🌍 Live Website: https://splitr.upendradev.com

##  ✨ Features

- Group expense tracking for trips, roommates, and events
- Smart settlement algorithm to minimize total payments
- AI-powered shared spending insights using Gemini
- Flexible split options (equal, percentage, exact amounts)
- Real-time expense and repayment updates
- Automated payment reminders for pending balances
- Expense analytics with visual breakdowns
- Secure authentication powered by Better Auth

## 🛠️ Tech Stack

| Layer               | Technology                   |
| ------------------- | ---------------------------- |
| **Frontend**        | Next JS + TypeScript         |
| **UI Components**   | Shadcn UI + Tailwind CSS     |
| **Authentication**  | Better Auth                  |
| **Database**        | Neon (Serverless PostgreSQL) |
| **ORM**             | Prisma                       |
| **Charts**          | Recharts                     |
| **AI Integration**  | Google Gemini API            |
| **Emails**          | Resend + React Email         |
| **Background Jobs** | Inngest                      |



## 📦 Installation

1️⃣ Clone the repository

```bash
git Clone https://github.com/UpendraSinghBhadouria/splitr.git
cd splitr
```
2️⃣ Install dependencies

```bash
npm install
```
3️⃣ Setup environment variables

```bash
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

DATABASE_URL=

RESEND_API_KEY=
RESEND_FROM_EMAIL=
GEMINI_API_KEY=
```
4️⃣ Prisma setup
```bash
npx prisma generate
npx prisma migrate dev
```

🚀 Running the App
```bash
npm run dev
```
🧩 Available Scripts
```bash
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "postinstall": "prisma generate"
},
```
## 🔒 Authentication

Splitr uses Better Auth to provide secure and seamless user authentication.

It enables:

- Safe email and social login
- Secure session management
- Protected user accounts and group data access
- Reliable identity handling across shared expense groups

## 🔄 Background Processing

Inngest powers event-driven jobs such as:

- Payment Reminders
- AI Spending insights
- Automated workflows

## 🌟 Vision

Splitr is built to remove the stress and awkwardness from sharing money with others. Instead of arguing over who owes what, friends and groups get a clear, fair, and intelligent system that handles the math automatically — so they can focus on experiences, not expenses.

