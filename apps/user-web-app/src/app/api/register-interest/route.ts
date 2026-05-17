import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email, phone, country } = await request.json();

    // Validate
    if (!email || !phone || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save to leads table
    const { data, error: dbError } = await supabase
      .from('host_registration_leads')
      .insert([{ email, phone, country }])
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save registration' },
        { status: 500 }
      );
    }

    // Add to locations table for mobile scanner inbox (registration interest - read-only)
    try {
      const { error: locationErr } = await supabase
        .from('locations')
        .insert({
          owner_email: email,
          owner_phone: phone,
          country_code: country,
          verification_status: 'registration_interest',
          verification_submitted_at: new Date().toISOString(),
        });
      if (locationErr) {
        console.error('Location insert error:', locationErr);
      } else {
        console.log('Registration lead added to locations for inbox');
      }
    } catch (locationErr) {
      console.error('Location insert error:', locationErr);
    }

    // Send email notification
    const notificationEmail = process.env.HOST_NOTIFICATION_EMAIL || 'payparq@outlook.com';
    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      console.error('RESEND_API_KEY not configured');
    }

    try {
      const { error: sendError, data: sendData } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'PayParq Team <team@info.payparq.com>',
        to: notificationEmail,
        subject: '🎉 New Host Registration Lead',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#111827;background:#ffffff;">
            <h2 style="margin:0 0 16px 0;">New Host Registration Interest</h2>
            <p style="margin:0 0 12px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin:0 0 12px 0;"><strong>Phone:</strong> ${phone}</p>
            <p style="margin:0 0 12px 0;"><strong>Country:</strong> ${country}</p>
            <p style="margin:0 0 18px 0;color:#6B7280;font-size:12px;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            <hr style="border:none;border-top:1px solid #E5E7EB;margin:18px 0;" />
            <p style="margin:0;"><a href="https://payparq.app/admin/leads" style="color:#5F3DFC;text-decoration:none;font-weight:600;">View all leads →</a></p>
          </div>
        `,
      });

      if (sendError) {
        console.error('Email sending failed:', sendError);
      } else if (sendData?.id) {
        console.log('Email sent successfully:', sendData.id);
      }
    } catch (emailError) {
      console.error('Email sending error:', emailError);
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration received. Check your email!',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
