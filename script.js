const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const promptText = document.getElementById('promptText');
const sendBtn = document.getElementById('sendBtn');

// مفتاح Groq API الخاص بك
const API_KEY = "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"; 

// نقطة الاتصال الخاصة بـ Groq ونموذج llama-3.3-70b-versatile السريع والذكي
const API_URL = "https://api.groq.com/openai/v1/chat/completions";

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = promptText.value.trim();
    if (!text) return;

    appendUserMessage(text);
    promptText.value = '';
    sendBtn.disabled = true;

    const loadingId = appendLoadingMessage();

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "user", content: text }
                ]
            })
        });

        const data = await response.json();
        removeMessage(loadingId);

        if (response.ok && data.choices && data.choices[0].message) {
            const aiReply = data.choices[0].message.content;
            appendAIMessage(aiReply);
        } else {
            const errorMsg = data.error ? data.error.message : "حدث خطأ غير متوقع من خدمة Groq.";
            appendAIMessageError(errorMsg);
        }
    } catch (err) {
        removeMessage(loadingId);
        appendAIMessageError("فشل الاتصال بالإنترنت أو بخدمة Groq السحابية.");
    } finally {
        sendBtn.disabled = false;
    }
});

function appendUserMessage(text) {
    const html = `
        <div class="flex items-start gap-3 justify-end">
            <div class="bg-orange-600 text-white rounded-2xl rounded-tl-none p-4 max-w-lg shadow-sm text-sm leading-relaxed">
                <div>${escapeHtml(text)}</div>
            </div>
            <div class="w-8 h-8 rounded-full bg-zinc-700 flex-shrink-0 flex items-center justify-center text-sm font-bold text-zinc-200">
                أنت
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function appendLoadingMessage() {
    const id = 'loading-' + Date.now();
    const html = `
        <div id="${id}" class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
                AI
            </div>
            <div class="bg-[#1e1e1e] border border-zinc-800 rounded-2xl rounded-tr-none p-4 shadow-sm text-sm text-zinc-400 flex items-center gap-2">
                <span class="w-2 h-2 bg-orange-500 rounded-full animate-ping"></span>
                <span>جاري معالجة الرد بسرعة البرق...</span>
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function appendAIMessage(text) {
    const html = `
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
                AI
            </div>
            <div class="bg-[#1e1e1e] border border-zinc-800 rounded-2xl rounded-tr-none p-4 max-w-lg shadow-sm text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                ${escapeHtml(text)}
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function appendAIMessageError(errorMsg) {
    const html = `
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
                AI
            </div>
            <div class="bg-red-950/40 border border-red-900/50 rounded-2xl rounded-tr-none p-4 text-sm text-red-300">
                ❌ خطأ: ${escapeHtml(errorMsg)}
            </div>
        </div>
    `;
    chatContainer.insertAdjacentHTML('beforeend', html);
    scrollToBottom();
}

function scrollToBottom() {
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
