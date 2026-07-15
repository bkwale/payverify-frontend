import React, { useState } from 'react';
import QRCode from 'qrcode';
import Navbar from '../components/Navbar';
import api from '../services/api';

// Generates a PayVerify *payment* QR. The QR encodes the backend-signed
// verification link (/verify/:token) so a customer who scans it lands on the
// Verify & Pay screen showing the merchant's verified account — not a raw,
// unverifiable page. The token is minted server-side (POST /qr/regenerate).
const QRCodeGeneratorPage: React.FC = () => {
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
    const [payUrl, setPayUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [amount, setAmount] = useState('1000');
    const [reference, setReference] = useState('');

    const generateQR = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const auth = { headers: { Authorization: `Bearer ${token}` } };

            // 1) Find the signed-in merchant.
            const mRes = await api.get('/merchants?scope=self', auth);
            const merchant = (mRes.data || [])[0];
            if (!merchant?.id) {
                setError('No business found for your account. Add a business first.');
                return;
            }

            // 2) Mint a fresh, server-signed verification token for this amount.
            const ref = reference.trim() || `PV-${Date.now()}`;
            const gRes = await api.post(
                `/qr/regenerate/${merchant.id}`,
                { amount: Number(amount) || undefined, description: ref },
                auth
            );

            // 3) Prefer the backend's verifyUrl; otherwise build it from the token.
            const verifyUrl: string =
                gRes.data?.verifyUrl ||
                (gRes.data?.token ? `${window.location.origin}/verify/${gRes.data.token}` : '');
            if (!verifyUrl) {
                setError('Could not generate a verifiable QR. Please try again.');
                return;
            }

            const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 256, margin: 2 });
            setQrImageUrl(dataUrl);
            setPayUrl(verifyUrl);
        } catch (err: any) {
            console.error(err);
            setError(err?.response?.data?.message || 'Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <h2>Generate Payment QR Code</h2>
                <p>Enter an amount and reference, then generate a scannable QR. When a customer scans it, they see your <strong>verified</strong> account before they pay.</p>
                <div className="row g-2" style={{ maxWidth: 460 }}>
                    <div className="col">
                        <label className="form-label">Amount (NGN)</label>
                        <input className="form-control" type="number" value={amount}
                            onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <div className="col">
                        <label className="form-label">Reference (optional)</label>
                        <input className="form-control" type="text" value={reference}
                            placeholder="auto-generated" onChange={(e) => setReference(e.target.value)} />
                    </div>
                </div>
                <button className="btn btn-primary mt-3" onClick={generateQR} disabled={loading}>
                    {loading ? 'Generating…' : 'Generate QR Code'}
                </button>
                {error && <div className="alert alert-danger mt-3" style={{ maxWidth: 460 }}>{error}</div>}
                {qrImageUrl && (
                    <div className="mt-4">
                        <h4>QR Code:</h4>
                        <img src={qrImageUrl} alt="Payment QR Code" />
                        <p className="text-muted mt-2" style={{ maxWidth: 340, fontSize: 13 }}>
                            Scanning this opens the PayVerify Verify &amp; Pay screen for your account.
                        </p>
                        <div className="mt-2">
                            <a className="btn btn-success" href={qrImageUrl} download="payverify-qr.png">Download</a>
                            {payUrl && (
                                <a className="btn btn-outline-secondary ms-2" href={payUrl} target="_blank" rel="noreferrer">Preview pay page</a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default QRCodeGeneratorPage;
