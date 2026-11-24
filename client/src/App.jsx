import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");
const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;

const LANGUAGES = [
  "JavaScript", "TypeScript", "Java", "Python", "C", "C++", "C#", "Go", "PHP", "Ruby",
  "Kotlin", "Swift", "Rust", "SQL", "HTML", "CSS", "Bash", "JSON"
];

const EXTENSIONS = {
  JavaScript: "js", TypeScript: "ts", Java: "java", Python: "py", C: "c", "C++": "cpp", "C#": "cs",
  Go: "go", PHP: "php", Ruby: "rb", Kotlin: "kt", Swift: "swift", Rust: "rs", SQL: "sql", HTML: "html", CSS: "css", Bash: "sh", JSON: "json"
};

const FILE_LANGUAGE_MAP = {
  js: "JavaScript", mjs: "JavaScript", cjs: "JavaScript", jsx: "JavaScript", ts: "TypeScript", tsx: "TypeScript",
  java: "Java", py: "Python", pyw: "Python", c: "C", h: "C", cpp: "C++", cc: "C++", cxx: "C++", hpp: "C++",
  cs: "C#", go: "Go", php: "PHP", rb: "Ruby", kt: "Kotlin", kts: "Kotlin", swift: "Swift", rs: "Rust",
  sql: "SQL", html: "HTML", htm: "HTML", css: "CSS", sh: "Bash", bash: "Bash", json: "JSON"
};

const ACCEPTED_FILES = ".js,.mjs,.cjs,.jsx,.ts,.tsx,.java,.py,.pyw,.c,.h,.cpp,.cc,.cxx,.hpp,.cs,.go,.php,.rb,.kt,.kts,.swift,.rs,.sql,.html,.htm,.css,.sh,.bash,.json";

