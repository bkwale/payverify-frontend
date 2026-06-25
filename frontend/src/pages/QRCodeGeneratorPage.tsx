import React, { useState } from 'react';
import QRCode from 'qrcode';
import Navbar from '../components/Navbar';

const QRCodeGeneratorPage: React.FC = () => {
    const [qrImageUrl, setQrImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('1000');
    const [reference, setReference] = useState('');

    const generateQR = async () => {
        setLoading(true);
        try {
            let merchantName = 'Merchant';
            try {
                const u = JSON.parse(localStorage.getItem('user') || '{}');
                if (u && u.name) merchantName = u.name;
            } catch {
                /* ignore */
            }
            const ref = reference.trim() || `PV-${Date.now()}`;
            const payUrl =
                `${window.location.origin}/qr-verify` +
                `?merchant=${encodeURIComponent(merchantName)}` +
                `&amount=${encodeURIComponent(amount)}` +
                `&ref=${encodeURIComponent(ref)}`;
            const dataUrl = await QRCode.toDataURL(payUrl, { width: 256, margin: 2 });
            setQrImageUrl(dataUrl);
        } catch (err) {
            console.error(err);
            alert('Failed to generate QR code');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="container mt-4">
                <h2>Generate Payment QR Code</h2>
                <p>Enter an amount and reference, then generate a scannable QR code.</p>
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
                {qrImageUrl && (
                    <div className="mt-4">
                        <h4>QR Code:</h4>
                        <img src={qrImageUrl} alt="Payment QR Code" />
                        <div className="mt-2">
                            <a className="btn btn-success" href={qrImageUrl} download="payverify-qr.png">Download</a>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default QRCodeGeneratorPage;
