import cv2
import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# تفعيل الـ CORS ليسمح لموقعك على GitHub بالاتصال بالسيرفر
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload/")
async def upload_media(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    duration: int = Form(5)
):
    try:
        # حفظ الملف المرفوع
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        output_filename = f"processed_{file.filename.split('.')[0]}.mp4"
        output_path = os.path.join(UPLOAD_DIR, output_filename)

        # التحقق مما إذا كان الملف المرفوع عبارة عن فيديو أو صورة
        is_video = file.content_type.startswith("video/")

        if is_video:
            # معالجة الفيديو باستخدام OpenCV
            cap = cv2.VideoCapture(file_path)
            fps = int(cap.get(cv2.CAP_PROP_FPS)) or 30
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                
                # تطبيق تأثير بناءً على الوصف العربي (مثلاً كتابة النص على الفيديو أو تعديل الألوان)
                if prompt:
                    # إضافة الوصف العربي كمرجع مرئي على إطارات الفيديو للتأكد من تفاعل النظام مع الوصف
                    cv2.putText(frame, f"AI: {prompt[:30]}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

                out.write(frame)

            cap.release()
            out.release()
        else:
            # إذا كانت صورة، قم بتحويلها إلى فيديو قصير مع تحريك أو كتابة الوصف العربي عليها
            fps = 30
            width, height = 640, 480
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            img = cv2.imread(file_path)
            if img is not None:
                img = cv2.resize(img, (width, height))
                total_frames = duration * fps
                for _ in range(total_frames):
                    frame = img.copy()
                    # كتابة الوصف العربي على الفيديو الناتج من الصورة
                    cv2.putText(frame, "AI Video Generation", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
                    out.write(frame)
            out.release()

        return {
            "download_url": f"/download/{output_filename}",
            "filename": output_filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="video/mp4", filename=filename)
    raise HTTPException(status_code=404, detail="الملف غير موجود")
