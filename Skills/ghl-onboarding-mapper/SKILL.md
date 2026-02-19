---
name: ghl-onboarding-mapper
description: Converts client onboarding call transcriptions into structured GoHighLevel implementation roadmaps. Use when the user provides transcriptions from planning/onboarding sessions and wants to generate a complete roadmap including pipelines, workflows, custom fields, forms, calendars, and standardized nomenclature (LS, SP, AP, etc.). Creates editable visual maps in Miro or Canva format and detailed Google Sheets documentation.
---

# GHL Onboarding Mapper

Transform client onboarding transcriptions into complete GoHighLevel implementation roadmaps with standardized structure and nomenclature.

## Overview

This skill analyzes Spanish or English transcriptions from client planning sessions and automatically generates:
- Structured Google Sheet roadmap with all implementation tasks
- Visual process map (Miro/Canva compatible) with standardized blocks
- Complete asset inventory (pipelines, workflows, forms, calendars, custom fields)
- Standardized nomenclature (LS01, SP01, AP01, etc.)

## Core Workflow

### Step 1: Analyze Transcription

Extract key implementation components from the transcription:

**Lead Sources (LS)**: Identify all traffic sources and lead entry points
- Instagram DMs, Meta campaigns, landing pages, WhatsApp, website forms
- Assign LS01, LS02, LS03... in logical order

**Sales Pipeline (SP)**: Extract sales stages and progression
- Pipeline stages (New Lead, Contacted, Inspection Scheduled, Estimate Sent, etc.)
- Assign SP01, SP02, SP03... per workflow

**Active Projects (AP)**: Identify project management workflows
- Job scheduling, reminders, completion tracking
- Assign AP01, AP02, AP03...

**Additional Components**:
- **Rebate Pipeline (RP)**: If mentioned
- **Review/Project Stacking (PS)**: Review request processes
- **Forms & Surveys**: Intake forms, inspection surveys, project surveys
- **Calendars**: Inspection calendar, active project calendar, consultation calendar
- **Custom Fields**: Extract all data points to track

### Step 2: Generate Standardized Nomenclature

Apply consistent naming:
- **LS** = Lead Source workflows
- **SP** = Sales Pipeline workflows  
- **AP** = Active Project workflows
- **RP** = Rebate Pipeline workflows
- **PS** = Project Stacking/Review workflows

Number sequentially (01, 02, 03...) based on logical process flow.

### Step 3: Create Google Sheet Roadmap

Generate a structured Google Sheet with these tabs:

**Tab 1: Sales Pipeline**
- Pipeline stages with phase tracking
- Phases: Backlog, Planning, Ready to Start, In Progress, QA Needed, Share with Client, Client Review, Ready to Standardize, Active/Closed

**Tab 2: Workflows**
Complete workflow list with columns:
- Code (LS01, SP01, etc.)
- Name
- Trigger
- Description
- Goal/Objective
- Full workflow name

**Tab 3: Custom Fields**
- Organized by folders (forms, surveys, calendars)
- Field name, type, folder location

**Tab 4: Forms & Surveys**
- List with preview links and descriptions

**Tab 5: Calendars**
- Calendar groups and individual calendars
- Meeting locations, round-robin users

**Tab 6: Custom Values**
- Forms/survey links, trigger links with UTM parameters

**Tab 7: Action Items**
- Task checklist with subtasks and completion status

### Step 4: Create Visual Map Structure

Generate a visual map outline compatible with Miro/Canva:

**Color Coding**:
- Blue = Lead Sources (LS)
- Green = Sales Pipeline (SP)
- Red = Active Projects (AP)
- Purple = Rebate/Review (RP, PS)
- Gray = Decisions/Conditions

