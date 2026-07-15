// Add Agent (sub-user under the logged-in merchant)
import { useEffect, useState } from 'react';
import api from '../services/api';

type Agent = { id: number; email: string; name?: string | null; phone?: string | null; role: string };

export default function AddAgentPage() {
    const token = localStorage.getItem('token');
    const [merchantId, setMerchantId] = useState<number | null>(null);
    const [merchantName, setMerchantName] = useState<string>('');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'agent' });
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const auth = { headers: { Authorization: `Bearer ${token}` } };

    const loadMerchant = async () => {
        try {
            const res = await api.get('/merchants?scope=self', auth);
            const m = (res.data || [])[0];
            if (m) { setMerchantId(m.id); setMerchantName(m.name); loadAgents(m.id); }
        } catch { /* ignore */ }
    };
    const loadAgents = async (mid: number) => {
        try { const r = await api.get(`/merchants/${mid}/agents`, auth); setAgents(r.data?.agents || []); }
        catch { setAgents([]); }
    };
    useEffect(() => { loadMerchant(); /* eslint-disable-next-line */ }, []);

    const up = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm(s => ({ ...s, [k]: e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault(); setErr(null); setMsg(null);
        if (!merchantId) { setErr('No merchant found for your account. Register a merchant first.'); return; }
        if (!form.name.trim()) { setErr('Agent name is required.'); return; }
        if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { setErr('Valid email is required.'); return; }
        if (!form.phone.trim()) { setErr('Phone number is required.'); return; }
        if (form.password.length < 6) { setErr('Password must be at least 6 characters.'); return; }
        try {
            setBusy(true);
            await api.post(`/merchants/${merchantId}/agents`, {
                name: form.name.trim(), email: form.email.trim(),
                phone: form.phone.trim(), password: form.password, role: form.role,
            }, auth);
            setMsg(`Agent "${form.name.trim()}" added under ${merchantName}.`);
            setForm({ name: '', email: '', phone: '', password: '', role: 'agent' });
            loadAgents(merchantId);
        } catch (e: any) {
            setErr(e?.response?.data?.message || 'Failed to add agent.');
        } finally { setBusy(false); }
    };

    return (
        <div style={{ maxWidth: 720, margin: '40px auto', padding: '0 20px', color: '#e8f1ff' }}>
            <h1 style={{ marginBottom: 4 }}>Add Agent</h1>
            <p style={{ opacity: .8, marginTop: 0 }}>
                Create a staff/agent account under {merchantName ? <b>{merchantName}</b> : 'your merchant'}. Agents log in with their own email and password.
            </p>
            <form onSubmit={submit} style={{ display: 'grid', gap: 12, background: '#0f1b2f', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,.12)' }}>
                <label>Full Name<input value={form.name} onChange={up('name')} placeholder="Agent full name" style={inp} /></label>
                <label>Email<input value={form.email} onChange={up('email')} placeholder="agent@business.com" style={inp} /></label>
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
                {msg && <div style={{ color: '#8ef0b0' }}>{msg}</div>}
                <button disabled={busy} style={btn}>{busy ? 'Adding…' : 'Add Agent'}</button>
            </form>

            <h3 style={{ marginTop: 28 }}>Agents ({agents.length})</h3>
            {agents.length === 0 ? <p style={{ opacity: .7 }}>No agents yet.</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{ textAlign: 'left', opacity: .7 }}><th>Name</th><th>Email</th><th>Phone</th><th>Role</th></tr></thead>
                    <tbody>{agents.map(a => (
                        <tr key={a.id} style={{ borderTop: '1px solid rgba(255,255,255,.1)' }}>
                            <td>{a.name || '—'}</td><td>{a.email}</td><td>{a.phone || '—'}</td><td>{a.role}</td>
                        </tr>
                    ))}</tbody>
                </table>
            )}
        </div>
    );
}
const inp: React.CSSProperties = { display: 'block', width: '100%', marginTop: 4, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,.2)', background: '#0a0f19', color: '#e8f1ff' };
const btn: React.CSSProperties = { padding: '12px', borderRadius: 999, border: 'none', background: '#2a7bff', color: '#fff', fontWeight: 700, cursor: 'pointer' };
