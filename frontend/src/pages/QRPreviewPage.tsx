import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

/**
 * QRPreviewPage
 * ---------------------------------------
 * Allows manual input of a QR token for verification preview.
 * SRP: Standalone page for previewing QR token decoding.
 * DRY: Delegates decoding/validation to `/verify/:token` route.
 */
const QRPreviewPage: React.FC = () => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    /**
     * Navigate to /verify/:token if token is valid
     */
    const handleVerify = () => {
        if (!token.trim()) {
            setError('Please paste a token.');
            return;
        }
        setError('');
        navigate(`/verify/${token}`);
    };

    return (
        <>
            <Navbar />
            <div className="container mt-5">
                <h2>Verify a Merchant QR</h2>
                <p className="text-muted">Paste the token from a merchant&rsquo;s PayVerify verification QR (or the <code>/verify/&hellip;</code> link they shared). Every verified merchant is issued this token when they register &mdash; we&rsquo;ll confirm the business identity and show the verified account details.</p>

                <div className="mb-3">
                    <label htmlFor="tokenInput" className="form-label">Merchant QR Token</label>
                    <textarea
                        id="tokenInput"
                        className="form-control"
                        rows={4}
                        placeholder="Paste the token from the merchant\u2019s PayVerify QR / verify link"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                </div>

                {error && <div className="alert alert-danger">{error}</div>}

                <button className="btn btn-primary" onClick={handleVerify}>
                    Verify QR Code
                </button>
            </div>
        </>
    );
};

export default QRPreviewPage;
