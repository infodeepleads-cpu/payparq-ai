import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
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

    // 2. Send Emails via Resend
    // This is the "ground up" setup using Resend for better deliverability and custom domain support.
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY is missing. Skipping email sending.");
      // Return success to UI so the user isn't blocked, but log the warning
      return NextResponse.json({ 
        success: true, 
        warning: "email_configuration_missing" 
      });
    }

    const resend = new Resend(resendApiKey);
    // Use configured From address or fallback to Resend's testing domain
    // Using verified domain mail.payparq.com
    const fromEmail = process.env.EMAIL_FROM || "PayParq Team <team@mail.payparq.com>";
    
    // Notification to Admin
    const summaryLines = [
      `New "Talk to Sales" request from Discover How page`,
      "",
      `Name: ${firstName} ${lastName}`,
      `Email: ${workEmail}`,
      `Company: ${company}`,
      `Locations: ${locations || "Not provided"}`,
      `Explore options: ${exploreSummary || "No specific options selected"}`,
    ];

    try {
      console.log(`Attempting to send admin email via Resend from ${fromEmail}...`);
      await resend.emails.send({
        from: fromEmail,
        to: [process.env.EMAIL_TO || "payparq@outlook.com"],
        replyTo: workEmail,
        subject: "New Payparq sales request",
        text: summaryLines.join("\n"),
      });
      console.log("Admin email sent successfully.");

      // Confirmation to User
      if (workEmail) {
        const confirmationLines = [
          `Hi ${firstName},`,
          "",
          "Thanks for reaching out to Payparq.",
          "Your request has been received and a member of our team will follow up",
          "by the next business day, Monday through Saturday.",
          "",
          "If you have any additional context to share before then, you can reply",
          "directly to this email.",
          "",
          "Best,",
          "The Payparq Team",
        ];

        console.log(`Attempting to send confirmation email to ${workEmail}...`);
        await resend.emails.send({
          from: fromEmail,
          to: workEmail,
          subject: "We received your Payparq request",
          text: confirmationLines.join("\n"),
        });
        console.log("Confirmation email sent successfully.");
      }

      return NextResponse.json({ success: true });
    } catch (emailError) {
      console.error("Error sending email via Resend:", emailError);
      // Return success even if email fails, to avoid breaking the UI flow for the user
      return NextResponse.json({ success: true, warning: "email_send_failed" });
    }

  } catch (error) {
    console.error("Unexpected error handling sales request:", error);
    return NextResponse.json(
      { error: "Unexpected error processing request." },
      { status: 500 }
    );
  }
}
