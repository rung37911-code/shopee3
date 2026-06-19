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

// ── License Key storage ──
const KEY_STORE = {}; 

function codeFromStorageKey(k) { return k.replace("key:", ""); }

async function kGet(k) {
  if (KEY_STORE[k]) return KEY_STORE[k];
  const code = codeFromStorageKey(k);
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.from("license_keys").select("*").eq("code", code).maybeSingle();
      if (!error && data) {
        const v = supaRowToKeyData(data);
        KEY_STORE[k] = v;
        return v;
      }
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
    try {
      await supabase.from("license_keys").upsert(keyDataToSupaRow(code, v));
    } catch {}
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
  return {
    code: row.code, type: row.type, buyerName: row.buyer_name, note: row.note,
    active: row.active, createdAt: row.created_at, expiresAt: row.expires_at,
    loginCount: row.login_count, lastLogin: row.last_login,
  };
}
function keyDataToSupaRow(code, v) {
  return {
    code, type: v.type, buyer_name: v.buyerName, note: v.note,
    active: v.active, created_at: v.createdAt, expires_at: v.expiresAt,
    login_count: v.loginCount || 0, last_login: v.lastLogin,
  };
}

function isExpired(kd) { return kd?.expiresAt ? new Date() > new Date(kd.expiresAt) : false; }
function fmtDate(iso) {
  if (!iso) return "ตลอดชีพ";
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
  { id:"hype", name:"🔥 ไฟแรง", fn:(p,pr,d,plat)=>plat==="shopee" ? `🔥🛒 ปักตะกร้าด่วน!!\n\n✨ ${p}\n💰 ราคา ${pr} บาท\n${d?`🎯 ลด ${d}%\n`:""}⚡ สต็อกมีจำกัด!\n📲 กดลิงก์ในโปรไฟล์\n\n#Shopee #ปักตะกร้า #ลดราคา` : `🔥🛒 พิกัดในตะกร้าเหลืองด่วน!!\n\n✨ ${p}\n💰 ราคาพิเศษ ${pr} บาท\n${d?`🎯 ลดจุกๆ ${d}%\n`:""}⚡ ช้าหมดอดนะรอบนี้!\n📲 จิ้มที่ตะกร้าซ้ายมือบนคลิปได้เลย\n\n#TikTokครีเอเตอร์ #TikTokShop #ปักตะกร้า #ลดราคา` },
  { id:"review", name:"⭐ รีวิว", fn:(p,pr,d,plat)=>plat==="shopee" ? `⭐ รีวิวจริง ไม่ปิด!\n\n📦 ${p}\n💵 ${pr} บาท\n${d?`💸 ประหยัด ${d}%\n`:""}✅ ของดี ราคาคุ้ม!\n\n#รีวิว #Shopee #ของดีราคาถูก` : `⭐ รีวิวจากผู้ใช้จริง!\n\n📦 ${p}\n💵 เพียง ${pr} บาท\n${d?`💸 ประหยัดไปอีก ${d}%\n`:""}✅ ของตรงปก ไม่จกตา ดีจริงบอกต่อ!\n\n#รีวิวของดี #TikTokShop #รีวิว #ของดีราคาถูก` },
  { id:"flash", name:"⚡ เซลเดือด", fn:(p,pr,d,plat)=>plat==="shopee" ? `⚡ FLASH SALE แค่วันนี้!!\n\n🎁 ${p}\n🏷️ ${pr} บาท!\n${d?`🔴 ลด ${d}%\n`:""}⏰ ราคานี้มีเวลาจำกัด!\n\n#FlashSale #Shopee #Deal` : `⚡ ดีลเดือด นาทีทอง!!\n\n🎁 ${p}\n🏷️ ราคาลดเหลือ ${pr} บาท!\n${d?`🔴 หั่นราคาลง ${d}%\n`:""}⏰ เฉพาะในคลิปนี้เท่านั้น รีบกด!\n\n#ดีลเด็ด #TikTokShop #FlashSale #ลดราคา` },
  { id:"tiktok", name:"🎵 สไตล์วัยรุ่น", fn:(p,pr,d,plat)=>plat==="shopee" ? `POV: เจอของดีราคาโคตรถูก 😱\n\n${p} แค่ ${pr} บาท!!${d?` (ลด ${d}%)`:""}\n\nแบกตะกร้าก่อน!\n\n#fy #fyp #Shopee #ปักตะกร้า` : `POV: แฟนบังคับให้รีวิวสิ่งนี้ 😱\n\n${p} แค่ ${pr} บาทเอง!!${d?` (ลดตั้ง ${d}%)`:""}\n\nจิ้มตะกร้าเหลืองข้างล่างด่วนก่อนหมดโปร!\n\n#fyp #ของมันต้องมี #TikTokShop #ตะกร้าเหลือง` },
];
const HOOKS = ["หยุดเลื่อนก่อน! นี่คือสิ่งที่คุณต้องการ","ราคานี้ต้องบอกต่อ!!","เพื่อนบอกมา ลองแล้วติดใจ","ปักตะกร้าไว้ก่อน ตัดสินใจทีหลัง","ลดแล้ว! อย่าพลาด!"];

// ─── ROOT ───────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("login");
  const [sess, setSess] = useState(null);

  useEffect(() => {
    (async () => {
      const existing = await kGet(`key:${DEMO_KEY}`);
      if (!existing) {
        await kSet(`key:${DEMO_KEY}`, {
          code: DEMO_KEY, type: "monthly", buyerName: "Demo User",
          note: "Key ทดสอบระบบ", active: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
          loginCount: 0, lastLogin: null,
        });
      }
    })();
  }, []);

  const login = (key, info, isAdmin) => {
    setSess({ key, info, isAdmin });
    setScreen(isAdmin ? "admin" : "app");
  };
  const logout = () => { setSess(null); setScreen("login"); };

  if (screen === "admin") return <AdminPanel onLogout={logout} />;
  if (screen === "app") return <MainApp sess={sess} onLogout={logout} />;
  return <LoginScreen onSuccess={login} />;
}

