/**
 * script.js
 * Frontend application logic for the DSA Mentor chatbot.
 * No frameworks — vanilla JS, talking to the Express backend over REST.
 */

(() => {
  'use strict';

  // ---------------------------------------------------------------------
  // Config
  // ---------------------------------------------------------------------
  // The Express backend serves this frontend directly (see server/app.js),
  // so the API is always same-origin — '/api' works both in local dev
  // (http://localhost:5000) and in production, with zero CORS setup needed.
  //
  // Only change this if you deploy the frontend separately from the
  // backend (e.g. frontend on Vercel/Netlify, backend on Render) — in that
  // case, set this to your backend's full URL, e.g.:
  //  const API_BASE = 'https://dsa-instructor-chatbot-950s.onrender.com/api';
  const API_BASE = '/api';

  const SESSION_KEY = 'dsa-mentor-session-id';
  const THEME_KEY = 'dsa-mentor-theme';

  // ---------------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------------
  const $ = (id) => document.getElementById(id);

  const chatWindow = $('chatWindow');
  const messagesEl = $('messages');
  const welcomeScreen = $('welcomeScreen');
  const messageInput = $('messageInput');
  const sendBtn = $('sendBtn');
  const newChatBtn = $('newChatBtn');
  const clearChatBtn = $('clearChatBtn');
  const themeToggleBtn = $('themeToggleBtn');
  const themeLabel = $('themeLabel');
  const sidebar = $('sidebar');
  const sidebarOverlay = $('sidebarOverlay');
  const openSidebarBtn = $('openSidebarBtn');
  const closeSidebarBtn = $('closeSidebarBtn');
  const topicList = $('topicList');
  const toastContainer = $('toastContainer');

  // ---------------------------------------------------------------------
  // Session (in-memory conversation identity, persisted per browser tab)
  // ---------------------------------------------------------------------
  function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  }

  function newSession() {
    const id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  }

  let sessionId = getSessionId();

  // ---------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------
  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    themeLabel.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    const hljsTheme = $('hljs-theme');
    hljsTheme.href =
      theme === 'dark'
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css';
    localStorage.setItem(THEME_KEY, theme);
  }

  function initTheme() {
    // Default to dark mode (matches the design's primary aesthetic);
    // respect any previously saved user preference.
    const saved = localStorage.getItem(THEME_KEY);
    applyTheme(saved || 'dark');
  }

  themeToggleBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  // ---------------------------------------------------------------------
  // Sidebar (mobile)
  // ---------------------------------------------------------------------
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
  }
  openSidebarBtn.addEventListener('click', openSidebar);
  closeSidebarBtn.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);

  // ---------------------------------------------------------------------
  // Toast notifications (errors)
  // ---------------------------------------------------------------------
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }

  // ---------------------------------------------------------------------
  // Markdown + code rendering
  // ---------------------------------------------------------------------
  marked.setOptions({
    breaks: true,
    gfm: true,
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Renders AI markdown text into safe HTML, wraps code fences in a
   * custom block with a language label + copy button, then applies
   * highlight.js syntax highlighting.
   */
  function renderMarkdown(rawText, targetEl) {
    const html = marked.parse(rawText);
    targetEl.innerHTML = html;

    // Wrap every <pre><code> in our styled code-block component.
    targetEl.querySelectorAll('pre').forEach((pre) => {
      const codeEl = pre.querySelector('code');
      if (!codeEl) return;

      const langMatch = (codeEl.className || '').match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : 'text';

      const wrapper = document.createElement('div');
      wrapper.className = 'code-block';

      const header = document.createElement('div');
      header.className = 'code-block__header';
      header.innerHTML = `<span>${escapeHtml(lang)}</span>`;

      const copyBtn = document.createElement('button');
      copyBtn.className = 'copy-btn';
      copyBtn.type = 'button';
      copyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" stroke-width="2"/></svg><span>Copy</span>`;
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(codeEl.textContent).then(() => {
          copyBtn.classList.add('copied');
          copyBtn.querySelector('span').textContent = 'Copied!';
          setTimeout(() => {
            copyBtn.classList.remove('copied');
            copyBtn.querySelector('span').textContent = 'Copy';
          }, 1800);
        });
      });
      header.appendChild(copyBtn);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);

      try {
        hljs.highlightElement(codeEl);
      } catch (e) {
        /* ignore highlight errors on unknown languages */
      }
    });
  }

  // ---------------------------------------------------------------------
  // Message rendering
  // ---------------------------------------------------------------------
  function hideWelcome() {
    if (welcomeScreen && welcomeScreen.parentNode) {
      welcomeScreen.style.display = 'none';
    }
  }

  function scrollToBottom() {
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  function addUserMessage(text) {
    hideWelcome();
    const msg = document.createElement('div');
    msg.className = 'msg msg--user';
    msg.innerHTML = `
      <div class="msg__avatar">U</div>
      <div class="msg__body">
        <div class="msg__role">You</div>
        <div class="msg__content"></div>
      </div>`;
    msg.querySelector('.msg__content').textContent = text;
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  function addTypingIndicator() {
    hideWelcome();
    const msg = document.createElement('div');
    msg.className = 'msg msg--ai';
    msg.id = 'typingIndicator';
    msg.innerHTML = `
      <div class="msg__avatar">AI</div>
      <div class="msg__body">
        <div class="msg__role">DSA Mentor</div>
        <div class="msg__content">
          <div class="typing"><span></span><span></span><span></span></div>
        </div>
      </div>`;
    messagesEl.appendChild(msg);
    scrollToBottom();
    return msg;
  }

  function addAiMessage(text) {
    hideWelcome();
    const msg = document.createElement('div');
    msg.className = 'msg msg--ai';
    msg.innerHTML = `
      <div class="msg__avatar">AI</div>
      <div class="msg__body">
        <div class="msg__role">DSA Mentor</div>
        <div class="msg__content"></div>
      </div>`;
    messagesEl.appendChild(msg);
    renderMarkdown(text, msg.querySelector('.msg__content'));
    scrollToBottom();
  }

  function addErrorMessage(text) {
    hideWelcome();
    const msg = document.createElement('div');
    msg.className = 'msg msg--ai msg--error';
    msg.innerHTML = `
      <div class="msg__avatar">!</div>
      <div class="msg__body">
        <div class="msg__role">Error</div>
        <div class="msg__content"></div>
      </div>`;
    msg.querySelector('.msg__content').textContent = text;
    messagesEl.appendChild(msg);
    scrollToBottom();
  }

  // ---------------------------------------------------------------------
  // API calls
  // ---------------------------------------------------------------------
  async function sendMessageToApi(message) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, sessionId }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      return data.reply;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error('The request took too long and was cancelled. Please try again.');
      }
      if (err instanceof TypeError) {
        throw new Error('Network error — is the backend server running and reachable?');
      }
      throw err;
    }
  }

  async function clearServerHistory() {
    try {
      await fetch(`${API_BASE}/clear-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
    } catch (e) {
      /* non-fatal */
    }
  }

  // ---------------------------------------------------------------------
  // Send flow
  // ---------------------------------------------------------------------
  let isSending = false;

  async function handleSend() {
    const text = messageInput.value.trim();
    if (!text || isSending) return;

    isSending = true;
    sendBtn.disabled = true;
    messageInput.value = '';
    autoResize();

    addUserMessage(text);
    const typingEl = addTypingIndicator();

    try {
      const reply = await sendMessageToApi(text);
      typingEl.remove();
      addAiMessage(reply);
    } catch (err) {
      typingEl.remove();
      addErrorMessage(err.message || 'Something went wrong. Please try again.');
      showToast(err.message || 'Something went wrong.');
    } finally {
      isSending = false;
      sendBtn.disabled = false;
      messageInput.focus();
    }
  }

  sendBtn.addEventListener('click', handleSend);

  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  function autoResize() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 200) + 'px';
  }
  messageInput.addEventListener('input', autoResize);

  // ---------------------------------------------------------------------
  // New chat / clear chat
  // ---------------------------------------------------------------------
  function resetConversationUI() {
    messagesEl.innerHTML = '';
    welcomeScreen.style.display = '';
  }

  newChatBtn.addEventListener('click', async () => {
    await clearServerHistory();
    sessionId = newSession();
    resetConversationUI();
    closeSidebar();
  });

  clearChatBtn.addEventListener('click', async () => {
    await clearServerHistory();
    resetConversationUI();
    closeSidebar();
  });

  // ---------------------------------------------------------------------
  // Topic chips & suggestion cards -> prefill + send
  // ---------------------------------------------------------------------
  function wirePromptButtons(container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-prompt]');
      if (!btn) return;
      messageInput.value = btn.dataset.prompt;
      autoResize();
      handleSend();
      closeSidebar();
    });
  }
  wirePromptButtons(topicList);
  wirePromptButtons(welcomeScreen);

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  initTheme();
  messageInput.focus();
})();
