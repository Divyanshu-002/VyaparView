import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler);

// YE KARO (SAHI)
const API = process.env.REACT_APP_API_URL || '/api';
const FONT = { family: 'DM Sans, system-ui, sans-serif', size: 12 };
const GRID = 'rgba(48,54,61,0.9)';
const TICK = '#484f58';
const TT = {
  backgroundColor:'#161b22',titleColor:'#e6edf3',bodyColor:'#8b949e',
  borderColor:'#30363d',borderWidth:1,padding:10,cornerRadius:8,
  titleFont:FONT,bodyFont:FONT,
};
const COLORS = ['#4f8ef7','#3fb950','#d29922','#bc8cff','#f85149'];

const fmt = n => !n ? '₹0' : n >= 100000 ? `₹${(n/100000).toFixed(2)}L` : `₹${Number(n).toLocaleString('en-IN')}`;

function KpiCard({ label, value, sub, delta, deltaUp, color, delay }) {
  return (
    <div className="fadeUp" style={{ animationDelay:`${delay}ms`, background:'var(--card)',
      border:'1px solid var(--border)', borderTop:`3px solid ${color}`, borderRadius:'var(--r)', padding:'16px 18px' }}>
      <p style={{ fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',marginBottom:8 }}>{label}</p>
      <p style={{ fontSize:26,fontWeight:600,lineHeight:1,marginBottom:6 }}>{value}</p>
      <div style={{ display:'flex',alignItems:'center',gap:6 }}>
        {delta && <span style={{ fontSize:11,fontWeight:500,padding:'1px 7px',borderRadius:4,
          background:deltaUp?'#12261e':'#2d1317', color:deltaUp?'var(--green)':'var(--red)' }}>{delta}</span>}
        {sub && <span style={{ fontSize:11,color:'var(--t3)' }}>{sub}</span>}
      </div>
    </div>
  );
}

function Card({ title, icon, children, actions, delay=0 }) {
  return (
    <div className="fadeUp" style={{ animationDelay:`${delay}ms`, background:'var(--card)',
      border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'18px 20px' }}>
      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16 }}>
        <p style={{ fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:7 }}>
          <span style={{ fontSize:15,color:'var(--t2)' }}>{icon}</span>{title}
        </p>
        {actions && <div style={{ display:'flex',gap:6 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:'4px 12px',borderRadius:20,fontSize:11,cursor:'pointer',
      border:`1px solid ${active?'var(--accent)':'var(--border)'}`,
      background:active?'var(--accent2)':'var(--card2)',
      color:active?'#93c5fd':'var(--t2)', fontFamily:'var(--font)',transition:'all .15s',
    }}>{label}</button>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width:'100%',display:'flex',alignItems:'center',gap:9,
      padding:'9px 10px',borderRadius:7,border:'none',cursor:'pointer',
      background:active?'var(--accent2)':'transparent',
      color:active?'#93c5fd':'var(--t2)',fontFamily:'var(--font)',
      fontSize:13,fontWeight:active?500:400,marginBottom:2,textAlign:'left',transition:'all .15s',
    }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background='var(--card2)' }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background='transparent' }}>
      <span style={{ fontSize:16,width:18,textAlign:'center' }}>{icon}</span>{label}
    </button>
  );
}

function Badge({ text, type }) {
  const map = { top:{bg:'#122617',c:'#3fb950'}, good:{bg:'#122617',c:'#3fb950'},
    avg:{bg:'#2b1f07',c:'#d29922'}, review:{bg:'#2d1317',c:'#f85149'} };
  const s = map[type] || map.avg;
  return <span style={{ background:s.bg,color:s.c,borderRadius:20,padding:'2px 9px',fontSize:10,fontWeight:500 }}>{text}</span>;
}

