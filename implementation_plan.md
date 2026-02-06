# Implementation Plan - Applicant Energy Sink Detector (AESD)

This plan outlines the steps to build the AESD system according to the provided specification.

## 1. Database Schema (PostgreSQL)

- `jobs`: Stores job metadata (hashed URL, company, position).
- `applicant_efforts`: Tracks time spent, form fields, resume uploads, etc.
- `employer_responses`: Tracks observed responses (redirects, emails, manual confirmations).
- `company_stats`: Aggregated scores for companies.

## 2. Backend Enhancements (Node.js/Express)

- [ ] Initialize PostgreSQL connection (using `pg` or `sequelize`).
- [ ] Create API for `SIGNAL_EVENT` to store efforts and responses.
- [ ] Implement the `Energy Sink Score` formula: `Total Effort / Meaningful Responses`.
- [ ] Create API for manual confirmation of outcomes.
- [ ] (Optional) Placeholder for Email Metadata processing.

## 3. Extension Enhancements (Manifest V3)

- [ ] Improve `content.js` to measure time spent per page more accurately.
- [ ] Add `popup.html` and `popup.js` to display the "Energy Sink Score" for the current job.
- [ ] Improve redirect detection and status page monitoring.

## 4. Frontend Dashboard (React)

- [ ] Implement the "Energy Sink Score" gauge.
- [ ] Show distribution of response times.
- [ ] Provide recommendations (Apply confidently, avoid, etc.).
- [ ] Implement Professional Split-Screen Auth:
  - **Layout**: 50/50 split on desktop. Left side: Branding/Marketing. Right side: Interactive Auth Form.
  - **Socials**: Google + LinkedIn login buttons.
  - **Email Flow**: Multi-step (Email -> Password -> Role).
  - **Security**: Password toggle, Forgot Password UI, Remember Me, and Encryption badges.
  - **Trust**: "Join 50,000+ job seekers" social proof.
  - **Transitions**: Smooth framer-motion animations between steps.
- [ ] User Interface Enhancements
  - **Goal**: Full-page split-screen login with social providers, refined role selection, and security trust badges.
- **Features**:
  - **Social**: Google + LinkedIn integrations (simulated).
  - **Security**: Password visibility toggle, "Remember Me", forgot password flow, and "Encrypted" indicator.
  - **UX**: Loading/Error states, Terms/Privacy checkbox, and "Magic Link" option.
  - **Structure**: Left side brand marketing / Right side auth form.
- [x] Documentation Update

## 5. Security & Privacy

- [ ] Ensure all job URLs are hashed before storage.
- [ ] Verify that no PII (email content, resumes) is transmitted or stored.
