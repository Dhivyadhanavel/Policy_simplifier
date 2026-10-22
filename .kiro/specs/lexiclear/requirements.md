# Requirements Document

## Introduction

LexiClear is an AI-powered legal and policy document intelligence platform that helps ordinary people understand complex legal and policy documents. The platform accepts PDF and DOCX uploads, extracts their text, and uses the Google Gemini API to produce plain-English summaries, section-by-section explanations, clause-level risk analysis, and interactive Q&A. It supports both English and Tamil output, allows users to compare two document versions side by side, and generates downloadable PDF reports. Two roles exist: User and Admin. All application data is persisted in MongoDB. The system is built as a full-stack application with a React + Vite frontend and a Node.js + Express backend.

---

## Glossary

- **System**: The LexiClear full-stack web application.
- **User**: An authenticated individual with the "user" role who uploads and analyses documents.
- **Admin**: An authenticated individual with the "admin" role who manages the platform and views system analytics.
- **Document**: A PDF or DOCX file uploaded by a User, stored on the server, and processed by the System.
- **Analysis**: The AI-generated output produced for a Document, including overview, summary, section explanations, clauses, obligations, deadlines, glossary, and risk findings.
- **Risk Finding**: An identified clause in a Document flagged by the AI as potentially significant, annotated with a risk category and risk level.
- **Conversation**: A persisted sequence of question-and-answer pairs associated with a Document and a User.
- **Comparison**: The result of diffing two Documents uploaded by the same User and explaining the significance of detected changes.
- **Report**: A downloadable PDF file containing the Analysis of a Document formatted for human review.
- **Auth_Service**: The backend module responsible for registration, login, and JWT issuance.
- **Document_Service**: The backend module responsible for file upload, storage, text extraction, and document lifecycle management.
- **Analysis_Service**: The backend module responsible for coordinating AI calls and persisting Analysis records.
- **AI_Service**: The isolated backend module that communicates with the Gemini API.
- **Comparison_Service**: The backend module responsible for text diffing and AI-assisted change explanation.
- **Report_Service**: The backend module responsible for generating and streaming PDF reports.
- **Admin_Service**: The backend module responsible for aggregating system analytics and user management data.
- **Extractor**: The document processing pipeline that converts PDF and DOCX binary content into plain text, preserving page numbers and section headings where possible.
- **Chunker**: The component within Analysis_Service that splits long extracted text into sections for sequential Gemini processing.
- **JWT**: A JSON Web Token used as the bearer credential for authenticated API requests.
- **Rate_Limiter**: Express middleware that enforces request-rate limits on expensive or security-sensitive endpoints.
- **Validator**: Express middleware that validates and sanitises incoming request data before it reaches route handlers.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to create an account with my name, email address, and password, so that I can access LexiClear securely.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/register` with a valid name, unique email address, and a password of at least eight characters, THE Auth_Service SHALL create a new User record with the password stored as a bcrypt hash and return a signed JWT.
2. IF the submitted email address already exists in the database, THEN THE Auth_Service SHALL return HTTP 409 and a descriptive error message without creating a duplicate record.
3. IF any required registration field is missing or malformed, THEN THE Auth_Service SHALL return HTTP 400 with a field-level validation error message.
4. THE Auth_Service SHALL never store or log plaintext passwords.
5. WHEN a new User is created, THE Auth_Service SHALL assign the "user" role by default.

---

### Requirement 2: User Login and Logout

**User Story:** As a registered User, I want to log in with my email and password and log out when finished, so that my account remains secure.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/auth/login` with a valid email and matching password, THE Auth_Service SHALL return a signed JWT with an expiry of twenty-four hours.
2. IF the email does not exist or the password does not match, THEN THE Auth_Service SHALL return HTTP 401 and a generic error message that does not indicate which credential was wrong.
3. WHEN a User logs out on the frontend, THE System SHALL remove the stored JWT from client-side storage and redirect the User to the login page.
4. WHILE a JWT is expired or absent, THE System SHALL reject protected API requests with HTTP 401.

---

### Requirement 3: JWT Authentication and Authorization

**User Story:** As a User, I want every request to my private data to be verified, so that other users cannot access my documents or analyses.

#### Acceptance Criteria

