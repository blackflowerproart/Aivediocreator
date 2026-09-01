from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

app = FastAPI(title="AI Video Generator API", version="1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "الخلفية تعمل بنجاح وجاهزة لاستلام الطلبات مع الوصف والمدة! 🚀"}

@app.post("/upload/")
async def upload_media(
    file: UploadFile = File(...),
    prompt: str = Form(...),
    duration: int = Form(...)
):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # [ملاحظة تخصصية]: هنا يتم تمرير `file_path` و `prompt` و `duration` لنموذج الذكاء الاصطناعي لاحقاً
        
        return {
            "success": True,
            "message": "تم استلام الملف والبيانات بنجاح!",
            "filename": file.filename,
            "prompt": prompt,
            "duration": duration,
            "saved_path": file_path
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
