import { useState, useEffect, useRef } from "react";

// ─── SVG Icon Components ───────────────────────────────────────────────────────

const SparkleIcon = ({ size = 18, color = "white" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={color} />
  </svg>
);

const UserIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M20 21V19C20 16.79 18.21 15 16 15H8C5.79 15 4 16.79 4 19V21" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="12" cy="7" r="4" fill="white" />
  </svg>
);

const ChatIcon = ({ active }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={active ? "#0091DA" : "rgba(255,255,255,0.45)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const PaperclipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

// ─── API Configuration ────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "https://knowledge-assistant-platform.onrender.com";

// ─── App Component ─────────────────────────────────────────────────────────────

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState("checking");
  const messagesEndRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId) || chats[0] || { messages: [] };
  const messages = activeChat.messages;

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const r = await fetch(`${API_URL}/api/health`);
        setServerStatus(r.ok ? "online" : "offline");
      } catch { setServerStatus("offline"); }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const getTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;
    const t = getTime();

    let currentChatId = activeChatId;
    if (!currentChatId) {
      currentChatId = Date.now();
      const title = query.length > 30 ? query.substring(0, 30) + "..." : query;
      setChats((p) => [{ id: currentChatId, title, time: "Just now", messages: [{ sender: "user", text: query, time: t }] }, ...p]);
      setActiveChatId(currentChatId);
    } else {
      setChats((p) => p.map((c) => c.id === currentChatId ? { ...c, messages: [...c.messages, { sender: "user", text: query, time: t }] } : c));
    }
    if (!textToSend) setInput("");
    setLoading(true);

    let botAdded = false, botText = "";

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        let err = "";
        try { const d = await response.json(); err = d?.response || ""; } catch {}
        throw new Error(err || "Unable to fetch response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      const bt = getTime();

      setChats((p) => p.map((c) => c.id === currentChatId ? { ...c, messages: [...c.messages, { sender: "bot", text: "", time: bt }] } : c));
      botAdded = true;

      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          botText += decoder.decode(value, { stream: !done });
          setChats((p) => p.map((c) => {
            if (c.id !== currentChatId) return c;
            const msgs = [...c.messages];
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: botText };
            return { ...c, messages: msgs };
          }));
        }
      }
    } catch (err) {
      const msg = err.message || "Connection error. Please ensure the backend is running.";
      if (botAdded) {
        setChats((p) => p.map((c) => {
          if (c.id !== currentChatId) return c;
          const msgs = [...c.messages];
          msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], text: botText ? `${botText}\n\n${msg}` : msg, isError: true };
          return { ...c, messages: msgs };
        }));
      } else {
        setChats((p) => p.map((c) => c.id === currentChatId ? { ...c, messages: [...c.messages, { sender: "bot", text: msg, isError: true, time: getTime() }] } : c));
      }
    } finally { setLoading(false); }
  };

  const handleKeyPress = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  const handleNewChat = () => {
    const id = Date.now();
    setChats((p) => [{ id, title: "New Chat", time: "Just now", messages: [] }, ...p]);
    setActiveChatId(id);
  };

  // ─── Suggestion Templates ──────────────────────────────────
  const suggestions = [
    { title: "Mission Objectives", desc: "Core goals and strategic priorities of NMCG", prompt: "What are the objectives of NMCG?" },
    { title: "Platform Overview", desc: "How the assistant processes and delivers insights", prompt: "How does the Knowledge Assistant platform work?" },
    { title: "Governance Framework", desc: "Roles of central and state authorities", prompt: "What is the role of states in clean Ganga?" },
    { title: "Key Initiatives", desc: "Major programmes and implementation status", prompt: "What are the major initiatives under NMCG?" },
  ];

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", backgroundColor: "#F7F8FA", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>

      {/* ─── Sidebar ───────────────────────────────────────────────── */}
      <div style={{
        width: sidebarOpen ? "270px" : "72px",
        transition: "width 0.2s cubic-bezier(0.25,1,0.5,1)",
        backgroundColor: "#001A4D",
        display: "flex", flexDirection: "column",
        padding: sidebarOpen ? "20px 14px" : "20px 10px",
        flexShrink: 0,
      }}>
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: sidebarOpen ? "space-between" : "center", marginBottom: "28px", padding: "0 4px" }}>
          {sidebarOpen ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "8px",
                background: "linear-gradient(135deg, #00338D, #005EB8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,51,141,0.3)",
              }}>
                <SparkleIcon size={16} />
              </div>
              <div>
                <div style={{ color: "white", fontWeight: "600", fontSize: "15px", fontFamily: "'Outfit', sans-serif", lineHeight: "1.1" }}>Knowledge</div>
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px", fontWeight: "500" }}>Assistant</div>
              </div>
            </div>
          ) : (
            <div style={{
              width: "34px", height: "34px", borderRadius: "8px",
              background: "linear-gradient(135deg, #00338D, #005EB8)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <SparkleIcon size={16} />
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
            background: "transparent", border: "none", color: "rgba(255,255,255,0.45)",
            fontSize: "18px", cursor: "pointer", padding: "4px",
            marginLeft: sidebarOpen ? 0 : 0, marginTop: sidebarOpen ? 0 : "12px",
          }}>☰</button>
        </div>

        {/* New Chat */}
        <button onClick={handleNewChat} style={{
          padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)",
          backgroundColor: "rgba(255,255,255,0.04)", color: "white",
          fontWeight: "500", fontSize: "13px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          transition: "background 0.15s", marginBottom: "24px", width: "100%",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
        >
          <span style={{ fontSize: "16px" }}>+</span> {sidebarOpen && "New Chat"}
        </button>

        {/* Chat List */}
        {sidebarOpen && (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: "hidden" }}>
            <div style={{ fontSize: "10px", fontWeight: "600", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", paddingLeft: "6px" }}>
              Recent Chats
            </div>
            <div className="sidebar-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "2px", overflowY: "auto", flexGrow: 1 }}>
              {chats.map((chat) => (
                <div key={chat.id} onClick={() => setActiveChatId(chat.id)}
                  style={{
                    padding: "10px 10px", borderRadius: "8px", cursor: "pointer",
                    backgroundColor: chat.id === activeChatId ? "rgba(255,255,255,0.06)" : "transparent",
                    display: "flex", alignItems: "center", gap: "8px",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { if (chat.id !== activeChatId) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { if (chat.id !== activeChatId) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <ChatIcon active={chat.id === activeChatId} />
                  <div style={{ overflow: "hidden", flex: 1 }}>
                    <div style={{ color: chat.id === activeChatId ? "white" : "rgba(255,255,255,0.7)", fontSize: "13px", fontWeight: chat.id === activeChatId ? "500" : "400", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                      {chat.title}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", marginTop: "2px" }}>{chat.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        {sidebarOpen && (
          <div style={{ paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: "500", color: serverStatus === "online" ? "#34D399" : serverStatus === "offline" ? "#F87171" : "#93C5FD", paddingLeft: "6px", marginBottom: "10px" }}>
              <div className={serverStatus === "online" ? "pulse-status" : ""} style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: serverStatus === "online" ? "#10B981" : serverStatus === "offline" ? "#EF4444" : "#3B82F6" }} />
              {serverStatus === "online" ? "Connected" : serverStatus === "offline" ? "Disconnected" : "Connecting..."}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 6px", borderRadius: "8px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #00338D, #005EB8)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "600", fontSize: "11px" }}>DA</div>
              <div>
                <div style={{ color: "white", fontSize: "12px", fontWeight: "500" }}>Admin</div>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px" }}>Admin</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Main ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative", height: "100%" }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 28px", borderBottom: "1px solid #ECEEF2", backgroundColor: "white",
        }}>
          <div style={{ flex: 1 }} />
          <div style={{ textAlign: "center" }}>
            <h1 style={{ color: "#00338D", fontSize: "17px", fontWeight: "700", fontFamily: "'Outfit', sans-serif", margin: 0, letterSpacing: "-0.01em" }}>
              How may I help you today?
            </h1>
            <p style={{ color: "#9CA3AF", fontSize: "11px", margin: "2px 0 0 0", fontWeight: "400", letterSpacing: "0.04em" }}>
              Transforming Information into Insight
            </p>
          </div>
          <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
            <button style={{ background: "transparent", border: "1px solid #E5E7EB", padding: "7px", cursor: "pointer", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <SettingsIcon />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="custom-scrollbar" style={{
          flex: 1, overflowY: "auto", padding: "28px 10% 130px 10%",
          display: "flex", flexDirection: "column", gap: "20px", backgroundColor: "#F7F8FA",
        }}>
          {messages.length === 0 ? (
            /* ─── Landing ────────────────────────────────────────── */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", paddingTop: "48px" }}>

              {/* Logo Mark */}
              <div className="animate-slide-up" style={{
                width: "52px", height: "52px", borderRadius: "14px",
                background: "linear-gradient(135deg, #00338D 0%, #005EB8 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "24px",
                boxShadow: "0 8px 20px -4px rgba(0,51,141,0.2)",
              }}>
                <SparkleIcon size={24} />
              </div>

              <h2 className="animate-slide-up delay-1 kpmg-gradient-text" style={{
                fontSize: "36px", fontWeight: "700", fontFamily: "'Outfit', sans-serif",
                marginBottom: "6px", letterSpacing: "-0.03em",
              }}>
                Hello, Admin
              </h2>

              <p className="animate-slide-up delay-2" style={{
                color: "#6B7280", fontSize: "14px", fontWeight: "400",
                marginBottom: "48px", maxWidth: "380px", lineHeight: "1.55",
              }}>
                Ask questions, explore insights, and get answers from the knowledge system.
              </p>

              {/* Suggestions */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", maxWidth: "560px", width: "100%" }}>
                {suggestions.map((item, idx) => (
                  <button key={idx}
                    className={`animate-slide-up delay-${idx + 3} card-interactive`}
                    onClick={() => handleSend(item.prompt)}
                    style={{
                      background: "white", border: "1px solid #E5E7EB", borderRadius: "10px",
                      padding: "16px", textAlign: "left", cursor: "pointer",
                      display: "flex", flexDirection: "column", gap: "4px", width: "100%",
                    }}
                  >
                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#111827" }}>
                      {item.title}
                    </span>
                    <span style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: "1.4" }}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ─── Messages ───────────────────────────────────────── */
            messages.map((msg, i) => (
              <div key={i} className="animate-message" style={{
                display: "flex", justifyContent: msg.sender === "user" ? "flex-end" : "flex-start",
                width: "100%", gap: "10px", alignItems: "flex-start",
              }}>
                {msg.sender === "bot" && (
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #00338D, #005EB8)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <SparkleIcon size={14} />
                  </div>
                )}

                <div style={{
                  maxWidth: "68%", padding: "14px 18px", borderRadius: "12px",
                  fontSize: "13.5px", lineHeight: "1.65",
                  color: msg.sender === "user" ? "white" : "#1F2937",
                  backgroundColor: msg.sender === "user" ? "#00338D" : "white",
                  border: msg.sender === "bot" ? "1px solid #E5E7EB" : "none",
                  boxShadow: msg.sender === "bot" ? "0 1px 3px rgba(0,0,0,0.03)" : "0 2px 8px rgba(0,51,141,0.12)",
                  whiteSpace: "pre-wrap",
                }}>
                  <div>{msg.text}</div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "flex-end",
                    fontSize: "10px", color: msg.sender === "user" ? "rgba(255,255,255,0.6)" : "#9CA3AF",
                    marginTop: "6px", gap: "4px",
                  }}>
                    {msg.time}
                    {msg.sender === "user" && <span style={{ fontSize: "10px", opacity: 0.7 }}>✓✓</span>}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "linear-gradient(135deg, #00338D, #005EB8)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <UserIcon />
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading */}
          {loading && (messages.length === 0 || messages[messages.length - 1].sender !== "bot") && (
            <div style={{ display: "flex", justifyContent: "flex-start", width: "100%", gap: "10px", alignItems: "flex-start" }}>
              <div style={{
                width: "32px", height: "32px", borderRadius: "50%",
                background: "linear-gradient(135deg, #00338D, #005EB8)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <SparkleIcon size={14} />
              </div>
              <div style={{ padding: "14px 18px", borderRadius: "12px", backgroundColor: "white", border: "1px solid #E5E7EB" }}>
                <div className="typing-dots">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ─── Input Bar ─────────────────────────────────────────── */}
        <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", padding: "16px 10%", zIndex: 10 }}>
          <div style={{
            display: "flex", alignItems: "center", backgroundColor: "white",
            border: "1px solid #E5E7EB", borderRadius: "12px",
            padding: "6px 10px 6px 20px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            gap: "8px",
          }}>
            <input
              type="text"
              placeholder={serverStatus === "offline" ? "Connecting to backend..." : "Ask anything..."}
              disabled={serverStatus === "offline" || loading}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              style={{
                flex: 1, border: "none", outline: "none",
                fontSize: "13px", color: "#111827", height: "36px",
                backgroundColor: "transparent",
              }}
            />

            <button style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: "6px", borderRadius: "6px", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#F3F4F6"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <PaperclipIcon />
            </button>

            <button
              onClick={() => handleSend()}
              disabled={serverStatus === "offline" || loading || !input.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "8px", border: "none",
                background: serverStatus === "offline" || loading || !input.trim() ? "#D1D5DB" : "linear-gradient(135deg, #00338D, #005EB8)",
                cursor: serverStatus === "offline" || loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "opacity 0.15s",
                boxShadow: serverStatus === "offline" || loading || !input.trim() ? "none" : "0 2px 8px rgba(0,51,141,0.2)",
              }}
            >
              <SendIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;