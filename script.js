const chatContainer = document.getElementById('chatContainer');
const chatForm = document.getElementById('chatForm');
const mediaFile = document.getElementById('mediaFile');
const promptText = document.getElementById('promptText');
const filePreviewContainer = document.getElementById('filePreviewContainer');
const previewFileName = document.getElementById('previewFileName');
const removeFileBtn = document.getElementById('removeFileBtn');
const sendBtn = document.getElementById('sendBtn');
const durationSelect = document.getElementById('durationSelect');

// تم تحديث الرابط هنا ليقود مباشرة إلى سيرفرك المحلي عبر ngrok
const SERVER_URL = "https://candle-purifier-prevent.ngrok-free.dev";
let selectedFile = null;

// إدارة الملف المرفق
mediaFile.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        previewFileName.textContent = selectedFile.name;
        filePreviewContainer.classList.remove('hidden');
        filePreviewContainer.classList.add('flex');
    }
});

removeFileBtn.addEventListener('click', () => {
    selectedFile = null;
    mediaFile.value = '';
    filePreviewContainer.classList.remove('flex');
    filePreviewContainer.classList.add('hidden');
});

// إرسال الرسالة والطلب
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = promptText.value.trim();
    if (!text && !selectedFile) return;

    // إضافة رسالة المستخدم في الشات
    appendUserMessage(text, selectedFile);

    const currentFile = selectedFile;
    const currentPrompt = text;
    const currentDuration = durationSelect.value;

    // إعادة تعيين الحقول
    promptText.value = '';
    selectedFile = null;
    mediaFile.value = '';
    filePreviewContainer.classList.remove('flex');
    filePreviewContainer.classList.add('hidden');
    sendBtn.disabled = true;

    // إضافة رسالة "جارٍ المعالجة بواسطة كارت الشاشة المحلي..."
    const loadingId = appendLoadingMessage();

    const formData = new FormData();
    if (currentFile) formData.append("file", currentFile);
    formData.append("prompt", currentPrompt || "معالجة وتحريك الوسائط");
    formData.append("duration", currentDuration);

    try {
        const response = await fetch(`${SERVER_URL}/upload/`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        removeMessage(loadingId);

        if (response.ok) {
            const fullDownloadUrl = SERVER_URL + data.download_url;
            
            // جلب الفيديو كـ Blob لضمان سلاسة العرض
            const videoRes = await fetch(fullDownloadUrl);
            const videoBlob = await videoRes.blob();
            const videoUrl = URL.createObjectURL(videoBlob);

            appendAIMessageWithVideo(videoUrl, data.filename);
        } else {
            appendAIMessageError(data.detail || "حدث خطأ أثناء المعالجة.");
        }
    } catch (err) {
        removeMessage(loadingId);
        appendAIMessageError("فشل الاتصال بالسيرفر المحلي. تأكد من أن ملف main.py و ngrok يعملان.");
    } finally {
        sendBtn.disabled = false;
    }
});

function appendUserMessage(text, file) {
    let fileHtml = '';
    if (file) {
        fileHtml = `<div class="text-xs text-indigo-300 mb-1">📎 مرفق: ${file.name}</div>`;
    }
    const html = `
        <div class="flex items-start gap-3 justify-end">
            <div class="bg-indigo-600 text-white rounded-2xl rounded-tl-none p-4 max-w-lg shadow-sm text-sm leading-relaxed">
                ${fileHtml}
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
                <span>جاري معالجة الصورة وتحريك العناصر عبر كارت الشاشة المحلي...</span>
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

function appendAIMessageWithVideo(videoUrl, filename) {
    const html = `
        <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-sm font-bold text-white">
                AI
            </div>
            <div class="bg-[#1e1e1e] border border-zinc-800 rounded-2xl rounded-tr-none p-4 max-w-sm sm:max-w-md shadow-sm space-y-3">
                <p class="text-sm text-zinc-200 font-medium">✨ تم تنفيذ الحركة وتحتوي على النتيجة:</p>
                <video controls autoplay class="w-full rounded-xl border border-zinc-700 shadow-md">
                    <source src="${videoUrl}" type="video/mp4">
                    متصفحك لا يدعم تشغيل الفيديو.
                </video>
                <a href="${videoUrl}" download="${filename}" class="block text-center bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-xl text-xs transition shadow">
                    تحميل الفيديو (MP4) 📥
                </a>
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
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}
