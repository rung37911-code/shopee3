import { useState, useEffect, useRef } from "react";
import { Play, Square, RefreshCw, Eye, ArrowRight, ArrowLeft, Layers, Settings, ListOrdered, FileText } from "lucide-react";

const SHOPEE_RED = "#EE4D2D";
const SHOPEE_ORANGE = "#F5A623";
const TIKTOK_BLACK = "#121212";
const TIKTOK_CYAN = "#00f2fe";
const BG_DARK = "#0A0A14";
const BG_CARD = "#13132A";
const TEXT_MAIN = "#F0F0F0";
const TEXT_MUTED = "#8A8AAA";
const GREEN = "#27AE60";
const ADMIN_PASSWORD = "admin1234";
const DEMO_KEY = "SCL-MO-DEMO0001";

import { supabase, isSupabaseConfigured } from "./supabase.js";

const KEY_STORE = {};

function codeFromStorageKey(k) { return k.replace("key:", ""); }

async function kGet(k) {
  if (KEY_STORE[k]) return KEY_STORE[k];
  const code = codeFromStorageKey(k);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("license_keys").select("*").eq("code", code).maybeSingle();
      if (!error && data) { const v = supaRowToKeyData(data); KEY_STORE[k] = v; return v; }
    } catch {}
  }
  try {
    const raw = localStorage.getItem(k);
    if (raw) { const v = JSON.parse(raw); KEY_STORE[k] = v; return v; }
  } catch {}
  return null;
}

async function kSet(k, v) {
  KEY_STORE[k] = v;
  const code = codeFromStorageKey(k);
  if (isSupabaseConfigured) {
    try { await supabase.from("license_keys").upsert(keyDataToSupaRow(code, v)); } catch {}
  }
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}

async function kDel(k) {
  delete KEY_STORE[k];
  const code = codeFromStorageKey(k);
  if (isSupabaseConfigured) {
    try { await supabase.from("license_keys").delete().eq("code", code); } catch {}
  }
  try { localStorage.removeItem(k); } catch {}
}

async function kList() {
  const mem = new Set(Object.keys(KEY_STORE).filter(k => k.startsWith("key:")));
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("license_keys").select("code");
      if (!error && data) data.forEach(row => mem.add(`key:${row.code}`));
    } catch {}
  }
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("key:")) mem.add(k);
    }
  } catch {}
  return [...mem];
}

function supaRowToKeyData(row) {
  return { code: row.code, type: row.type, buyerName: row.buyer_name, note: row.note, active: row.active, createdAt: row.created_at, expiresAt: row.expires_at, loginCount: row.login_count, lastLogin: row.last_login };
}
function keyDataToSupaRow(code, v) {
  return { code, type: v.type, buyer_name: v.buyerName, note: v.note, active: v.active, created_at: v.createdAt, expires_at: v.expiresAt, login_count: v.loginCount || 0, last_login: v.lastLogin };
}

function isExpired(kd) { return kd?.expiresAt ? new Date() > new Date(kd.expiresAt) : false; }
function fmtDate(iso) {
  if (!iso) return "เธ•เธฅเธญเธ”เธเธตเธ";
  return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
}
function daysLeft(iso) {
  if (!iso) return null;
  return Math.max(0, Math.ceil((new Date(iso) - new Date()) / 86400000));
}
function genKey(type) {
  const p = type === "yearly" ? "YR" : type === "lifetime" ? "LF" : "MO";
  return `SCL-${p}-${Math.random().toString(36).substring(2,10).toUpperCase()}`;
}
function getExpiry(type) {
  if (type === "lifetime") return null;
  const d = new Date();
  type === "yearly" ? d.setFullYear(d.getFullYear()+1) : d.setMonth(d.getMonth()+1);
  return d.toISOString();
}

const TEMPLATES = [
  { id:"hype", name:"๐”ฅ เนเธเนเธฃเธ", fn:(p,pr,d,plat)=>plat==="shopee" ? `๐”ฅ๐’ เธเธฑเธเธ•เธฐเธเธฃเนเธฒเธ”เนเธงเธ!!\n\nโจ ${p}\n๐’ฐ เธฃเธฒเธเธฒ ${pr} เธเธฒเธ—\n${d?`๐ฏ เธฅเธ” ${d}%\n`:""}โก เธชเธ•เนเธญเธเธกเธตเธเธณเธเธฑเธ”!\n๐“ฒ เธเธ”เธฅเธดเธเธเนเนเธเนเธเธฃเนเธเธฅเน\n\n#Shopee #เธเธฑเธเธ•เธฐเธเธฃเนเธฒ #เธฅเธ”เธฃเธฒเธเธฒ` : `๐”ฅ๐’ เธเธดเธเธฑเธ”เนเธเธ•เธฐเธเธฃเนเธฒเน€เธซเธฅเธทเธญเธเธ”เนเธงเธ!!\n\nโจ ${p}\n๐’ฐ เธฃเธฒเธเธฒเธเธดเน€เธจเธฉ ${pr} เธเธฒเธ—\n${d?`๐ฏ เธฅเธ”เธเธธเธเน ${d}%\n`:""}โก เธเนเธฒเธซเธกเธ”เธญเธ”เธเธฐเธฃเธญเธเธเธตเน!\n๐“ฒ เธเธดเนเธกเธ—เธตเนเธ•เธฐเธเธฃเนเธฒเธเนเธฒเธขเธกเธทเธญเธเธเธเธฅเธดเธเนเธ”เนเน€เธฅเธข\n\n#TikTokเธเธฃเธตเน€เธญเน€เธ•เธญเธฃเน #TikTokShop #เธเธฑเธเธ•เธฐเธเธฃเนเธฒ #เธฅเธ”เธฃเธฒเธเธฒ` },
  { id:"review", name:"โญ เธฃเธตเธงเธดเธง", fn:(p,pr,d,plat)=>plat==="shopee" ? `โญ เธฃเธตเธงเธดเธงเธเธฃเธดเธ เนเธกเนเธเธดเธ”!\n\n๐“ฆ ${p}\n๐’ต ${pr} เธเธฒเธ—\n${d?`๐’ธ เธเธฃเธฐเธซเธขเธฑเธ” ${d}%\n`:""}โ… เธเธญเธเธ”เธต เธฃเธฒเธเธฒเธเธธเนเธก!\n\n#เธฃเธตเธงเธดเธง #Shopee #เธเธญเธเธ”เธตเธฃเธฒเธเธฒเธ–เธนเธ` : `โญ เธฃเธตเธงเธดเธงเธเธฒเธเธเธนเนเนเธเนเธเธฃเธดเธ!\n\n๐“ฆ ${p}\n๐’ต เน€เธเธตเธขเธ ${pr} เธเธฒเธ—\n${d?`๐’ธ เธเธฃเธฐเธซเธขเธฑเธ”เนเธเธญเธตเธ ${d}%\n`:""}โ… เธเธญเธเธ•เธฃเธเธเธ เนเธกเนเธเธเธ•เธฒ เธ”เธตเธเธฃเธดเธเธเธญเธเธ•เนเธญ!\n\n#เธฃเธตเธงเธดเธงเธเธญเธเธ”เธต #TikTokShop #เธฃเธตเธงเธดเธง #เธเธญเธเธ”เธตเธฃเธฒเธเธฒเธ–เธนเธ` },
  { id:"flash", name:"โก เน€เธเธฅเน€เธ”เธทเธญเธ”", fn:(p,pr,d,plat)=>plat==="shopee" ? `โก FLASH SALE เนเธเนเธงเธฑเธเธเธตเน!!\n\n๐ ${p}\n๐ท๏ธ ${pr} เธเธฒเธ—!\n${d?`๐”ด เธฅเธ” ${d}%\n`:""}โฐ เธฃเธฒเธเธฒเธเธตเนเธกเธตเน€เธงเธฅเธฒเธเธณเธเธฑเธ”!\n\n#FlashSale #Shopee #Deal` : `โก เธ”เธตเธฅเน€เธ”เธทเธญเธ” เธเธฒเธ—เธตเธ—เธญเธ!!\n\n๐ ${p}\n๐ท๏ธ เธฃเธฒเธเธฒเธฅเธ”เน€เธซเธฅเธทเธญ ${pr} เธเธฒเธ—!\n${d?`๐”ด เธซเธฑเนเธเธฃเธฒเธเธฒเธฅเธ ${d}%\n`:""}โฐ เน€เธเธเธฒเธฐเนเธเธเธฅเธดเธเธเธตเนเน€เธ—เนเธฒเธเธฑเนเธ เธฃเธตเธเธเธ”!\n\n#เธ”เธตเธฅเน€เธ”เนเธ” #TikTokShop #FlashSale #เธฅเธ”เธฃเธฒเธเธฒ` },
  { id:"tiktok", name:"๐ต เธชเนเธ•เธฅเนเธงเธฑเธขเธฃเธธเนเธ", fn:(p,pr,d,plat)=>plat==="shopee" ? `POV: เน€เธเธญเธเธญเธเธ”เธตเธฃเธฒเธเธฒเนเธเธ•เธฃเธ–เธนเธ ๐ฑ\n\n${p} เนเธเน ${pr} เธเธฒเธ—!!${d?` (เธฅเธ” ${d}%)`:""}\n\nเนเธเธเธ•เธฐเธเธฃเนเธฒเธเนเธญเธ!\n\n#fy #fyp #Shopee #เธเธฑเธเธ•เธฐเธเธฃเนเธฒ` : `POV: เนเธเธเธเธฑเธเธเธฑเธเนเธซเนเธฃเธตเธงเธดเธงเธชเธดเนเธเธเธตเน ๐ฑ\n\n${p} เนเธเน ${pr} เธเธฒเธ—เน€เธญเธ!!${d?` (เธฅเธ”เธ•เธฑเนเธ ${d}%)`:""}\n\nเธเธดเนเธกเธ•เธฐเธเธฃเนเธฒเน€เธซเธฅเธทเธญเธเธเนเธฒเธเธฅเนเธฒเธเธ”เนเธงเธเธเนเธญเธเธซเธกเธ”เนเธเธฃ!\n\n#fyp #เธเธญเธเธกเธฑเธเธ•เนเธญเธเธกเธต #TikTokShop #เธ•เธฐเธเธฃเนเธฒเน€เธซเธฅเธทเธญเธ` },
];
const HOOKS = ["เธซเธขเธธเธ”เน€เธฅเธทเนเธญเธเธเนเธญเธ! เธเธตเนเธเธทเธญเธชเธดเนเธเธ—เธตเนเธเธธเธ“เธ•เนเธญเธเธเธฒเธฃ","เธฃเธฒเธเธฒเธเธตเนเธ•เนเธญเธเธเธญเธเธ•เนเธญ!!","เน€เธเธทเนเธญเธเธเธญเธเธกเธฒ เธฅเธญเธเนเธฅเนเธงเธ•เธดเธ”เนเธ","เธเธฑเธเธ•เธฐเธเธฃเนเธฒเนเธงเนเธเนเธญเธ เธ•เธฑเธ”เธชเธดเธเนเธเธ—เธตเธซเธฅเธฑเธ","เธฅเธ”เนเธฅเนเธง! เธญเธขเนเธฒเธเธฅเธฒเธ”!"];

