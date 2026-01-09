"use server";

import { Resend } from "resend";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
}
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: SendEmailInput) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { data, error } = await resend.emails.send({
      from: "Upendra <hello@upendradev.com>",
      to,
      subject,
      html,
      text,
    });

    if (error) {
      throw new Error(`Resend API error: ${error.message}`);
    }

    console.log("Email sent successfully:", data.id);

    return { success: true, id: data.id };
  } catch (error) {
    console.error(`Failed to send email: ${error}`);
    return { success: false, error: (error as Error).message };
  }
};
