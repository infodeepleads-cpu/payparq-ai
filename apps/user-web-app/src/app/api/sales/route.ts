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

    const source = (formData.get("source") || "").toString().trim().toLowerCase() || "discover_how";
    const isInsuranceApply = source === "insurance_apply";
    const firstName = (formData.get("first_name") || "").toString().trim();
    const lastName = (formData.get("last_name") || "").toString().trim();
    const workEmail = (formData.get("work_email") || "").toString().trim();
    const mobilePhone = (formData.get("mobile_phone") || "").toString().trim();
    const company = (formData.get("company") || "").toString().trim();
    const locations = (formData.get("locations") || "").toString().trim();
    const exploreSelections = formData.getAll("explore").map((value) => value.toString());
    const licensePlate = (formData.get("license_plate") || "").toString().trim();
    const vehicleMakeModel = (formData.get("vehicle_make_model") || "").toString().trim();
    const vehicleYear = (formData.get("vehicle_year") || "").toString().trim();
    const locationName = (formData.get("location_name") || "").toString().trim();
    const coverageType = (formData.get("coverage_type") || "").toString().trim();
    const notes = (formData.get("notes") || "").toString().trim();
    const mobilePhonePattern = /^\+?[0-9()\-\s]{7,20}$/;

    const hasRequiredSalesFields = !!firstName && !!lastName && !!workEmail && !!company && !!mobilePhone;
    const hasRequiredInsuranceFields =
      !!firstName && !!lastName && !!workEmail && !!mobilePhone && !!licensePlate && !!vehicleMakeModel;

    if ((isInsuranceApply && !hasRequiredInsuranceFields) || (!isInsuranceApply && !hasRequiredSalesFields)) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }
    if (!mobilePhonePattern.test(mobilePhone)) {
      return NextResponse.json(
        { error: "Invalid mobile phone number." },
        { status: 400 }
      );
    }

    const exploreSummary =
      exploreSelections.length > 0 ? exploreSelections.join(", ") : null;
    const insuranceDetailParts = [
      `Registracija: ${licensePlate || "Nije uneseno"}`,
      `Vozilo: ${vehicleMakeModel || "Nije uneseno"}`,
      `Godina vozila: ${vehicleYear || "Nije uneseno"}`,
      `Lokacija: ${locationName || "Nije uneseno"}`,
      `Vrsta pokrića: ${coverageType || "Nije odabrano"}`,
      `Napomena: ${notes || "Nema napomene"}`,
    ];
    const insuranceSummary = insuranceDetailParts.join(" | ");
    const dbCompany = isInsuranceApply ? `Insurance | ${vehicleMakeModel || "Vehicle not provided"}` : company;
    const dbLocations = isInsuranceApply ? locationName || "Not provided" : locations;
    const dbExploreOptions = isInsuranceApply ? insuranceSummary : exploreSummary;
    const dbSource = isInsuranceApply ? "insurance_apply" : "discover_how";

    const client = supabaseAdmin ?? supabase;
    if (client) {
      const { error: insertError } = await client
        .from("sales_requests")
        .insert({
          first_name: firstName,
          last_name: lastName,
          work_email: workEmail,
          company: dbCompany,
          locations: dbLocations,
          explore_options: dbExploreOptions,
          source: dbSource,
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

    const summaryLines = isInsuranceApply
      ? [
          `New insurance application request from Members`,
          "",
          `Submitted at (UTC): ${submittedAt}`,
          `First name: ${firstName}`,
          `Last name: ${lastName}`,
          `Work email: ${workEmail}`,
          `Mobile phone: ${mobilePhone}`,
          `License plate: ${licensePlate}`,
          `Vehicle make/model: ${vehicleMakeModel}`,
          `Vehicle year: ${vehicleYear || "Not provided"}`,
          `Location: ${locationName || "Not provided"}`,
          `Coverage type: ${coverageType || "Not selected"}`,
          `Notes: ${notes || "No additional notes"}`,
        ]
      : [
          `New "Talk to Sales" request from Discover How page`,
          "",
          `Submitted at (UTC): ${submittedAt}`,
          `First name: ${firstName}`,
          `Last name: ${lastName}`,
          `Work email: ${workEmail}`,
          `Mobile phone: ${mobilePhone}`,
          `Company: ${company}`,
          `Locations: ${locations || "Not provided"}`,
          `Explore options: ${exploreSummary || "No specific options selected"}`,
        ];

    const confirmationLines = isInsuranceApply
      ? [
          `Hi ${firstName},`,
          "",
          "Thanks for submitting your insurance application request with Payparq.",
          "Your request has been received and our team will follow up by email.",
          "",
          "We received the following details:",
          `- First name: ${firstName}`,
          `- Last name: ${lastName}`,
          `- Work email: ${workEmail}`,
          `- Mobile phone: ${mobilePhone}`,
          `- License plate: ${licensePlate}`,
          `- Vehicle make/model: ${vehicleMakeModel}`,
          `- Vehicle year: ${vehicleYear || "Not provided"}`,
          `- Location: ${locationName || "Not provided"}`,
          `- Coverage type: ${coverageType || "Not selected"}`,
          `- Notes: ${notes || "No additional notes"}`,
          "",
          "Best,",
          "The Payparq Team",
        ]
      : [
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
          `- Mobile phone: ${mobilePhone}`,
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
    const adminSubject = isInsuranceApply ? "New Payparq insurance application request" : "New Payparq sales request";
    const confirmationSubject = isInsuranceApply
      ? "We received your Payparq insurance application"
      : "We received your Payparq request";
    const smtpHost = process.env.EMAIL_SERVER_HOST;
    const smtpPort = process.env.EMAIL_SERVER_PORT;
    const smtpUser = process.env.EMAIL_SERVER_USER;
    const smtpPass = process.env.EMAIL_SERVER_PASSWORD;
    const hasResend = Boolean(resendApiKey);
    const hasSmtp = Boolean(smtpHost && smtpUser && smtpPass);
    if (!hasResend && !hasSmtp) {
      console.error("No email service (Resend or SMTP) is correctly configured.");
      return NextResponse.json(
        { error: "Email configuration missing or incorrect.", warning: "email_not_sent" },
        { status: 500 }
      );
    }
    const sendWithResend = async () => {
      if (!resendApiKey) {
        return false;
      }
      console.log("Using Resend for email sending...");
      const resend = new Resend(resendApiKey);
      try {
        const adminResults = await Promise.allSettled(
          adminRecipients.map(async (recipient) => {
            const adminSend = await resend.emails.send({
              from: fromEmail,
              to: recipient,
              replyTo: workEmail,
              subject: adminSubject,
              text: summaryLines.join("\n"),
            });
            console.log("Admin email sent via Resend.", recipient, adminSend.data?.id ?? "no-id");
          })
        );
        const adminSuccessCount = adminResults.filter((result) => result.status === "fulfilled").length;
        const confirmationResults = workEmail
          ? await Promise.allSettled([
              resend.emails.send({
                from: fromEmail,
                to: workEmail,
                subject: confirmationSubject,
                text: confirmationLines.join("\n"),
              }),
            ])
          : [];
        const confirmationSucceeded =
          !workEmail || confirmationResults.some((result) => result.status === "fulfilled");
        return adminSuccessCount > 0 || confirmationSucceeded;
      } catch (err) {
        console.error("Resend error:", err);
        return false;
      }
    };
    const sendWithSmtp = async () => {
      if (!smtpHost || !smtpUser || !smtpPass) {
        return false;
      }
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
        const adminResults = await Promise.allSettled(
          adminRecipients.map((recipient) =>
            transporter.sendMail({
              from: fromEmail,
              to: recipient,
              replyTo: workEmail,
              subject: adminSubject,
              text: summaryLines.join("\n"),
            })
          )
        );
        const adminSuccessCount = adminResults.filter((result) => result.status === "fulfilled").length;
        const confirmationResults = workEmail
          ? await Promise.allSettled([
              transporter.sendMail({
                from: fromEmail,
                to: workEmail,
                subject: confirmationSubject,
                text: confirmationLines.join("\n"),
              }),
            ])
          : [];
        const confirmationSucceeded =
          !workEmail || confirmationResults.some((result) => result.status === "fulfilled");
        return adminSuccessCount > 0 || confirmationSucceeded;
      } catch (err) {
        console.error("SMTP error:", err);
        return false;
      }
    };
    void (async () => {
      const sentWithResend = await sendWithResend();
      if (sentWithResend) {
        return;
      }
      await sendWithSmtp();
    })();
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Unexpected error handling sales request:", error);
    return NextResponse.json(
      { error: "Unexpected error processing request." },
      { status: 500 }
    );
  }
}
