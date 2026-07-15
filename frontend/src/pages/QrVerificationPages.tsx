// src/pages/QrVerificationPages.tsx
// -----------------------------------------------------------------------------
// Customer-facing "Verify & Pay" screen — proof-based trust model.
//
// The colour of the result is bound to WHAT WE CAN PROVE (Schneier's rule):
//   GREEN  "Verified destination"  — registered account, confirmed with PayVerify
//   AMBER  "Couldn't confirm"      — account is valid but not confirmed as this business
//   RED    "Do not pay"            — the account does not match the business, or QR is invalid
//
// The claim is about the RECEIPT, not our database:
//   "This account name matches {business} on your receipt."
//
// Demo aid: append ?preview=green|amber|red to any /verify/:token link to show
// each state to a partner bank without needing live fraud data.
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

interface QRPayload {
    merchantId: number;
    businessName: string;
    accountNumber: string;
    bankName: string;
    token: string;
    amount?: number;
    description?: string;
}

type Trust = 'verified' | 'caution' | 'blocked' | 'loading';

const QRVerificationPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [params] = useSearchParams();
    const preview = params.get('preview'); // green | amber | red (demo only)

    const [qr, setQr] = useState<QRPayload | null>(null);
    const [serverValid, setServerValid] = useState<boolean | null>(null);
    const [method, setMethod] = useState<'transfer' | 'card' | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!token) { setServerValid(false); return; }
        try {
            setQr(jwtDecode<QRPayload>(token));
            api.post('/qr/validate', { token })
                .then((res) => setServerValid(!!res.data?.valid))
                .catch(() => setServerValid(false));
        } catch { setServerValid(false); }
    }, [token]);

    // Derive the trust level. Real signal = server validation of a registered,
    // signed merchant token. Preview overrides for demoing the three states.
    let trust: Trust =
        serverValid === null ? 'loading' : serverValid ? 'verified' : 'blocked';
    if (preview === 'green') trust = 'verified';
    if (preview === 'amber') trust = 'caution';
    if (preview === 'red') trust = 'blocked';

    const business = qr?.businessName || 'this business';
    const mask = (a?: string) => (a && a.length > 4 ? `••${a.slice(-4)}` : a || '');
    // What the account "resolves" to. For a verified destination it matches the
    // business; for the demo mismatch we show a personal name (the classic fraud).
    const resolvedName =
        trust === 'blocked' && preview === 'red' ? 'OKAFOR CHIDINMA J.'
            : trust === 'caution' ? `${business} (unconfirmed)`
                : business;

    const copyAcct = async () => {
        if (!qr) return;
        try { await navigator.clipboard.writeText(qr.accountNumber); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* */ }
    };

    // Per-state presentation.
    const V = {
        verified: {
            band: '#0e7a46', chipBg: 'rgba(120,230,160,.15)', chipFg: '#8ef0b0',
            chip: '✓ Verified destination', ladder: 'Registered account · confirmed with PayVerify',
            head: `You're paying ${business}`,
            body: `This account name matches ${business} on your receipt. Pay with confidence.`,
            canPay: true,
        },
        caution: {
            band: '#8a6400', chipBg: 'rgba(255,196,84,.16)', chipFg: '#ffcf7a',
            chip: '⚠ Couldn’t confirm', ladder: 'Account is valid — but not confirmed as this business',
            head: `This may not be ${business}`,
            body: `The account is valid, but we couldn’t confirm it belongs to ${business}. Check with a staff member before you pay.`,
            canPay: true,
        },
        blocked: {
            band: '#a11', chipBg: 'rgba(255,120,120,.15)', chipFg: '#ff9a9a',
            chip: '⛔ Do not pay', ladder: 'This destination does not match your receipt',
            head: preview === 'red' ? `This account doesn’t match ${business}` : 'We couldn’t verify this QR',
            body: preview === 'red'
                ? `Warning — this account belongs to ${resolvedName}, not ${business}. Do not send money. Ask a staff member.`
                : `We couldn’t confirm this QR with PayVerify. Do not send money until you’ve confirmed the details another way.`,
            canPay: false,
        },
        loading: {
            band: '#334', chipBg: 'rgba(200,215,225,.14)', chipFg: '#cfe0ff',
            chip: 'Checking…', ladder: '', head: 'Checking this account with PayVerify…', body: '', canPay: false,
        },
    }[trust];

    return (
        <div style={page}>
            <div style={brandBar}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>Pay<span style={{ color: '#8fb0ff' }}>Verify</span></span>
                <span style={{ fontSize: 12, opacity: .7 }}>Verify before you pay</span>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 18px' }}>
                {/* Result card */}
                <div style={{ ...card, borderColor: trust === 'blocked' ? 'rgba(255,120,120,.45)' : 'rgba(255,255,255,.12)' }}>
                    <div style={{ ...badge, background: V.chipBg, color: V.chipFg }}>{V.chip}</div>
                    <h2 style={{ margin: '14px 0 4px' }}>{V.head}</h2>
                    {V.body && <p style={{ opacity: .85, margin: 0, fontSize: 14 }}>{V.body}</p>}
                    {V.ladder && (
                        <div style={{ marginTop: 12, fontSize: 12, color: V.chipFg, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: V.chipFg, display: 'inline-block' }} />
                            {V.ladder}
                        </div>
                    )}

                    {qr && trust !== 'loading' && (
                        <div style={destBox}>
                            <Row k="Business on receipt" v={business} />
                            <Row k="Account name" v={resolvedName} strong={trust === 'blocked'} />
                            <Row k="Bank" v={qr.bankName} />
                            <Row k="Account" v={qr.accountNumber} />
                            {qr.amount ? <Row k="Amount" v={`₦${qr.amount.toLocaleString()}`} strong /> : null}
                            {qr.description ? <Row k="For" v={qr.description} /> : null}
                        </div>
                    )}
                </div>

                {/* Pay options — only when we can stand behind the destination */}
                {V.canPay && qr && (
                    <div style={{ ...card, marginTop: 14 }}>
                        {trust === 'caution' && (
                            <div style={{ fontSize: 13, color: '#ffcf7a', marginBottom: 12 }}>
                                Only continue if a staff member confirms this is {business}’s account.
                            </div>
                        )}
                        <div style={{ fontSize: 13, opacity: .7, marginBottom: 12 }}>How would you like to pay?</div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => setMethod('transfer')} style={method === 'transfer' ? payActive : payBtn}>🏦 Bank transfer</button>
                            <button onClick={() => setMethod('card')} style={method === 'card' ? payActive : payBtn}>💳 Card</button>
                        </div>
                        {method === 'transfer' && (
                            <div style={panel}>
                                <p style={{ margin: '0 0 10px', fontSize: 14 }}>Transfer{qr.amount ? <b> ₦{qr.amount.toLocaleString()}</b> : ''} to the account below:</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0f19', borderRadius: 10, padding: '12px 14px' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, letterSpacing: 1 }}>{qr.accountNumber}</div>
                                        <div style={{ fontSize: 12, opacity: .7 }}>{qr.bankName} · {resolvedName}</div>
                                    </div>
                                    <button onClick={copyAcct} style={copyBtn}>{copied ? 'Copied' : 'Copy'}</button>
                                </div>
                            </div>
                        )}
                        {method === 'card' && (
                            <div style={panel}>
                                <p style={{ margin: 0, fontSize: 14 }}>Card checkout{qr.amount ? <> for <b>₦{qr.amount.toLocaleString()}</b></> : ''} settles to {mask(qr.accountNumber)} at {qr.bankName}.</p>
                                <button style={{ ...payActive, width: '100%', marginTop: 12 }}>Continue to card checkout →</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Blocked: no pay path, just the warning + what to do */}
                {trust === 'blocked' && (
                    <div style={{ ...card, marginTop: 14, borderColor: 'rgba(255,120,120,.35)' }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#ff9a9a', marginBottom: 6 }}>What to do</div>
                        <p style={{ margin: 0, fontSize: 13, opacity: .85 }}>
                            Don’t transfer to this account. Ask the cashier to show the official PayVerify QR on your printed receipt, and pay only a <b>Verified destination</b>.
                        </p>
                    </div>
                )}

                <p style={{ textAlign: 'center', fontSize: 12, opacity: .55, marginTop: 16 }}>
                    Never trust account details sent in a message. Always verify on PayVerify first.
                </p>
            </div>
        </div>
    );
};

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <span style={{ opacity: .6, fontSize: 14 }}>{k}</span>
            <span style={{ fontWeight: strong ? 800 : 600, fontSize: 14, textAlign: 'right' }}>{v}</span>
        </div>
    );
}

const page: React.CSSProperties = { minHeight: '100vh', background: 'linear-gradient(180deg,#0b1730,#0a0f19)', color: '#e8f1ff', fontFamily: '-apple-system,Segoe UI,Roboto,Arial,sans-serif' };
const brandBar: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' };
const card: React.CSSProperties = { background: '#0f1b2f', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 20 };
const badge: React.CSSProperties = { display: 'inline-block', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 800, letterSpacing: .3 };
const destBox: React.CSSProperties = { marginTop: 16, background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '4px 14px' };
const payBtn: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#e8f1ff', fontWeight: 700, cursor: 'pointer' };
const payActive: React.CSSProperties = { ...payBtn, background: '#2a7bff', border: '1px solid #2a7bff' };
const panel: React.CSSProperties = { marginTop: 14, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 14 };
const copyBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(143,176,255,.5)', background: 'transparent', color: '#8fb0ff', fontWeight: 700, cursor: 'pointer' };

export default QRVerificationPage;
