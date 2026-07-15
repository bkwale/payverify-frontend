// src/pages/QrVerificationPages.tsx
// -----------------------------------------------------------------------------
// Customer-facing "Verify & Pay" screen.
// A customer scans a merchant's PayVerify QR and lands here. This is NOT the
// merchant surface — no merchant nav. Its whole job: prove the payment
// destination, then let the customer pay by bank transfer or card.
// Uses shared Axios client (services/api) for all requests.
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

const QRVerificationPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();

    const [qrData, setQrData] = useState<QRPayload | null>(null);
    const [valid, setValid] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [method, setMethod] = useState<'transfer' | 'card' | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!token) { setError('No token provided'); setValid(false); return; }
        try {
            const decoded = jwtDecode<QRPayload>(token);
            setQrData(decoded);
            api.post('/qr/validate', { token })
                .then((res) => {
                    if (res.data?.valid) setValid(true);
                    else { setValid(false); setError('This QR is invalid or has expired.'); }
                })
                .catch(() => { setValid(false); setError('We couldn’t verify this QR with PayVerify.'); });
        } catch {
            setError('This QR code isn’t readable.');
            setValid(false);
        }
    }, [token]);

    const copyAccount = async () => {
        if (!qrData) return;
        try { await navigator.clipboard.writeText(qrData.accountNumber); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
    };
    const mask = (acc: string) => acc && acc.length > 4 ? `••${acc.slice(-4)}` : acc;

    return (
        <div style={page}>
            {/* Minimal brand bar — this is the customer's world, not the merchant's */}
            <div style={brandBar}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>Pay<span style={{ color: '#8fb0ff' }}>Verify</span></span>
                <span style={{ fontSize: 12, opacity: .7 }}>Verify before you pay</span>
            </div>

            <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 18px' }}>
                {valid === null && <div style={card}><p style={{ margin: 0 }}>Checking this account with PayVerify…</p></div>}

                {valid === false && (
                    <div style={{ ...card, borderColor: 'rgba(255,120,120,.5)' }}>
                        <div style={{ ...badge, background: 'rgba(255,120,120,.15)', color: '#ff9a9a' }}>⚠ Not verified</div>
                        <h2 style={{ margin: '14px 0 6px' }}>We couldn’t verify this</h2>
                        <p style={{ opacity: .8, margin: 0 }}>{error || 'This QR could not be verified.'} Do not send money until you’ve confirmed the details another way.</p>
                    </div>
                )}

                {valid && qrData && (
                    <>
                        {/* Trust result */}
                        <div style={card}>
                            <div style={{ ...badge, background: 'rgba(120,230,160,.15)', color: '#8ef0b0' }}>✓ Account matches PayVerify records</div>
                            <h2 style={{ margin: '14px 0 4px' }}>You’re paying {qrData.businessName}</h2>
                            <p style={{ opacity: .8, margin: 0, fontSize: 14 }}>
                                This is the account <b>{qrData.businessName}</b> registered with PayVerify. Pay with confidence.
                            </p>

                            {/* Verified destination */}
                            <div style={destBox}>
                                <Row k="Business" v={qrData.businessName} />
                                <Row k="Bank" v={qrData.bankName} />
                                <Row k="Account" v={qrData.accountNumber} />
                                {qrData.amount ? <Row k="Amount" v={`₦${qrData.amount.toLocaleString()}`} bold /> : null}
                                {qrData.description ? <Row k="For" v={qrData.description} /> : null}
                            </div>
                        </div>

                        {/* How would you like to pay */}
                        <div style={{ ...card, marginTop: 14 }}>
                            <div style={{ fontSize: 13, opacity: .7, marginBottom: 12 }}>How would you like to pay?</div>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setMethod('transfer')} style={method === 'transfer' ? payBtnActive : payBtn}>🏦 Bank transfer</button>
                                <button onClick={() => setMethod('card')} style={method === 'card' ? payBtnActive : payBtn}>💳 Card</button>
                            </div>

                            {method === 'transfer' && (
                                <div style={methodPanel}>
                                    <p style={{ margin: '0 0 10px', fontSize: 14 }}>Transfer{qrData.amount ? <b> ₦{qrData.amount.toLocaleString()}</b> : ''} from your banking app to the verified account below:</p>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0a0f19', borderRadius: 10, padding: '12px 14px' }}>
                                        <div>
                                            <div style={{ fontWeight: 700, letterSpacing: 1 }}>{qrData.accountNumber}</div>
                                            <div style={{ fontSize: 12, opacity: .7 }}>{qrData.bankName} · {qrData.businessName}</div>
                                        </div>
                                        <button onClick={copyAccount} style={copyBtn}>{copied ? 'Copied' : 'Copy'}</button>
                                    </div>
                                    <p style={{ margin: '10px 0 0', fontSize: 12, opacity: .6 }}>You are paying {mask(qrData.accountNumber)} — the destination PayVerify verified. No one can swap it after this screen.</p>
                                </div>
                            )}

                            {method === 'card' && (
                                <div style={methodPanel}>
                                    <p style={{ margin: 0, fontSize: 14 }}>
                                        Card checkout{qrData.amount ? <> for <b>₦{qrData.amount.toLocaleString()}</b></> : ''} settles to the same verified account — {mask(qrData.accountNumber)} at {qrData.bankName}.
                                    </p>
                                    <button style={{ ...payBtnActive, width: '100%', marginTop: 12, cursor: 'pointer' }}>Continue to card checkout →</button>
                                    <p style={{ margin: '10px 0 0', fontSize: 12, opacity: .6 }}>Powered by PayVerify · funds route only to the verified destination.</p>
                                </div>
                            )}
                        </div>

                        <p style={{ textAlign: 'center', fontSize: 12, opacity: .55, marginTop: 16 }}>
                            Never trust account details sent in a message. Always verify on PayVerify first.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <span style={{ opacity: .6, fontSize: 14 }}>{k}</span>
            <span style={{ fontWeight: bold ? 800 : 600, fontSize: 14 }}>{v}</span>
        </div>
    );
}

const page: React.CSSProperties = { minHeight: '100vh', background: 'linear-gradient(180deg,#0b1730,#0a0f19)', color: '#e8f1ff', fontFamily: '-apple-system,Segoe UI,Roboto,Arial,sans-serif' };
const brandBar: React.CSSProperties = { display: 'flex', alignItems: 'baseline', gap: 12, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.08)' };
const card: React.CSSProperties = { background: '#0f1b2f', border: '1px solid rgba(255,255,255,.12)', borderRadius: 16, padding: 20 };
const badge: React.CSSProperties = { display: 'inline-block', borderRadius: 999, padding: '5px 12px', fontSize: 12, fontWeight: 800, letterSpacing: .3 };
const destBox: React.CSSProperties = { marginTop: 16, background: 'rgba(255,255,255,.03)', borderRadius: 12, padding: '4px 14px' };
const payBtn: React.CSSProperties = { flex: 1, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,.2)', background: 'transparent', color: '#e8f1ff', fontWeight: 700, cursor: 'pointer' };
const payBtnActive: React.CSSProperties = { ...payBtn, background: '#2a7bff', border: '1px solid #2a7bff' };
const methodPanel: React.CSSProperties = { marginTop: 14, borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 14 };
const copyBtn: React.CSSProperties = { padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(143,176,255,.5)', background: 'transparent', color: '#8fb0ff', fontWeight: 700, cursor: 'pointer' };

export default QRVerificationPage;