const SAMPLES = {
  JavaScript: `function calculateTotal(items) {\n  var total = 0;\n  items.forEach(item => {\n    total += item.price;\n  });\n  console.log(total);\n  return total;\n}`,
  TypeScript: `function getUser(id: any) {\n  var user = users.find(u => u.id == id);\n  console.log(user);\n  return user;\n}`,
  Java: `public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello World");\n  }\n}`,
  Python: `def calculate_total(items):\n    total = 0\n    print(total)\n    return total`,
  C: `#include <stdio.h>\n\nint calculateTotal(int a, int b) {\n    int total = a + b;\n    printf("Total: %d\\n", total);\n    return total;\n}\n\nint main(void) {\n    return calculateTotal(10, 20);\n}`,
  "C++": `#include <iostream>\nusing namespace std;\n\nint calculateTotal(int a, int b) {\n    int total = a + b;\n    cout << "Total: " << total << endl;\n    return total;\n}\n\nint main() {\n    return calculateTotal(10, 20);\n}`,
  "C#": `using System;\n\nclass Program {\n    static int CalculateTotal(int a, int b) {\n        int total = a + b;\n        Console.WriteLine(total);\n        return total;\n    }\n}`,
  Go: `package main\n\nimport "fmt"\n\nfunc calculateTotal(a int, b int) int {\n    total := a + b\n    fmt.Println(total)\n    return total\n}`,
  PHP: `<?php\nfunction calculateTotal($a, $b) {\n    $total = $a + $b;\n    echo $total;\n    return $total;\n}`,
  Ruby: `def calculate_total(a, b)\n  total = a + b\n  puts total\n  total\nend`,
  Kotlin: `fun calculateTotal(a: Int, b: Int): Int {\n    val total = a + b\n    println(total)\n    return total\n}`,
  Swift: `func calculateTotal(_ a: Int, _ b: Int) -> Int {\n    let total = a + b\n    print(total)\n    return total\n}`,
  Rust: `fn calculate_total(a: i32, b: i32) -> i32 {\n    let total = a + b;\n    println!("{}", total);\n    total\n}`,
  SQL: `SELECT *\nFROM users\nWHERE status = 'active';\n\nUPDATE users\nSET last_login = CURRENT_TIMESTAMP\nWHERE id = 10;`,
  HTML: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <title>CodeGuard Demo</title>\n</head>\n<body>\n  <h1>Welcome to CodeGuard-AI</h1>\n  <img src="profile.jpg">\n</body>\n</html>`,
  CSS: `.card {\n  color: #152039 !important;\n  padding: 20px;\n}`, 
  Bash: `#!/bin/bash\nname="CodeGuard"\necho "Hello ${name}"`,
  JSON: `{"name":"CodeGuard-AI","language":"JSON","enabled":true,"features":["analysis","history"]}`
};

function Icon({ name, size = 18, stroke = 1.8 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  const paths = {
    code: <><path d="m8 9-4 3 4 3"/><path d="m16 9 4 3-4 3"/><path d="m14 5-4 14"/></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></>,
    settings: <><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.42 1.42-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2v-.08a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.42-1.42.06-.06A1.7 1.7 0 0 0 9.4 15a1.7 1.7 0 0 0-1.56-1.03H7v-2h.84A1.7 1.7 0 0 0 9.4 10a1.7 1.7 0 0 0-.34-1.88L9 8.06l1.42-1.42.06.06A1.7 1.7 0 0 0 12.36 7 1.7 1.7 0 0 0 13.4 5.44V5h2v.44A1.7 1.7 0 0 0 16.43 7a1.7 1.7 0 0 0 1.88-.3l.06-.06 1.42 1.42-.06.06A1.7 1.7 0 0 0 19.4 10c.24.58.8.97 1.43.97H21v2h-.17A1.56 1.56 0 0 0 19.4 15Z"/></>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/></>,
    play: <path d="m8 5 11 7-11 7V5Z" fill="currentColor" stroke="none"/>,
    copy: <><rect x="9" y="9" width="10" height="10" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    moon: <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></>,
    logout: <><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 19V5a2 2 0 0 0-2-2h-6"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14.7-4L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.7 4L21 15"/><path d="M21 20v-5h-5"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></>,
    x: <><path d="m6 6 12 12M18 6 6 18"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16"/></>,
    spark: <><path d="m12 3 1.2 5.8L19 10l-5.8 1.2L12 17l-1.2-5.8L5 10l5.8-1.2L12 3Z"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>
  };
  return <svg {...common}>{paths[name] || paths.code}</svg>;
}

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(getStoredUser);
  const [path, setPath] = useState(() => window.location.pathname || "/");
  const [theme, setTheme] = useState(() => localStorage.getItem("cg-theme") || "light");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || "/");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cg-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const navigate = useCallback((next) => {
    const clean = next.startsWith("/") ? next : `/${next}`;
    if (window.location.pathname !== clean) window.history.pushState({}, "", clean);
    setPath(clean);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const loginSuccess = useCallback((data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    navigate("/dashboard");
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    navigate("/login");
    setToast({ type: "success", text: "You have been logged out." });
  }, [navigate]);

  const authPath = path === "/register" ? "register" : "login";
  const publicPath = path === "/" || path === "/login" || path === "/register";
  const privatePath = ["/dashboard", "/history", "/settings"].includes(path);

  let content;
  if (!token && publicPath) {
    content = <Auth mode={authPath} onSuccess={loginSuccess} onSwitch={() => navigate(authPath === "login" ? "/register" : "/login")} />;
  } else if (!token && privatePath) {
    content = <RedirectCard title="Sign in required" message="Please sign in to access your CodeGuard workspace." action="Go to login" onAction={() => navigate("/login")} />;
  } else if (token && publicPath) {
    content = <Workspace user={user} initialPath="/dashboard" onNavigate={navigate} onLogout={logout} theme={theme} setTheme={setTheme} toast={setToast} />;
  } else if (token && privatePath) {
    content = <Workspace user={user} initialPath={path} onNavigate={navigate} onLogout={logout} theme={theme} setTheme={setTheme} toast={setToast} />;
  } else {
    content = <NotFound onHome={() => navigate(token ? "/dashboard" : "/login")} />;
  }

  return <>{content}{toast && <Toast toast={toast} onClose={() => setToast(null)} />}</>;
}

function Auth({ mode, onSuccess, onSwitch }) {
  const register = mode === "register";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setMessage("");
    try {
      const res = await fetch(`${API}/auth/${register ? "register" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed.");
      onSuccess(data);
    } catch (error) { setMessage(error.message || "Request failed."); }
    finally { setLoading(false); }
  }

  return (
    <div className="auth-screen">
      <div className="auth-orb orb-a" /><div className="auth-orb orb-b" />
      <div className="auth-layout">
        <div className="auth-brand-panel">
          <Brand large />
          <div className="auth-hero-copy">
            <span className="eyebrow"><Icon name="spark" size={13} /> CODE QUALITY WORKSPACE</span>
            <h1>Ship cleaner code<br /><em>with confidence.</em></h1>
            <p>Review source code, detect common issues, jump to exact lines, and keep every analysis in one workspace.</p>
            <div className="feature-stack">
              <Feature icon="code" title="18+ languages" text="Analyze popular programming and markup languages." />
              <Feature icon="spark" title="AI + local analysis" text="Optional Gemini review with a dependable local fallback." />
              <Feature icon="history" title="Persistent history" text="Keep your recent reviews linked to your account." />
            </div>
          </div>
        </div>
        <div className="auth-panel card-glass">
          <div className="auth-panel-top"><span className="auth-badge">{register ? "CREATE ACCOUNT" : "WELCOME BACK"}</span><span className="secure-label"><span className="status-dot" /> Secure workspace</span></div>
          <h2>{register ? "Create your account" : "Sign in to CodeGuard"}</h2>
          <p className="auth-subtitle">{register ? "Start reviewing code in a few seconds." : "Continue where you left off."}</p>
          <form onSubmit={submit} className="auth-form">
            {register && <Field label="Full name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Yogesh Chauhan" required autoComplete="name" /></Field>}
            <Field label="Email"><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required autoComplete="email" /></Field>
            <Field label="Password"><div className="password-wrap"><input type={showPassword ? "text" : "password"} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Minimum 6 characters" minLength="6" required autoComplete={register ? "new-password" : "current-password"} /><button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? "Hide" : "Show"}</button></div></Field>
            {message && <div className="form-error"><Icon name="info" size={15} />{message}</div>}
            <button className="btn btn-primary btn-lg" disabled={loading}>{loading ? <><span className="spinner" /> Please wait...</> : <>{register ? "Create account" : "Sign in"}<Icon name="arrow" size={17} /></>}</button>
          </form>
          <div className="auth-switch">{register ? "Already have an account?" : "New to CodeGuard?"}<button onClick={onSwitch}>{register ? "Sign in" : "Create an account"}</button></div>
          <div className="auth-note"><Icon name="info" size={14} /> Your account data is stored securely in your configured MongoDB database.</div>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, text }) { return <div className="feature-row"><div className="feature-icon"><Icon name={icon} size={17} /></div><div><strong>{title}</strong><span>{text}</span></div></div>; }
function Field({ label, children }) { return <label className="field"><span>{label}</span>{children}</label>; }
function Brand({ large = false }) { return <div className={`brand ${large ? "brand-large" : ""}`}><span className="brand-symbol">◆</span><span>CodeGuard</span><b>-AI</b></div>; }

function Workspace({ user, initialPath, onNavigate, onLogout, theme, setTheme, toast, }) {
  const [mobileNav, setMobileNav] = useState(false);
  const [language, setLanguage] = useState("JavaScript");
  const [code, setCode] = useState(SAMPLES.JavaScript);
  const [review, setReview] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [issueFilter, setIssueFilter] = useState("all");
  const [historySearch, setHistorySearch] = useState("");
  const [health, setHealth] = useState("checking");
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const lineNumberRef = useRef(null);
  const tab = initialPath === "/history" ? "history" : initialPath === "/settings" ? "settings" : "review";
  const lineCount = useMemo(() => Math.max(1, code ? code.split("\n").length : 1), [code]);

  const loadHistory = useCallback(() => {
    fetch(`${API}/reviews`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(r => r.json()).then(d => setHistory(d.reviews || [])).catch(() => setHistory([]));
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);
  useEffect(() => {
    fetch(`${API}/health`)
      .then(async response => {
        if (!response.ok) throw new Error("API unavailable");
        const data = await response.json();
        setHealth("online");
        setGeminiConfigured(Boolean(data.geminiConfigured));
        setDatabaseConnected(Boolean(data.databaseConnected));
      })
      .catch(() => {
        setHealth("offline");
        setGeminiConfigured(false);
        setDatabaseConnected(false);
      });
  }, []);

  function go(next) { setMobileNav(false); onNavigate(next); }
  function updateCode(nextCode) { setCode(nextCode); if (review) setReview(null); }
  function changeLanguage(next) { setLanguage(next); setCode(SAMPLES[next] || ""); setFileName(""); setUploadMessage(""); setReview(null); setIssueFilter("all"); }
  function detectLanguage(name) { return FILE_LANGUAGE_MAP[name.toLowerCase().split(".").pop()] || null; }

  function handleFileUpload(event) {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    const detected = detectLanguage(file.name);
    if (!detected) { setUploadMessage("Unsupported file type."); toast({ type: "error", text: "Unsupported source-code file type." }); return; }
    if (file.size > MAX_UPLOAD_SIZE) { setUploadMessage("File is too large. Maximum is 5 MB."); toast({ type: "error", text: "Upload rejected: maximum file size is 5 MB." }); return; }
    const reader = new FileReader();
    reader.onload = async e => {
      const text = String(e.target?.result || "");
      if (!text.trim()) { setUploadMessage("The selected file is empty."); return; }
      setLanguage(detected); setReview(null); setCode(text); setFileName(file.name); setUploadMessage(`Detected ${detected}. Starting analysis...`);
      await analyze(text, detected);
      setUploadMessage(`Detected ${detected} from ${file.name}. Analysis complete.`);
    };
    reader.onerror = () => setUploadMessage("Could not read this file.");
    reader.readAsText(file);
  }

  function syncScroll() { if (textareaRef.current && lineNumberRef.current) lineNumberRef.current.scrollTop = textareaRef.current.scrollTop; }
  function scrollToIssueLine(line) {
    const target = Math.max(1, Number(line) || 1);
    if (!textareaRef.current) return;
    textareaRef.current.focus(); textareaRef.current.scrollTop = Math.max(0, (target - 1) * 22.36 - 90); syncScroll();
  }

  async function analyze(sourceCode = code, sourceLanguage = language) {
    if (!sourceCode.trim()) { toast({ type: "error", text: "Add some code before starting the review." }); return; }
    setLoading(true); setUploadMessage("");
    try {
      const res = await fetch(`${API}/reviews`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` }, body: JSON.stringify({ language: sourceLanguage, code: sourceCode }) });
      const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || `Analysis failed (HTTP ${res.status}).`);
      setReview(data.review); setIssueFilter("all"); loadHistory();
      const saveNotice = data.saved === false ? " (not saved to history)" : "";
      toast({ type: data.saved === false ? "error" : "success", text: `${data.review.source === "gemini" ? "Gemini AI review" : "Local fallback review"} complete — score ${data.review.score}/100.${saveNotice}` });
    } catch (error) { toast({ type: "error", text: error.message || "Analysis failed." }); }
    finally { setLoading(false); }
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1400); }
    catch { toast({ type: "error", text: "Clipboard access was blocked by the browser." }); }
  }

  const filteredIssues = useMemo(() => {
    const issues = review?.issues || [];
    return issueFilter === "all" ? issues : issues.filter(i => i.severity === issueFilter);
  }, [review, issueFilter]);

  const filteredHistory = useMemo(() => {
    const q = historySearch.trim().toLowerCase();
    if (!q) return history;
    return history.filter(item => `${item.language} ${item.score} ${item.source}`.toLowerCase().includes(q));
  }, [history, historySearch]);

  const scoreLabel = !review ? "—" : review.score >= 90 ? "Excellent" : review.score >= 75 ? "Good" : review.score >= 60 ? "Needs attention" : "Review needed";
  const initials = (user?.name || "U").split(" ").map(x => x[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="sidebar-head"><Brand /><button className="mobile-close" onClick={() => setMobileNav(false)}><Icon name="x" /></button></div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          <SideButton active={tab === "review"} icon="code" label="Code review" onClick={() => go("/dashboard")} />
          <SideButton active={tab === "history"} icon="history" label="Review history" count={history.length} onClick={() => go("/history")} />
          <SideButton active={tab === "settings"} icon="settings" label="Settings" onClick={() => go("/settings")} />
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-status"><span className={`status-dot ${health === "online" ? "online" : health === "offline" ? "offline" : ""}`} /><div><strong>API status</strong><span>{health === "checking" ? "Checking..." : health === "online" ? "Connected" : "Offline"}</span></div></div>
        <button className="sidebar-user" onClick={() => go("/settings")}><div className="avatar">{initials}</div><div><strong>{user?.name || "User"}</strong><span>{user?.email || "Account"}</span></div><Icon name="chevron" size={15} /></button>
      </aside>
      {mobileNav && <button className="sidebar-backdrop" aria-label="Close menu" onClick={() => setMobileNav(false)} />}

      <div className="app-main">
        <header className="app-topbar">
          <button className="mobile-menu" onClick={() => setMobileNav(true)}><Icon name="menu" /></button>
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{tab === "review" ? "Code review" : tab === "history" ? "History" : "Settings"}</strong></div>
          <div className="top-actions">
            <button className="icon-btn" title="Toggle theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}><Icon name={theme === "light" ? "moon" : "sun"} size={17} /></button>
            <div className="top-user"><div className="avatar small">{initials}</div><span>{user?.name || "User"}</span></div>
            <button className="logout-btn" onClick={onLogout}><Icon name="logout" size={15} /> <span>Logout</span></button>
          </div>
        </header>

        <main className="content">
          {tab === "review" && <ReviewPage {...{ language, code, review, loading, fileName, uploadMessage, lineCount, lineNumberRef, textareaRef, issueFilter, filteredIssues, scoreLabel, copied, geminiConfigured, setCode, changeLanguage, handleFileUpload, syncScroll, scrollToIssueLine, analyze, copyCode, setIssueFilter, go }} />}
          {tab === "history" && <HistoryPage history={filteredHistory} search={historySearch} setSearch={setHistorySearch} onReview={() => go("/dashboard")} />}
          {tab === "settings" && <SettingsPage user={user} theme={theme} setTheme={setTheme} health={health} databaseConnected={databaseConnected} geminiConfigured={geminiConfigured} onLogout={onLogout} />}
        </main>
      </div>
    </div>
  );
}

