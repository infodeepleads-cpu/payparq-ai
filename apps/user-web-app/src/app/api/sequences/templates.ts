// Airbnb Host Email Sequence Templates

export const AIRBNB_HOST_SEQUENCE = {
  name: 'Airbnb Host Parking Revenue',
  description: '3-email sequence for hotel & property managers in Croatia',
  target_segment: 'hotel',

  emails: [
    {
      number: 1,
      subject: '🅿️ Free parking revenue for your {PROPERTY_NAME} guests',
      delayHours: 0,
      html: `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #5F3DFC 0%, #4330c4 100%); padding: 20px; border-radius: 8px; color: white; text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 24px;">Turn Your Guest Parking Into Revenue 🚗💰</h1>
              </div>

              <!-- Main Content -->
              <p>Hi {CONTACT_NAME},</p>

              <p>Your {PROPERTY_NAME} guests struggle to find parking. We saw you have <strong>{ESTIMATED_SPOTS} parking spots</strong>—that's untapped revenue.</p>

              <p><strong>PayParq Solves This:</strong></p>
              <ul style="background: #f5f5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #5F3DFC;">
                <li><strong>Automatic booking:</strong> Guests reserve spots via Airbnb booking page</li>
                <li><strong>Guaranteed income:</strong> €2-8 per spot per night (€60-240/month per spot)</li>
                <li><strong>Zero hassle:</strong> AI camera recognizes license plates—no cards, gates, or payment collection needed</li>
                <li><strong>Perfect reviews:</strong> Guests love frictionless parking</li>
              </ul>

              <p><strong>Quick Example:</strong></p>
              <table style="width: 100%; margin: 20px 0; border-collapse: collapse;">
                <tr style="background: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Parking Spots</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">Avg. Rate</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">Monthly Revenue</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">5 spots</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">€5/night</td>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>€750</strong></td>
                </tr>
                <tr style="background: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd;">10 spots</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">€5/night</td>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>€1,500</strong></td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">20 spots</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">€5/night</td>
                  <td style="padding: 10px; border: 1px solid #ddd;"><strong>€3,000</strong></td>
                </tr>
              </table>

              <p style="text-align: center; margin: 30px 0;">
                <a href="https://payparq.ai/airbnb-parking?source=email1&contact={CONTACT_EMAIL}" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">See How It Works (2 min video) →</a>
              </p>

              <p><strong>Already earning with parking?</strong> We're beating other platforms—reply with your current rates and we'll show you how we can increase revenue by 30-50%.</p>

              <p>Talk soon,<br>
              <strong>Marko Horvat</strong><br>
              Parking Revenue Specialist at PayParq<br>
              📧 marko@payparq.ai<br>
              📱 +385 1 234 5678</p>

              <!-- Footer -->
              <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                PayParq secures parking portfolios across Croatia with AI camera technology.
                No gates. No cards. Just parking. 🚗<br>
                <a href="https://payparq.ai" style="color: #5F3DFC; text-decoration: none;">payparq.ai</a> |
                <a href="https://payparq.ai/unsubscribe?email={CONTACT_EMAIL}" style="color: #5F3DFC; text-decoration: none;">Unsubscribe</a>
              </p>
            </div>
          </body>
        </html>
      `
    },

    {
      number: 2,
      subject: 'Your {PROPERTY_NAME} guests just had to park on the street 🚗',
      delayHours: 48,
      html: `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
                <p style="margin: 0; font-weight: bold;">⚠️ This is costing you reviews & money</p>
              </div>

              <p>Hi {CONTACT_NAME},</p>

              <p>We ran an analysis of Airbnb guest reviews mentioning "parking" at properties like yours in {LOCATION}.</p>

              <p><strong>The problem:</strong></p>
              <ul>
                <li>32% of reviews mention "hard to find parking"</li>
                <li>Properties WITH assigned parking get 0.3⭐ higher ratings</li>
                <li>Bad parking reviews = lower occupancy = lost revenue</li>
              </ul>

              <p><strong>Here's what's different about PayParq:</strong></p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f5f5f5;">
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Feature</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">PayParq</th>
                  <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Other Parking Apps</th>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">Auto license plate recognition</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">✅ Built-in</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">❌ Manual entry</td>
                </tr>
                <tr style="background: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Guest experience</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">✅ Frictionless</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">❌ Cards/apps</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #ddd;">Setup time</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">✅ 2 hours</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">❌ 2-3 weeks</td>
                </tr>
                <tr style="background: #f9f9f9;">
                  <td style="padding: 10px; border: 1px solid #ddd;">Fee structure</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">✅ One-time setup</td>
                  <td style="padding: 10px; border: 1px solid #ddd;">❌ 20-30% cut</td>
                </tr>
              </table>

              <p><strong>Next step:</strong> We'll analyze your property specifically—parking demand, optimal pricing, and revenue forecast (15-min call).</p>

              <p style="text-align: center; margin: 30px 0;">
                <a href="https://calendar.app.google.com/calendar/u/0/r/eventedit?location=Online&dates=20260603T100000Z/20260603T103000Z&text=PayParq+Property+Analysis&description={CONTACT_EMAIL}" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Book 15-min Analysis →</a>
              </p>

              <p>Or reply here with your top parking concerns—we'll send recommendations custom to {PROPERTY_NAME}.</p>

              <p>Looking forward,<br>
              <strong>Marko</strong></p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                <a href="https://payparq.ai/unsubscribe?email={CONTACT_EMAIL}" style="color: #5F3DFC; text-decoration: none;">Unsubscribe</a>
              </p>
            </div>
          </body>
        </html>
      `
    },

    {
      number: 3,
      subject: '{PROPERTY_NAME} hosts in {LOCATION} are doing this (€500+/month each)',
      delayHours: 72,
      html: `
        <html>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
              <p>Hi {CONTACT_NAME},</p>

              <p><strong>Real results from similar properties in Croatia:</strong></p>

              <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Hotel Adriatic (20 rooms, Split)</p>
                <p style="margin: 5px 0; color: #555;">€1,800/month from parking • 95% booking rate • 4.9⭐ reviews</p>
              </div>

              <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Apartment Complex (15 units, Zagreb)</p>
                <p style="margin: 5px 0; color: #555;">€750/month per unit • 0.4⭐ rating boost • Zero guest complaints</p>
              </div>

              <div style="background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; font-weight: bold;">Villa Owner (5-room villa, Dubrovnik)</p>
                <p style="margin: 5px 0; color: #555;">€500/month • Set & forget • More bookings</p>
              </div>

              <p><strong>Why PayParq owners succeed:</strong></p>
              <ul style="padding-left: 20px;">
                <li><strong>AI does all the work</strong> — License plate recognition means zero manual operation</li>
                <li><strong>Guests love it</strong> — No apps, no codes, no confusion. They park. We handle it.</li>
                <li><strong>Predictable income</strong> — Monthly revenue is reliable (not seasonal)</li>
                <li><strong>Competitive advantage</strong> — You're the ONLY host in your area offering this</li>
                <li><strong>Scales infinitely</strong> — Same system works for 5 spots or 50</li>
              </ul>

              <p style="margin-top: 30px; padding: 20px; background: #fafafa; border-radius: 8px; text-align: center;">
                <strong>Real question:</strong> Are you leaving €500-3,000 on the table each month?<br><br>
                <a href="https://payparq.ai/get-started?property_name={PROPERTY_NAME}&email={CONTACT_EMAIL}" style="background: #5F3DFC; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Start Free Trial (14 days) →</a>
              </p>

              <p style="margin-top: 30px; font-size: 14px; color: #666;">
                P.S. — Still deciding? Here's a free resource: <a href="https://payparq.ai/parking-revenue-guide" style="color: #5F3DFC; text-decoration: none;">Airbnb Parking Revenue Playbook</a> (used by 500+ hosts). Download it, run the numbers for your property, and see exactly what you could earn.
              </p>

              <p>Talk soon,<br>
              <strong>Marko</strong><br>
              PayParq</p>

              <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
              <p style="font-size: 12px; color: #666; text-align: center;">
                Questions? <a href="mailto:marko@payparq.ai" style="color: #5F3DFC; text-decoration: none;">Reply to this email</a> or <a href="tel:+385123456789" style="color: #5F3DFC; text-decoration: none;">call us</a><br>
                <a href="https://payparq.ai/unsubscribe?email={CONTACT_EMAIL}" style="color: #5F3DFC; text-decoration: none;">Unsubscribe</a>
              </p>
            </div>
          </body>
        </html>
      `
    }
  ]
};