function OverviewPage({ summary, catData, monthly, statusData }) {
  const [barMode, setBarMode] = useState('revenue');

  const barData = { labels:catData.map(r=>r.category), datasets:[{
    data:catData.map(r=>barMode==='revenue'?r.revenue:r.orders),
    backgroundColor:COLORS, borderRadius:6, borderSkipped:false }] };

  const barOpts = { responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false}, tooltip:{...TT, callbacks:{label:c=>barMode==='revenue'?` ${fmt(c.raw)}`:` ${c.raw} orders`}} },
    scales:{ x:{ticks:{color:TICK,font:FONT},grid:{color:GRID}},
      y:{ticks:{color:TICK,font:FONT,callback:v=>barMode==='revenue'?'₹'+v/1000+'k':v},grid:{color:GRID}} } };

  const lineData = { labels:monthly.map(r=>r.month), datasets:[{
    data:monthly.map(r=>r.revenue), borderColor:'#3fb950',
    backgroundColor:'rgba(63,185,80,0.07)', fill:true, tension:0.45,
    pointBackgroundColor:'#3fb950', pointBorderColor:'#0d1117', pointBorderWidth:2, pointRadius:4 }] };

  const lineOpts = { responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false}, tooltip:{...TT,callbacks:{label:c=>` ${fmt(c.raw)}`}} },
    scales:{ x:{ticks:{color:TICK,font:FONT},grid:{color:GRID}},
      y:{ticks:{color:TICK,font:FONT,callback:v=>'₹'+v/1000+'k'},grid:{color:GRID}} } };

  const dData = { labels:statusData.map(r=>r.status),
    datasets:[{ data:statusData.map(r=>r.count), backgroundColor:['#3fb950','#f85149','#d29922'], borderWidth:0 }] };

  return (
    <div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:16 }}>
        <KpiCard label="Total revenue"    value={fmt(summary.total_revenue)}  delta="+18%" deltaUp color="#4f8ef7" sub="vs last period" delay={50}/>
        <KpiCard label="Delivered orders" value={summary.total_orders}         delta="+6"   deltaUp color="#3fb950" sub="this month"    delay={100}/>
        <KpiCard label="Avg order value"  value={fmt(summary.avg_order_value)} delta="-3%"          color="#d29922" sub="vs last period" delay={150}/>
        <KpiCard label="Return rate"      value={`${summary.return_rate}%`}    delta={`+${summary.return_rate}%`} color="#f85149" sub="needs attention" delay={200}/>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:12,marginBottom:12 }}>
        <Card title="Revenue by category" icon="▤" delay={250}
          actions={[<Chip key="r" label="Revenue" active={barMode==='revenue'} onClick={()=>setBarMode('revenue')}/>,
                    <Chip key="o" label="Orders"  active={barMode==='orders'}  onClick={()=>setBarMode('orders')}/>]}>
          <div style={{ height:220 }}><Bar data={barData} options={barOpts}/></div>
        </Card>
        <Card title="Monthly revenue trend" icon="◈" delay={300}>
          <div style={{ height:220 }}><Line data={lineData} options={lineOpts}/></div>
        </Card>
      </div>

      <div style={{ display:'grid',gridTemplateColumns:'230px 1fr 1fr',gap:12 }}>
        <Card title="Order status" icon="◎" delay={350}>
          <div style={{ height:180 }}>
            <Doughnut data={dData} options={{ responsive:true, maintainAspectRatio:false, cutout:'68%',
              plugins:{ legend:{position:'bottom',labels:{color:'#8b949e',font:FONT,padding:12,boxWidth:10}}, tooltip:TT } }}/>
          </div>
        </Card>
        <Card title="Platform stats" icon="◉" delay={400}>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:8 }}>
            {[{l:'Customers',v:summary.total_customers,c:'#4f8ef7'},{l:'Sellers',v:summary.total_sellers,c:'#bc8cff'},
              {l:'Products',v:summary.total_products,c:'#d29922'},{l:'Cancel rate',v:`${summary.cancel_rate}%`,c:'#f85149'}]
              .map((s,i)=>(
              <div key={i} style={{ background:'var(--card2)',borderRadius:8,padding:'12px 14px' }}>
                <p style={{ fontSize:11,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.07em',marginBottom:6 }}>{s.l}</p>
                <p style={{ fontSize:24,fontWeight:600,color:s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Category share" icon="★" delay={450}>
          {catData.slice(0,5).map((c,i)=>(
            <div key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:4 }}>
                <span style={{ fontSize:12,color:'var(--t2)' }}>{c.category}</span>
                <span style={{ fontSize:12,fontWeight:500,color:COLORS[i] }}>{fmt(c.revenue)}</span>
              </div>
              <div style={{ height:5,background:'var(--border)',borderRadius:3,overflow:'hidden' }}>
                <div style={{ height:'100%',width:`${(c.revenue/catData[0].revenue)*100}%`,background:COLORS[i],borderRadius:3 }}/>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function SellersPage({ sellers }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('revenue');
  const inp = { padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',
    background:'var(--card)',color:'var(--t1)',fontFamily:'var(--font)',fontSize:12,outline:'none',cursor:'pointer' };
  const list = sellers
    .filter(s=>s.seller_name.toLowerCase().includes(search.toLowerCase())||s.city.toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>b[sort]-a[sort]);
  return (
    <div>
      <div style={{ display:'flex',gap:10,marginBottom:14 }}>
        <input placeholder="Search seller or city…" value={search} onChange={e=>setSearch(e.target.value)} style={{...inp,flex:1}}/>
        <select value={sort} onChange={e=>setSort(e.target.value)} style={inp}>
          <option value="revenue">Sort: Revenue</option>
          <option value="total_orders">Sort: Orders</option>
          <option value="rating">Sort: Rating</option>
        </select>
      </div>
      <div style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
          <thead><tr style={{ background:'var(--card2)',borderBottom:'1px solid var(--border)' }}>
            {['Seller name','City','Rating','Orders','Revenue','Return rate','Status'].map(h=>(
              <th key={h} style={{ padding:'11px 14px',textAlign:'left',color:'var(--t3)',fontWeight:500,fontSize:11,textTransform:'uppercase',letterSpacing:'.07em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {list.map((s,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid var(--border)',transition:'background .12s' }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--card2)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'12px 14px',fontWeight:500,color:'var(--t1)' }}>{s.seller_name}</td>
                <td style={{ padding:'12px 14px',color:'var(--t2)' }}>{s.city}</td>
                <td style={{ padding:'12px 14px',fontWeight:600,color:s.rating>=4.5?'var(--green)':s.rating>=4.0?'var(--amber)':'var(--red)' }}>★ {s.rating}</td>
                <td style={{ padding:'12px 14px',color:'var(--t2)' }}>{s.total_orders}</td>
                <td style={{ padding:'12px 14px',fontWeight:500,color:'var(--accent)' }}>₹{Number(s.revenue).toLocaleString('en-IN')}</td>
                <td style={{ padding:'12px 14px',fontWeight:500,color:s.return_rate>15?'var(--red)':s.return_rate>10?'var(--amber)':'var(--green)' }}>{s.return_rate}%</td>
                <td style={{ padding:'12px 14px' }}>
                  <Badge text={s.rating>=4.5?'top seller':s.rating>=4.0?'good':s.rating>=3.6?'avg':'review'}
                    type={s.rating>=4.5?'top':s.rating>=4.0?'good':s.rating>=3.6?'avg':'review'}/>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsPage({ products }) {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('All');
  const cats = ['All',...new Set(products.map(p=>p.category))];
  const list = products.filter(p=>(cat==='All'||p.category===cat)&&p.product_name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div style={{ display:'flex',gap:8,marginBottom:14,flexWrap:'wrap',alignItems:'center' }}>
        <input placeholder="Search product…" value={search} onChange={e=>setSearch(e.target.value)}
          style={{ flex:'1 1 180px',padding:'8px 12px',borderRadius:8,border:'1px solid var(--border)',background:'var(--card)',color:'var(--t1)',fontFamily:'var(--font)',fontSize:13,outline:'none' }}/>
        {cats.map(c=><Chip key={c} label={c} active={cat===c} onClick={()=>setCat(c)}/>)}
      </div>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))',gap:10 }}>
        {list.map((p,i)=>(
          <div key={i} className="fadeUp" style={{ animationDelay:`${i*35}ms`,
            background:'var(--card)',border:'1px solid var(--border)',borderRadius:'var(--r)',
            padding:'16px 18px',transition:'border-color .2s,transform .2s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.transform='translateY(-2px)'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none'}}>
            <div style={{ display:'flex',justifyContent:'space-between',marginBottom:10 }}>
              <span style={{ fontSize:10,background:'var(--accent2)',color:'#93c5fd',borderRadius:20,padding:'2px 9px',fontWeight:500 }}>{p.category}</span>
              <span style={{ fontSize:13,fontWeight:600,color:'var(--green)' }}>₹{Number(p.price).toLocaleString('en-IN')}</span>
            </div>
            <p style={{ fontSize:13,fontWeight:500,lineHeight:1.4,marginBottom:14 }}>{p.product_name}</p>
            <div style={{ display:'flex',justifyContent:'space-between',borderTop:'1px solid var(--border)',paddingTop:10 }}>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:20,fontWeight:600,color:'var(--accent)' }}>{p.units_sold}</p>
                <p style={{ fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em' }}>units</p>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:18,fontWeight:600,color:'var(--purple)' }}>₹{Number(p.revenue).toLocaleString('en-IN')}</p>
                <p style={{ fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.06em' }}>revenue</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReturnsPage({ returns:data }) {
  const barData = { labels:data.map(r=>r.category), datasets:[{
    data:data.map(r=>r.return_rate),
    backgroundColor:data.map(r=>r.return_rate>13?'#f85149':r.return_rate>9?'#d29922':'#3fb950'),
    borderRadius:6 }] };
  const barOpts = { responsive:true, maintainAspectRatio:false,
    plugins:{ legend:{display:false}, tooltip:{...TT,callbacks:{label:c=>` ${c.raw}%`}} },
    scales:{ x:{ticks:{color:TICK,font:FONT},grid:{color:GRID}},
      y:{ticks:{color:TICK,font:FONT,callback:v=>v+'%'},grid:{color:GRID},max:25} } };
  return (
    <div>
      <Card title="Return rate by category" icon="◎">
        <div style={{ height:260 }}><Bar data={barData} options={barOpts}/></div>
      </Card>
      <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:10,marginTop:12 }}>
        {data.map((r,i)=>{
          const c=r.return_rate>13?'#f85149':r.return_rate>9?'#d29922':'#3fb950';
          return (
            <div key={i} className="fadeUp" style={{ animationDelay:`${i*60}ms`,
              background:'var(--card)',border:'1px solid var(--border)',
              borderLeft:`4px solid ${c}`,borderRadius:'var(--r)',padding:'14px 16px' }}>
              <p style={{ fontSize:13,fontWeight:500,marginBottom:8 }}>{r.category}</p>
              <p style={{ fontSize:30,fontWeight:700,color:c }}>{r.return_rate}%</p>
              <p style={{ fontSize:11,color:'var(--t3)',marginTop:4 }}>{r.returns} / {r.total_orders} orders</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PAGES = [
  {id:'overview',label:'Overview',icon:'▤'},
  {id:'sellers', label:'Sellers', icon:'◈'},
  {id:'products',label:'Products',icon:'◉'},
  {id:'returns', label:'Returns', icon:'◎'},
];

export default function App() {
  const [page,setPage]         = useState('overview');
  const [summary,setSummary]   = useState(null);
  const [catData,setCatData]   = useState([]);
  const [monthly,setMonthly]   = useState([]);
  const [sellers,setSellers]   = useState([]);
  const [products,setProducts] = useState([]);
  const [returns,setReturns]   = useState([]);
  const [status,setStatus]     = useState([]);
  const [loading,setLoading]   = useState(true);
  const [error,setError]       = useState(null);
  const [catFilter,setCatFilter]= useState('All categories');

  useEffect(()=>{
    async function load(){
      try {
        const [s,c,m,se,p,r,st] = await Promise.all([
          axios.get(`${API}/summary`), axios.get(`${API}/revenue-by-category`),
          axios.get(`${API}/monthly-trend`), axios.get(`${API}/sellers`),
          axios.get(`${API}/top-products`), axios.get(`${API}/return-rates`),
          axios.get(`${API}/order-status`),
        ]);
        setSummary(s.data); setCatData(c.data); setMonthly(m.data);
        setSellers(se.data); setProducts(p.data); setReturns(r.data); setStatus(st.data);
      } catch(e){ setError('Backend connect nahi hua. Pehle server.js chalaao.'); }
      finally{ setLoading(false); }
    }
    load();
  },[]);

  if(loading) return(
    <div style={{ height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16 }}>
      <div style={{ width:36,height:36,borderRadius:'50%',border:'3px solid var(--border)',borderTop:'3px solid var(--accent)',animation:'spin .7s linear infinite' }}/>
      <p style={{ color:'var(--t2)',fontSize:13 }}>Loading dashboard...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if(error) return(
    <div style={{ height:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:12,padding:24 }}>
      <p style={{ fontSize:40 }}>⚠</p>
      <p style={{ color:'var(--red)',fontSize:16,fontWeight:500 }}>Backend not reachable</p>
      <p style={{ color:'var(--t2)',fontSize:13,textAlign:'center',maxWidth:420,lineHeight:1.7 }}>{error}</p>
      <code style={{ background:'var(--card)',color:'var(--green)',padding:'10px 18px',borderRadius:8,fontFamily:'var(--mono)',fontSize:13,marginTop:8 }}>
        cd backend &amp;&amp; node server.js
      </code>
    </div>
  );

  const sel = { padding:'7px 12px',borderRadius:8,border:'1px solid var(--border)',
    background:'var(--card2)',color:'var(--t1)',fontFamily:'var(--font)',fontSize:12,outline:'none',cursor:'pointer' };
  const filtCat = catFilter==='All categories'?catData:catData.filter(c=>c.category===catFilter);
  const titles = { overview:'Dashboard overview',sellers:'Seller performance',products:'Product analytics',returns:'Return analysis' };

  return(
    <div style={{ display:'flex',height:'100vh',overflow:'hidden',fontFamily:'var(--font)' }}>
      <aside style={{ width:190,background:'var(--card)',borderRight:'1px solid var(--border)',display:'flex',flexDirection:'column',padding:'0 8px' }}>
        <div style={{ padding:'16px 8px',borderBottom:'1px solid var(--border)',marginBottom:12 }}>
          <div style={{ display:'flex',alignItems:'center',gap:9 }}>
            <div style={{ width:30,height:30,background:'var(--accent)',borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:14,color:'#fff' }}>S</div>
            <div><p style={{ fontSize:13,fontWeight:600 }}>VyaparView</p><p style={{ fontSize:10,color:'var(--t3)' }}>Analytics</p></div>
          </div>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',margin:'0 10px 8px',fontWeight:500 }}>Main</p>
          {PAGES.map(p=><NavItem key={p.id} icon={p.icon} label={p.label} active={page===p.id} onClick={()=>setPage(p.id)}/>)}
          <p style={{ fontSize:10,color:'var(--t3)',textTransform:'uppercase',letterSpacing:'.08em',margin:'16px 10px 8px',fontWeight:500 }}>System</p>
          <NavItem icon="⚙" label="Settings" active={false} onClick={()=>{}}/>
        </div>
        <div style={{ padding:'12px 10px',borderTop:'1px solid var(--border)' }}>
          <div style={{ display:'flex',alignItems:'center',gap:6 }}>
            <div style={{ width:7,height:7,background:'var(--green)',borderRadius:'50%' }}/>
            <span style={{ fontSize:11,color:'var(--t3)' }}>MySQL connected</span>
          </div>
          <p style={{ fontSize:10,color:'var(--t3)',marginTop:3 }}>Node.js · React · Chart.js</p>
        </div>
      </aside>
      <main style={{ flex:1,overflow:'auto',display:'flex',flexDirection:'column' }}>
        <div style={{ background:'var(--card)',borderBottom:'1px solid var(--border)',padding:'12px 22px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0 }}>
          <p style={{ fontSize:15,fontWeight:500 }}>{titles[page]}</p>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <select style={sel} value={catFilter} onChange={e=>setCatFilter(e.target.value)}>
              <option>All categories</option>
              {catData.map(c=><option key={c.category}>{c.category}</option>)}
            </select>
            <div style={{ fontSize:11,color:'var(--t3)',background:'var(--card2)',border:'1px solid var(--border)',borderRadius:7,padding:'6px 12px' }}>Jan – Aug 2024</div>
          </div>
        </div>
        <div style={{ flex:1,overflow:'auto',padding:20 }}>
          {page==='overview' && <OverviewPage summary={summary} catData={filtCat.length?filtCat:catData} monthly={monthly} statusData={status}/>}
          {page==='sellers'  && <SellersPage sellers={sellers}/>}
          {page==='products' && <ProductsPage products={products}/>}
          {page==='returns'  && <ReturnsPage returns={returns}/>}
        </div>
      </main>
    </div>
  );
}
