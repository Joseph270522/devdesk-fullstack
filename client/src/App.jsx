import { useEffect, useMemo, useState } from 'react';
import { Activity, Boxes, CheckCircle2, CircleHelp, ClipboardList, LayoutDashboard, LogOut, Plus, Search, ShieldCheck, Wrench } from 'lucide-react';
import { api } from './api';

const initialForm = { title: '', description: '', category: 'Hardware', priority: 'Medium' };
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('devdesk_token'));
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [page, setPage] = useState('Overview');
  const [summary, setSummary] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [assets, setAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [ticketForm, setTicketForm] = useState(initialForm);
  const [assetForm, setAssetForm] = useState({ asset_tag: '', name: '', category: 'Laptop', condition: 'Good' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function loadData() {
    const [me, dashboard, ticketData, assetData] = await Promise.all([
      api('/auth/me'), api('/dashboard/summary'), api('/tickets'), api('/assets')
    ]);
    setUser(me.user); setSummary(dashboard); setTickets(ticketData.tickets); setAssets(assetData.assets);
  }
  useEffect(() => {
    if (token) loadData().catch((e) => { setMessage(e.message); localStorage.removeItem('devdesk_token'); setToken(null); setUser(null); });
  }, [token]);

  async function handleAuth(e) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = await api(`/auth/${authMode === 'login' ? 'login' : 'register'}`, { method: 'POST', body: JSON.stringify(authForm) });
      localStorage.setItem('devdesk_token', result.token); setToken(result.token); setUser(result.user);
    } catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }
  function logout() { localStorage.removeItem('devdesk_token'); setToken(null); setUser(null); setSummary(null); setMessage(''); }
  async function createTicket(e) {
    e.preventDefault(); setBusy(true);
    try { await api('/tickets', { method: 'POST', body: JSON.stringify(ticketForm) }); setTicketForm(initialForm); setShowCreate(false); await loadData(); setMessage('Ticket created successfully.'); }
    catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function createAsset(e) {
    e.preventDefault(); setBusy(true);
    try { await api('/assets', { method: 'POST', body: JSON.stringify(assetForm) }); setAssetForm({ asset_tag: '', name: '', category: 'Laptop', condition: 'Good' }); await loadData(); setMessage('Asset created successfully.'); }
    catch (e) { setMessage(e.message); } finally { setBusy(false); }
  }
  async function updateStatus(id, status) {
    try { await api(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); await loadData(); }
    catch (e) { setMessage(e.message); }
  }

  const filteredTickets = useMemo(() => tickets.filter(t =>
    `${t.title} ${t.description} ${t.requester_name || ''}`.toLowerCase().includes(search.toLowerCase()) &&
    (!statusFilter || t.status === statusFilter)
  ), [tickets, search, statusFilter]);

  if (!token || !user) return <main className="auth-screen">
    <section className="auth-card">
      <div className="brand-mark"><Wrench size={24}/></div>
      <p className="eyebrow">IT OPERATIONS PLATFORM</p>
      <h1>DevDesk<span>.</span></h1>
      <p className="muted">One workspace for support, assets, and service delivery.</p>
      <form onSubmit={handleAuth} className="stack-form">
        {authMode === 'register' && <label>Full name<input required minLength="2" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} placeholder="Your name"/></label>}
        <label>Email address<input type="email" required value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} placeholder="you@example.com"/></label>
        <label>Password<input type="password" required minLength={authMode==='register'?8:1} value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} placeholder={authMode==='register'?'At least 8 characters':'Your password'}/></label>
        <button className="primary full" disabled={busy}>{busy?'Please wait…':authMode==='login'?'Sign in':'Create account'}</button>
      </form>
      {message && <p className="notice">{message}</p>}
      <p className="switch-auth">{authMode==='login'?'New to DevDesk?':'Already have an account?'} <button className="link-button" onClick={()=>{setAuthMode(authMode==='login'?'register':'login');setMessage('')}}>{authMode==='login'?'Create account':'Sign in'}</button></p>
      <p className="tiny">Portfolio demo · React · Express · PostgreSQL</p>
    </section>
  </main>;

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark small"><Wrench size={18}/></div><div><strong>DevDesk<span>.</span></strong><small>IT SERVICE MANAGEMENT</small></div></div>
      <p className="nav-label">WORKSPACE</p>
      <nav>
        {[['Overview',LayoutDashboard],['Tickets',ClipboardList],['Assets',Boxes]].map(([label,Icon])=><button key={label} className={`nav-item ${page===label?'active':''}`} onClick={()=>{setPage(label);setMessage('')}}><Icon size={18}/>{label}{label==='Tickets'&&<span className="nav-count">{summary?.tickets?.open||0}</span>}</button>)}
      </nav>
      <div className="sidebar-bottom"><div className="status-dot"></div><div><strong>Systems operational</strong><small>API workspace</small></div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div><p className="eyebrow">WORKSPACE / {page.toUpperCase()}</p><h2>{page==='Overview'?'Good to see you, '+user.name.split(' ')[0]:page}</h2></div><div className="top-actions"><span className="role-pill"><ShieldCheck size={14}/>{user.role}</span><button className="icon-button" title="Sign out" onClick={logout}><LogOut size={18}/></button><div className="avatar">{user.name.slice(0,1).toUpperCase()}</div></div></header>
      {message && <div className="notice inline-notice">{message}<button onClick={()=>setMessage('')}>×</button></div>}
      {page==='Overview' && <section className="content">
        <div className="welcome-panel"><div><p className="eyebrow light">MONDAY · IT OPERATIONS</p><h3>Keep every issue moving.</h3><p>Track support requests, resolve blockers, and keep your assets in check.</p></div><div className="welcome-icon"><Activity size={44}/></div></div>
        <div className="stat-grid">
          <Stat label="Total tickets" value={summary?.tickets?.total??'—'} icon={ClipboardList} tone="blue" detail="All support requests"/>
          <Stat label="Open tickets" value={summary?.tickets?.open??'—'} icon={CircleHelp} tone="amber" detail="Awaiting action"/>
          <Stat label="In progress" value={summary?.tickets?.in_progress??'—'} icon={Activity} tone="violet" detail="Being worked on"/>
          <Stat label="Tracked assets" value={summary?.assets?.total??'—'} icon={Boxes} tone="green" detail={`${summary?.assets?.needs_repair??0} need repair`}/>
        </div>
        <div className="section-heading"><div><h3>Recent tickets</h3><p className="muted">The latest requests from your workspace.</p></div><button className="secondary" onClick={()=>setPage('Tickets')}>View all tickets <span>→</span></button></div>
        <TicketTable tickets={(summary?.recent||[]).map(r=>({...r,requester_name:'Workspace'}))} onStatus={updateStatus} compact/>
        <div className="bottom-grid"><div className="panel"><div className="panel-title"><CheckCircle2 size={18}/><h3>Service health</h3></div><div className="health-row"><span>API service</span><span className="healthy">Operational</span></div><div className="health-row"><span>Authentication</span><span className="healthy">Enabled</span></div><div className="health-row"><span>Database</span><span className="healthy">PostgreSQL</span></div></div><div className="panel highlight-panel"><p className="eyebrow">QUICK ACTION</p><h3>Something needs fixing?</h3><p className="muted">Create a ticket and give your team the context they need.</p><button className="primary" onClick={()=>{setPage('Tickets');setShowCreate(true)}}><Plus size={16}/> New support ticket</button></div></div>
      </section>}
      {page==='Tickets' && <section className="content"><div className="section-heading"><div><h3>Support tickets</h3><p className="muted">Create, search, and track IT issues.</p></div><button className="primary" onClick={()=>setShowCreate(!showCreate)}><Plus size={16}/> New ticket</button></div>
        {showCreate && <form className="panel create-form" onSubmit={createTicket}><h3>Create a ticket</h3><label>Title<input required minLength="3" value={ticketForm.title} onChange={e=>setTicketForm({...ticketForm,title:e.target.value})}/></label><label>Description<textarea required minLength="5" rows="3" value={ticketForm.description} onChange={e=>setTicketForm({...ticketForm,description:e.target.value})}/></label><div className="form-row"><label>Category<select value={ticketForm.category} onChange={e=>setTicketForm({...ticketForm,category:e.target.value})}>{['Hardware','Software','Network','Access','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Priority<select value={ticketForm.priority} onChange={e=>setTicketForm({...ticketForm,priority:e.target.value})}>{['Low','Medium','High','Critical'].map(x=><option key={x}>{x}</option>)}</select></label></div><div className="form-actions"><button type="button" className="secondary" onClick={()=>setShowCreate(false)}>Cancel</button><button className="primary" disabled={busy}>{busy?'Saving…':'Create ticket'}</button></div></form>}
        <div className="toolbar"><div className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tickets…"/></div><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">All statuses</option>{['Open','In Progress','Resolved','Closed'].map(x=><option key={x}>{x}</option>)}</select></div>
        <TicketTable tickets={filteredTickets} onStatus={updateStatus}/>
      </section>}
      {page==='Assets' && <section className="content"><div className="section-heading"><div><h3>Asset inventory</h3><p className="muted">Keep hardware records accurate and easy to find.</p></div></div>
        {(user.role==='admin'||user.role==='technician') && <form className="panel asset-form" onSubmit={createAsset}><h3><Plus size={18}/> Register asset</h3><div className="form-row four"><label>Asset tag<input required value={assetForm.asset_tag} onChange={e=>setAssetForm({...assetForm,asset_tag:e.target.value})} placeholder="AST-001"/></label><label>Device name<input required value={assetForm.name} onChange={e=>setAssetForm({...assetForm,name:e.target.value})} placeholder="Office laptop"/></label><label>Category<select value={assetForm.category} onChange={e=>setAssetForm({...assetForm,category:e.target.value})}>{['Laptop','Desktop','Monitor','Printer','Network','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Condition<select value={assetForm.condition} onChange={e=>setAssetForm({...assetForm,condition:e.target.value})}>{['Good','Needs Repair','Retired'].map(x=><option key={x}>{x}</option>)}</select></label></div><button className="primary" disabled={busy}>Save asset</button></form>}
        <div className="panel table-panel"><table><thead><tr><th>Asset</th><th>Category</th><th>Serial number</th><th>Condition</th></tr></thead><tbody>{assets.map(a=><tr key={a.id}><td><strong>{a.name}</strong><small className="cell-sub">{a.asset_tag}</small></td><td>{a.category}</td><td>{a.serial_number||'—'}</td><td><span className={`status ${a.condition==='Good'?'resolved':a.condition==='Retired'?'closed':'high'}`}>{a.condition}</span></td></tr>)}</tbody></table>{assets.length===0&&<Empty text="No assets yet. Register your first device above."/>}</div>
      </section>}
      <footer>DevDesk · Full-stack portfolio project <span>Built with React, Express & PostgreSQL</span></footer>
    </main>
  </div>;
}

function Stat({label,value,icon:Icon,tone,detail}) { return <div className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={19}/></div><p>{label}</p><strong>{value}</strong><small>{detail}</small></div>; }
function TicketTable({tickets,onStatus,compact=false}) {
  if (!tickets.length) return <div className="panel"><Empty text="No tickets found. Create a ticket to get started."/></div>;
  return <div className="panel table-panel"><table><thead><tr><th>Ticket</th><th>Priority</th><th>Status</th>{!compact&&<th>Requester</th>}<th>Created</th></tr></thead><tbody>{tickets.map(t=><tr key={t.id}><td><div className="ticket-title"><span className="ticket-id">#{t.id}</span><strong>{t.title}</strong></div><small className="cell-sub">{t.category||'Support request'}</small></td><td><span className={`priority ${String(t.priority||'Medium').toLowerCase()}`}><i></i>{t.priority||'Medium'}</span></td><td>{compact?<span className={`status ${String(t.status).toLowerCase().replace(' ','-')}`}>{t.status}</span>:<select className="status-select" value={t.status} onChange={e=>onStatus(t.id,e.target.value)}>{['Open','In Progress','Resolved','Closed'].map(s=><option key={s}>{s}</option>)}</select>}</td>{!compact&&<td>{t.requester_name||'You'}</td>}<td>{t.created_at?new Date(t.created_at).toLocaleDateString():'—'}</td></tr>)}</tbody></table></div>;
}
function Empty({text}) { return <div className="empty-state"><div className="empty-icon"><ClipboardList size={22}/></div><strong>Nothing here yet</strong><p>{text}</p></div>; }
export default App;