// โ”€โ”€โ”€ ROOT โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
export default function App() {
  const [screen, setScreen] = useState("login");
  const [sess, setSess] = useState(null);

  useEffect(() => {
    (async () => {
      const existing = await kGet(`key:${DEMO_KEY}`);
      if (!existing) {
        await kSet(`key:${DEMO_KEY}`, {
          code: DEMO_KEY, type: "monthly", buyerName: "Demo User",
          note: "Key เธ—เธ”เธชเธญเธเธฃเธฐเธเธ", active: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          loginCount: 0, lastLogin: null,
        });
      }
    })();
  }, []);

  const login = (key, info, isAdmin) => { setSess({ key, info, isAdmin }); setScreen(isAdmin ? "admin" : "app"); };
  const logout = () => { setSess(null); setScreen("login"); };

  if (screen === "admin") return <AdminPanel onLogout={logout} />;
  if (screen === "app") return <MainApp sess={sess} onLogout={logout} />;
  return <LoginScreen onSuccess={login} />;
}

// โ”€โ”€โ”€ LOGIN SCREEN โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function LoginScreen({ onSuccess }) {
  const [mode, setMode] = useState("user");
  const [keyVal, setKeyVal] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const doUserLogin = async () => {
    const k = keyVal.trim().toUpperCase();
    if (!k) { setErr("เธเธฃเธธเธ“เธฒเธเธฃเธญเธ License Key"); return; }
    setLoading(true); setErr("");
    const kd = await kGet(`key:${k}`);
    if (!kd) { setErr("โ เนเธกเนเธเธ Key เธเธตเนเนเธเธฃเธฐเธเธ"); setLoading(false); return; }
    if (!kd.active) { setErr("โ Key เธ–เธนเธเธฃเธฐเธเธฑเธเธเธฒเธฃเนเธเนเธเธฒเธ"); setLoading(false); return; }
    if (isExpired(kd)) { setErr(`โ Key เธซเธกเธ”เธญเธฒเธขเธธ ${fmtDate(kd.expiresAt)}`); setLoading(false); return; }
    kd.lastLogin = new Date().toISOString();
    kd.loginCount = (kd.loginCount||0)+1;
    await kSet(`key:${k}`, kd);
    setLoading(false);
    onSuccess(k, kd, false);
  };
  const doAdminLogin = () => {
    if (pass !== ADMIN_PASSWORD) { setErr("โ เธฃเธซเธฑเธชเธเนเธฒเธเนเธกเนเธ–เธนเธเธ•เนเธญเธ"); return; }
    onSuccess("ADMIN", { name:"Admin", type:"admin" }, true);
  };

  const S = LS;
  return (
    <div style={S.bg}>
      <div style={S.box}>
        <div style={S.logoWrap}>
          <div style={{fontSize:"40px"}}>๐€</div>
          <div style={S.logoText}>ClipAI<span style={{color:SHOPEE_ORANGE}}>Master</span></div>
          <div style={S.logoSub}>เธฃเธฐเธเธเธชเธฃเนเธฒเธเธเธฅเธดเธเธเธฑเธเธ•เธฐเธเธฃเนเธฒ + เนเธเธเธเธฑเนเธ เธญเธฑเธ•เนเธเธกเธฑเธ•เธด (Shopee & TikTok)</div>
        </div>
        <div style={S.tabRow}>
          <button style={S.tab(mode==="user")} onClick={()=>{setMode("user");setErr("");}}>๐”‘ เน€เธเนเธฒเนเธเนเธเธฒเธ</button>
          <button style={S.tab(mode==="admin")} onClick={()=>{setMode("admin");setErr("");}}>โ๏ธ Admin</button>
        </div>
        {mode==="user" ? (
          <>
            <label style={S.label}>License Key</label>
            <input style={S.input} placeholder="SCL-MO-XXXXXXXX" value={keyVal} onChange={e=>setKeyVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doUserLogin()} />
            <div style={S.hint}>* Key เนเธ”เนเธฃเธฑเธเธเธฒเธเธเธนเนเธเธฒเธข</div>
            <div style={{fontSize:"12px",color:SHOPEE_ORANGE,marginBottom:"12px",cursor:"pointer"}} onClick={()=>setKeyVal(DEMO_KEY)}>๐งช เธเธ”เน€เธเธทเนเธญเนเธชเน Demo Key เธ—เธ”เธชเธญเธ</div>
            {err && <div style={S.err}>{err}</div>}
            <button style={S.btn} onClick={doUserLogin} disabled={loading}>{loading ? "โณ เธเธณเธฅเธฑเธเธ•เธฃเธงเธเธชเธญเธ..." : "เน€เธเนเธฒเนเธเนเธเธฒเธ โ’"}</button>
          </>
        ) : (
          <>
            <label style={S.label}>เธฃเธซเธฑเธชเธเนเธฒเธ Admin</label>
            <input style={S.input} type="password" placeholder="โ€ขโ€ขโ€ขโ€ขโ€ขโ€ขโ€ขโ€ข" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAdminLogin()} />
            {err && <div style={S.err}>{err}</div>}
            <button style={S.btn} onClick={doAdminLogin}>เน€เธเนเธฒ Admin Panel โ’</button>
          </>
        )}
        <div style={{textAlign:"center",marginTop:"16px",fontSize:"11px",color:"rgba(255,255,255,0.25)"}}>ClipAIMaster v2.6 โ€ข Dual Platform Support</div>
      </div>
    </div>
  );
}
const LS = {
  bg:{minHeight:"100vh",background:BG_DARK,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:"'Segoe UI','Noto Sans Thai',sans-serif"},
  box:{background:BG_CARD,borderRadius:"20px",padding:"32px 28px",width:"100%",maxWidth:"380px",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"},
  logoWrap:{textAlign:"center",marginBottom:"28px"},
  logoText:{fontSize:"26px",fontWeight:"900",color:TEXT_MAIN,letterSpacing:"-0.5px"},
  logoSub:{fontSize:"12px",color:TEXT_MUTED,marginTop:"4px"},
  tabRow:{display:"flex",gap:"8px",marginBottom:"20px"},
  tab:(a)=>({flex:1,padding:"9px",borderRadius:"10px",border:"none",fontSize:"13px",fontWeight:a?"700":"400",cursor:"pointer",background:a?SHOPEE_RED:"rgba(255,255,255,0.06)",color:a?"#fff":TEXT_MUTED}),
  label:{display:"block",fontSize:"12px",color:TEXT_MUTED,marginBottom:"6px"},
  input:{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"11px 14px",color:TEXT_MAIN,fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"6px",letterSpacing:"1px"},
  hint:{fontSize:"11px",color:TEXT_MUTED,marginBottom:"4px"},
  err:{background:"rgba(238,77,45,0.15)",border:"1px solid rgba(238,77,45,0.3)",borderRadius:"8px",padding:"8px 12px",fontSize:"13px",color:"#FF6B6B",marginBottom:"12px"},
  btn:{width:"100%",background:`linear-gradient(135deg,${SHOPEE_RED},#C0392B)`,color:"#fff",border:"none",borderRadius:"10px",padding:"13px",fontSize:"15px",fontWeight:"700",cursor:"pointer",marginTop:"4px"},
};

// โ”€โ”€โ”€ ADMIN PANEL โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("create");
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newType, setNewType] = useState("monthly");
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [created, setCreated] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({total:0,active:0,expired:0,monthly:0,yearly:0,lifetime:0});
  const [copied, setCopied] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    const names = await kList();
    const list = [];
    for (const n of names) { const d = await kGet(n); if (d) list.push({ storageKey:n, keyCode:n.replace("key:",""), ...d }); }
    list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    setKeys(list);
    const st={total:list.length,active:0,expired:0,monthly:0,yearly:0,lifetime:0};
    list.forEach(k=>{ (isExpired(k)||!k.active)?st.expired++:st.active++; st[k.type]=(st[k.type]||0)+1; });
    setStats(st);
    setLoading(false);
  };

  useEffect(()=>{ if(tab==="keys") loadKeys(); },[tab]);

  const createKey = async () => {
    const code = genKey(newType);
    const kd = { code, type:newType, buyerName:newName||"เนเธกเนเธฃเธฐเธเธธ", note:newNote, active:true, createdAt:new Date().toISOString(), expiresAt:getExpiry(newType), loginCount:0, lastLogin:null };
    await kSet(`key:${code}`, kd);
    setCreated(code); setNewName(""); setNewNote("");
  };

  const toggleKey = async (code, cur) => { const d = await kGet(`key:${code}`); if (d) { d.active=!cur; await kSet(`key:${code}`,d); loadKeys(); } };
  const deleteKey = async (code) => { if (!confirm(`เธฅเธ Key ${code}?`)) return; await kDel(`key:${code}`); loadKeys(); };
  const copyKey = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const filtered = keys.filter(k=>k.keyCode.includes(search.toUpperCase())||k.buyerName?.includes(search)||k.note?.includes(search));

  const A = AS;
  return (
    <div style={A.wrap}>
      <div style={A.hdr}>
        <div><div style={A.hdrT}>โ๏ธ Admin Panel</div><div style={A.hdrS}>ClipAI โ€” เธเธฑเธ”เธเธฒเธฃ License Keys เธ—เธฑเนเธเธซเธกเธ”</div></div>
        <button style={A.logoutBtn} onClick={onLogout}>เธญเธญเธเธเธฒเธเธฃเธฐเธเธ</button>
      </div>
      <div style={A.statsRow}>
        {[["๐”‘ เธ—เธฑเนเธเธซเธกเธ”",stats.total,"#667eea"],["โ… เนเธเนเนเธ”เน",stats.active,GREEN],["โ เธซเธกเธ”เธญเธฒเธขเธธ",stats.expired,"#e74c3c"],["๐“… เธฃเธฒเธขเน€เธ”เธทเธญเธ",stats.monthly,SHOPEE_ORANGE],["๐“ เธฃเธฒเธขเธเธต",stats.yearly,"#9B59B6"],["โพ๏ธ เธ•เธฅเธญเธ”เธเธตเธ",stats.lifetime,"#1ABC9C"]].map(([l,v,c])=>(
          <div key={l} style={A.statBox}><div style={{fontSize:"20px",fontWeight:"800",color:c}}>{v}</div><div style={{fontSize:"11px",color:TEXT_MUTED}}>{l}</div></div>
        ))}
      </div>
      <div style={A.tabRow}>
        {[["create","โ• เธชเธฃเนเธฒเธ Key"],["keys","๐—๏ธ Keys เธ—เธฑเนเธเธซเธกเธ”"]].map(([id,lb])=>(
          <button key={id} style={A.tab(tab===id)} onClick={()=>setTab(id)}>{lb}</button>
        ))}
      </div>
      <div style={A.body}>
        {tab==="create" && (
          <div style={A.card}>
            <div style={A.cardT}>โ• เธชเธฃเนเธฒเธ License Key เนเธซเธกเน</div>
            <label style={A.label}>เธเธทเนเธญเธเธนเนเธเธทเนเธญ / เธฃเนเธฒเธเธเนเธฒ</label>
            <input style={A.input} placeholder="เน€เธเนเธ เธฃเนเธฒเธเธชเธกเธเธฒเธข, Line: @shop" value={newName} onChange={e=>setNewName(e.target.value)} />
            <label style={A.label}>เธเธฃเธฐเน€เธ เธ— Key</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
              {[["monthly","๐“… เธฃเธฒเธขเน€เธ”เธทเธญเธ","30 เธงเธฑเธ"],["yearly","๐“ เธฃเธฒเธขเธเธต","365 เธงเธฑเธ"],["lifetime","โพ๏ธ เธ•เธฅเธญเธ”เธเธตเธ","เนเธกเนเธซเธกเธ”เธญเธฒเธขเธธ"]].map(([v,l,s])=>(
                <div key={v} style={A.typeBox(newType===v)} onClick={()=>setNewType(v)}>
                  <div style={{fontSize:"13px",fontWeight:"700"}}>{l}</div>
                  <div style={{fontSize:"11px",color:TEXT_MUTED}}>{s}</div>
                </div>
              ))}
            </div>
            <label style={A.label}>เธซเธกเธฒเธขเน€เธซเธ•เธธ</label>
            <input style={A.input} placeholder="เน€เธเนเธ เธเธณเธฃเธฐ 299 เธเธฒเธ—" value={newNote} onChange={e=>setNewNote(e.target.value)} />
            <button style={A.btnP} onClick={createKey}>๐”‘ เธชเธฃเนเธฒเธ Key เนเธซเธกเน</button>
            {created && (
              <div style={{marginTop:"14px",background:"rgba(39,174,96,0.1)",border:"1px solid rgba(39,174,96,0.3)",borderRadius:"12px",padding:"14px"}}>
                <div style={{fontSize:"13px",color:TEXT_MUTED,marginBottom:"6px"}}>โ… เธชเธฃเนเธฒเธเธชเธณเน€เธฃเนเธ!</div>
                <div style={{fontFamily:"monospace",fontSize:"18px",fontWeight:"800",color:GREEN,letterSpacing:"2px",textAlign:"center",padding:"10px",background:"rgba(0,0,0,0.3)",borderRadius:"8px",marginBottom:"8px"}}>{created}</div>
                <button style={{width:"100%",background:GREEN,color:"#fff",border:"none",borderRadius:"8px",padding:"9px",fontSize:"13px",fontWeight:"700",cursor:"pointer"}} onClick={()=>copyKey(created)}>{copied?"โ“ เธเธฑเธ”เธฅเธญเธเนเธฅเนเธง":"๐“ เธเธฑเธ”เธฅเธญเธ Key"}</button>
              </div>
            )}
          </div>
        )}
        {tab==="keys" && (
          <>
            <input style={{...A.input,marginBottom:"10px"}} placeholder="๐” เธเนเธเธซเธฒ Key / เธเธทเนเธญเธเธนเนเธเธทเนเธญ..." value={search} onChange={e=>setSearch(e.target.value)} />
            {loading ? <div style={{textAlign:"center",color:TEXT_MUTED,padding:"30px"}}>โณ เธเธณเธฅเธฑเธเนเธซเธฅเธ”...</div>
            : filtered.length===0 ? <div style={{textAlign:"center",color:TEXT_MUTED,padding:"30px"}}>เนเธกเนเธเธเธเนเธญเธกเธนเธฅ</div>
            : filtered.map(k=>{ const exp=isExpired(k); return (
              <div key={k.keyCode} style={{background:k.active&&!exp?BG_CARD:"rgba(20,10,10,0.6)",borderRadius:"12px",padding:"14px",marginBottom:"10px",border:k.active&&!exp?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(238,77,45,0.2)"}}>
                <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                  <span style={{fontFamily:"monospace",fontSize:"14px",fontWeight:"800",color:TEXT_MAIN}}>{k.keyCode}</span>
                  <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"20px",background:"rgba(255,255,255,0.1)",color:SHOPEE_ORANGE}}>{k.type==="monthly"?"เธฃเธฒเธขเน€เธ”เธทเธญเธ":k.type==="yearly"?"เธฃเธฒเธขเธเธต":"เธ•เธฅเธญเธ”เธเธตเธ"}</span>
                </div>
                <div style={{fontSize:"12px",color:TEXT_MUTED}}>{k.buyerName ? `๐‘ค ${k.buyerName} | ๐“ ${k.note}` : ""}</div>
                <div style={{fontSize:"12px",color:TEXT_MUTED}}>โฐ เธซเธกเธ”เธญเธฒเธขเธธ: {exp?<span style={{color:"#e74c3c"}}>เธซเธกเธ”เนเธฅเนเธง</span>:<span>{fmtDate(k.expiresAt)}</span>}</div>
                <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
                  <button style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",fontSize:"12px",cursor:"pointer",background:"rgba(255,255,255,0.1)",color:TEXT_MAIN}} onClick={()=>toggleKey(k.keyCode,k.active)}>{k.active?"๐”’ เธฃเธฐเธเธฑเธ":"โ… เน€เธเธดเธ”เนเธเน"}</button>
                  <button style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",fontSize:"12px",cursor:"pointer",background:"rgba(231,76,60,0.2)",color:"#e74c3c"}} onClick={()=>deleteKey(k.keyCode)}>๐—‘๏ธ เธฅเธ</button>
                </div>
              </div>
            );})}
          </>
        )}
      </div>
    </div>
  );
}
const AS = {
  wrap:{minHeight:"100vh",background:BG_DARK,color:TEXT_MAIN,fontFamily:"'Segoe UI','Noto Sans Thai',sans-serif"},
  hdr:{background:"linear-gradient(135deg,#1a1a3e,#0D1B2A)",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"},
  hdrT:{fontSize:"18px",fontWeight:"800"},hdrS:{fontSize:"12px",color:TEXT_MUTED},
  logoutBtn:{background:"rgba(255,255,255,0.08)",border:"none",color:TEXT_MUTED,borderRadius:"8px",padding:"6px 14px",cursor:"pointer"},
  statsRow:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"8px",padding:"14px 16px"},
  statBox:{background:BG_CARD,borderRadius:"12px",padding:"12px",textAlign:"center"},
  tabRow:{display:"flex",gap:"8px",padding:"0 16px 12px"},
  tab:(a)=>({flex:1,padding:"9px",borderRadius:"10px",border:"none",fontSize:"13px",background:a?SHOPEE_RED:"rgba(255,255,255,0.06)",color:"#fff",cursor:"pointer"}),
  body:{padding:"0 16px 24px"},
  card:{background:BG_CARD,borderRadius:"16px",padding:"18px",border:"1px solid rgba(255,255,255,0.07)"},
  cardT:{fontSize:"14px",fontWeight:"700",color:SHOPEE_ORANGE,marginBottom:"14px"},
  label:{display:"block",fontSize:"12px",color:TEXT_MUTED,marginBottom:"5px"},
  input:{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 14px",color:TEXT_MAIN,fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"12px"},
  typeBox:(a)=>({background:a?"rgba(238,77,45,0.15)":"rgba(255,255,255,0.04)",border:a?`2px solid ${SHOPEE_RED}`:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",padding:"10px 8px",textAlign:"center",cursor:"pointer"}),
  btnP:{width:"100%",background:`linear-gradient(135deg,${SHOPEE_RED},#C0392B)`,color:"#fff",border:"none",borderRadius:"10px",padding:"12px",fontSize:"14px",fontWeight:"700",cursor:"pointer"},
};

// โ”€โ”€โ”€ MAIN APP โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function MainApp({ sess, onLogout }) {
  const { key: licKey, info: keyInfo } = sess;
  const [page, setPage] = useState("content");
  const [platform, setPlatform] = useState("shopee");
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState("");
  const [disc, setDisc] = useState("");
  const [link, setLink] = useState("");
  const [tmpl, setTmpl] = useState("hype");
  const [hook, setHook] = useState("");
  const [captionTmpl, setCaptionTmpl] = useState("");
  const [captionAi, setCaptionAi] = useState("");
  const [script, setScript] = useState("");
  const [activeTab, setActiveTab] = useState("template");
  const [aiLoading, setAiLoading] = useState(false);
  const [scriptLoading, setScriptLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botStatus, setBotStatus] = useState("Idle");

  const expired = isExpired(keyInfo||{});
  const dl = daysLeft(keyInfo?.expiresAt);

  const handleToggleBot = () => {
    if (isBotRunning) {
      setBotStatus("Stopping");
      setTimeout(() => { setIsBotRunning(false); setBotStatus("Idle"); }, 1500);
    } else { setIsBotRunning(true); setBotStatus("Running"); }
  };

  const genTemplate = () => {
    const t = TEMPLATES.find(x=>x.id===tmpl);
    if (!t||!product||!price) return;
    const h = hook||HOOKS[Math.floor(Math.random()*HOOKS.length)];
    setCaptionTmpl(`${h}\n\n${t.fn(product,price,disc,platform)}`);
  };

  const callAI = async (prompt, setFn, setLoad) => {
    setLoad(true);
    try {
      const apiKey = localStorage.getItem("anthropic_api_key") || "";
      if (!apiKey) { setFn("โ ๏ธ เธขเธฑเธเนเธกเนเนเธ”เนเธ•เธฑเนเธเธเนเธฒ Anthropic API Key โ€” เธเธ”เธเธธเนเธก 'เธ•เธฑเนเธเธเนเธฒเธฃเธฐเธเธ' เน€เธเธทเนเธญเธเธฃเธญเธ API Key"); setLoad(false); return; }
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})
      });
      const d = await r.json();
      if (d.error) { setFn(`โ ๏ธ เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”: ${d.error.message}`); setLoad(false); return; }
      setFn(d.content?.map(c=>c.text||"").join("")||"เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธฅเธญเธเนเธซเธกเน");
    } catch { setFn("เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ” เธฅเธญเธเนเธซเธกเน"); }
    setLoad(false);
  };

  const genAI = () => callAI(`เธเธธเธ“เน€เธเนเธ Social Media Copywriter เน€เธเธตเนเธขเธงเธเธฒเธเธเธฒเธขเธเธญเธเธญเธญเธเนเธฅเธเนเธเนเธฒเธเธฃเธฐเธเธเนเธญเธเธเธดเธฅเธดเน€เธญเธ• เธเธเนเธเธฅเธ•เธเธญเธฃเนเธก ${platform.toUpperCase()}\nเธชเธฃเนเธฒเธเนเธเธเธเธฑเนเธเธเธฑเธเธ•เธฐเธเธฃเนเธฒเธชเธณเธซเธฃเธฑเธ:\n- เธชเธดเธเธเนเธฒ: ${product}\n- เธฃเธฒเธเธฒ: ${price} เธเธฒเธ—\n${disc?`- เธฅเธ”: ${disc}%\n`:""}${link?`- เธฅเธดเธเธเนเธเธดเธเธฑเธ”: ${link}\n`:""}\nเนเธซเนเธกเธต: เธเธณเน€เธเธดเธ”เธ•เธฑเธงเธ”เธถเธเธ”เธนเธ” (Hook), เธ เธฒเธฉเธฒเนเธ—เธขเธฎเธดเธ•เน เธงเธฑเธขเธฃเธธเนเธเธเธญเธ, Emoji เธเนเธฒเธฃเธฑเธเธเธญเธ”เธต, เธงเธดเธเธตเธชเธฑเนเธเธเธทเนเธญเธ—เธตเนเน€เธซเธกเธฒเธฐเธเธฑเธ ${platform}, เนเธฎเธเนเธ—เนเธ 5-8 เธญเธฑเธ\nเธ•เธญเธเธ”เนเธงเธขเธเนเธญเธเธงเธฒเธกเนเธเธเธเธฑเนเธเน€เธ—เนเธฒเธเธฑเนเธ`, setCaptionAi, setAiLoading);
  const genScript = () => callAI(`เธชเธฃเนเธฒเธเธชเธเธฃเธดเธเธ•เนเธเธฅเธดเธเธชเธฑเนเธเธชเธณเธซเธฃเธฑเธเธฃเธฑเธเธเธเนเธเธฅเธ•เธเธญเธฃเนเธก ${platform.toUpperCase()} เธเธฑเธเธ•เธฐเธเธฃเนเธฒเนเธญเธเธเธดเธฅเธดเน€เธญเธ•:\n- เธชเธดเธเธเนเธฒ: ${product}\n- เธฃเธฒเธเธฒ: ${price} เธเธฒเธ—\n${disc?`- เธฅเธ”: ${disc}%\n`:""}\nเธฃเธนเธเนเธเธเธชเธเธฃเธดเธเธ•เนเธเธงเธฒเธกเธขเธฒเธง 15-30 เธงเธดเธเธฒเธ—เธต:\n[0-3 เธงเธด] HOOK:\n[3-10 เธงเธด] เธฃเธตเธงเธดเธง:\n[10-20 เธงเธด] เธเธธเธ”เธงเนเธฒเธง:\n[20-30 เธงเธด] เธเธดเธ”เธเธฒเธฃเธเธฒเธข + เธเธดเธเธฑเธ”:\nเนเธเนเธ เธฒเธฉเธฒเนเธ—เธขเธชเนเธ•เธฅเนเธญเธดเธเธเธฅเธนเน€เธญเธเน€เธเธญเธฃเน`, setScript, setScriptLoading);

  const copy = (text,id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(()=>setCopied(""),2000); };

  const M = MS;
  const headerBg = platform === "shopee" ? `linear-gradient(135deg, ${SHOPEE_RED}, #8B0000)` : `linear-gradient(135deg, ${TIKTOK_BLACK}, #333)`;

  const renderContent = () => {
    switch (page) {
      case "content":
        return (
          <>
            <div style={M.card}>
              <div style={M.cardT}>๐“ฆ เธเนเธญเธกเธนเธฅเธชเธดเธเธเนเธฒเธ—เธตเนเธ•เนเธญเธเธเธฒเธฃเธเธฒเธข</div>
              <label style={M.label}>เธเธทเนเธญเธชเธดเธเธเนเธฒ *</label>
              <input style={M.input} placeholder="เน€เธเนเธ เธเธฃเธฐเน€เธเนเธฒเธเนเธฒ Canvas เธฅเธฒเธขเธเธฒเธฃเนเธ•เธนเธ" value={product} onChange={e=>setProduct(e.target.value)} />
              <div style={{display:"flex",gap:"10px"}}>
                <div style={{flex:1}}><label style={M.label}>เธฃเธฒเธเธฒ (เธเธฒเธ—) *</label><input style={M.input} type="number" placeholder="299" value={price} onChange={e=>setPrice(e.target.value)} /></div>
                <div style={{flex:1}}><label style={M.label}>เธฅเธ” (%)</label><input style={M.input} type="number" placeholder="20" value={disc} onChange={e=>setDisc(e.target.value)} /></div>
              </div>
              <label style={M.label}>เธฅเธดเธเธเนเธชเธดเธเธเนเธฒ ({platform === "shopee" ? "Shopee" : "TikTok Shop"})</label>
              <input style={{...M.input,marginBottom:0}} placeholder="เธงเธฒเธเธฅเธดเธเธเนเธเธฑเธเธซเธกเธธเธ”เธ—เธตเนเธเธตเน..." value={link} onChange={e=>setLink(e.target.value)} />
            </div>
            <div style={M.card}>
              <div style={M.cardT}>โ๏ธ เธชเธฃเนเธฒเธเนเธเธเธเธฑเนเธเธเธฒเธขเธเธญเธ</div>
              <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
                <button style={M.tab(activeTab==="template")} onClick={()=>setActiveTab("template")}>๐“ เนเธเนเน€เธ—เธกเน€เธเธฅเธ•</button>
                <button style={M.tab(activeTab==="ai")} onClick={()=>setActiveTab("ai")}>๐ค– เธชเนเธเนเธซเน AI เนเธ•เนเธ</button>
              </div>
              {activeTab==="template"&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
                    {TEMPLATES.map(t=>(<button key={t.id} style={M.tmplBtn(tmpl===t.id)} onClick={()=>setTmpl(t.id)}>{t.name}</button>))}
                  </div>
                  <label style={M.label}>เน€เธฅเธทเธญเธเธเธณเธเธถเนเธเธ•เนเธ (Hook)</label>
                  <div style={{marginBottom:"8px"}}>{HOOKS.slice(0,4).map(h=>(<span key={h} style={M.chip} onClick={()=>setHook(h)}>{h}</span>))}</div>
                  <input style={M.input} placeholder="เธซเธฃเธทเธญเธเธดเธกเธเน hook เน€เธญเธ..." value={hook} onChange={e=>setHook(e.target.value)} />
                  <button style={M.btnP} onClick={genTemplate} disabled={expired}>โจ เธชเธฑเนเธเน€เธเน€เธเธญเน€เธฃเธ•เนเธเธเธเธฑเนเธ</button>
                  {captionTmpl&&<ResultBox text={captionTmpl} id="tmpl" copied={copied} onCopy={copy}/>}
                </>
              )}
              {activeTab==="ai"&&(
                <>
                  <button style={{...M.btnP,opacity:aiLoading?0.7:1}} onClick={genAI} disabled={aiLoading||expired}>{aiLoading?"โณ เธเธญเธ— AI เธเธณเธฅเธฑเธเน€เธเธตเธขเธเนเธซเน...":"๐ค– เธเธ”เธเธธเนเธกเนเธซเน AI เน€เธเธเนเธเธเธเธฑเนเธเธเธดเน€เธจเธฉ"}</button>
                  {captionAi&&<ResultBox text={captionAi} id="ai" copied={copied} onCopy={copy}/>}
                </>
              )}
            </div>
            <div style={M.card}>
              <div style={M.cardT}>๐ฌ เธชเธเธฃเธดเธเธ•เนเธเธนเธ”เนเธเธเธฅเธดเธเธชเธฑเนเธ (AI)</div>
              <button style={{...M.btnS,opacity:scriptLoading?0.7:1}} onClick={genScript} disabled={scriptLoading||expired}>{scriptLoading?"โณ AI เธเธณเธฅเธฑเธเน€เธฃเธตเธขเธเน€เธฃเธตเธขเธเธชเธเธฃเธดเธเธ•เนเน€เธชเธตเธขเธ...":"๐ฌ เธชเธฃเนเธฒเธเธชเธเธฃเธดเธเธ•เนเธชเธฑเนเธ 15-30 เธงเธด"}</button>
              {script&&(
                <div style={{marginTop:"12px"}}>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"6px"}}>
                    <button style={{background:"rgba(255,255,255,0.08)",border:"none",color:TEXT_MUTED,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",cursor:"pointer"}} onClick={()=>copy(script,"scr")}>{copied==="scr"?"โ“ เธเธฑเธ”เธฅเธญเธเนเธฅเนเธง":"๐“ เธเธฑเธ”เธฅเธญเธเธชเธเธฃเธดเธเธ•เน"}</button>
                  </div>
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:"12px",padding:"14px",fontSize:"12px",lineHeight:"1.8",whiteSpace:"pre-wrap",color:TEXT_MAIN,border:"1px solid rgba(255,255,255,0.07)",maxHeight:"280px",overflowY:"auto"}}>{script}</div>
                </div>
              )}
            </div>
          </>
        );
      case "video":
        return <VideoGenerator M={M} expired={expired} product={product} price={price} disc={disc} captionForVideo={captionTmpl || captionAi} platform={platform} />;
      case "queue":
        return <VideoQueueManager M={M} licKey={licKey} expired={expired} platform={platform} />;
      case "settings":
        return <SettingsComponent M={M} />;
      default:
        return null;
    }
  };

  return (
    <div style={M.app}>
      <div style={{...M.hdr, background: headerBg}}>
        <div style={M.glow}/>
        <div style={{position:"relative",zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
          <div>
            <div style={M.logo}>๐€ ClipAI<span style={{color: platform === "shopee" ? SHOPEE_ORANGE : TIKTOK_CYAN}}>{platform === "shopee" ? "Shopee" : "TikTok"}</span></div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>เธฃเธฐเธเธเธชเธฃเนเธฒเธเธเธฅเธดเธเธเธฑเธเธ•เธฐเธเธฃเนเธฒ + เนเธเธเธเธฑเนเธเธญเธฑเธเธเธฃเธดเธขเธฐ</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:"10px",color:TEXT_MUTED}}>Bot Master Status</div>
              <div style={{fontSize:"13px",fontWeight:"bold",color:botStatus==="Running"?"#27AE60":botStatus==="Stopping"?"#F5A623":"#FF6B6B"}}>{botStatus}</div>
            </div>
            <button onClick={handleToggleBot} disabled={botStatus==="Stopping"}
              style={{display:"flex",alignItems:"center",gap:"6px",padding:"8px 14px",borderRadius:"8px",border:"none",fontSize:"13px",fontWeight:"bold",cursor:"pointer",background:isBotRunning?"#E74C3C":"#27AE60",color:"#fff",opacity:botStatus==="Stopping"?0.6:1}}>
              {botStatus==="Stopping" ? <><RefreshCw style={{width:"14px",height:"14px"}}/>เธเธณเธฅเธฑเธเธซเธขเธธเธ”...</> : isBotRunning ? <><Square style={{width:"14px",height:"14px"}}/>เธเธดเธ”เธเธญเธ—เธฃเธฐเธเธ</> : <><Play style={{width:"14px",height:"14px"}}/>เน€เธเธดเธ”เธเธญเธ—เธฃเธฐเธเธ</>}
            </button>
          </div>
        </div>
        <div style={{position:"relative",zIndex:1,marginTop:"12px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
          <div style={{display:"flex",gap:"6px"}}>
            <span style={M.badge()}>{licKey}</span>
            <span style={M.badge(expired?"#e74c3c":GREEN)}>{expired?"โ เธซเธกเธ”เธญเธฒเธขเธธ":keyInfo?.type==="lifetime"?"โพ๏ธ เธ•เธฅเธญเธ”เธเธตเธ":`โฐ เน€เธซเธฅเธทเธญ ${dl} เธงเธฑเธ`}</span>
            <span style={{...M.badge(),cursor:"pointer"}} onClick={onLogout}>เธญเธญเธเธเธฒเธเธฃเธฐเธเธ</span>
          </div>
          <div style={{display:"flex",background:"rgba(0,0,0,0.4)",padding:"4px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.1)"}}>
            <button onClick={()=>{setPlatform("shopee");setCaptionTmpl("");setCaptionAi("");setScript("");}} style={{padding:"6px 14px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"bold",cursor:"pointer",background:platform==="shopee"?SHOPEE_RED:"transparent",color:"#fff"}}>๐งก Shopee</button>
            <button onClick={()=>{setPlatform("tiktok");setCaptionTmpl("");setCaptionAi("");setScript("");}} style={{padding:"6px 14px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"bold",cursor:"pointer",background:platform==="tiktok"?"#fff":"transparent",color:platform==="tiktok"?"#000":"#fff"}}>๐–ค TikTok</button>
          </div>
        </div>
      </div>

      <div style={{margin:"14px auto 0",maxWidth:"600px",padding:"0 14px"}}>
        <div style={{background:platform==="shopee"?"rgba(238,77,45,0.1)":"rgba(255,255,255,0.05)",border:`1px solid ${platform==="shopee"?SHOPEE_ORANGE:"#fff"}30`,padding:"10px",borderRadius:"10px",fontSize:"12px",textAlign:"center"}}>
          {platform==="shopee"?"๐งก เธฃเธฐเธเธเธ—เธณเธเธฒเธเนเธเนเธซเธกเธ” Shopee Affiliate":"๐–ค เธฃเธฐเธเธเธ—เธณเธเธฒเธเนเธเนเธซเธกเธ” TikTok Affiliate"}
        </div>
      </div>

      <div style={{display:"flex",gap:"6px",padding:"14px 14px 0",maxWidth:"600px",margin:"0 auto",flexWrap:"wrap"}}>
        <button style={M.tab(page==="content")} onClick={()=>setPage("content")}><FileText size={14} style={{marginRight:4}}/>เน€เธเธตเธขเธเนเธเธชเธ•เน</button>
        <button style={M.tab(page==="video")} onClick={()=>setPage("video")}>๐ฌ เธชเธฃเนเธฒเธเธเธฅเธดเธ</button>
        <button style={M.tab(page==="queue")} onClick={()=>setPage("queue")}><ListOrdered size={14} style={{marginRight:4}}/>เธเธดเธงเธเธฒเธ & เธเธญเธ—</button>
        <button style={M.tab(page==="settings")} onClick={()=>setPage("settings")}><Settings size={14} style={{marginRight:4}}/>เธ•เธฑเนเธเธเนเธฒเธฃเธฐเธเธ</button>
      </div>

      <div style={M.body}>{renderContent()}</div>
    </div>
  );
}

// โ”€โ”€โ”€ VIDEO GENERATOR โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function VideoGenerator({ M, expired, product, price, disc, captionForVideo, platform }) {
  const [mode, setMode] = useState("generate");
  const [images, setImages] = useState([]);
  const [secPerImg, setSecPerImg] = useState(2.5);
  const [overlayText, setOverlayText] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoFileName, setVideoFileName] = useState("clip-output.webm");
  const [shareMsg, setShareMsg] = useState("");
  const canvasRef = useRef(null);
  const videoFileInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!overlayText && product) setOverlayText(`${product}${price?` | ${price} เธเธฒเธ—`:""}${disc?` เธฅเธ” ${disc}%`:""}`);
  }, [product, price, disc]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    const newImgs = files.map(f => ({ url: URL.createObjectURL(f), name: f.name }));
    setImages(prev => [...prev, ...newImgs].slice(0, 10));
  };
  const removeImage = (idx) => setImages(prev => prev.filter((_,i)=>i!==idx));

  const renderVideo = async () => {
    if (images.length === 0) return;
    setIsRendering(true); setProgress(0); setVideoUrl("");
    const W = 720, H = 1280;
    const canvas = canvasRef.current;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const loaded = await Promise.all(images.map(img => new Promise(res => { const el = new Image(); el.onload = ()=>res(el); el.onerror = ()=>res(null); el.src = img.url; })));
    const stream = canvas.captureStream(30);
    const chunks = [];
    let mime = "video/webm;codecs=vp9";
    if (!MediaRecorder.isTypeSupported(mime)) mime = "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const stopped = new Promise(res => { recorder.onstop = res; });
    recorder.start();
    const totalDuration = secPerImg * loaded.length * 1000;
    const startTime = performance.now();
    await new Promise(resolveAll => {
      function frame() {
        const elapsed = performance.now() - startTime;
        const idx = Math.min(loaded.length - 1, Math.floor(elapsed / (secPerImg*1000)));
        const localT = (elapsed % (secPerImg*1000)) / (secPerImg*1000);
        const img = loaded[idx];
        ctx.fillStyle = "#000"; ctx.fillRect(0,0,W,H);
        if (img) {
          const scale = 1 + 0.12 * localT;
          const iw = img.width, ih = img.height;
          const targetRatio = W/H, imgRatio = iw/ih;
          let drawW, drawH;
          if (imgRatio > targetRatio) { drawH = H*scale; drawW = drawH*imgRatio; } else { drawW = W*scale; drawH = drawW/imgRatio; }
          ctx.drawImage(img, (W-drawW)/2, (H-drawH)/2, drawW, drawH);
        }
        const grad = ctx.createLinearGradient(0,H*0.6,0,H);
        grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,"rgba(0,0,0,0.8)");
        ctx.fillStyle = grad; ctx.fillRect(0,H*0.6,W,H*0.4);
        if (overlayText) { ctx.fillStyle="#fff"; ctx.font="bold 42px 'Segoe UI', sans-serif"; ctx.textAlign="center"; wrapText(ctx,overlayText,W/2,H-180,W-80,52); }
        if (price) {
          ctx.fillStyle = platform==="shopee"?SHOPEE_RED:"#FF0050"; ctx.fillRect(W/2-140,H-100,280,64);
          ctx.fillStyle="#fff"; ctx.font="bold 36px 'Segoe UI', sans-serif"; ctx.textAlign="center";
          ctx.fillText(`${price} เธเธฒเธ—${disc?` (-${disc}%)`:""}}`,W/2,H-56);
        }
        setProgress(Math.min(100,Math.round((elapsed/totalDuration)*100)));
        if (elapsed < totalDuration) requestAnimationFrame(frame); else resolveAll();
      }
      requestAnimationFrame(frame);
    });
    recorder.stop(); await stopped;
    const blob = new Blob(chunks, { type: mime });
    setVideoBlob(blob); setVideoUrl(URL.createObjectURL(blob)); setIsRendering(false);
  };

  const handleVideoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoBlob(file); setVideoFileName(file.name); setVideoUrl(URL.createObjectURL(file));
  };

  const shareVideo = async () => {
    if (!videoBlob) return;
    const captionText = captionForVideo || `${product} เธฃเธฒเธเธฒ ${price} เธเธฒเธ—`;
    try {
      const file = new File([videoBlob], videoFileName, { type: videoBlob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "ClipAI Post", text: captionText });
        setShareMsg("โ… เน€เธฃเธตเธขเธเธซเธเนเธฒเธฃเธฒเธขเธเธฒเธฃเนเธเธชเธ•เนเธชเธณเน€เธฃเนเธ");
      } else { setShareMsg("โ ๏ธ เธญเธธเธเธเธฃเธ“เนเนเธกเนเธฃเธญเธเธฃเธฑเธเธเธฒเธฃเนเธเธฃเนเนเธเธฅเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด เนเธซเนเธ”เธฒเธงเธเนเนเธซเธฅเธ”เธฅเธเน€เธเธฃเธทเนเธญเธเนเธฅเนเธงเนเธเธญเธฑเธเนเธซเธฅเธ”เน€เธญเธเธเธฃเธฑเธ"); }
    } catch { setShareMsg("โ ๏ธ เน€เธเธดเธ”เธเนเธญเธเธดเธ”เธเธฅเธฒเธ”เนเธเธเธฒเธฃเธชเนเธเนเธเธฅเน"); }
  };

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" "); let line = ""; const lines = [];
    for (const w of words) { const test = line + w + " "; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w + " "; } else line = test; }
    lines.push(line);
    lines.forEach((l,i) => ctx.fillText(l.trim(), x, y + i*lineHeight));
  }

  return (
    <div>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
        <button style={M.tab(mode==="generate")} onClick={()=>setMode("generate")}>๐–ผ๏ธ เธ—เธณเธเธฅเธดเธเธเธฒเธเธฃเธนเธ</button>
        <button style={M.tab(mode==="upload")} onClick={()=>setMode("upload")}>๐“ เธ”เธถเธเธเธฅเธดเธเธเธฒเธเน€เธเธฃเธทเนเธญเธ</button>
      </div>
      {mode==="generate" && (
        <div style={M.card}>
          <div style={M.cardT}>๐ฌ เธเธฅเธดเธ•เธเธฅเธดเธเธงเธดเธ”เธตเนเธญเธญเธญเนเธ•เน</div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles} />
          <button style={M.btnS} onClick={()=>fileInputRef.current?.click()} disabled={expired}>๐“ท เธญเธฑเธเนเธซเธฅเธ”เธฃเธนเธเธชเธดเธเธเนเธฒ (เธชเธนเธเธชเธธเธ” 10 เธฃเธนเธ)</button>
          {images.length>0 && (
            <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"12px"}}>
              {images.map((img,i)=>(
                <div key={i} style={{position:"relative",width:"60px",height:"85px",borderRadius:"6px",overflow:"hidden"}}>
                  <img src={img.url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                  <button style={{position:"absolute",top:0,right:0,background:"#000",color:"#fff",border:"none"}} onClick={()=>removeImage(i)}>โ•</button>
                </div>
              ))}
            </div>
          )}
          <div style={{marginTop:"14px"}}>
            <label style={M.label}>เธเธงเธฒเธกเน€เธฃเนเธงเธเธขเธฑเธเธ เธฒเธ (เธงเธดเธเธฒเธ—เธต / เธฃเธนเธ)</label>
            <input style={M.input} type="number" value={secPerImg} onChange={e=>setSecPerImg(Number(e.target.value))} />
            <label style={M.label}>เธ•เธฑเธงเธญเธฑเธเธฉเธฃเธงเธดเนเธเธเธฒเธ”เธซเธฑเธงเธงเธดเธ”เธตเนเธญ</label>
            <input style={M.input} value={overlayText} onChange={e=>setOverlayText(e.target.value)} />
          </div>
          <button style={{...M.btnP,opacity:isRendering?0.7:1}} onClick={renderVideo} disabled={isRendering||images.length===0}>
            {isRendering ? `โณ เธฃเธฐเธเธเธเธณเธฅเธฑเธเธเธฑเธ”เธเธดเธงเน€เธฃเธเน€เธ”เธญเธฃเน... ${progress}%` : "๐ฌ เธเธ”เน€เธฃเธดเนเธกเน€เธฃเธเน€เธ”เธญเธฃเนเธเธฅเธดเธ"}
          </button>
          <canvas ref={canvasRef} style={{display:"none"}} />
        </div>
      )}
      {mode==="upload" && (
        <div style={M.card}>
          <div style={M.cardT}>๐“ เนเธซเธฅเธ”เนเธเธฅเนเธ—เธตเนเธกเธตเธญเธขเธนเนเนเธฅเนเธงเน€เธเนเธฒเธชเธนเนเธฃเธฐเธเธ</div>
          <input ref={videoFileInputRef} type="file" accept="video/*" style={{display:"none"}} onChange={handleVideoFile} />
          <button style={M.btnS} onClick={()=>videoFileInputRef.current?.click()}>๐“ เน€เธฅเธทเธญเธเธเธฅเธดเธเธงเธดเธ”เธตเนเธญ</button>
        </div>
      )}
      {videoUrl && (
        <div style={M.card}>
          <div style={M.cardT}>๐ฅ เธ•เธฑเธงเธญเธขเนเธฒเธเธงเธดเธ”เธตเนเธญ & เธชเธฑเนเธเธเธฒเธเนเธเธช</div>
          <video src={videoUrl} controls style={{width:"100%",maxWidth:"220px",display:"block",margin:"0 auto",borderRadius:"10px"}} />
          <button style={{...M.btnP,marginTop:"14px"}} onClick={shareVideo}>๐“ฒ เธชเธฑเนเธเนเธเธฃเนเนเธเธฅเนเนเธเธขเธฑเธเนเธญเธเธกเธทเธญเธ–เธทเธญ</button>
          <a href={videoUrl} download={videoFileName} style={{display:"block",textAlign:"center",marginTop:"8px",background:"rgba(255,255,255,0.08)",color:TEXT_MAIN,borderRadius:"10px",padding:"11px",textDecoration:"none",fontSize:"14px",fontWeight:"bold"}}>โฌ๏ธ เธเธฑเธเธ—เธถเธเธฅเธเน€เธเธฃเธทเนเธญเธเธกเธทเธญเธ–เธทเธญ</a>
          {shareMsg && <div style={{marginTop:"10px",fontSize:"12px",background:"#000",padding:"8px",borderRadius:"6px"}}>{shareMsg}</div>}
        </div>
      )}
    </div>
  );
}

