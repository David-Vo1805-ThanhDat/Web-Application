/* FoodBot: a self-contained widget; conversation history stays in this tab. */
(function () {
  'use strict';

  const panel = document.getElementById('chatbot-panel');
  const launcher = document.getElementById('chatbot-launcher');
  if (!panel || !launcher) return;

  const close = document.getElementById('chatbot-close');
  const messages = document.getElementById('chatbot-messages');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const send = document.getElementById('chatbot-send');
  const status = document.getElementById('chatbot-status');
  const endpoint = new URL('../../backend/api/chat/index.php', document.baseURI);
  // FoodBot chỉ trò chuyện với người ĐÃ ĐĂNG NHẬP (server backend/api/chat trả 403 cho khách).
  // Khách vẫn mở khung và gõ được, nhưng FoodBot không gọi AI mà đáp bằng lời mời tạo tài khoản bên dưới.
  const GREETING = 'hôm nay ăn gì';   // câu tự gửi khi người đã đăng nhập mở khung lần đầu
  const GUEST_HELLO = 'Hí lô! Mình là FoodBot 🍜, chuyên gia giải cứu câu hỏi "hôm nay ăn gì" đây. ' +
    'Có điều mình hơi nhát người lạ xíu 🙈 Bạn tạo tài khoản (chưa tới 1 phút) là mình mở lòng tư vấn liền nha!';
  const GUEST_REPLIES = [
    'Ơ kìa, mình còn chưa biết tên bạn mà bạn đã rủ mình đi ăn rồi 🙈 Tạo tài khoản cho mình làm quen cái đã, rồi mình mách món ngon cho nè!',
    'Mẹ mình dặn không được nói chuyện với người lạ đâu 🥺 Bạn đăng ký một cái là hết lạ liền, tụi mình tám chuyện ăn uống tới bến luôn!',
    'Bụng mình đang réo đòi tư vấn cho bạn lắm rồi nè 🤤 Mà phải có tài khoản mình mới mở được "thực đơn bí mật". Đăng nhập lẹ lẹ nha!',
    'Món ngon thì nhiều vô số kể, mà vé vào cửa chỉ là một tài khoản miễn phí thôi 🎟️ Tạo xong là mình phục vụ tận răng luôn!',
    'Mình là bot có nguyên tắc nha 😤: chưa đăng nhập là chưa tiết lộ món ngon. Nhưng mà đăng nhập rồi thì... hỏi gì mình cũng chiều 😋',
  ];
  let history = [];
  let busy = false;
  let greeted = false;
  let guestReplyIndex = 0;

  function isGuest() { return !window.APP_USER; }

  // Tin nhắn mời đăng nhập/tạo tài khoản kèm 2 nút; đăng nhập xong quay lại đúng trang đang xem.
  function showLoginPrompt(message, line) {
    const next = location.pathname.split('/').pop() + location.search;
    const text = document.createElement('p');
    text.className = 'chatbot-login-text';
    text.textContent = line || GUEST_REPLIES[0];
    const actions = document.createElement('div');
    actions.className = 'chatbot-login-actions';
    const login = document.createElement('a');
    login.className = 'chatbot-login-btn';
    login.href = 'dang-nhap.html?next=' + encodeURIComponent(next || 'trang-chu.html');
    login.textContent = 'Đăng nhập';
    const register = document.createElement('a');
    register.className = 'chatbot-login-btn chatbot-login-btn--ghost';
    register.href = 'dang-ky.html';
    register.textContent = 'Tạo tài khoản';
    actions.append(login, register);
    message.replaceChildren(text, actions);
    status.textContent = 'FoodBot mời bạn đăng nhập hoặc tạo tài khoản để trò chuyện.';
    scrollToLatest();
  }

  // Câu mời tiếp theo (xoay vòng để không lặp lại đúng một câu)
  function nextGuestReply() {
    const line = GUEST_REPLIES[guestReplyIndex % GUEST_REPLIES.length];
    guestReplyIndex += 1;
    return line;
  }

  function scrollToLatest() {
    messages.scrollTop = messages.scrollHeight;
  }

  function setOpen(open) {
    panel.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      input.focus({ preventScroll: true });
      if (!greeted) {
        greeted = true;
        if (isGuest()) showLoginPrompt(appendMessage('', 'bot'), GUEST_HELLO);   // khách: chào + mời, không gọi AI
        else requestReply(GREETING, true);
      }
    } else {
      launcher.focus({ preventScroll: true });
    }
  }

  // Build text, emphasis and http(s) links as DOM nodes, never as HTML.
  function renderReply(element, text) {
    const fragment = document.createDocumentFragment();
    const tokens = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>]+)|\*\*([^*]+)\*\*/g;
    let offset = 0;
    let match;
    while ((match = tokens.exec(text))) {
      fragment.append(document.createTextNode(text.slice(offset, match.index)));
      if (match[4]) {
        const strong = document.createElement('strong');
        strong.textContent = match[4];
        fragment.append(strong);
      } else {
        const rawUrl = match[2] || match[3];
        const urlText = match[2] ? rawUrl : rawUrl.replace(/[.,!?;:)]+$/, '');
        try {
          const url = new URL(urlText);
          if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid link');
          const link = document.createElement('a');
          link.href = url.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.textContent = match[1] || urlText;
          fragment.append(link);
          if (!match[2]) fragment.append(document.createTextNode(rawUrl.slice(urlText.length)));
        } catch (_) {
          fragment.append(document.createTextNode(match[0]));
        }
      }
      offset = tokens.lastIndex;
    }
    fragment.append(document.createTextNode(text.slice(offset)));
    element.replaceChildren(fragment);
  }

  function appendMessage(text, role) {
    const message = document.createElement('div');
    message.className = 'chatbot-message chatbot-message--' + role;
    message.setAttribute('aria-label', role === 'user' ? 'Bạn' : 'FoodBot');
    message.textContent = text;
    messages.append(message);
    scrollToLatest();
    return message;
  }

  function showTyping(message) {
    const indicator = document.createElement('span');
    indicator.className = 'chatbot-typing';
    indicator.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 3; i += 1) indicator.append(document.createElement('span'));
    message.replaceChildren(indicator);
  }

  async function readReply(response, message) {
    if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream')) {
      throw new Error('Unexpected response');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';
    let completed = false;

    function consumeEvent(block) {
      let type = 'message';
      const data = [];
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) type = line.slice(6).trim();
        if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
      }
      if (!data.length) return;
      const payload = JSON.parse(data.join('\n'));
      if (type === 'error') throw new Error('Reply interrupted');
      if (type === 'done') {
        completed = true;
        return;
      }
      if (typeof payload.text === 'string') {
        fullText += payload.text;
        renderReply(message, fullText);
        scrollToLatest();
      }
    }

    try {
      while (!completed) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        buffer = buffer.replace(/\r\n/g, '\n');
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          consumeEvent(block);
          if (completed) break;
        }
        if (done) break;
      }
    } finally {
      await reader.cancel().catch(function () {});
      reader.releaseLock();
    }
    if (!completed || !fullText.trim()) throw new Error('Incomplete reply');
    return fullText;
  }

  async function requestReply(text, isGreeting, retryMessage) {
    if (busy) return;
    busy = true;
    send.disabled = true;
    messages.setAttribute('aria-busy', 'true');
    status.textContent = 'FoodBot đang trả lời…';
    // A new turn supersedes retry controls from an older failed request.
    messages.querySelectorAll('.chatbot-retry').forEach(function (button) { button.remove(); });
    if (!isGreeting && !retryMessage) appendMessage(text, 'user');
    const reply = retryMessage || appendMessage('', 'bot');
    showTyping(reply);
    scrollToLatest();

    const turn = { role: 'user', parts: [{ text: text }] };
    const requestHistory = history.slice(-24).concat(turn);
    const encoder = new TextEncoder();
    // Keep complete pairs and leave room for the current question within API limits.
    while (requestHistory.length > 1 && (
      requestHistory.reduce(function (count, entry) {
        return count + Array.from(entry.parts[0].text).length;
      }, 0) > 18000 || encoder.encode(JSON.stringify({ history: requestHistory })).length > 60000
    )) {
      requestHistory.splice(0, 2);
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(function () { controller.abort(); }, 90000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
        body: JSON.stringify({ history: requestHistory }),
        signal: controller.signal
      });
      if (response.status === 403) {   // chưa đăng nhập hoặc phiên đăng nhập đã hết hạn
        showLoginPrompt(reply, nextGuestReply());
        return;
      }
      if (!response.ok) throw new Error('Chat unavailable');
      const answer = await readReply(response, reply);
      // Commit the pair only once a complete response has arrived.
      history = requestHistory.concat({ role: 'model', parts: [{ text: answer }] });
      status.textContent = 'FoodBot đã trả lời.';
    } catch (_) {
      reply.textContent = 'FoodBot chưa trả lời được lúc này. Bạn thử lại nhé.';
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'chatbot-retry';
      retry.textContent = 'Thử lại';
      retry.addEventListener('click', function () {
        input.focus({ preventScroll: true });
        requestReply(text, isGreeting, reply);
      });
      reply.append(retry);
      status.textContent = 'Chưa nhận được câu trả lời. Bạn có thể thử lại.';
      scrollToLatest();
    } finally {
      window.clearTimeout(timeout);
      busy = false;
      send.disabled = false;
      messages.setAttribute('aria-busy', 'false');
    }
  }

  launcher.addEventListener('click', function () { setOpen(true); });
  close.addEventListener('click', function () { setOpen(false); });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) {
      event.preventDefault();
      setOpen(false);
    }
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const text = input.value.trim();
    if (busy || !text) return;
    input.value = '';
    if (isGuest()) {   // khách: FoodBot đáp bằng lời mời tạo tài khoản, không gọi server/AI
      appendMessage(text, 'user');
      showLoginPrompt(appendMessage('', 'bot'), nextGuestReply());
      input.focus({ preventScroll: true });
      return;
    }
    requestReply(text, false);
    input.focus({ preventScroll: true });
  });
})();