1. THE Auth_Service SHALL validate the JWT signature and expiry on every request to a protected endpoint before invoking the route handler.
2. IF a request reaches a User-scoped endpoint with a JWT belonging to a different User, THEN THE System SHALL return HTTP 403.
3. IF a request reaches an Admin-scoped endpoint with a JWT that does not carry the "admin" role, THEN THE System SHALL return HTTP 403.
4. THE System SHALL never expose another User's documents, analyses, conversations, or personal data through any API response.

---

### Requirement 4: User Profile Management

**User Story:** As a User, I want to view and update my profile details and preferred language, so that the platform reflects my preferences.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/users/profile` with a valid JWT, THE System SHALL return the authenticated User's name, email, role, and preferred language.
2. WHEN a PATCH request is made to `/api/users/profile` with a valid JWT and updated fields, THE System SHALL update the User record and return the updated profile.
3. IF the updated email address conflicts with an existing account, THEN THE System SHALL return HTTP 409 without applying the change.
4. THE System SHALL not allow a User to modify their own role through the profile endpoint.

---

### Requirement 5: Document Upload

**User Story:** As a User, I want to upload PDF and DOCX files, so that LexiClear can analyse them for me.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/documents/upload` with a valid JWT and a PDF or DOCX file, THE Document_Service SHALL store the file under a server-generated safe filename, create a Document record with status "pending", and return the Document metadata.
2. IF the uploaded file's MIME type is neither `application/pdf` nor `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, THEN THE Document_Service SHALL return HTTP 422 and reject the file.
3. IF the uploaded file size exceeds the configured `MAX_FILE_SIZE` limit, THEN THE Document_Service SHALL return HTTP 413 and reject the file.
4. THE Document_Service SHALL never execute uploaded file content.
5. THE Document_Service SHALL generate server-side filenames that contain no path-traversal sequences and are not derived directly from the original filename.
6. WHEN a Document is created, THE Document_Service SHALL record the original filename, MIME type, file size, upload date, and the authenticated User's identifier on the Document record.

---

### Requirement 6: Document Text Extraction

**User Story:** As a User, I want the platform to extract text from my uploaded document automatically, so that the AI can analyse its contents.

#### Acceptance Criteria

1. WHEN a PDF Document is uploaded, THE Extractor SHALL extract plain text from the PDF, preserving page numbers where the library supports it, and store the result on the Document record.
2. WHEN a DOCX Document is uploaded, THE Extractor SHALL extract plain text using Mammoth and store the result on the Document record.
3. WHERE an OCR pipeline is enabled, WHEN a scanned PDF yields no selectable text, THE Extractor SHALL fall back to Tesseract OCR to produce extracted text.
4. IF text extraction fails for any reason, THEN THE Document_Service SHALL set the Document's processing status to "failed" and return a descriptive error message.
5. WHEN extraction succeeds, THE Document_Service SHALL set the Document's processing status to "completed".
6. THE Extractor SHALL not execute or evaluate any content found within the document.

---

### Requirement 7: Document Library

**User Story:** As a User, I want to browse, search, and filter my uploaded documents, so that I can quickly find what I need.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/documents` with a valid JWT, THE Document_Service SHALL return only the Documents belonging to the authenticated User.
2. WHEN a search query parameter is provided, THE Document_Service SHALL return only Documents whose original filename contains the search string (case-insensitive).
3. WHEN a document type filter parameter is provided, THE Document_Service SHALL return only Documents matching that MIME type.
4. WHEN a date range filter is provided, THE Document_Service SHALL return only Documents uploaded within that range.
5. THE Document_Service SHALL never include another User's Documents in any list response.

---

### Requirement 8: Document Deletion

**User Story:** As a User, I want to delete a document and its associated data, so that I can manage my stored information.

#### Acceptance Criteria

1. WHEN a DELETE request is made to `/api/documents/:id` with a valid JWT from the Document's owner, THE Document_Service SHALL delete the stored file, the Document record, all associated Analysis records, and all associated Conversation records.
2. IF the authenticated User does not own the specified Document, THEN THE Document_Service SHALL return HTTP 403 without deleting any data.
3. IF the Document does not exist, THEN THE Document_Service SHALL return HTTP 404.

---

### Requirement 9: AI Document Analysis

**User Story:** As a User, I want the platform to generate a plain-English analysis of my document, so that I can understand its contents without legal expertise.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/documents/:id/analyze` with a valid JWT from the Document's owner and the Document's status is "completed", THE Analysis_Service SHALL invoke the AI_Service to produce an Analysis and persist it with status "completed".
2. WHEN the Document's extracted text exceeds the AI_Service's context limit, THE Chunker SHALL split the text into manageable sections, process each section individually, and merge the results before persisting.
3. THE Analysis_Service SHALL produce all of the following fields for each Analysis: overview, detailedSummary, sectionSummaries, importantClauses, obligations, deadlines, glossary, and riskFindings.
4. THE AI_Service SHALL request structured JSON responses from Gemini and THE Analysis_Service SHALL validate the response schema before persisting or returning the data.
5. IF the AI_Service receives a malformed or incomplete response from Gemini, THEN THE Analysis_Service SHALL set the Analysis status to "failed" and return HTTP 502 with a descriptive error.
6. THE Analysis_Service SHALL never fabricate clause text, dates, monetary amounts, or obligations; WHEN a field cannot be identified from the document text, THE Analysis_Service SHALL populate it with the string "Not specified in the document."
7. WHEN a GET request is made to `/api/documents/:id/analysis` with a valid JWT from the Document's owner, THE Analysis_Service SHALL return the persisted Analysis for that Document.

