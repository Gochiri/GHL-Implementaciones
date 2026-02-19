# GoHighLevel Components Reference

## Pipeline Stages Examples

### Sales Pipeline Typical Stages:
1. New Lead
2. Contacted / Attempt to Contact
3. Inspection Scheduled
4. Estimate Sent
5. Deposit Invoice Sent
6. Deposit Paid
7. Work Scheduled
8. In Progress
9. Complete
10. Closed Won / Closed Lost

### Active Project Pipeline Typical Stages:
1. Backlog
2. Planning
3. Ready to Start
4. In Progress
5. QA Needed
6. Share with Client
7. Client Review
8. Ready to Standardize
9. Active / Closed

## Workflow Nomenclature Standards

### Lead Source (LS) Workflows:
- **LS01**: Determine Contact Source - When new contact is created, set contact source from attribution
- **LS02**: New Website Lead Value - When form submitted, calculate and assign lead value
- **LS03**: Lead Confirm Address - When form submitted, send SMS to confirm service address

### Sales Pipeline (SP) Workflows:
- **SP01**: New Inspection Booked - Confirmation emails, portfolio send, reminders
- **SP02**: Inspection Survey Outcome - Process survey results, handle reschedules
- **SP03**: Estimate Sent - Send estimate, 24hr follow-up sequence
- **SP04**: Estimate Approved/Rejected - Process decision, next steps
- **SP05**: Deposit Invoice Sent - Invoice delivery and tracking
- **SP06**: Deposit Paid - Confirmation and job scheduling
- **SP07**: Follow-up Sequence - Long-term nurturing for not-ready leads

### Active Project (AP) Workflows:
- **AP01**: Job Scheduled Reminder - Daily reminder to admin until job scheduled in calendar
- **AP02**: Project Start Notification - Notify team when project begins
- **AP03**: Project Completion - Mark complete, trigger review request

### Review/Rebate Workflows:
- **PS01**: Review Request - Send review request after project completion
- **PS02**: New Review Received - Process and acknowledge new reviews
- **PS03**: Stale Review Request - Follow-up for pending review requests
- **RP01**: Rebate Processing - Handle rebate workflows

## Common Custom Fields

### Contact Fields:
- `contact_source` - Where the lead came from (Instagram, Meta, Website, etc.)
- `lead_value` - Estimated value of the lead
- `full_address` - Complete service address
- `attribution_source` - First touch attribution
- `session_source` - Session attribution

### Opportunity Fields:
- `opportunity_value` - Project estimated value
- `opportunity_source` - Mirrors contact_source for tracking
- `project_type` - Type of service/project
- `inspection_date` - When inspection was/will be conducted

## Common Forms & Surveys

### Forms:
- **New Website Intake Form** - Initial lead capture form
- **Consultation Proposal Form** - Detailed consultation request

### Surveys:
- **Inspection Outcome Survey** - Results from in-person inspection
  - Need to reschedule?
  - Inspection complete?
  - Good/bad prospect?
  - If bad: reasons why
- **Project Outcome Survey** - Post-completion feedback

## Calendar Configuration

### Inspection Calendar:
- Type: Round Robin
- Meeting Location: Custom - Contact Full Address
- Primary Users: Field team members
- Purpose: Schedule on-site inspections (sales appointments)

### Active Project Calendar:
- Type: Round Robin or Assigned
- Meeting Location: Custom - Contact Full Address
- Primary Users: Project managers/technicians
- Purpose: Schedule actual service work

### Consultation Calendar:
- Type: Round Robin or Collective
- Meeting Location: Zoom/Office
- Primary Users: Sales consultants
- Purpose: Remote consultations

## Custom Values Structure

### Form/Survey Links:
- `new_website_intake_form_link` - Preview link for intake form
- `inspection_outcome_survey_link` - Preview link for inspection survey
- `project_outcome_survey_link` - Preview link for project survey

### Trigger Links (with UTM):
- `new_website_intake_form_TL` - Trigger link with UTM tracking
- `inspection_outcome_survey_TL` - Trigger link with UTM tracking
- Format: `{preview_link}?contact_id={{contact.id}}`

## Folder Organization Standards

### Workflow Folders:
1. Lead Sources
2. Sales Workflows
3. Follow-up Workflows
4. Active Job Workflows
5. Review Workflows
6. Rebate Workflows

### Custom Field Folders:
1. New Website Intake Form
2. Inspection Outcome Survey
3. Project Outcome Survey
4. Calendars
5. General Contact Info

### Custom Value Folders:
1. Forms and Surveys
2. Calendars

## Common Triggers

- **Contact Created** - New contact added to system
- **Form Submitted** - Specific form completed
- **Survey Submitted** - Specific survey completed
- **Appointment Scheduled** - Calendar booking made
- **Opportunity Stage Changed** - Opportunity moved to new stage
- **Tag Added/Removed** - Specific tag applied or removed
- **Custom Field Updated** - Specific field value changed
- **Message Received** - WhatsApp/SMS/DM received

## Common Actions

### Communication:
- Send Email
- Send SMS
- Send WhatsApp Message
- Internal Notification
- Slack Notification

### Data Management:
- Update Contact Field
- Create Opportunity
- Update Opportunity
- Add Tag
- Remove Tag
- Assign to User
- Add to Follower

### Workflow Control:
- Wait/Delay
- If/Else Decision
- Go To
- End Workflow

## Example Workflow Structure

### SP01: New Inspection Booked

**Trigger**: Appointment scheduled in Inspection Calendar

**Actions**:
1. Assign opportunity to calendar owner
2. Find/create opportunity in Sales Pipeline
3. Send confirmation email to contact
4. Send confirmation SMS to contact
5. Wait 10 minutes
6. Send portfolio email
7. Wait until 24 hours before appointment
8. Send reminder email
9. Wait until 2 hours before appointment
10. Send confirmation SMS
11. Send internal notification to assigned user

**Goal**: Ensure inspection is attended and client receives all necessary information