// โ”€โ”€โ”€ SETTINGS COMPONENT โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function SettingsComponent({ M }) {
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem("anthropic_api_key") || "");
  const [tiktokSession, setTiktokSession] = useState(() => localStorage.getItem("tiktok_session") || "");
  const [shopeeSession, setShopeeSession] = useState(() => localStorage.getItem("shopee_session") || "");
  const [delayInput, setDelayInput] = useState(() => localStorage.getItem("post_delay") || "60");
  const [autoRetry, setAutoRetry] = useState(true);

  const saveSettings = () => {
    localStorage.setItem("anthropic_api_key", apiKeyInput.trim());
    localStorage.setItem("tiktok_session", tiktokSession.trim());
    localStorage.setItem("shopee_session", shopeeSession.trim());
    localStorage.setItem("post_delay", delayInput);
    alert("๐’พ เธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒเธฃเธฐเธเธเน€เธฃเธตเธขเธเธฃเนเธญเธขเนเธฅเนเธงเธเธฃเธฑเธ!");
  };

  return (
    <div style={M.card}>
      <div style={M.cardT}>โ๏ธ เธ•เธฑเนเธเธเนเธฒเธเธตเธขเนเนเธญเธเธเธฅเธดเน€เธเธเธฑเธ & AI</div>
      <label style={M.label}>Anthropic API Key (เธชเธณเธซเธฃเธฑเธเธฃเธฐเธเธเน€เธเธตเธขเธเนเธเธชเธ•เนเธเธญเธ— AI)</label>
      <input style={M.input} type="password" placeholder="sk-ant-..." value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} />

      <div style={{marginTop:"20px",paddingTop:"20px",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
        <h3 style={{fontSize:"15px",fontWeight:"600",color:TEXT_MAIN,margin:"0 0 4px"}}>เธ•เธฑเนเธเธเนเธฒเธเธญเธ—เธญเธฑเธเนเธซเธฅเธ” & เธเธนเธเธเธฑเธเธเธต</h3>
        <p style={{fontSize:"11px",color:TEXT_MUTED,margin:"0 0 12px"}}>เธเธฑเธ”เธเธฒเธฃเธเธตเธขเนเธเธฒเธฃเน€เธเธทเนเธญเธกเธ•เนเธญเนเธฅเธฐเธซเธเนเธงเธเน€เธงเธฅเธฒเธเธฒเธฃเธ—เธณเธเธฒเธเธญเธฑเธ•เนเธเธกเธฑเธ•เธด</p>

        <div style={{background:"rgba(238,77,45,0.07)",border:"1px solid rgba(238,77,45,0.2)",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
          <label style={{...M.label,color:SHOPEE_ORANGE,fontWeight:"700"}}>๐งก Shopee Session / Cookie</label>
          <input type="password" placeholder="เธงเธฒเธ Shopee Session ID เธซเธฃเธทเธญ Cookie เธ—เธตเนเธเธตเน" value={shopeeSession} onChange={e=>setShopeeSession(e.target.value)} style={M.input}/>
        </div>

        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
          <label style={{...M.label,color:"#aaa",fontWeight:"700"}}>๐–ค TikTok Session / Cookie</label>
          <input type="password" placeholder="เธงเธฒเธ TikTok Session ID เธซเธฃเธทเธญ Cookie เธ—เธตเนเธเธตเน" value={tiktokSession} onChange={e=>setTiktokSession(e.target.value)} style={M.input}/>
        </div>

        <label style={M.label}>เธฃเธฐเธขเธฐเน€เธงเธฅเธฒเธซเธเนเธงเธเธฃเธฐเธซเธงเนเธฒเธเธเธฅเธดเธ (เธงเธดเธเธฒเธ—เธต)</label>
        <input type="number" min="30" value={delayInput} onChange={e=>setDelayInput(e.target.value)} placeholder="เนเธเธฐเธเธณ 60 เธงเธดเธเธฒเธ—เธตเธเธถเนเธเนเธ" style={M.input}/>

        <div style={{display:"flex",alignItems:"center",gap:"8px",margin:"14px 0"}}>
          <input type="checkbox" id="autoRetry" checked={autoRetry} onChange={e=>setAutoRetry(e.target.checked)} style={{width:"16px",height:"16px",cursor:"pointer"}}/>
          <label htmlFor="autoRetry" style={{fontSize:"12px",color:TEXT_MAIN,cursor:"pointer"}}>เน€เธเธดเธ”เนเธเนเธเธฒเธเธฅเธญเธเนเธซเธกเนเธญเธฑเธ•เนเธเธกเธฑเธ•เธด (Auto-Retry) เน€เธกเธทเนเธญเธเธญเธ—เธญเธฑเธเนเธซเธฅเธ”เธเธฑเธเธซเธฃเธทเธญเธซเธฅเธธเธ”เธเธดเธง</label>
        </div>
      </div>
      <button style={M.btnP} onClick={saveSettings}>๐’พ เธเธฑเธเธ—เธถเธเธเธฒเธฃเธ•เธฑเนเธเธเนเธฒเธ—เธฑเนเธเธซเธกเธ”</button>
    </div>
  );
}

// โ”€โ”€โ”€ VIDEO QUEUE MANAGER โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function VideoQueueManager({ M, platform }) {
  const [queueTab, setQueueTab] = useState(platform || "shopee");
  const [shopeeItems, setShopeeItems] = useState([
    { id: 1, videoFile: null, videoName: "", caption: "", status: "ready", queue: false, errorImg: "" },
  ]);
  const [tiktokItems, setTiktokItems] = useState([
    { id: 1, videoFile: null, videoName: "", caption: "", status: "ready", queue: false, errorImg: "" },
  ]);

  const items = queueTab === "shopee" ? shopeeItems : tiktokItems;
  const setItems = queueTab === "shopee" ? setShopeeItems : setTiktokItems;
  const videoRefs = useRef({});

  const addItem = () => {
    if (items.length >= 10) return alert("เน€เธเธดเนเธกเนเธ”เนเธชเธนเธเธชเธธเธ” 10 เธฃเธฒเธขเธเธฒเธฃเธเธฃเธฑเธ");
    setItems(prev => [...prev, { id: Date.now(), videoFile: null, videoName: "", caption: "", status: "ready", queue: false, errorImg: "" }]);
  };

  const removeItem = (id) => { if (items.length <= 1) return; setItems(prev => prev.filter(i => i.id !== id)); };

  const updateItem = (id, field, value) => { setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i)); };

  const handleVideoSelect = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateItem(id, "videoFile", file);
    updateItem(id, "videoName", file.name);
  };

  const toggleQueue = (id) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (!i.videoName) { alert("เธเธฃเธธเธ“เธฒเน€เธฅเธทเธญเธเธเธฅเธดเธเธงเธดเธ”เธตเนเธญเธเนเธญเธเธเธฃเธฑเธ"); return i; }
      return { ...i, queue: !i.queue, status: !i.queue ? "queued" : "ready" };
    }));
  };

  const queueAll = () => { setItems(prev => prev.map(i => i.videoName ? { ...i, queue: true, status: "queued" } : i)); };

  const platformColor = queueTab === "shopee" ? SHOPEE_RED : "#333";
  const platformLabel = queueTab === "shopee" ? "๐งก Shopee" : "๐–ค TikTok";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

      <div style={{display:"flex",background:"rgba(255,255,255,0.04)",padding:"4px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.08)"}}>
        <button onClick={()=>setQueueTab("shopee")} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",fontSize:"13px",fontWeight:"bold",cursor:"pointer",background:queueTab==="shopee"?SHOPEE_RED:"transparent",color:"#fff"}}>
          ๐งก เธเธดเธง Shopee ({shopeeItems.filter(i=>i.queue).length}/{shopeeItems.length})
        </button>
        <button onClick={()=>setQueueTab("tiktok")} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",fontSize:"13px",fontWeight:"bold",cursor:"pointer",background:queueTab==="tiktok"?"#222":"transparent",color:"#fff"}}>
          ๐–ค เธเธดเธง TikTok ({tiktokItems.filter(i=>i.queue).length}/{tiktokItems.length})
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
        {[["๐“ เธ—เธฑเนเธเธซเธกเธ”",items.length,TEXT_MUTED],["โณ เนเธเธเธดเธง",items.filter(i=>i.queue).length,SHOPEE_ORANGE],["โ… เธเธฃเนเธญเธก",items.filter(i=>!i.queue&&i.status==="ready").length,GREEN]].map(([label,val,color])=>(
          <div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{fontSize:"20px",fontWeight:"800",color}}>{val}</div>
            <div style={{fontSize:"10px",color:TEXT_MUTED}}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={addItem} disabled={items.length>=10}
          style={{flex:1,padding:"9px",borderRadius:"10px",border:`2px dashed ${platformColor}`,background:"transparent",color:platformColor,fontSize:"13px",fontWeight:"bold",cursor:"pointer",opacity:items.length>=10?0.4:1}}>
          โ• เน€เธเธดเนเธกเธฃเธฒเธขเธเธฒเธฃ ({items.length}/10)
        </button>
        <button onClick={queueAll}
          style={{flex:1,padding:"9px",borderRadius:"10px",border:"none",background:platformColor,color:"#fff",fontSize:"13px",fontWeight:"bold",cursor:"pointer"}}>
          <Layers size={13} style={{display:"inline",marginRight:4}}/>เธชเนเธเธ—เธฑเนเธเธซเธกเธ”เน€เธเนเธฒเธเธดเธง
        </button>
      </div>

      {items.map((item, idx) => (
        <div key={item.id} style={{background:BG_CARD,borderRadius:"14px",padding:"14px",border:`1px solid ${item.queue?"rgba(245,166,35,0.4)":"rgba(255,255,255,0.07)"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:item.queue?SHOPEE_ORANGE:TEXT_MAIN}}>
              {item.queue?"โณ":"๐“"} เธฃเธฒเธขเธเธฒเธฃเธ—เธตเน {idx+1}
              {item.queue && <span style={{fontSize:"10px",marginLeft:"6px",color:SHOPEE_ORANGE}}>(เธญเธขเธนเนเนเธเธเธดเธง)</span>}
            </div>
            <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
              {item.status==="failed" && (
                <button onClick={()=>alert(`URL เธฃเธนเธเธเธฑเธ: ${item.errorImg}`)}
                  style={{display:"flex",alignItems:"center",gap:"2px",background:"rgba(238,77,45,0.2)",color:"#FF8B8B",border:"1px solid rgba(238,77,45,0.4)",borderRadius:"4px",padding:"3px 7px",fontSize:"11px",cursor:"pointer"}}>
                  <Eye size={11}/> เธ”เธนเธฃเธนเธเธเธฑเธ
                </button>
              )}
              {items.length > 1 && (
                <button onClick={()=>removeItem(item.id)} style={{background:"rgba(231,76,60,0.15)",border:"none",color:"#e74c3c",borderRadius:"6px",padding:"3px 8px",fontSize:"12px",cursor:"pointer"}}>โ• เธฅเธ</button>
              )}
            </div>
          </div>

          <input ref={el=>videoRefs.current[item.id]=el} type="file" accept="video/*" style={{display:"none"}} onChange={e=>handleVideoSelect(item.id,e)}/>
          <button onClick={()=>videoRefs.current[item.id]?.click()}
            style={{width:"100%",padding:"9px",borderRadius:"8px",border:`1px dashed ${item.videoName?"rgba(39,174,96,0.5)":"rgba(255,255,255,0.15)"}`,background:item.videoName?"rgba(39,174,96,0.07)":"rgba(255,255,255,0.03)",color:item.videoName?GREEN:TEXT_MUTED,fontSize:"12px",cursor:"pointer",marginBottom:"8px",textAlign:"left"}}>
            {item.videoName ? `๐ฌ ${item.videoName}` : "๐“ เธเธ”เน€เธฅเธทเธญเธเนเธเธฅเนเธงเธดเธ”เธตเนเธญ..."}
          </button>

          <textarea
            placeholder="เธเธดเธกเธเนเธซเธฃเธทเธญเธงเธฒเธเนเธเธเธเธฑเนเธเธชเธณเธซเธฃเธฑเธเธเธฅเธดเธเธเธตเน..."
            value={item.caption}
            onChange={e=>updateItem(item.id,"caption",e.target.value)}
            rows={3}
            style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"9px 12px",color:TEXT_MAIN,fontSize:"12px",outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"'Segoe UI','Noto Sans Thai',sans-serif",marginBottom:"8px"}}
          />

          <button onClick={()=>toggleQueue(item.id)}
            style={{width:"100%",padding:"8px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"bold",cursor:"pointer",color:"#fff",background:item.queue?"#D35400":item.videoName?GREEN:"rgba(255,255,255,0.1)"}}>
            {item.queue
              ? <><ArrowLeft size={12} style={{display:"inline",marginRight:4}}/>เธ”เธถเธเธญเธญเธเธเธฒเธเธเธดเธง</>
              : <>เธชเนเธเน€เธเนเธฒเธเธดเธง {platformLabel} <ArrowRight size={12} style={{display:"inline",marginLeft:4}}/></>}
          </button>
        </div>
      ))}
    </div>
  );
}

// โ”€โ”€โ”€ UTILS โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€โ”€
function ResultBox({ text, id, copied, onCopy }) {
  return (
    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:"12px",padding:"14px",fontSize:"13px",lineHeight:"1.7",whiteSpace:"pre-wrap",color:TEXT_MAIN,marginTop:"10px",border:"1px solid rgba(255,255,255,0.07)",position:"relative"}}>
      {text}
      <button style={{position:"absolute",top:"10px",right:"10px",background:copied===id?"#27AE60":"rgba(255,255,255,0.1)",border:"none",borderRadius:"6px",padding:"4px 10px",color:"#fff",fontSize:"12px",cursor:"pointer"}}
        onClick={()=>onCopy(text,id)}>{copied===id?"โ“":"เธเธฑเธ”เธฅเธญเธ"}</button>
    </div>
  );
}

const MS = {
  app:{minHeight:"100vh",background:BG_DARK,color:TEXT_MAIN,paddingBottom:"40px",fontFamily:"'Segoe UI','Noto Sans Thai',sans-serif"},
  hdr:{padding:"18px 20px 14px",position:"relative",overflow:"hidden"},
  glow:{position:"absolute",top:"-50%",left:"50%",transform:"translateX(-50%)",width:"200%",height:"200%",background:"radial-gradient(ellipse,rgba(255,200,0,0.08) 0%,transparent 70%)",pointerEvents:"none"},
  logo:{fontSize:"24px",fontWeight:"900",margin:"0 0 2px"},
  badge:(c)=>({background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"20px",padding:"3px 10px",fontSize:"11px",color:c?c:"#fff",fontFamily:"monospace"}),
  body:{padding:"14px",maxWidth:"600px",margin:"0 auto"},
  card:{background:BG_CARD,borderRadius:"16px",padding:"16px",marginBottom:"12px",border:"1px solid rgba(255,255,255,0.07)"},
  cardT:{fontSize:"14px",fontWeight:"700",color:SHOPEE_ORANGE,marginBottom:"12px"},
  label:{display:"block",fontSize:"12px",color:TEXT_MUTED,marginBottom:"5px"},
  input:{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 14px",color:TEXT_MAIN,fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"10px"},
  tab:(a)=>({padding:"8px 16px",borderRadius:"10px",border:"none",fontSize:"12px",fontWeight:a?"700":"400",cursor:"pointer",background:a?SHOPEE_RED:"rgba(255,255,255,0.06)",color:a?"#fff":TEXT_MUTED,display:"inline-flex",alignItems:"center"}),
  tmplBtn:(a)=>({padding:"10px",borderRadius:"10px",border:a?`2px solid ${SHOPEE_RED}`:"1px solid rgba(255,255,255,0.1)",background:a?"rgba(238,77,45,0.15)":"rgba(255,255,255,0.03)",color:a?"#fff":TEXT_MUTED,fontSize:"13px",cursor:"pointer"}),
  chip:{display:"inline-block",background:"rgba(245,166,35,0.12)",border:"1px solid rgba(245,166,35,0.25)",borderRadius:"20px",padding:"4px 10px",fontSize:"11px",color:SHOPEE_ORANGE,margin:"0 4px 4px 0",cursor:"pointer"},
  btnP:{width:"100%",background:`linear-gradient(135deg,${SHOPEE_RED},#C0392B)`,color:"#fff",border:"none",borderRadius:"10px",padding:"11px",fontSize:"14px",fontWeight:"700",cursor:"pointer",marginTop:"10px"},
  btnS:{width:"100%",background:`linear-gradient(135deg,${SHOPEE_ORANGE},#E67E22)`,color:"#fff",border:"none",borderRadius:"10px",padding:"11px",fontSize:"14px",fontWeight:"700",cursor:"pointer"},
};
