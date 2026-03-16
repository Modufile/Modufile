/**
 * Cloudflare Pages Function — POST /api/contact
 *
 * Sends contact form submissions to info@modufile.com via MailChannels.
 *
 * Setup (one-time, in Cloudflare DNS for modufile.com):
 *   Add TXT record:  _mailchannels   v=mc1 cfid=modufile.com
 *   This "domain locks" MailChannels so only your Cloudflare zone can send on your behalf.
 */

interface Env {
    // No bindings required — MailChannels is called via fetch
}

interface ContactBody {
    email: string;
    message: string;
    name?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    // CORS preflight handled by onRequestOptions below
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
    };

    let body: ContactBody;
    try {
        body = await context.request.json<ContactBody>();
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers });
    }

    const { email, message, name } = body;

    if (!email || !message) {
        return new Response(JSON.stringify({ error: 'email and message are required' }), { status: 400, headers });
    }

    // Basic validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return new Response(JSON.stringify({ error: 'Invalid email address' }), { status: 400, headers });
    }
    if (message.length > 5000) {
        return new Response(JSON.stringify({ error: 'Message too long (max 5000 chars)' }), { status: 400, headers });
    }

    const senderName = name?.trim() || 'Modufile Contact Form';

    const payload = {
        personalizations: [
            {
                to: [{ email: 'info@modufile.com', name: 'Modufile' }],
                reply_to: { email, name: senderName },
            },
        ],
        from: { email: 'noreply@modufile.com', name: 'Modufile Contact Form' },
        subject: `[Modufile] Message from ${senderName}`,
        content: [
            {
                type: 'text/plain',
                value: [
                    `From: ${senderName} <${email}>`,
                    '',
                    message,
                    '',
                    '---',
                    'Sent via modufile.com/contact',
                ].join('\n'),
            },
            {
                type: 'text/html',
                value: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#18181b">
  <div style="background:#09090b;padding:24px 32px;border-radius:12px;border:1px solid #27272a">
    <h2 style="color:#fff;margin:0 0 4px">New message via Modufile</h2>
    <p style="color:#71717a;font-size:13px;margin:0 0 24px">modufile.com/contact</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr>
        <td style="color:#71717a;padding:6px 0;width:80px;vertical-align:top">From</td>
        <td style="color:#e4e4e7;padding:6px 0">${escapeHtml(senderName)} &lt;${escapeHtml(email)}&gt;</td>
      </tr>
    </table>
    <div style="margin-top:20px;padding:16px;background:#18181b;border-radius:8px;color:#d4d4d8;font-size:14px;line-height:1.6;white-space:pre-wrap">${escapeHtml(message)}</div>
  </div>
</div>`,
            },
        ],
    };

    try {
        const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.ok || res.status === 202) {
            return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
        }

        const errText = await res.text();
        console.error('MailChannels error:', res.status, errText);
        return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 502, headers });
    } catch (err) {
        console.error('MailChannels fetch error:', err);
        return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers });
    }
};

// CORS preflight
export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
};

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
