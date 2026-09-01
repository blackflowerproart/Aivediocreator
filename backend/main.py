from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import cv2
import numpy as np

app = FastAPI(title="AI Video Generator API", version="1.2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "خادم معالجة وتوليد الفيديوهات يعمل بنجاح! 🚀"}

@app.post("/upload/")
async def upload_media(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    duration: int = Form(...)
):
    try:
        input_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # إنشاء اسم فيديو الناتج بصيغة MP4
        output_filename = f"ai_video_{os.path.splitext(file.filename)[0]}.mp4"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # محاكاة عملية معالجة الذكاء الاصطناعي وإنشاء فيديو MP4 حقيقي
        # (في المستقبل هنا تضع كود نموذج الذكاء الاصطناعي الحقيقي مثل Stable Video Diffusion)
        fps = 24
        frame_count = duration * fps
        width, height = 640, 640
        
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
        
        # قراءة الصورة أو الفيديو المرفوع كخلفية أولية للمعالجة
        img = cv2.imread(input_path)
        if img is None:
            # لو كان المرفوع فيديو، نأخذ الإطار الأول منه كبديل مؤقت للتوضيح
            cap = cv2.VideoCapture(input_path)
            ret, img = cap.read()
            cap.release()
            if img is None:
                img = np.zeros((height, width, 3), dtype=np.uint8)

        img = cv2.resize(img, (width, height))
        
        # رسم تأثيرات بصرية مبسطة تدل على عمل الذكاء الاصطناعي وتوليد الإطارات
        for i in range(frame_count):
            frame = img.copy()
            # إضافة حركة بسيطة وتأثير نصي للوصف
            cv2.putText(frame, f"AI Prompt: {prompt[:20]}...", (30, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
            cv2.putText(frame, f"Frame: {i+1}/{frame_count}", (30, height - 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
            out.write(frame)
            
        out.release()
        
        # رابط تحميل الملف المباشر
        download_url = f"/download/{output_filename}"

        return {
            "success": True,
            "message": "تم معالجة الفيديو بنجاح!",
            "filename": output_filename,
            "download_url": download_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="video/mp4", filename=filename)
    raise HTTPException(status_code=404, detail="الملف غير موجود")
