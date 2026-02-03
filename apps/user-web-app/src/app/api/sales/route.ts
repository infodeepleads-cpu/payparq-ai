import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

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

    const { error: insertError } = await supabaseAdmin
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
      return NextResponse.json(
        { error: "Failed to record sales request." },
        { status: 500 }
      );
    }

    const host = process.env.EMAIL_SERVER_HOST;
    const port = process.env.EMAIL_SERVER_PORT;
    const user = process.env.EMAIL_SERVER_USER;
    const pass = process.env.EMAIL_SERVER_PASSWORD;

    if (host && port && user && pass) {
      try {
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

        await transporter.sendMail({
          from: user,
          to: "payparq@outlook.com",
          subject: "New Payparq sales request",
          text: summaryLines.join("\n"),
        });

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

          await transporter.sendMail({
            from: user,
            to: workEmail,
            subject: "We received your Payparq request",
            text: confirmationLines.join("\n"),
          });
        }
      } catch (emailError) {
        console.error("Error sending sales request email:", emailError);
      }
    } else {
      console.warn(
        "Email server environment variables are not fully configured. Skipping email notification."
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected error handling sales request:", error);
    return NextResponse.json(
      { error: "Unexpected error processing request." },
      { status: 500 }
    );
  }
}
