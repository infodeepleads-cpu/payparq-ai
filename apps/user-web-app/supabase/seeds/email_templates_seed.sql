-- Seed initial email templates
INSERT INTO email_templates (name, subject, html_content, category, description) VALUES
(
  'Email 1 - Hotel Outreach',
  'Povećajte prihod od parkiranja sa Payparq',
  '<!DOCTYPE html>
<html lang="hr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:#111111;padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Payparq</p>
              <p style="margin:4px 0 0;color:#999999;font-size:12px;">Pametno parkiranje za gradove i objekte</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 24px;font-size:15px;color:#111111;line-height:1.6;">
                Poštovani,
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
                Svaki hotel gubi prihode od parkiranja — ne zato što nema potražnje, nego zato što nema sustava koji njime upravlja.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#333333;line-height:1.6;">
                Možemo li dogovoriti kratki poziv ovog tjedna?
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#111111;border-radius:999px;padding:14px 28px;">
                    <a href="https://www.payparq.com/discover-how" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Dogovorimo demo →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;font-size:14px;color:#333333;line-height:1.6;">
                Srdačan pozdrav,<br>
                <strong>Tim Payparq</strong><br>
                <span style="color:#999999;font-size:12px;">payparq@outlook.com</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;padding:20px 40px;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:11px;color:#999999;line-height:1.5;">
                Payparq · Hrvatska · <a href="https://payparq.com" style="color:#999999;">payparq.com</a><br>
                Ako ne želite primati ovakve poruke, slobodno nam odgovorite s "Odjava".
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'hotel',
  'Hotel and property outreach for parking management solutions'
),
(
  'Email 2 - Generic Promotion',
  'Promjena u sustavu parkiranja',
  '<!DOCTYPE html>
<html lang="hr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <tr>
            <td style="background:#111111;padding:28px 40px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Payparq</p>
              <p style="margin:4px 0 0;color:#999999;font-size:12px;">Pametno parkiranje za gradove i objekte</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 24px;font-size:15px;color:#111111;line-height:1.6;">
                Poštovani,
              </p>
              <p style="margin:0 0 16px;font-size:15px;color:#333333;line-height:1.6;">
                Želimo vas pozvati da saznate više o novim mogućnostima u upravljanju parkiranjem.
              </p>
              <p style="margin:0 0 32px;font-size:15px;color:#333333;line-height:1.6;">
                Naš tim je dostupan za prezentaciju prilagođenu vašim potrebama.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#111111;border-radius:999px;padding:14px 28px;">
                    <a href="https://www.payparq.com/discover-how" style="color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">Saznajte više →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              <p style="margin:0;font-size:14px;color:#333333;line-height:1.6;">
                Srdačan pozdrav,<br>
                <strong>Tim Payparq</strong><br>
                <span style="color:#999999;font-size:12px;">payparq@outlook.com</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f5f5f5;padding:20px 40px;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:11px;color:#999999;line-height:1.5;">
                Payparq · Hrvatska · <a href="https://payparq.com" style="color:#999999;">payparq.com</a><br>
                Ako ne želite primati ovakve poruke, slobodno nam odgovorite s "Odjava".
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>',
  'general',
  'Generic promotional template for general outreach'
)
ON CONFLICT (name) DO NOTHING;
