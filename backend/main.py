import cv2
import os
import numpy as np
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

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
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())

        output_filename = f"analyzed_motion_{file.filename.split('.')[0]}.mp4"
        output_path = os.path.join(UPLOAD_DIR, output_filename)

        # قراءة الصورة المرفوعة
        img = cv2.imread(file_path)
        if img is None:
            raise HTTPException(status_code=400, detail="فشل قراءة الملف كصورة صالحة.")

        height, width, _ = img.shape
        fps = 30
        total_frames = duration * fps
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        # تحليل صندوق الوصف (Prompt Analysis) باللغة العربية
        prompt_lower = prompt.lower()
        
        # تحديد اتجاه الحركة بناءً على الوصف
        move_direction = "right_to_left" # الافتراضي
        if "من اليسار" in prompt or "يسار ليمين" in prompt or "إلى اليمين" in prompt:
            move_direction = "left_to_right"
        elif "اعسفل" in prompt or "إلى الأسفل" in prompt or "نزول" in prompt:
            move_direction = "top_to_bottom"
        elif "اعلى" in prompt or "إلى الأعلى" in prompt or "صعود" in prompt:
            move_direction = "bottom_to_top"

        # تحديد شكل العنصر المتحرك بناءً على الوصف أو افتراضياً
        object_type = "circle"
        if "مربع" in prompt or "صندوق" in prompt:
            object_type = "square"
        elif "نص" in prompt or "كتابة" in prompt:
            object_type = "text"

        # إحداثيات الحركة الابتدائية
        start_x, end_x = width - 100, 100
        start_y, end_y = height // 2, height // 2

        if move_direction == "left_to_right":
            start_x, end_x = 100, width - 100
        elif move_direction == "top_to_bottom":
            start_y, end_y = 100, height - 100
        elif move_direction == "bottom_to_top":
            start_y, end_y = height - 100, 100

        for i in range(total_frames):
            # نسخ الصورة الأصلية لكل فريم (طبقة الأساس كفوتوشوب)
            frame = img.copy()
            progress = i / total_frames

            # حساب الموقع الحالي للعنصر المتحرك
            curr_x = int(start_x + progress * (end_x - start_x))
            curr_y = int(start_y + progress * (end_y - start_y))

            # رسم العنصر المتحرك فوق الصورة بناءً على التحليل
            if object_type == "circle":
                cv2.circle(frame, (curr_x, curr_y), 40, (0, 255, 255), -1) # دائرة صفراء لامعة
            elif object_type == "square":
                cv2.rectangle(frame, (curr_x - 30, curr_y - 30), (curr_x + 30, curr_y + 30), (255, 0, 0), -1)
            else:
                # رسم مؤشر بصري متحرك يمثل تنفيذ الأمر
                cv2.circle(frame, (curr_x, curr_y), 25, (0, 0, 255), -1)

            # إضافة شريط معلومات يوضح أن الوصف تم تحليله بنجاح
            cv2.putText(frame, f"Task: {prompt[:25]}", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

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