// ─── LOGIN SCREEN ───────────────────────────────────────────
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
    if (!kd) { setErr("❌ ไม่พบ Key นี้ในระบบ"); setLoading(false); return; }
    if (!kd.active) { setErr("❌ Key ถูกระงับการใช้งาน"); setLoading(false); return; }
    if (isExpired(kd)) { setErr(`❌ Key หมดอายุ ${fmtDate(kd.expiresAt)}`); setLoading(false); return; }
    kd.lastLogin = new Date().toISOString();
    kd.loginCount = (kd.loginCount||0)+1;
    await kSet(`key:${k}`, kd);
    setLoading(false);
    onSuccess(k, kd, false);
  };
  const doAdminLogin = () => {
    if (pass !== ADMIN_PASSWORD) { setErr("❌ รหัสผ่านไม่ถูกต้อง"); return; }
    onSuccess("ADMIN", { name:"Admin", type:"admin" }, true);
  };

  const S = LS;
  return (
    <div style={S.bg}>
      <div style={S.box}>
        <div style={S.logoWrap}>
          <div style={{fontSize:"40px"}}>🚀</div>
          <div style={S.logoText}>ClipAI<span style={{color:SHOPEE_ORANGE}}>Master</span></div>
          <div style={S.logoSub}>ระบบสร้างคลิปปักตะกร้า + แคปชั่น อัตโนมัติ (Shopee & TikTok)</div>
        </div>
        <div style={S.tabRow}>
          <button style={S.tab(mode==="user")} onClick={()=>{setMode("user");setErr("");}}>🔑 เข้าใช้งาน</button>
          <button style={S.tab(mode==="admin")} onClick={()=>{setMode("admin");setErr("");}}>⚙️ Admin</button>
        </div>
        {mode==="user" ? (
          <>
            <label style={S.label}>License Key</label>
            <input style={S.input} placeholder="SCL-MO-XXXXXXXX" value={keyVal}
              onChange={e=>setKeyVal(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doUserLogin()} />
            <div style={S.hint}>* Key ได้รับจากผู้ขาย</div>
            <div style={{fontSize:"12px",color:SHOPEE_ORANGE,marginBottom:"12px",cursor:"pointer"}}
              onClick={()=>setKeyVal(DEMO_KEY)}>
              🧪 กดเพื่อใส่ Demo Key ทดสอบ
            </div>
            {err && <div style={S.err}>{err}</div>}
            <button style={S.btn} onClick={doUserLogin} disabled={loading}>
              {loading ? "⏳ กำลังตรวจสอบ..." : "เข้าใช้งาน →"}
            </button>
          </>
        ) : (
          <>
            <label style={S.label}>รหัสผ่าน Admin</label>
            <input style={S.input} type="password" placeholder="••••••••" value={pass}
              onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doAdminLogin()} />
            {err && <div style={S.err}>{err}</div>}
            <button style={S.btn} onClick={doAdminLogin}>เข้า Admin Panel →</button>
          </>
        )}
        <div style={{textAlign:"center",marginTop:"16px",fontSize:"11px",color:"rgba(255,255,255,0.25)"}}>
          ClipAIMaster v2.5 • Dual Platform Support
        </div>
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

// ─── ADMIN PANEL ────────────────────────────────────────────
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
    for (const n of names) {
      const d = await kGet(n);
      if (d) list.push({ storageKey:n, keyCode:n.replace("key:",""), ...d });
    }
    list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
    setKeys(list);
    const st={total:list.length,active:0,expired:0,monthly:0,yearly:0,lifetime:0};
    list.forEach(k=>{
      (isExpired(k)||!k.active)?st.expired++:st.active++;
      st[k.type]=(st[k.type]||0)+1;
    });
    setStats(st);
    setLoading(false);
  };

  useEffect(()=>{ if(tab==="keys") loadKeys(); },[tab]);

  const createKey = async () => {
    const code = genKey(newType);
    const kd = { code, type:newType, buyerName:newName||"ไม่ระบุ", note:newNote, active:true,
      createdAt:new Date().toISOString(), expiresAt:getExpiry(newType), loginCount:0, lastLogin:null };
    await kSet(`key:${code}`, kd);
    setCreated(code); setNewName(""); setNewNote("");
  };

  const toggleKey = async (code, cur) => {
    const d = await kGet(`key:${code}`);
    if (d) { d.active=!cur; await kSet(`key:${code}`,d); loadKeys(); }
  };
  const deleteKey = async (code) => {
    if (!confirm(`ลบ Key ${code}?`)) return;
    await kDel(`key:${code}`); loadKeys();
  };
  const copyKey = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  const filtered = keys.filter(k=>
    k.keyCode.includes(search.toUpperCase())||k.buyerName?.includes(search)||k.note?.includes(search)
  );

  const A = AS;
  return (
    <div style={A.wrap}>
      <div style={A.hdr}>
        <div>
          <div style={A.hdrT}>⚙️ Admin Panel</div>
          <div style={A.hdrS}>ClipAI — จัดการ License Keys ทั้งหมด</div>
        </div>
        <button style={A.logoutBtn} onClick={onLogout}>ออกจากระบบ</button>
      </div>
      <div style={A.statsRow}>
        {[["🔑 ทั้งหมด",stats.total,"#667eea"],["✅ ใช้ได้",stats.active,GREEN],["❌ หมดอายุ",stats.expired,"#e74c3c"],
          ["📅 รายเดือน",stats.monthly,SHOPEE_ORANGE],["📆 รายปี",stats.yearly,"#9B59B6"],["♾️ ตลอดชีพ",stats.lifetime,"#1ABC9C"]
        ].map(([l,v,c])=>(
          <div key={l} style={A.statBox}>
            <div style={{fontSize:"20px",fontWeight:"800",color:c}}>{v}</div>
            <div style={{fontSize:"11px",color:TEXT_MUTED}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={A.tabRow}>
        {[["create","➕ สร้าง Key"],["keys","🗃️ Keys ทั้งหมด"]].map(([id,lb])=>(
          <button key={id} style={A.tab(tab===id)} onClick={()=>setTab(id)}>{lb}</button>
        ))}
      </div>
      <div style={A.body}>
        {tab==="create" && (
          <div style={A.card}>
            <div style={A.cardT}>➕ สร้าง License Key ใหม่</div>
            <label style={A.label}>ชื่อผู้ซื้อ / ร้านค้า</label>
            <input style={A.input} placeholder="เช่น ร้านสมชาย, Line: @shop" value={newName} onChange={e=>setNewName(e.target.value)} />
            <label style={A.label}>ประเภท Key</label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
              {[["monthly","📅 รายเดือน","30 วัน"],["yearly","📆 รายปี","365 วัน"],["lifetime","♾️ ตลอดชีพ","ไม่หมดอายุ"]].map(([v,l,s])=>(
                <div key={v} style={A.typeBox(newType===v)} onClick={()=>setNewType(v)}>
                  <div style={{fontSize:"13px",fontWeight:"700"}}>{l}</div>
                  <div style={{fontSize:"11px",color:TEXT_MUTED}}>{s}</div>
                </div>
              ))}
            </div>
            <label style={A.label}>หมายเหตุ</label>
            <input style={A.input} placeholder="เช่น ชำระ 299 บาท" value={newNote} onChange={e=>setNewNote(e.target.value)} />
            <button style={A.btnP} onClick={createKey}>🔑 สร้าง Key ใหม่</button>
            {created && (
              <div style={{marginTop:"14px",background:"rgba(39,174,96,0.1)",border:"1px solid rgba(39,174,96,0.3)",borderRadius:"12px",padding:"14px"}}>
                <div style={{fontSize:"13px",color:TEXT_MUTED,marginBottom:"6px"}}>✅ สร้างสำเร็จ!</div>
                <div style={{fontFamily:"monospace",fontSize:"18px",fontWeight:"800",color:GREEN,letterSpacing:"2px",textAlign:"center",padding:"10px",background:"rgba(0,0,0,0.3)",borderRadius:"8px",marginBottom:"8px"}}>{created}</div>
                <button style={{width:"100%",background:GREEN,color:"#fff",border:"none",borderRadius:"8px",padding:"9px",fontSize:"13px",fontWeight:"700",cursor:"pointer"}}
                  onClick={()=>copyKey(created)}>{copied?"✓ คัดลอกแล้ว":"📋 คัดลอก Key"}</button>
              </div>
            )}
          </div>
        )}
        {tab==="keys" && (
          <>
            <input style={{...A.input,marginBottom:"10px"}} placeholder="🔍 ค้นหา Key / ชื่อผู้ซื้อ..." value={search} onChange={e=>setSearch(e.target.value)} />
            {loading ? <div style={{textAlign:"center",color:TEXT_MUTED,padding:"30px"}}>⏳ กำลังโหลด...</div>
            : filtered.length===0 ? <div style={{textAlign:"center",color:TEXT_MUTED,padding:"30px"}}>ไม่พบข้อมูล</div>
            : filtered.map(k=>{
              const exp=isExpired(k);
              return (
                <div key={k.keyCode} style={{background:k.active&&!exp?BG_CARD:"rgba(20,10,10,0.6)",borderRadius:"12px",padding:"14px",marginBottom:"10px",border:k.active&&!exp?"1px solid rgba(255,255,255,0.08)":"1px solid rgba(238,77,45,0.2)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px",marginBottom:"6px"}}>
                    <span style={{fontFamily:"monospace",fontSize:"14px",fontWeight:"800",color:TEXT_MAIN}}>{k.keyCode}</span>
                    <span style={{fontSize:"11px",padding:"2px 8px",borderRadius:"20px",background:"rgba(255,255,255,0.1)",color:SHOPEE_ORANGE}}>
                      {k.type==="monthly"?"รายเดือน":k.type==="yearly"?"รายปี":"ตลอดชีพ"}
                    </span>
                  </div>
                  <div style={{fontSize:"12px",color:TEXT_MUTED}} { ... (k.buyerName ? { children: `👤 ${k.buyerName} | 📝 ${k.note}` } : {}) }/>
                  <div style={{fontSize:"12px",color:TEXT_MUTED}}>⏰ หมดอายุ: {exp?<span style={{color:"#e74c3c"}}>หมดแล้ว</span>:<span>{fmtDate(k.expiresAt)}</span>}</div>
                  <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
                    <button style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",fontSize:"12px",cursor:"pointer",background:"rgba(255,255,255,0.1)",color:TEXT_MAIN}} onClick={()=>toggleKey(k.keyCode,k.active)}>{k.active?"🔒 ระงับ":"✅ เปิดใช้"}</button>
                    <button style={{flex:1,padding:"5px",borderRadius:"6px",border:"none",fontSize:"12px",cursor:"pointer",background:"rgba(231,76,60,0.2)",color:"#e74c3c"}} onClick={()=>deleteKey(k.keyCode)}>🗑️ ลบ</button>
                  </div>
                </div>
              );
            })}
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

// ─── MAIN APP ───────────────────────────────────────────────
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

  // สถานะควบคุมบอทหลัก (Bot Master Control)
  const [isBotRunning, setIsBotRunning] = useState(false);
  const [botStatus, setBotStatus] = useState("Idle"); // 'Idle', 'Running', 'Stopping'

  const expired = isExpired(keyInfo||{});
  const dl = daysLeft(keyInfo?.expiresAt);

  const handleToggleBot = () => {
    if (isBotRunning) {
      setBotStatus("Stopping");
      setTimeout(() => {
        setIsBotRunning(false);
        setBotStatus("Idle");
      }, 1500);
    } else {
      setIsBotRunning(true);
      setBotStatus("Running");
    }
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
      if (!apiKey) {
        setFn("⚠️ ยังไม่ได้ตั้งค่า Anthropic API Key — กดปุ่ม '⚙️ ตั้งค่า บอท/AI' เพื่อกรอก API Key");
        setLoad(false);
        return;
      }
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})
      });
      const d = await r.json();
      if (d.error) { setFn(`⚠️ เกิดข้อผิดพลาด: ${d.error.message}`); setLoad(false); return; }
      setFn(d.content?.map(c=>c.text||"").join("")||"เกิดข้อผิดพลาด ลองใหม่");
    } catch { setFn("เกิดข้อผิดพลาด ลองใหม่"); }
    setLoad(false);
  };

  const genAI = () => callAI(
    `คุณเป็น Social Media Copywriter เชี่ยวชาญขายของออนไลน์ผ่านระบบแอฟฟิลิเอต บนแพลตฟอร์ม ${platform.toUpperCase()}\nสร้างแคปชั่นปักตะกร้าสำหรับ:\n- สินค้า: ${product}\n- ราคา: ${price} บาท\n${disc?`- ลด: ${disc}%\n`:""}${link?`- ลิงก์พิกัด: ${link}\n`:""}\nให้มี: คำเปิดตัวดึงดูด (Hook), ภาษาไทยฮิตๆ วัยรุ่นชอบ, Emoji น่ารักพอดี, วิธีสั่งซื้อที่เหมาะกับ ${platform} (เช่น ตะกร้าเหลือง หรือ ลิงก์หน้าโปรไฟล์), แฮชแท็ก 5-8 อันที่เข้ากับค่ายนี้\nตอบด้วยข้อความแคปชั่นเท่านั้นไม่ต้องอธิบายเพิ่ม`,
    setCaptionAi, setAiLoading
  );
  const genScript = () => callAI(
    `สร้างสคริปต์คลิปสั้นสำหรับรันบนแพลตฟอร์ม ${platform.toUpperCase()} ปักตะกร้าแอฟฟิลิเอต:\n- สินค้า: ${product}\n- ราคา: ${price} บาท\n${disc?`- ลด: ${disc}%\n`:""}\nรูปแบบสคริปต์ความยาว 15-30 วินาที:\n[0-3 วิ] HOOK ดึงสายตา: ...\n[3-10 วิ] รีวิวสินค้าเด่นๆ: ...\n[10-20 วิ] จุดว้าวที่ต้องซื้อ: ...\n[20-30 วิ] ปิดการขาย + บอกพิกัดของ ${platform} (เช่น ตะกร้าเหลืองมุมซ้ายล่าง หรือลิงก์หน้าช่อง):\nใช้ภาษาไทยสไตล์อินฟลูเอนเซอร์ชื่อดัง สนุก กระชับ เร้าอารมณ์`,
    setScript, setScriptLoading
  );

  const copy = (text,id) => { navigator.clipboard.writeText(text); setCopied(id); setTimeout(()=>setCopied(""),2000); };

  const M = MS;
  const headerBg = platform === "shopee" ? `linear-gradient(135deg, ${SHOPEE_RED}, #8B0000)` : `linear-gradient(135deg, ${TIKTOK_BLACK}, #333)`;

  // ลอจิกเลือกหน้า RenderContent (เงื่อนไข Switch)
  const renderContent = () => {
    switch (page) {
      case "content":
        return (
          <>
            <div style={M.card}>
              <div style={M.cardT}>📦 ข้อมูลสินค้าที่ต้องการขาย</div>
              <label style={M.label}>ชื่อสินค้า *</label>
              <input style={M.input} placeholder="เช่น กระเป๋าผ้า Canvas ลายการ์ตูน" value={product} onChange={e=>setProduct(e.target.value)} />
              <div style={{display:"flex",gap:"10px"}}>
                <div style={{flex:1}}><label style={M.label}>ราคา (บาท) *</label><input style={M.input} type="number" placeholder="299" value={price} onChange={e=>setPrice(e.target.value)} /></div>
                <div style={{flex:1}}><label style={M.label}>ลด (%)</label><input style={M.input} type="number" placeholder="20" value={disc} onChange={e=>setDisc(e.target.value)} /></div>
              </div>
              <label style={M.label}>ลิงก์สินค้า ({platform === "shopee" ? "Shopee" : "TikTok Shop"})</label>
              <input style={{...M.input,marginBottom:0}} placeholder="วางลิงก์ปักหมุดที่นี่..." value={link} onChange={e=>setLink(e.target.value)} />
            </div>

            <div style={M.card}>
              <div style={M.cardT}>✍️ สร้างแคปชั่นขายของ</div>
              <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
                <button style={M.tab(activeTab==="template")} onClick={()=>setActiveTab("template")}>📋 ใช้เทมเพลต</button>
                <button style={M.tab(activeTab==="ai")} onClick={()=>setActiveTab("ai")}>🤖 ส่งให้ AI แต่ง</button>
              </div>
              {activeTab==="template"&&(
                <>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"12px"}}>
                    {TEMPLATES.map(t=>(
                      <button key={t.id} style={M.tmplBtn(tmpl===t.id)} onClick={()=>setTmpl(t.id)}>{t.name}</button>
                    ))}
                  </div>
                  <label style={M.label}>เลือกคำขึ้นต้น (Hook)</label>
                  <div style={{marginBottom:"8px"}}>
                    {HOOKS.slice(0,4).map(h=>(
                      <span key={h} style={M.chip} onClick={()=>setHook(h)}>{h}</span>
                    ))}
                  </div>
                  <input style={M.input} placeholder="หรือพิมพ์ hook เอง..." value={hook} onChange={e=>setHook(e.target.value)} />
                  <button style={M.btnP} onClick={genTemplate} disabled={expired}>✨ สั่งเจเนอเรตแคปชั่น</button>
                  {captionTmpl&&<ResultBox text={captionTmpl} id="tmpl" copied={copied} onCopy={copy}/>}
                </>
              )}
              {activeTab==="ai"&&(
                <>
                  <button style={{...M.btnP,opacity:aiLoading?0.7:1}} onClick={genAI} disabled={aiLoading||expired}>
                    {aiLoading?"⏳ บอท AI กำลังเขียนให้...":"🤖 กดปุ่มให้ AI เจนแคปชั่นพิเศษ"}
                  </button>
                  {captionAi&&<ResultBox text={captionAi} id="ai" copied={copied} onCopy={copy}/>}
                </>
              )}
            </div>

            <div style={M.card}>
              <div style={M.cardT}>🎬 สคริปต์พูดในคลิปสั้น (AI)</div>
              <button style={{...M.btnS,opacity:scriptLoading?0.7:1}} onClick={genScript} disabled={scriptLoading||expired}>
                {scriptLoading?"⏳ AI กำลังเรียบเรียงสคริปต์เสียง...":"🎬 สร้างสคริปต์สั้น 15-30 วิ"}
              </button>
              {script&&(
                <div style={{marginTop:"12px"}}>
                  <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"6px"}}>
                    <button style={{background:"rgba(255,255,255,0.08)",border:"none",color:TEXT_MUTED,borderRadius:"8px",padding:"6px 14px",fontSize:"12px",cursor:"pointer"} } onClick={()=>copy(script,"scr")}>
                      {copied==="scr"?"✓ คัดลอกแล้ว":"📋 คัดลอกสคริปต์"}
                    </button>
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
        return <VideoQueueManager M={M} licKey={licKey} expired={expired} product={product} price={price} link={link} captionTmpl={captionTmpl} captionAi={captionAi} script={script} platform={platform} />;
      case "settings":
        return <SettingsComponent M={M} BG_CARD={BG_CARD} />;
      default:
        return null;
    }
  };

  return (
    <div style={M.app}>
      {/* ─── 1. ปุ่มควบคุมบอทหลัก (Bot Master Control) ใน Header ─── */}
      <div style={{...M.hdr, background: headerBg}}>
        <div style={M.glow}/>
        <div style={{position:"relative", zIndex:1, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"12px"}}>
          <div>
            <div style={M.logo}>🚀 ClipAI<span style={{color: platform === "shopee" ? SHOPEE_ORANGE : TIKTOK_CYAN}}>{platform === "shopee" ? "Shopee" : "TikTok"}</span></div>
            <div style={{fontSize:"12px",color:"rgba(255,255,255,0.7)"}}>ระบบสร้างคลิปปักตะกร้า + แคปชั่นอัจฉริยะ</div>
          </div>

          {/* 🟢 ส่วนแสดงผลปุ่มเปิด-ปิดบอท มุมบนขวาของระบบ */}
          <div style={{display:"flex", alignItems:"center", gap:"10px"}}>
            <div style={{textAlign: "right", color: TEXT_MAIN}} className="hidden sm:block">
              <div style={{fontSize: "10px", color: TEXT_MUTED}}>Bot Master Status</div>
              <div style={{fontSize: "13px", fontWeight: "bold", color: botStatus === "Running" ? "#27AE60" : botStatus === "Stopping" ? "#F5A623" : "#FF6B6B"}}>{botStatus}</div>
            </div>
            
            <button
              onClick={handleToggleBot}
              disabled={botStatus === "Stopping"}
              style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "bold", cursor: "pointer", transition: "all 0.2s",
                background: isBotRunning ? "#E74C3C" : "#27AE60", color: "#fff", opacity: botStatus === "Stopping" ? 0.6 : 1
              }}
            >
              {botStatus === "Stopping" ? (
                <>
                  <RefreshCw style={{width:"14px", height:"14px", animation: "spin 1s linear infinite"}} />
                  กำลังหยุด...
                </>
              ) : isBotRunning ? (
                <>
                  <Square style={{width:"14px", height:"14px"}} />
                  ปิดบอทระบบ
                </>
              ) : (
                <>
                  <Play style={{width:"14px", height:"14px"}} />
                  เปิดบอทระบบ
                </>
              )}
            </button>
          </div>
        </div>
        
        {/* แถบแพลตฟอร์ม & รายละเอียดสิทธิ์ */}
        <div style={{position:"relative", zIndex:1, marginTop:"12px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"8px"}}>
          <div style={{display:"flex", gap:"6px"}}>
            <span style={M.badge()}>{licKey}</span>
            <span style={M.badge(expired?"#e74c3c":GREEN)}>
              {expired?"❌ หมดอายุ":keyInfo?.type==="lifetime"?"♾️ ตลอดชีพ":`⏰ เหลือ ${dl} วัน`}
            </span>
            <span style={{...M.badge(),cursor:"pointer"}} onClick={onLogout}>ออกจากระบบ</span>
          </div>

          {/* ปุ่มสลับระบบ Shopee และ TikTok */}
          <div style={{display:"flex", background:"rgba(0,0,0,0.4)", padding:"4px", borderRadius:"12px", border:"1px solid rgba(255,255,255,0.1)"}}>
            <button onClick={() => { setPlatform("shopee"); setCaptionTmpl(""); setCaptionAi(""); setScript(""); }} 
              style={{padding:"6px 14px", borderRadius:"8px", border:"none", fontSize:"12px", fontWeight:"bold", cursor:"pointer", background: platform === "shopee" ? SHOPEE_RED : "transparent", color: "#fff"}}>
              🧡 Shopee
            </button>
            <button onClick={() => { setPlatform("tiktok"); setPlatform("tiktok"); setCaptionTmpl(""); setCaptionAi(""); setScript(""); }} 
              style={{padding:"6px 14px", borderRadius:"8px", border:"none", fontSize:"12px", fontWeight:"bold", cursor:"pointer", background: platform === "tiktok" ? "#fff" : "transparent", color: platform === "tiktok" ? "#000" : "#fff"}}>
              🖤 TikTok
            </button>
          </div>
        </div>
      </div>

      <div style={{margin:"14px auto 0", maxWidth:"600px", padding:"0 14px"}}>
        <div style={{background: platform === "shopee" ? "rgba(238,77,45,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${platform === "shopee" ? SHOPEE_ORANGE : '#fff'}30`, padding:"10px", borderRadius:"10px", fontSize:"12px", textAlign:"center"}}>
          {platform === "shopee" ? "🧡 ระบบทำงานในโหมด Shopee Affiliate" : "🖤 ระบบทำงานในโหมด TikTok Affiliate"}
        </div>
      </div>

      {/* เมนูนำทางหลักหลัก */}
      <div style={{display:"flex", gap:"6px", padding:"14px 14px 0", maxWidth:"600px", margin:"0 auto", flexWrap:"wrap"}}>
        <button style={M.tab(page==="content")} onClick={()=>setPage("content")}><FileText size={14} style={{marginRight:4}}/>เขียนโพสต์</button>
        <button style={M.tab(page==="video")} onClick={()=>setPage("video")}>🎬 สร้างคลิป</button>
        <button style={M.tab(page==="queue")} onClick={()=>setPage("queue")}><ListOrdered size={14} style={{marginRight:4}}/>คิวงาน & บอท</button>
        <button style={M.tab(page==="settings")} onClick={()=>setPage("settings")}><Settings size={14} style={{marginRight:4}}/>ตั้งค่าระบบ</button>
      </div>

      {/* เรียกใช้งาน Component ฟังก์ชันตามเงื่อนไขสวิตช์หน้าจอ */}
      <div style={M.body}>
        {renderContent()}
      </div>
    </div>
  );
}

// ─── VIDEO GENERATOR ────────────────────────────────────────
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
    if (!overlayText && product) {
      setOverlayText(`${product}${price ? ` | ${price} บาท` : ""}${disc ? ` ลด ${disc}%` : ""}`);
    }
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

    const loaded = await Promise.all(images.map(img => new Promise(res => {
      const el = new Image();
      el.onload = () => res(el);
      el.onerror = () => res(null);
      el.src = img.url;
    })));

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

        ctx.fillStyle = "#000";
        ctx.fillRect(0,0,W,H);

        if (img) {
          const scale = 1 + 0.12 * localT;
          const iw = img.width, ih = img.height;
          const targetRatio = W/H, imgRatio = iw/ih;
          let drawW, drawH;
          if (imgRatio > targetRatio) { drawH = H*scale; drawW = drawH*imgRatio; }
          else { drawW = W*scale; drawH = drawW/imgRatio; }
          const dx = (W-drawW)/2, dy = (H-drawH)/2;
          ctx.drawImage(img, dx, dy, drawW, drawH);
        }

        const grad = ctx.createLinearGradient(0,H*0.6,0,H);
        grad.addColorStop(0,"rgba(0,0,0,0)");
        grad.addColorStop(1,"rgba(0,0,0,0.8)");
        ctx.fillStyle = grad;
        ctx.fillRect(0,H*0.6,W,H*0.4);

        if (overlayText) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 42px 'Segoe UI', sans-serif";
          ctx.textAlign = "center";
          wrapText(ctx, overlayText, W/2, H-180, W-80, 52);
        }
        if (price) {
          ctx.fillStyle = platform === "shopee" ? SHOPEE_RED : "#FF0050";
          ctx.fillRect(W/2-140, H-100, 280, 64);
          ctx.fillStyle = "#fff";
          ctx.font = "bold 36px 'Segoe UI', sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(`${price} บาท${disc?` (-${disc}%)`:""}`, W/2, H-56);
        }

        setProgress(Math.min(100, Math.round((elapsed/totalDuration)*100)));
        if (elapsed < totalDuration) requestAnimationFrame(frame);
        else resolveAll();
      }
      requestAnimationFrame(frame);
    });

    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: mime });
    setVideoBlob(blob);
    setVideoUrl(URL.createObjectURL(blob));
    setIsRendering(false);
  };

  const handleVideoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoBlob(file);
    setVideoFileName(file.name);
    setVideoUrl(URL.createObjectURL(file));
  };

  const shareVideo = async () => {
    if (!videoBlob) return;
    const captionText = captionForVideo || `${product} ราคา ${price} บาท`;
    try {
      const file = new File([videoBlob], videoFileName, { type: videoBlob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "ClipAI Post", text: captionText });
        setShareMsg("✅ เรียกหน้ารายการโพสต์สำเร็จ");
      } else {
        setShareMsg("⚠️ อุปกรณ์ไม่รองรับการแชร์ไฟล์อัตโนมัติ ให้ดาวน์โหลดลงเครื่องแล้วไปอัปโหลดเองครับ");
      }
    } catch { setShareMsg("⚠️ เกิดข้อผิดพลาดในการส่งไฟล์"); }
  };

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" "); let line = ""; const lines = [];
    for (const w of words) {
      const test = line + w + " ";
      if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w + " "; }
      else line = test;
    }
    lines.push(line);
    lines.forEach((l,i) => ctx.fillText(l.trim(), x, y + i*lineHeight));
  }

  return (
    <div>
      <div style={{display:"flex",gap:"8px",marginBottom:"12px"}}>
        <button style={M.tab(mode==="generate")} onClick={()=>setMode("generate")}>🖼️ ทำคลิปจากรูป</button>
        <button style={M.tab(mode==="upload")} onClick={()=>setMode("upload")}>📁 ดึงคลิปจากเครื่อง</button>
      </div>

      {mode==="generate" && (
      <div style={M.card}>
        <div style={M.cardT}>🎬 ผลิตคลิปวิดีโอออโต้</div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles} />
        <button style={M.btnS} onClick={()=>fileInputRef.current?.click()} disabled={expired}>📷 อัปโหลดรูปสินค้า (สูงสุด 10 รูป)</button>

        {images.length>0 && (
          <div style={{display:"flex",flexWrap:"wrap",gap:"8px",marginTop:"12px"}}>
            {images.map((img,i)=>(
              <div key={i} style={{position:"relative",width:"60px",height:"85px",borderRadius:"6px",overflow:"hidden"}}>
                <img src={img.url} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                <button style={{position:"absolute",top:0,right:0,background:"#000",color:"#fff",border:"none"} } onClick={()=>removeImage(i)}>✕</button>
              </div>
            ))}
          </div>
        )}

        <div style={{marginTop:"14px"}}>
          <label style={M.label}>ความเร็วขยับภาพ (วินาที / รูป)</label>
          <input style={M.input} type="number" value={secPerImg} onChange={e=>setSecPerImg(Number(e.target.value))} />
          <label style={M.label}>ตัวอักษรวิ่งพาดหัววิดีโอ</label>
          <input style={M.input} value={overlayText} onChange={e=>setOverlayText(e.target.value)} />
        </div>

        <button style={{...M.btnP,opacity:isRendering?0.7:1}} onClick={renderVideo} disabled={isRendering||images.length===0}>
          {isRendering ? `⏳ ระบบกำลังจัดคิวเรนเดอร์... ${progress}%` : "🎬 กดเริ่มเรนเดอร์คลิป"}
        </button>
        <canvas ref={canvasRef} style={{display:"none"}} />
      </div>
      )}

      {mode==="upload" && (
        <div style={M.card}>
          <div style={M.cardT}>📁 โหลดไฟล์ที่มีอยู่แล้วเข้าสู่ระบบ</div>
          <input ref={videoFileInputRef} type="file" accept="video/*" style={{display:"none"}} onChange={handleVideoFile} />
          <button style={M.btnS} onClick={()=>videoFileInputRef.current?.click()}>📁 เลือกคลิปวิดีโอ</button>
        </div>
      )}

      {videoUrl && (
        <div style={M.card}>
          <div style={M.cardT}>🎥 ตัวอย่างวิดีโอ & สั่งงานโพส</div>
          <video src={videoUrl} controls style={{width:"100%",maxWidth:"220px",display:"block",margin:"0 auto",borderRadius:"10px"}} />
          <button style={{...M.btnP,marginTop:"14px"}} onClick={shareVideo}>📲 สั่งแชร์ไฟล์ไปยังแอปมือถือ</button>
          <a href={videoUrl} download={videoFileName} style={{display:"block",textAlign:"center",marginTop:"8px",background:"rgba(255,255,255,0.08)",color:TEXT_MAIN,borderRadius:"10px",padding:"11px",textDecoration:"none",fontSize:"14px",fontWeight:"bold"}}>⬇️ บันทึกลงเครื่องมือถือ</a>
          {shareMsg && <div style={{marginTop:"10px",fontSize:"12px",background:"#000",padding:"8px",borderRadius:"6px"}}>{shareMsg}</div>}
        </div>
      )}
    </div>
  );
}

