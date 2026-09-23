import logging
import resend
from app.config import settings
from app.models import Issue, Agency

logger = logging.getLogger(__name__)

# Initialize Resend
if settings.RESEND_API_KEY:
    resend.api_key = settings.RESEND_API_KEY

def send_issue_notification(issue: Issue, agency: Agency):
    """Sends an email notification to the assigned agency via Resend."""
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY not configured. Skipping email dispatch.")
        return
        
    if not agency.contact_email:
        logger.info(f"No contact email configured for agency {agency.name}. Skipping email dispatch.")
        return
        
    category_name = issue.category.name if issue.category else "General"
    location = f"{issue.state}, {issue.lga}" if issue.lga else issue.state
    
    subject = f"[NationWise Alert] New {category_name} Issue Reported in {location}"
    
    html_body = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <div style="background-color: #065F46; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">NationWise Alert</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Dear {agency.name},</p>
            <p>A new civic issue has been reported in your jurisdiction by a citizen via NationWise.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h3 style="margin-top: 0;">{issue.title}</h3>
                <p style="white-space: pre-wrap;">{issue.description}</p>
                <hr style="border: none; border-top: 1px solid #d1d5db; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>Category:</strong> {category_name}</p>
                <p style="margin: 5px 0;"><strong>Location:</strong> {location}</p>
                {f'<p style="margin: 5px 0;"><strong>Coordinates:</strong> {issue.latitude}, {issue.longitude}</p>' if issue.latitude and issue.longitude else ''}
            </div>
            
            <p>Please review this issue and update its status on your designated portal or internal system.</p>
            <p style="color: #6b7280; font-size: 14px;">This is an automated message from the NationWise platform. You are receiving this because you are the designated agency for {category_name} issues in {issue.state}.</p>
        </div>
    </div>
    """
    
    try:
        r = resend.Emails.send({
            "from": settings.EMAIL_FROM,
            "to": agency.contact_email,
            "subject": subject,
            "html": html_body
        })
        logger.info(f"Email dispatched for issue {issue.id} to {agency.contact_email}. Resend ID: {r.get('id')}")
    except Exception as e:
        logger.error(f"Failed to send email via Resend: {e}")