**Map Structure Example**:
```
[LEAD SOURCES - BLUE BLOCK]
├─ LS01: Instagram Leads
│  ├─ Trigger: DM received / Comment on post
│  ├─ Action: Determine contact source
│  ├─ Decision: Has tag "new lead"?
│  └─ Action: Update contact source field
├─ LS02: Meta Campaign Leads
│  ├─ Trigger: Form submitted
│  └─ Action: Create opportunity
└─ LS03: Website Form Lead Confirmation
   ├─ Trigger: Form submitted
   ├─ Wait: 1 minute
   └─ Action: Send SMS for address confirmation

[SALES PIPELINE - GREEN BLOCK]
├─ SP01: New Inspection Booked
│  ├─ Trigger: Calendar appointment created
│  ├─ Action: Send confirmation email
│  ├─ Action: Send confirmation SMS
│  ├─ Wait: 10 minutes
│  ├─ Action: Send portfolio email
│  ├─ Wait: 24 hours before appointment
│  ├─ Action: Send reminder email
│  ├─ Wait: 2 hours before appointment
│  ├─ Action: Send confirmation SMS
│  └─ Action: Internal notification to assigned user
├─ SP02: Inspection Survey Outcome
│  ├─ Trigger: Survey submitted
│  ├─ Decision: Need to reschedule?
│  │  └─ Yes: Send reschedule link
│  ├─ Decision: Inspection complete?
│  │  └─ Yes: Send project info to CRM
│  └─ Decision: Bad prospect?
│     └─ Yes: Determine reasons
├─ SP03: Estimate Sent
├─ SP04: Estimate Approved/Rejected
└─ SP05: Invoice Sent & Payment

[ACTIVE PROJECTS - RED BLOCK]
├─ AP01: Job Scheduled Reminder
│  ├─ Trigger: Opportunity created in "Work Scheduled" stage
│  ├─ Action: Daily reminder to admin to schedule
│  └─ Loop: Until scheduled in calendar
├─ AP02: Project Completion
└─ AP03: Final Invoice

[REVIEW/REBATE - PURPLE BLOCK]
├─ PS01: Review Request
│  ├─ Trigger: Project completed
│  └─ Action: Send review request
├─ PS02: New Review Received
└─ RP01: Rebate Processing
```

### Step 5: Generate Implementation Checklist

Create prioritized task list following the 70/30 rule (70% planning, 30% execution):

**Phase 1: Planning & Structure (70%)**
- [ ] Complete process mapping with client
- [ ] Define workspace hierarchy (Spaces, Folders, Lists)
- [ ] Create pipelines with stages
- [ ] Set up custom field folders
- [ ] Design forms and surveys
- [ ] Configure calendars and calendar groups
- [ ] Define custom values structure

**Phase 2: Automation & Workflows (30%)**
- [ ] Build lead source workflows (LS)
- [ ] Build sales pipeline workflows (SP)
- [ ] Build active project workflows (AP)
- [ ] Set up custom values and trigger links
- [ ] Configure notifications (Slack, internal, SMS)

**Phase 3: Testing & Refinement**
- [ ] Test each workflow end-to-end
- [ ] Validate custom field mappings
- [ ] QA all automations
- [ ] Client review and feedback
- [ ] Deploy to production

## Output Format

Provide the user with:

1. **Google Sheet Structure** - Present as markdown tables they can paste into Google Sheets
2. **Visual Map Outline** - Text-based hierarchical structure ready to paste into Miro/Canva
3. **Implementation Summary** with:
   - Total workflows to build (by type: LS, SP, AP, etc.)
   - Custom fields needed (grouped by folder)
   - Forms/surveys to create
   - Calendars to configure
   - Estimated implementation timeline (hours/days)

## Important Principles from the Methodology

**From the Transcriptions - Key Methodology**:

1. **70% Planning, 30% Execution** - Dedicate majority of time to planning and mapping
2. **Mapping Defines Boundaries** - Everything outside the map is additional scope and must be quoted separately
3. **Standardization Enables Delegation** - Processes should work identically for everyone
4. **Map First, Build Second** - Complete all mapping before any implementation
5. **Clear Communication** - Mapping sessions clarify expectations and surface all questions/answers
6. **Visual Process Standards** - Use color coding and standard blocks for easy comprehension
7. **Sequential Naming** - Use consistent prefixes (LS, SP, AP) and sequential numbers

## Common Elements to Extract

When analyzing transcriptions, look for:

**Triggers/Disparadores**:
- Form submitted
- Calendar appointment created
- Survey submitted
- Contact created
- DM received
- Comment on post
- Tag added/removed

**Actions/Acciones**:
- Send email/SMS
- Create/update opportunity
- Update contact field
- Assign to user
- Add to follower
- Send notification (Slack, internal)
- Wait/Esperar (time delays)

**Decisions/Decisiones**:
- If/else conditions
- Tag presence/absence
- Field value checks
- Contains phrase
- Status checks

**Custom Fields to Track**:
- Contact source
- Lead value
- Attribution source
- Project details
- Survey responses

## Usage Example

**User**: "Analiza esta transcripción y genera el roadmap completo"

**Expected Claude Action**:
1. Read and analyze the entire transcription
2. Extract all components (pipelines, workflows, forms, calendars, custom fields)
3. Apply standardized nomenclature (LS01, SP02, etc.)
4. Generate Google Sheet structure as markdown tables
5. Create visual map outline with color-coded blocks
6. Provide implementation checklist
7. Summarize total scope and estimated timeline

## Reference Files

See `references/ghl-components.md` for detailed component definitions and examples from real implementations.
