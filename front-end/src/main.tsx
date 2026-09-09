import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { api, ApiError, Stats, Submission, Widget, WidgetType } from './api';
import './styles.css';

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : '—';
}

function widgetTypeLabel(type: WidgetType) {
  return type === 'signup' ? 'Formulário de cadastro' : 'Popover';
}

function locationLabel(lead: Submission) {
  if (lead.geo_data?.city || lead.geo_data?.country) return `${lead.geo_data.city || 'Cidade desconhecida'}${lead.geo_data.country ? `, ${lead.geo_data.country}` : ''}`;
  if (lead.ip_address === '::1' || lead.ip_address === '127.0.0.1') return 'Ambiente local (sem geolocalização)';
  return 'Indisponível';
}

const settingsExamples = {
  basic: JSON.stringify({
    buttonText: 'Enviar',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true }
    ]
  }, null, 2),
  contact: JSON.stringify({
    buttonText: 'Quero receber contato',
    fields: [
      { name: 'name', label: 'Nome completo', type: 'text', required: true },
      { name: 'email', label: 'E-mail', type: 'email', required: true },
      { name: 'phone', label: 'Telefone', type: 'tel', required: false },
      { name: 'company', label: 'Empresa', type: 'text', required: false }
    ]
  }, null, 2)
};

function Login({ onLogin }: { onLogin: () => void }) {
  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (registerMode) await api.register(email, password);
      const result = await api.login(email, password);
      sessionStorage.setItem('flyrank_token', result.token); onLogin();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível autenticar.'); }
    finally { setBusy(false); }
  }

  return <main className="auth-page"><section className="auth-card">
    <div className="brand"><span className="brand-mark">F</span><span>FlyRank</span></div>
    <h1>{registerMode ? 'Crie sua conta' : 'Bem-vindo de volta'}</h1>
    <p className="muted">Gerencie seus widgets e acompanhe os leads capturados.</p>
    <form onSubmit={submit} className="stack">
      <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
      <label>Senha<input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></label>
      {error && <div className="alert error">{error}</div>}
      <button disabled={busy}>{busy ? 'Aguarde…' : registerMode ? 'Criar conta' : 'Entrar'}</button>
    </form>
    <button className="link-button" onClick={() => { setRegisterMode(!registerMode); setError(''); }}>
      {registerMode ? 'Já tem uma conta? Entrar' : 'Ainda não tem conta? Cadastre-se'}
    </button>
  </section></main>;
}

function WidgetForm({ initial, onSave, onCancel }: { initial?: Widget; onSave: (widget: Widget) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title || '');
  const [type, setType] = useState<WidgetType>(initial?.type || 'signup');
  const [settings, setSettings] = useState(JSON.stringify(initial?.settings || {}, null, 2));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError('');
    let parsedSettings: Record<string, unknown>;
    try { parsedSettings = JSON.parse(settings); } catch { setError('Settings must be valid JSON.'); return; }
    if (!parsedSettings || Array.isArray(parsedSettings)) { setError('Settings must be a JSON object.'); return; }
    setBusy(true);
    try {
      const saved = initial ? await api.updateWidget(initial.id, { title, type, settings: parsedSettings }) : await api.createWidget({ title, type, settings: parsedSettings });
      onSave(saved);
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível salvar o widget.'); }
    finally { setBusy(false); }
  }

  return <form onSubmit={submit} className="panel stack form-panel">
    <div className="panel-heading"><div><h2>{initial ? 'Editar widget' : 'Novo widget'}</h2><p className="muted">Configure o widget público e seu código de incorporação.</p></div></div>
    <label>Título<input value={title} onChange={e => setTitle(e.target.value)} maxLength={255} required /></label>
    <label>Tipo<select value={type} onChange={e => setType(e.target.value as WidgetType)}><option value="signup">Formulário de cadastro</option><option value="popover">Popover</option></select></label>
    <div className="settings-help"><div className="settings-help-heading"><div><strong>Configurações disponíveis</strong><p>Use os exemplos abaixo ou edite o JSON manualmente.</p></div><span className="settings-badge">JSON</span></div><div className="settings-options"><button type="button" className="secondary small" onClick={() => setSettings(settingsExamples.basic)}>Nome e e-mail</button><button type="button" className="secondary small" onClick={() => setSettings(settingsExamples.contact)}>Formulário de contato</button></div><ul><li><code>buttonText</code>: texto do botão de envio.</li><li><code>fields</code>: campos exibidos no formulário.</li><li>Cada campo aceita <code>name</code>, <code>label</code>, <code>type</code> (<code>text</code>, <code>email</code>, <code>tel</code>, <code>number</code> ou <code>url</code>) e <code>required</code>.</li></ul></div>
    <label>Configurações JSON<textarea rows={9} value={settings} onChange={e => setSettings(e.target.value)} /></label>
    {error && <div className="alert error">{error}</div>}
    <div className="actions"><button type="button" className="secondary" onClick={onCancel}>Cancelar</button><button disabled={busy}>{busy ? 'Salvando…' : 'Salvar widget'}</button></div>
  </form>;
}

