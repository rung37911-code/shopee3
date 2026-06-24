import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Square, RefreshCw, Eye, ArrowRight, ArrowLeft, Layers, Settings, ListOrdered, FileText, Search, Sparkles, Video } from "lucide-react";

// ─── ค่าคงที่ ─────────────────────────────────────────────────────────────────
const SHOPEE_RED = "#EE4D2D";
const SHOPEE_ORANGE = "#F5A623";
const TIKTOK_BLACK = "#121212";
const TIKTOK_CYAN = "#00f2fe";
const BG_DARK = "#0A0A14";
const BG_CARD = "#13132A";
const TEXT_MAIN = "#F0F0F0";
const TEXT_MUTED = "#8A8AAA";
const GREEN = "#27AE60";
const GOOGLE_BLUE = "#4285F4";
const GOOGLE_GREEN = "#34A853";
const GEMINI_PURPLE = "#7C3AED";
const GEMINI_PINK = "#EC4899";
const ADMIN_PASSWORD = "admin1234";
const DEMO_KEY = "SCL-MO-DEMO0001";
const PRICE_MONTHLY = 299;
const PRICE_YEARLY = 2990;
const PRICE_LIFETIME = 4990;

import { supabase, isSupabaseConfigured } from "./supabase.js";

// ─── KEY STORE ────────────────────────────────────────────────────────────────
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
function genKey(type) { const p = type === "yearly" ? "YR" : type === "lifetime" ? "LF" : "MO"; return `SCL-${p}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`; }
function getExpiry(type) { if (type === "lifetime") return null; const d = new Date(); type === "yearly" ? d.setFullYear(d.getFullYear() + 1) : d.setMonth(d.getMonth() + 1); return d.toISOString(); }
function keyPrice(type) { return type === "yearly" ? PRICE_YEARLY : type === "lifetime" ? PRICE_LIFETIME : PRICE_MONTHLY; }

// ─── TEMPLATES & HOOKS ────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: "hype", name: "🔥 ไฟแรง", fn: (p, pr, d, plat) => plat === "shopee" ? `🔥🛒 ปักตะกร้าด่วน!!\n\n✨ ${p}\n💰 ราคา ${pr} บาท\n${d ? `🎯 ลด ${d}%\n` : ""}⚡ สต็อกมีจำกัด!\n📲 กดลิงก์ในโปรไฟล์\n\n#Shopee #ปักตะกร้า #ลดราคา` : `🔥🛒 พิกัดในตะกร้าเหลืองด่วน!!\n\n✨ ${p}\n💰 ราคาพิเศษ ${pr} บาท\n${d ? `🎯 ลดจุกๆ ${d}%\n` : ""}⚡ ช้าหมดอดนะ!\n📲 จิ้มตะกร้าซ้ายมือบนคลิป\n\n#TikTokShop #ปักตะกร้า #ลดราคา` },
  { id: "review", name: "⭐ รีวิว", fn: (p, pr, d, plat) => plat === "shopee" ? `⭐ รีวิวจริง ไม่ปิด!\n\n📦 ${p}\n💵 ${pr} บาท\n${d ? `💸 ประหยัด ${d}%\n` : ""}✅ ของดี ราคาคุ้ม!\n\n#รีวิว #Shopee #ของดีราคาถูก` : `⭐ รีวิวจากผู้ใช้จริง!\n\n📦 ${p}\n💵 เพียง ${pr} บาท\n${d ? `💸 ประหยัดไปอีก ${d}%\n` : ""}✅ ของตรงปก ดีจริงบอกต่อ!\n\n#รีวิวของดี #TikTokShop #ของดีราคาถูก` },
  { id: "flash", name: "⚡ เซลเดือด", fn: (p, pr, d, plat) => plat === "shopee" ? `⚡ FLASH SALE แค่วันนี้!!\n\n🎁 ${p}\n🏷️ ${pr} บาท!\n${d ? `🔴 ลด ${d}%\n` : ""}⏰ ราคานี้มีเวลาจำกัด!\n\n#FlashSale #Shopee #Deal` : `⚡ ดีลเดือด นาทีทอง!!\n\n🎁 ${p}\n🏷️ ราคาลดเหลือ ${pr} บาท!\n${d ? `🔴 หั่นราคาลง ${d}%\n` : ""}⏰ เฉพาะในคลิปนี้!\n\n#TikTokShop #FlashSale #ลดราคา` },
  { id: "tiktok", name: "🎵 สไตล์วัยรุ่น", fn: (p, pr, d, plat) => plat === "shopee" ? `POV: เจอของดีราคาโคตรถูก 😱\n\n${p} แค่ ${pr} บาท!!${d ? ` (ลด ${d}%)` : ""}\n\nแบกตะกร้าก่อน!\n\n#Shopee #ปักตะกร้า` : `POV: แฟนบังคับให้รีวิวสิ่งนี้ 😱\n\n${p} แค่ ${pr} บาทเอง!!${d ? ` (ลดตั้ง ${d}%)` : ""}\n\nจิ้มตะกร้าเหลืองด่วน!\n\n#TikTokShop #ของมันต้องมี` },
];
const HOOKS = ["หยุดเลื่อนก่อน! นี่คือสิ่งที่คุณต้องการ", "ราคานี้ต้องบอกต่อ!!", "เพื่อนบอกมา ลองแล้วติดใจ", "ปักตะกร้าไว้ก่อน ตัดสินใจทีหลัง", "ลดแล้ว! อย่าพลาด!"];

// ─── JSON REPAIR HELPER ───────────────────────────────────────────────────────
function repairJSON(raw) {
  let s = raw.replace(/```json|```/g, "").trim();
  const start = s.indexOf("{");
  if (start > 0) s = s.slice(start);
  let inStr = false, esc = false, openBraces = 0, openBrackets = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (esc) { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (!inStr) {
      if (c === "{") openBraces++;
      else if (c === "}") openBraces--;
      else if (c === "[") openBrackets++;
      else if (c === "]") openBrackets--;
    }
  }
  if (inStr) s += '"';
  while (openBrackets > 0) { s += "]"; openBrackets--; }
  while (openBraces > 0) { s += "}"; openBraces--; }
  return s;
}

// ─── CLAUDE API HELPER ────────────────────────────────────────────────────────
async function callClaude(messages, systemPrompt = "", maxTokens = 1200) {
  const apiKey = localStorage.getItem("anthropic_api_key") || "";
  if (!apiKey) throw new Error("ยังไม่ได้ตั้งค่า Anthropic API Key — ไปตั้งค่าที่เมนู ตั้งค่าระบบ ก่อนครับ");
  const body = { model: "claude-sonnet-4-6", max_tokens: maxTokens, messages };
  if (systemPrompt) body.system = systemPrompt;
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.map(c => c.text || "").join("") || "";
}

// ─── GEMINI API HELPER ────────────────────────────────────────────────────────
async function callGemini(prompt, systemPrompt = "", model = "gemini-2.5-flash") {
  const apiKey = localStorage.getItem("gemini_api_key") || "";
  if (!apiKey) throw new Error("ยังไม่ได้ตั้งค่า Gemini API Key — ไปตั้งค่าที่เมนู ตั้งค่าระบบ ก่อนครับ");
  const contents = [];
  if (systemPrompt) contents.push({ role: "user", parts: [{ text: `[System]: ${systemPrompt}\n\n${prompt}` }] });
  else contents.push({ role: "user", parts: [{ text: prompt }] });
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents, generationConfig: { temperature: 0.9, maxOutputTokens: 2048 } }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "";
}

// ─── GOOGLE VEO (VIDEO GENERATION) HELPER ─────────────────────────────────────
// Veo 2 via Gemini Developer API (AI Studio key)
async function startVeoGeneration(prompt) {
  const apiKey = localStorage.getItem("gemini_api_key") || "";
  if (!apiKey) throw new Error("ต้องการ Gemini API Key สำหรับ Google Veo");
  // correct endpoint for AI Studio Veo 2
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/veo-2.0-generate-001:generateVideo?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: { text: prompt },
        generationConfig: { durationSeconds: 8, aspectRatio: "9:16" },
      }),
    }
  );
  const data = await res.json();
  if (data.error) throw new Error(`Veo error: ${data.error.message}`);
  // returns { name: "operations/xxx" }
  const opName = data.name;
  if (!opName) throw new Error("ไม่ได้รับ operation name จาก Veo API");
  return opName;
}

