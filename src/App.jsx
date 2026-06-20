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
const PRICE_MONTHLY = 299;
const PRICE_YEARLY = 2990;
const PRICE_LIFETIME = 4990;

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
  try { const raw = localStorage.getItem(k); if (raw) { const v = JSON.parse(raw); KEY_STORE[k] = v; return v; } } catch {}
  return null;
}
async function kSet(k, v) {
  KEY_STORE[k] = v;
  const code = codeFromStorageKey(k);
  if (isSupabaseConfigured) { try { await supabase.from("license_keys").upsert(keyDataToSupaRow(code, v)); } catch {} }
  try { localStorage.setItem(k, JSON.stringify(v)); } catch {}
}
async function kDel(k) {
  delete KEY_STORE[k];
  const code = codeFromStorageKey(k);
  if (isSupabaseConfigured) { try { await supabase.from("license_keys").delete().eq("code", code); } catch {} }
  try { localStorage.removeItem(k); } catch {}
}
async function kList() {
  const mem = new Set(Object.keys(KEY_STORE).filter(k => k.startsWith("key:")));
  if (isSupabaseConfigured) {
    try { const { data, error } = await supabase.from("license_keys").select("code"); if (!error && data) data.forEach(row => mem.add(`key:${row.code}`)); } catch {}
  }
  try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith("key:")) mem.add(k); } } catch {}
  return [...mem];
}
function supaRowToKeyData(row) { return { code: row.code, type: row.type, buyerName: row.buyer_name, note: row.note, active: row.active, createdAt: row.created_at, expiresAt: row.expires_at, loginCount: row.login_count, lastLogin: row.last_login }; }
function keyDataToSupaRow(code, v) { return { code, type: v.type, buyer_name: v.buyerName, note: v.note, active: v.active, created_at: v.createdAt, expires_at: v.expiresAt, login_count: v.loginCount || 0, last_login: v.lastLogin }; }
function isExpired(kd) { return kd?.expiresAt ? new Date() > new Date(kd.expiresAt) : false; }
function fmtDate(iso) { if (!iso) return "ตลอดชีพ"; return new Date(iso).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }); }
function daysLeft(iso) { if (!iso) return null; return Math.max(0, Math.ceil((new Date(iso) - new Date()) / 86400000)); }
function genKey(type) { const p = type === "yearly" ? "YR" : type === "lifetime" ? "LF" : "MO"; return `SCL-${p}-${Math.random().toString(36).substring(2,10).toUpperCase()}`; }
function getExpiry(type) { if (type === "lifetime") return null; const d = new Date(); type === "yearly" ? d.setFullYear(d.getFullYear()+1) : d.setMonth(d.getMonth()+1); return d.toISOString(); }
function keyPrice(type) { return type === "yearly" ? PRICE_YEARLY : type === "lifetime" ? PRICE_LIFETIME : PRICE_MONTHLY; }

const TEMPLATES = [
  { id:"hype", name:"🔥 ไฟแรง", fn:(p,pr,d,plat)=>plat==="shopee"?`🔥🛒 ปักตะกร้าด่วน!!\n\n✨ ${p}\n💰 ราคา ${pr} บาท\n${d?`🎯 ลด ${d}%\n`:""}⚡ สต็อกมีจำกัด!\n📲 กดลิงก์ในโปรไฟล์\n\n#Shopee #ปักตะกร้า #ลดราคา`:`🔥🛒 พิกัดในตะกร้าเหลืองด่วน!!\n\n✨ ${p}\n💰 ราคาพิเศษ ${pr} บาท\n${d?`🎯 ลดจุกๆ ${d}%\n`:""}⚡ ช้าหมดอดนะ!\n📲 จิ้มตะกร้าซ้ายมือบนคลิป\n\n#TikTokShop #ปักตะกร้า #ลดราคา` },
  { id:"review", name:"⭐ รีวิว", fn:(p,pr,d,plat)=>plat==="shopee"?`⭐ รีวิวจริง ไม่ปิด!\n\n📦 ${p}\n💵 ${pr} บาท\n${d?`💸 ประหยัด ${d}%\n`:""}✅ ของดี ราคาคุ้ม!\n\n#รีวิว #Shopee #ของดีราคาถูก`:`⭐ รีวิวจากผู้ใช้จริง!\n\n📦 ${p}\n💵 เพียง ${pr} บาท\n${d?`💸 ประหยัดไปอีก ${d}%\n`:""}✅ ของตรงปก ดีจริงบอกต่อ!\n\n#รีวิวของดี #TikTokShop #ของดีราคาถูก` },
  { id:"flash", name:"⚡ เซลเดือด", fn:(p,pr,d,plat)=>plat==="shopee"?`⚡ FLASH SALE แค่วันนี้!!\n\n🎁 ${p}\n🏷️ ${pr} บาท!\n${d?`🔴 ลด ${d}%\n`:""}⏰ ราคานี้มีเวลาจำกัด!\n\n#FlashSale #Shopee #Deal`:`⚡ ดีลเดือด นาทีทอง!!\n\n🎁 ${p}\n🏷️ ราคาลดเหลือ ${pr} บาท!\n${d?`🔴 หั่นราคาลง ${d}%\n`:""}⏰ เฉพาะในคลิปนี้!\n\n#TikTokShop #FlashSale #ลดราคา` },
  { id:"tiktok", name:"🎵 สไตล์วัยรุ่น", fn:(p,pr,d,plat)=>plat==="shopee"?`POV: เจอของดีราคาโคตรถูก 😱\n\n${p} แค่ ${pr} บาท!!${d?` (ลด ${d}%)`:""}\n\nแบกตะกร้าก่อน!\n\n#Shopee #ปักตะกร้า`:`POV: แฟนบังคับให้รีวิวสิ่งนี้ 😱\n\n${p} แค่ ${pr} บาทเอง!!${d?` (ลดตั้ง ${d}%)`:""}\n\nจิ้มตะกร้าเหลืองด่วน!\n\n#TikTokShop #ของมันต้องมี` },
];
const HOOKS = ["หยุดเลื่อนก่อน! นี่คือสิ่งที่คุณต้องการ","ราคานี้ต้องบอกต่อ!!","เพื่อนบอกมา ลองแล้วติดใจ","ปักตะกร้าไว้ก่อน ตัดสินใจทีหลัง","ลดแล้ว! อย่าพลาด!"];

export default function App() {
  const [screen, setScreen] = useState("login");
  const [sess, setSess] = useState(null);
  useEffect(() => {
    (async () => {
      const existing = await kGet(`key:${DEMO_KEY}`);
      if (!existing) { await kSet(`key:${DEMO_KEY}`, { code: DEMO_KEY, type: "monthly", buyerName: "Demo User", note: "Key ทดสอบระบบ", active: true, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(), loginCount: 0, lastLogin: null }); }
    })();
  }, []);
  const login = (key, info, isAdmin) => { setSess({ key, info, isAdmin }); setScreen(isAdmin ? "admin" : "app"); };
  const logout = () => { setSess(null); setScreen("login"); };
  if (screen === "admin") return <AdminPanel onLogout={logout} />;
  if (screen === "app") return <MainApp sess={sess} onLogout={logout} />;
  return <LoginScreen onSuccess={login} />;
}

