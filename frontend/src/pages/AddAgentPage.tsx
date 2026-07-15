// Team — staff/agents under the logged-in merchant.
// List-first: default view is the roster; "+ Add teammate" opens a modal;
// clicking a row opens a detail drawer. (Route stays /add-agent.)
import { useEffect, useState } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';

type Agent = { id: number; email: string; name?: string | null; phone?: string | null; role: string };

export default function AddAgentPage() {
    const token = localStorage.getItem('token');
    const [merchantId, setMerchantId] = useState<number | null>(null);
    const [merchantName, setMerchantName] = useState<string>('');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAdd, setShowAdd] = useState(false);          // add modal
    const [selected, setSelected] = useState<Agent | null>(null); // detail drawer

    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'agent' });
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const loadMerchant = async () => {
        try {
            const res = await api.get('/merchants?scope=self', auth);
            const m = (res.data || [])[0];
            if (m) { setMerchantId(m.id); setMerchantName(m.name); await loadAgents(m.id); }
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };
    const loadAgents = async (mid: number) => {
        try { const r = await api.get(`/merchants/${mid}/agents`, auth); setAgents(r.data?.agents || []); }
        catch { setAgents([]); }
    };
    useEffect(() => { loadMerchant(); /* eslint-disable-next-line */ }, []);

    const up = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(s => ({ ...s, [k]: e.target.value }));

    const openAdd = () => { setErr(null); setMsg(null); setForm({ name: '', email: '', phone: '', password: '', role: 'agent' }); setShowAdd(true); };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setErr(null); setMsg(null);
        if (!merchantId) { setErr('No business found for your account. Add a business first.'); return; }
        if (!form.name.trim()) { setErr('Name is required.'); return; }
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { setErr('Valid email is required.'); return; }
        if (!form.phone.trim()) { setErr('Phone number is required.'); return; }
        if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
        try {
            setBusy(true);
            await api.post(`/merchants/${merchantId}/agents`, {
                name: form.name.trim(), email: form.email.trim(),
                phone: form.phone.trim(), password: form.password, role: form.role,
            }, auth);
            setMsg(`${form.name.trim()} added to ${merchantName}.`);
            setShowAdd(false);
            await loadAgents(merchantId);
        } catch (e: any) {
            setErr(e?.response?.data?.message || 'Failed to add teammate.');
        } finally { setBusy(false); }
    };

    const initials = (a: Agent) =>
        (a.name || a.email || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

    return (
        <>
        <Navbar />
        <div style={{ maxWidth: 860, margin: '32px auto', padding: '0 20px', color: '#e8f1ff' }}>
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                    <h1 style={{ margin: 0 }}>Team</h1>
                    <p style={{ opacity: .75, margin: '4px 0 0' }}>
                        Staff and agents under {merchantName ? <b>{merchantName}</b> : 'your business'}. Each teammate logs in with their own email and password.
                    </p>
                </div>
                <button onClick={openAdd} style={btnPrimary}>+ Add teammate</button>
            </div>

            {msg && <div style={{ color: '#8ef0b0', marginTop: 14 }}>{msg}</div>}

            {/* Roster */}
            <div style={{ marginTop: 20, background: '#0f1b2f', borderRadius: 14, border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,.08)', fontSize: 13, opacity: .7 }}>
                    {loading ? 'Loading…' : `${agents.length} ${agents.length === 1 ? 'teammate' : 'teammates'}`}
                </div>

                {!loading && agents.length === 0 && (
                    <div style={{ padding: '40px 18px', textAlign: 'center' }}>
                        <div style={{ fontSize: 15, marginBottom: 6 }}>No teammates yet</div>
                        <div style={{ opacity: .65, fontSize: 13, marginBottom: 16 }}>Add cashiers, agents or managers so every payment stays attributable.</div>
                        <button onClick={openAdd} style={btnPrimary}>+ Add your first teammate</button>
                    </div>
                )}

                {agents.map(a => (
                    <button
                        key={a.id}
                        onClick={() => setSelected(a)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left',
                            padding: '14px 18px', background: 'transparent', border: 'none',
                            borderBottom: '1px solid rgba(255,255,255,.06)', color: '#e8f1ff', cursor: 'pointer',
                        }}
                    >
                        <span style={avatar}>{initials(a)}</span>
                        <span style={{ flex: 1 }}>
                            <span style={{ display: 'block', fontWeight: 600 }}>{a.name || '—'}</span>
                            <span style={{ display: 'block', fontSize: 13, opacity: .7 }}>{a.email}</span>
                        </span>
                        <span style={rolePill}>{a.role}</span>
                        <span style={{ opacity: .5, fontSize: 18 }}>›</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Add teammate modal */}
        {showAdd && (
            <div style={overlay} onClick={() => !busy && setShowAdd(false)}>
                <div style={sheet} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <h3 style={{ margin: 0 }}>Add teammate</h3>
                        <button onClick={() => !busy && setShowAdd(false)} style={xBtn} aria-label="Close">×</button>
                    </div>
                    <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
                        <label>Full name<input value={form.name} onChange={up('name')} placeholder="Teammate full name" style={inp} /></label>
                        <label>Email<input value={form.email} onChange={up('email')} placeholder="teammate@business.com" style={inp} /></label>
                        <label>Phone<input value={form.phone} onChange={up('phone')} placeholder="0803 000 0000" style={inp} /></label>
                        <label>Password<input type="password" value={form.password} onChange={up('password')} placeholder="Set a password (min 6)" style={inp} /></label>
                        <label>Role
                            <select value={form.role} onChange={up('role')} style={inp}>
                                <option value="agent">Agent</option>
                                <option value="cashier">Cashier</option>
                                <option value="manager">Manager</option>
                            </select>
                        </label>
                        {err && <div style={{ color: '#ff9a9a' }}>{err}</div>}
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                            <button type="button" onClick={() => !busy && setShowAdd(false)} style={btnGhost}>Cancel</button>
                            <button disabled={busy} style={btnPrimary}>{busy ? 'Adding…' : 'Add teammate'}</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Detail drawer */}
        {selected && (
            <div style={overlay} onClick={() => setSelected(null)}>
                <div style={sheet} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                        <h3 style={{ margin: 0 }}>Teammate</h3>
                        <button onClick={() => setSelected(null)} style={xBtn} aria-label="Close">×</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                        <span style={{ ...avatar, width: 52, height: 52, fontSize: 18 }}>{initials(selected)}</span>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 700 }}>{selected.name || '—'}</div>
                            <span style={rolePill}>{selected.role}</span>
                        </div>
                    </div>
                    <Row label="Email" value={selected.email} />
                    <Row label="Phone" value={selected.phone || '—'} />
                    <Row label="Role" value={selected.role} />
                    <Row label="Business" value={merchantName || '—'} />
                    <p style={{ opacity: .55, fontSize: 12, marginTop: 16 }}>
                        Transactions collected by this teammate will be attributed to them (coming next).
                    </p>
                </div>
            </div>
        )}
        </>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <span style={{ opacity: .6 }}>{label}</span>
            <span style={{ fontWeight: 600 }}>{value}</span>
        </div>
    );
}

const inp: React.CSSProperties = { display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: '#0a0f19', color: '#e8f1ff' };
const btnPrimary: React.CSSProperties = { padding: '10px 18px', borderRadius: 999, border: 'none', background: '#2a7bff', color: '#fff', fontWeight: 700, cursor: 'pointer' };
const btnGhost: React.CSSProperties = { padding: '10px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,.25)', background: 'transparent', color: '#e8f1ff', fontWeight: 600, cursor: 'pointer' };
const xBtn: React.CSSProperties = { background: 'transparent', border: 'none', color: '#e8f1ff', fontSize: 24, lineHeight: 1, cursor: 'pointer' };
const avatar: React.CSSProperties = { width: 40, height: 40, borderRadius: '50%', background: 'rgba(143,176,255,.2)', color: '#8fb0ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 };
const rolePill: React.CSSProperties = { background: 'rgba(143,176,255,.18)', color: '#8fb0ff', borderRadius: 999, padding: '3px 12px', fontWeight: 700, fontSize: 12, textTransform: 'capitalize' };
const overlay: React.CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(3,8,18,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 1000 };
const sheet: React.CSSProperties = { width: '100%', maxWidth: 460, background: '#0f1b2f', borderRadius: 16, border: '1px solid rgba(255,255,255,.14)', padding: 22, color: '#e8f1ff', boxShadow: '0 20px 60px rgba(0,0,0,.5)' };
