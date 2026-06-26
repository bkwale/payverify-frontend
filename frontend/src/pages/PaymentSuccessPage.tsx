import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';

const PaymentSuccessPage: React.FC = () => {
    const [params] = useSearchParams();
    const reference = params.get('reference') || params.get('trxref') || '';
    return (
        <div className="container mt-5">
            <div className="card mx-auto text-center" style={{ maxWidth: 480 }}>
                <div className="card-body">
                    <h2 className="text-success">Payment received</h2>
                    <p>Thank you - your payment was completed successfully.</p>
                    {reference && <p className="text-muted mb-3">Reference: <code>{reference}</code></p>}
                    <Link to="/dashboard" className="btn btn-primary">Go to dashboard</Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;
