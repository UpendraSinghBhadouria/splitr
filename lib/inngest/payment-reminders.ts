import { getUsersWithOutstandingDebts, sendEmail } from "@/actions";
import { inngest } from "./client";

export const paymentReminders = inngest.createFunction(
  { id: "send-payment-reminders" },
  { cron: "0 10 * * *" }, // daily at 10 AM UTC
  async ({ step }) => {
    /* 1. fetch all users that still owe money */
    const users = await getUsersWithOutstandingDebts();

    /* 2. build & send one e‑mail per user */
    const results = await step.run("send‑emails", async () => {
      return Promise.all(
        users.map(async (user) => {
          const rows = user.debts
            .map(
              (d) => `
                <tr>
                  <td style="padding:4px 8px;">${d.name}</td>
                  <td style="padding:4px 8px;">₹${d.amount.toFixed(2)}</td>
                </tr>
              `,
            )
            .join("");

          if (!rows) return { userId: user.id, status: "skipped" };

          const html = `
            <h2>Splitr – Payment Reminder</h2>
            <p>Hi ${user.name}, you have the following outstanding balances:</p>
            <table cellspacing="0" cellpadding="0" border="1" style="border-collapse:collapse;">
              <thead>
                <tr><th>To</th><th>Amount</th></tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
            <p>Please settle up soon. Thanks!</p>
          `;

          try {
            await sendEmail({
              to: user.email,
              subject: "You have pending payments on Splitr",
              html,
            });
            return { userId: user.id, status: "success" };
          } catch (err) {
            return {
              userId: user.id,
              status: "failure",
              error: (err as Error).message,
            };
          }
        }),
      );
    });

    return {
      processed: results.length,
      successes: results.filter((r) => r.status === "success").length,
      failures: results.filter((r) => r.status === "failure").length,
    };
  },
);
