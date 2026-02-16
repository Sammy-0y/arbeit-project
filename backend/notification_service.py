"""
Notification Service - Email, SMS, WhatsApp via Pica API
"""
import os
import base64
import httpx
import logging
from typing import Optional, List
from datetime import datetime
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)

# Pica API Configuration
PICA_API_BASE = "https://api.picaos.com/v1/passthrough"

def get_pica_credentials():
    """Get Pica credentials from environment"""
    return {
        "secret_key": os.environ.get("PICA_SECRET_KEY"),
        "gmail_key": os.environ.get("PICA_GMAIL_CONNECTION_KEY"),
        "outlook_key": os.environ.get("PICA_OUTLOOK_MAIL_CONNECTION_KEY"),
        "twilio_key": os.environ.get("PICA_TWILIO_CONNECTION_KEY"),
        "twilio_account_sid": os.environ.get("TWILIO_ACCOUNT_SID"),
        "twilio_messaging_sid": os.environ.get("TWILIO_MESSAGING_SERVICE_SID")
    }

# Gmail Action ID from Pica docs
GMAIL_ACTION_ID = "conn_mod_def::F_JeJ_A_TKg::cc2kvVQQTiiIiLEDauy6zQ"
OUTLOOK_ACTION_ID = "conn_mod_def::GCwA84KBXNw::h9iYXKQMQY-nKxeNMrZwng"
TWILIO_ACTION_ID = "conn_mod_def::GC7N3zbeE28::A5b41eniS62szBc_-AiXBA"


def create_mime_message(to: str, subject: str, body: str, from_name: str = "Arbeit Talent Portal") -> str:
    """Create a MIME email message and encode it in base64url"""
    mime_message = f"""To: {to}
Subject: {subject}
Content-Type: text/html; charset=UTF-8
MIME-Version: 1.0

{body}"""
    # Base64url encode the message
    encoded = base64.urlsafe_b64encode(mime_message.encode('utf-8')).decode('utf-8')
    return encoded