async function pollVeoOperation(operationName) {
  const apiKey = localStorage.getItem("gemini_api_key") || "";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/${operationName}?key=${apiKey}`
  );
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

// แปลง Veo response → Blob URL
async function extractVeoVideo(result) {
  // format 1: response.videos[0].uri (signed URL)
  const uri = result.response?.videos?.[0]?.uri || result.response?.video?.uri;
  if (uri) {
    const r = await fetch(uri);
    const blob = await r.blob();
    return { blob, url: URL.createObjectURL(blob) };
  }
  // format 2: response.videos[0].bytesBase64Encoded
  const b64 = result.response?.videos?.[0]?.bytesBase64Encoded
    || result.response?.video?.bytesBase64Encoded
    || result.response?.predictions?.[0]?.bytesBase64Encoded;
  if (b64) {
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: "video/mp4" });
    return { blob, url: URL.createObjectURL(blob) };
  }
  throw new Error("ไม่พบข้อมูลวิดีโอใน response — กรุณาตรวจสอบสิทธิ์ Veo ใน AI Studio");
}

// ─── AI PROVIDER SELECTOR ────────────────────────────────────────────────────
// ใช้สลับระหว่าง Claude ↔ Gemini สำหรับ text generation
async function callAIProvider(prompt, provider = "claude", systemPrompt = "") {
  if (provider === "gemini") return callGemini(prompt, systemPrompt);
  return callClaude([{ role: "user", content: prompt }], systemPrompt);
}

// ─── TTS HELPER ───────────────────────────────────────────────────────────────
function speakText(text, onEnd) {
  if (!window.speechSynthesis) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "th-TH"; utt.rate = 0.95; utt.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const thVoice = voices.find(v => v.lang.startsWith("th"));
  if (thVoice) utt.voice = thVoice;
  utt.onend = onEnd;
  window.speechSynthesis.speak(utt);
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
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

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
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
    kd.lastLogin = new Date().toISOString(); kd.loginCount = (kd.loginCount || 0) + 1;
    await kSet(`key:${k}`, kd); setLoading(false); onSuccess(k, kd, false);
  };
  const doAdminLogin = () => { if (pass !== ADMIN_PASSWORD) { setErr("รหัสผ่านไม่ถูกต้อง"); return; } onSuccess("ADMIN", { name: "Admin", type: "admin" }, true); };
  const S = LS;
  return (
    <div style={S.bg}><div style={S.box}>
      <div style={S.logoWrap}><div style={{ fontSize: "40px" }}>🚀</div><div style={S.logoText}>ClipAI<span style={{ color: SHOPEE_ORANGE }}>Master</span></div><div style={S.logoSub}>ระบบสร้างคลิปปักตะกร้า + แคปชั่น อัตโนมัติ (Shopee & TikTok)</div></div>
      <div style={S.tabRow}><button style={S.tab(mode === "user")} onClick={() => { setMode("user"); setErr(""); }}>🔑 เข้าใช้งาน</button><button style={S.tab(mode === "admin")} onClick={() => { setMode("admin"); setErr(""); }}>⚙️ Admin</button></div>
      {mode === "user" ? (<><label style={S.label}>License Key</label><input style={S.input} placeholder="SCL-MO-XXXXXXXX" value={keyVal} onChange={e => setKeyVal(e.target.value)} onKeyDown={e => e.key === "Enter" && doUserLogin()} /><div style={S.hint}>* Key ได้รับจากผู้ขาย</div><div style={{ fontSize: "12px", color: SHOPEE_ORANGE, marginBottom: "12px", cursor: "pointer" }} onClick={() => setKeyVal(DEMO_KEY)}>🧪 กดเพื่อใส่ Demo Key ทดสอบ</div>{err && <div style={S.err}>{err}</div>}<button style={S.btn} onClick={doUserLogin} disabled={loading}>{loading ? "กำลังตรวจสอบ..." : "เข้าใช้งาน →"}</button></>) : (<><label style={S.label}>รหัสผ่าน Admin</label><input style={S.input} type="password" placeholder="••••••••" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && doAdminLogin()} />{err && <div style={S.err}>{err}</div>}<button style={S.btn} onClick={doAdminLogin}>เข้า Admin Panel →</button></>)}
      <div style={{ textAlign: "center", marginTop: "16px", fontSize: "11px", color: "rgba(255,255,255,0.25)" }}>ClipAIMaster v3.0 • Scanner + AI Video + Google Veo</div>
    </div></div>
  );
}
const LS = {
  bg: { minHeight: "100vh", background: BG_DARK, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Segoe UI','Noto Sans Thai',sans-serif" },
  box: { background: BG_CARD, borderRadius: "20px", padding: "32px 28px", width: "100%", maxWidth: "380px", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
  logoWrap: { textAlign: "center", marginBottom: "28px" }, logoText: { fontSize: "26px", fontWeight: "900", color: TEXT_MAIN, letterSpacing: "-0.5px" }, logoSub: { fontSize: "12px", color: TEXT_MUTED, marginTop: "4px" },
  tabRow: { display: "flex", gap: "8px", marginBottom: "20px" }, tab: (a) => ({ flex: 1, padding: "9px", borderRadius: "10px", border: "none", fontSize: "13px", fontWeight: a ? "700" : "400", cursor: "pointer", background: a ? SHOPEE_RED : "rgba(255,255,255,0.06)", color: a ? "#fff" : TEXT_MUTED }),
  label: { display: "block", fontSize: "12px", color: TEXT_MUTED, marginBottom: "6px" }, input: { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "11px 14px", color: TEXT_MAIN, fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "6px", letterSpacing: "1px" },
  hint: { fontSize: "11px", color: TEXT_MUTED, marginBottom: "4px" }, err: { background: "rgba(238,77,45,0.15)", border: "1px solid rgba(238,77,45,0.3)", borderRadius: "8px", padding: "8px 12px", fontSize: "13px", color: "#FF6B6B", marginBottom: "12px" },
  btn: { width: "100%", background: `linear-gradient(135deg,${SHOPEE_RED},#C0392B)`, color: "#fff", border: "none", borderRadius: "10px", padding: "13px", fontSize: "15px", fontWeight: "700", cursor: "pointer", marginTop: "4px" },
};

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
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
    for (const n of names) { const d = await kGet(n); if (d) list.push({ storageKey: n, keyCode: n.replace("key:", ""), ...d }); }
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setKeys(list); setLoading(false);
  };
  useEffect(() => { loadKeys(); }, []);
  const stats = { total: keys.length, active: keys.filter(k => k.active && !isExpired(k)).length, expired: keys.filter(k => isExpired(k) || !k.active).length, pending: keys.filter(k => !k.loginCount || k.loginCount === 0).length, monthly: keys.filter(k => k.type === "monthly").length, yearly: keys.filter(k => k.type === "yearly").length, lifetime: keys.filter(k => k.type === "lifetime").length };
  const revenueTotal = keys.reduce((sum, k) => sum + keyPrice(k.type), 0);
  const thisMonth = new Date().getMonth(); const thisYear = new Date().getFullYear();
  const revenueMonth = keys.filter(k => { const d = new Date(k.createdAt); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }).reduce((sum, k) => sum + keyPrice(k.type), 0);
  const months6 = Array.from({ length: 6 }, (_, i) => { const d = new Date(); d.setMonth(d.getMonth() - 5 + i); return { label: `${d.getMonth() + 1}/${d.getFullYear()}`, m: d.getMonth(), y: d.getFullYear() }; });
  const chartData = months6.map(({ label, m, y }) => ({ label, revenue: keys.filter(k => { const d = new Date(k.createdAt); return d.getMonth() === m && d.getFullYear() === y; }).reduce((sum, k) => sum + keyPrice(k.type), 0), count: keys.filter(k => { const d = new Date(k.createdAt); return d.getMonth() === m && d.getFullYear() === y; }).length }));
  const maxRev = Math.max(...chartData.map(d => d.revenue), 1);
  const createKey = async () => { const code = genKey(newType); const kd = { code, type: newType, buyerName: newName || "ไม่ระบุ", note: newNote, active: true, createdAt: new Date().toISOString(), expiresAt: getExpiry(newType), loginCount: 0, lastLogin: null }; await kSet(`key:${code}`, kd); setCreated(code); setNewName(""); setNewNote(""); loadKeys(); };
  const toggleKey = async (code, cur) => { const d = await kGet(`key:${code}`); if (d) { d.active = !cur; await kSet(`key:${code}`, d); loadKeys(); } };
  const deleteKey = async (code) => { if (!confirm(`ลบ Key ${code}?`)) return; await kDel(`key:${code}`); loadKeys(); };
  const copyKey = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const filtered = keys.filter(k => k.keyCode.includes(search.toUpperCase()) || k.buyerName?.includes(search) || k.note?.includes(search));
  const menuItems = [{ id: "dashboard", icon: "📊", label: "Dashboard" }, { id: "create", icon: "🔑", label: "License Keys" }, { id: "keys", icon: "👥", label: "ลูกค้า" }, { id: "revenue", icon: "💰", label: "ยอดขาย" }];
  return (
    <div style={{ minHeight: "100vh", background: "#0d1117", color: TEXT_MAIN, fontFamily: "'Segoe UI','Noto Sans Thai',sans-serif", display: "flex" }}>
      <div style={{ width: "200px", background: "#13132A", borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: "16px", fontWeight: "800", color: SHOPEE_ORANGE }}>ClipAI Admin</div><div style={{ fontSize: "11px", color: TEXT_MUTED, marginTop: "2px" }}>Management Panel</div></div>
        <nav style={{ flex: 1, padding: "12px 8px" }}>{menuItems.map(item => (<button key={item.id} onClick={() => setAdminTab(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "8px", border: "none", fontSize: "13px", cursor: "pointer", marginBottom: "4px", background: adminTab === item.id ? "rgba(238,77,45,0.15)" : "transparent", color: adminTab === item.id ? SHOPEE_RED : TEXT_MUTED, fontWeight: adminTab === item.id ? "700" : "400" }}><span>{item.icon}</span>{item.label}</button>))}</nav>
        <div style={{ padding: "16px 8px", borderTop: "1px solid rgba(255,255,255,0.06)" }}><button onClick={onLogout} style={{ width: "100%", padding: "9px", borderRadius: "8px", border: "none", background: "rgba(255,255,255,0.06)", color: TEXT_MUTED, fontSize: "12px", cursor: "pointer" }}>ออกจากระบบ</button></div>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#13132A" }}><div style={{ fontSize: "20px", fontWeight: "800" }}>{adminTab === "dashboard" ? "Dashboard" : adminTab === "create" ? "สร้าง License Key" : adminTab === "keys" ? "รายการลูกค้า" : "ยอดขาย"}</div></div>
        <div style={{ padding: "20px 24px" }}>
          {adminTab === "dashboard" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "16px" }}>{[{ label: "ลูกค้า", val: stats.total, color: "#667eea", icon: "👥" }, { label: "Active Keys", val: stats.active, color: GREEN, icon: "✅" }, { label: "รายได้เดือนนี้", val: `฿${revenueMonth.toLocaleString()}`, color: SHOPEE_ORANGE, icon: "📅" }, { label: "รายได้รวม", val: `฿${revenueTotal.toLocaleString()}`, color: "#e74c3c", icon: "💰" }].map(s => (<div key={s.label} style={{ background: BG_CARD, borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: "11px", color: TEXT_MUTED, marginBottom: "6px" }}>{s.icon} {s.label}</div><div style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.val}</div></div>))}</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px", marginBottom: "20px" }}>{[{ label: "รอ Activate", val: stats.pending, color: SHOPEE_ORANGE }, { label: "หมดอายุ", val: stats.expired, color: "#e74c3c" }, { label: "ยกเลิก", val: 0, color: TEXT_MUTED }, { label: "Keys ทั้งหมด", val: stats.total, color: "#9B59B6" }].map(s => (<div key={s.label} style={{ background: BG_CARD, borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: "11px", color: TEXT_MUTED, marginBottom: "6px" }}>{s.label}</div><div style={{ fontSize: "22px", fontWeight: "800", color: s.color }}>{s.val}</div></div>))}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div style={{ background: BG_CARD, borderRadius: "14px", padding: "18px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: SHOPEE_ORANGE, marginBottom: "16px" }}>ยอดขายรายเดือน (บาท)</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>{chartData.map((d, i) => (<div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}><div style={{ fontSize: "9px", color: TEXT_MUTED }}>{d.revenue > 0 ? `฿${d.revenue}` : ""}</div><div style={{ width: "100%", borderRadius: "4px 4px 0 0", background: i === chartData.length - 1 ? SHOPEE_RED : "#9B59B6", minHeight: "4px", height: `${Math.max(4, (d.revenue / maxRev) * 100)}px` }} /><div style={{ fontSize: "9px", color: TEXT_MUTED, whiteSpace: "nowrap" }}>{d.label}</div></div>))}</div>
              </div>
              <div style={{ background: BG_CARD, borderRadius: "14px", padding: "18px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: "13px", fontWeight: "700", color: SHOPEE_ORANGE, marginBottom: "16px" }}>สัดส่วนแพ็กเกจ</div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">{(() => { const total = stats.total || 1; const segs = [{ val: stats.monthly, color: SHOPEE_ORANGE }, { val: stats.yearly, color: "#9B59B6" }, { val: stats.lifetime, color: GREEN }]; let offset = 0; return segs.map((seg, i) => { const pct = seg.val / total; const dash = pct * 251.2; const el = <circle key={i} cx="50" cy="50" r="40" fill="none" stroke={seg.color} strokeWidth="18" strokeDasharray={`${dash} ${251.2 - dash}`} strokeDashoffset={-offset} transform="rotate(-90 50 50)" opacity="0.85" />; offset += dash; return el; }); })()}<circle cx="50" cy="50" r="31" fill="#13132A" /><text x="50" y="55" textAnchor="middle" fill={TEXT_MAIN} fontSize="13" fontWeight="800">{stats.total}</text></svg>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>{[["รายเดือน", stats.monthly, SHOPEE_ORANGE], ["รายปี", stats.yearly, "#9B59B6"], ["ตลอดชีพ", stats.lifetime, GREEN]].map(([l, v, c]) => (<div key={l} style={{ display: "flex", alignItems: "center", gap: "6px" }}><div style={{ width: "10px", height: "10px", borderRadius: "2px", background: c }} /><span style={{ fontSize: "11px", color: TEXT_MUTED }}>{l}</span><span style={{ fontSize: "11px", fontWeight: "700", color: TEXT_MAIN, marginLeft: "4px" }}>{v}</span></div>))}</div>
                </div>
              </div>
            </div>
            <div style={{ background: BG_CARD, borderRadius: "14px", padding: "18px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ fontSize: "13px", fontWeight: "700", color: SHOPEE_ORANGE, marginBottom: "12px" }}>รายการล่าสุด</div>
              {keys.slice(0, 5).map(k => { const exp = isExpired(k); return (<div key={k.keyCode} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><div><div style={{ fontSize: "12px", fontFamily: "monospace", color: TEXT_MAIN, fontWeight: "700" }}>{k.keyCode}</div><div style={{ fontSize: "11px", color: TEXT_MUTED }}>{k.buyerName || "ไม่ระบุ"} • {fmtDate(k.createdAt)}</div></div><div style={{ display: "flex", gap: "6px", alignItems: "center" }}><span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "20px", background: k.active && !exp ? "rgba(39,174,96,0.15)" : "rgba(238,77,45,0.15)", color: k.active && !exp ? GREEN : "#e74c3c" }}>{k.active && !exp ? "ใช้งาน" : "หมดอายุ"}</span><span style={{ fontSize: "11px", fontWeight: "700", color: SHOPEE_ORANGE }}>฿{keyPrice(k.type).toLocaleString()}</span></div></div>); })}
              {keys.length === 0 && <div style={{ textAlign: "center", color: TEXT_MUTED, padding: "20px" }}>ยังไม่มีข้อมูล</div>}
            </div>
          </>)}
          {adminTab === "create" && (<div style={{ maxWidth: "480px" }}><div style={{ background: BG_CARD, borderRadius: "16px", padding: "20px", border: "1px solid rgba(255,255,255,0.07)" }}>
            <div style={{ fontSize: "14px", fontWeight: "700", color: SHOPEE_ORANGE, marginBottom: "16px" }}>สร้าง License Key ใหม่</div>
            <label style={{ display: "block", fontSize: "12px", color: TEXT_MUTED, marginBottom: "5px" }}>ชื่อผู้ซื้อ / ร้านค้า</label>
            <input style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: TEXT_MAIN, fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" }} placeholder="เช่น ร้านสมชาย" value={newName} onChange={e => setNewName(e.target.value)} />
            <label style={{ display: "block", fontSize: "12px", color: TEXT_MUTED, marginBottom: "8px" }}>ประเภท Key</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>{[["monthly", "📅 รายเดือน", "30 วัน", `฿${PRICE_MONTHLY}`], ["yearly", "📆 รายปี", "365 วัน", `฿${PRICE_YEARLY}`], ["lifetime", "♾️ ตลอดชีพ", "ไม่หมด", `฿${PRICE_LIFETIME}`]].map(([v, l, s, p]) => (<div key={v} style={{ background: newType === v ? "rgba(238,77,45,0.15)" : "rgba(255,255,255,0.04)", border: newType === v ? `2px solid ${SHOPEE_RED}` : "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "10px 8px", textAlign: "center", cursor: "pointer" }} onClick={() => setNewType(v)}><div style={{ fontSize: "12px", fontWeight: "700", color: TEXT_MAIN }}>{l}</div><div style={{ fontSize: "10px", color: TEXT_MUTED }}>{s}</div><div style={{ fontSize: "12px", fontWeight: "800", color: SHOPEE_ORANGE, marginTop: "4px" }}>{p}</div></div>))}</div>
            <label style={{ display: "block", fontSize: "12px", color: TEXT_MUTED, marginBottom: "5px" }}>หมายเหตุ</label>
            <input style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: TEXT_MAIN, fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "14px" }} placeholder="เช่น ชำระ 299 บาท" value={newNote} onChange={e => setNewNote(e.target.value)} />
            <button style={{ width: "100%", background: `linear-gradient(135deg,${SHOPEE_RED},#C0392B)`, color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: "700", cursor: "pointer" }} onClick={createKey}>🔑 สร้าง Key ใหม่</button>
            {created && (<div style={{ marginTop: "14px", background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.3)", borderRadius: "12px", padding: "14px" }}><div style={{ fontSize: "13px", color: TEXT_MUTED, marginBottom: "6px" }}>สร้างสำเร็จ!</div><div style={{ fontFamily: "monospace", fontSize: "18px", fontWeight: "800", color: GREEN, letterSpacing: "2px", textAlign: "center", padding: "10px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", marginBottom: "8px" }}>{created}</div><button style={{ width: "100%", background: GREEN, color: "#fff", border: "none", borderRadius: "8px", padding: "9px", fontSize: "13px", fontWeight: "700", cursor: "pointer" }} onClick={() => copyKey(created)}>{copied ? "คัดลอกแล้ว" : "📋 คัดลอก Key"}</button></div>)}
          </div></div>)}
          {adminTab === "keys" && (<>
            <input style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px 14px", color: TEXT_MAIN, fontSize: "14px", outline: "none", boxSizing: "border-box", marginBottom: "12px" }} placeholder="ค้นหา Key / ชื่อผู้ซื้อ..." value={search} onChange={e => setSearch(e.target.value)} />
            {loading ? <div style={{ textAlign: "center", color: TEXT_MUTED, padding: "30px" }}>กำลังโหลด...</div> : filtered.length === 0 ? <div style={{ textAlign: "center", color: TEXT_MUTED, padding: "30px" }}>ไม่พบข้อมูล</div> : filtered.map(k => { const exp = isExpired(k); return (<div key={k.keyCode} style={{ background: BG_CARD, borderRadius: "12px", padding: "14px", marginBottom: "10px", border: k.active && !exp ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(238,77,45,0.2)" }}><div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}><span style={{ fontFamily: "monospace", fontSize: "14px", fontWeight: "800", color: TEXT_MAIN }}>{k.keyCode}</span><span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.1)", color: SHOPEE_ORANGE }}>{k.type === "monthly" ? "รายเดือน" : k.type === "yearly" ? "รายปี" : "ตลอดชีพ"}</span><span style={{ fontSize: "11px", fontWeight: "700", color: SHOPEE_ORANGE, marginLeft: "auto" }}>฿{keyPrice(k.type).toLocaleString()}</span></div><div style={{ fontSize: "12px", color: TEXT_MUTED }}>{k.buyerName ? `👤 ${k.buyerName} | 📝 ${k.note}` : ""}</div><div style={{ fontSize: "12px", color: TEXT_MUTED }}>หมดอายุ: {exp ? <span style={{ color: "#e74c3c" }}>หมดแล้ว</span> : <span>{fmtDate(k.expiresAt)}</span>} | เข้าใช้: {k.loginCount || 0} ครั้ง</div><div style={{ display: "flex", gap: "8px", marginTop: "8px" }}><button style={{ flex: 1, padding: "5px", borderRadius: "6px", border: "none", fontSize: "12px", cursor: "pointer", background: "rgba(255,255,255,0.1)", color: TEXT_MAIN }} onClick={() => toggleKey(k.keyCode, k.active)}>{k.active ? "🔒 ระงับ" : "✅ เปิดใช้"}</button><button style={{ flex: 1, padding: "5px", borderRadius: "6px", border: "none", fontSize: "12px", cursor: "pointer", background: "rgba(231,76,60,0.2)", color: "#e74c3c" }} onClick={() => deleteKey(k.keyCode)}>🗑️ ลบ</button></div></div>); })}
          </>)}
          {adminTab === "revenue" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>{[{ label: "รายได้เดือนนี้", val: `฿${revenueMonth.toLocaleString()}`, color: SHOPEE_ORANGE }, { label: "รายได้รวมทั้งหมด", val: `฿${revenueTotal.toLocaleString()}`, color: GREEN }, { label: "รายเดือน (จำนวน)", val: `${stats.monthly} คน x ฿${PRICE_MONTHLY}`, color: "#667eea" }, { label: "รายปี + ตลอดชีพ", val: `${stats.yearly + stats.lifetime} คน`, color: "#9B59B6" }].map(s => (<div key={s.label} style={{ background: BG_CARD, borderRadius: "12px", padding: "16px", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: "11px", color: TEXT_MUTED, marginBottom: "6px" }}>{s.label}</div><div style={{ fontSize: "18px", fontWeight: "800", color: s.color }}>{s.val}</div></div>))}</div>
            <div style={{ background: BG_CARD, borderRadius: "14px", padding: "18px", border: "1px solid rgba(255,255,255,0.06)" }}><div style={{ fontSize: "13px", fontWeight: "700", color: SHOPEE_ORANGE, marginBottom: "16px" }}>ยอดขายรายเดือน</div>{chartData.map((d, i) => (<div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}><div style={{ width: "60px", fontSize: "11px", color: TEXT_MUTED, textAlign: "right" }}>{d.label}</div><div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "4px", height: "20px", overflow: "hidden" }}><div style={{ height: "100%", background: i === chartData.length - 1 ? SHOPEE_RED : "#9B59B6", borderRadius: "4px", width: `${Math.max(2, (d.revenue / maxRev) * 100)}%` }} /></div><div style={{ width: "80px", fontSize: "11px", color: TEXT_MAIN, fontWeight: "700" }}>฿{d.revenue.toLocaleString()} ({d.count})</div></div>))}</div>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ─── PRODUCT SCANNER ──────────────────────────────────────────────────────────
function ProductScanner({ onProductFound, platform, aiProvider }) {
  const [tab, setTab] = useState("url");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);

  const stopCamera = useCallback(() => { streamRef.current?.getTracks().forEach(t => t.stop()); setCameraOn(false); }, []);
  useEffect(() => () => stopCamera(), [stopCamera]);

  const parseAIResult = async (promise) => {
    try {
      const result = await promise;
      let parsed;
      try {
        const clean = result.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        const repaired = repairJSON(result);
        parsed = JSON.parse(repaired);
      }
      setPreview(parsed);
      setStatus("✅ ดึงข้อมูลสำเร็จ! ตรวจสอบและยืนยันด้านล่าง");
    } catch (e) {
      setStatus("❌ JSON ไม่สมบูรณ์ — ลองใหม่อีกครั้ง: " + e.message);
    }
    setLoading(false);
  };

  const scanUrl = async () => {
    if (!url.trim()) return;
    setLoading(true); setStatus(`🔍 ${aiProvider === "gemini" ? "Gemini" : "Claude"} กำลังอ่านข้อมูลสินค้าจาก URL...`);
    const platformHint = url.includes("shopee") ? "Shopee" : url.includes("tiktok") ? "TikTok Shop" : platform;
    const prompt = `วิเคราะห์สินค้าจาก URL ${platformHint} นี้: ${url}\n\nตอบเป็น JSON เท่านั้น ห้ามมี text อื่น:\n{"name":"ชื่อสินค้าสั้น","price":"ตัวเลขราคา","discount":"ตัวเลขส่วนลด","category":"หมวดหมู่","description":"คำบรรยาย 1-2 ประโยค","keywords":["kw1","kw2","kw3"],"platform":"${platformHint}"}`;
    await parseAIResult(callAIProvider(prompt, aiProvider));
  };

  const scanImage = async (base64, mimeType = "image/jpeg") => {
    setLoading(true); setStatus("🔍 AI กำลังวิเคราะห์รูปสินค้า...");
    // Image scan always uses Claude (Gemini image scan needs different flow)
    await parseAIResult(callClaude([{
      role: "user",
      content: [
        { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } },
        { type: "text", text: `วิเคราะห์สินค้าจากรูปนี้ ตอบ JSON เท่านั้น:\n{"name":"ชื่อสินค้า","price":"ราคา (ตัวเลข)","discount":"ส่วนลด%","category":"หมวดหมู่","description":"คำบรรยาย 2-3 ประโยคภาษาไทย","keywords":["kw1","kw2","kw3"],"platform":"${platform}"}` }
      ]
    }], "", 600));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => scanImage(reader.result.split(",")[1], file.type);
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream; videoRef.current.srcObject = stream; setCameraOn(true);
    } catch { setStatus("❌ ไม่สามารถเปิดกล้องได้"); }
  };

  const captureCamera = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d").drawImage(videoRef.current, 0, 0);
    stopCamera(); scanImage(canvas.toDataURL("image/jpeg").split(",")[1], "image/jpeg");
  };

  const M = MS;
  const statusBg = status.startsWith("✅") ? "rgba(39,174,96,0.1)" : status.startsWith("❌") ? "rgba(238,77,45,0.1)" : "rgba(255,255,255,0.05)";
  const statusBorder = status.startsWith("✅") ? "rgba(39,174,96,0.3)" : status.startsWith("❌") ? "rgba(238,77,45,0.3)" : "rgba(255,255,255,0.1)";

  return (
    <div style={M.card}>
      <div style={M.cardT}>🔬 สแกนสินค้าอัตโนมัติ</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {[["url", "🔗 จาก URL"], ["image", "📷 จากรูป"], ["camera", "📸 กล้อง"]].map(([id, label]) => (
          <button key={id} style={M.tab(tab === id)} onClick={() => { setTab(id); setStatus(""); setPreview(null); }}>{label}</button>
        ))}
      </div>

      {tab === "url" && (
        <>
          <input style={M.input} placeholder="วาง URL สินค้า Shopee หรือ TikTok Shop..." value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && scanUrl()} />
          <button style={{ ...M.btnS, opacity: loading ? 0.6 : 1 }} onClick={scanUrl} disabled={loading}>
            {loading ? "⏳ กำลังดึงข้อมูล..." : `🔍 สแกน URL ด้วย ${aiProvider === "gemini" ? "Gemini" : "Claude"}`}
          </button>
        </>
      )}

      {tab === "image" && (
        <>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
          <button style={{ ...M.btnS, opacity: loading ? 0.6 : 1 }} onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? "⏳ AI วิเคราะห์รูป..." : "📂 เลือกรูปสินค้า / บาร์โค้ด"}
          </button>
        </>
      )}

      {tab === "camera" && (
        <>
          <video ref={videoRef} autoPlay playsInline style={{ width: "100%", borderRadius: 10, display: cameraOn ? "block" : "none", marginBottom: 8 }} />
          {!cameraOn
            ? <button style={M.btnS} onClick={startCamera}>📸 เปิดกล้อง</button>
            : <div style={{ display: "flex", gap: 8 }}>
              <button style={{ ...M.btnP, flex: 1 }} onClick={captureCamera}>📷 ถ่ายภาพ + วิเคราะห์</button>
              <button style={{ flex: 1, padding: "11px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.06)", color: TEXT_MUTED, cursor: "pointer", fontSize: 13 }} onClick={stopCamera}>✕ ปิดกล้อง</button>
            </div>
          }
        </>
      )}

      {status && <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: statusBg, border: `1px solid ${statusBorder}`, fontSize: 12, color: TEXT_MAIN }}>{status}</div>}

      {preview && (
        <div style={{ marginTop: 12, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: SHOPEE_ORANGE, marginBottom: 8 }}>📦 ข้อมูลที่ดึงได้</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[["ชื่อสินค้า", preview.name], ["ราคา", preview.price ? `฿${preview.price}` : "-"], ["ส่วนลด", preview.discount ? `${preview.discount}%` : "-"], ["หมวดหมู่", preview.category]].map(([k, v]) => (
              <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 10px" }}>
                <div style={{ fontSize: 10, color: TEXT_MUTED }}>{k}</div>
                <div style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 600, marginTop: 2 }}>{v || "-"}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 12, color: TEXT_MUTED, lineHeight: 1.6, marginBottom: 8 }}>{preview.description}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
            {preview.keywords?.map(kw => (
              <span key={kw} style={{ background: "rgba(155,89,182,0.15)", border: "1px solid rgba(155,89,182,0.3)", borderRadius: 20, padding: "2px 8px", fontSize: 10, color: "#C39BD3" }}>#{kw}</span>
            ))}
          </div>
          <button
            style={{ ...M.btnP, background: `linear-gradient(135deg,${GREEN},#1E8449)` }}
            onClick={() => onProductFound({ name: preview.name, price: preview.price, discount: preview.discount, description: preview.description, keywords: preview.keywords, link: url })}
          >
            ✅ ใช้ข้อมูลนี้ → กรอกฟอร์มอัตโนมัติ
          </button>
        </div>
      )}
    </div>
  );
}

