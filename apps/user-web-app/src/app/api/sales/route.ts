import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase } from "@/lib/supabase";

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

    const host = process.env.EMAIL_SERVER_HOST;
    const port = process.env.EMAIL_SERVER_PORT;
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;

    if (host && port && user && pass) {
      try {
        console.log("Attempting to send email via", host);
        const transporter = nodemailer.createTransport({
          host,
          port: Number(port),
          secure: Number(port) === 465,
          auth: {
            user,
            pass,
          },
        });

        const summaryLines = [
          `New "Talk to Sales" request from Discover How page`,
          "",
          `Name: ${firstName} ${lastName}`,
          `Email: ${workEmail}`,
          `Company: ${company}`,
          `Locations: ${locations || "Not provided"}`,
          `Explore options: ${
            exploreSummary || "No specific options selected"
          }`,
        ];

        console.log("Sending summary email to recipients...");
        const info = await transporter.sendMail({
          from: user,
          to: "kzamic@gmail.com, payparq@outlook.com",
          subject: "New Payparq sales request",
          text: summaryLines.join("\n"),
        });
        console.log("Summary email result:", info && typeof info === "object" ? JSON.stringify(info) : String(info));

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

          console.log(`Sending confirmation email to ${workEmail}...`);
          const confirmInfo = await transporter.sendMail({
            from: user,
            to: workEmail,
            subject: "We received your Payparq request",
            text: confirmationLines.join("\n"),
          });
          console.log("Confirmation email result:", confirmInfo && typeof confirmInfo === "object" ? JSON.stringify(confirmInfo) : String(confirmInfo));
        }
        return NextResponse.json({ success: true });
      } catch (emailError) {
        console.error("Error sending sales request email:", emailError);
        // Return success even if email fails, to avoid breaking the UI flow for the user
        return NextResponse.json({ success: true, warning: "email_send_failed" });
      }
    } else {
      const missing = [];
      if (!host) missing.push("EMAIL_SERVER_HOST");
      if (!port) missing.push("EMAIL_SERVER_PORT");
      if (!user) missing.push("EMAIL_SERVER_USER");
      if (!pass) missing.push("EMAIL_SERVER_PASSWORD");
      
      console.warn(
        `Email server environment variables are not fully configured. Missing: ${missing.join(", ")}. Skipping email notification.`
      );
    }

    return NextResponse.json({ success: true });

    
  } catch (error) {
    console.error("Unexpected error handling sales request:", error);
    // Return a generic error but with a 200 OK status to prevent client-side crashes if the client is sensitive to non-200
    // However, best practice is to return 500. 
    // Given the user's issue with "Submission failed" error, we'll try to return success: false
    // But the client code throws if !res.ok.
    // If we return 500, client throws.
    // We should return 200 with { error: "..." } if we want to handle it gracefully in client.
    // But I updated client to look for res.ok.
    // So I will return 500.
    return NextResponse.json(
      { error: "Unexpected error processing request." },
      { status: 500 }
    );
  }
}