---

### Requirement 10: Clause-Level Risk Analysis

**User Story:** As a User, I want the platform to flag potentially risky or important clauses, so that I know what to pay attention to before signing.

#### Acceptance Criteria

1. WHEN an Analysis is generated, THE Analysis_Service SHALL include a riskFindings array where each entry contains: clauseTitle, sourceExcerpt, plainExplanation, potentialConcern, flagReason, suggestedQuestion, riskCategory, riskLevel, and sectionReference.
2. THE Analysis_Service SHALL classify each Risk Finding's riskCategory as one of: Financial, Legal Obligation, Termination, Liability, Privacy, or Other.
3. THE Analysis_Service SHALL classify each Risk Finding's riskLevel as one of: Low, Medium, or High.
4. THE Analysis_Service SHALL include a disclaimer in every Analysis response stating that risk levels are AI-generated informational indicators and do not constitute legal advice or a determination of legal validity.
5. THE Analysis_Service SHALL not claim that a flagged clause is illegal or unenforceable.

---

### Requirement 11: Document Q&A Chatbot

**User Story:** As a User, I want to ask natural-language questions about my document and receive answers grounded in the document's text, so that I can clarify specific details quickly.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/documents/:id/questions` with a valid JWT from the Document's owner and a question string, THE Analysis_Service SHALL verify document ownership, retrieve the Document's extracted text, submit the question and text to the AI_Service, and return an answer.
2. THE Analysis_Service SHALL include supporting quotations and section or page references in the answer whenever the source text supports them.
3. IF the Document's extracted text does not contain sufficient information to answer the question, THEN THE Analysis_Service SHALL return a response stating that the answer cannot be established from the available document text.
4. THE Analysis_Service SHALL persist each question-and-answer pair as a message in the associated Conversation record in MongoDB.
5. WHEN a GET request is made to `/api/documents/:id/conversation` with a valid JWT from the Document's owner, THE Analysis_Service SHALL return the full Conversation history for that Document.
6. THE AI_Service SHALL treat all document text as untrusted data and SHALL not allow instructions embedded within document content to override system prompts, disclose environment variables, or alter application behavior.
7. WHEN the Document's extracted text is longer than the AI_Service's context limit, THE Chunker SHALL select and submit the most relevant sections of text rather than the entire document.

---

### Requirement 12: Tamil and English Language Support

**User Story:** As a User, I want to switch the output language between English and Tamil, so that I can read analyses and answers in my preferred language.

#### Acceptance Criteria

1. WHEN an analysis or chatbot answer is requested with `language=ta` in the request body or query, THE AI_Service SHALL instruct Gemini to produce the response text in Tamil.
2. THE AI_Service SHALL preserve proper names, monetary amounts, dates, and identifiers in their original form and SHALL not translate them incorrectly.
3. THE Analysis_Service SHALL store the `analysisLanguage` field on each Analysis record to indicate the language in which the Analysis was generated.
4. WHEN a User updates their `preferredLanguage` to "ta" on their profile, THE System SHALL default subsequent analysis and chatbot requests to Tamil unless the User specifies otherwise.
5. THE System SHALL always keep the original extracted document text accessible alongside any translated output.

---

### Requirement 13: Document Version Comparison

**User Story:** As a User, I want to compare two versions of a document, so that I can see what has changed between them.

#### Acceptance Criteria

