// @ts-nocheck
// Edge Function para envio de Nota de Encomenda com suporte a CORS

interface OrderItem { name: string; quantity: number; price: number }
interface OrderEmailRequest {
  orderId?: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  currency?: string;
  orderNumber: string;
  items: OrderItem[];
  customerPhone?: string | null;
  customerAddress?: string | null;
  notes?: string | null;
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SENDER_EMAIL = Deno.env.get('SENDER_EMAIL') || 'info@aurenecom.shop';
const COMPANY_ORDER_EMAIL = Deno.env.get('COMPANY_ORDER_EMAIL');
const DEFAULT_CURRENCY = Deno.env.get('DEFAULT_CURRENCY') || 'EUR';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function formatDateTime() {
  return new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' });
}

function esc(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function buildHtml(body: OrderEmailRequest) {
  const currency = body.currency || DEFAULT_CURRENCY;
  const rows = body.items.map(i => `<tr>
    <td style="padding:8px;border:1px solid #e2e8f0">${esc(i.name)}</td>
    <td style="padding:8px;border:1px solid #e2e8f0;text-align:center">${i.quantity}</td>
    <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">${i.price.toFixed(2)} ${currency}</td>
    <td style="padding:8px;border:1px solid #e2e8f0;text-align:right">${(i.price*i.quantity).toFixed(2)} ${currency}</td>
  </tr>`).join('');
  return `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8" /><title>Bestellbestätigung ${esc(body.orderNumber)}</title></head>
  <body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#0f172a;padding:24px;">
    <div style="max-width:700px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px;">
      <div style="background:#0f766e;color:#fff;padding:16px 24px;">
        <h1 style="margin:0;font-size:20px;">Bestellbestätigung</h1>
        <p style="margin:4px 0 0;font-size:14px;">Nummer: <strong>${esc(body.orderNumber)}</strong></p>
      </div>
      <div style="padding:24px;">
        <h2 style="margin:0 0 12px;font-size:16px;">Kunde</h2>
        <p style="margin:4px 0"><strong>Name:</strong> ${esc(body.customerName)}</p>
        ${body.customerPhone ? `<p style="margin:4px 0"><strong>Kontakt:</strong> ${esc(body.customerPhone)}</p>`:''}
        ${body.customerAddress ? `<p style="margin:4px 0"><strong>Adresse:</strong> ${esc(body.customerAddress)}</p>`:''}
        <p style="margin:4px 0"><strong>Email:</strong> ${esc(body.customerEmail)}</p>
        <h2 style="margin:24px 0 12px;font-size:16px;">Artikel</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead><tr style="background:#f1f5f9"><th style="padding:8px;border:1px solid #e2e8f0;text-align:left">Produkt</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:center">Menge</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:right">Stückpreis</th><th style="padding:8px;border:1px solid #e2e8f0;text-align:right">Gesamt</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="4" style="padding:12px;text-align:center;border:1px solid #e2e8f0">Keine Artikel</td></tr>`}</tbody>
        </table>
        <div style="margin-top:16px;text-align:right;font-size:15px"><strong>Gesamtsumme: ${body.totalAmount.toFixed(2)} ${currency}</strong></div>
        ${body.notes ? `<div style="margin-top:16px;background:#f1f5f9;padding:12px;border-radius:6px"><strong>Bemerkungen:</strong><br/>${esc(body.notes)}</div>`:''}
        <p style="margin-top:24px;font-size:12px;color:#475569">Erstellt am ${formatDateTime()}</p>
      </div>
    </div>
  </body></html>`;
}

async function sendEmail(html: string, subject: string, to: string[]) {
  
  if (!RESEND_API_KEY) {
    console.error('A RESEND_API_KEY NÃO ESTÁ DEFINIDA BURRO!');
    return { ok:false, error:'RESEND_API_KEY ausente' };
  }
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${RESEND_API_KEY}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ from: SENDER_EMAIL, to, subject, html })
    });
    const responseText = await resp.text();
    
    if (!resp.ok) {
      console.error('Resend falhou:', resp.status, responseText);
      return { ok:false, error:`Resend falhou ${resp.status}: ${responseText}` };
    }
    return { ok:true, data: JSON.parse(responseText) };
  } catch (e:any) {
    console.error('Erro ao chamar Resend:', e);
    return { ok:false, error:`Falha requisição Resend: ${e.message}` };
  }
}

Deno.serve(async (req) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status:200, headers: { ...corsHeaders } });
  }
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status:405, headers: { ...corsHeaders } });
  }
  try {
    const payload = await req.json() as OrderEmailRequest;
    if (!payload.customerEmail || !payload.orderNumber || !Array.isArray(payload.items)) {
      return new Response(JSON.stringify({ error:'Campos obrigatórios: customerEmail, orderNumber, items.' }), { status:400, headers:{ 'Content-Type':'application/json', ...corsHeaders } });
    }
    const html = buildHtml(payload);
    const subject = `Bestellbestätigung ${payload.orderNumber}`;
    
    const recipients = [payload.customerEmail, COMPANY_ORDER_EMAIL].filter(Boolean) as string[];
    
    if (recipients.length < 1) {
      return new Response(JSON.stringify({ error: 'Sem destinatários: defina COMPANY_ORDER_EMAIL secret.' }), { status:400, headers:{ 'Content-Type':'application/json', ...corsHeaders } });
    }
    const result = await sendEmail(html, subject, recipients);
    return new Response(JSON.stringify(result), { status: result.ok ? 200 : 500, headers:{ 'Content-Type':'application/json', ...corsHeaders } });
  } catch (e:any) {
    console.error('Erro send-order-email:', e);
    return new Response(JSON.stringify({ error: e.message || 'Erro interno'}), { status:500, headers:{ 'Content-Type':'application/json', ...corsHeaders } });
  }
});