function SideButton({ active, icon, label, count, onClick }) { return <button className={`side-button ${active ? "active" : ""}`} onClick={onClick}><Icon name={icon} size={17} /><span>{label}</span>{typeof count === "number" && <b>{count}</b>}</button>; }

function ReviewPage({ language, code, review, loading, fileName, uploadMessage, lineCount, lineNumberRef, textareaRef, issueFilter, filteredIssues, scoreLabel, copied, geminiConfigured, setCode, changeLanguage, handleFileUpload, syncScroll, scrollToIssueLine, analyze, copyCode, setIssueFilter, go }) {
  const totalIssues = review?.issues?.length || 0;
  const counts = useMemo(() => ({ high: review?.issues?.filter(i => i.severity === "high").length || 0, medium: review?.issues?.filter(i => i.severity === "medium").length || 0, low: review?.issues?.filter(i => i.severity === "low").length || 0 }), [review]);
  return <>
    <section className="page-heading"><div><span className="eyebrow"><span className="live-dot" /> CODE QUALITY ASSISTANT</span><h1>Review code with clarity.</h1><p>Analyze source code, find common issues, and jump straight to the lines that need attention.</p></div><div className="heading-badges"><span><Icon name="spark" size={14} /> AI-ready</span><span><Icon name="check" size={14} /> 5 MB uploads</span></div></section>
    <section className="review-layout">
      <div className="editor-panel card">
        <div className="panel-head"><div><div className="panel-title"><h2>Code workspace</h2><span className={`mini-badge ${geminiConfigured ? "ai-ready" : "local-ready"}`}>{geminiConfigured ? "GEMINI AI CONFIGURED" : "LOCAL FALLBACK — ADD GEMINI KEY"}</span></div><p>Paste code or upload a source file.</p></div><div className="language-select"><span>Language</span><select value={language} onChange={e => changeLanguage(e.target.value)}>{LANGUAGES.map(x => <option key={x}>{x}</option>)}</select></div></div>
        <div className="editor-shell">
          <div className="editor-bar"><div className="traffic"><i /><i /><i /></div><div className="editor-file"><Icon name="file" size={13} />{fileName || `main.${EXTENSIONS[language] || "txt"}`}</div><div className="editor-tools"><label className="tool-btn"><input type="file" accept={ACCEPTED_FILES} onChange={handleFileUpload} /><Icon name="upload" size={14} /> Upload</label><button className="tool-btn" onClick={() => { setCode(SAMPLES[language] || ""); setReview(null); setUploadMessage(""); setFileName(""); }}><Icon name="refresh" size={13} /> Sample</button><button className="tool-btn" onClick={copyCode}><Icon name={copied ? "check" : "copy"} size={13} /> {copied ? "Copied" : "Copy"}</button></div></div>
          <div className="code-editor"><div className="line-numbers" ref={lineNumberRef}>{Array.from({ length: lineCount }, (_, i) => <div key={i} className="line-number">{i + 1}</div>)}</div><textarea ref={textareaRef} value={code} onChange={e => setCode(e.target.value)} onScroll={syncScroll} spellCheck="false" wrap="off" placeholder={`Paste your ${language} code here...`} /></div>
          <div className="editor-bottom"><div className="editor-stats"><span>{lineCount} lines</span><span>{code.length.toLocaleString()} chars</span><span>{language}</span><span>Max 5 MB</span></div>{uploadMessage && <span className="upload-message"><Icon name="info" size={13} /> {uploadMessage}</span>}</div>
        </div>
        <div className="editor-actions-bottom"><div className="tip"><Icon name="spark" size={15} /><span>Tip: Fix high-severity issues first, then review medium and low items.</span></div><button className="btn btn-primary" onClick={() => analyze()} disabled={loading || !code.trim()}>{loading ? <><span className="spinner" /> Analyzing</> : <><Icon name="play" size={14} /> Analyze code</>}</button></div>
      </div>

      <div className="results-column">
        {!review ? <EmptyResults /> : <>
          <div className="score-card card"><div className="score-main"><span className="eyebrow">QUALITY SCORE</span><div className="score-value">{review.score}<small>/100</small></div><strong>{scoreLabel}</strong><span>Based on detected code-quality patterns</span></div><ScoreRing score={review.score} /></div>
          <div className="metric-grid"><Metric label="High" value={counts.high} tone="high" /><Metric label="Medium" value={counts.medium} tone="medium" /><Metric label="Low" value={counts.low} tone="low" /><Metric label="Total" value={totalIssues} tone="total" /></div>
          <div className="result-card card"><div className="result-head"><div><h2>Detected issues</h2><p>{totalIssues ? `${totalIssues} finding${totalIssues === 1 ? "" : "s"} in this review` : "No common issues detected"}</p></div><span className={`source-badge ${review.source === "gemini" ? "ai" : "local"}`}><Icon name="spark" size={12} /> {review.source === "gemini" ? "GEMINI AI" : "LOCAL"}</span></div>
            {totalIssues > 0 && <div className="filter-row">{["all", "high", "medium", "low"].map(f => <button key={f} className={issueFilter === f ? "selected" : ""} onClick={() => setIssueFilter(f)}>{f === "all" ? `All ${totalIssues}` : `${f} ${counts[f]}`}</button>)}</div>}
            <div className="issues-list">{filteredIssues.length ? filteredIssues.map((issue, i) => <button className="issue-row" key={`${issue.title}-${i}`} onClick={() => scrollToIssueLine(issue.line)}><span className={`severity-dot ${issue.severity}`} /><div className="issue-body"><div className="issue-title-line"><strong>{issue.title}</strong><span className={`severity-tag ${issue.severity}`}>{issue.severity}</span></div><p>{issue.message}</p><span className="issue-line-link">Line {issue.line} <Icon name="arrow" size={12} /></span></div></button>) : <div className="no-issues"><div><Icon name="check" size={20} /></div><strong>{totalIssues ? "No issues in this filter" : "Clean review"}</strong><span>No common issues were detected by the active analyzer.</span></div>}</div>
          </div>
          <div className="result-card card recommendations-card"><div className="result-head"><div><h2>Recommendations</h2><p>Practical next steps for this review.</p></div><span className="recommend-icon"><Icon name="spark" size={14} /></span></div><ul>{(review.suggestions || []).map((s, i) => <li key={i}><span><Icon name="check" size={13} /></span>{s}</li>)}</ul></div>
        </>}
      </div>
    </section>
  </>;
}

