import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Atom,
  CalendarDays,
  Command,
  FolderOpen,
  LayoutGrid,
  Loader2,
  Mail,
  MessageCircle,
  Mic,
  Plus,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.replace(/\/$/, "") || "http://localhost:8787";

const quickPrompts = ["What's on my calendar?", "Summarize my emails", "Create a reminder"];

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex h-7 w-12 items-center rounded-full p-1 transition-all ${checked ? "bg-white" : "bg-neutral-600"}`}
      aria-pressed={checked}
    >
      <span className={`h-5 w-5 rounded-full bg-black shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function ChatBubble({ role, text }) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] rounded-[22px] px-5 py-3.5 text-[15px] leading-relaxed backdrop-blur-md transition-all
          ${isUser ? "rounded-br-[6px] bg-white text-black" : "rounded-bl-[6px] border border-white/10 bg-white/5 text-white/90"}`}
      >
        {text}
      </div>
    </div>
  );
}

function DynamicAtom() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setPhase((p) => (p + 1) % 4), 3400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative flex h-32 w-32 items-center justify-center">
      <div className="absolute inset-0 rounded-full bg-white/5" />
      <div
        className={`absolute inset-0 rounded-full bg-white/10 transition-all duration-[1800ms] ${
          phase === 0 ? "scale-100 opacity-100 shadow-[0_0_50px_rgba(255,255,255,0.15)_inset,0_0_35px_rgba(255,255,255,0.1)]" : "scale-95 opacity-0"
        }`}
      />
      <div
        className={`absolute inset-0 rounded-full bg-white transition-all duration-[1800ms] ${
          phase === 1 ? "scale-90 opacity-100 shadow-[0_0_60px_rgba(255,255,255,0.7),0_0_100px_rgba(255,255,255,0.3)]" : "scale-75 opacity-0"
        }`}
      />
      <div className={`absolute inset-0 transition-all duration-[1800ms] ${phase === 2 ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <div className="absolute inset-0 [transform:rotateX(60deg)_rotateY(20deg)]">
          <div className="h-full w-full animate-[spin_4.5s_linear_infinite] rounded-full border-[2px] border-dotted border-white/80" />
        </div>
        <div className="absolute inset-0 [transform:rotateX(20deg)_rotateY(65deg)]">
          <div className="h-full w-full animate-[spin_5.5s_linear_infinite_reverse] rounded-full border-[2px] border-dotted border-white/60" />
        </div>
      </div>
      <div className={`absolute inset-0 transition-all duration-[1800ms] ${phase === 3 ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}>
        <div className="h-full w-full animate-[spin_2s_linear_infinite] rounded-full border-[2px] border-white/80 border-t-transparent" />
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setIsConnecting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google" }),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      onLogin(data?.user || { name: "User" });
    } catch {
      setError("Could not connect to your Worker. Start it and try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-[#050505] p-6 text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#1f2b5f]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#5f2b57]/20 blur-3xl" />

      <div className="relative z-10 mb-16 flex flex-col items-center">
        <DynamicAtom />
        <div className="mt-8 flex items-start">
          <h1 className="text-5xl font-bold tracking-tighter text-white">atom</h1>
          <div className="ml-1.5 mt-2 h-2.5 w-2.5 rounded-full bg-white" />
        </div>
        <div className="mt-5 flex items-center gap-2 text-xs uppercase tracking-[0.26em] text-white/50">
          <Sparkles className="h-3.5 w-3.5" /> Secure Workspace
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-3">
        <button
          onClick={handleLogin}
          disabled={isConnecting}
          className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white px-4 py-4 text-[15px] font-medium text-black transition-all hover:scale-[1.02] hover:bg-neutral-200 disabled:opacity-50"
        >
          {isConnecting ? <Loader2 className="h-5 w-5 animate-spin text-black/50" /> : "Sign in securely"}
        </button>
        {error && <p className="text-center text-xs text-red-300">{error}</p>}
      </div>
    </div>
  );
}

function IntegrationsScreen() {
  const [toggles, setToggles] = useState({ keiffer: true, thekeiffer: true, properties: true });
  const handleToggle = (key) => setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="flex h-full flex-col bg-[#0E0E10] text-white">
      <div className="px-6 pb-4 pt-14">
        <h2 className="text-center text-[15px] font-bold uppercase tracking-widest text-white">Atom Integrations</h2>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-5 pb-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="rounded-[28px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5 shadow-xl">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <svg className="h-6 w-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            </div>
            <div>
              <h3 className="text-[17px] font-medium">Connect Google Workspace</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/55">Connect your full suite of Google Workspace apps.</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: "keiffer", label: "keifferjapeth@gmail.com", avatar: "K" },
              { id: "thekeiffer", label: "thekeifferjapeth@gmail.com", avatar: "T" },
              { id: "properties", label: "propertiestage@gmail.com", avatar: "P" },
            ].map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-3 pl-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600 text-xs font-medium">{account.avatar}</div>
                  <span className="max-w-[170px] truncate text-sm font-medium text-white/90">{account.label}</span>
                </div>
                <ToggleSwitch checked={toggles[account.id]} onChange={() => handleToggle(account.id)} />
              </div>
            ))}

            <button className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm font-medium text-white/75 transition hover:bg-white/[0.08]">
              <Plus className="h-5 w-5" /> Add Workspace account
            </button>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Badge icon={CalendarDays} label="Google Calendar" />
            <Badge icon={Mail} label="Gmail" />
            <Badge icon={FolderOpen} label="Google Docs" />
            <Badge icon={MessageCircle} label="Chat" />
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-lg font-medium">Request an integration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5">
              <div className="mb-3 grid h-10 w-10 grid-cols-2 gap-0.5 rounded-xl bg-white/10 p-2">
                <div className="rounded-[2px] bg-[#F25022]" />
                <div className="rounded-[2px] bg-[#7FBA00]" />
                <div className="rounded-[2px] bg-[#00A4EF]" />
                <div className="rounded-[2px] bg-[#FFB900]" />
              </div>
              <h4 className="mb-1.5 text-sm font-medium">Microsoft 365</h4>
              <p className="text-[11px] leading-relaxed text-white/55">Email, calendars, docs, sheets, enterprise accounts.</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Command className="h-5 w-5" />
              </div>
              <h4 className="mb-1.5 text-sm font-medium">Apple Ecosystem</h4>
              <p className="text-[11px] leading-relaxed text-white/55">High penetration among prosumers; deep personal workflows.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ icon: Icon, label }) {
  return (
    <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-medium text-white/75">
      <Icon className="h-4 w-4" /> {label}
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("atom");
  const [messages, setMessages] = useState([{ id: "init-1", role: "assistant", text: "Welcome to Atom. Your secure, intelligent workspace." }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current && activeTab === "atom" && isAuthenticated) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [messages, activeTab, isAuthenticated]);

  const handleSend = async (rawText) => {
    const text = rawText?.trim();
    if (!text || isLoading) return;

    const userMessage = { id: `user-${Date.now()}`, role: "user", text };
    const nextMessages = [...messages, userMessage];
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, connectedApps: ["google_drive", "gmail", "cloudflare"] }),
      });

      const data = await response.json();
      const reply = data.reply || data.error || "I couldn't fetch a response right now.";
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", text: "Network error fetching response." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-[#000000] font-sans text-white sm:p-4">
      <div className="pointer-events-none absolute -left-20 top-10 h-[320px] w-[320px] rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-12 h-[320px] w-[320px] rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden border border-white/10 bg-[#0E0E10] shadow-2xl sm:h-[850px] sm:rounded-[40px]">
        {!isAuthenticated ? (
          <LoginScreen onLogin={() => setIsAuthenticated(true)} />
        ) : (
          <>
            {activeTab === "atom" && (
              <div className="relative flex h-full flex-1 flex-col">
                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-[#0E0E10] via-[#0E0E10]/90 to-transparent px-6 pb-4 pt-12" />

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-48 pt-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <div className="flex flex-col gap-5">
                    {messages.map((m) => (
                      <ChatBubble key={m.id} role={m.role} text={m.text} />
                    ))}
                    {isLoading && (
                      <div className="flex w-full justify-start">
                        <div className="max-w-[85%] rounded-[20px] rounded-bl-[4px] border border-white/10 bg-white/5 px-5 py-3.5 shadow-lg backdrop-blur-md">
                          <Loader2 className="h-5 w-5 animate-spin text-white/50" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="absolute inset-x-0 bottom-24 z-40 px-5">
                  <div className="flex gap-2 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {quickPrompts.map((label) => (
                      <button key={label} onClick={() => handleSend(label)} className="shrink-0 rounded-full border border-white/10 bg-[#1A1C20] px-4 py-2 text-[13px] text-white/70 transition hover:bg-white/10 hover:text-white">
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-[#1A1C20] p-2 pl-4 pr-2 shadow-2xl backdrop-blur-xl">
                    <button className="text-white/40 transition-colors hover:text-white">
                      <Plus className="h-5 w-5" />
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
                      placeholder="Write your message"
                      className="flex-1 bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-white/40 disabled:opacity-50"
                      disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                      <button className="px-1 text-white/40 transition-colors hover:text-white">
                        <Mic className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleSend(input)}
                        disabled={!input.trim() || isLoading}
                        className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${input.trim() && !isLoading ? "bg-white text-black" : "bg-white/5 text-white/20"}`}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={3} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "integrations" && <IntegrationsScreen />}

            {(activeTab === "panel" || activeTab === "friends") && (
              <div className="flex flex-1 flex-col items-center justify-center text-white/40">
                <Atom className="mb-4 h-12 w-12 opacity-30" />
                <p>This view is under construction.</p>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 z-50 flex h-24 items-start justify-around border-t border-white/10 bg-[#0E0E10]/85 px-2 pt-3 backdrop-blur-xl">
              <TabButton icon={Atom} label="Atom" active={activeTab === "atom"} onClick={() => setActiveTab("atom")} />
              <TabButton icon={LayoutGrid} label="Panel" active={activeTab === "panel"} onClick={() => setActiveTab("panel")} />
              <TabButton icon={Users} label="Friends" active={activeTab === "friends"} onClick={() => setActiveTab("friends")} />
              <button onClick={() => setActiveTab("integrations")} className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${activeTab === "integrations" ? "text-white" : "text-white/35 hover:text-white/60"}`}>
                <div className="relative">
                  <Star className="h-6 w-6" strokeWidth={1.5} />
                  {activeTab === "integrations" && <div className="absolute -right-2 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0E0E10] bg-white" />}
                </div>
                <span className="text-[10px] font-medium tracking-wide">Integrations</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 p-2 transition-colors ${active ? "text-white" : "text-white/35 hover:text-white/60"}`}>
      <Icon className="h-6 w-6" strokeWidth={1.5} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}