1. WHEN a POST request is made to `/api/documents/compare` with a valid JWT and the identifiers of two Documents owned by the authenticated User, THE Comparison_Service SHALL perform a text diff and return a Comparison record containing: addedClauses, removedClauses, modifiedClauses, changedDates, changedAmounts, changedObligations, and changedTerminationConditions.
2. IF either Document identifier does not belong to the authenticated User, THEN THE Comparison_Service SHALL return HTTP 403.
3. THE Comparison_Service SHALL use the AI_Service to explain the potential significance of detected changes in plain English.
4. THE Comparison_Service SHALL persist the Comparison result in a DocumentVersion record in MongoDB.
5. THE Comparison_Service SHALL not claim that every textual change carries a legal consequence.

---

### Requirement 14: Simplified Report Generation

**User Story:** As a User, I want to download a PDF report of my document's analysis, so that I can share or archive it offline.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/documents/:id/report` with a valid JWT from the Document's owner, THE Report_Service SHALL generate and stream a PDF file containing: document title and filename, overview, section summaries, important clauses, risk findings, rights and responsibilities, deadlines and obligations, a legal terminology glossary, source references, and an AI-generated-content disclaimer.
2. IF the Analysis for the Document has not been generated, THEN THE Report_Service SHALL return HTTP 404 with a message indicating that analysis must be completed before a report can be downloaded.
3. THE Report_Service SHALL use Unicode-capable fonts so that Tamil text renders correctly when the analysisLanguage is "ta".
4. IF the authenticated User does not own the specified Document, THEN THE Report_Service SHALL return HTTP 403.

---

### Requirement 15: User Dashboard

**User Story:** As a User, I want a dashboard that shows my activity at a glance, so that I can manage my documents and resume previous analyses efficiently.

#### Acceptance Criteria

1. WHEN a User accesses the dashboard page, THE System SHALL retrieve and display the total number of uploaded Documents, the number of completed Analyses, and a list of recently analysed Documents from the backend.
2. THE System SHALL group Documents by document type on the dashboard.
3. THE System SHALL display the processing status of each Document.
4. THE System SHALL provide a search field and filters for document type and upload date on the dashboard.
5. THE System SHALL never display hardcoded statistics; all counts and lists SHALL be derived from live MongoDB queries.

---

### Requirement 16: Admin Dashboard and Analytics