async def send_email_gmail(to: str, subject: str, body: str) -> dict:
    """Send email via Gmail using Pica API"""
    creds = get_pica_credentials()
    
    if not creds["secret_key"] or not creds["gmail_key"]:
        logger.warning(f"Gmail credentials not configured. Secret: {bool(creds['secret_key'])}, Gmail: {bool(creds['gmail_key'])}")
        return {"success": False, "error": "Gmail credentials not configured"}
    
    try:
        raw = create_mime_message(to, subject, body)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{PICA_API_BASE}/users/me/messages/send",
                headers={
                    "x-pica-secret": creds["secret_key"],
                    "x-pica-connection-key": creds["gmail_key"],
                    "x-pica-action-id": GMAIL_ACTION_ID,
                    "Content-Type": "application/json"
                },
                json={"raw": raw}
            )
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to}")
                return {"success": True, "data": response.json()}
            else:
                logger.error(f"Failed to send email: {response.status_code} - {response.text}")
                return {"success": False, "error": response.text}
                
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_email_outlook(to: str, subject: str, body: str) -> dict:
    """Send email via Outlook using Pica API"""
    creds = get_pica_credentials()
    
    if not creds["secret_key"] or not creds["outlook_key"]:
        logger.warning("Outlook credentials not configured")
        return {"success": False, "error": "Outlook credentials not configured"}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{PICA_API_BASE}/me/sendMail",
                headers={
                    "x-pica-secret": creds["secret_key"],
                    "x-pica-connection-key": creds["outlook_key"],
                    "x-pica-action-id": OUTLOOK_ACTION_ID,
                    "Content-Type": "application/json"
                },
                json={
                    "message": {
                        "subject": subject,
                        "body": {
                            "contentType": "HTML",
                            "content": body
                        },
                        "toRecipients": [
                            {"emailAddress": {"address": to}}
                        ]
                    }
                }
            )
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Outlook email sent successfully to {to}")
                return {"success": True}
            else:
                logger.error(f"Failed to send Outlook email: {response.status_code} - {response.text}")
                return {"success": False, "error": response.text}
                
    except Exception as e:
        logger.error(f"Error sending Outlook email: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_sms_twilio(to: str, message: str) -> dict:
    """Send SMS via Twilio using Pica API"""
    creds = get_pica_credentials()
    
    if not creds["secret_key"] or not creds["twilio_key"] or not creds["twilio_account_sid"]:
        logger.warning("Twilio credentials not configured")
        return {"success": False, "error": "Twilio credentials not configured"}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{PICA_API_BASE}/Accounts/{creds['twilio_account_sid']}/Messages.json",
                headers={
                    "x-pica-secret": creds["secret_key"],
                    "x-pica-connection-key": creds["twilio_key"],
                    "x-pica-action-id": TWILIO_ACTION_ID,
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "application/json"
                },
                data={
                    "To": to,
                    "MessagingServiceSid": creds["twilio_messaging_sid"],
                    "Body": message
                }
            )
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"SMS sent successfully to {to}")
                return {"success": True, "data": response.json()}
            else:
                logger.error(f"Failed to send SMS: {response.status_code} - {response.text}")
                return {"success": False, "error": response.text}
                
    except Exception as e:
        logger.error(f"Error sending SMS: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_email(to: str, subject: str, body: str) -> dict:
    """Send email using available provider (Gmail first, then Outlook)"""
    creds = get_pica_credentials()
    
    if creds["gmail_key"]:
        return await send_email_gmail(to, subject, body)
    elif creds["outlook_key"]:
        return await send_email_outlook(to, subject, body)
    else:
        logger.warning("No email provider configured")
        return {"success": False, "error": "No email provider configured"}


# ============ EMAIL TEMPLATES ============

def get_new_job_email_template(job: dict, client: dict, submitted_by: str) -> tuple:
    """Generate email subject and body for new job notification"""
    subject = f"🆕 New Job Requirement: {job['title']} - {client.get('company_name', 'Unknown Client')}"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }}
            .job-details {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            .label {{ font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }}
            .value {{ color: #1e293b; margin-bottom: 10px; }}
            .cta-button {{ background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; }}
            .footer {{ text-align: center; padding: 15px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">New Job Requirement</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">Action Required</p>
            </div>
            <div class="content">
                <p>A new job requirement has been submitted and requires your attention.</p>
                
                <div class="job-details">
                    <div class="label">Client</div>
                    <div class="value">{client.get('company_name', 'Unknown')}</div>
                    
                    <div class="label">Position</div>
                    <div class="value">{job['title']}</div>
                    
                    <div class="label">Location</div>
                    <div class="value">{job.get('location', 'Not specified')}</div>
                    
                    <div class="label">Work Model</div>
                    <div class="value">{job.get('work_model', 'Not specified')}</div>
                    
                    <div class="label">Experience Required</div>
                    <div class="value">{job.get('experience_range', {}).get('min_years', 0)} - {job.get('experience_range', {}).get('max_years', 0)} years</div>
                    
                    <div class="label">Employment Type</div>
                    <div class="value">{job.get('employment_type', 'Full-time')}</div>
                    
                    <div class="label">Required Skills</div>
                    <div class="value">{', '.join(job.get('required_skills', [])) or 'Not specified'}</div>
                    
                    <div class="label">Submitted By</div>
                    <div class="value">{submitted_by}</div>
                    
                    <div class="label">Submitted At</div>
                    <div class="value">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</div>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Review the job requirements</li>
                    <li>Start sourcing candidates</li>
                    <li>Upload qualified CVs for client review</li>
                </ul>
            </div>
            <div class="footer">
                <p>Arbeit Talent Portal - Recruitment Management System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return subject, body


def get_candidate_status_change_email_template(
    candidate: dict, 
    job: dict, 
    client: dict, 
    new_status: str,
    changed_by: str
) -> tuple:
    """Generate email for candidate status change notification"""
    status_colors = {
        "SHORTLISTED": "#22c55e",
        "APPROVED": "#22c55e", 
        "NOT_SHORTLISTED": "#ef4444",
        "REJECTED": "#ef4444",
        "MAYBE": "#f59e0b",
        "PIPELINE": "#3b82f6"
    }
    
    status_color = status_colors.get(new_status.upper(), "#64748b")
    
    subject = f"📋 Candidate Status Update: {candidate.get('name', 'Unknown')} - {new_status}"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }}
            .status-badge {{ background: {status_color}; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; font-weight: bold; }}
            .details {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            .label {{ font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }}
            .value {{ color: #1e293b; margin-bottom: 10px; }}
            .footer {{ text-align: center; padding: 15px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">Candidate Status Updated</h1>
            </div>
            <div class="content">
                <p>A candidate's status has been updated by {changed_by}.</p>
                
                <div style="text-align: center; margin: 20px 0;">
                    <span class="status-badge">{new_status}</span>
                </div>
                
                <div class="details">
                    <div class="label">Candidate</div>
                    <div class="value">{candidate.get('name', 'Unknown')}</div>
                    
                    <div class="label">Position</div>
                    <div class="value">{job.get('title', 'Unknown')}</div>
                    
                    <div class="label">Client</div>
                    <div class="value">{client.get('company_name', 'Unknown')}</div>
                    
                    <div class="label">Updated By</div>
                    <div class="value">{changed_by}</div>
                    
                    <div class="label">Updated At</div>
                    <div class="value">{datetime.now().strftime('%B %d, %Y at %I:%M %p')}</div>
                </div>
            </div>
            <div class="footer">
                <p>Arbeit Talent Portal - Recruitment Management System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return subject, body


def get_interview_booked_email_template(
    interview: dict,
    candidate: dict,
    job: dict,
    client: dict,
    slot_time: str
) -> tuple:
    """Generate email for interview booking confirmation"""
    subject = f"📅 Interview Confirmed: {candidate.get('name', 'Unknown')} - {job.get('title', 'Position')}"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; }}
            .interview-card {{ background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }}
            .label {{ font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }}
            .value {{ color: #1e293b; margin-bottom: 10px; }}
            .time-highlight {{ background: #ecfdf5; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }}
            .footer {{ text-align: center; padding: 15px; color: #64748b; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">✅ Interview Confirmed</h1>
            </div>
            <div class="content">
                <p>Great news! A candidate has confirmed their interview slot.</p>
                
                <div class="time-highlight">
                    <div style="font-size: 24px; font-weight: bold; color: #059669;">{slot_time}</div>
                    <div style="color: #64748b;">Interview Scheduled</div>
                </div>
                
                <div class="interview-card">
                    <div class="label">Candidate</div>
                    <div class="value">{candidate.get('name', 'Unknown')}</div>
                    
                    <div class="label">Position</div>
                    <div class="value">{job.get('title', 'Unknown')}</div>
                    
                    <div class="label">Client</div>
                    <div class="value">{client.get('company_name', 'Unknown')}</div>
                    
                    <div class="label">Interview Mode</div>
                    <div class="value">{interview.get('interview_mode', 'Video')}</div>
                    
                    <div class="label">Duration</div>
                    <div class="value">{interview.get('interview_duration', 60)} minutes</div>
                </div>
                
                <p><strong>Next Steps:</strong></p>
                <ul>
                    <li>Send calendar invite to all parties</li>
                    <li>Share meeting link with candidate</li>
                    <li>Prepare interview materials</li>
                </ul>
            </div>
            <div class="footer">
                <p>Arbeit Talent Portal - Recruitment Management System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return subject, body


def get_candidate_selection_email_template(
    candidate: dict,
    job: dict,
    client: dict,
    login_email: str,
    temp_password: str,
    portal_url: str
) -> tuple:
    """Generate email for candidate selection with portal login credentials"""
    # Avoid emoji in subject line to prevent encoding issues
    subject = f"Congratulations! You've been selected for {job.get('title', 'a position')} at {client.get('company_name', 'our client')}"
    
    body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }}
            .content {{ background: #f8fafc; padding: 25px; border: 1px solid #e2e8f0; }}
            .credentials-box {{ background: #1e293b; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .credential-item {{ margin: 10px 0; }}
            .credential-label {{ color: #94a3b8; font-size: 12px; text-transform: uppercase; }}
            .credential-value {{ font-size: 16px; font-weight: bold; color: #fff; background: #334155; padding: 8px 12px; border-radius: 4px; margin-top: 4px; font-family: monospace; }}
            .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 0 8px 8px 0; }}
            .cta-button {{ background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 16px; }}
            .details {{ background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            .label {{ font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }}
            .value {{ color: #1e293b; margin-bottom: 10px; }}
            .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 12px; }}
            .steps {{ background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0; }}
            .step {{ display: flex; align-items: center; margin: 10px 0; }}
            .step-number {{ background: #10b981; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 10px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">You've been selected for an interview</p>
            </div>
            <div class="content">
                <p>Dear <strong>{candidate.get('name', 'Candidate')}</strong>,</p>
                
                <p>We are pleased to inform you that you have been <strong>shortlisted</strong> for the position of <strong>{job.get('title', 'the role')}</strong> at <strong>{client.get('company_name', 'our client')}</strong>.</p>
                
                <div class="details">
                    <div class="label">Position</div>
                    <div class="value">{job.get('title', 'Unknown')}</div>
                    
                    <div class="label">Company</div>
                    <div class="value">{client.get('company_name', 'Unknown')}</div>
                    
                    <div class="label">Location</div>
                    <div class="value">{job.get('location', 'To be confirmed')}</div>
                </div>
                
                <h3 style="color: #1e3a8a;">Your Candidate Portal Access</h3>
                <p>Please use the credentials below to access your Candidate Portal where you can schedule your interview:</p>
                
                <div class="credentials-box">
                    <div class="credential-item">
                        <div class="credential-label">Portal URL</div>
                        <div class="credential-value">{portal_url}/candidate/login</div>
                    </div>
                    <div class="credential-item">
                        <div class="credential-label">Email / Username</div>
                        <div class="credential-value">{login_email}</div>
                    </div>
                    <div class="credential-item">
                        <div class="credential-label">Temporary Password</div>
                        <div class="credential-value">{temp_password}</div>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important:</strong> You will be required to change your password upon first login for security purposes.
                </div>
                
                <div style="text-align: center;">
                    <a href="{portal_url}/candidate/login" class="cta-button">Login to Candidate Portal</a>
                </div>
                
                <div class="steps">
                    <h4 style="margin-top: 0; color: #059669;">Next Steps:</h4>
                    <div class="step">
                        <span class="step-number">1</span>
                        <span>Login to the Candidate Portal using the credentials above</span>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <span>Change your password on first login</span>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <span>View available interview slots and select your preferred time</span>
                    </div>
                    <div class="step">
                        <span class="step-number">4</span>
                        <span>Confirm your interview booking</span>
                    </div>
                </div>
                
                <p>If you have any questions, please don't hesitate to reach out to our recruitment team.</p>
                
                <p>Best regards,<br><strong>Arbeit Talent Portal Team</strong></p>
            </div>
            <div class="footer">
                <p>This is an automated message from Arbeit Talent Portal</p>
                <p>© {datetime.now().year} Arbeit. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return subject, body


def get_interview_invitation_email_template(
    candidate: dict,
    job: dict,
    client: dict,
    interview: dict,
    recruiter: dict = None
) -> tuple:
    """Generate interview invitation email for candidate"""
    
    # Extract interview details
    scheduled_at = interview.get('scheduled_at', '')
    interview_mode = interview.get('interview_mode', 'Video')
    meeting_link = interview.get('meeting_link', '')
    duration_minutes = interview.get('duration_minutes', 30)
    time_zone = interview.get('time_zone', 'IST (Indian Standard Time)')
    
    # Parse date/time
    try:
        from datetime import datetime
        dt = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
        formatted_date = dt.strftime('%A, %B %d, %Y')
        start_time = dt.strftime('%I:%M %p')
        # Calculate end time
        from datetime import timedelta
        end_dt = dt + timedelta(minutes=duration_minutes)
        end_time = end_dt.strftime('%I:%M %p')
    except:
        formatted_date = scheduled_at
        start_time = "TBD"
        end_time = "TBD"
    
    # Recruiter info
    recruiter_name = recruiter.get('name', 'Recruiting Team') if recruiter else 'Recruiting Team'
    recruiter_email = recruiter.get('email', 'recruiting@company.com') if recruiter else 'recruiting@company.com'
    recruiter_phone = recruiter.get('phone', '') if recruiter else ''
    
    candidate_first_name = candidate.get('name', 'Candidate').split()[0]
    
    subject = f"Interview Invitation: {job.get('title', 'Position')} at {client.get('company_name', 'Company')}"
    
    body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Interview Invitation</title>
  <style>
    body {{
      font-family: Arial, Helvetica, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }}
    .container {{
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      padding: 24px;
      border-radius: 4px;
    }}
    .header {{
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 20px;
      color: #222222;
    }}
    .section {{
      margin-bottom: 18px;
      font-size: 14px;
      color: #333333;
      line-height: 1.5;
    }}
    .details {{
      background-color: #f8f8f8;
      padding: 15px;
      border-left: 4px solid #2e7d32;
      font-size: 14px;
    }}
    .footer {{
      font-size: 12px;
      color: #666666;
      margin-top: 30px;
      line-height: 1.4;
    }}
    a {{
      color: #1a73e8;
      text-decoration: none;
    }}
    .btn {{
      display: inline-block;
      background-color: #1a73e8;
      color: white !important;
      padding: 12px 24px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
      margin-top: 10px;
    }}
  </style>
</head>

<body>
  <div class="container">
    <div class="header">
      Interview Invitation
    </div>

    <div class="section">
      Dear {candidate_first_name},
    </div>

    <div class="section">
      We are pleased to inform you that your interview has been scheduled for the
      <strong>{job.get('title', 'Position')}</strong> role at <strong>{client.get('company_name', 'Company')}</strong>.
    </div>

    <div class="details">
      <strong><u>Interview Details</u></strong><br><br>
      <strong>Date:</strong> {formatted_date}<br><br>
      <strong>Start Time:</strong> {start_time}<br><br>
      <strong>End Time:</strong> {end_time}<br><br>
      <strong>Time Zone:</strong> {time_zone}<br><br>
      <strong>Interview Mode:</strong> {interview_mode}<br><br>
      <strong>Duration:</strong> {duration_minutes} minutes<br><br>
      {f'<strong>Location / Meeting Link:</strong><br><a href="{meeting_link}" class="btn">Join Interview</a>' if meeting_link else '<strong>Meeting details will be shared before the interview.</strong>'}
    </div>

    <br>

    <div class="section">
      <strong><u>Action Required:</u></strong><br><br>
      To help us coordinate effectively with the interview panel, please confirm your attendance by replying to this email with:<br>
      <strong>"Confirmed – I will attend the interview as scheduled."</strong>
    </div>

    <div class="section">
      Out of respect for the interview panel's time and scheduling commitments, we request candidates to inform us
      <strong>at least 2 hours in advance</strong> if they are unable to attend the interview.
      <br><br>
      Please note that interview attendance is an important part of the selection process, and
      <strong>missed interviews or late cancellations may be considered in future interview submissions</strong>.
    </div>

    <div class="section">
      If you have any questions or encounter any technical difficulties prior to the interview, please contact:
      <br><br>
      <strong>{recruiter_name}</strong><br>
      {recruiter_email}<br>
      {f'{recruiter_phone}<br>' if recruiter_phone else ''}
    </div>

    <div class="section">
      We look forward to your participation and wish you the best of luck!
    </div>

    <div class="footer">
      {client.get('company_name', 'Company')} – Recruiting Team<br><br>
      This is a system-generated email. Please do not share interview links publicly.
    </div>
  </div>
</body>
</html>
    """
    
    return subject, body


async def create_google_calendar_event(
    interview: dict,
    candidate: dict,
    job: dict,
    client: dict
) -> dict:
    """Create a Google Calendar event for the interview and get meeting link"""
    import os
    import httpx
    
    calendar_key = os.environ.get('PICA_GOOGLE_CALENDAR_KEY')
    pica_secret = os.environ.get('PICA_SECRET_KEY')
    
    if not calendar_key or not pica_secret:
        return {"success": False, "error": "Google Calendar credentials not configured"}
    
    try:
        # Parse scheduled time
        scheduled_at = interview.get('scheduled_at', '')
        duration_minutes = interview.get('duration_minutes', 30)
        
        from datetime import datetime, timedelta
        dt = datetime.fromisoformat(scheduled_at.replace('Z', '+00:00'))
        end_dt = dt + timedelta(minutes=duration_minutes)
        
        # Create event payload
        event_data = {
            "summary": f"Interview: {candidate.get('name', 'Candidate')} - {job.get('title', 'Position')}",
            "description": f"""Interview for {job.get('title', 'Position')} at {client.get('company_name', 'Company')}

Candidate: {candidate.get('name', 'Candidate')}
Email: {candidate.get('email', 'N/A')}
Phone: {candidate.get('phone', 'N/A')}

Job: {job.get('title', 'Position')}
Company: {client.get('company_name', 'Company')}
""",
            "start": {
                "dateTime": dt.isoformat(),
                "timeZone": interview.get('time_zone', 'Asia/Kolkata')
            },
            "end": {
                "dateTime": end_dt.isoformat(),
                "timeZone": interview.get('time_zone', 'Asia/Kolkata')
            },
            "conferenceData": {
                "createRequest": {
                    "requestId": interview.get('interview_id', 'interview'),
                    "conferenceSolutionKey": {
                        "type": "hangoutsMeet"
                    }
                }
            },
            "attendees": [
                {"email": candidate.get('email', '')}
            ]
        }
        
        async with httpx.AsyncClient() as client_http:
            response = await client_http.post(
                "https://api.picaos.com/v1/passthrough/google-calendar/events",
                headers={
                    "x-pica-secret": pica_secret,
                    "x-pica-connection-key": calendar_key,
                    "Content-Type": "application/json"
                },
                json={
                    "calendarId": "primary",
                    "conferenceDataVersion": 1,
                    "sendUpdates": "all",
                    **event_data
                },
                timeout=30.0
            )
            
            if response.status_code in [200, 201]:
                result = response.json()
                meeting_link = result.get('hangoutLink', '') or result.get('conferenceData', {}).get('entryPoints', [{}])[0].get('uri', '')
                return {
                    "success": True,
                    "event_id": result.get('id', ''),
                    "meeting_link": meeting_link,
                    "calendar_link": result.get('htmlLink', '')
                }
            else:
                logger.error(f"Google Calendar API error: {response.status_code} - {response.text}")
                return {"success": False, "error": f"Calendar API error: {response.status_code}"}
                
    except Exception as e:
        logger.error(f"Failed to create calendar event: {e}")
        return {"success": False, "error": str(e)}



# ============ CLIENT USER EMAIL TEMPLATES ============

def get_client_user_welcome_email_template(
    name: str,
    company_name: str,
    login_email: str,
    temp_password: str,
    portal_url: str
) -> tuple:
    """Generate welcome email for new client users with login credentials"""
    
    subject = f"Welcome to Arbeit Talent Portal - Your {company_name} Account"
    
    body = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 30px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
    .header {{ background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; }}
    .header h1 {{ margin: 0; font-size: 24px; }}
    .header p {{ margin: 10px 0 0 0; opacity: 0.9; }}
    .content {{ padding: 30px; }}
    .credentials-box {{ background: #1e293b; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
    .credential-item {{ margin: 12px 0; }}
    .credential-label {{ color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }}
    .credential-value {{ font-size: 16px; font-weight: bold; color: #fff; background: #334155; padding: 10px 12px; border-radius: 4px; margin-top: 5px; font-family: 'Courier New', monospace; word-break: break-all; }}
    .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; color: #92400e; }}
    .cta-button {{ background: #3b82f6; color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 20px 0; font-weight: bold; font-size: 16px; text-align: center; }}
    .features {{ background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }}
    .feature {{ display: flex; align-items: flex-start; margin: 12px 0; }}
    .feature-icon {{ width: 24px; height: 24px; background: #3b82f6; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; margin-right: 12px; flex-shrink: 0; }}
    .footer {{ text-align: center; padding: 20px; color: #64748b; font-size: 12px; background: #f8fafc; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Arbeit Talent Portal</h1>
      <p>Your account for {company_name} is ready</p>
    </div>
    
    <div class="content">
      <p>Dear <strong>{name}</strong>,</p>
      
      <p>Your account has been created on the Arbeit Talent Portal. You can now access the platform to review candidates, manage job requirements, and schedule interviews for <strong>{company_name}</strong>.</p>
      
      <div class="credentials-box">
        <div class="credential-item">
          <div class="credential-label">Portal URL</div>
          <div class="credential-value">{portal_url}/login</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Email / Login ID</div>
          <div class="credential-value">{login_email}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Temporary Password</div>
          <div class="credential-value">{temp_password}</div>
        </div>
      </div>
      
      <div class="warning">
        <strong>⚠️ Important Security Notice:</strong><br>
        You will be required to change your password upon first login. Please use a strong, unique password to secure your account.
      </div>
      
      <div style="text-align: center;">
        <a href="{portal_url}/login" class="cta-button">Login to Portal</a>
      </div>
      
      <div class="features">
        <h4 style="margin-top: 0; color: #1e3a8a;">What you can do on the portal:</h4>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span>Review candidate profiles and AI-generated stories</span>
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span>Approve, shortlist, or reject candidates</span>
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span>Schedule and manage interviews</span>
        </div>
        <div class="feature">
          <span class="feature-icon">✓</span>
          <span>Track the status of your job requirements</span>
        </div>
      </div>
      
      <p>If you have any questions or need assistance, please contact your administrator.</p>
      
      <p>Best regards,<br><strong>Arbeit Talent Portal Team</strong></p>
    </div>
    
    <div class="footer">
      <p>This is an automated message from Arbeit Talent Portal</p>
      <p>© {datetime.now().year} Arbeit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    """
    
    return subject, body


async def send_client_user_welcome_email(
    email: str,
    name: str,
    company_name: str,
    temp_password: str,
    portal_url: str
) -> dict:
    """Send welcome email to new client user with login credentials"""
    subject, body = get_client_user_welcome_email_template(
        name=name,
        company_name=company_name,
        login_email=email,
        temp_password=temp_password,
        portal_url=portal_url
    )
    
    return await send_email(email, subject, body)