// ─── 2. COMPONENT ตั้งค่าระบบ (SETTINGS) ───────────────────────
function SettingsComponent({ M, BG_CARD }) {
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem("anthropic_api_key") || "");
  const [sessionInput, setSessionInput] = useState("");
  const [delayInput, setDelayInput] = useState("60");
  const [autoRetry, setAutoRetry] = useState(true);

  const saveSettings = () => {
    localStorage.setItem("anthropic_api_key", apiKeyInput.trim());
    alert("💾 บันทึกการตั้งค่าระบบเรียบร้อยแล้วครับ!");
  };

  return (
    <div style={M.card}>
      <div style={M.cardT}>⚙️ ตั้งค่าคีย์แอปพลิเคชัน & AI</div>
      
      <label style={M.label}>Anthropic API Key (สำหรับระบบเขียนโพสต์บอท AI)</label>
      <input style={M.input} type="password" placeholder="sk-ant-..." value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} />

      {/* 🟢 ส่วนโค้ด "ตั้งค่าและผูกบัญชี (Settings)" ที่คุณนำมาต่อฟอร์ม */}
      <div style={{marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.1)"}}>
        <div>
          <h3 style={{fontSize:"15px", fontWeight:"600", color: TEXT_MAIN, margin:"0 0 4px"}}>ตั้งค่าบอทอัปโหลด & ผูกบัญชี</h3>
          <p style={{fontSize:"11px", color: TEXT_MUTED, margin:"0 0 12px"}}>จัดการคีย์การเชื่อมต่อและหน่วงเวลาการทำงานอัตโนมัติ</p>
        </div>

        <div style={{display:"grid", gridTemplateColumns: "1fr", gap: "10px", marginBottom: "12px"}}>
          {/* ฟิลด์ผูกบัญชี Session / Cookie */}
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <label style={M.label}>TikTok Session / Cookie</label>
            <input 
              type="password" 
              placeholder="วาง Session ID หรือ Cookie ที่นี่"
              value={sessionInput}
              onChange={e=>setSessionInput(e.target.value)}
              style={M.input}
            />
          </div>

          {/* ฟิลด์ตั้งค่า Delay */}
          <div style={{display: "flex", flexDirection: "column", gap: "4px"}}>
            <label style={M.label}>ระยะเวลาหน่วงระหว่างคลิป (วินาที)</label>
            <input 
              type="number" 
              min="30"
              value={delayInput}
              onChange={e=>setDelayInput(e.target.value)}
              placeholder="แนะนำ 60 วินาทีขึ้นไป"
              style={M.input}
            />
          </div>
        </div>

        {/* บันทึกสิทธิ์บอท */}
        <div style={{display: "flex", alignItems: "center", gap: "8px", margin: "14px 0"}}>
          <input 
            type="checkbox" 
            id="autoRetry"
            checked={autoRetry}
            onChange={e=>setAutoRetry(e.target.checked)}
            style={{width: "16px", height: "16px", cursor: "pointer"}}
          />
          <label htmlFor="autoRetry" style={{fontSize: "12px", color: TEXT_MAIN, cursor: "pointer"}}>
            เปิดใช้งานลองใหม่อัตโนมัติ (Auto-Retry) เมื่อบอทอัปโหลดพังหรือหลุดคิว
          </label>
        </div>
      </div>

      <button style={M.btnP} onClick={saveSettings}>💾 บันทึกการตั้งค่าทั้งหมด</button>
    </div>
  );
}

