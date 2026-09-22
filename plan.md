# SPIN — Critical 4-Day Structural Redesign & Implementation Planning

## Your role

Act as a senior full-stack architect, Google Cloud AI engineer, technical project manager, and hackathon delivery lead.

You have access to our existing SPIN repository.

Your immediate task is to **audit the repository and produce a realistic, detailed four-day implementation plan.**

Do not begin implementation yet. Do not modify any files, delete components, install dependencies, or create branches until I approve the plan.

## 1. Project context

Project: SPIN — AI Infrastructure Demand Intelligence Platform.
Competition: Build with AI: Code for Communities.
Track: AI for Digital Public Infrastructure & Governance.
We are building a WEBSITE, not a native Android application.
We have only FOUR DAYS remaining. Disregard any previous eight-day schedule.
Preserve existing working functionality and reuse the existing architecture wherever possible.

## 2. Exact problem statement

The competition asks for a scalable, multilingual AI platform designed as a Digital Public Good.
It must aggregate citizen development requests through voice, text and messaging channels across India.
It must analyse citizen feedback alongside demographic data, infrastructure indices and public investment plans.
Its main outputs must be infrastructure demand hotspots and evidence-backed recommendations for national policymakers.
The final product must NOT be limited to grievance collection, ticket tracking or departmental complaint resolution.

## 3. Product decisions already finalized

Citizen requests must support:

* Existing infrastructure problems.
* New development requests.

Geographical scope:

* Nationwide request acceptance from the beginning.
* State/district-level geographical support.
* Architecture that can accommodate communities across India.
* No fabricated nationwide analytical coverage.

Dataset approach:

* Verified public datasets wherever available.
* Clearly labelled synthetic/demo data where needed.
* Explicit source and coverage information.
* Missing data must be identified honestly.

Technical requirements:

* Meaningful Google AI integration.
* Multilingual text and voice functionality.
* A complete end-to-end website.
* A working deployed prototype.
* Explainable infrastructure recommendations.
* Human approval of actual policy actions.

## 4. Existing implementation

Inspect our actual repository before planning.
The existing system may include:

* React/TypeScript frontend.
* Citizen grievance form.
* Citizen chatbot.
* Authentication.
* FastAPI backend.
* Google ADK/Gemini agents.
* BigQuery.
* Geospatial integrations.
* Staff and policymaker dashboards.
* Maps and budget recommendation components.
* Six canonical schemas created during our previous Day 1 work.

Do not assume any feature is functional merely because files or components exist.
Determine what is genuinely working, partially implemented, disconnected, hardcoded, simulated or missing.
Inspect the actual code, configuration, tests, routing, API contracts and documentation.

## 5. Review the attached pipeline document

Document: SPIN Redesign — Raise a Query Pipeline Guide.
Study the proposed citizen workflow:
Authentication → Voice/Text Capture → Speech Recognition → Translation → Gemini Extraction → Location Verification → Duplicate Check → Citizen Confirmation → Registration.
Preserve its useful citizen-centric principles.
However, identify its conceptual limitation: it primarily ends at ticket registration.
We need to connect it to:
Community Demand Aggregation → Demographic/Infrastructure/Investment Data Fusion → Hotspot Analysis → Explainable Recommendations → Policymaker Review.
Also identify which features in the guide are essential, optional or unrealistic within four days.
Do not assume that a proposed feature is already implemented.

## 6. Required structural analysis

Analyse the existing website and produce a proposed final structure for:
A. Landing page and product positioning.
B. Citizen development portal.
C. Voice/text AI intake and confirmation experience.
D. Citizen request tracking.
E. Infrastructure intelligence and national hotspot dashboard.
F. Evidence and recommendation details.
G. Policymaker review and approval.
H. Backend orchestration and data processing.
I. Database, dataset integration and provenance.
J. Authentication, authorization, privacy and deployment.

For every module, state whether to:
* KEEP.
* MODIFY.
* REUSE AND EXTEND.
* ADD.
* REMOVE FROM MVP.
* DEFER.

Explain why, and reference the actual repository files involved.

Do not recommend a complete rewrite unless you find concrete evidence that the existing implementation cannot be reused.

## 7. Reconcile our schemas and architecture

Inspect the six existing canonical schemas:

CitizenRequest
ParsedRequest
CommunityCluster
DataContext
PriorityRecommendation
PolicyAction

Identify changes needed to support both infrastructure problems and new development requests.

Check nationwide location handling.

Check data-source provenance, synthetic data identification, and missing-data handling.

Check frontend/backend contract consistency.

Identify dependencies, migration risks and backward-compatibility concerns.

Do not create duplicate models or routes unnecessarily.

## 8. Mandatory functionality

The implementation plan must produce a working journey:

A citizen from any supported Indian location submits a development need through text or voice.

Google AI interprets and structures the request.

The citizen confirms extracted information.

The system stores the request.

Related requests are aggregated into meaningful demand signals.

The platform combines demand with relevant demographic, infrastructure and investment context.

The system identifies demand hotspots and produces explainable development proposals.

A policymaker can inspect the evidence and record an authorized human decision.

Distinguish live AI processing from fallback behavior and public data from synthetic data.

For locations with insufficient evidence, show limited analysis rather than inventing recommendations.


## 9. Final instruction

Our goal is to transform the existing SPIN website into a complete, credible infrastructure demand intelligence prototype within four days.

Do not start coding.

First, inspect the repository, produce your findings and implementation plan, and wait for my approval.