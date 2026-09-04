const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const promptText = document.getElementById('promptText');
const sendBtn = document.getElementById('sendBtn');

// مفتاح الـ API الخاص بـ Gemini الذي قمت بتوفيره
const API_KEY = "AQ.Ab8RN6Iv0ZTHH10fA-CNBTSL_mJmEHU2jQ9Y_FI69aMIL7MHHw"; 

// استخدام نموذج gemini-1.5-flash الأسرع والأكثر كفاءة للدردشة
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = promptText.value.trim();
    if (!text) return;

    // 1. عرض رسالة المستخدم في واجهة الشات
    appendUserMessage(text);
    promptText.value = '';
    sendBtn.disabled = true;

    // 2. إظهار مؤشر التحميل (جارٍ التفكير...)
    const loadingId = appendLoadingMessage();

    try {
        // 3. إرسال الطلب عبر الـ API إلى سيرفرات جوجل السحابية
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: text }]
                }]
            })
        });

        const data = await response.json();
        removeMessage(loadingId);

        if (response.ok && data.candidates && data.candidates[0].content) {
            const aiReply = data.candidates[0].content.parts[0].text;
            appendAIMessage(aiReply);
        } else {
            const errorMsg = data.error ? data.error.message : "حدث خطأ غير متوقع من الخدمة السحابية.";
            appendAIMessageError(errorMsg);
        }
    } catch (err) {
        removeMessage(loadingId);
        appendAIMessageError("فشل الاتصال بالإنترنت أو بالخدمة السحابية.");
    } finally {
        sendBtn.disabled = false;
    }
});

function appendUserMessage(text) {
    const html = `
        <div class="flex items-start gap-3 justify-end">
            <div class="bg-indigo-600 text-white rounded-2xl rounded-tl-none p-4 max-w-lg shadow-sm text-sm leading-relaxed">
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
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
                AI
            </div>
            <div class="bg-[#1e1e1e] border border-zinc-800 rounded-2xl rounded-tr-none p-4 shadow-sm text-sm text-zinc-400 flex items-center gap-2">
                <span class="w-2 h-2 bg-indigo-500 rounded-full animate-ping"></span>
                <span>جاري معالجة الرد عبر السحابة الذكية...</span>
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
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
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
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
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
