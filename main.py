
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

app = FastAPI(title="AI Video Generator API", version="1.0")

# السماح للواجهة الأمامية (Frontend) بالاتصال بالخلفية
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # يمكنك تحديد النطاق الخاص بك لاحقاً للأمان
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# إنشاء مجلد لحفظ الملفات المرفوعة مؤقتاً
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "مرحباً بك في خلفية نظام توليد الفيديوهات بالذكاء الاصطناعي يعمل بنجاح! 🚀"}

@app.post("/upload/")
async def upload_media(file: UploadFile = File(...)):
    try:
        # مسار حفظ الملف
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        # حفظ الملف المرفوع في الخادم
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # [ملاحظة]: هنا لاحقاً سنقوم بإرسال مسار `file_path` إلى نموذج الذكاء الاصطناعي (مثل Stable Video Diffusion أو API خارجي)
        
        return {
            "success": True,
            "message": "تم رفع الملف ومعالجته مبدئياً بنجاح!",
            "filename": file.filename,
            "saved_path": file_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