**User Story:** As an Admin, I want a dashboard showing platform-wide metrics, so that I can monitor usage and system health.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/admin/dashboard` with a valid JWT carrying the "admin" role, THE Admin_Service SHALL return: total registered Users, total Documents, document-type distribution, completed and failed Analysis counts, AI request counts, recent system errors, and monthly usage data.
2. WHEN a GET request is made to `/api/admin/users` with a valid Admin JWT, THE Admin_Service SHALL return a paginated list of Users including name, email, role, and account creation date.
3. THE Admin_Service SHALL never expose full document extracted text, private Conversation messages, or password hashes in any admin API response.
4. THE Admin_Service SHALL derive all statistics from live MongoDB queries.

---

### Requirement 17: Security Controls

**User Story:** As a platform operator, I want robust security controls, so that user data is protected and the system cannot be abused.

#### Acceptance Criteria

1. THE System SHALL apply Helmet middleware to set security-relevant HTTP response headers on all API responses.
2. THE System SHALL enforce a CORS policy that restricts allowed origins to the value of the `FRONTEND_URL` environment variable.
3. THE Rate_Limiter SHALL restrict authentication endpoints (`/api/auth/register`, `/api/auth/login`) to a maximum of ten requests per IP address per fifteen-minute window.
4. THE Rate_Limiter SHALL restrict AI analysis endpoints (`/api/documents/:id/analyze`, `/api/documents/:id/questions`) to a maximum of twenty requests per User per hour.
5. THE Validator SHALL sanitise all user-supplied input before it is passed to database queries or AI prompts to prevent injection attacks.
6. THE Document_Service SHALL enforce path-traversal protection when constructing file paths for stored documents.
7. THE System SHALL load all secrets and configuration values from environment variables and SHALL never hardcode credentials in source files.
8. THE System SHALL never expose the Gemini API key in any frontend bundle, API response, or log output.

---

### Requirement 18: Data Models and Persistence

**User Story:** As a platform operator, I want well-structured MongoDB models, so that data is consistently stored, queryable, and maintainable.

#### Acceptance Criteria

1. THE System SHALL define a User Mongoose model with fields: name, email, passwordHash, role, preferredLanguage, createdAt, and updatedAt, with a unique index on email.
2. THE System SHALL define a Document Mongoose model with fields: userId, originalFilename, storedFilename, mimeType, fileSize, documentType, extractedText, pageCount, processingStatus, uploadDate, and updatedAt, with an index on userId.
3. THE System SHALL define an Analysis Mongoose model with fields: documentId, userId, overview, detailedSummary, sectionSummaries, importantClauses, obligations, deadlines, glossary, riskFindings, analysisLanguage, modelUsed, processingStatus, createdAt, and updatedAt.
4. THE System SHALL define a Conversation Mongoose model with fields: userId, documentId, messages (each containing role, content, sourceReferences, and timestamp), createdAt, and updatedAt.
5. THE System SHALL define a DocumentVersion Mongoose model with fields: userId, originalDocumentId, comparedDocumentId, comparisonResults, and createdAt.
6. WHEN a User is deleted, THE System SHALL cascade-delete or nullify all associated Document, Analysis, Conversation, and DocumentVersion records.

---

### Requirement 19: Frontend Routing and Protected Pages

**User Story:** As a User, I want unauthenticated visitors to be redirected to the login page when they try to access protected routes, so that my data is not accessible without authentication.

#### Acceptance Criteria

1. WHEN an unauthenticated visitor navigates to any route other than `/`, `/login`, or `/register`, THE System SHALL redirect them to the login page.
2. WHEN an authenticated User with the "user" role attempts to navigate to an admin-only route, THE System SHALL redirect them to their dashboard.
3. THE System SHALL preserve the originally requested URL so that after a successful login the User is redirected to the page they originally requested.
4. WHEN a JWT stored in the client expires, THE System SHALL clear the stored token and redirect the User to the login page.

---

### Requirement 20: Error Handling and Validation

**User Story:** As a User, I want clear, actionable error messages when something goes wrong, so that I understand what to do next.

#### Acceptance Criteria

1. IF a request body fails schema validation, THEN THE Validator SHALL return HTTP 400 with a structured error response listing each invalid field and reason.
2. IF an unexpected server error occurs, THEN THE System SHALL return HTTP 500 with a generic error message and SHALL log the full error details server-side without exposing stack traces or internal paths to the client.
3. WHEN the AI_Service encounters a rate-limit or quota error from the Gemini API, THE Analysis_Service SHALL return HTTP 503 with a user-facing message indicating that the AI service is temporarily unavailable.
4. THE System SHALL handle corrupted and password-protected PDF and DOCX files gracefully by setting the Document status to "failed" and returning a descriptive user-facing message rather than crashing.

---

### Requirement 21: Environment Configuration

**User Story:** As a developer, I want a documented `.env.example` file, so that I can configure the application without guessing required variables.

#### Acceptance Criteria

1. THE System SHALL include a `.env.example` file at the project root containing placeholder values for: PORT, MONGODB_URI, JWT_SECRET, GEMINI_API_KEY, GEMINI_MODEL, FRONTEND_URL, and MAX_FILE_SIZE.
2. THE System SHALL include a `.gitignore` file that excludes `.env`, `uploads/`, and `node_modules/` from version control.
3. THE System SHALL include a `README.md` at the project root documenting the setup steps, environment variables, and commands required to run both the client and server.

---

### Requirement 22: Automated Tests

**User Story:** As a developer, I want automated tests for critical workflows, so that regressions are caught before deployment.

#### Acceptance Criteria

1. THE System SHALL include tests that verify successful user registration and JWT issuance.
2. THE System SHALL include tests that verify login failure with incorrect credentials.
3. THE System SHALL include tests that verify that a User cannot access another User's documents or analyses.
4. THE System SHALL include tests that verify that PDF and DOCX files are accepted and non-supported file types are rejected.
5. THE System SHALL include tests that verify Mongoose model validation rules for the User, Document, and Analysis models.
6. THE System SHALL include tests that verify the AI response schema validation logic used by the Analysis_Service.
7. THE System SHALL include tests that verify that the Analysis endpoint returns correct results for a sample document.
8. THE System SHALL include tests that verify that the document Q&A endpoint returns an answer grounded in the document text.
9. THE System SHALL include tests that verify that the Comparison endpoint returns a diff result for two Documents owned by the same User.
