// PaleoDex waitlist handler
// Sends bilingual confirmation email via Zoho SMTP + forwards lead to HubSpot.
// Env vars required in Netlify dashboard:
//   ZOHO_USER  = hello@paleodex.co
//   ZOHO_PASS  = Zoho app password (not your main password)

const nodemailer = require("nodemailer");

const HUBSPOT_PORTAL_ID = "50834246";
const HUBSPOT_FORM_GUID = "fb11dbe1-d089-49ad-aa43-90ea7169a1ba";

const CORS = {
  "Access-Control-Allow-Origin": "https://paleodex.co",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// ── Email templates ──────────────────────────────────────────────────────────

function emailEN(firstname) {
  const name = firstname ? ` ${firstname}` : "";
  const subject = "You're on the PaleoDex waitlist";
  const text =
    `Hey${name},\n\n` +
    `You're in. We'll reach out the moment PaleoDex is ready to download on iOS and Android.\n\n` +
    `In the meantime, explore what's coming at paleodex.co — a live fossil map, ` +
    `74,000+ real prehistoric genera, an excavation game, and 540 million years of continental drift.\n\n` +
    `Talk soon,\nThe PaleoDex Team`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#07120c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07120c;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0c1a12;border:1px solid rgba(70,224,138,.18);border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="padding:36px 40px 28px;border-bottom:1px solid rgba(70,224,138,.12);">
          <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.18em;color:#46e08a;">PALEODEX</p>
          <h1 style="margin:14px 0 0;font-size:26px;font-weight:700;color:#d8e8de;line-height:1.2;">You're on the list.</h1>
        </td></tr>
        <tr><td style="padding:28px 40px 32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#9fb6aa;">Hey${name},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#9fb6aa;">
            We'll reach out the moment PaleoDex is ready to download on <strong style="color:#d8e8de;">iOS and Android</strong>.
          </p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#9fb6aa;">
            In the meantime, explore what's coming — a live fossil map, 74,000+ real prehistoric genera, an excavation game, and 540 million years of continental drift.
          </p>
          <a href="https://paleodex.co" style="display:inline-block;font-family:'Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:.08em;color:#06140c;background:#46e08a;padding:13px 24px;border-radius:9px;text-decoration:none;">EXPLORE PALEODEX.CO →</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(70,224,138,.12);">
          <p style="margin:0;font-size:12px;color:#7d978a;line-height:1.6;">
            You're receiving this because you signed up at <a href="https://paleodex.co" style="color:#46e08a;text-decoration:none;">paleodex.co</a>.<br>
            The PaleoDex Team · Santiago, Chile
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, text, html };
}

function emailES(firstname) {
  const name = firstname ? ` ${firstname}` : "";
  const subject = "Estás en la lista de espera de PaleoDex";
  const text =
    `Hola${name},\n\n` +
    `Ya estás dentro. Te avisamos en cuanto PaleoDex esté disponible para descargar en iOS y Android.\n\n` +
    `Mientras tanto, explora lo que viene en paleodex.co — un mapa fósil en vivo, más de 74.000 géneros ` +
    `prehistóricos reales, un juego de excavación y 540 millones de años de deriva continental.\n\n` +
    `Hasta pronto,\nEl equipo de PaleoDex`;
  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${subject}</title></head>
<body style="margin:0;padding:0;background:#07120c;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07120c;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#0c1a12;border:1px solid rgba(70,224,138,.18);border-radius:16px;overflow:hidden;max-width:520px;width:100%;">
        <tr><td style="padding:36px 40px 28px;border-bottom:1px solid rgba(70,224,138,.12);">
          <p style="margin:0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:.18em;color:#46e08a;">PALEODEX</p>
          <h1 style="margin:14px 0 0;font-size:26px;font-weight:700;color:#d8e8de;line-height:1.2;">Ya estás dentro.</h1>
        </td></tr>
        <tr><td style="padding:28px 40px 32px;">
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#9fb6aa;">Hola${name},</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#9fb6aa;">
            Te avisamos en cuanto PaleoDex esté disponible para descargar en <strong style="color:#d8e8de;">iOS y Android</strong>.
          </p>
          <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#9fb6aa;">
            Mientras tanto, explora lo que viene — un mapa fósil en vivo, más de 74.000 géneros prehistóricos reales, un juego de excavación y 540 millones de años de deriva continental.
          </p>
          <a href="https://paleodex.co/es/" style="display:inline-block;font-family:'Courier New',monospace;font-size:12px;font-weight:700;letter-spacing:.08em;color:#06140c;background:#46e08a;padding:13px 24px;border-radius:9px;text-decoration:none;">EXPLORAR PALEODEX.CO →</a>
        </td></tr>
        <tr><td style="padding:20px 40px;border-top:1px solid rgba(70,224,138,.12);">
          <p style="margin:0;font-size:12px;color:#7d978a;line-height:1.6;">
            Recibiste este correo porque te registraste en <a href="https://paleodex.co/es/" style="color:#46e08a;text-decoration:none;">paleodex.co</a>.<br>
            El equipo de PaleoDex · Santiago, Chile
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
  return { subject, text, html };
}

// ── HubSpot submission ───────────────────────────────────────────────────────

async function submitToHubSpot(fields, pageUri, pageName) {
  const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_GUID}`;
  const body = {
    fields,
    context: { pageUri: pageUri || "https://paleodex.co", pageName: pageName || "PaleoDex" },
  };
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    // Retry without legalConsent if that's the issue
    const txt = await res.text();
    if (res.status === 400 && /consent|gdpr/i.test(txt)) {
      const res2 = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields, context: body.context }),
      });
      if (!res2.ok) throw new Error(`HubSpot ${res2.status}`);
    } else {
      throw new Error(`HubSpot ${res.status}: ${txt}`);
    }
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: CORS, body: "Method not allowed" };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Bad JSON" }) };
  }

  const { email, firstname, lang = "en", pageUri, pageName, honeypot } = data;

  // Honeypot check
  if (honeypot) {
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ ok: true }) };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: "Invalid email" }) };
  }

  const isES = lang === "es";

  // 1. Submit to HubSpot (primary — must succeed)
  try {
    const fields = [
      { name: "email", value: email },
      ...(firstname ? [{ name: "firstname", value: firstname }] : []),
    ];
    await submitToHubSpot(fields, pageUri, pageName);
  } catch (err) {
    console.error("HubSpot error:", err.message);
    return {
      statusCode: 502,
      headers: CORS,
      body: JSON.stringify({ error: "Submission failed. Please try again." }),
    };
  }

  // 2. Send confirmation email (secondary — log failure, don't block)
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_USER,
        pass: process.env.ZOHO_PASS,
      },
    });
    const tpl = isES ? emailES(firstname) : emailEN(firstname);
    await transporter.sendMail({
      from: `"PaleoDex Team" <${process.env.ZOHO_USER}>`,
      to: email,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });
  } catch (err) {
    console.error("Email error:", err.message);
    // Don't fail the request — lead is already in HubSpot
  }

  return {
    statusCode: 200,
    headers: CORS,
    body: JSON.stringify({ ok: true }),
  };
};
