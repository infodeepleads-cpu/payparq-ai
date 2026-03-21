import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let formData;
    try {
      formData = await req.formData();
    } catch (e) {
      console.error("Error parsing form data:", e);
      return NextResponse.json(
        { error: "Invalid form data." },
        { status: 400 }
      );
    }

    const firstName = (formData.get("first_name") || "").toString().trim();
    const lastName = (formData.get("last_name") || "").toString().trim();
    const workEmail = (formData.get("work_email") || "").toString().trim();
    const company = (formData.get("company") || "").toString().trim();
    const locations = (formData.get("locations") || "").toString().trim();
    const exploreSelections = formData.getAll("explore").map((value) => value.toString());

    if (!firstName || !lastName || !workEmail || !company) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const exploreSummary =
      exploreSelections.length > 0 ? exploreSelections.join(", ") : null;

    // 1. Save to Supabase
    const client = supabaseAdmin ?? supabase;
    if (client) {
      const { error: insertError } = await client
        .from("sales_requests")
        .insert({
          first_name: firstName,
          last_name: lastName,
          work_email: workEmail,
          company,
          locations,
          explore_options: exploreSummary,
          source: "discover_how",
        });
      if (insertError) {
        console.error("Error inserting sales request into Supabase:", insertError);
      }
    } else {
      console.warn("Supabase not configured. Skipping sales request recording.");
    }

    // 2. Email Sending logic
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.EMAIL_FROM || "PayParq Team <team@info.payparq.com>";
    const adminEmail = process.env.EMAIL_TO || "payparq@outlook.com";
    const adminRecipients = Array.from(
      new Set(
        adminEmail
          .split(",")
          .map((email) => email.trim())
          .filter(Boolean)
      )
    );
    if (adminRecipients.includes("paypar@outlook.com") && !adminRecipients.includes("payparq@outlook.com")) {
      adminRecipients.push("payparq@outlook.com");
    }

    const submittedAt = new Date().toISOString();

    const summaryLines = [
      `New "Talk to Sales" request from Discover How page`,
      "",
      `Submitted at (UTC): ${submittedAt}`,
      `First name: ${firstName}`,
      `Last name: ${lastName}`,
      `Work email: ${workEmail}`,
      `Company: ${company}`,
      `Locations: ${locations || "Not provided"}`,
      `Explore options: ${exploreSummary || "No specific options selected"}`,
    ];

    const confirmationLines = [
      `Hi ${firstName},`,
      "",
      "Thanks for reaching out to Payparq.",
      "Your request has been received and a member of our team will follow up",
      "by the next business day, Monday through Saturday.",
      "",
      "We received the following details:",
      `- First name: ${firstName}`,
      `- Last name: ${lastName}`,
      `- Work email: ${workEmail}`,
      `- Company: ${company}`,
      `- Locations: ${locations || "Not provided"}`,
      `- Explore options: ${exploreSummary || "No specific options selected"}`,
      "",
      "If you have any additional context to share before then, you can reply",
      "directly to this email.",
      "",
      "Best,",
      "The Payparq Team",
    ];

    if (resendApiKey) {
      console.log("Using Resend for email sending...");
      const resend = new Resend(resendApiKey);
      try {
        // Admin notification
        for (const recipient of adminRecipients) {
          const adminSend = await resend.emails.send({
            from: fromEmail,
            to: recipient,
            replyTo: workEmail,
            subject: "New Payparq sales request",
            text: summaryLines.join("\n"),
          });
          console.log("Admin email sent via Resend.", recipient, adminSend.data?.id ?? "no-id");
        }

        // Confirmation to user
        if (workEmail) {
          const confirmationSend = await resend.emails.send({
            from: fromEmail,
            to: workEmail,
            subject: "We received your Payparq request",
            text: confirmationLines.join("\n"),
          });
          console.log("Confirmation email sent via Resend.", confirmationSend.data?.id ?? "no-id");
        }
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error("Resend error:", err);
        // Fallback or error
      }
    }

    // Fallback to Nodemailer if SMTP is configured
    const smtpHost = process.env.EMAIL_SERVER_HOST;
    const smtpPort = process.env.EMAIL_SERVER_PORT;
    const smtpUser = process.env.EMAIL_SERVER_USER;
    const smtpPass = process.env.EMAIL_SERVER_PASSWORD;

    if (smtpHost && smtpUser && smtpPass) {
      console.log("Using SMTP (Nodemailer) for email sending...");
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(smtpPort) || 587,
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      try {
        // Admin notification
        await transporter.sendMail({
          from: fromEmail,
          to: adminRecipients,
          replyTo: workEmail,
          subject: "New Payparq sales request",
          text: summaryLines.join("\n"),
        });
        console.log("Admin email sent via SMTP.");

        // Confirmation to user
        if (workEmail) {
          await transporter.sendMail({
            from: fromEmail,
            to: workEmail,
            subject: "We received your Payparq request",
            text: confirmationLines.join("\n"),
          });
          console.log("Confirmation email sent via SMTP.");
        }
        return NextResponse.json({ success: true });
      } catch (err) {
        console.error("SMTP error:", err);
      }
    }

    console.error("No email service (Resend or SMTP) is correctly configured.");
    return NextResponse.json(
      { error: "Email configuration missing or incorrect.", warning: "email_not_sent" },
      { status: 500 }
    );

  } catch (error) {
    console.error("Unexpected error handling sales request:", error);
    return NextResponse.json(
      { error: "Unexpected error processing request." },
      { status: 500 }
    );
  }
}
