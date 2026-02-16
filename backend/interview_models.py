"""
Interview Orchestration - Backend Models and Validation
Adds comprehensive interview management to the ATS
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List
from datetime import datetime

# ============ ENHANCED JOB MODELS WITH STRICTER VALIDATION ============

class EnhancedExperienceRange(BaseModel):
    """Experience range with validation: min <= max"""
    min_years: int = Field(ge=0, description="Minimum years of experience")
    max_years: int = Field(ge=0, description="Maximum years of experience")
    
    @field_validator('max_years')
    @classmethod
    def validate_range(cls, max_years, info):
        min_years = info.data.get('min_years', 0)
        if max_years < min_years:
            raise ValueError('max_years must be greater than or equal to min_years')
        return max_years

class EnhancedSalaryRange(BaseModel):
    """CTC range with validation: min <= max"""
    min_amount: Optional[int] = Field(None, ge=0, description="Minimum CTC")
    max_amount: Optional[int] = Field(None, ge=0, description="Maximum CTC")
    currency: str = Field(default="INR", description="Currency code")
    
    @field_validator('max_amount')
    @classmethod
    def validate_range(cls, max_amount, info):
        min_amount = info.data.get('min_amount')
        if max_amount and min_amount and max_amount < min_amount:
            raise ValueError('max_amount must be greater than or equal to min_amount')
        return max_amount

class LocationRequirement(BaseModel):
    """Location with mandatory city for On-site/Hybrid"""
    work_model: Literal["Onsite", "Hybrid", "Remote"]
    city: Optional[str] = None
    
    @field_validator('city')
    @classmethod
    def validate_city(cls, city, info):
        work_model = info.data.get('work_model')
        if work_model in ["Onsite", "Hybrid"] and not city:
            raise ValueError('City is mandatory for Onsite and Hybrid work models')
        return city

# ============ INTERVIEW DOMAIN MODELS ============

class InterviewSlot(BaseModel):
    """Individual time slot for interview"""
    slot_id: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    is_available: bool = True
    
    @field_validator('end_time')
    @classmethod
    def validate_end_time(cls, end_time, info):
        start_time = info.data.get('start_time')
        if end_time <= start_time:
            raise ValueError('end_time must be after start_time')
        return end_time

class InterviewCreate(BaseModel):
    """Create new interview"""
    job_id: str
    candidate_id: str
    interview_mode: Literal["Video", "Phone", "Onsite"]
    interview_duration: int = Field(ge=15, le=240, description="Duration in minutes")
    time_zone: str = Field(default="Asia/Kolkata")
    proposed_slots: List[InterviewSlot] = Field(min_length=1, max_length=5)

class InterviewUpdate(BaseModel):
    """Update interview details"""
    interview_mode: Optional[Literal["Video", "Phone", "Onsite"]] = None
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None
    interview_status: Optional[Literal[
        "Draft",
        "Awaiting Candidate Confirmation",
        "Confirmed",
        "Scheduled",
        "Completed",
        "No Show",
        "Cancelled"
    ]] = None
    no_show_flag: Optional[bool] = None

class InterviewResponse(BaseModel):
    """Interview response model"""
    interview_id: str
    job_id: str
    candidate_id: str
    client_id: str
    interview_mode: str
    interview_duration: int
    scheduled_start_time: Optional[datetime] = None
    scheduled_end_time: Optional[datetime] = None
    time_zone: str
    interview_status: str
    invite_sent: bool
    invite_sent_by: Optional[str] = None
    candidate_confirmation_timestamp: Optional[datetime] = None
    no_show_flag: bool
    no_show_count: int = 0
    proposed_slots: List[InterviewSlot]
    selected_slot_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class CandidateSlotSelection(BaseModel):
    """Candidate selects a slot"""
    slot_id: str
    confirmed: bool = True

class InterviewInvite(BaseModel):
    """Mark interview invite as sent"""
    sent_by: Literal["System", "Client", "Recruiter"]
    meeting_link: Optional[str] = None
    additional_instructions: Optional[str] = None

# ============ REMINDER MODELS ============

class ReminderSchedule(BaseModel):
    """Reminder configuration"""
    interview_id: str
    reminder_type: Literal["email", "whatsapp", "sms"]
    scheduled_time: datetime
    sent: bool = False
    sent_at: Optional[datetime] = None
    delivery_status: Optional[str] = None

class ReminderResponse(BaseModel):
    """Candidate response to reminder"""
    interview_id: str
    candidate_id: str
    response_type: Literal["confirmed", "cannot_attend", "reschedule_request"]
    response_text: Optional[str] = None
    response_timestamp: datetime

# ============ NO-SHOW TRACKING ============

class NoShowRecord(BaseModel):
    """Track candidate no-shows"""
    candidate_id: str
    interview_id: str
    job_id: str
    no_show_date: datetime
    grace_period_minutes: int = 7
    follow_up_sent: bool = False
    candidate_response: Optional[str] = None
    
class CandidateNoShowSummary(BaseModel):
    """Candidate no-show summary"""
    candidate_id: str
    total_no_shows: int
    flagged: bool
    last_no_show_date: Optional[datetime] = None
    interviews_completed: int
    completion_rate: float

# ============ DASHBOARD MODELS ============

class InterviewPipelineStats(BaseModel):
    """Interview pipeline statistics"""
    total_interviews: int
    awaiting_confirmation: int
    confirmed: int
    scheduled: int
    completed: int
    no_shows: int
    at_risk: int  # Reminders sent but no response

class AtRiskInterview(BaseModel):
    """Interview at risk of no-show"""
    interview_id: str
    candidate_name: str
    job_title: str
    scheduled_time: datetime
    last_reminder_sent: Optional[datetime] = None
    reminder_response: bool
    risk_score: int  # 1-10

# ============ VALIDATION HELPERS ============

NOTICE_PERIOD_OPTIONS = [0, 7, 15, 30, 45, 60, 90]  # Days

def validate_notice_period(days: int) -> bool:
    """Validate notice period is in allowed options"""
    return days in NOTICE_PERIOD_OPTIONS

def validate_work_model_city(work_model: str, city: Optional[str]) -> bool:
    """Validate city is provided for Onsite/Hybrid"""
    if work_model in ["Onsite", "Hybrid"]:
        return bool(city and city.strip())
    return True
