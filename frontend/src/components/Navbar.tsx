// src/components/Navbar.tsx

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

/**
 * Responsive Navbar with active link highlighting, logout modal,
 * and a persistent context header ("Signed in as [Business] · Merchant")
 * so the merchant always knows whose view they are in.
 */
const Navbar = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation(); // 🚀 Get current path for active highlighting
    const [showModal, setShowModal] = useState(false);
    const [businessName, setBusinessName] = useState<string>('');

    // Load the signed-in merchant's business name for the context header.
    useEffect(() => {
        let cancelled = false;
        const token = localStorage.getItem('token');
        if (!token) return;
        (async () => {
            try {
                const res = await api.get('/merchants?scope=self', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const m = (res.data || [])[0];
                if (!cancelled && m?.name) setBusinessName(m.name);
            } catch {
                /* header falls back to name/email */
            }
        })();
        return () => { cancelled = true; };
    }, [user?.id]);

    // 🚪 Logout and redirect
    const handleLogout = async () => {
        try {
            await logout();
            setShowModal(false);
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    };

    // 🧠 Utility to highlight active link
    const isActive = (path: string) => location.pathname === path ? 'nav-link active' : 'nav-link';

    // Whose view is this? Label the role in plain words.
    const roleLabel =
        user?.role === 'admin' ? 'Admin'
            : user?.role === 'agent' ? 'Agent'
                : 'Merchant';
    const contextName = businessName || user?.name || user?.email || 'your business';

    return (
        <>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">PayVerify</Link>

                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        <li className="nav-item">
                            <Link className={isActive('/dashboard')} to="/dashboard">Dashboard</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={isActive('/transactions')} to="/transactions">Transactions</Link>
                        </li>
                        {user?.role === 'admin' && (
                            <li className="nav-item">
                                <Link className={isActive('/admin-transactions')} to="/admin-transactions">Admin Transactions</Link>
                            </li>
                        )}
                        <li className="nav-item">
                            <Link className={isActive('/qr-generator')} to="/qr-generator">Payment QR</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={isActive('/add-agent')} to="/add-agent">Team</Link>
                        </li>
                        <li className="nav-item">
                            <Link className={isActive('/register')} to="/register">Add a business</Link>
                        </li>
                    </ul>

                    <span className="navbar-text text-white me-3">{user?.email}</span>
                    <button className="btn btn-outline-light btn-sm" onClick={() => setShowModal(true)}>
                        Logout
                    </button>
                </div>
            </div>

            {/* 🔒 Logout Confirmation Modal */}
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-container">
                        <div className="modal-content">
                            <h5>Confirm Logout</h5>
                            <p>Are you sure you want to log out?</p>
                            <div className="modal-actions">
                                <button className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button className="btn btn-danger" onClick={handleLogout}>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>

        {/* 📍 Persistent context header — always tells you whose view you're in */}
        <div
            style={{
                background: '#0b1730',
                borderBottom: '1px solid rgba(255,255,255,.08)',
                color: '#cfe0ff',
                fontSize: 13,
                padding: '7px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
            }}
        >
            <span style={{ opacity: .7 }}>Signed in as</span>
            <b style={{ color: '#ffffff' }}>{contextName}</b>
            <span style={{ opacity: .5 }}>·</span>
            <span
                style={{
                    background: 'rgba(143,176,255,.18)',
                    color: '#8fb0ff',
                    borderRadius: 999,
                    padding: '2px 10px',
                    fontWeight: 700,
                    fontSize: 12,
                }}
            >
                {roleLabel}
            </span>
        </div>
        </>
    );
};

export default Navbar;
