/* ── Ora Chatbot Widget (production — calls Netlify function) ── */
(function () {
  const C = {
    terra: "#c04820", cream: "#f5f0e6",
    amber: "#d4860a", ink: "#1e1a12", inkLight: "#2a2419",
  };

  let messages = [], isLoading = false, isOpen = false, started = false;

  /* ── Styles ─────────────────────────────────────────────────── */
  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Lora:ital@1&family=DM+Sans:wght@400;500&display=swap');
    #ora-widget * { box-sizing: border-box; margin: 0; padding: 0; }
    #ora-widget { font-family: 'DM Sans', sans-serif; position: fixed; bottom: 24px; right: 24px; z-index: 999999; }
    #ora-panel { position: absolute; bottom: 72px; right: 0; width: 360px; height: 520px; background: ${C.ink}; border: 1px solid rgba(245,240,230,0.12); border-radius: 20px; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,0.5); animation: oraSlideUp 0.25s ease forwards; }
    #ora-messages { flex: 1; overflow-y: auto; padding: 16px 14px; display: flex; flex-direction: column; }
    #ora-messages::-webkit-scrollbar { width: 4px; }
    #ora-messages::-webkit-scrollbar-thumb { background: rgba(245,240,230,0.15); }
    .ora-msg { margin-bottom: 10px; display: flex; animation: oraSlideUp 0.2s ease forwards; }
    .ora-msg.user { justify-content: flex-end; }
    .ora-msg.assistant { align-items: flex-start; }
    .ora-avatar { width: 28px; height: 28px; background: ${C.terra}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${C.cream}; font-size: 11px; font-family: 'Fraunces', serif; flex-shrink: 0; margin-right: 8px; margin-top: 2px; }
    .ora-bubble { max-width: 75%; padding: 10px 14px; font-size: 13.5px; line-height: 1.65; letter-spacing: 0.01em; color: ${C.cream}; }
    .ora-bubble.user { background: ${C.terra}; border-radius: 16px 16px 4px 16px; }
    .ora-bubble.assistant { background: rgba(245,240,230,0.06); border-left: 2px solid ${C.amber}; border-radius: 4px 16px 16px 16px; }
    #ora-typing { display: flex; align-items: flex-start; margin-bottom: 10px; }
    #ora-typing-inner { background: rgba(245,240,230,0.06); border-left: 2px solid ${C.amber}; border-radius: 4px 16px 16px 16px; padding: 10px 14px; display: flex; gap: 5px; align-items: center; }
    .ora-dot { width: 6px; height: 6px; background: ${C.amber}; border-radius: 50%; animation: oraPulse 1.2s ease-in-out infinite; }
    .ora-dot:nth-child(2) { animation-delay: 0.2s; }
    .ora-dot:nth-child(3) { animation-delay: 0.4s; }
    #ora-quick { padding: 8px 14px; display: flex; gap: 6px; flex-wrap: wrap; flex-shrink: 0; background: ${C.inkLight}; }
    .ora-quick-btn { background: rgba(245,240,230,0.05); border: 1px solid rgba(245,240,230,0.12); border-radius: 20px; color: rgba(245,240,230,0.6); padding: 5px 12px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; transition: all 0.15s; }
    .ora-quick-btn:hover { background: rgba(245,240,230,0.1); color: ${C.cream}; }
    #ora-input-row { padding: 10px 14px; display: flex; gap: 8px; flex-shrink: 0; background: ${C.inkLight}; }
    #ora-input { flex: 1; background: rgba(245,240,230,0.05); border: 1px solid rgba(245,240,230,0.12); border-radius: 10px; color: ${C.cream}; padding: 9px 14px; font-size: 13px; font-family: 'DM Sans', sans-serif; outline: none; }
    #ora-input:focus { border-color: rgba(212,134,10,0.5); }
    #ora-input::placeholder { color: rgba(245,240,230,0.3); }
    #ora-send { background: ${C.terra}; border: none; border-radius: 10px; color: ${C.cream}; padding: 9px 16px; cursor: pointer; font-size: 13px; font-weight: 500; font-family: 'DM Sans', sans-serif; letter-spacing: 0.02em; transition: background 0.15s; }
    #ora-send:hover:not(:disabled) { background: #a83c1a; }
    #ora-send:disabled { opacity: 0.4; cursor: default; }
    #ora-footer { padding: 6px 14px 8px; background: ${C.inkLight}; text-align: center; flex-shrink: 0; }
    #ora-trigger { width: 56px; height: 56px; background: ${C.terra}; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 24px rgba(192,72,32,0.5); transition: transform 0.2s; position: relative; }
    #ora-trigger:hover { transform: scale(1.05); }
    #ora-trigger-glyph { font-family: 'Fraunces', serif; font-weight: 700; color: ${C.cream}; font-size: 22px; line-height: 1; transition: transform 0.25s; display: inline-block; }
    #ora-badge { position: absolute; top: -3px; right: -3px; width: 12px; height: 12px; background: ${C.amber}; border-radius: 50%; border: 2px solid ${C.ink}; }
    @keyframes oraSlideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes oraPulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1); } }
  `;
  document.head.appendChild(style);

  /* ── Widget container ───────────────────────────────────────── */
  const widget = document.createElement("div");
  widget.id = "ora-widget";
  widget.innerHTML = `<div id="ora-trigger"><span id="ora-trigger-glyph">◎</span><div id="ora-badge"></div></div>`;
  document.body.appendChild(widget);

  const trigger = widget.querySelector("#ora-trigger");
  const glyph   = widget.querySelector("#ora-trigger-glyph");
  const badge   = widget.querySelector("#ora-badge");

  /* ── Panel ──────────────────────────────────────────────────── */
  function buildPanel() {
    const p = document.createElement("div");
    p.id = "ora-panel";
    p.innerHTML = `
      <div style="background:${C.terra};padding:14px 18px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:34px;height:34px;background:${C.cream};display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:700;color:${C.terra};font-size:17px;">◎</div>
          <div>
            <div style="font-family:'Fraunces',serif;font-weight:700;color:${C.cream};font-size:16px;letter-spacing:0.02em;line-height:1;">Ora</div>
            <div style="color:rgba(245,240,230,0.65);font-size:11px;margin-top:3px;font-style:italic;font-family:'Lora',serif;">Growth systems for serious practices</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="display:flex;align-items:center;gap:5px;"><div style="width:6px;height:6px;border-radius:50%;background:#4ade80;"></div><span style="font-size:11px;color:rgba(245,240,230,0.6);">Online</span></div>
          <button id="ora-close" style="background:none;border:none;color:rgba(245,240,230,0.7);cursor:pointer;font-size:16px;padding:2px;line-height:1;">✕</button>
        </div>
      </div>
      <div id="ora-messages"></div>
      <div style="height:1px;background:rgba(245,240,230,0.08);flex-shrink:0;"></div>
      <div id="ora-quick">
        <button class="ora-quick-btn" data-q="I run a med spa or aesthetic clinic">Med spa / aesthetics</button>
        <button class="ora-quick-btn" data-q="I run a medical or dental practice">Medical or dental</button>
        <button class="ora-quick-btn" data-q="I run a service business">Other service biz</button>
      </div>
      <div id="ora-input-row">
        <input id="ora-input" placeholder="Type your message..." autocomplete="off" />
        <button id="ora-send" disabled>Send</button>
      </div>
      <div id="ora-footer"><span style="font-size:10px;color:rgba(245,240,230,0.25);font-family:'Lora',serif;font-style:italic;">withora.co · AI-powered</span></div>
    `;
    return p;
  }

  /* ── Helpers ────────────────────────────────────────────────── */
  function addMsg(role, text) {
    const c = document.getElementById("ora-messages");
    if (!c) return;
    const w = document.createElement("div");
    w.className = `ora-msg ${role}`;
    w.innerHTML = role === "assistant"
      ? `<div class="ora-avatar">◎</div><div class="ora-bubble assistant">${text}</div>`
      : `<div class="ora-bubble user">${text}</div>`;
    c.appendChild(w);
    c.scrollTop = c.scrollHeight;
  }

  function showTyping() {
    const c = document.getElementById("ora-messages");
    if (!c) return;
    const t = document.createElement("div");
    t.id = "ora-typing";
    t.innerHTML = `<div class="ora-avatar">◎</div><div id="ora-typing-inner"><div class="ora-dot"></div><div class="ora-dot"></div><div class="ora-dot"></div></div>`;
    c.appendChild(t);
    c.scrollTop = c.scrollHeight;
  }

  function hideTyping() { document.getElementById("ora-typing")?.remove(); }
  function hideQuick()   { const q = document.getElementById("ora-quick"); if (q) q.style.display = "none"; }

  /* ── API ────────────────────────────────────────────────────── */
  async function callOra(msgs) {
    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs }),
    });
    const data = await res.json();
    return data.reply || "Something went wrong. Please try again.";
  }

  async function initChat() {
    isLoading = true;
    showTyping();
    try {
      const reply = await callOra([{ role: "user", content: "__INIT__" }]);
      messages.push({ role: "assistant", content: reply });
      hideTyping();
      addMsg("assistant", reply);
    } catch {
      hideTyping();
      addMsg("assistant", "Hey, welcome to Ora. What kind of business do you run?");
    }
    isLoading = false;
    const s = document.getElementById("ora-send");
    if (s) s.disabled = false;
  }

  async function sendMessage(text) {
    if (!text.trim() || isLoading) return;
    const inp = document.getElementById("ora-input");
    const snd = document.getElementById("ora-send");
    if (inp) inp.value = "";
    if (snd) snd.disabled = true;
    hideQuick();
    messages.push({ role: "user", content: text });
    addMsg("user", text);
    isLoading = true;
    showTyping();
    try {
      const reply = await callOra(messages);
      messages.push({ role: "assistant", content: reply });
      hideTyping();
      addMsg("assistant", reply);
    } catch {
      hideTyping();
      addMsg("assistant", "Something went wrong. Please try again.");
    }
    isLoading = false;
    if (snd) snd.disabled = false;
    if (inp) inp.focus();
  }

  /* ── Toggle ─────────────────────────────────────────────────── */
  function openChat() {
    isOpen = true;
    badge.style.display = "none";
    glyph.style.transform = "rotate(45deg)";
    const panel = buildPanel();
    widget.insertBefore(panel, trigger);

    document.getElementById("ora-close").onclick = closeChat;

    const inp = document.getElementById("ora-input");
    const snd = document.getElementById("ora-send");
    inp.addEventListener("input", () => { snd.disabled = !inp.value.trim() || isLoading; });
    inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) sendMessage(inp.value); });
    snd.onclick = () => sendMessage(inp.value);
    document.querySelectorAll(".ora-quick-btn").forEach(b => {
      b.onclick = () => { inp.value = b.dataset.q; inp.focus(); snd.disabled = false; };
    });

    if (!started) {
      started = true;
      setTimeout(() => inp.focus(), 300);
      initChat();
    }
  }

  function closeChat() {
    isOpen = false;
    glyph.style.transform = "rotate(0deg)";
    document.getElementById("ora-panel")?.remove();
  }

  trigger.onclick = () => isOpen ? closeChat() : openChat();
})();