// ─── GOOGLE VEO VIDEO GENERATOR ──────────────────────────────────────────────
function GoogleVeoGenerator({ M, product, price, disc, platform, onVideoReady }) {
  const [veoPrompt, setVeoPrompt] = useState("");
  const [veoStyle, setVeoStyle] = useState("product_showcase");
  const [veoStatus, setVeoStatus] = useState("idle"); // idle | generating | polling | done | error
  const [veoProgress, setVeoProgress] = useState(0);
  const [veoLog, setVeoLog] = useState([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [operationName, setOperationName] = useState("");
  const pollRef = useRef(null);

  // สร้าง prompt อัตโนมัติจากข้อมูลสินค้า
  const VEO_STYLES = [
    { id: "product_showcase", label: "🛍️ โชว์สินค้า", suffix: "clean white background, product rotating slowly, studio lighting, professional e-commerce style" },
    { id: "lifestyle", label: "🌟 ไลฟ์สไตล์", suffix: "lifestyle shot, natural lighting, modern Thai home setting, person using product, warm tones" },
    { id: "unboxing", label: "📦 Unboxing", suffix: "unboxing video style, hands opening packaging, close-up detail shots, excitement energy" },
    { id: "review", label: "⭐ รีวิว", suffix: "review-style video, talking head + product close-up, TikTok vertical format, engaging presenter" },
  ];

  useEffect(() => {
    if (product) {
      const style = VEO_STYLES.find(s => s.id === veoStyle);
      setVeoPrompt(`Thai e-commerce product video for "${product}"${price ? `, priced at ${price} baht` : ""}${disc ? `, ${disc}% discount` : ""}. ${style?.suffix || ""}. Vertical 9:16 format for ${platform === "shopee" ? "Shopee" : "TikTok"} affiliate clip. High quality, engaging, 8 seconds.`);
    }
  }, [product, price, disc, platform, veoStyle]);

  const addLog = (msg) => setVeoLog(prev => [...prev, `[${new Date().toLocaleTimeString("th-TH")}] ${msg}`]);

  const startGeneration = async () => {
    if (!veoPrompt.trim()) { alert("กรุณาใส่ prompt ก่อนครับ"); return; }
    const geminiKey = localStorage.getItem("gemini_api_key") || "";
    if (!geminiKey) { alert("ต้องการ Gemini API Key สำหรับ Google Veo — ไปตั้งค่าที่เมนู ตั้งค่าระบบ"); return; }

    setVeoStatus("generating"); setVeoProgress(5); setVeoLog([]);
    addLog("ส่ง prompt ไปยัง Google Veo 2...");

    try {
      const opName = await startVeoGeneration(veoPrompt);
      setOperationName(opName);
      addLog(`Operation เริ่มต้นแล้ว: ${opName}`);
      addLog("รอผลการสร้างวิดีโอ... (ประมาณ 1-3 นาที)");
      setVeoStatus("polling");
      startPolling(opName);
    } catch (e) {
      addLog(`❌ เกิดข้อผิดพลาด: ${e.message}`);
      setVeoStatus("error");
    }
  };

  const startPolling = (opName) => {
    let attempts = 0;
    const maxAttempts = 40; // 40 × 5s = 3.3 minutes
    pollRef.current = setInterval(async () => {
      attempts++;
      const pct = Math.min(90, 5 + attempts * 2);
      setVeoProgress(pct);
      addLog(`ตรวจสอบสถานะ... (ครั้งที่ ${attempts}/${maxAttempts})`);
      try {
        const result = await pollVeoOperation(opName);
        addLog(`response keys: ${Object.keys(result).join(", ")}`);
        if (result.done) {
          clearInterval(pollRef.current);
          try {
            const { blob, url } = await extractVeoVideo(result);
            setVideoUrl(url);
            setVeoStatus("done");
            setVeoProgress(100);
            addLog("✅ สร้างวิดีโอสำเร็จ! พร้อมดาวน์โหลดและเพิ่มในคิว");
            await onVideoReady(blob, `veo-${Date.now()}.mp4`);
          } catch (extractErr) {
            addLog(`❌ ${extractErr.message}`);
            addLog(`raw: ${JSON.stringify(result).slice(0, 200)}`);
            setVeoStatus("error");
          }
        }
      } catch (e) {
        addLog(`⚠️ poll ล้มเหลว: ${e.message}`);
      }
      if (attempts >= maxAttempts) {
        clearInterval(pollRef.current);
        addLog("❌ หมดเวลารอ (timeout) ลองใหม่อีกครั้ง");
        setVeoStatus("error");
      }
    }, 5000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const statusColor = { idle: TEXT_MUTED, generating: SHOPEE_ORANGE, polling: GOOGLE_BLUE, done: GREEN, error: "#e74c3c" };
  const statusLabel = { idle: "รอเริ่มต้น", generating: "กำลังส่ง prompt...", polling: "กำลังสร้างวิดีโอ...", done: "สำเร็จ!", error: "เกิดข้อผิดพลาด" };

  return (
    <div style={M.card}>
      {/* Header badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `linear-gradient(135deg, ${GOOGLE_BLUE}, ${GOOGLE_GREEN})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>G</div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_MAIN }}>Google Veo 2 Video Generator</div>
          <div style={{ fontSize: 10, color: TEXT_MUTED }}>สร้างคลิปจาก AI ด้วย Gemini API • ต้องการ Gemini API Key</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: statusColor[veoStatus] }}>{statusLabel[veoStatus]}</div>
      </div>

      {/* Style selector */}
      <div style={{ marginBottom: 10 }}>
        <label style={M.label}>สไตล์วิดีโอ</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {VEO_STYLES.map(st => (
            <button key={st.id} style={{ padding: "8px 10px", borderRadius: 8, border: veoStyle === st.id ? `2px solid ${GOOGLE_BLUE}` : "1px solid rgba(255,255,255,0.1)", background: veoStyle === st.id ? "rgba(66,133,244,0.12)" : "rgba(255,255,255,0.03)", color: veoStyle === st.id ? TEXT_MAIN : TEXT_MUTED, fontSize: 12, fontWeight: veoStyle === st.id ? 700 : 400, cursor: "pointer", textAlign: "left" }} onClick={() => setVeoStyle(st.id)}>{st.label}</button>
          ))}
        </div>
      </div>

      {/* Prompt editor */}
      <label style={M.label}>Prompt (แก้ไขได้)</label>
      <textarea
        value={veoPrompt}
        onChange={e => setVeoPrompt(e.target.value)}
        rows={4}
        style={{ width: "100%", background: "rgba(66,133,244,0.06)", border: "1px solid rgba(66,133,244,0.25)", borderRadius: 10, padding: "10px 14px", color: TEXT_MAIN, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6, marginBottom: 10 }}
        placeholder="อธิบายวิดีโอที่ต้องการสร้าง (ภาษาอังกฤษได้ผลดีกว่า)"
      />

      {/* Progress */}
      {veoStatus !== "idle" && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ height: "100%", background: `linear-gradient(90deg,${GOOGLE_BLUE},${GOOGLE_GREEN})`, borderRadius: 3, width: `${veoProgress}%`, transition: "width 0.5s" }} />
          </div>
          <div ref={el => { if (el) el.scrollTop = el.scrollHeight; }} style={{ background: "#000", borderRadius: 8, padding: "8px 10px", height: 80, overflowY: "auto", fontFamily: "monospace", fontSize: 10, lineHeight: 1.6, border: "1px solid rgba(255,255,255,0.06)" }}>
            {veoLog.map((l, i) => <div key={i} style={{ color: l.includes("✅") ? GREEN : l.includes("❌") ? "#e74c3c" : TEXT_MUTED }}>{l}</div>)}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {(veoStatus === "idle" || veoStatus === "error") && (
        <button
          style={{ ...M.btnP, background: `linear-gradient(135deg,${GOOGLE_BLUE},${GOOGLE_GREEN})`, marginTop: 0 }}
          onClick={startGeneration}
        >
          🎬 สร้างคลิป AI ด้วย Google Veo 2
        </button>
      )}

      {veoStatus === "polling" && (
        <button style={{ ...M.btnP, background: "rgba(255,255,255,0.1)", cursor: "not-allowed", marginTop: 0 }} disabled>
          ⏳ กำลังสร้างวิดีโอ... {veoProgress}%
        </button>
      )}

      {/* Result */}
      {veoStatus === "done" && videoUrl && (
        <div style={{ marginTop: 12 }}>
          <video src={videoUrl} controls playsInline style={{ width: "100%", maxWidth: 220, display: "block", margin: "0 auto 12px", borderRadius: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <a href={videoUrl} download={`veo-${Date.now()}.mp4`} style={{ flex: 1, display: "block", textAlign: "center", background: `linear-gradient(135deg,${GOOGLE_BLUE},${GOOGLE_GREEN})`, color: "#fff", borderRadius: 10, padding: "11px", textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
              💾 ดาวน์โหลด MP4
            </a>
            <button style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: GREEN, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer" }} onClick={() => { setVeoStatus("idle"); setVideoUrl(""); setVeoProgress(0); setVeoLog([]); }}>
              🔄 สร้างใหม่
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: GREEN, background: "rgba(39,174,96,0.08)", border: "1px solid rgba(39,174,96,0.2)", borderRadius: 8, padding: "7px 10px" }}>
            ✅ เพิ่มในคิวโพสต์อัตโนมัติแล้ว — ไปดูที่แท็บ คิวงาน
          </div>
        </div>
      )}

      {/* Note */}
      <div style={{ marginTop: 10, fontSize: 10, color: TEXT_MUTED, lineHeight: 1.6, padding: "8px 10px", background: "rgba(66,133,244,0.04)", borderRadius: 8, border: "1px solid rgba(66,133,244,0.1)" }}>
        💡 Veo 2 ต้องการ Gemini API Key ที่มีสิทธิ์ใช้งาน video generation (Preview) • ดู quota ที่ Google AI Studio • วิดีโอ 8 วินาที 9:16
      </div>
    </div>
  );
}

// ─── AI VIDEO GENERATOR (เพิ่ม Google Veo tab) ────────────────────────────────
function AIVideoGenerator({ M, expired, product, price, disc, captionForVideo, platform, onVideoReady }) {
  const [mode, setMode] = useState("ai"); // ai | veo | classic | upload
  const [images, setImages] = useState([]);
  const [secPerImg, setSecPerImg] = useState(2.5);
  const [overlayText, setOverlayText] = useState("");
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoFileName, setVideoFileName] = useState("clip-output.webm");
  const [shareMsg, setShareMsg] = useState("");
  const [aiStyle, setAiStyle] = useState("hype");
  const [segments, setSegments] = useState([]);
  const [scriptReady, setScriptReady] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [ttsPlaying, setTtsPlaying] = useState(false);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoFileInputRef = useRef(null);

  useEffect(() => {
    if (!overlayText && product) setOverlayText(`${product}${price ? ` | ${price} บาท` : ""}${disc ? ` ลด ${disc}%` : ""}`);
  }, [product, price, disc]);

  const AI_STYLES = [{ id: "hype", label: "🔥 ไฟแรง" }, { id: "calm", label: "😌 สงบนุ่ม" }, { id: "story", label: "📖 เล่าเรื่อง" }];

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 10);
    setImages(prev => [...prev, ...files.map(f => ({ url: URL.createObjectURL(f), name: f.name }))].slice(0, 10));
  };
  const removeImage = (idx) => setImages(prev => prev.filter((_, i) => i !== idx));

  const generateAIScript = async () => {
    if (!product) { alert("กรุณากรอกชื่อสินค้าก่อนครับ"); return; }
    setLoadingScript(true);
    const styleMap = { hype: "สไตล์ไฟแรง พลังงานสูง Hook แรง", calm: "สไตล์สงบนิ่ม น่าเชื่อถือ", story: "สไตล์เล่าเรื่อง ปัญหา → วิธีแก้ → ผลลัพธ์" };
    const imgCount = Math.max(images.length, 3);
    try {
      const result = await callClaude([{
        role: "user",
        content: `สร้างสคริปต์คลิปสั้น ${platform.toUpperCase()} ${styleMap[aiStyle]}\n\nสินค้า: ${product}\nราคา: ${price} บาท${disc ? `\nลด: ${disc}%` : ""}\nจำนวน scene: ${imgCount}\n\nตอบ JSON เท่านั้น:\n{"segments":[{"text":"ข้อความพูด scene (ภาษาไทย 1-2 ประโยค)","duration":3}],"fullScript":"สคริปต์รวม"}\n\nต้องมีครบ ${imgCount} segments, duration 3-6 วินาที`
      }], "", 900);
      const clean = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setSegments(parsed.segments || []);
      setScriptReady(true);
    } catch (e) { alert("เกิดข้อผิดพลาด: " + e.message); }
    setLoadingScript(false);
  };

  const testTTS = (text) => { setTtsPlaying(true); speakText(text, () => setTtsPlaying(false)); };

  const renderVideo = async (useAIScript = false) => {
    if (images.length === 0) { alert("กรุณาเพิ่มรูปสินค้าอย่างน้อย 1 รูปครับ"); return; }
    setIsRendering(true); setProgress(0); setVideoUrl(""); setShareMsg("");
    const W = 720, H = 1280;
    const canvas = canvasRef.current;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const loaded = await Promise.all(images.map(img => new Promise(res => {
      const el = new Image(); el.onload = () => res(el); el.onerror = () => res(null); el.src = img.url;
    })));
    const segs = (useAIScript && segments.length > 0) ? segments : loaded.map(() => ({ text: overlayText, duration: secPerImg }));
    const totalDuration = segs.reduce((sum, s) => sum + (s.duration || secPerImg), 0) * 1000;
    const stream = canvas.captureStream(30); const chunks = [];
    let mime = "video/webm;codecs=vp9"; if (!MediaRecorder.isTypeSupported(mime)) mime = "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    const stopped = new Promise(res => { recorder.onstop = res; });
    recorder.start();
    let lastSegIdx = -1;
    await new Promise(resolveAll => {
      const startTime = performance.now();
      function frame() {
        const elapsed = performance.now() - startTime;
        let acc = 0, segIdx = 0;
        for (let i = 0; i < segs.length; i++) {
          const segMs = (segs[i].duration || secPerImg) * 1000;
          if (elapsed < acc + segMs) { segIdx = i; break; }
          acc += segMs; segIdx = Math.min(i, segs.length - 1);
        }
        if (useAIScript && ttsEnabled && segIdx !== lastSegIdx) { lastSegIdx = segIdx; speakText(segs[segIdx]?.text || "", null); }
        const imgIdx = Math.min(segIdx, loaded.length - 1);
        const img = loaded[imgIdx];
        const segMs = (segs[segIdx]?.duration || secPerImg) * 1000;
        const localT = acc > 0 ? Math.max(0, (elapsed - acc) / segMs) : (elapsed % segMs) / segMs;
        const scale = 1 + 0.12 * localT;
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);
        if (img) { const iw = img.width, ih = img.height; const targetRatio = W / H, imgRatio = iw / ih; let dw, dh; if (imgRatio > targetRatio) { dh = H * scale; dw = dh * imgRatio; } else { dw = W * scale; dh = dw / imgRatio; } ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh); }
        const grad = ctx.createLinearGradient(0, H * 0.6, 0, H); grad.addColorStop(0, "rgba(0,0,0,0)"); grad.addColorStop(1, "rgba(0,0,0,0.8)"); ctx.fillStyle = grad; ctx.fillRect(0, H * 0.6, W, H * 0.4);
        const displayText = useAIScript ? (segs[segIdx]?.text || "") : overlayText;
        if (displayText) { ctx.fillStyle = "#fff"; ctx.font = "bold 42px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 8; wrapText(ctx, displayText, W / 2, H - 200, W - 80, 52); ctx.shadowBlur = 0; }
        if (price) { ctx.fillStyle = platform === "shopee" ? SHOPEE_RED : "#FF0050"; ctx.fillRect(W / 2 - 140, H - 110, 280, 64); ctx.fillStyle = "#fff"; ctx.font = "bold 36px 'Segoe UI', sans-serif"; ctx.textAlign = "center"; ctx.fillText(`${price} บาท${disc ? ` (-${disc}%)` : ""}`, W / 2, H - 66); }
        const pct = elapsed / totalDuration; ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.fillRect(0, 0, W, 5); ctx.fillStyle = platform === "shopee" ? SHOPEE_RED : TIKTOK_CYAN; ctx.fillRect(0, 0, W * pct, 5);
        setProgress(Math.min(100, Math.round(pct * 100)));
        if (elapsed < totalDuration) requestAnimationFrame(frame); else resolveAll();
      }
      requestAnimationFrame(frame);
    });
    recorder.stop(); await stopped;
    window.speechSynthesis?.cancel();
    const blob = new Blob(chunks, { type: mime }); const fname = `clip-${Date.now()}.webm`;
    setVideoBlob(blob); setVideoFileName(fname); setVideoUrl(URL.createObjectURL(blob)); setIsRendering(false);
    await onVideoReady(blob, fname);
    setShareMsg("เพิ่มคลิปลงคิวงานอัตโนมัติแล้ว! กดแท็บ คิวงาน & บอท เพื่อดู");
  };

  const handleVideoFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setVideoBlob(file); setVideoFileName(file.name); setVideoUrl(URL.createObjectURL(file));
    await onVideoReady(file, file.name);
    setShareMsg("เพิ่มคลิปลงคิวงานอัตโนมัติแล้ว!");
  };

  const shareVideo = async () => {
    if (!videoBlob) return;
    const captionText = captionForVideo || `${product} ราคา ${price} บาท`;
    try {
      const file = new File([videoBlob], videoFileName, { type: videoBlob.type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "ClipAI Post", text: captionText }); setShareMsg("เรียกหน้ารายการโพสต์สำเร็จ"); }
      else { setShareMsg("อุปกรณ์ไม่รองรับการแชร์ไฟล์"); }
    } catch { setShareMsg("เกิดข้อผิดพลาดในการส่งไฟล์"); }
  };

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" "); let line = ""; const lines = [];
    for (const w of words) { const test = line + w + " "; if (ctx.measureText(test).width > maxWidth && line) { lines.push(line); line = w + " "; } else line = test; }
    lines.push(line);
    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((l, i) => ctx.fillText(l.trim(), x, startY + i * lineHeight));
  }

  const MODES = [
    { id: "ai", label: "🤖 AI Script" },
    { id: "veo", label: "✨ Google Veo" },
    { id: "classic", label: "🖼️ Classic" },
    { id: "upload", label: "📁 อัปโหลด" },
  ];

  return (
    <div>
      {/* Mode selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
        {MODES.map(m => (
          <button key={m.id} style={{ padding: "9px 4px", borderRadius: 10, border: mode === m.id ? (m.id === "veo" ? `2px solid ${GOOGLE_BLUE}` : `2px solid ${SHOPEE_ORANGE}`) : "1px solid rgba(255,255,255,0.1)", background: mode === m.id ? (m.id === "veo" ? "rgba(66,133,244,0.12)" : "rgba(238,77,45,0.12)") : "rgba(255,255,255,0.03)", color: mode === m.id ? TEXT_MAIN : TEXT_MUTED, fontSize: 11, fontWeight: mode === m.id ? 700 : 400, cursor: "pointer" }} onClick={() => setMode(m.id)}>{m.label}</button>
        ))}
      </div>

      {/* Google Veo Mode */}
      {mode === "veo" && (
        <GoogleVeoGenerator M={M} product={product} price={price} disc={disc} platform={platform} onVideoReady={onVideoReady} />
      )}

      {/* AI Script Mode */}
      {mode === "ai" && (
        <div style={M.card}>
          <div style={M.cardT}>🤖 AI Video + เสียงพากย์ภาษาไทย</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {AI_STYLES.map(st => (<button key={st.id} style={{ flex: 1, padding: "9px 6px", borderRadius: 8, border: aiStyle === st.id ? `2px solid ${SHOPEE_ORANGE}` : "1px solid rgba(255,255,255,0.1)", background: aiStyle === st.id ? "rgba(245,166,35,0.1)" : "rgba(255,255,255,0.03)", color: aiStyle === st.id ? TEXT_MAIN : TEXT_MUTED, fontSize: 12, fontWeight: aiStyle === st.id ? 700 : 400, cursor: "pointer" }} onClick={() => setAiStyle(st.id)}>{st.label}</button>))}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
          <button style={M.btnS} onClick={() => fileInputRef.current?.click()} disabled={expired}>📷 เพิ่มรูปสินค้า ({images.length}/10)</button>
          {images.length > 0 && (<div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8, marginBottom: 8 }}>{images.map((img, i) => (<div key={i} style={{ position: "relative", width: 54, height: 76, borderRadius: 6, overflow: "hidden" }}><img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /><button style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.7)", color: "#fff", border: "none", padding: "1px 4px", fontSize: 10, cursor: "pointer" }} onClick={() => removeImage(i)}>✕</button></div>))}</div>)}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", marginBottom: 12 }}>
            <div onClick={() => setTtsEnabled(p => !p)} style={{ width: 40, height: 22, borderRadius: 11, background: ttsEnabled ? GREEN : "rgba(255,255,255,0.15)", cursor: "pointer", position: "relative", flexShrink: 0, transition: "background 0.2s" }}><div style={{ position: "absolute", top: 3, left: ttsEnabled ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} /></div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: TEXT_MAIN, fontWeight: 600 }}>🎙️ เสียงพากย์ TTS ภาษาไทย</div><div style={{ fontSize: 10, color: TEXT_MUTED }}>Web Speech API</div></div>
          </div>
          {!scriptReady ? (
            <button style={{ ...M.btnP, opacity: (loadingScript || expired) ? 0.6 : 1 }} onClick={generateAIScript} disabled={loadingScript || expired}>{loadingScript ? "⏳ Claude กำลังเขียนสคริปต์..." : "🤖 เจนสคริปต์ AI → เรนเดอร์วิดีโอ"}</button>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: TEXT_MUTED, marginBottom: 6 }}>📋 สคริปต์ AI ({segments.length} ซีน)</div>
                {segments.map((seg, i) => (<div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", padding: "7px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.07)", marginBottom: 5 }}><div style={{ width: 22, height: 22, borderRadius: "50%", background: SHOPEE_RED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{i + 1}</div><textarea value={seg.text} onChange={e => setSegments(prev => prev.map((s, j) => j === i ? { ...s, text: e.target.value } : s))} rows={2} style={{ flex: 1, background: "transparent", border: "none", color: TEXT_MAIN, fontSize: 12, resize: "none", outline: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} /><button onClick={() => testTTS(seg.text)} disabled={ttsPlaying} style={{ padding: "3px 7px", borderRadius: 5, border: "none", background: "rgba(255,255,255,0.08)", color: TEXT_MUTED, fontSize: 10, cursor: "pointer", flexShrink: 0 }}>🔊</button></div>))}
                <button style={{ ...M.btnP, marginTop: 4, opacity: (isRendering || images.length === 0) ? 0.6 : 1 }} onClick={() => renderVideo(true)} disabled={isRendering || images.length === 0}>{isRendering ? `🎬 เรนเดอร์ ${progress}%` : "🎬 เรนเดอร์วิดีโอ AI"}</button>
                <button style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: TEXT_MUTED, fontSize: 12, cursor: "pointer", marginTop: 6 }} onClick={() => { setScriptReady(false); setSegments([]); }}>↩ เจนสคริปต์ใหม่</button>
              </div>
            </>
          )}
          {isRendering && (<div style={{ marginTop: 8 }}><div style={{ height: 5, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", background: `linear-gradient(90deg,${SHOPEE_RED},${SHOPEE_ORANGE})`, borderRadius: 3, width: `${progress}%`, transition: "width 0.3s" }} /></div><div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4, textAlign: "center" }}>เรนเดอร์... {progress}%</div></div>)}
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      {/* Classic Mode */}
      {mode === "classic" && (
        <div style={M.card}>
          <div style={M.cardT}>🖼️ ทำคลิปจากรูป (Classic)</div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleFiles} />
          <button style={M.btnS} onClick={() => fileInputRef.current?.click()} disabled={expired}>📷 อัปโหลดรูปสินค้า (สูงสุด 10 รูป)</button>
          {images.length > 0 && (<div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>{images.map((img, i) => (<div key={i} style={{ position: "relative", width: "60px", height: "85px", borderRadius: "6px", overflow: "hidden" }}><img src={img.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /><button style={{ position: "absolute", top: 0, right: 0, background: "#000", color: "#fff", border: "none" }} onClick={() => removeImage(i)}>✕</button></div>))}</div>)}
          <div style={{ marginTop: "14px" }}>
            <label style={M.label}>วินาที / รูป</label>
            <input style={M.input} type="number" value={secPerImg} onChange={e => setSecPerImg(Number(e.target.value))} />
            <label style={M.label}>ตัวอักษรพาดหัว</label>
            <input style={M.input} value={overlayText} onChange={e => setOverlayText(e.target.value)} />
          </div>
          <button style={{ ...M.btnP, opacity: (isRendering || expired) ? 0.7 : 1 }} onClick={() => renderVideo(false)} disabled={isRendering || images.length === 0}>{isRendering ? `เรนเดอร์... ${progress}%` : "🎬 เริ่มเรนเดอร์คลิป"}</button>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}

      {/* Upload mode */}
      {mode === "upload" && (
        <div style={M.card}>
          <div style={M.cardT}>📁 โหลดไฟล์คลิปเข้าสู่ระบบ</div>
          <input ref={videoFileInputRef} type="file" accept="video/*" style={{ display: "none" }} onChange={handleVideoFile} />
          <button style={M.btnS} onClick={() => videoFileInputRef.current?.click()}>📁 เลือกไฟล์วิดีโอ</button>
        </div>
      )}

      {/* Preview (for non-veo modes) */}
      {videoUrl && mode !== "veo" && (
        <div style={M.card}>
          <div style={M.cardT}>🎥 ตัวอย่างวิดีโอ</div>
          <video src={videoUrl} controls playsInline style={{ width: "100%", maxWidth: "220px", display: "block", margin: "0 auto", borderRadius: "10px" }} />
          <button style={{ ...M.btnP, marginTop: "14px" }} onClick={shareVideo}>📲 แชร์ไปยังแอปมือถือ</button>
          <a href={videoUrl} download={videoFileName} style={{ display: "block", textAlign: "center", marginTop: "8px", background: "rgba(255,255,255,0.08)", color: TEXT_MAIN, borderRadius: "10px", padding: "11px", textDecoration: "none", fontSize: "14px", fontWeight: "bold" }}>💾 บันทึกลงเครื่อง</a>
          {shareMsg && <div style={{ marginTop: "10px", fontSize: "12px", background: "rgba(39,174,96,0.1)", border: "1px solid rgba(39,174,96,0.3)", padding: "8px", borderRadius: "6px", color: GREEN }}>{shareMsg}</div>}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
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
  const [shopeeItems, setShopeeItems] = useState([{ id: "init-1", videoFile: null, videoName: "", caption: "", link: "", status: "ready", queue: false, errorImg: "" }]);
  const [tiktokItems, setTiktokItems] = useState([{ id: "init-2", videoFile: null, videoName: "", caption: "", link: "", status: "ready", queue: false, errorImg: "" }]);
  // AI Provider state — shared across tabs
  const [aiProvider, setAiProvider] = useState(() => localStorage.getItem("ai_provider") || "claude");
  const expired = isExpired(keyInfo || {});
  const dl = daysLeft(keyInfo?.expiresAt);

  const switchProvider = (p) => { setAiProvider(p); localStorage.setItem("ai_provider", p); };

  const handleToggleBot = () => {
    if (isBotRunning) { setBotStatus("Stopping"); setTimeout(() => { setIsBotRunning(false); setBotStatus("Idle"); }, 1500); }
    else { setIsBotRunning(true); setBotStatus("Running"); }
  };

  const handleProductFound = (data) => {
    setProduct(data.name || ""); setPrice(data.price || ""); setDisc(data.discount || ""); setLink(data.link || ""); setPage("content");
  };

  const genTemplate = () => {
    const t = TEMPLATES.find(x => x.id === tmpl);
    if (!t || !product || !price) return;
    const h = hook || HOOKS[Math.floor(Math.random() * HOOKS.length)];
    setCaptionTmpl(`${h}\n\n${t.fn(product, price, disc, platform)}`);
  };

  const callAI = async (prompt, setFn, setLoad) => {
    setLoad(true);
    try {
      const result = await callAIProvider(prompt, aiProvider);
      setFn(result);
    } catch (e) { setFn(`เกิดข้อผิดพลาด: ${e.message}`); }
    setLoad(false);
  };

  const genAI = () => callAI(
    `คุณเป็น Social Media Copywriter เชี่ยวชาญขายของออนไลน์ บนแพลตฟอร์ม ${platform.toUpperCase()}\nสร้างแคปชั่นปักตะกร้าสำหรับ:\n- สินค้า: ${product}\n- ราคา: ${price} บาท\n${disc ? `- ลด: ${disc}%\n` : ""}${link ? `- ลิงก์: ${link}\n` : ""}\nให้มี: Hook ดึงดูด, ภาษาไทยสนุก, Emoji, วิธีสั่งซื้อ, แฮชแท็ก 5-8 อัน\nตอบด้วยแคปชั่นเท่านั้น`,
    setCaptionAi, setAiLoading
  );

  const genScript = () => callAI(
    `สร้างสคริปต์คลิปสั้น ${platform.toUpperCase()} ปักตะกร้า:\n- สินค้า: ${product}\n- ราคา: ${price} บาท\n${disc ? `- ลด: ${disc}%\n` : ""}\n[0-3 วิ] HOOK:\n[3-10 วิ] รีวิว:\n[10-20 วิ] จุดว้าว:\n[20-30 วิ] ปิดการขาย:\nใช้ภาษาไทยสไตล์อินฟลูเอนเซอร์`,
    setScript, setScriptLoading
  );

  const copyAndSendToQueue = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id); setTimeout(() => setCopied(""), 2000);
    const setItems = platform === "shopee" ? setShopeeItems : setTiktokItems;
    setItems(prev => {
      // 1) หาคิวที่มีวิดีโอแต่ยังไม่มีแคปชั่น → ใส่แคปชั่นเข้าไปก่อน
      const hasVideoNoCaption = prev.find(i => i.videoName && !i.caption);
      if (hasVideoNoCaption) return prev.map(i => i.id === hasVideoNoCaption.id ? { ...i, caption: text, link: link || i.link || "" } : i);
      // 2) หาคิวที่ว่างทั้งหมด
      const hasEmpty = prev.find(i => !i.caption && !i.videoName);
      if (hasEmpty) return prev.map(i => i.id === hasEmpty.id ? { ...i, caption: text, link: link || "" } : i);
      // 3) สร้างรายการใหม่
      if (prev.length < 10) return [...prev, { id: `q-${Date.now()}`, videoFile: null, videoName: "", caption: text, link: link || "", status: "ready", queue: false, errorImg: "" }];
      return prev;
    });
  };

  const sendVideoToQueue = async (blob, fileName) => {
    const setItems = platform === "shopee" ? setShopeeItems : setTiktokItems;
    const currentCaption = (platform === "shopee" ? shopeeItems : tiktokItems).find(i => i.caption && !i.videoName)?.caption || "";
    const currentLink = link || "";
    let newId = `q-${Date.now()}`;
    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from("tasks").insert({ user_key: licKey, platform, video_name: fileName, caption: currentCaption, link: currentLink, status: "ready", queue: false }).select().single();
        if (data) newId = data.id;
      } catch {}
    }
    setItems(prev => {
      // 1) หาคิวที่มีแคปชั่นแต่ไม่มีวิดีโอ → merge วิดีโอเข้าไป
      const hasCaptionNoVideo = prev.find(i => i.caption && !i.videoName);
      if (hasCaptionNoVideo) return prev.map(i => i.id === hasCaptionNoVideo.id ? { ...i, videoFile: blob, videoName: fileName, id: newId } : i);
      // 2) หาคิวว่าง
      const hasEmptyVideo = prev.find(i => !i.videoName);
      if (hasEmptyVideo) return prev.map(i => i.id === hasEmptyVideo.id ? { ...i, videoFile: blob, videoName: fileName, id: newId } : i);
      // 3) สร้างรายการใหม่
      if (prev.length < 10) return [...prev, { id: newId, videoFile: blob, videoName: fileName, caption: currentCaption, link: currentLink, status: "ready", queue: false, errorImg: "" }];
      return prev;
    });
    setPage("queue");
  };

  const M = MS;
  const headerBg = platform === "shopee" ? `linear-gradient(135deg, ${SHOPEE_RED}, #8B0000)` : `linear-gradient(135deg, ${TIKTOK_BLACK}, #333)`;

  const renderContent = () => {
    switch (page) {
      case "scan": return <ProductScanner onProductFound={handleProductFound} platform={platform} aiProvider={aiProvider} />;
      case "content": return (
        <>
          <div style={M.card}>
            <div style={M.cardT}>📦 ข้อมูลสินค้าที่ต้องการขาย</div>
            <label style={M.label}>ชื่อสินค้า *</label>
            <input style={M.input} placeholder="เช่น กระเป๋าผ้า Canvas ลายการ์ตูน" value={product} onChange={e => setProduct(e.target.value)} />
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ flex: 1 }}><label style={M.label}>ราคา (บาท) *</label><input style={M.input} type="number" placeholder="299" value={price} onChange={e => setPrice(e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={M.label}>ลด (%)</label><input style={M.input} type="number" placeholder="20" value={disc} onChange={e => setDisc(e.target.value)} /></div>
            </div>
            <label style={M.label}>ลิงก์สินค้า</label>
            <input style={{ ...M.input, marginBottom: 0 }} placeholder="วางลิงก์ปักหมุดที่นี่..." value={link} onChange={e => setLink(e.target.value)} />
          </div>
          <div style={M.card}>
            <div style={M.cardT}>✍️ สร้างแคปชั่นขายของ</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              <button style={M.tab(activeTab === "template")} onClick={() => setActiveTab("template")}>📋 เทมเพลต</button>
              <button style={M.tab(activeTab === "ai")} onClick={() => setActiveTab("ai")}>
                <span style={{ marginRight: 4 }}>{aiProvider === "gemini" ? "✨" : "🤖"}</span>
                {aiProvider === "gemini" ? "Gemini AI" : "Claude AI"}
              </button>
            </div>
            {activeTab === "template" && (<>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>{TEMPLATES.map(t => (<button key={t.id} style={M.tmplBtn(tmpl === t.id)} onClick={() => setTmpl(t.id)}>{t.name}</button>))}</div>
              <label style={M.label}>Hook ขึ้นต้น</label>
              <div style={{ marginBottom: "8px" }}>{HOOKS.slice(0, 4).map(h => (<span key={h} style={M.chip} onClick={() => setHook(h)}>{h}</span>))}</div>
              <input style={M.input} placeholder="หรือพิมพ์ hook เอง..." value={hook} onChange={e => setHook(e.target.value)} />
              <button style={M.btnP} onClick={genTemplate} disabled={expired}>✨ เจนแคปชั่น</button>
              {captionTmpl && <ResultBox text={captionTmpl} id="tmpl" copied={copied} onCopy={copyAndSendToQueue} queueLabel={platform === "shopee" ? "🧡 Shopee" : "🖤 TikTok"} />}
            </>)}
            {activeTab === "ai" && (<>
              <button style={{ ...M.btnP, opacity: aiLoading ? 0.7 : 1, background: aiProvider === "gemini" ? `linear-gradient(135deg,${GEMINI_PURPLE},${GEMINI_PINK})` : `linear-gradient(135deg,${SHOPEE_RED},#C0392B)` }} onClick={genAI} disabled={aiLoading || expired}>
                {aiLoading ? "AI กำลังเขียนให้..." : `${aiProvider === "gemini" ? "✨ Gemini" : "🤖 Claude"} เจนแคปชั่นพิเศษ`}
              </button>
              {captionAi && <ResultBox text={captionAi} id="ai" copied={copied} onCopy={copyAndSendToQueue} queueLabel={platform === "shopee" ? "🧡 Shopee" : "🖤 TikTok"} />}
            </>)}
          </div>
          {(captionTmpl || captionAi) && (
            <div style={M.card}>
              <div style={M.cardT}>🤖 ส่งข้อมูลเข้าคิวงานบอท</div>
              <button onClick={async () => {
                if (!product || !price) { alert("กรุณากรอกชื่อสินค้าและราคาก่อน"); return; }
                try {
                  const finalCaption = activeTab === "template" ? captionTmpl : captionAi;
                  const { error } = await supabase.from("tasks").insert([{ platform, user_key: licKey, video_path: link || "", link: link || "", caption: finalCaption, product_name: product, status: "pending" }]);
                  if (error) throw error;
                  alert("ส่งข้อมูลสินค้าและแคปชั่นเข้าคิวสำเร็จ!");
                } catch (err) { alert("ส่งเข้าคิวล้มเหลว: " + err.message); }
              }} style={{ width: "100%", background: `linear-gradient(135deg,${SHOPEE_ORANGE},#D35400)`, color: "#fff", border: "none", borderRadius: "10px", padding: "14px", fontSize: "15px", fontWeight: "800", cursor: "pointer" }}>
                🚀 ส่งงานเข้าคิวบอทมือถือ ({platform === "shopee" ? "Shopee" : "TikTok"})
              </button>
              <div style={{ fontSize: "11px", color: TEXT_MUTED, marginTop: "8px", textAlign: "center" }}>บันทึกแคปชั่น + ข้อมูลสินค้าลง Supabase รอบอทดึงไปโพสต์</div>
            </div>
          )}
          <div style={M.card}>
            <div style={M.cardT}>🎬 สคริปต์พูดในคลิปสั้น</div>
            <button style={{ ...M.btnS, opacity: scriptLoading ? 0.7 : 1, background: aiProvider === "gemini" ? `linear-gradient(135deg,${GEMINI_PURPLE},${GEMINI_PINK})` : `linear-gradient(135deg,${SHOPEE_ORANGE},#E67E22)` }} onClick={genScript} disabled={scriptLoading || expired}>
              {scriptLoading ? "AI กำลังเรียบเรียงสคริปต์..." : `${aiProvider === "gemini" ? "✨ Gemini" : "🎬 Claude"} สร้างสคริปต์ 15-30 วิ`}
            </button>
            {script && (<div style={{ marginTop: "12px" }}><div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "6px" }}><button style={{ background: "rgba(255,255,255,0.08)", border: "none", color: TEXT_MUTED, borderRadius: "8px", padding: "6px 14px", fontSize: "12px", cursor: "pointer" }} onClick={() => { navigator.clipboard.writeText(script); setCopied("scr"); setTimeout(() => setCopied(""), 2000); }}>{copied === "scr" ? "คัดลอกแล้ว" : "📋 คัดลอก"}</button></div><div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "14px", fontSize: "12px", lineHeight: "1.8", whiteSpace: "pre-wrap", color: TEXT_MAIN, border: "1px solid rgba(255,255,255,0.07)", maxHeight: "280px", overflowY: "auto" }}>{script}</div></div>)}
          </div>
        </>
      );
      case "video": return <AIVideoGenerator M={M} expired={expired} product={product} price={price} disc={disc} captionForVideo={captionTmpl || captionAi} platform={platform} onVideoReady={sendVideoToQueue} />;
      case "queue": return <VideoQueueManager M={M} platform={platform} licKey={licKey} shopeeItems={shopeeItems} setShopeeItems={setShopeeItems} tiktokItems={tiktokItems} setTiktokItems={setTiktokItems} />;
      case "settings": return <SettingsComponent M={M} isBotRunning={isBotRunning} botStatus={botStatus} aiProvider={aiProvider} onProviderChange={switchProvider} />;
      default: return null;
    }
  };

  return (
    <div style={M.app}>
      <div style={{ ...M.hdr, background: headerBg }}>
        <div style={M.glow} />
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={M.logo}>🚀 ClipAI<span style={{ color: platform === "shopee" ? SHOPEE_ORANGE : TIKTOK_CYAN }}>{platform === "shopee" ? "Shopee" : "TikTok"}</span>
              <span style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>v3.0</span>
            </div>
            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)" }}>สแกนสินค้า • Gemini • Google Veo • AI Video</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ textAlign: "right" }}><div style={{ fontSize: "10px", color: TEXT_MUTED }}>Bot Status</div><div style={{ fontSize: "13px", fontWeight: "bold", color: botStatus === "Running" ? GREEN : botStatus === "Stopping" ? SHOPEE_ORANGE : "#FF6B6B" }}>{botStatus}</div></div>
            <button onClick={handleToggleBot} disabled={botStatus === "Stopping"} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: "bold", cursor: "pointer", background: isBotRunning ? "#E74C3C" : GREEN, color: "#fff", opacity: botStatus === "Stopping" ? 0.6 : 1 }}>
              {botStatus === "Stopping" ? <><RefreshCw style={{ width: "14px", height: "14px" }} />หยุด...</> : isBotRunning ? <><Square style={{ width: "14px", height: "14px" }} />ปิดบอท</> : <><Play style={{ width: "14px", height: "14px" }} />เปิดบอท</>}
            </button>
          </div>
        </div>

        {/* AI Provider selector — แสดงใน header */}
        <div style={{ position: "relative", zIndex: 1, marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span style={M.badge()}>{licKey}</span>
            <span style={M.badge(expired ? "#e74c3c" : GREEN)}>{expired ? "หมดอายุ" : keyInfo?.type === "lifetime" ? "ตลอดชีพ" : `เหลือ ${dl} วัน`}</span>
            <span style={{ ...M.badge(), cursor: "pointer" }} onClick={onLogout}>ออก</span>
          </div>
          <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", padding: "3px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", gap: 3 }}>
            <button onClick={() => setPlatform("shopee")} style={{ padding: "5px 12px", borderRadius: "7px", border: "none", fontSize: "11px", fontWeight: "bold", cursor: "pointer", background: platform === "shopee" ? SHOPEE_RED : "transparent", color: "#fff" }}>🧡 Shopee</button>
            <button onClick={() => setPlatform("tiktok")} style={{ padding: "5px 12px", borderRadius: "7px", border: "none", fontSize: "11px", fontWeight: "bold", cursor: "pointer", background: platform === "tiktok" ? "#fff" : "transparent", color: platform === "tiktok" ? "#000" : "#fff" }}>🖤 TikTok</button>
          </div>
        </div>

        {/* AI Provider pill */}
        <div style={{ position: "relative", zIndex: 1, marginTop: 8, display: "flex", gap: 4 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", marginRight: 4 }}>AI Engine:</div>
          {[["claude", "🤖 Claude", SHOPEE_RED], ["gemini", "✨ Gemini", GEMINI_PURPLE]].map(([id, label, color]) => (
            <button key={id} style={{ padding: "3px 10px", borderRadius: 20, border: aiProvider === id ? `1.5px solid ${color}` : "1.5px solid rgba(255,255,255,0.15)", background: aiProvider === id ? `${color}33` : "rgba(255,255,255,0.05)", color: aiProvider === id ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: aiProvider === id ? 700 : 400, cursor: "pointer" }} onClick={() => switchProvider(id)}>{label}</button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{ display: "flex", gap: "4px", padding: "12px 14px 0", maxWidth: "600px", margin: "0 auto", flexWrap: "wrap" }}>
        <button style={M.tab(page === "scan")} onClick={() => setPage("scan")}><Search size={13} style={{ marginRight: 3 }} />สแกน</button>
        <button style={M.tab(page === "content")} onClick={() => setPage("content")}><FileText size={13} style={{ marginRight: 3 }} />โพสต์</button>
        <button style={M.tab(page === "video")} onClick={() => setPage("video")}>🎬 วิดีโอ</button>
        <button style={M.tab(page === "queue")} onClick={() => setPage("queue")}><ListOrdered size={13} style={{ marginRight: 3 }} />คิว</button>
        <button style={M.tab(page === "settings")} onClick={() => setPage("settings")}><Settings size={13} style={{ marginRight: 3 }} />ตั้งค่า</button>
      </div>

      <div style={M.body}>{renderContent()}</div>
    </div>
  );
}

// ─── SETTINGS (เพิ่ม Gemini API Key + AI Provider selector) ──────────────────
function SettingsComponent({ M, isBotRunning, botStatus, aiProvider, onProviderChange }) {
  const [apiKeyInput, setApiKeyInput] = useState(() => localStorage.getItem("anthropic_api_key") || "");
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [tiktokSession, setTiktokSession] = useState(() => localStorage.getItem("tiktok_session") || "");
  const [shopeeSession, setShopeeSession] = useState(() => localStorage.getItem("shopee_session") || "");
  const [delayInput, setDelayInput] = useState(() => localStorage.getItem("post_delay") || "60");
  const [autoRetry, setAutoRetry] = useState(true);
  const [agentEnabled, setAgentEnabled] = useState(false);
  const [agentLogs, setAgentLogs] = useState(["[ระบบ] Agent พร้อมทำงาน รอการเชื่อมต่อ..."]);
  const [testingGemini, setTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState("");
  const logRef = useRef(null);

  useEffect(() => {
    if (!agentEnabled) return;
    const msgs = ["กำลังเชื่อมต่อกับ Shopee API...", "ตรวจสอบ Session Token...", "เชื่อมต่อสำเร็จ พร้อมรับคำสั่ง", "ตรวจสอบคิวงาน...", "Heartbeat OK"];
    let i = 0;
    const interval = setInterval(() => {
      const msg = msgs[i % msgs.length];
      const time = new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setAgentLogs(prev => [...prev.slice(-19), `[${time}] ${msg}`]);
      i++;
    }, 2500);
    return () => clearInterval(interval);
  }, [agentEnabled]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [agentLogs]);

  const saveSettings = () => {
    localStorage.setItem("anthropic_api_key", apiKeyInput.trim());
    localStorage.setItem("gemini_api_key", geminiKeyInput.trim());
    localStorage.setItem("tiktok_session", tiktokSession.trim());
    localStorage.setItem("shopee_session", shopeeSession.trim());
    localStorage.setItem("post_delay", delayInput);
    alert("บันทึกการตั้งค่าเรียบร้อยแล้วครับ!");
  };

  const testGeminiKey = async () => {
    if (!geminiKeyInput.trim()) { setGeminiTestResult("❌ กรุณากรอก Gemini API Key ก่อน"); return; }
    setTestingGemini(true); setGeminiTestResult("⏳ กำลังทดสอบ...");
    try {
      localStorage.setItem("gemini_api_key", geminiKeyInput.trim());
      const result = await callGemini("ตอบว่า 'Gemini พร้อมใช้งาน ✅' เท่านั้น", "", "gemini-2.5-flash");
      setGeminiTestResult(`✅ เชื่อมต่อสำเร็จ! ${result}`);
    } catch (e) {
      setGeminiTestResult(`❌ เกิดข้อผิดพลาด: ${e.message}`);
    }
    setTestingGemini(false);
  };

  const API_PROVIDERS = [
    { id: "claude", label: "🤖 Claude (Anthropic)", color: SHOPEE_RED, desc: "เจนแคปชั่น, สคริปต์, สแกน URL/รูป" },
    { id: "gemini", label: "✨ Gemini (Google)", color: GEMINI_PURPLE, desc: "เจนแคปชั่น, สคริปต์ + Google Veo Video" },
  ];

  return (
    <div>
      {/* AI Provider Setting */}
      <div style={M.card}>
        <div style={M.cardT}>🤖 เลือก AI Engine หลัก</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
          {API_PROVIDERS.map(p => (
            <div key={p.id} style={{ padding: "12px", borderRadius: 12, border: aiProvider === p.id ? `2px solid ${p.color}` : "1px solid rgba(255,255,255,0.1)", background: aiProvider === p.id ? `${p.color}18` : "rgba(255,255,255,0.03)", cursor: "pointer" }} onClick={() => onProviderChange(p.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: aiProvider === p.id ? p.color : "rgba(255,255,255,0.2)" }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: aiProvider === p.id ? TEXT_MAIN : TEXT_MUTED }}>{p.label}</div>
              </div>
              <div style={{ fontSize: 10, color: TEXT_MUTED, lineHeight: 1.5 }}>{p.desc}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: TEXT_MUTED, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          💡 Claude ใช้ Anthropic API Key • Gemini + Google Veo ใช้ Gemini API Key เดียวกัน
        </div>
      </div>

      {/* API Keys */}
      <div style={M.card}>
        <div style={M.cardT}>⚙️ API Keys & การตั้งค่า AI</div>

        {/* Anthropic / Claude */}
        <div style={{ background: "rgba(238,77,45,0.06)", border: "1px solid rgba(238,77,45,0.2)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <label style={{ ...M.label, color: SHOPEE_RED, fontWeight: 700 }}>🤖 Anthropic API Key (Claude)</label>
          <input style={M.input} type="password" placeholder="sk-ant-..." value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} />
          <div style={{ fontSize: 10, color: TEXT_MUTED }}>ใช้สำหรับ: สแกน URL/รูป, เจนแคปชั่น (Claude), AI Video script, สคริปต์คลิป</div>
        </div>

        {/* Gemini / Google */}
        <div style={{ background: "rgba(124,58,237,0.06)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 10, padding: 12, marginBottom: 12 }}>
          <label style={{ ...M.label, color: GEMINI_PURPLE, fontWeight: 700 }}>✨ Google Gemini API Key</label>
          <input style={M.input} type="password" placeholder="AIza..." value={geminiKeyInput} onChange={e => setGeminiKeyInput(e.target.value)} />
          <div style={{ fontSize: 10, color: TEXT_MUTED, marginBottom: 8 }}>ใช้สำหรับ: Gemini Flash (เจนแคปชั่น/สคริปต์) + Google Veo 2 (สร้างวิดีโอ AI) • รับที่ aistudio.google.com</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${GEMINI_PURPLE}`, background: "transparent", color: GEMINI_PURPLE, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: testingGemini ? 0.6 : 1 }} onClick={testGeminiKey} disabled={testingGemini}>
              {testingGemini ? "⏳ ทดสอบ..." : "🧪 ทดสอบ Gemini Key"}
            </button>
          </div>
          {geminiTestResult && (
            <div style={{ marginTop: 8, fontSize: 11, padding: "7px 10px", borderRadius: 7, background: geminiTestResult.startsWith("✅") ? "rgba(39,174,96,0.1)" : "rgba(238,77,45,0.1)", border: `1px solid ${geminiTestResult.startsWith("✅") ? "rgba(39,174,96,0.3)" : "rgba(238,77,45,0.3)"}`, color: geminiTestResult.startsWith("✅") ? GREEN : "#FF6B6B" }}>
              {geminiTestResult}
            </div>
          )}
          <div style={{ marginTop: 10, padding: "8px 10px", background: "rgba(66,133,244,0.06)", borderRadius: 8, border: "1px solid rgba(66,133,244,0.15)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOOGLE_BLUE, marginBottom: 4 }}>🎬 Google Veo 2 (Video Generation)</div>
            <div style={{ fontSize: 10, color: TEXT_MUTED, lineHeight: 1.6 }}>
              • ใช้ Key เดียวกับ Gemini<br />
              • ต้องเปิดใช้ "Veo API" ที่ Google Cloud Console<br />
              • Quota: สร้างวิดีโอได้จำกัดต่อวัน (ดูที่ AI Studio)<br />
              • คลิปที่สร้างจะถูกเพิ่มลงคิวโพสต์อัตโนมัติ
            </div>
          </div>
        </div>

        {/* Session cookies */}
        <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: TEXT_MAIN, marginBottom: 4 }}>ตั้งค่าบอทอัปโหลด</div>
          <div style={{ background: "rgba(238,77,45,0.07)", border: "1px solid rgba(238,77,45,0.2)", borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <label style={{ ...M.label, color: SHOPEE_ORANGE, fontWeight: 700 }}>🧡 Shopee Session / Cookie</label>
            <input type="password" placeholder="วาง Shopee Session ID" value={shopeeSession} onChange={e => setShopeeSession(e.target.value)} style={M.input} />
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: 12, marginBottom: 8 }}>
            <label style={{ ...M.label, color: "#aaa", fontWeight: 700 }}>🖤 TikTok Session / Cookie</label>
            <input type="password" placeholder="วาง TikTok Session ID" value={tiktokSession} onChange={e => setTiktokSession(e.target.value)} style={M.input} />
          </div>
          <label style={M.label}>หน่วงเวลาระหว่างคลิป (วินาที)</label>
          <input type="number" min="30" value={delayInput} onChange={e => setDelayInput(e.target.value)} style={M.input} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0" }}>
            <input type="checkbox" id="autoRetry" checked={autoRetry} onChange={e => setAutoRetry(e.target.checked)} style={{ width: 16, height: 16 }} />
            <label htmlFor="autoRetry" style={{ fontSize: 12, color: TEXT_MAIN, cursor: "pointer" }}>Auto-Retry เมื่อบอทอัปโหลดล้มเหลว</label>
          </div>
        </div>
        <button style={M.btnP} onClick={saveSettings}>💾 บันทึกการตั้งค่าทั้งหมด</button>
      </div>

      {/* Agent log */}
      <div style={{ ...M.card, marginTop: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={M.cardT}>🤖 สถานะ Agent</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: agentEnabled ? GREEN : TEXT_MUTED }}>{agentEnabled ? "กำลังทำงาน" : "หยุด"}</span>
            <div onClick={() => setAgentEnabled(p => !p)} style={{ width: 44, height: 24, borderRadius: 12, background: agentEnabled ? GREEN : "rgba(255,255,255,0.15)", cursor: "pointer", position: "relative" }}>
              <div style={{ position: "absolute", top: 3, left: agentEnabled ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>
        </div>
        <div ref={logRef} style={{ background: "#000", borderRadius: 8, padding: "10px 12px", height: 140, overflowY: "auto", fontFamily: "monospace", fontSize: 11, lineHeight: 1.6, border: "1px solid rgba(255,255,255,0.08)" }}>
          {agentLogs.map((log, i) => (<div key={i} style={{ color: log.includes("สำเร็จ") || log.includes("OK") ? GREEN : log.includes("ข้อผิดพลาด") ? "#e74c3c" : TEXT_MUTED }}>{log}</div>))}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: TEXT_MUTED, textAlign: "center" }}>DB: {isSupabaseConfigured ? "Supabase เชื่อมต่อแล้ว" : "RAM เท่านั้น"}</div>
      </div>
    </div>
  );
}

// ─── VIDEO QUEUE MANAGER ──────────────────────────────────────────────────────
function VideoQueueManager({ M, platform, licKey, shopeeItems, setShopeeItems, tiktokItems, setTiktokItems }) {
  const [queueTab, setQueueTab] = useState(platform || "shopee");
  const [dbLoading, setDbLoading] = useState(false);
  const videoRefs = useRef({});
  const items = queueTab === "shopee" ? shopeeItems : tiktokItems;
  const setItems = queueTab === "shopee" ? setShopeeItems : setTiktokItems;

  useEffect(() => { loadFromDB(queueTab); }, [queueTab]);

  const loadFromDB = async (plat) => {
    if (!isSupabaseConfigured) return;
    setDbLoading(true);
    try {
      const { data, error } = await supabase.from("tasks").select("*").eq("user_key", licKey).eq("platform", plat).order("created_at", { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped = data.map(row => ({ id: row.id, videoName: row.video_name || "", caption: row.caption || "", link: row.link || "", status: row.status || "ready", queue: row.queue || false, errorImg: row.error_img || "", videoFile: null }));
        if (plat === "shopee") setShopeeItems(mapped); else setTiktokItems(mapped);
      }
    } catch {}
    setDbLoading(false);
  };

  const addItem = async () => {
    if (items.length >= 10) return alert("เพิ่มได้สูงสุด 10 รายการ");
    let newId = `local-${Date.now()}`;
    if (isSupabaseConfigured) {
      try { const { data } = await supabase.from("tasks").insert({ user_key: licKey, platform: queueTab, video_name: "", caption: "", link: "", status: "ready", queue: false }).select().single(); if (data) newId = data.id; } catch {}
    }
    setItems(prev => [...prev, { id: newId, videoFile: null, videoName: "", caption: "", link: "", status: "ready", queue: false, errorImg: "" }]);
  };

  const removeItem = async (id) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
    if (isSupabaseConfigured) { try { await supabase.from("tasks").delete().eq("id", id); } catch {} }
  };

  const updateItem = (id, field, value) => { setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i)); };

  const saveItemToDB = async (id) => {
    if (!isSupabaseConfigured) return;
    const allItems = queueTab === "shopee" ? shopeeItems : tiktokItems;
    const item = allItems.find(i => i.id === id); if (!item) return;
    try { await supabase.from("tasks").update({ caption: item.caption, link: item.link || "", video_name: item.videoName, status: item.status, queue: item.queue, updated_at: new Date().toISOString() }).eq("id", id); } catch {}
  };

  const handleVideoSelect = (id, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    updateItem(id, "videoFile", file); updateItem(id, "videoName", file.name);
    setTimeout(() => saveItemToDB(id), 300);
  };

  const toggleQueue = async (id) => {
    let updated;
    setItems(prev => prev.map(i => { if (i.id !== id) return i; if (!i.videoName) { alert("กรุณาเลือกคลิปวิดีโอก่อน"); return i; } updated = { ...i, queue: !i.queue, status: !i.queue ? "queued" : "ready" }; return updated; }));
    if (isSupabaseConfigured && updated) { try { await supabase.from("tasks").update({ queue: updated.queue, status: updated.status, updated_at: new Date().toISOString() }).eq("id", id); } catch {} }
  };

  const queueAll = async () => {
    setItems(prev => prev.map(i => i.videoName ? { ...i, queue: true, status: "queued" } : i));
    if (isSupabaseConfigured) { try { for (const id of items.filter(i => i.videoName).map(i => i.id)) { await supabase.from("tasks").update({ queue: true, status: "queued", updated_at: new Date().toISOString() }).eq("id", id); } } catch {} }
  };

  const shareItem = async (item) => {
    if (!item.videoFile) return;
    try {
      const file = item.videoFile instanceof File ? item.videoFile : new File([item.videoFile], item.videoName, { type: "video/mp4" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "ClipAI Post", text: item.caption + (item.link ? `\n\n${item.link}` : "") });
        updateItem(item.id, "status", "done");
        if (isSupabaseConfigured) { try { await supabase.from("tasks").update({ status: "done", updated_at: new Date().toISOString() }).eq("id", item.id); } catch {} }
      } else { alert("ดาวน์โหลดแล้วโพสเองครับ"); }
    } catch {}
  };

  const platformColor = queueTab === "shopee" ? SHOPEE_RED : "#333";
  const platformLabel = queueTab === "shopee" ? "🧡 Shopee" : "🖤 TikTok";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", padding: 4, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => setQueueTab("shopee")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", fontSize: 13, fontWeight: "bold", cursor: "pointer", background: queueTab === "shopee" ? SHOPEE_RED : "transparent", color: "#fff" }}>🧡 Shopee ({shopeeItems.filter(i => i.queue).length}/{shopeeItems.length})</button>
        <button onClick={() => setQueueTab("tiktok")} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", fontSize: 13, fontWeight: "bold", cursor: "pointer", background: queueTab === "tiktok" ? "#222" : "transparent", color: "#fff" }}>🖤 TikTok ({tiktokItems.filter(i => i.queue).length}/{tiktokItems.length})</button>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, padding: "6px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: isSupabaseConfigured ? GREEN : SHOPEE_ORANGE }} />
        <span style={{ color: isSupabaseConfigured ? GREEN : SHOPEE_ORANGE }}>{isSupabaseConfigured ? "บันทึกลง Supabase อัตโนมัติ" : "ข้อมูลใน RAM"}</span>
        {dbLoading && <span style={{ color: TEXT_MUTED, marginLeft: "auto" }}>⏳ โหลด...</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[["📋 ทั้งหมด", items.length, TEXT_MUTED], ["⏳ ในคิว", items.filter(i => i.queue).length, SHOPEE_ORANGE], ["✅ พร้อม", items.filter(i => !i.queue && i.status === "ready").length, GREEN]].map(([label, val, color]) => (<div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 10, textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" }}><div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div><div style={{ fontSize: 10, color: TEXT_MUTED }}>{label}</div></div>))}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={addItem} disabled={items.length >= 10} style={{ flex: 1, padding: 9, borderRadius: 10, border: `2px dashed ${platformColor}`, background: "transparent", color: platformColor, fontSize: 13, fontWeight: "bold", cursor: "pointer", opacity: items.length >= 10 ? 0.4 : 1 }}>➕ เพิ่ม ({items.length}/10)</button>
        <button onClick={queueAll} style={{ flex: 1, padding: 9, borderRadius: 10, border: "none", background: platformColor, color: "#fff", fontSize: 13, fontWeight: "bold", cursor: "pointer" }}><Layers size={13} style={{ display: "inline", marginRight: 4 }} />ส่งทั้งหมดเข้าคิว</button>
      </div>
      {items.map((item, idx) => (
        <div key={item.id} style={{ background: BG_CARD, borderRadius: 14, padding: 14, border: `1px solid ${item.queue ? "rgba(245,166,35,0.4)" : item.status === "done" ? "rgba(39,174,96,0.3)" : "rgba(255,255,255,0.07)"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: item.status === "done" ? GREEN : item.queue ? SHOPEE_ORANGE : TEXT_MAIN }}>
              {item.status === "done" ? "✅" : item.queue ? "⏳" : "📋"} รายการที่ {idx + 1}
              {item.queue && <span style={{ fontSize: 10, marginLeft: 6, color: SHOPEE_ORANGE }}>(ในคิว)</span>}
              {item.status === "done" && <span style={{ fontSize: 10, marginLeft: 6, color: GREEN }}>(โพสแล้ว)</span>}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {items.length > 1 && <button onClick={() => removeItem(item.id)} style={{ background: "rgba(231,76,60,0.15)", border: "none", color: "#e74c3c", borderRadius: 6, padding: "3px 8px", fontSize: 12, cursor: "pointer" }}>✕</button>}
            </div>
          </div>
          <input ref={el => videoRefs.current[item.id] = el} type="file" accept="video/*" style={{ display: "none" }} onChange={e => handleVideoSelect(item.id, e)} />
          <button onClick={() => videoRefs.current[item.id]?.click()} style={{ width: "100%", padding: 9, borderRadius: 8, border: `1px dashed ${item.videoName ? "rgba(39,174,96,0.5)" : "rgba(255,255,255,0.15)"}`, background: item.videoName ? "rgba(39,174,96,0.07)" : "rgba(255,255,255,0.03)", color: item.videoName ? GREEN : TEXT_MUTED, fontSize: 12, cursor: "pointer", marginBottom: 8, textAlign: "left" }}>{item.videoName ? `🎬 ${item.videoName}` : "📁 กดเลือกไฟล์วิดีโอ..."}</button>
          <textarea placeholder="แคปชั่นสำหรับคลิปนี้..." value={item.caption} onChange={e => updateItem(item.id, "caption", e.target.value)} onBlur={() => saveItemToDB(item.id)} rows={3} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: TEXT_MAIN, fontSize: 12, outline: "none", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", marginBottom: 8 }} />
          <input placeholder="🔗 ลิงก์สินค้า..." value={item.link || ""} onChange={e => updateItem(item.id, "link", e.target.value)} onBlur={() => saveItemToDB(item.id)} style={{ width: "100%", background: "rgba(255,165,0,0.07)", border: "1px solid rgba(255,165,0,0.25)", borderRadius: 8, padding: "9px 12px", color: TEXT_MAIN, fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => toggleQueue(item.id)} style={{ flex: 1, padding: 8, borderRadius: 8, border: "none", fontSize: 12, fontWeight: "bold", cursor: "pointer", color: "#fff", background: item.queue ? "#D35400" : item.videoName ? GREEN : "rgba(255,255,255,0.1)" }}>
              {item.queue ? <><ArrowLeft size={12} style={{ display: "inline", marginRight: 4 }} />ดึงออกจากคิว</> : <>ส่งเข้าคิว {platformLabel} <ArrowRight size={12} style={{ display: "inline", marginLeft: 4 }} /></>}
            </button>
            {item.queue && item.videoFile && <button onClick={() => shareItem(item)} style={{ padding: "8px 14px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: "bold", cursor: "pointer", color: "#fff", background: "#4F46E5" }}>📲 แชร์</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── RESULT BOX ───────────────────────────────────────────────────────────────
function ResultBox({ text, id, copied, onCopy, queueLabel }) {
  return (
    <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 14, fontSize: 13, lineHeight: 1.7, whiteSpace: "pre-wrap", color: TEXT_MAIN, marginTop: 10, border: "1px solid rgba(255,255,255,0.07)", position: "relative", paddingRight: 130 }}>
      {text}
      <button style={{ position: "absolute", top: 10, right: 10, background: copied === id ? GREEN : "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "5px 10px", color: "#fff", fontSize: 11, cursor: "pointer", fontWeight: 700, lineHeight: 1.4, textAlign: "center" }} onClick={() => onCopy(text, id)}>
        {copied === id ? `${queueLabel} ส่งแล้ว!` : `📋 คัดลอก\n+ ส่งคิว`}
      </button>
    </div>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const MS = {
  app: { minHeight: "100vh", background: BG_DARK, color: TEXT_MAIN, paddingBottom: 40, fontFamily: "'Segoe UI','Noto Sans Thai',sans-serif" },
  hdr: { padding: "18px 20px 14px", position: "relative", overflow: "hidden" },
  glow: { position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: "200%", height: "200%", background: "radial-gradient(ellipse,rgba(255,200,0,0.08) 0%,transparent 70%)", pointerEvents: "none" },
  logo: { fontSize: 24, fontWeight: 900, margin: "0 0 2px" },
  badge: (c) => ({ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 20, padding: "3px 10px", fontSize: 11, color: c ? c : "#fff", fontFamily: "monospace" }),
  body: { padding: "14px", maxWidth: "600px", margin: "0 auto" },
  card: { background: BG_CARD, borderRadius: 16, padding: 16, marginBottom: 12, border: "1px solid rgba(255,255,255,0.07)" },
  cardT: { fontSize: 14, fontWeight: 700, color: SHOPEE_ORANGE, marginBottom: 12 },
  label: { display: "block", fontSize: 12, color: TEXT_MUTED, marginBottom: 5 },
  input: { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: TEXT_MAIN, fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 10 },
  tab: (a) => ({ padding: "8px 12px", borderRadius: 10, border: "none", fontSize: 12, fontWeight: a ? 700 : 400, cursor: "pointer", background: a ? SHOPEE_RED : "rgba(255,255,255,0.06)", color: a ? "#fff" : TEXT_MUTED, display: "inline-flex", alignItems: "center" }),
  tmplBtn: (a) => ({ padding: 10, borderRadius: 10, border: a ? `2px solid ${SHOPEE_RED}` : "1px solid rgba(255,255,255,0.1)", background: a ? "rgba(238,77,45,0.15)" : "rgba(255,255,255,0.03)", color: a ? "#fff" : TEXT_MUTED, fontSize: 13, cursor: "pointer" }),
  chip: { display: "inline-block", background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 20, padding: "4px 10px", fontSize: 11, color: SHOPEE_ORANGE, margin: "0 4px 4px 0", cursor: "pointer" },
  btnP: { width: "100%", background: `linear-gradient(135deg,${SHOPEE_RED},#C0392B)`, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 10 },
  btnS: { width: "100%", background: `linear-gradient(135deg,${SHOPEE_ORANGE},#E67E22)`, color: "#fff", border: "none", borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 700, cursor: "pointer" },
};
