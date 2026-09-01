// ملف script.js منفصل بالكامل
const fileInput = document.getElementById('mediaFile');
const fileNameSpan = document.getElementById('fileName');
const uploadForm = document.getElementById('uploadForm');
const resultSection = document.getElementById('resultSection');
const statusText = document.getElementById('statusText');
const submitBtn = document.getElementById('submitBtn');
const progressBar = document.getElementById('progressBar');
const progressPercent = document.getElementById('progressPercent');
const timeRemaining = document.getElementById('timeRemaining');

// الرابط المباشر والسليم تماماً لسيرفر Render بدون أي خطأ أو متغير مفقود
const SERVER_URL = "https://aivedio-backend.onrender.com";

// عرض اسم الملف عند اختياره
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        fileNameSpan.textContent = `الملف المختار: ${e.target.files[0].name}`;
    }
});

// التعامل مع إرسال النموذج ومعالجة الطلب
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput.files.length) return;

    const file = fileInput.files[0];
    const prompt = document.getElementById('promptText').value;
    const duration = document.getElementById('durationSelect').value;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("prompt", prompt);
    formData.append("duration", duration);

    resultSection.classList.remove('hidden');
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
    statusText.innerHTML = '';

    // محاكاة شريط التقدم بناءً على المدة المحددة
    let totalEstimatedTime = parseInt(duration) * 1200; 
    let elapsedTime = 0;
    let intervalTime = 100;

    let progressInterval = setInterval(() => {
        elapsedTime += intervalTime;
        let percent = Math.min(Math.floor((elapsedTime / totalEstimatedTime) * 100), 95);
        
        progressBar.style.width = percent + '%';
        progressPercent.textContent = percent + '%';

        let remainingSeconds = Math.ceil((totalEstimatedTime - elapsedTime) / 1000);
        if (remainingSeconds < 0) remainingSeconds = 0;
        timeRemaining.textContent = `الوقت المقدر المتبقي: ${remainingSeconds} ثانية`;
    }, intervalTime);

    try {
        const response = await fetch(`${SERVER_URL}/upload/`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        progressPercent.textContent = '100%';
        timeRemaining.textContent = 'اكتملت المعالجة بنجاح!';

        if (response.ok) {
            const fullDownloadUrl = SERVER_URL + data.download_url;
            const fullDownloadUrl = "https://aivedio-backend.onrender.com" + data.download_url;
            // جلب ملف الفيديو كـ Blob لضمان تشغيله وتحميله دون إعادة توجيه الصفحة
            const videoResponse = await fetch(fullDownloadUrl);
            const videoBlob = await videoResponse.blob();
            const videoBlobUrl = URL.createObjectURL(videoBlob);

            statusText.innerHTML = `
                <span class="text-green-400 font-bold mb-3 block text-base">✨ أصبح الفيديو جاهزاً بنجاح!</span>
                <video controls autoplay class="w-full rounded-xl mb-4 max-h-72 mx-auto border border-purple-500 shadow-lg">
                    <source src="${videoBlobUrl}" type="video/mp4">
                    متصفحك لا يدعم عرض الفيديو.
                </video>
                <button id="downloadBtn" class="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition duration-200 cursor-pointer flex items-center justify-center gap-2">
                    <span>تحميل الفيديو (MP4)</span>
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                </button>
            `;

            document.getElementById('downloadBtn').addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = videoBlobUrl;
                a.download = data.filename || "ai_video.mp4";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            });

        } else {
            throw new Error(data.detail || "حدث خطأ أثناء معالجة الفيديو.");
        }
    } catch (error) {
        clearInterval(progressInterval);
        statusText.innerHTML = `<span class="text-red-400 font-semibold">❌ فشل العملية: ${error.message}</span>`;
        timeRemaining.textContent = 'توقف المعالجة';
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }
});
