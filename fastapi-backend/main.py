from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import time

from scoring import calculate_energy_sink_score
from auth import create_access_token, get_password_hash, verify_password
from mail_service import send_otp_email, generate_otp, analyze_email_signals

# OTP Storage (In-memory for demo)
otp_db = {} # {email: {"otp": str, "expiry": int}}

# Try to import ML, use a simple fallback if libraries are missing
try:
    from ml_engine import predict_authenticity, predict_ghost_job_likelihood
except ImportError:
    print("Warning: ML libraries not found. Using fallbacks.")
    def predict_authenticity(text: str) -> float: return 85.0
    def predict_ghost_job_likelihood(d, h): return {"ghost_likelihood": 10.0}

app = FastAPI(title="JobZoid AI", description="AI/ML powered Applicant Energy Sink Detector")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock DB
jobs_db = [
    {"id": 1, "title": "Senior Frontend Developer", "company_name": "ABC Corp", "score": 72, "status": "Ghosted"},
    {"id": 2, "title": "Product Designer", "company_name": "Meta", "score": 18, "status": "Active"},
    {"id": 3, "title": "Staff Engineer", "company_name": "Stripe", "score": 42, "status": "Slow"},
]

# Models
class UserAuth(BaseModel):
    email: str
    password: str

class OTPRequest(BaseModel):
    email: str

class OTPVerify(BaseModel):
    email: str
    otp: str

class ResetPasswordRequest(BaseModel):
    email: str

class ResetPasswordFinal(BaseModel):
    email: str
    otp: str
    new_password: str

class TrackSignal(BaseModel):
    type: str # ATS_SUBMISSION, INTERVIEW_REDIRECT, STATUS_CHANGE
    payload: dict
    user_id: Optional[int] = 1

class EffortMetrics(BaseModel):
    time_spent: float
    fields_filled: int
    ats_redirects: int
    uploads: int

class JobAnalysisRequest(BaseModel):
    title: str
    description: str
    company: str

class MailAnalysisRequest(BaseModel):
    headers: List[dict]

# Endpoints
@app.get("/")
async def root():
    return {"status": "JobZoid Backend Active", "engine": "FastAPI/Python"}

@app.post("/api/auth/request-otp")
async def request_otp(req: OTPRequest):
    otp = generate_otp()
    otp_db[req.email] = {"otp": otp, "expiry": int(time.time()) + 600}
    success = send_otp_email(req.email, otp)
    if success:
        return {"status": "success", "message": "OTP sent to email"}
    else:
        raise HTTPException(status_code=500, detail="Failed to send email. Check SMTP config.")

@app.post("/api/auth/verify-otp")
async def verify_otp(req: OTPVerify):
    data = otp_db.get(req.email)
    if not data:
        raise HTTPException(status_code=400, detail="No OTP requested for this email")
    
    if int(time.time()) > data["expiry"]:
        raise HTTPException(status_code=400, detail="OTP expired")
    
    if req.otp != data["otp"]:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Generate token
    access_token = create_access_token(data={"sub": req.email})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "name": req.email.split('@')[0], 
            "email": req.email,
            "isEmailVerified": True,
            "isOnboarded": False
        }
    }

@app.post("/api/auth/forgot-password")
async def forgot_password(req: ResetPasswordRequest):
    otp = generate_otp()
    otp_db[req.email] = {"otp": otp, "expiry": int(time.time()) + 600}
    success = send_otp_email(req.email, otp)
    if success:
        return {"status": "success", "message": "Reset OTP sent"}
    raise HTTPException(status_code=500, detail="Mail delivery failed")

@app.post("/api/auth/reset-password")
async def reset_password(req: ResetPasswordFinal):
    data = otp_db.get(req.email)
    if not data or data["otp"] != req.otp:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    # In a real app, update DB here
    return {"status": "success", "message": "Password updated successfully"}

@app.post("/api/auth/login")
async def login(auth: UserAuth):
    if auth.email == "alex@example.com" and auth.password == "password":
        access_token = create_access_token(data={"sub": auth.email})
        return {"access_token": access_token, "token_type": "bearer", "user": {"name": "Alex Rivera", "email": auth.email}}
    raise HTTPException(status_code=400, detail="Incorrect email or password")

@app.post("/api/analyze")
async def analyze_job(job: JobAnalysisRequest):
    authenticity_score = predict_authenticity(f"{job.title} {job.description}")
    
    # Mock company history
    history = {"avg_sink_score": 35.5}
    ghost_pred = predict_ghost_job_likelihood({"description": job.description}, history)
    
    # Mock effort (initial state)
    effort = {"time_spent": 15, "fields_filled": 10, "ats_redirects": 1, "uploads": 1}
    sink_result = calculate_energy_sink_score(effort, [])
    
    return {
        "company": job.company,
        "ai_authenticity_score": authenticity_score,
        "energy_sink_score": sink_result["score"],
        "ghost_likelihood": ghost_pred["ghost_likelihood"],
        "is_ghost_listing": ghost_pred["is_ghost_listing"],
        "recommendation": sink_result["recommendation"],
        "needs_alert": sink_result["alert"]
    }

@app.get("/api/dashboard")
async def get_dashboard():
    enhanced_jobs = []
    for j in jobs_db:
        j_copy = j.copy()
        j_copy["ai_score"] = predict_authenticity(f"{j['title']} at {j['company_name']}")
        enhanced_jobs.append(j_copy)
    return enhanced_jobs

@app.post("/api/signals")
async def receive_signal(signal: TrackSignal):
    print(f"Received Signal: {signal.type} from {signal.payload.get('platform')}")
    return {"status": "captured", "timestamp": int(time.time())}

@app.get("/api/scores/{job_id}")
async def get_score(job_id: int):
    # SQL Implementation Example (Commented):
    # SELECT (SUM(e.value * weight) / MAX(1, COUNT(s.id))) FROM effort_logs e...
    
    effort = {"time_spent": 45, "fields_filled": 20, "ats_redirects": 2, "uploads": 2}
    responses = [{"type": "ACK"}]
    result = calculate_energy_sink_score(effort, responses)
    return {
        "job_id": job_id,
        "score": result["score"],
        "recommendation": result["recommendation"],
        "alert": result["alert"]
    }

@app.post("/api/mail/analyze")
async def analyze_mail(req: MailAnalysisRequest):
    signals = analyze_email_signals(req.headers)
    return {
        "status": "success",
        "signal_count": len(signals),
        "signals": signals
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