// ─── 3. COMPONENT ตารางคิวงานแบบรองรับหลายคลิป (VIDEO QUEUE MANAGER) ───
function VideoQueueManager({ M, licKey, expired, product, price, link, captionTmpl, captionAi, script, platform }) {
  // ข้อมูลจำลองคลิปวิดีโอ/ล็อกการรันของบอท
  const [videos, setVideos] = useState([
    { id: 1, title: 'รีวิวสินค้าเกษตร_01.mp4', status: 'ready', queue: false },
    { id: 2, title: 'แนะนำตัวยาอะซีทามิพริด.mp4', status: 'failed', queue: false, errorImg: 'https://via.placeholder.com/300x500?text=Error+Screen' },
    { id: 3, title: 'คลิปเต้นเพลง playguy.mp4', status: 'queued', queue: true },
    { id: 4, title: 'เซ็ตติ้งปักหมุดของดีราคาถูก.mp4', status: 'ready', queue: false },
  ]);

  // ไอดีของวิดีโอที่ถูกเลือก (Checkbox) เพื่อทำ Bulk Action
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);

  // เลือกทั้งหมด / ยกเลิกทั้งหมด
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedVideoIds(videos.map(v => v.id));
    } else {
      setSelectedVideoIds([]);
    }
  };

  // เลือกทีละรายการ
  const handleSelectRow = (id) => {
    if (selectedVideoIds.includes(id)) {
      setSelectedVideoIds(selectedVideoIds.filter(item => item !== id));
    } else {
      setSelectedVideoIds([...selectedVideoIds, id]);
    }
  };

  // ทำการจัดการหลายคลิปพร้อมกัน (Bulk Action) ลงคิว/ดึงกลับ
  const handleBulkQueue = (actionType) => {
    if (selectedVideoIds.length === 0) return alert('กรุณาเลือกคลิปวิดีโอก่อนครับ');
    
    setVideos(videos.map(video => {
      if (selectedVideoIds.includes(video.id)) {
        return { 
          ...video, 
          queue: actionType === 'add',
          status: actionType === 'add' ? 'queued' : 'ready'
        };
      }
      return video;
    }));
    setSelectedVideoIds([]); // รีเซ็ตการเลือกหลังจากทำเสร็จ
  };

  // จัดการส่งคิวงานรายตัว
  const toggleQueue = (id) => {
    setVideos(videos.map(video => {
      if (video.id === id) {
        return { ...video, queue: !video.queue, status: !video.queue ? 'queued' : 'ready' };
      }
      return video;
    }));
  };

  return (
    <div style={{display: "flex", flexDirection: "column", gap: "12px"}}>
      
      {/* 🟢 Bulk Action Bar (แถบจัดการคลิปพร้อมกันหลายๆ ตัว) */}
      <div style={{display: "flex", justifyContent: "between", alignItems: "center", background: "rgba(255,255,255,0.04)", padding: "12px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", justifyContent:"space-between"}}>
        <div style={{fontSize: "13px", color: TEXT_MAIN}}>
          เลือกอยู่ <span style={{fontWeight: "bold", color: SHOPEE_ORANGE}}>{selectedVideoIds.length}</span> รายการ
        </div>
        <div style={{display: "flex", gap: "6px"}}>
          <button 
            onClick={() => handleBulkQueue('add')}
            style={{display: "flex", alignItems: "center", gap: "4px", background: "#4F46E5", color: "#fff", border: "none", fontSize: "11px", fontWeight: "bold", padding: "6px 10px", borderRadius: "6px", cursor: "pointer"}}
          >
            <Layers size={12} /> ส่งเข้าคิวที่เลือก
          </button>
          <button 
            onClick={() => handleBulkQueue('remove')}
            style={{display: "flex", alignItems: "center", gap: "4px", background: "rgba(255,255,255,0.1)", color: TEXT_MAIN, border: "none", fontSize: "11px", fontWeight: "bold", padding: "6px 10px", borderRadius: "6px", cursor: "pointer"}}
          >
            ดึงกลับที่เลือก
          </button>
        </div>
      </div>

      {/* 📊 ตารางจัดการ Log และคิวงาน */}
      <div style={{...M.card, padding: "0px", overflowX: "auto"}}>
        <table style={{width: "100%", borderCollapse: "collapse", textAlign: "left"}}>
          <thead>
            <tr style={{borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)"}}>
              <th style={{padding: "12px", width: "30px"}}>
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={selectedVideoIds.length === videos.length && videos.length > 0}
                  style={{cursor: "pointer"}}
                />
              </th>
              <th style={{padding: "12px", fontSize: "12px", color: TEXT_MUTED}}>ชื่อไฟล์วิดีโอ</th>
              <th style={{padding: "12px", fontSize: "12px", color: TEXT_MUTED, textAlign: "center"}}>สถานะ / หลักฐานบอทพัง</th>
              <th style={{padding: "12px", fontSize: "12px", color: TEXT_MUTED, textAlign: "right"}}>จัดการ (Action)</th>
            </tr>
          </thead>
          <tbody style={{fontSize: "13px"}}>
            {videos.map((log) => (
              <tr key={log.id} style={{borderBottom: "1px solid rgba(255,255,255,0.05)"}}>
                {/* Checkbox เลือกแถว */}
                <td style={{padding: "12px"}}>
                  <input 
                    type="checkbox" 
                    checked={selectedVideoIds.includes(log.id)}
                    onChange={() => handleSelectRow(log.id)}
                    style={{cursor: "pointer"}}
                  />
                </td>
                <td style={{padding: "12px", fontWeight: "500", color: TEXT_MAIN}}>{log.title}</td>
                
                {/* 🔴 คอลัมน์สถานะ + เงื่อนไขเช็กรูปตอนบอทพัง (Failed Image) */}
                <td style={{padding: "12px", textAlign: "center"}}>
                  <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"}}>
                    <span style={{
// ─── 2. COMPONENT ตั้งค่าระบบ (SETTINGS) ───────────────────────
function SettingsComponent({ M, BG_CARD }) {
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
    alert("💾 บันทึกการตั้งค่าระบบเรียบร้อยแล้วครับ!");
  };

  return (
    <div style={M.card}>
      <div style={M.cardT}>⚙️ ตั้งค่าคีย์แอปพลิเคชัน & AI</div>
      <label style={M.label}>Anthropic API Key (สำหรับระบบเขียนโพสต์บอท AI)</label>
      <input style={M.input} type="password" placeholder="sk-ant-..." value={apiKeyInput} onChange={e=>setApiKeyInput(e.target.value)} />

      <div style={{marginTop:"20px",paddingTop:"20px",borderTop:"1px solid rgba(255,255,255,0.1)"}}>
        <h3 style={{fontSize:"15px",fontWeight:"600",color:TEXT_MAIN,margin:"0 0 4px"}}>ตั้งค่าบอทอัปโหลด & ผูกบัญชี</h3>
        <p style={{fontSize:"11px",color:TEXT_MUTED,margin:"0 0 12px"}}>จัดการคีย์การเชื่อมต่อและหน่วงเวลาการทำงานอัตโนมัติ</p>

        {/* 🧡 Shopee Session */}
        <div style={{background:"rgba(238,77,45,0.07)",border:"1px solid rgba(238,77,45,0.2)",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
          <label style={{...M.label,color:SHOPEE_ORANGE,fontWeight:"700"}}>🧡 Shopee Session / Cookie</label>
          <input type="password" placeholder="วาง Shopee Session ID หรือ Cookie ที่นี่" value={shopeeSession} onChange={e=>setShopeeSession(e.target.value)} style={M.input}/>
        </div>

        {/* 🖤 TikTok Session */}
        <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",padding:"12px",marginBottom:"10px"}}>
          <label style={{...M.label,color:"#aaa",fontWeight:"700"}}>🖤 TikTok Session / Cookie</label>
          <input type="password" placeholder="วาง TikTok Session ID หรือ Cookie ที่นี่" value={tiktokSession} onChange={e=>setTiktokSession(e.target.value)} style={M.input}/>
        </div>

        <label style={M.label}>ระยะเวลาหน่วงระหว่างคลิป (วินาที)</label>
        <input type="number" min="30" value={delayInput} onChange={e=>setDelayInput(e.target.value)} placeholder="แนะนำ 60 วินาทีขึ้นไป" style={M.input}/>

        <div style={{display:"flex",alignItems:"center",gap:"8px",margin:"14px 0"}}>
          <input type="checkbox" id="autoRetry" checked={autoRetry} onChange={e=>setAutoRetry(e.target.checked)} style={{width:"16px",height:"16px",cursor:"pointer"}}/>
          <label htmlFor="autoRetry" style={{fontSize:"12px",color:TEXT_MAIN,cursor:"pointer"}}>
            เปิดใช้งานลองใหม่อัตโนมัติ (Auto-Retry) เมื่อบอทอัปโหลดพังหรือหลุดคิว
          </label>
        </div>
      </div>
      <button style={M.btnP} onClick={saveSettings}>💾 บันทึกการตั้งค่าทั้งหมด</button>
    </div>
  );
}

// ─── 3. COMPONENT คิวงาน แยก Shopee/TikTok + จับคู่คลิป+แคปชั่น ───
function VideoQueueManager({ M, licKey, expired, platform }) {
  const [queueTab, setQueueTab] = useState(platform || "shopee");

  // State คิวแยกแต่ละแพลตฟอร์ม
  const [shopeeItems, setShopeeItems] = useState([
    { id: 1, videoFile: null, videoName: "", caption: "", status: "ready", queue: false, errorImg: "" },
  ]);
  const [tiktokItems, setTiktokItems] = useState([
    { id: 1, videoFile: null, videoName: "", caption: "", status: "ready", queue: false, errorImg: "" },
  ]);

  const items = queueTab === "shopee" ? shopeeItems : tiktokItems;
  const setItems = queueTab === "shopee" ? setShopeeItems : setTiktokItems;

  const videoRefs = useRef({});

  // เพิ่มรายการใหม่ (สูงสุด 10)
  const addItem = () => {
    if (items.length >= 10) return alert("เพิ่มได้สูงสุด 10 รายการครับ");
    const newId = Date.now();
    setItems(prev => [...prev, { id: newId, videoFile: null, videoName: "", caption: "", status: "ready", queue: false, errorImg: "" }]);
  };

  // ลบรายการ
  const removeItem = (id) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  // อัปเดตฟิลด์
  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  // เลือกไฟล์วิดีโอ
  const handleVideoSelect = (id, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateItem(id, "videoFile", file);
    updateItem(id, "videoName", file.name);
  };

  // ส่งเข้าคิว / ดึงกลับ
  const toggleQueue = (id) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      if (!i.videoName) { alert("กรุณาเลือกคลิปวิดีโอก่อนครับ"); return i; }
      return { ...i, queue: !i.queue, status: !i.queue ? "queued" : "ready" };
    }));
  };

  // ส่งทั้งหมดเข้าคิว
  const queueAll = () => {
    setItems(prev => prev.map(i => i.videoName ? { ...i, queue: true, status: "queued" } : i));
  };

  const platformColor = queueTab === "shopee" ? SHOPEE_RED : "#333";
  const platformLabel = queueTab === "shopee" ? "🧡 Shopee" : "🖤 TikTok";

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>

      {/* แท็บสลับแพลตฟอร์ม */}
      <div style={{display:"flex",background:"rgba(255,255,255,0.04)",padding:"4px",borderRadius:"12px",border:"1px solid rgba(255,255,255,0.08)"}}>
        <button onClick={()=>setQueueTab("shopee")} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",fontSize:"13px",fontWeight:"bold",cursor:"pointer",background:queueTab==="shopee"?SHOPEE_RED:"transparent",color:"#fff"}}>
          🧡 คิว Shopee ({shopeeItems.filter(i=>i.queue).length}/{shopeeItems.length})
        </button>
        <button onClick={()=>setQueueTab("tiktok")} style={{flex:1,padding:"8px",borderRadius:"8px",border:"none",fontSize:"13px",fontWeight:"bold",cursor:"pointer",background:queueTab==="tiktok"?"#222":"transparent",color:"#fff"}}>
          🖤 คิว TikTok ({tiktokItems.filter(i=>i.queue).length}/{tiktokItems.length})
        </button>
      </div>

      {/* แถบสถิติ */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px"}}>
        {[
          ["📋 ทั้งหมด", items.length, TEXT_MUTED],
          ["⏳ ในคิว", items.filter(i=>i.queue).length, SHOPEE_ORANGE],
          ["✅ เตรียมพร้อม", items.filter(i=>!i.queue&&i.status==="ready").length, GREEN],
        ].map(([label,val,color])=>(
          <div key={label} style={{background:"rgba(255,255,255,0.04)",borderRadius:"10px",padding:"10px",textAlign:"center",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{fontSize:"20px",fontWeight:"800",color}}>{val}</div>
            <div style={{fontSize:"10px",color:TEXT_MUTED}}>{label}</div>
          </div>
        ))}
      </div>

      {/* ปุ่มควบคุม */}
      <div style={{display:"flex",gap:"8px"}}>
        <button onClick={addItem} disabled={items.length>=10}
          style={{flex:1,padding:"9px",borderRadius:"10px",border:`2px dashed ${platformColor}`,background:"transparent",color:platformColor,fontSize:"13px",fontWeight:"bold",cursor:"pointer",opacity:items.length>=10?0.4:1}}>
          ➕ เพิ่มรายการ ({items.length}/10)
        </button>
        <button onClick={queueAll}
          style={{flex:1,padding:"9px",borderRadius:"10px",border:"none",background:platformColor,color:"#fff",fontSize:"13px",fontWeight:"bold",cursor:"pointer"}}>
          <Layers size={13} style={{display:"inline",marginRight:4}}/>ส่งทั้งหมดเข้าคิว
        </button>
      </div>

      {/* รายการคลิป + แคปชั่น */}
      {items.map((item, idx) => (
        <div key={item.id} style={{background:BG_CARD,borderRadius:"14px",padding:"14px",border:`1px solid ${item.queue?"rgba(245,166,35,0.4)":"rgba(255,255,255,0.07)"}`}}>
          
          {/* หัวข้อแถว */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
            <div style={{fontSize:"13px",fontWeight:"700",color:item.queue?SHOPEE_ORANGE:TEXT_MAIN}}>
              {item.queue ? "⏳" : "📋"} รายการที่ {idx+1}
              {item.queue && <span style={{fontSize:"10px",marginLeft:"6px",color:SHOPEE_ORANGE}}>(อยู่ในคิว)</span>}
            </div>
            <div style={{display:"flex",gap:"6px",alignItems:"center"}}>
              {item.status==="failed" && (
                <button onClick={()=>alert(`URL รูปพัง: ${item.errorImg}`)}
                  style={{display:"flex",alignItems:"center",gap:"2px",background:"rgba(238,77,45,0.2)",color:"#FF8B8B",border:"1px solid rgba(238,77,45,0.4)",borderRadius:"4px",padding:"3px 7px",fontSize:"11px",cursor:"pointer"}}>
                  <Eye size={11}/> ดูรูปพัง
                </button>
              )}
              {items.length > 1 && (
                <button onClick={()=>removeItem(item.id)}
                  style={{background:"rgba(231,76,60,0.15)",border:"none",color:"#e74c3c",borderRadius:"6px",padding:"3px 8px",fontSize:"12px",cursor:"pointer"}}>
                  ✕ ลบ
                </button>
              )}
            </div>
          </div>

          {/* เลือกคลิปวิดีโอ */}
          <input ref={el=>videoRefs.current[item.id]=el} type="file" accept="video/*" style={{display:"none"}}
            onChange={e=>handleVideoSelect(item.id,e)}/>
          <button onClick={()=>videoRefs.current[item.id]?.click()}
            style={{width:"100%",padding:"9px",borderRadius:"8px",border:`1px dashed ${item.videoName?"rgba(39,174,96,0.5)":"rgba(255,255,255,0.15)"}`,background:item.videoName?"rgba(39,174,96,0.07)":"rgba(255,255,255,0.03)",color:item.videoName?GREEN:TEXT_MUTED,fontSize:"12px",cursor:"pointer",marginBottom:"8px",textAlign:"left"}}>
            {item.videoName ? `🎬 ${item.videoName}` : "📁 กดเลือกไฟล์วิดีโอ..."}
          </button>

          {/* แคปชั่น */}
          <textarea
            placeholder="พิมพ์หรือวางแคปชั่นสำหรับคลิปนี้..."
            value={item.caption}
            onChange={e=>updateItem(item.id,"caption",e.target.value)}
            rows={3}
            style={{width:"100%",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"8px",padding:"9px 12px",color:TEXT_MAIN,fontSize:"12px",outline:"none",boxSizing:"border-box",resize:"vertical",fontFamily:"'Segoe UI','Noto Sans Thai',sans-serif",marginBottom:"8px"}}
          />

          {/* ปุ่มส่งเข้าคิว */}
          <button onClick={()=>toggleQueue(item.id)}
            style={{width:"100%",padding:"8px",borderRadius:"8px",border:"none",fontSize:"12px",fontWeight:"bold",cursor:"pointer",color:"#fff",
              background:item.queue?"#D35400":item.videoName?GREEN:"rgba(255,255,255,0.1)"}}>
            {item.queue ? <><ArrowLeft size={12} style={{display:"inline",marginRight:4}}/>ดึงออกจากคิว</> : <>ส่งเข้าคิว {platformLabel} <ArrowRight size={12} style={{display:"inline",marginLeft:4}}/></>}
          </button>
        </div>
      ))}
    </div>
  );
            }
// ─── UTILS COMPONENTS ───────────────────────────────────────
function ResultBox({ text, id, copied, onCopy }) {
  return (
    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:"12px",padding:"14px",fontSize:"13px",lineHeight:"1.7",whiteSpace:"pre-wrap",color:TEXT_MAIN,marginTop:"10px",border:"1px solid rgba(255,255,255,0.07)",position:"relative"}}>
      {text}
      <button style={{position:"absolute",top:"10px",right:"10px",background:copied===id?"#27AE60":"rgba(255,255,255,0.1)",border:"none",borderRadius:"6px",padding:"4px 10px",color:"#fff",fontSize:"12px",cursor:"pointer"}}
        onClick={()=>onCopy(text,id)}>{copied===id?"✓":"คัดลอก"}</button>
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
  tab:(a)=>({padding:"8px 16px",borderRadius:"10px",border:"none",fontSize:"12px",fontWeight:a?"700":"400",cursor:"pointer",background:a?SHOPEE_RED:"rgba(255,255,255,0.06)",color:a?"#fff":TEXT_MUTED,display:"inline-flex",alignItems:"center"},),
  tmplBtn:(a)=>({padding:"10px",borderRadius:"10px",border:a?`2px solid ${SHOPEE_RED}`:"1px solid rgba(255,255,255,0.1)",background:a?"rgba(238,77,45,0.15)":"rgba(255,255,255,0.03)",color:a?"#fff":TEXT_MUTED,fontSize:"13px",cursor:"pointer"}),
  chip:{display:"inline-block",background:"rgba(245,166,35,0.12)",border:"1px solid rgba(245,166,35,0.25)",borderRadius:"20px",padding:"4px 10px",fontSize:"11px",color:SHOPEE_ORANGE,margin:"0 4px 4px 0",cursor:"pointer"},
  btnP:{width:"100%",background:`linear-gradient(135deg,${SHOPEE_RED},#C0392B)`,color:"#fff",border:"none",borderRadius:"10px",padding:"11px",fontSize:"14px",fontWeight:"700",cursor:"pointer",marginTop:"10px"},
  btnS:{width:"100%",background:`linear-gradient(135deg,${SHOPEE_ORANGE},#E67E22)`,color:"#fff",border:"none",borderRadius:"10px",padding:"11px",fontSize:"14px",fontWeight:"700",cursor:"pointer"},
};