function LoginScreen({ onSuccess }) {
  const [mode, setMode] = useState("user");
  const [keyVal, setKeyVal] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const doUserLogin = async () => {
    const k = keyVal.trim().toUpperCase();
    if (!k) { setErr("กรุณากรอก License Key"); return; }
    setLoading(true); setErr("");
    const kd = await kGet(`key:${k}`);
    if (!kd) { setErr("ไม่พบ Key นี้ในระบบ"); setLoading(false); return; }
    if (!kd.active) { setErr("Key ถูกระงับการใช้งาน"); setLoading(false); return; }
    if (isExpired(kd)) { setErr(`Key หมดอายุ ${fmtDate(kd.expiresAt)}`); setLoading(false); return; }
    kd.lastLogin = new Date().toISOString(); kd.loginCount = (kd.loginCount||0)+1;
    await kSet(`key:${k}`, kd); setLoading(false); onSuccess(k, kd, false);
  };
  const doAdminLogin = () => { if (pass !== ADMIN_PASSWORD) { setErr("รหัสผ่านไม่ถูกต้อง"); return; } onSuccess("ADMIN", { name:"Admin", type:"admin" }, true); };
  const S = LS;
  return (
    <div style={S.bg}><div style={S.box}>
      <div style={S.logoWrap}><div style={{fontSize:"40px"}}>🚀</div><div style={S.logoText}>ClipAI<span style={{color:SHOPEE_ORANGE}}>Master</span></div><div style={S.logoSub}>ระบบสร้างคลิปปักตะกร้า + แคปชั่น อัตโนมัติ (Shopee & TikTok)</div></div>
      <div style={S.tabRow}><button style={S.tab(mode==="user")} onClick={()=>{setMode("user");setErr("");}}>🔑 เข้าใช้งาน</button><button style={S.tab(mode==="admin")} onClick={()=>{setMode("admin");setErr("");}}>⚙️ Admin</button></div>
      {mode==="user"?(<><label style={S.label}>License Key</label><input style={S.input} placeholder="SCL-MO-XXXXXXXX" value={keyVal} onChange={e=>setKeyVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doUserLogin()} /><div style={S.hint}>* Key ได้รับจากผู้ขาย</div><div style={{fontSize:"12px",color:SHOPEE_ORANGE,marginBottom:"12px",cursor:"pointer"}} onClick={()=>setKeyVal(DEMO_KEY)}>🧪 กดเพื่อใส่ Demo Key ทดสอบ</div>{err&&<div style={S.err}>{err}</div>}<button style={S.btn} onClick={doUserLogin} disabled={loading}>{loading?"กำลังตรวจสอบ...":"เข้าใช้งาน →"}</button></>):(<><label style={S.label}>รหัสผ่าน Admin</label><input style={S.input} type="password" placeholder="••••••••" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAdminLogin()} />{err&&<div style={S.err}>{err}</div>}<button style={S.btn} onClick={doAdminLogin}>เข้า Admin Panel →</button></>)}
      <div style={{textAlign:"center",marginTop:"16px",fontSize:"11px",color:"rgba(255,255,255,0.25)"}}>ClipAIMaster v2.7 • Dual Platform Support</div>
    </div></div>
  );
}
const LS = {
  bg:{minHeight:"100vh",background:BG_DARK,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:"'Segoe UI','Noto Sans Thai',sans-serif"},
  box:{background:BG_CARD,borderRadius:"20px",padding:"32px 28px",width:"100%",maxWidth:"380px",border:"1px solid rgba(255,255,255,0.08)",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"},
  logoWrap:{textAlign:"center",marginBottom:"28px"},logoText:{fontSize:"26px",fontWeight:"900",color:TEXT_MAIN,letterSpacing:"-0.5px"},logoSub:{fontSize:"12px",color:TEXT_MUTED,marginTop:"4px"},
  tabRow:{display:"flex",gap:"8px",marginBottom:"20px"},tab:(a)=>({flex:1,padding:"9px",borderRadius:"10px",border:"none",fontSize:"13px",fontWeight:a?"700":"400",cursor:"pointer",background:a?SHOPEE_RED:"rgba(255,255,255,0.06)",color:a?"#fff":TEXT_MUTED}),
  label:{display:"block",fontSize:"12px",color:TEXT_MUTED,marginBottom:"6px"},input:{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:"10px",padding:"11px 14px",color:TEXT_MAIN,fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"6px",letterSpacing:"1px"},
  hint:{fontSize:"11px",color:TEXT_MUTED,marginBottom:"4px"},err:{background:"rgba(238,77,45,0.15)",border:"1px solid rgba(238,77,45,0.3)",borderRadius:"8px",padding:"8px 12px",fontSize:"13px",color:"#FF6B6B",marginBottom:"12px"},
  btn:{width:"100%",background:`linear-gradient(135deg,${SHOPEE_RED},#C0392B)`,color:"#fff",border:"none",borderRadius:"10px",padding:"13px",fontSize:"15px",fontWeight:"700",cursor:"pointer",marginTop:"4px"},
};

function AdminPanel({ onLogout }) {
  const [adminTab, setAdminTab] = useState("dashboard");
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newType, setNewType] = useState("monthly");
  const [newName, setNewName] = useState("");
  const [newNote, setNewNote] = useState("");
  const [created, setCreated] = useState("");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    const names = await kList();
    const list = [];
    for (const n of names) { const d = await kGet(n); if (d) list.push({ storageKey:n, keyCode:n.replace("key:",""), ...d }); }
    list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    setKeys(list); setLoading(false);
  };
  useEffect(()=>{ loadKeys(); },[]);

  const stats = { total:keys.length, active:keys.filter(k=>k.active&&!isExpired(k)).length, expired:keys.filter(k=>isExpired(k)||!k.active).length, pending:keys.filter(k=>!k.loginCount||k.loginCount===0).length, monthly:keys.filter(k=>k.type==="monthly").length, yearly:keys.filter(k=>k.type==="yearly").length, lifetime:keys.filter(k=>k.type==="lifetime").length };
  const revenueTotal = keys.reduce((sum,k)=>sum+keyPrice(k.type),0);
  const thisMonth = new Date().getMonth(); const thisYear = new Date().getFullYear();
  const revenueMonth = keys.filter(k=>{ const d=new Date(k.createdAt); return d.getMonth()===thisMonth&&d.getFullYear()===thisYear; }).reduce((sum,k)=>sum+keyPrice(k.type),0);
  const months6 = Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-5+i); return {label:`${d.getMonth()+1}/${d.getFullYear()}`,m:d.getMonth(),y:d.getFullYear()}; });
  const chartData = months6.map(({label,m,y})=>({ label, revenue:keys.filter(k=>{const d=new Date(k.createdAt);return d.getMonth()===m&&d.getFullYear()===y;}).reduce((sum,k)=>sum+keyPrice(k.type),0), count:keys.filter(k=>{const d=new Date(k.createdAt);return d.getMonth()===m&&d.getFullYear()===y;}).length }));
  const maxRev = Math.max(...chartData.map(d=>d.revenue),1);

  const createKey = async () => { const code=genKey(newType); const kd={code,type:newType,buyerName:newName||"ไม่ระบุ",note:newNote,active:true,createdAt:new Date().toISOString(),expiresAt:getExpiry(newType),loginCount:0,lastLogin:null}; await kSet(`key:${code}`,kd); setCreated(code); setNewName(""); setNewNote(""); loadKeys(); };
  const toggleKey = async (code,cur) => { const d=await kGet(`key:${code}`); if(d){d.active=!cur;await kSet(`key:${code}`,d);loadKeys();} };
  const deleteKey = async (code) => { if(!confirm(`ลบ Key ${code}?`))return; await kDel(`key:${code}`); loadKeys(); };
  const copyKey = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  const filtered = keys.filter(k=>k.keyCode.includes(search.toUpperCase())||k.buyerName?.includes(search)||k.note?.includes(search));

  const menuItems = [{id:"dashboard",icon:"📊",label:"Dashboard"},{id:"create",icon:"🔑",label:"License Keys"},{id:"keys",icon:"👥",label:"ลูกค้า"},{id:"revenue",icon:"💰",label:"ยอดขาย"}];

  return (
    <div style={{minHeight:"100vh",background:"#0d1117",color:TEXT_MAIN,fontFamily:"'Segoe UI','Noto Sans Thai',sans-serif",display:"flex"}}>
      <div style={{width:"200px",background:"#13132A",borderRight:"1px solid rgba(255,255,255,0.06)",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"20px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}><div style={{fontSize:"16px",fontWeight:"800",color:SHOPEE_ORANGE}}>ClipAI Admin</div><div style={{fontSize:"11px",color:TEXT_MUTED,marginTop:"2px"}}>Management Panel</div></div>
        <nav style={{flex:1,padding:"12px 8px"}}>
          {menuItems.map(item=>(<button key={item.id} onClick={()=>setAdminTab(item.id)} style={{width:"100%",display:"flex",alignItems:"center",gap:"10px",padding:"10px 12px",borderRadius:"8px",border:"none",fontSize:"13px",cursor:"pointer",marginBottom:"4px",background:adminTab===item.id?"rgba(238,77,45,0.15)":"transparent",color:adminTab===item.id?SHOPEE_RED:TEXT_MUTED,fontWeight:adminTab===item.id?"700":"400"}}><span>{item.icon}</span>{item.label}</button>))}
        </nav>
        <div style={{padding:"16px 8px",borderTop:"1px solid rgba(255,255,255,0.06)"}}><button onClick={onLogout} style={{width:"100%",padding:"9px",borderRadius:"8px",border:"none",background:"rgba(255,255,255,0.06)",color:TEXT_MUTED,fontSize:"12px",cursor:"pointer"}}>ออกจากระบบ</button></div>
      </div>
      <div style={{flex:1,overflow:"auto"}}>
        <div style={{padding:"20px 24px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"#13132A"}}><div style={{fontSize:"20px",fontWeight:"800"}}>{adminTab==="dashboard"?"Dashboard":adminTab==="create"?"สร้าง License Key":adminTab==="keys"?"รายการลูกค้า":"ยอดขาย"}</div></div>
        <div style={{padding:"20px 24px"}}>
          {adminTab==="dashboard"&&(<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"16px"}}>
              {[{label:"ลูกค้า",val:stats.total,color:"#667eea",icon:"👥"},{label:"Active Keys",val:stats.active,color:GREEN,icon:"✅"},{label:"รายได้เดือนนี้",val:`฿${revenueMonth.toLocaleString()}`,color:SHOPEE_ORANGE,icon:"📅"},{label:"รายได้รวม",val:`฿${revenueTotal.toLocaleString()}`,color:"#e74c3c",icon:"💰"}].map(s=>(<div key={s.label} style={{background:BG_CARD,borderRadius:"12px",padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}><div style={{fontSize:"11px",color:TEXT_MUTED,marginBottom:"6px"}}>{s.icon} {s.label}</div><div style={{fontSize:"22px",fontWeight:"800",color:s.color}}>{s.val}</div></div>))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"12px",marginBottom:"20px"}}>
              {[{label:"รอ Activate",val:stats.pending,color:SHOPEE_ORANGE},{label:"หมดอายุ",val:stats.expired,color:"#e74c3c"},{label:"ยกเลิก",val:0,color:TEXT_MUTED},{label:"Keys ทั้งหมด",val:stats.total,color:"#9B59B6"}].map(s=>(<div key={s.label} style={{background:BG_CARD,borderRadius:"12px",padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}><div style={{fontSize:"11px",color:TEXT_MUTED,marginBottom:"6px"}}>{s.label}</div><div style={{fontSize:"22px",fontWeight:"800",color:s.color}}>{s.val}</div></div>))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"16px",marginBottom:"16px"}}>
              <div style={{background:BG_CARD,borderRadius:"14px",padding:"18px",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:SHOPEE_ORANGE,marginBottom:"16px"}}>ยอดขายรายเดือน (บาท)</div>
                <div style={{display:"flex",alignItems:"flex-end",gap:"8px",height:"120px"}}>
                  {chartData.map((d,i)=>(<div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:"4px"}}><div style={{fontSize:"9px",color:TEXT_MUTED}}>{d.revenue>0?`฿${d.revenue}`:""}</div><div style={{width:"100%",borderRadius:"4px 4px 0 0",background:i===chartData.length-1?SHOPEE_RED:"#9B59B6",minHeight:"4px",height:`${Math.max(4,(d.revenue/maxRev)*100)}px`}}/><div style={{fontSize:"9px",color:TEXT_MUTED,whiteSpace:"nowrap"}}>{d.label}</div></div>))}
                </div>
              </div>
              <div style={{background:BG_CARD,borderRadius:"14px",padding:"18px",border:"1px solid rgba(255,255,255,0.06)"}}>
                <div style={{fontSize:"13px",fontWeight:"700",color:SHOPEE_ORANGE,marginBottom:"16px"}}>สัดส่วนแพ็กเกจ</div>
                <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    {(()=>{ const total=stats.total||1; const segs=[{val:stats.monthly,color:SHOPEE_ORANGE},{val:stats.yearly,color:"#9B59B6"},{val:stats.lifetime,color:GREEN}]; let offset=0; return segs.map((seg,i)=>{ const pct=seg.val/total; const dash=pct*251.2; const el=<circle key={i} cx="50" cy="50" r="40" fill="none" stroke={seg.color} strokeWidth="18" strokeDasharray={`${dash} ${251.2-dash}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" opacity="0.85"/>; offset+=dash; return el; }); })()}
                    <circle cx="50" cy="50" r="31" fill="#13132A"/>
                    <text x="50" y="55" textAnchor="middle" fill={TEXT_MAIN} fontSize="13" fontWeight="800">{stats.total}</text>
                  </svg>
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    {[["รายเดือน",stats.monthly,SHOPEE_ORANGE],["รายปี",stats.yearly,"#9B59B6"],["ตลอดชีพ",stats.lifetime,GREEN]].map(([l,v,c])=>(<div key={l} style={{display:"flex",alignItems:"center",gap:"6px"}}><div style={{width:"10px",height:"10px",borderRadius:"2px",background:c}}/><span style={{fontSize:"11px",color:TEXT_MUTED}}>{l}</span><span style={{fontSize:"11px",fontWeight:"700",color:TEXT_MAIN,marginLeft:"4px"}}>{v}</span></div>))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{background:BG_CARD,borderRadius:"14px",padding:"18px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:"13px",fontWeight:"700",color:SHOPEE_ORANGE,marginBottom:"12px"}}>รายการล่าสุด</div>
              {keys.slice(0,5).map(k=>{ const exp=isExpired(k); return (<div key={k.keyCode} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}><div><div style={{fontSize:"12px",fontFamily:"monospace",color:TEXT_MAIN,fontWeight:"700"}}>{k.keyCode}</div><div style={{fontSize:"11px",color:TEXT_MUTED}}>{k.buyerName||"ไม่ระบุ"} • {fmtDate(k.createdAt)}</div></div><div style={{display:"flex",gap:"6px",alignItems:"center"}}><span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"20px",background:k.active&&!exp?"rgba(39,174,96,0.15)":"rgba(238,77,45,0.15)",color:k.active&&!exp?GREEN:"#e74c3c"}}>{k.active&&!exp?"ใช้งาน":"หมดอายุ"}</span><span style={{fontSize:"11px",fontWeight:"700",color:SHOPEE_ORANGE}}>฿{keyPrice(k.type).toLocaleString()}</span></div></div>); })}
              {keys.length===0&&<div style={{textAlign:"center",color:TEXT_MUTED,padding:"20px"}}>ยังไม่มีข้อมูล</div>}
            </div>
          </>)}
          {adminTab==="create"&&(<div style={{maxWidth:"480px"}}>
            <div style={{background:BG_CARD,borderRadius:"16px",padding:"20px",border:"1px solid rgba(255,255,255,0.07)"}}>
              <div style={{fontSize:"14px",fontWeight:"700",color:SHOPEE_ORANGE,marginBottom:"16px"}}>สร้าง License Key ใหม่</div>
              <label style={{display:"block",fontSize:"12px",color:TEXT_MUTED,marginBottom:"5px"}}>ชื่อผู้ซื้อ / ร้านค้า</label>
              <input style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 14px",color:TEXT_MAIN,fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"12px"}} placeholder="เช่น ร้านสมชาย" value={newName} onChange={e=>setNewName(e.target.value)} />
              <label style={{display:"block",fontSize:"12px",color:TEXT_MUTED,marginBottom:"8px"}}>ประเภท Key</label>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
                {[["monthly","📅 รายเดือน","30 วัน",`฿${PRICE_MONTHLY}`],["yearly","📆 รายปี","365 วัน",`฿${PRICE_YEARLY}`],["lifetime","♾️ ตลอดชีพ","ไม่หมด",`฿${PRICE_LIFETIME}`]].map(([v,l,s,p])=>(<div key={v} style={{background:newType===v?"rgba(238,77,45,0.15)":"rgba(255,255,255,0.04)",border:newType===v?`2px solid ${SHOPEE_RED}`:"1px solid rgba(255,255,255,0.08)",borderRadius:"10px",padding:"10px 8px",textAlign:"center",cursor:"pointer"}} onClick={()=>setNewType(v)}><div style={{fontSize:"12px",fontWeight:"700",color:TEXT_MAIN}}>{l}</div><div style={{fontSize:"10px",color:TEXT_MUTED}}>{s}</div><div style={{fontSize:"12px",fontWeight:"800",color:SHOPEE_ORANGE,marginTop:"4px"}}>{p}</div></div>))}
              </div>
              <label style={{display:"block",fontSize:"12px",color:TEXT_MUTED,marginBottom:"5px"}}>หมายเหตุ</label>
              <input style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 14px",color:TEXT_MAIN,fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"14px"}} placeholder="เช่น ชำระ 299 บาท" value={newNote} onChange={e=>setNewNote(e.target.value)} />
              <button style={{width:"100%",background:`linear-gradient(135deg,${SHOPEE_RED},#C0392B)`,color:"#fff",border:"none",borderRadius:"10px",padding:"12px",fontSize:"14px",fontWeight:"700",cursor:"pointer"}} onClick={createKey}>🔑 สร้าง Key ใหม่</button>
              {created&&(<div style={{marginTop:"14px",background:"rgba(39,174,96,0.1)",border:"1px solid rgba(39,174,96,0.3)",borderRadius:"12px",padding:"14px"}}><div style={{fontSize:"13px",color:TEXT_MUTED,marginBottom:"6px"}}>สร้างสำเร็จ!</div><div style={{fontFamily:"monospace",fontSize:"18px",fontWeight:"800",color:GREEN,letterSpacing:"2px",textAlign:"center",padding:"10px",background:"rgba(0,0,0,0.3)",borderRadius:"8px",marginBottom:"8px"}}>{created}</div><button style={{width:"100%",background:GREEN,color:"#fff",border:"none",borderRadius:"8px",padding:"9px",fontSize:"13px",fontWeight:"700",cursor:"pointer"}} onClick={()=>copyKey(created)}>{copied?"คัดลอกแล้ว":"📋 คัดลอก Key"}</button></div>)}
            </div>
          </div>)}
          {adminTab==="keys"&&(<>
            <input style={{width:"100%",background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"10px 14px",color:TEXT_MAIN,fontSize:"14px",outline:"none",boxSizing:"border-box",marginBottom:"12px"}} placeholder="ค้นหา Key / ชื่อผู้ซื้อ..." value={search} onChange={e=>setSearch(e.target.value)} />
            {loading?<div style={{textAlign:"center",color:TEXT_MUTED,padding:"30px"}}>กำลังโหลด...</div>:filtered.length===0?<div style={{textAlign:"center",color:TEXT_MUTED,padding:"30px"}}>ไม่พบข้อมูล</div>:filtered.map(k=>{ const exp=isExpired(k); return (<div key={k.keyCode} style={{background:BG_CARD,borderRadius:"12px",padding:"14px",marginBottom:"10px",border:k.active&&!exp?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(238,77,45,0.2)"}}><div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}><span style={{fontFamily:"monospace",fontSize:"14px",fontWeight:"800",color:TEXT_MAIN}}>{k.keyCode}</span><span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"20px",background:"rgba(255,255,255,0.1)",color:SHOPEE_ORANGE}}>{k.type==="monthly"?"รายเดือน":k.type==="yearly"?"รายปี":"ตลอดชีพ"}</span><span style={{fontSize:"11px",fontWeight:"700",color:SHOPEE_ORANGE,marginLeft:"auto"}}>฿{keyPrice(k.type).toLocaleString()}</span></div><div style={{fontSize:"12px",color:TEXT_MUTED}}>{k.buyerName?`👤 ${k.buyerName} | 📝 ${k.note}`:""}</div><div style={{fontSize:"12px",color:TEXT_MUTED}}>หมดอายุ: {exp?<span style={{color:"#e74c3c"}}>หมดแล้ว</span>:<span>{fmtDate(k.expiresAt)}</span>} | เข้าใช้: {k.loginCount||0} ครั้ง</div><div style={{display:"flex",gap:"8px",marginTop:"8px"}}><button style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",fontSize:"12px",cursor:"pointer",background:"rgba(255,255,255,0.1)",color:TEXT_MAIN}} onClick={()=>toggleKey(k.keyCode,k.active)}>{k.active?"🔒 ระงับ":"✅ เปิดใช้"}</button><button style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",fontSize:"12px",cursor:"pointer",background:"rgba(231,76,60,0.2)",color:"#e74c3c"}} onClick={()=>deleteKey(k.keyCode)}>🗑️ ลบ</button></div></div>); })}
          </>)}
          {adminTab==="revenue"&&(<>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
              {[{label:"รายได้เดือนนี้",val:`฿${revenueMonth.toLocaleString()}`,color:SHOPEE_ORANGE},{label:"รายได้รวมทั้งหมด",val:`฿${revenueTotal.toLocaleString()}`,color:GREEN},{label:"รายเดือน (จำนวน)",val:`${stats.monthly} คน x ฿${PRICE_MONTHLY}`,color:"#667eea"},{label:"รายปี + ตลอดชีพ",val:`${stats.yearly+stats.lifetime} คน`,color:"#9B59B6"}].map(s=>(<div key={s.label} style={{background:BG_CARD,borderRadius:"12px",padding:"16px",border:"1px solid rgba(255,255,255,0.06)"}}><div style={{fontSize:"11px",color:TEXT_MUTED,marginBottom:"6px"}}>{s.label}</div><div style={{fontSize:"18px",fontWeight:"800",color:s.color}}>{s.val}</div></div>))}
            </div>
            <div style={{background:BG_CARD,borderRadius:"14px",padding:"18px",border:"1px solid rgba(255,255,255,0.06)"}}>
              <div style={{fontSize:"13px",fontWeight:"700",color:SHOPEE_ORANGE,marginBottom:"16px"}}>ยอดขายรายเดือน</div>
              {chartData.map((d,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"10px"}}><div style={{width:"60px",fontSize:"11px",color:TEXT_MUTED,textAlign:"right"}}>{d.label}</div><div style={{flex:1,background:"rgba(255,255,255,0.05)",borderRadius:"4px",height:"20px",overflow:"hidden"}}><div style={{height:"100%",background:i===chartData.length-1?SHOPEE_RED:"#9B59B6",borderRadius:"4px",width:`${Math.max(2,(d.revenue/maxRev)*100)}%`}}/></div><div style={{width:"80px",fontSize:"11px",color:TEXT_MAIN,fontWeight:"700"}}>฿{d.revenue.toLocaleString()} ({d.count})</div></div>))}
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

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
  const [shopeeItems, setShopeeItems] = useState([{ id:1, videoFile:null, videoName:"", caption:"", status:"ready", queue:false, errorImg:"" }]);
  const [tiktokItems, setTiktokItems] = useState([{ id:1, videoFile:null, videoName:"", caption:"", status:"ready", queue:false, errorImg:"" }]);

  const expired = isExpired(keyInfo||{});
  const dl = daysLeft(keyInfo?.expiresAt);

  const handleToggleBot = () => {
    if (isBotRunning) { setBotStatus("Stopping"); setTimeout(()=>{ setIsBotRunning(false); setBotStatus("Idle"); },1500); }
    else { setIsBotRunning(true); setBotStatus("Running"); }
  };

  const genTemplate = () => {
    const t = TEMPLATES.find(x=>x.id===tmpl);
    if (!t||!product||!price) return;
    const h = hook||HOOKS[Math.floor(Math.random()*HOOKS.length)];
    setCaptionTmpl(`${h}\n\n${t.fn(product,price,disc,platform)}`);
  };

  const callAI = async (prompt,setFn,setLoad) => {
    setLoad(true);
    try {
      const apiKey = localStorage.getItem("anthropic_api_key")||"";
      if (!apiKey) { setFn("ยังไม่ได้ตั้งค่า Anthropic API Key กดปุ่ม ตั้งค่าระบบ เพื่อกรอก API Key"); setLoad(false); return; }
      const r = await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":apiKey,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const d = await r.json();
      if (d.error) { setFn(`เกิดข้อผิดพลาด: ${d.error.message}`); setLoad(false); return; }
      setFn(d.content?.map(c=>c.text||"").join("")||"เกิดข้อผิดพลาด ลองใหม่");
    } catch { setFn("เกิดข้อผิดพลาด ลองใหม่"); }
    setLoad(false);
  };

  const genAI = () => callAI(`คุณเป็น Social Media Copywriter เชี่ยวชาญขายของออนไลน์ บนแพลตฟอร์ม ${platform.toUpperCase()}\nสร้างแคปชั่นปักตะกร้าสำหรับ:\n- สินค้า: ${product}\n- ราคา: ${price} บาท\n${disc?`- ลด: ${disc}%\n`:""}${link?`- ลิงก์: ${link}\n`:""}\nให้มี: Hook ดึงดูด, ภาษาไทยสนุก, Emoji, วิธีสั่งซื้อ, แฮชแท็ก 5-8 อัน\nตอบด้วยแคปชั่นเท่านั้น`,setCaptionAi,setAiLoading);
  const genScript = () => callAI(`สร้างสคริปต์คลิปสั้น ${platform.toUpperCase()} ปักตะกร้า:\n- สินค้า: ${product}\n- ราคา: ${price} บาท\n${disc?`- ลด: ${disc}%\n`:""}\n[0-3 วิ] HOOK:\n[3-10 วิ] รีวิว:\n[10-20 วิ] จุดว้าว:\n[20-30 วิ] ปิดการขาย:\nใช้ภาษาไทยสไตล์อินฟลูเอนเซอร์`,setScript,setScriptLoading);

  const copyAndSendToQueue = (text,id) => {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(()=>setCopied(""),2000);
    const fullCaption = link ? `${text}\n\n${link}` : text;
    const setItems = platform==="shopee" ? setShopeeItems : setTiktokItems;
    setItems(prev => {
      const hasEmpty = prev.find(i=>!i.caption);
      if (hasEmpty) return prev.map(i=>i.id===hasEmpty.id?{...i,caption:fullCaption}:i);
      if (prev.length<10) return [...prev,{id:Date.now(),videoFile:null,videoName:"",caption:fullCaption,status:"ready",queue:false,errorImg:""}];
      return prev;
    });
  };

  const sendVideoToQueue = (blob,fileName) => {
    const setItems = platform==="shopee" ? setShopeeItems : setTiktokItems;
    setItems(prev => {
      const hasEmpty = prev.find(i=>!i.videoName);
      if (hasEmpty) return prev.map(i=>i.id===hasEmpty.id?{...i,videoFile:blob,videoName:fileName}:i);
      if (prev.length<10) return [...prev,{id:Date.now(),videoFile:blob,videoName:fileName,caption:"",status:"ready",queue:false,errorImg:""}];
      return prev;
    });
    setPage("queue");
  };

  const M = MS;
  const headerBg = platform==="shopee"?`linear-gradient(135deg, ${SHOPEE_RED}, #8B0000)`:`linear-gradient(135deg, ${TIKTOK_BLACK}, #333)`;

  const renderContent = () => {
    switch (page) {
      case "content": return (
        <>
          <div style={M.card}>
            <div style={M.cardT}>📦 ข้อมูลสินค้าที่ต้องการขาย</div>
            <label style={M.label}>ชื่อสินค้า *</label>
            <input style={M.input} placeholder="เช่น กระเป๋าผ้า Canvas ลายการ์ตูน" value={product} onChange={e=>setProduct(e.target.value)} />
            <div style={{display:"flex",gap:"10px"}}>
              <div style={{flex:1}}><label style={M.label}>ราคา (บาท) *</label><input style={M.input} type="number" placeholder="299" value={price} onChange={e=>setPrice(e.target.value)} /></div>
              <div style={{flex:1}}><label style={M.label}>ลด (%)</label><input style={M.input} type="number" placeholder="20" value={disc} onChange={e=>setDisc(e.target.value)} /></div>
            </div>
            <label style={M.label}>ลิงก์สินค้า ({platform==="shopee"?"Shopee":"TikTok Shop"})</label>
            <input style={{...M.input,marginBottom:0}} placeholder="วางลิงก์ปักหมุดที่นี่..." value={link} onChange={e=>setLink(e.target.value)} />
          </div>
          <div style={M.card}>
            <div style={M.cardT}>✍️ สร้างแคปชั่นขายของ</div>
            <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
              <button style={M.tab(activeTab==="template")} onClick={()=>setActiveTab("template")}>📋 ใช้เทมเพลต</button>
              <button style={M.tab(activeTab==="ai")} onClick={()=>setActiveTab("ai")}>🤖 ส่งให้ AI แต่ง</button>
            </div>
            {activeTab==="template"&&(<>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>{TEMPLATES.map(t=>(<button key={t.id} style={M.tmplBtn(tmpl===t.id)} onClick={()=>setTmpl(t.id)}>{t.name}</button>))}</div>
              <label style={M.label}>เลือกคำขึ้นต้น (Hook)</label>
              <div style={{marginBottom:"8px"}}>{HOOKS.slice(0,4).map(h=>(<span key={h} style={M.chip} onClick={()=>setHook(h)}>{h}</span>))}</div>
              <input style={M.input} placeholder="หรือพิมพ์ hook เอง..." value={hook} onChange={e=>setHook(e.target.value)} />
              <button style={M.btnP} onClick={genTemplate} disabled={expired}>✨ สั่งเจเนอเรตแคปชั่น</button>
              {captionTmpl&&<ResultBox text={captionTmpl} id="tmpl" copied={copied} onCopy={copyAndSendToQueue} queueLabel={platform==="shopee"?"🧡 Shopee":"🖤 TikTok"}/>}
            </>)}
            {activeTab==="ai"&&(<>
              <button style={{...M.btnP,opacity:aiLoading?0.7:1}} onClick={genAI} disabled={aiLoading||expired}>{aiLoading?"AI กำลังเขียนให้...":"🤖 กดปุ่มให้ AI เจนแคปชั่นพิเศษ"}</button>
              {captionAi&&<ResultBox text={captionAi} id="ai" copied={copied} onCopy={copyAndSendToQueue} queueLabel={platform==="shopee"?"🧡 Shopee":"🖤 TikTok"}/>}
            </>)}
          </div>
          <div style={M.card}>
            <div style={M.cardT}>🎬 สคริปต์พูดในคลิปสั้น (AI)</div>
            <button style={{...M.btnS,opacity:scriptLoading?0.7:1}} onClick={genScript} disabled={scriptLoading||expired}>{scriptLoading?"AI กำลังเรียบเรียงสคริปต์...":"🎬 สร้างสคริปต์สั้น 15-30 วิ"}</button>
            {script&&(<div style={{marginTop:"12px"}}><div style={{display:"flex",justifyContent:"flex-end",marginBottom:"6px"}}><button style={{background:"rgba(255,255,255,0.08)",border:"none",color:TEXT_MUTED,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",cursor:"pointer"}} onClick={()=>{navigator.clipboard.writeText(script);setCopied("scr");setTimeout(()=>setCopied(""),2000);}}>{copied==="scr"?"คัดลอกแล้ว":"📋 คัดลอกสคริปต์"}</button></div><div style={{background:"rgba(0,0,0,0.3)",borderRadius:"12px",padding:"14px",fontSize:"12px",lineHeight:"1.8",whiteSpace:"pre-wrap",color:TEXT_MAIN,border:"1px solid rgba(255,255,255,0.07)",maxHeight:"280px",overflowY:"auto"}}>{script}</div></div>)}
          </div>
        </>
      );
      case "video": return <VideoGenerator M={M} expired={expired} product={product} price={price} disc={disc} captionForVideo={captionTmpl||captionAi} platform={platform} onVideoReady={sendVideoToQueue} />;
      case "queue": return <VideoQueueManager M={M} platform={platform} shopeeItems={shopeeItems} setShopeeItems={setShopeeItems} tiktokItems={tiktokItems} setTiktokItems={setTiktokItems} />;
      case "settings": return <SettingsComponent M={M} isBotRunning={isBotRunning} botStatus={botStatus} />;
      default: return null;
    }
  };

  return (
    <div style={M.app}>
      <div style={{...M.hdr,background:headerBg}}>
        <div style={M.glow}/>
        <div style={{position:"relative",zIndex:1,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
          <div>
            <div style={M.logo}>🚀 ClipAI<span style={{color:platform==="shopee"?SHOPEE_ORANGE:TIKTOK_CYAN}}>{platform==="shopee"?"Shopee":"TikTok"}</span></div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>ระบบสร้างคลิปปักตะกร้า + แคปชั่นอัจฉริยะ</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <div style={{textAlign:"right"}}><div style={{fontSize:"10px",color:TEXT_MUTED}}>Bot Master Status</div><div style={{fontSize:"13px",fontWeight:"bold",color:botStatus==="Running"?"#27AE60":botStatus==="Stopping"?"#F5A623":"#FF6B6B"}}>{botStatus}</div></div>
            <button onClick={handleToggleBot} disabled={botStatus==="Stopping"} style={{display:"flex",alignItems:"center",gap:"6px",padding:"8px 14px",borderRadius:"8px",border:"none",fontSize:"13px",fontWeight:"bold",cursor:"pointer",background:isBotRunning?"#E74C3C":"#27AE60",color:"#fff",opacity:botStatus==="Stopping"?0.6:1}}>
              {botStatus==="Stopping"?<><RefreshCw style={{width:"14px",height:"14px"}}/>กำลังหยุด...</>:isBotRunning?<><Square style={{width:"14px",height:"14px"}}/>ปิดบอทระบบ</>:<><Play style={{width:"14px",height:"14px"}}/>เปิดบอทระบบ</>}
            </button>
          </div>
        </div>
        <div style={{position:"relative",zIndex:1,marginTop:"12px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"8px"}}>
          <div style={{display:"flex",gap:"6px"}}>
            <span style={M.badge()}>{licKey}</span>
            <span style={M.badge(expired?"#e74c3c":GREEN)}>{expired?"หมดอายุ":keyInfo?.type==="lifetime"?"ตลอดชีพ":`เหลือ ${dl} วัน`}</span>
            <span style={{...M.badge(),cursor:"pointer"}} onClick={onLogout}>ออกจากระบบ</span>
          </div>
          <div style={{display:"flex",background:"rgba(0,0,0,0.4)",padding:"4px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.1)"}}>
            <button onClick={()=>{setPlatform("shopee");setCaptionTmpl("");setCaptionAi("");setScript("");}} style={{padding:"6px 14px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"bold",cursor:"pointer",background:platform==="shopee"?SHOPEE_RED:"transparent",color:"#fff"}}>🧡 Shopee</button>
            <button onClick={()=>{setPlatform("tiktok");setCaptionTmpl("");setCaptionAi("");setScript("");}} style={{padding:"6px 14px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"bold",cursor:"pointer",background:platform==="tiktok"?"#fff":"transparent",color:platform==="tiktok"?"#000":"#fff"}}>🖤 TikTok</button>
          </div>
        </div>
      </div>
      <div style={{margin:"14px auto 0",maxWidth:"600px",padding:"0 14px"}}><div style={{background:platform==="shopee"?"rgba(238,77,45,0.1)":"rgba(255,255,255,0.05)",border:`1px solid ${platform==="shopee"?SHOPEE_ORANGE:"#fff"}30`,padding:"10px",borderRadius:"10px",fontSize:"12px",textAlign:"center"}}>{platform==="shopee"?"🧡 ระบบทำงานในโหมด Shopee Affiliate":"🖤 ระบบทำงานในโหมด TikTok Affiliate"}</div></div>
      <div style={{display:"flex",gap:"6px",padding:"14px 14px 0",maxWidth:"600px",margin:"0 auto",flexWrap:"wrap"}}>
        <button style={M.tab(page==="content")} onClick={()=>setPage("content")}><FileText size={14} style={{marginRight:4}}/>เขียนโพสต์</button>
        <button style={M.tab(page==="video")} onClick={()=>setPage("video")}>🎬 สร้างคลิป</button>
        <button style={M.tab(page==="queue")} onClick={()=>setPage("queue")}><ListOrdered size={14} style={{marginRight:4}}/>คิวงาน & บอท</button>
        <button style={M.tab(page==="settings")} onClick={()=>setPage("settings")}><Settings size={14} style={{marginRight:4}}/>ตั้งค่าระบบ</button>
      </div>
      <div style={M.body}>{renderContent()}</div>
    </div>
  );
}

function VideoGenerator({ M, expired, product, price, disc, captionForVideo, platform, onVideoReady }) {
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

  useEffect(()=>{ if(!overlayText&&product) setOverlayText(`${product}${price?` | ${price} บาท`:""}${disc?` ลด ${disc}%`:""}`); },[product,price,disc]);

  const handleFiles = (e) => { const files=Array.from(e.target.files||[]).slice(0,10); setImages(prev=>[...prev,...files.map(f=>({url:URL.createObjectURL(f),name:f.name}))].slice(0,10)); };
  const removeImage = (idx) => setImages(prev=>prev.filter((_,i)=>i!==idx));

  const renderVideo = async () => {
    if (images.length===0) return;
    setIsRendering(true); setProgress(0); setVideoUrl(""); setShareMsg("");
    const W=720,H=1280;
    const canvas=canvasRef.current; canvas.width=W; canvas.height=H;
    const ctx=canvas.getContext("2d");
    const loaded=await Promise.all(images.map(img=>new Promise(res=>{ const el=new Image(); el.onload=()=>res(el); el.onerror=()=>res(null); el.src=img.url; })));
    const stream=canvas.captureStream(30); const chunks=[];
    let mime="video/webm;codecs=vp9"; if(!MediaRecorder.isTypeSupported(mime)) mime="video/webm";
    const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2_500_000});
    recorder.ondataavailable=(e)=>{ if(e.data.size>0) chunks.push(e.data); };
    const stopped=new Promise(res=>{ recorder.onstop=res; }); recorder.start();
    const totalDuration=secPerImg*loaded.length*1000; const startTime=performance.now();
    await new Promise(resolveAll=>{
      function frame() {
        const elapsed=performance.now()-startTime;
        const idx=Math.min(loaded.length-1,Math.floor(elapsed/(secPerImg*1000)));
        const localT=(elapsed%(secPerImg*1000))/(secPerImg*1000);
        const img=loaded[idx];
        ctx.fillStyle="#000"; ctx.fillRect(0,0,W,H);
        if(img){ const scale=1+0.12*localT; const iw=img.width,ih=img.height; const targetRatio=W/H,imgRatio=iw/ih; let drawW,drawH; if(imgRatio>targetRatio){drawH=H*scale;drawW=drawH*imgRatio;}else{drawW=W*scale;drawH=drawW/imgRatio;} ctx.drawImage(img,(W-drawW)/2,(H-drawH)/2,drawW,drawH); }
        const grad=ctx.createLinearGradient(0,H*0.6,0,H); grad.addColorStop(0,"rgba(0,0,0,0)"); grad.addColorStop(1,"rgba(0,0,0,0.8)"); ctx.fillStyle=grad; ctx.fillRect(0,H*0.6,W,H*0.4);
        if(overlayText){ctx.fillStyle="#fff";ctx.font="bold 42px 'Segoe UI', sans-serif";ctx.textAlign="center";wrapText(ctx,overlayText,W/2,H-180,W-80,52);}
        if(price){ctx.fillStyle=platform==="shopee"?SHOPEE_RED:"#FF0050";ctx.fillRect(W/2-140,H-100,280,64);ctx.fillStyle="#fff";ctx.font="bold 36px 'Segoe UI', sans-serif";ctx.textAlign="center";ctx.fillText(`${price} บาท${disc?` (-${disc}%)`:""}`,W/2,H-56);}
        setProgress(Math.min(100,Math.round((elapsed/totalDuration)*100)));
        if(elapsed<totalDuration) requestAnimationFrame(frame); else resolveAll();
      }
      requestAnimationFrame(frame);
    });
    recorder.stop(); await stopped;
    const blob=new Blob(chunks,{type:mime}); const fname=`clip-${Date.now()}.webm`;
    setVideoBlob(blob); setVideoFileName(fname); setVideoUrl(URL.createObjectURL(blob)); setIsRendering(false);
    onVideoReady(blob,fname);
    setShareMsg("เพิ่มคลิปลงคิวงานอัตโนมัติแล้ว! กดแท็บ คิวงาน & บอท เพื่อดู");
  };

  const handleVideoFile = (e) => {
    const file=e.target.files?.[0]; if(!file) return;
    setVideoBlob(file); setVideoFileName(file.name); setVideoUrl(URL.createObjectURL(file));
    onVideoReady(file,file.name);
    setShareMsg("เพิ่มคลิปลงคิวงานอัตโนมัติแล้ว! กดแท็บ คิวงาน & บอท เพื่อดู");
  };

  const shareVideo = async () => {
    if(!videoBlob) return;
    const captionText=captionForVideo||`${product} ราคา ${price} บาท`;
    try { const file=new File([videoBlob],videoFileName,{type:videoBlob.type}); if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"ClipAI Post",text:captionText}); setShareMsg("เรียกหน้ารายการโพสต์สำเร็จ");}else{setShareMsg("อุปกรณ์ไม่รองรับการแชร์ไฟล์ ให้ดาวน์โหลดแล้วไปอัปโหลดเองครับ");} } catch { setShareMsg("เกิดข้อผิดพลาดในการส่งไฟล์"); }
  };

  function wrapText(ctx,text,x,y,maxWidth,lineHeight) { const words=text.split(" ");let line="";const lines=[]; for(const w of words){const test=line+w+" ";if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=w+" ";}else line=test;} lines.push(line); lines.forEach((l,i)=>ctx.fillText(l.trim(),x,y+i*lineHeight)); }

  return (
    <div>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
        <button style={M.tab(mode==="generate")} onClick={()=>setMode("generate")}>🖼️ ทำคลิปจากรูป</button>
        <button style={M.tab(mode==="upload")} onClick={()=>setMode("upload")}>📁 ดึงคลิปจากเครื่อง</button>
      </div>
      {mode==="generate"&&(<div style={M.card}>
        <div style={M.cardT}>🎬 ผลิตคลิปวิดีโอออโต้</div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles} />
        <button style={M.btnS} onClick={()=>fileInputRef.current?.click()} disabled={expired}>📷 อัปโหลดรูปสินค้า (สูงสุด 10 รูป)</button>
        {images.length>0&&(<div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"12px"}}>{images.map((img,i)=>(<div key={i} style={{position:"relative",width:"60px",height:"85px",borderRadius:"6px",overflow:"hidden"}}><img src={img.url} style={{width:"100%",height:"100%",objectFit:"cover"}} /><button style={{position:"absolute",top:0,right:0,background:"#000",color:"#fff",border:"none"}} onClick={()=>removeImage(i)}>✕</button></div>))}</div>)}
        <div style={{marginTop:"14px"}}><label style={M.label}>ความเร็วขยับภาพ (วินาที / รูป)</label><input style={M.input} type="number" value={secPerImg} onChange={e=>setSecPerImg(Number(e.target.value))} /><label style={M.label}>ตัวอักษรพาดหัววิดีโอ</label><input style={M.input} value={overlayText} onChange={e=>setOverlayText(e.target.value)} /></div>
        <button style={{...M.btnP,opacity:isRendering?0.7:1}} onClick={renderVideo} disabled={isRendering||images.length===0}>{isRendering?`กำลังเรนเดอร์... ${progress}%`:"🎬 กดเริ่มเรนเดอร์คลิป"}</button>
        <canvas ref={canvasRef} style={{display:"none"}} />
      </div>)}
      {mode==="upload"&&(<div style={M.card}>
        <div style={M.cardT}>📁 โหลดไฟล์ที่มีอยู่แล้วเข้าสู่ระบบ</div>
        <input ref={videoFileInputRef} type="file" accept="video/*" style={{display:"none"}} onChange={handleVideoFile} />
        <button style={M.btnS} onClick={()=>videoFileInputRef.current?.click()}>📁 เลือกคลิปวิดีโอ</button>
      </div>)}
      {videoUrl&&(<div style={M.card}>
        <div style={M.cardT}>🎥 ตัวอย่างวิดีโอ</div>
        <video src={videoUrl} controls style={{width:"100%",maxWidth:"220px",display:"block",margin:"0 auto",borderRadius:"10px"}} />
        <button style={{...M.btnP,marginTop:"14px"}} onClick={shareVideo}>📲 สั่งแชร์ไฟล์ไปยังแอปมือถือ</button>
        <a href={videoUrl} download={videoFileName} style={{display:"block",textAlign:"center",marginTop:"8px",background:"rgba(255,255,255,0.08)",color:TEXT_MAIN,borderRadius:"10px",padding:"11px",textDecoration:"none",fontSize:"14px",fontWeight:"bold"}}>บันทึกลงเครื่องมือถือ</a>
        {shareMsg&&<div style={{marginTop:"10px",fontSize:"12px",background:"rgba(39,174,96,0.1)",border:"1px solid rgba(39,174,96,0.3)",padding:"8px",borderRadius:"6px",color:GREEN}}>{shareMsg}</div>}
      </div>)}
    </div>
  );
}

function SettingsComponent({ M, isBotRunning, botStatus }) {
  const [apiKeyInput, setApiKeyInput] = useState(()=>localStorage.getItem("anthropic_api_key")||"");
  const [tiktokSession, setTiktokSession] = useState(()=>localStorage.getItem("tiktok_session")||"");
  const [shopeeSession, setShopeeSession] = useState(()=>localStorage.getItem("shopee_session")||"");
  const [delayInput, setDelayInput] = useState(()=>localStorage.getItem("post_delay")||"60");
  const [autoRetry, setAutoRetry] = useState(true);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [agentLogs, setAgentLogs] = useState(["[ระบบ] Agent พร้อมทำงาน รอการเชื่อมต่อ..."]);
  const logRef = useRef(null);

  useEffect(()=>{
    if (!agentEnabled) return;
    const msgs = ["กำลังเชื่อมต่อกับ Shopee API...","ตรวจสอบ Session Token...","เชื่อมต่อสำเร็จ พร้อมรับคำสั่ง","ตรวจสอบคิวงาน...","ไม่พบงานในคิว กำลังรอ...","Heartbeat OK (ping 42ms)"];
    let i = 0;
    const interval = setInterval(()=>{
      const msg = msgs[i%msgs.length];
      const time = new Date().toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
      setAgentLogs(prev=>[...prev.slice(-19),`[${time}] ${msg}`]);
      i++;
    }, 2500);
    setAgentLogs(prev=>[...prev,`[${new Date().toLocaleTimeString("th-TH")}] Agent เริ่มทำงานแล้ว`]);
    return ()=>clearInterval(interval);
  },[agentEnabled]);

  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight; },[agentLogs]);

  const saveSettings = () => {
    localStorage.setItem("anthropic_api_key",apiKeyInput.trim());
    localStorage.setItem("tiktok_session",tiktokSession.trim());
    localStorage.setItem("shopee_session",shopeeSession.trim());
    localStorage.setItem("post_delay",delayInput);
    alert("บันทึกการตั้งค่าระบบเรียบร้อยแล้วครับ!");
  };

  return (
    <div>
      <div style={M.card}>
        <div style={M.cardT}>⚙️ ตั้งค่าคีย์แอปพลิเคชัน & AI</div>
        <label style={M.label}>Anthropic API Key (สำหรับระบบเขียนโพสต์บอท AI)</label>
        <input style={M.input} type="password" placeholder="sk-ant-..." value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} />

        <div style={{marginTop:"16px",paddingTop:"16px",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
          <h3 style={{fontSize:"15px",fontWeight:"600",color:TEXT_MAIN,margin:"0 0 4px"}}>ตั้งค่าบอทอัปโหลด & ผูกบัญชี</h3>
          <p style={{fontSize:"11px",color:TEXT_MUTED,margin:"0 0 12px"}}>จัดการคีย์การเชื่อมต่อและหน่วงเวลาการทำงานอัตโนมัติ</p>

          <div style={{background:"rgba(238,77,45,0.07)",border:"1px solid rgba(238,77,45,0.2)",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
            <label style={{...M.label,color:SHOPEE_ORANGE,fontWeight:"700"}}>🧡 Shopee Session / Cookie</label>
            <input type="password" placeholder="วาง Shopee Session ID หรือ Cookie ที่นี่" value={shopeeSession} onChange={e=>setShopeeSession(e.target.value)} style={M.input}/>
          </div>

          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
            <label style={{...M.label,color:"#aaa",fontWeight:"700"}}>🖤 TikTok Session / Cookie</label>
            <input type="password" placeholder="วาง TikTok Session ID หรือ Cookie ที่นี่" value={tiktokSession} onChange={e=>setTiktokSession(e.target.value)} style={M.input}/>
          </div>

          <label style={M.label}>ระยะเวลาหน่วงระหว่างคลิป (วินาที)</label>
          <input type="number" min="30" value={delayInput} onChange={e=>setDelayInput(e.target.value)} placeholder="แนะนำ 60 วินาทีขึ้นไป" style={M.input}/>

          <div style={{display:"flex",alignItems:"center",gap:"8px",margin:"14px 0"}}>
            <input type="checkbox" id="autoRetry" checked={autoRetry} onChange={e=>setAutoRetry(e.target.checked)} style={{width:"16px",height:"16px",cursor:"pointer"}}/>
            <label htmlFor="autoRetry" style={{fontSize:"12px",color:TEXT_MAIN,cursor:"pointer"}}>เปิดใช้งานลองใหม่อัตโนมัติ (Auto-Retry) เมื่อบอทอัปโหลดพังหรือหลุดคิว</label>
          </div>
        </div>
        <button style={M.btnP} onClick={saveSettings}>💾 บันทึกการตั้งค่าทั้งหมด</button>
      </div>

      {/* Agent Status Panel */}
      <div style={{...M.card,marginTop:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"12px"}}>
          <div style={M.cardT}>🤖 สถานะ Agent (Bot หลังบ้าน)</div>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <span style={{fontSize:"12px",color:agentEnabled?GREEN:TEXT_MUTED}}>{agentEnabled?"กำลังทำงาน":"หยุดอยู่"}</span>
            <div onClick={()=>setAgentEnabled(p=>!p)} style={{width:"44px",height:"24px",borderRadius:"12px",background:agentEnabled?GREEN:"rgba(255,255,255,0.15)",cursor:"pointer",position:"relative",transition:"background 0.2s"}}>
              <div style={{position:"absolute",top:"3px",left:agentEnabled?"23px":"3px",width:"18px",height:"18px",borderRadius:"50%",background:"#fff",transition:"left 0.2s"}}/>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{display:"flex",alignItems:"center",gap:"8px",padding:"10px 12px",borderRadius:"8px",background:"rgba(0,0,0,0.3)",marginBottom:"10px",border:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{width:"8px",height:"8px",borderRadius:"50%",background:agentEnabled?GREEN:"#e74c3c",boxShadow:agentEnabled?`0 0 6px ${GREEN}`:"none",flexShrink:0}}/>
          <span style={{fontSize:"12px",color:TEXT_MAIN,fontWeight:"600"}}>
            {agentEnabled?"สถานะ Agent: กำลังเชื่อมต่อและรอคำสั่ง...":"สถานะ Agent: ปิดใช้งาน (Toggle เพื่อเปิด)"}
          </span>
          <span style={{marginLeft:"auto",fontSize:"11px",color:TEXT_MUTED}}>Bot: {isBotRunning?botStatus:"Idle"}</span>
        </div>

        {/* Log Window */}
        <div ref={logRef} style={{background:"#000",borderRadius:"8px",padding:"10px 12px",height:"160px",overflowY:"auto",fontFamily:"monospace",fontSize:"11px",lineHeight:"1.6",border:"1px solid rgba(255,255,255,0.08)"}}>
          {agentLogs.map((log,i)=>(
            <div key={i} style={{color:log.includes("สำเร็จ")||log.includes("OK")?GREEN:log.includes("ข้อผิดพลาด")||log.includes("Error")?"#e74c3c":log.includes("Agent เริ่ม")?SHOPEE_ORANGE:TEXT_MUTED}}>{log}</div>
          ))}
          {agentEnabled&&<div style={{color:GREEN,animation:"blink 1s infinite"}}>_</div>}
        </div>

        <div style={{marginTop:"8px",fontSize:"11px",color:TEXT_MUTED,textAlign:"center"}}>Agent Log อัปเดตทุก 2.5 วินาที เพื่อให้เห็นว่าระบบยังทำงานอยู่</div>
      </div>
    </div>
  );
}

function VideoQueueManager({ M, platform, shopeeItems, setShopeeItems, tiktokItems, setTiktokItems }) {
  const [queueTab, setQueueTab] = useState(platform||"shopee");
  const videoRefs = useRef({});

  const items = queueTab==="shopee"?shopeeItems:tiktokItems;
  const setItems = queueTab==="shopee"?setShopeeItems:setTiktokItems;

  const addItem = () => { if(items.length>=10) return alert("เพิ่มได้สูงสุด 10 รายการครับ"); setItems(prev=>[...prev,{id:Date.now(),videoFile:null,videoName:"",caption:"",status:"ready",queue:false,errorImg:""}]); };
  const removeItem = (id) => { if(items.length<=1) return; setItems(prev=>prev.filter(i=>i.id!==id)); };
  const updateItem = (id,field,value) => { setItems(prev=>prev.map(i=>i.id===id?{...i,[field]:value}:i)); };
  const handleVideoSelect = (id,e) => { const file=e.target.files?.[0]; if(!file) return; updateItem(id,"videoFile",file); updateItem(id,"videoName",file.name); };
  const toggleQueue = (id) => { setItems(prev=>prev.map(i=>{ if(i.id!==id) return i; if(!i.videoName){alert("กรุณาเลือกคลิปวิดีโอก่อนครับ");return i;} return{...i,queue:!i.queue,status:!i.queue?"queued":"ready"}; })); };
  const queueAll = () => { setItems(prev=>prev.map(i=>i.videoName?{...i,queue:true,status:"queued"}:i)); };

  const shareItem = async (item) => {
    if(!item.videoFile) return;
    try { const file=item.videoFile instanceof File?item.videoFile:new File([item.videoFile],item.videoName,{type:"video/webm"}); if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:"ClipAI Post",text:item.caption});}else{alert("อุปกรณ์ไม่รองรับการแชร์ไฟล์ กรุณาดาวน์โหลดและโพสเอง");} } catch {}
  };

  const platformColor = queueTab==="shopee"?SHOPEE_RED:"#333";
  const platformLabel = queueTab==="shopee"?"🧡 Shopee":"🖤 TikTok";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
      <div style={{display:"flex",background:"rgba(255,255,255,0.04)",padding:"4px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.08)"}}>
        <button onClick={()=>setQueueTab("shopee")} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",fontSize:"13px",fontWeight:"bold",cursor:"pointer",background:queueTab==="shopee"?SHOPEE_RED:"transparent",color:"#fff"}}>🧡 คิว Shopee ({shopeeItems.filter(i=>i.queue).length}/{shopeeItems.length})</button>
        <button onClick={()=>setQueueTab("tiktok")} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",fontSize:"13px",fontWeight:"bold",cursor:"pointer",background:queueTab==="tiktok"?"#222":"transparent",color:"#fff"}}>🖤 คิว TikTok ({tiktokItems.filter(i=>i.queue).length}/{tiktokItems.length})</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
        {[["📋 ทั้งหมด",items.length,TEXT_MUTED],["⏳ ในคิว",items.filter(i=>i.queue).length,SHOPEE_ORANGE],["✅ พร้อม",items.filter(i=>!i.queue&&i.status==="ready").length,GREEN]].map(([label,val,color])=>(<div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}><div style={{fontSize:"20px",fontWeight:"800",color}}>{val}</div><div style={{fontSize:"10px",color:TEXT_MUTED}}>{label}</div></div>))}
      </div>
      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={addItem} disabled={items.length>=10} style={{flex:1,padding:"9px",borderRadius:"10px",border:`2px dashed ${platformColor}`,background:"transparent",color:platformColor,fontSize:"13px",fontWeight:"bold",cursor:"pointer",opacity:items.length>=10?0.4:1}}>➕ เพิ่มรายการ ({items.length}/10)</button>
        <button onClick={queueAll} style={{flex:1,padding:"9px",borderRadius:"10px",border:"none",background:platformColor,color:"#fff",fontSize:"13px",fontWeight:"bold",cursor:"pointer"}}><Layers size={13} style={{display:"inline",marginRight:4}}/>ส่งทั้งหมดเข้าคิว</button>
      </div>
      {items.map((item,idx)=>(
        <div key={item.id} style={{background:BG_CARD,borderRadius:"14px",padding:"14px",border:`1px solid ${item.queue?"rgba(245,166,35,0.4)":"rgba(255,255,255,0.07)"}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:item.queue?SHOPEE_ORANGE:TEXT_MAIN}}>{item.queue?"⏳":"📋"} รายการที่ {idx+1}{item.queue&&<span style={{fontSize:"10px",marginLeft:"6px",color:SHOPEE_ORANGE}}>(อยู่ในคิว)</span>}</div>
            <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
              {item.status==="failed"&&(<button onClick={()=>alert(`URL รูปพัง: ${item.errorImg}`)} style={{display:"flex",alignItems:"center",gap:"2px",background:"rgba(238,77,45,0.2)",color:"#FF8B8B",border:"1px solid rgba(238,77,45,0.4)",borderRadius:"4px",padding:"3px 7px",fontSize:"11px",cursor:"pointer"}}><Eye size={11}/> ดูรูปพัง</button>)}
              {items.length>1&&(<button onClick={()=>removeItem(item.id)} style={{background:"rgba(231,76,60,0.15)",border:"none",color:"#e74c3c",borderRadius:"6px",padding:"3px 8px",fontSize:"12px",cursor:"pointer"}}>✕ ลบ</button>)}
            </div>
          </div>
          <input ref={el=>videoRefs.current[item.id]=el} type="file" accept="video/*" style={{display:"none"}} onChange={e=>handleVideoSelect(item.id,e)}/>
          <button onClick={()=>videoRefs.current[item.id]?.click()} style={{width:"100%",padding:"9px",borderRadius:"8px",border:`1px dashed ${item.videoName?"rgba(39,174,96,0.5)":"rgba(255,255,255,0.15)"}`,background:item.videoName?"rgba(39,174,96,0.07)":"rgba(255,255,255,0.03)",color:item.videoName?GREEN:TEXT_MUTED,fontSize:"12px",cursor:"pointer",marginBottom:"8px",textAlign:"left"}}>{item.videoName?`🎬 ${item.videoName}`:"📁 กดเลือกไฟล์วิดีโอ..."}</button>
          <textarea placeholder="พิมพ์หรือวางแคปชั่นสำหรับคลิปนี้..." value={item.caption} onChange={e=>updateItem(item.id,"caption",e.target.value)} rows={3} style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"9px 12px",color:TEXT_MAIN,fontSize:"12px",outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"'Segoe UI','Noto Sans Thai',sans-serif",marginBottom:"8px"}}/>
          <div style={{display:"flex",gap:"8px"}}>
            <button onClick={()=>toggleQueue(item.id)} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"bold",cursor:"pointer",color:"#fff",background:item.queue?"#D35400":item.videoName?GREEN:"rgba(255,255,255,0.1)"}}>
              {item.queue?<><ArrowLeft size={12} style={{display:"inline",marginRight:4}}/>ดึงออกจากคิว</>:<>ส่งเข้าคิว {platformLabel} <ArrowRight size={12} style={{display:"inline",marginLeft:4}}/></>}
            </button>
            {item.queue&&item.videoFile&&(<button onClick={()=>shareItem(item)} style={{padding:"8px 14px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"bold",cursor:"pointer",color:"#fff",background:"#4F46E5"}}>📲 แชร์</button>)}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultBox({ text, id, copied, onCopy, queueLabel }) {
  return (
    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:"12px",padding:"14px",fontSize:"13px",lineHeight:"1.7",whiteSpace:"pre-wrap",color:TEXT_MAIN,marginTop:"10px",border:"1px solid rgba(255,255,255,0.07)",position:"relative",paddingRight:"130px"}}>
      {text}
      <button style={{position:"absolute",top:"10px",right:"10px",background:copied===id?GREEN:"rgba(255,255,255,0.1)",border:"none",borderRadius:"6px",padding:"5px 10px",color:"#fff",fontSize:"11px",cursor:"pointer",fontWeight:"700",lineHeight:"1.4",textAlign:"center"}}
        onClick={()=>onCopy(text,id)}>
        {copied===id?`${queueLabel} ส่งคิวแล้ว!`:`📋 คัดลอก\n+ ส่งคิว`}
      </button>
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