function WidgetCard({ widget, onEdit, onDelete, onView }: { widget: Widget; onEdit: () => void; onDelete: () => void; onView: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(widget.embed_snippet); setCopied(true); setTimeout(() => setCopied(false), 1500); }
  return <article className="widget-card">
    <div className="card-top"><div><span className="eyebrow">{widgetTypeLabel(widget.type)}</span><h3>{widget.title}</h3></div><span className="status">Ativo</span></div>
    <div className="snippet-row"><p className="snippet">{widget.embed_snippet}</p><button className="secondary small copy-button" onClick={copy}>{copied ? 'Copiado!' : 'Copiar script'}</button></div>
    <div className="actions"><button className="secondary small" onClick={onView}>Ver leads</button><button className="ghost small" onClick={onEdit}>Editar</button><button className="danger small" onClick={onDelete}>Excluir</button></div>
  </article>;
}

function WidgetDetails({ widget, onBack }: { widget: Widget; onBack: () => void }) {
  const [tab, setTab] = useState<'leads' | 'stats'>('leads');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { Promise.all([api.listSubmissions(widget.id), api.getStats(widget.id)]).then(([leads, metrics]) => { setSubmissions(leads); setStats(metrics); }).catch(err => setError(err.message)); }, [widget.id]);
  return <section className="panel">
    <div className="panel-heading"><div><button className="back" onClick={onBack}>← Voltar para widgets</button><h2>{widget.title}</h2></div><span className="eyebrow">{widgetTypeLabel(widget.type)}</span></div>
    <div className="tabs"><button className={tab === 'leads' ? 'active' : ''} onClick={() => setTab('leads')}>Leads ({submissions.length})</button><button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>Estatísticas</button></div>
    {error && <div className="alert error">{error}</div>}
    {tab === 'stats' && <div className="stats-grid"><div className="metric"><span>Total de envios</span><strong>{stats?.total_submissions ?? '—'}</strong></div><div className="metric"><span>Localizações</span><strong>{stats?.locations.length ?? '—'}</strong></div><div className="location-list">{stats?.locations.map((location, index) => <div key={`${location.country}-${location.city}-${index}`}><span>{location.city || 'Cidade desconhecida'}, {location.country || 'País desconhecido'}</span><strong>{location.count}</strong></div>)}</div></div>}
    {tab === 'leads' && <div className="table-wrap">{submissions.length === 0 ? <p className="empty">Ainda não há leads capturados.</p> : <table><thead><tr><th>Recebido em</th><th>Dados de contato</th><th>Localização</th><th>Endereço IP</th></tr></thead><tbody>{submissions.map(lead => <tr key={lead.id}><td>{formatDate(lead.created_at)}</td><td>{Object.entries(lead.data).filter(([key]) => key !== 'address_line_2').map(([key, value]) => <div key={key}><b>{key}:</b> {String(value)}</div>)}</td><td>{locationLabel(lead)}</td><td>{lead.ip_address || '—'}</td></tr>)}</tbody></table>}</div>}
  </section>;
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selected, setSelected] = useState<Widget | null>(null);
  const [editing, setEditing] = useState<Widget | undefined>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { api.listWidgets().then(setWidgets).catch(err => { if (err instanceof ApiError && err.status === 401) onLogout(); else setError(err.message); }); }, [onLogout]);
  async function remove(widget: Widget) { if (!confirm(`Excluir “${widget.title}”?`)) return; try { await api.deleteWidget(widget.id); setWidgets(items => items.filter(item => item.id !== widget.id)); } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível excluir o widget.'); } }
  function saved(widget: Widget) { setWidgets(items => items.some(item => item.id === widget.id) ? items.map(item => item.id === widget.id ? widget : item) : [widget, ...items]); setCreating(false); setEditing(undefined); }
  return <div className="app-shell"><header className="topbar"><div className="brand"><span className="brand-mark">F</span><span>FlyRank <small>Painel</small></span></div><button className="ghost" onClick={onLogout}>Sair</button></header><main className="content">
    {selected ? <WidgetDetails widget={selected} onBack={() => setSelected(null)} /> : creating || editing ? <WidgetForm initial={editing} onSave={saved} onCancel={() => { setCreating(false); setEditing(undefined); }} /> : <><div className="page-heading"><div><p className="eyebrow">Área de trabalho</p><h1>Seus widgets</h1><p className="muted">Crie, incorpore e acompanhe suas experiências de captura de leads.</p></div><button onClick={() => setCreating(true)}>+ Novo widget</button></div>{error && <div className="alert error">{error}</div>}{widgets.length === 0 ? <div className="panel empty"><h2>Nenhum widget ainda</h2><p>Crie seu primeiro widget para começar a capturar leads.</p><button onClick={() => setCreating(true)}>Criar widget</button></div> : <div className="widget-grid">{widgets.map(widget => <WidgetCard key={widget.id} widget={widget} onEdit={() => setEditing(widget)} onDelete={() => remove(widget)} onView={() => setSelected(widget)} />)}</div>}</>}
  </main></div>;
}

function App() {
  const [authenticated, setAuthenticated] = useState(Boolean(sessionStorage.getItem('flyrank_token')));
  function logout() { sessionStorage.removeItem('flyrank_token'); setAuthenticated(false); }
  return authenticated ? <Dashboard onLogout={logout} /> : <Login onLogin={() => setAuthenticated(true)} />;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