function ScoreRing({ score }) { const deg = Math.max(0, Math.min(360, score * 3.6)); return <div className="score-ring" style={{ "--score-angle": `${deg}deg` }}><div><strong>{score}</strong><span>score</span></div></div>; }
function Metric({ label, value, tone }) { return <div className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong></div>; }
function EmptyResults() { return <div className="empty-results card"><div className="empty-orb"><Icon name="spark" size={24} /></div><h2>Your review appears here</h2><p>Run an analysis to get a quality score, severity breakdown, exact line references, and recommendations.</p><div className="empty-list"><span><Icon name="check" size={12} /> Severity detection</span><span><Icon name="check" size={12} /> Line navigation</span><span><Icon name="check" size={12} /> Review history</span></div></div>; }

function HistoryPage({ history, search, setSearch, onReview }) {
  const average = history.length ? Math.round(history.reduce((a, b) => a + Number(b.score || 0), 0) / history.length) : 0;
  return <>
    <section className="page-heading"><div><span className="eyebrow">WORKSPACE HISTORY</span><h1>Review history.</h1><p>Your recent analyses, scores, and source modes in one place.</p></div><button className="btn btn-primary" onClick={onReview}><Icon name="code" size={15} /> New review</button></section>
    <div className="history-summary"><SummaryCard label="Saved reviews" value={history.length} /><SummaryCard label="Average score" value={history.length ? `${average}/100` : "—"} /><SummaryCard label="Languages" value={new Set(history.map(x => x.language)).size} /></div>
    <section className="card history-card"><div className="history-toolbar"><div className="search-box"><Icon name="search" size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search language, score, source..." /></div><span>{history.length} result{history.length === 1 ? "" : "s"}</span></div>
      {history.length === 0 ? <div className="history-empty"><div><Icon name="history" size={22} /></div><h2>No reviews found</h2><p>Run your first code analysis and it will appear here.</p><button className="btn btn-secondary" onClick={onReview}>Start a review <Icon name="arrow" size={14} /></button></div> : <div className="history-table"><div className="history-table-head"><span>Language</span><span>Score</span><span>Issues</span><span>Source</span><span>Reviewed</span></div>{history.map((item, i) => <div className="history-table-row" key={`${item._id || item.id || i}`}><div className="history-language"><span>{item.language?.slice(0, 2).toUpperCase()}</span><strong>{item.language}</strong></div><strong className={`history-score ${item.score >= 80 ? "good" : item.score >= 60 ? "mid" : "low"}`}>{item.score}<small>/100</small></strong><span>{item.issues?.length ?? "—"}</span><span><b className={`source-mini ${item.source === "gemini" ? "ai" : "local"}`}>{item.source === "gemini" ? "AI" : "LOCAL"}</b></span><span className="history-date">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Recent"}</span></div>)}</div>}
    </section>
  </>;
}
function SummaryCard({ label, value }) { return <div className="summary-card card"><span>{label}</span><strong>{value}</strong></div>; }

function SettingsPage({ user, theme, setTheme, health, databaseConnected, geminiConfigured, onLogout }) {
  return <>
    <section className="page-heading"><div><span className="eyebrow">WORKSPACE SETTINGS</span><h1>Settings.</h1><p>Manage the local workspace experience and inspect your account connection.</p></div></section>
    <div className="settings-grid">
      <section className="settings-card card"><div className="settings-title"><div><h2>Appearance</h2><p>Choose how CodeGuard looks on this device.</p></div><Icon name="spark" /></div><div className="theme-options"><button className={theme === "light" ? "theme-option active" : "theme-option"} onClick={() => setTheme("light")}><div className="theme-preview light-preview"><span /><i /><i /></div><strong>Light</strong><small>Clean and bright</small></button><button className={theme === "dark" ? "theme-option active" : "theme-option"} onClick={() => setTheme("dark")}><div className="theme-preview dark-preview"><span /><i /><i /></div><strong>Dark</strong><small>Low-light workspace</small></button></div></section>
      <section className="settings-card card"><div className="settings-title"><div><h2>Account</h2><p>Current signed-in account.</p></div><div className="avatar large">{(user?.name || "U").charAt(0).toUpperCase()}</div></div><div className="account-fields"><div><span>Name</span><strong>{user?.name || "—"}</strong></div><div><span>Email</span><strong>{user?.email || "—"}</strong></div><div><span>Session</span><strong className="session-live"><span className="status-dot online" /> Active</strong></div></div></section>
      <section className="settings-card card"><div className="settings-title"><div><h2>System connection</h2><p>Live status from the CodeGuard API.</p></div><span className={`connection-pill ${health}`}>{health === "online" ? "Connected" : health === "offline" ? "Offline" : "Checking"}</span></div><div className="connection-info"><div><span>API</span><strong>{API.replace(/\/api$/, "").replace(/^https?:\/\//, "")}</strong></div><div><span>Database</span><strong>{databaseConnected ? "MongoDB connected" : "Not connected"}</strong></div><div><span>AI mode</span><strong>{geminiConfigured ? "Gemini key configured + fallback" : "Local fallback (add Gemini key)"}</strong></div></div></section>
      <section className="settings-card danger-card card"><div><div><h2>Sign out</h2><p>End your current CodeGuard session on this browser.</p></div><button className="btn btn-danger" onClick={onLogout}><Icon name="logout" size={15} /> Logout</button></div></section>
    </div>
  </>;
}

function RedirectCard({ title, message, action, onAction }) { return <div className="standalone-screen"><div className="standalone-card card"><div className="empty-orb"><Icon name="info" size={24} /></div><h1>{title}</h1><p>{message}</p><button className="btn btn-primary" onClick={onAction}>{action}<Icon name="arrow" size={15} /></button></div></div>; }
function NotFound({ onHome }) { return <div className="standalone-screen"><div className="standalone-card card"><span className="error-code">404</span><h1>Page not found</h1><p>The page you are looking for does not exist in CodeGuard-AI.</p><button className="btn btn-primary" onClick={onHome}>Go to CodeGuard-AI <Icon name="arrow" size={15} /></button></div></div>; }
function Toast({ toast, onClose }) { return <div className={`toast ${toast.type || "success"}`}><span><Icon name={toast.type === "error" ? "info" : "check"} size={16} /></span><p>{toast.text}</p><button onClick={onClose}><Icon name="x" size={14} /></button></div>; }

export default App;
