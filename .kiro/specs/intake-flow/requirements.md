# Requirements Document

## Introduction

IntakeFlow is an AI-powered file organization and access platform for college clubs. It sits on top of Google Drive to provide a cleaner browsing experience, an AI-assisted folder architecture setup, automated upload routing, and role-based access control for internal club leadership and members. The platform is intended exclusively for internal use by club admins, moderators, and approved members — not for public access.

The core product flow has two phases:
1. **Initial setup**: Connect Google Drive → AI analyzes existing structure → Admin reviews and approves a proposed folder architecture → System builds the approved structure.
2. **Ongoing usage**: Upload new files → System auto-routes or prompts for placement → Approved users browse, view, and download files through the portal.

**Storage model**: IntakeFlow uses a metadata-only local copy approach. Folder structure, file metadata (name, type, size, Drive file ID, last modified date), and permissions are stored in IntakeFlow's own database (the Metadata Store). Actual file binary content is never stored by IntakeFlow — it remains in Google Drive. When users view or download files, IntakeFlow proxies the request through the Drive Connector using the stored Drive File ID. The portal browses and searches against the local Metadata Store rather than making live Drive API calls.

**AI model**: Architecture proposals and upload routing are powered by Gemini (Google AI Studio free tier). Gemini 1.5 Flash is used for upload routing decisions (high frequency, lower complexity). Gemini 1.5 Pro is used for architecture proposals (low frequency, higher complexity).

---

## Glossary

- **IntakeFlow**: The platform described in this document.
- **Admin**: A club president or primary leader with full control over the platform, including user management, permissions, and file architecture.
- **Mod**: A board member or officer who can upload and manage files within approved workflows but cannot redesign the folder architecture.
- **Member**: A limited-access internal user who can view and download files but cannot upload or modify structure.
- **Google Drive**: The external cloud storage provider used as the underlying file storage backend.
- **Drive Connector**: The IntakeFlow component responsible for authenticating with and communicating with Google Drive.
- **Structure Analyzer**: The IntakeFlow component that reads an existing Google Drive folder tree and extracts metadata for AI processing.
- **AI Architect**: The IntakeFlow AI component that proposes folder architecture options based on analysis of existing files and folders.
- **Architecture**: The approved folder tree that IntakeFlow manages, which may differ from the raw Google Drive layout.
- **File Portal**: The IntakeFlow front-end interface through which users browse, view, and download files.
- **Upload Router**: The IntakeFlow component that determines where a newly uploaded file should be placed within the Architecture.
- **Confidence Score**: A numeric value (0–100) produced by the Upload Router indicating how certain it is about a file's placement category.
- **Placement Threshold**: The minimum Confidence Score required for the Upload Router to place a file automatically without prompting the user.
- **Category**: A named folder or classification node within the Architecture.
- **Pending File**: A file that has been uploaded but not yet placed because the Upload Router could not determine placement with sufficient confidence.
- **Structure Draft**: A proposed but not yet applied change to the Architecture, visible only to Admins before activation.
- **Rollback**: The act of reverting the Architecture to a previous approved version.
- **Session**: An authenticated user session within IntakeFlow.
- **Role**: One of Admin, Mod, or Member, assigned to a user and controlling their permissions within IntakeFlow.
- **Metadata Store**: IntakeFlow's application database that stores folder structure, file metadata, and permissions independently of Google Drive file content.
- **Drive File ID**: The unique identifier assigned by Google Drive to each file and folder, stored in the Metadata Store to enable Drive API operations.
- **Unmanaged File**: A file that exists in the connected Google Drive but has not been placed within the approved Architecture by IntakeFlow.
- **Structural Drift**: A condition where the folder structure in Google Drive has diverged from the approved Architecture stored in IntakeFlow due to out-of-band changes.
- **Drive Sync**: The process by which IntakeFlow detects and reconciles changes made directly to Google Drive outside of IntakeFlow.
- **Demo Mode**: A sandboxed operating mode in which IntakeFlow loads a pre-built sample Drive with realistic fake data, allowing users to explore the full product experience without connecting a real Google Drive.
- **Quick Access**: A section at the top of the File Portal displaying files pinned by an Admin for fast retrieval by all users.
- **Tag**: A short keyword label automatically generated or manually applied to a file, stored in the Metadata Store and used for search and filtering.
- **Activity Feed**: A real-time log of recent actions across the club account displayed on the dashboard.
- **Favorite**: A per-user bookmark on a file, stored in the Metadata Store, surfaced in a dedicated section of the File Portal.
- **Timeline View**: An alternative File Portal display mode that shows files in reverse chronological order by upload date, grouped by month.
- **Upload History**: A per-user page listing all files the user has uploaded, with placement status and metadata.
- **AI Summary**: A single concise sentence generated by Gemini describing the content of a supported file, stored in the Metadata Store.
- **Folder Description**: A single concise sentence generated by the AI Architect describing the purpose of a Category, stored in the Metadata Store and shown in the File Portal.
- **File Request**: A request submitted by a Member to Admins and Mods asking for a specific file to be uploaded and shared.
- **Notification Center**: An in-app inbox accessible via a bell icon that surfaces actionable and informational notifications for authenticated users.
- **Breadcrumb**: A navigational trail displayed in the File Portal showing the full folder path from the root to the currently viewed folder.
- **Dark Mode**: An alternative low-contrast color theme for the File Portal, toggled from user profile settings.
- **Club Activity Dashboard**: An Admin-only summary view showing aggregate metrics about file activity, uploads, and unresolved items.
- **"New" Badge**: A visual indicator shown on files and folders in the File Portal that were added or modified since the user's last login session.
- **Semantic Search**: An AI-powered search mode that interprets query intent using Gemini to return files matching the semantic meaning of the query rather than exact filename matches.
- **Upload Note**: An optional short text annotation (max 280 characters) added by the uploader at upload time, stored in the Metadata Store and displayed in the file detail view.
- **Duplicate Detection**: The process by which the Upload Router checks the Metadata Store for existing files with the same name and similar file size before completing a placement.
- **Batch Upload**: The act of uploading multiple files simultaneously through the File Portal.
- **Bulk Routing**: The Upload Router's process of evaluating and grouping multiple uploaded files into placement confidence tiers for a single review screen.
- **AI Rename Suggestion**: A cleaner canonical filename proposed by the Upload Router when the uploaded filename is detected as vague, inconsistent, or noisy.
- **Re-organization Suggestion**: An AI Architect-generated cleanup plan recommending files to move, folders to merge or rename, and new categories to create.
- **Smart Folder Naming**: The AI Architect's inline check that normalizes a newly entered Category name against the existing Architecture's naming conventions.
- **Access Request**: A request submitted by a Member or Mod to Admins asking for permission to view a restricted Category.
- **Uploader Attribution**: The display of the uploading user's name and upload date on every file visible in the File Portal.
- **First-Login Orientation**: A one-time overlay shown to new users on their first login that highlights key interface elements without explaining how to use them.
- **Guided Setup Wizard**: A step-by-step onboarding checklist shown to Admins during initial platform setup, tracking progress through the four setup phases.
- **Club Type**: A category selected by the Admin during initial setup (e.g., Greek life, sports team, academic club) used by the AI Architect to pre-seed architecture proposals with relevant folder patterns.
- **"Why Here?" Explanation**: A plain-English tooltip generated by Gemini explaining the Upload Router's automatic placement decision for a specific file.
- **Folder Preview Popover**: A popover shown when a user hovers over a folder name in the File Portal, displaying the folder's most recently modified files and total file count.

---

## Requirements

### Requirement 1: User Account Creation and Authentication

**User Story:** As a club leader, I want to create an account and log in to IntakeFlow, so that my club's data and settings are securely associated with my organization.

#### Acceptance Criteria

1. THE IntakeFlow SHALL provide a registration flow that collects a user's email address, password, and club name.
2. WHEN a user submits a registration form with a valid email and password meeting minimum complexity rules, THE IntakeFlow SHALL create a new account and assign the registering user the Admin Role.
3. IF a user submits a registration form with an email address already associated with an existing account, THEN THE IntakeFlow SHALL return a descriptive error message without creating a duplicate account.
4. WHEN a registered user submits valid credentials, THE IntakeFlow SHALL create an authenticated Session and redirect the user to the dashboard.
5. IF a user submits invalid credentials, THEN THE IntakeFlow SHALL return an error message and SHALL NOT create a Session.
6. WHEN an authenticated Session exceeds its maximum idle duration of 24 hours, THE IntakeFlow SHALL invalidate the Session and require the user to re-authenticate.

---

### Requirement 2: Google Drive Connection

**User Story:** As an Admin, I want to connect IntakeFlow to my club's Google Drive, so that the platform can read and manage the club's files.

#### Acceptance Criteria

1. THE Drive Connector SHALL support OAuth 2.0 authorization to connect an Admin's Google account to IntakeFlow.
2. WHEN an Admin initiates the Google Drive connection flow, THE Drive Connector SHALL redirect the Admin to Google's OAuth consent screen requesting read and write access to Google Drive.
3. WHEN Google returns a successful OAuth authorization code, THE Drive Connector SHALL exchange the code for access and refresh tokens and store them securely associated with the club account.
4. IF the OAuth flow fails or the Admin denies consent, THEN THE Drive Connector SHALL display a descriptive error message and return the Admin to the connection setup screen without storing any tokens.
5. WHEN a stored access token expires, THE Drive Connector SHALL automatically use the refresh token to obtain a new access token without requiring the Admin to re-authorize.
6. THE Drive Connector SHALL allow an Admin to disconnect the Google Drive integration, which SHALL revoke stored tokens and remove Drive access from the club account.

---

### Requirement 3: Existing File Structure Analysis

**User Story:** As an Admin, I want IntakeFlow to analyze my club's existing Google Drive structure, so that the AI can make informed architecture proposals based on what already exists.

#### Acceptance Criteria

1. WHEN an Admin triggers a structure analysis, THE Structure Analyzer SHALL traverse the connected Google Drive and collect folder names, folder hierarchy depth, file names, file types, and file counts per folder.
2. THE Structure Analyzer SHALL complete the traversal and produce a structured representation of the Drive within 60 seconds for Drive instances containing up to 10,000 files.
3. IF the Structure Analyzer encounters a folder or file it cannot access due to permission restrictions, THEN THE Structure Analyzer SHALL skip that item, log the inaccessible path, and continue traversal without failing the overall analysis.
4. WHEN the analysis is complete, THE Structure Analyzer SHALL store the structured representation — including folder hierarchy, file names, file types, file sizes, Drive File IDs, and last modified dates — in the Metadata Store, and SHALL pass the representation to the AI Architect for proposal generation.
5. THE Structure Analyzer SHALL NOT read or transmit the binary contents of files; it SHALL use only file metadata (name, type, size, last modified date) for analysis.
6. THE File Portal SHALL query the Metadata Store for folder and file information rather than making live Drive API calls on each portal load.

---

### Requirement 4: AI-Generated Architecture Proposal

**User Story:** As an Admin, I want the AI to propose a clean folder architecture based on my existing Drive, so that I can choose the best structure for my club without having to design it from scratch.

#### Acceptance Criteria

1. WHEN the Structure Analyzer passes a Drive representation to the AI Architect, THE AI Architect SHALL generate at least two and at most three Architecture proposals for the Admin to review.
2. THE AI Architect SHALL always include one proposal that preserves the existing folder structure unchanged.
3. THE AI Architect SHALL always include one proposal that reorganizes the existing structure into a cleaner, more consistent hierarchy.
4. WHERE the existing Drive structure is significantly disorganized or sparse, THE AI Architect SHALL include a third proposal that creates a new clean structure informed by common college club file organization patterns.
5. WHEN generating proposals, THE AI Architect SHALL use only file and folder metadata (names, types, counts, hierarchy) and SHALL NOT use file binary contents.
6. THE AI Architect SHALL present each proposal as a visual folder tree showing folder names, nesting levels, and a brief rationale for the proposed organization.
7. WHEN the AI Architect produces proposals, THE IntakeFlow SHALL display all proposals to the Admin on a single review screen before any changes are applied to Google Drive.

---

### Requirement 5: Admin Architecture Review and Approval

**User Story:** As an Admin, I want to review, adjust, and approve the proposed folder architecture before it is applied, so that I have full control over how my club's files are organized.

#### Acceptance Criteria

1. WHEN proposals are displayed, THE IntakeFlow SHALL allow the Admin to select exactly one proposal as the basis for the approved Architecture.
2. WHEN the Admin selects a proposal, THE IntakeFlow SHALL allow the Admin to rename, add, move, or delete folders within the selected proposal before approving it.
3. THE IntakeFlow SHALL display a live preview of the folder tree that updates in real time as the Admin makes edits to the selected proposal.
4. WHEN the Admin submits the final Architecture for approval, THE IntakeFlow SHALL save the Architecture as a Structure Draft and present a confirmation summary before applying any changes to Google Drive.
5. WHEN the Admin confirms the Structure Draft, THE IntakeFlow SHALL apply the approved Architecture by creating the corresponding folder structure in the connected Google Drive.
6. IF the Google Drive folder creation fails for any folder during application, THEN THE IntakeFlow SHALL report the specific failure to the Admin, halt further changes, and preserve the partially created structure for manual resolution.
7. THE IntakeFlow SHALL store the approved Architecture in the application database independently of Google Drive so that the portal can function even if Drive metadata is temporarily unavailable.

---

### Requirement 6: File Migration into Approved Architecture

**User Story:** As an Admin, I want existing files to be moved or copied into the new approved folder structure, so that the club's files are accessible through the organized portal immediately after setup.

#### Acceptance Criteria

1. WHEN the Architecture is applied, THE IntakeFlow SHALL present the Admin with a choice to either move existing files into the new structure or copy them into the new structure while leaving originals in place.
2. WHEN the Admin selects the move option, THE IntakeFlow SHALL relocate each existing file to the most appropriate Category in the approved Architecture as determined by the AI Architect.
3. WHEN the Admin selects the copy option, THE IntakeFlow SHALL duplicate each existing file into the most appropriate Category in the approved Architecture without deleting the originals.
4. THE IntakeFlow SHALL display a migration progress indicator showing the number of files processed and the number remaining.
5. IF a file cannot be matched to any Category with sufficient confidence, THEN THE IntakeFlow SHALL place the file in a designated "Unsorted" folder within the Architecture and notify the Admin.
6. WHEN migration is complete, THE IntakeFlow SHALL present the Admin with a summary showing total files migrated, files placed in "Unsorted", and any errors encountered.

---

### Requirement 7: Clean File Portal — Browsing

**User Story:** As a club member, I want to browse the club's organized files through a clean interface, so that I can find what I need without navigating raw Google Drive.

#### Acceptance Criteria

1. THE File Portal SHALL display the approved Architecture as a navigable folder tree accessible to all authenticated users with any Role.
2. WHEN a user selects a folder in the File Portal, THE File Portal SHALL query the Metadata Store and display the contents of that folder including subfolder names and file names, types, sizes, and last modified dates.
3. THE File Portal SHALL provide a search input that, WHEN a user enters a query of at least two characters, queries the Metadata Store and returns matching files and folders from across the entire Architecture within 3 seconds.
4. THE File Portal SHALL display search results with the file name, containing folder path, file type, and last modified date.
5. WHILE a user has the Member Role, THE File Portal SHALL display only folders and files that the Admin has marked as accessible to Members.
6. WHILE a user has the Mod Role, THE File Portal SHALL display all folders and files except those explicitly restricted to Admin-only access.
7. WHILE a user has the Admin Role, THE File Portal SHALL display all folders and files in the Architecture without restriction.

---

### Requirement 8: Clean File Portal — File Viewing and Downloading

**User Story:** As a club member, I want to view and download files from the portal, so that I can access club documents without needing direct Google Drive access.

#### Acceptance Criteria

1. WHEN a user selects a file in the File Portal, THE File Portal SHALL display a preview of the file for supported types (PDF, images, Google Docs, Google Sheets, Google Slides) inline within the portal.
2. IF a file type is not supported for inline preview, THEN THE File Portal SHALL display the file's metadata and provide a download link.
3. WHEN a user requests to view or download a file, THE Drive Connector SHALL use the Drive File ID stored in the Metadata Store to fetch the file content from Google Drive and deliver it to the user's browser.
4. THE File Portal SHALL allow users to download multiple files as a ZIP archive by selecting files and choosing a bulk download action.
5. IF a user attempts to access a file outside their Role's permitted scope, THEN THE IntakeFlow SHALL return an access-denied response and SHALL NOT expose the file content or its Google Drive URL.

---

### Requirement 9: Automated Upload Routing

**User Story:** As an Admin or Mod, I want newly uploaded files to be automatically placed in the correct folder, so that the Architecture stays organized without requiring manual sorting after every upload.

#### Acceptance Criteria

1. WHEN an Admin or Mod uploads a file through the File Portal, THE Upload Router SHALL analyze the file's name, type, size, and last modified date to compute a Confidence Score for each Category in the Architecture.
2. WHEN the Upload Router computes a Confidence Score above the Placement Threshold (default: 80) for exactly one Category, THE Upload Router SHALL automatically place the file in that Category without prompting the user.
3. WHEN the Upload Router computes a Confidence Score above the Placement Threshold for more than one Category, THE Upload Router SHALL present the top matching Categories to the uploader and require the uploader to select one.
4. WHEN the Upload Router computes no Confidence Score above the Placement Threshold, THE Upload Router SHALL prompt the uploader to manually select a Category or suggest creating a new Category.
5. WHEN the uploader selects a Category manually, THE Upload Router SHALL place the file in the selected Category and record the manual placement decision for future routing improvement.
6. THE Upload Router SHALL complete automatic placement and confirm the result to the uploader within 10 seconds of file upload completion for files up to 100 MB.
7. IF a file upload fails due to a network or Drive error, THEN THE Upload Router SHALL notify the uploader with a descriptive error message and retain the file as a Pending File for retry.
8. WHEN a file is placed in a Category, THE Drive Connector SHALL upload the file to the corresponding Google Drive folder within the managed Architecture.

---

### Requirement 10: New Category Suggestion During Upload

**User Story:** As an Admin or Mod, I want the system to suggest creating a new folder category when an uploaded file doesn't fit existing ones, so that the Architecture can grow naturally without becoming cluttered.

#### Acceptance Criteria

1. WHEN the Upload Router determines that no existing Category is a suitable match for an uploaded file, THE Upload Router SHALL generate a suggested new Category name and proposed location within the Architecture hierarchy.
2. THE Upload Router SHALL present the suggested new Category to the uploader along with a rationale explaining why the file does not fit existing Categories.
3. WHEN an uploader accepts the suggested new Category, THE IntakeFlow SHALL create the new folder in Google Drive and update the stored Architecture to include the new Category.
4. WHEN an uploader rejects the suggested new Category, THE IntakeFlow SHALL allow the uploader to manually specify a Category name and location, or place the file in an existing Category.
5. WHILE a user has the Mod Role, THE IntakeFlow SHALL require Admin approval before a newly suggested Category is permanently added to the Architecture.
6. WHILE a user has the Admin Role, THE IntakeFlow SHALL allow the Admin to add a new Category immediately without a secondary approval step.

---

### Requirement 11: Admin Architecture Management

**User Story:** As an Admin, I want to manually edit the folder architecture after initial setup, so that I can keep the structure aligned with how the club evolves over time.

#### Acceptance Criteria

1. THE IntakeFlow SHALL provide an architecture editor accessible only to users with the Admin Role.
2. WHEN an Admin opens the architecture editor, THE IntakeFlow SHALL display the current Architecture as an editable folder tree.
3. THE IntakeFlow SHALL allow the Admin to rename, add, move, or delete Categories within the architecture editor.
4. WHEN the Admin makes changes in the architecture editor, THE IntakeFlow SHALL save those changes as a Structure Draft and SHALL NOT apply them to Google Drive until the Admin explicitly activates the draft.
5. WHEN the Admin activates a Structure Draft, THE IntakeFlow SHALL apply the changes to Google Drive and update the stored Architecture in the application database.
6. IF activating a Structure Draft would delete a Category that contains files, THEN THE IntakeFlow SHALL warn the Admin, list the affected files, and require explicit confirmation before proceeding.
7. THE IntakeFlow SHALL maintain a version history of at least the 10 most recent approved Architecture versions.
8. WHEN an Admin initiates a Rollback, THE IntakeFlow SHALL restore the Architecture to the selected previous version and apply the corresponding folder structure changes to Google Drive.

---

### Requirement 12: User and Role Management

**User Story:** As an Admin, I want to invite users and assign them roles, so that I can control who has access to the portal and what they can do.

#### Acceptance Criteria

1. THE IntakeFlow SHALL allow Admins to invite users by email address, assigning each invitee a Role of Admin, Mod, or Member at the time of invitation.
2. WHEN an invitation is sent, THE IntakeFlow SHALL send an email to the invitee containing a unique, time-limited invitation link valid for 72 hours.
3. WHEN an invitee follows the invitation link and completes registration, THE IntakeFlow SHALL create their account with the Role assigned by the inviting Admin.
4. IF an invitation link is used after its 72-hour expiration, THEN THE IntakeFlow SHALL display an expiration message and SHALL NOT create an account from that link.
5. THE IntakeFlow SHALL allow Admins to change the Role of any existing user except their own account.
6. THE IntakeFlow SHALL allow Admins to remove a user from the club account, which SHALL revoke the user's Session and prevent future login to that club's portal.
7. THE IntakeFlow SHALL ensure that at least one user with the Admin Role exists in the club account at all times; THE IntakeFlow SHALL prevent the removal or demotion of the last Admin.

---

### Requirement 13: Folder-Level Access Control

**User Story:** As an Admin, I want to set access permissions on individual folders, so that sensitive club files are only visible to the appropriate roles.

#### Acceptance Criteria

1. THE IntakeFlow SHALL allow Admins to set a minimum Role requirement on any Category in the Architecture, restricting visibility to users whose Role meets or exceeds the minimum.
2. WHEN a Category has a minimum Role requirement set, THE File Portal SHALL hide that Category and all its contents from users whose Role is below the minimum.
3. THE IntakeFlow SHALL allow Admins to grant a specific Mod or Member access to a restricted Category on an individual basis, overriding the Role-based restriction for that user.
4. WHEN an Admin removes a user's individual access grant to a restricted Category, THE IntakeFlow SHALL immediately revoke that user's ability to view the Category in the File Portal.
5. THE IntakeFlow SHALL display the current access settings for each Category within the architecture editor so Admins can review permissions at a glance.

---

### Requirement 14: Audit Logging

**User Story:** As an Admin, I want a log of significant actions taken within the platform, so that I can track changes and investigate issues.

#### Acceptance Criteria

1. THE IntakeFlow SHALL record an audit log entry for each of the following events: user login, user invitation, Role change, file upload, file placement (automatic or manual), Category creation, Category rename, Category deletion, Architecture activation, and Rollback.
2. EACH audit log entry SHALL include the timestamp, the user who performed the action, the action type, and the affected resource identifier.
3. THE IntakeFlow SHALL make the audit log accessible to users with the Admin Role through a dedicated log view in the portal.
4. THE IntakeFlow SHALL retain audit log entries for a minimum of 12 months.
5. WHEN an Admin filters the audit log by action type, user, or date range, THE IntakeFlow SHALL return matching entries within 3 seconds.

---

### Requirement 15: Drive Sync and Change Detection

**User Story:** As an Admin, I want IntakeFlow to automatically detect changes made directly in Google Drive, so that the Metadata Store stays accurate and I am notified of any structural changes that need my attention.

#### Acceptance Criteria

1. THE Drive Connector SHALL register a Google Drive Changes API push notification webhook for the connected Drive account, enabling IntakeFlow to receive change notifications without polling.
2. WHEN a webhook registration is within 1 hour of its expiry, THE IntakeFlow SHALL automatically re-register the webhook to maintain continuous coverage; THE IntakeFlow SHALL re-register webhooks on a 23-hour cycle to remain within the Google Drive maximum webhook lifetime of 24 hours.
3. WHEN a Drive change notification is received, THE Drive Connector SHALL use the stored pageToken to fetch only the delta of changes from the Google Drive Changes API and SHALL NOT perform a full Drive scan.
4. WHEN a change notification indicates that a file has been added to the managed Architecture in Google Drive outside of IntakeFlow, THE Drive Connector SHALL add the file's metadata and Drive File ID to the Metadata Store and mark the file as an Unmanaged File.
5. WHEN a change notification indicates that a file has been deleted from Google Drive, THE Drive Connector SHALL remove the corresponding entry from the Metadata Store and mark any affected Pending Files as unresolvable.
6. WHEN a change notification indicates that a file has been moved or renamed within Google Drive, THE Drive Connector SHALL update the file's path and name in the Metadata Store to reflect the new location.
7. WHEN a file is marked as an Unmanaged File, THE Upload Router SHALL attempt to determine an appropriate Category for the file using the same routing logic applied to uploaded files, and SHALL surface the file in the Admin inbox with the suggested Category and Confidence Score for Admin review.
8. WHEN a change notification indicates that a folder has been created in Google Drive outside of IntakeFlow, THE IntakeFlow SHALL flag the condition as Structural Drift and notify the Admin with a prompt to accept the new folder into the Architecture or ignore it.
9. WHEN a change notification indicates that a folder within the managed Architecture has been deleted in Google Drive outside of IntakeFlow, THE IntakeFlow SHALL flag the condition as Structural Drift, notify the Admin, and mark all files previously contained in that folder as Unmanaged Files.
10. WHEN the Admin accepts a Structural Drift item, THE IntakeFlow SHALL update the Metadata Store and the stored Architecture to reflect the accepted change.
11. WHEN the Admin ignores a Structural Drift item, THE IntakeFlow SHALL dismiss the notification and retain the current Architecture without modification.
12. THE IntakeFlow Admin dashboard SHALL display a Drive Sync Status indicator showing the timestamp of the last successfully processed change notification and the count of unresolved Structural Drift items.
13. IF the Drive Connector fails to re-register a webhook before expiry, THEN THE IntakeFlow SHALL log the failure, alert the Admin via the Drive Sync Status indicator, and attempt re-registration on the next scheduled cycle.

---

### Requirement 16: Guided Setup Wizard

**User Story:** As an Admin, I want a step-by-step onboarding checklist, so that I can complete the initial platform setup in the correct order without missing any required steps.

#### Acceptance Criteria

1. THE IntakeFlow SHALL display a Guided Setup Wizard to the Admin containing four sequential steps: Connect Drive, Analyze Structure, Approve Architecture, and Invite Team.
2. WHEN a setup step is completed, THE IntakeFlow SHALL unlock the next step in the Guided Setup Wizard and prevent the Admin from skipping ahead to a step whose predecessor is incomplete.
3. THE Guided Setup Wizard SHALL display a progress indicator showing the number of completed steps out of the total number of steps.
4. WHILE any setup step remains incomplete, THE IntakeFlow SHALL display the Guided Setup Wizard on the Admin dashboard.
5. WHEN all four setup steps are complete, THE IntakeFlow SHALL dismiss the Guided Setup Wizard and replace it with the standard Admin dashboard view.

---

### Requirement 17: Club Type Templates

**User Story:** As an Admin, I want to select my club type during initial setup, so that the AI proposes a folder architecture pre-seeded with patterns relevant to my type of organization.

#### Acceptance Criteria

1. WHEN an Admin reaches the Approve Architecture step of the Guided Setup Wizard, THE IntakeFlow SHALL prompt the Admin to select a club type from the following options: Greek life, sports team, academic club, arts organization, professional organization, and general interest.
2. WHEN the Admin selects a club type, THE AI Architect SHALL use the selected club type as additional context when generating Architecture proposals.
3. THE AI Architect SHALL pre-seed each Architecture proposal with folder patterns commonly associated with the selected club type.
4. IF the Admin does not select a club type, THEN THE AI Architect SHALL generate Architecture proposals using only the Drive structure analysis without club-type context.

---

### Requirement 18: Demo Mode

**User Story:** As a prospective user, I want to explore IntakeFlow with sample data before connecting my real Google Drive, so that I can evaluate the platform without risk to my club's actual files.

#### Acceptance Criteria

1. THE IntakeFlow SHALL provide a Demo Mode option on the onboarding screen that a user can enter without connecting a real Google Drive account.
2. WHEN a user enters Demo Mode, THE IntakeFlow SHALL load a pre-built sample Drive containing realistic fake files and folders into the session.
3. WHILE a user is in Demo Mode, THE IntakeFlow SHALL support the full product experience including structure analysis, Architecture proposals, File Portal browsing, and Upload Router functionality.
4. WHILE a user is in Demo Mode, THE IntakeFlow SHALL NOT write any data to any real Google Drive account.
5. WHILE a user is in Demo Mode, THE IntakeFlow SHALL display a persistent banner visible on all screens indicating that the user is operating in Demo Mode.

---

### Requirement 19: Google OAuth Login

**User Story:** As a user, I want to register and log in using my Google account, so that I can access IntakeFlow without managing a separate password.

#### Acceptance Criteria

1. THE IntakeFlow SHALL provide a "Sign in with Google" option on both the registration and login screens in addition to the existing email/password flow.
2. WHEN a user authenticates via Google OAuth, THE IntakeFlow SHALL use the email address from the user's Google account as their IntakeFlow account identifier.
3. WHEN a user authenticates via Google OAuth for the first time and no IntakeFlow account exists for that email, THE IntakeFlow SHALL create a new account for that user.
4. WHEN a user authenticates via Google OAuth and the Google account email matches an existing pending invitation, THE IntakeFlow SHALL create the account with the Role assigned in that invitation.
5. IF a user attempts to register via Google OAuth with an email already associated with an existing IntakeFlow account, THEN THE IntakeFlow SHALL log the user into the existing account rather than creating a duplicate.

---

### Requirement 20: Pinned Files / Quick Access

**User Story:** As an Admin, I want to pin important files to a Quick Access section, so that all users can find frequently needed files immediately without browsing the folder tree.

#### Acceptance Criteria

1. THE IntakeFlow SHALL allow users with the Admin Role to pin any file in the Architecture to the Quick Access section.
2. THE IntakeFlow SHALL enforce a maximum of 10 pinned files per club account; IF an Admin attempts to pin an eleventh file, THEN THE IntakeFlow SHALL display an error message and SHALL NOT add the file to Quick Access.
3. THE File Portal SHALL display the Quick Access section at the top of the portal view, showing each pinned file's name, file type, and containing folder.
4. WHEN any authenticated user selects a pinned file in the Quick Access section, THE File Portal SHALL apply the same Role-based permission checks as for files accessed through the folder tree before delivering the file.
5. THE IntakeFlow SHALL allow Admins to remove any file from the Quick Access section at any time.

---

### Requirement 21: Auto-Tags

**User Story:** As a club member, I want files to be automatically tagged based on their content context, so that I can search and filter files by topic without relying solely on filenames.

#### Acceptance Criteria

1. WHEN a file is added to the Metadata Store via upload or Drive Sync, THE AI Architect SHALL automatically generate up to 5 tags for the file based on its name, file type, and containing folder path.
2. THE IntakeFlow SHALL store generated tags in the Metadata Store and SHALL NOT write tags to Google Drive.
3. WHEN a user enters a search query in the File Portal, THE File Portal SHALL include tag matches in the search results returned from the Metadata Store.
4. THE File Portal SHALL display tags on the file detail view and SHALL NOT display tags inline within the folder listing.
5. THE IntakeFlow SHALL allow users with the Admin or Mod Role to manually add or remove tags from any file.

---

### Requirement 22: Recent Activity Feed

**User Story:** As a club member, I want to see a feed of recent activity on the dashboard, so that I can stay informed about what has changed in the club's file system.

#### Acceptance Criteria

1. THE IntakeFlow dashboard SHALL display a recent activity feed showing the last 20 actions across the club account.
2. THE Activity Feed SHALL include the following action types: file uploads, file placements, Architecture changes, and new member joins.
3. EACH activity feed entry SHALL display the action type, the name of the user who performed the action, the affected file or folder name, and the timestamp of the action.
4. WHEN the dashboard is open and a new qualifying action occurs, THE Activity Feed SHALL update in real time to reflect the new entry without requiring a page reload.

---

### Requirement 23: Personal Favorites

**User Story:** As an authenticated user, I want to mark files as Favorites, so that I can quickly return to files I use frequently without searching for them each time.

#### Acceptance Criteria

1. THE IntakeFlow SHALL allow any authenticated user to mark any file they have permission to view as a Favorite.
2. THE IntakeFlow SHALL store Favorites per user in the Metadata Store and SHALL NOT share a user's Favorites with other users.
3. THE File Portal SHALL display a "Favorites" section showing all files the authenticated user has marked as a Favorite.
4. WHEN a user removes a file from Favorites, THE IntakeFlow SHALL immediately remove the file from that user's Favorites section.
5. IF a user attempts to favorite a file they do not have permission to view, THEN THE IntakeFlow SHALL return an access-denied response and SHALL NOT add the file to the user's Favorites.

---

### Requirement 24: Folder Preview on Hover

**User Story:** As a user browsing the File Portal, I want to see a quick preview of a folder's contents when I hover over it, so that I can decide whether to navigate into it without clicking.

#### Acceptance Criteria

1. WHEN a user hovers over a folder name in the File Portal for 300 milliseconds, THE File Portal SHALL display a Folder Preview Popover for that folder.
2. THE Folder Preview Popover SHALL show the folder's top 3 to 5 most recently modified files, displaying each file's name and type, and the total file count for the folder.
3. THE Folder Preview Popover SHALL display only files the authenticated user has permission to view based on their Role and individual access grants.
4. WHEN the user's cursor leaves both the folder name and the Folder Preview Popover, THE File Portal SHALL dismiss the popover.

---

### Requirement 25: Breadcrumb Navigation

**User Story:** As a user navigating deep folder structures in the File Portal, I want to see a breadcrumb trail showing my current location, so that I can jump to any ancestor folder without repeatedly clicking back.

#### Acceptance Criteria

1. WHEN a user is viewing a folder that is more than one level deep in the Architecture, THE File Portal SHALL display a breadcrumb trail showing the full path from the root folder to the currently viewed folder.
2. EACH segment of the breadcrumb trail SHALL be a clickable link that navigates the user directly to that folder level when selected.

---

### Requirement 26: Last Updated Folder Indicators

**User Story:** As a user browsing the File Portal, I want to see when each folder was last updated, so that I can quickly identify folders with recent activity.

#### Acceptance Criteria

1. THE File Portal SHALL display a timestamp or relative label (e.g., "Updated 2 days ago") next to each folder indicating when a file within that folder or any of its subfolders was last modified or added.
2. THE last-updated indicator SHALL reflect the most recent file modification or addition anywhere within the folder's subtree.

---

### Requirement 27: File Timeline View

**User Story:** As a user, I want to view all files in chronological order, so that I can quickly find recently added files without knowing which folder they are in.

#### Acceptance Criteria

1. THE File Portal SHALL provide a toggle that switches between the default folder tree view and a Timeline View.
2. WHILE the Timeline View is active, THE File Portal SHALL display all files the authenticated user has permission to view in reverse chronological order by upload date, grouped by calendar month.
3. WHILE the Timeline View is active, THE File Portal SHALL allow the user to filter the displayed files by folder or by tag.

---

### Requirement 28: Search Filters

**User Story:** As a user, I want to filter search results by multiple criteria, so that I can narrow down results quickly when the club has a large number of files.

#### Acceptance Criteria

1. WHEN a user has performed a search in the File Portal, THE File Portal SHALL allow the user to apply filters to the results by: file type, containing folder, date range (uploaded or last modified), uploader, and tag.
2. THE File Portal SHALL apply active filters client-side against the Metadata Store search results without issuing a new server-side query.
3. THE File Portal SHALL display each active filter as a dismissible chip above the search results list.
4. WHEN a user dismisses a filter chip, THE File Portal SHALL remove that filter and update the displayed results immediately.

---

### Requirement 29: Semantic Search

**User Story:** As a user, I want to search for files by meaning rather than exact filename, so that I can find relevant files even when I don't remember the exact name.

#### Acceptance Criteria

1. THE File Portal SHALL provide a semantic search mode in addition to the default filename-based search.
2. WHEN a user's query does not closely match any filename in the Metadata Store, THE IntakeFlow SHALL use Gemini to interpret the query intent and return files whose names, tags, folder paths, and AI summaries match the semantic meaning of the query.
3. THE File Portal SHALL clearly label semantic search results as AI-assisted to distinguish them from exact-match results.

---

### Requirement 30: "Files Like This" Sidebar

**User Story:** As a user viewing a file, I want to see similar files suggested in a sidebar, so that I can discover related documents I might not have known to look for.

#### Acceptance Criteria

1. WHEN a user opens a file detail view, THE File Portal SHALL display a sidebar panel showing up to 5 files from across the Architecture that are semantically similar to the viewed file.
2. THE similarity determination SHALL be based on comparing file names, tags, folder paths, and AI summaries.
3. EACH entry in the sidebar SHALL display the similar file's name, folder path, and file type.
4. THE File Portal SHALL display the sidebar only when at least one similar file exists that the user has permission to view.

---

### Requirement 31: Batch Upload with Bulk Routing

**User Story:** As an Admin or Mod, I want to upload multiple files at once and review all routing decisions in a single screen, so that I can efficiently process large batches of files without handling each one individually.

#### Acceptance Criteria

1. WHEN a user uploads multiple files simultaneously through the File Portal, THE Upload Router SHALL process each file and group the results into three tiers: files placed automatically with a Confidence Score above the Placement Threshold, files requiring the user to select a Category, and files with no suitable Category match.
2. THE IntakeFlow SHALL present a single Bulk Routing review screen showing all three groups after processing is complete.
3. WHEN the user confirms automatic placements on the Bulk Routing review screen, THE IntakeFlow SHALL finalize all high-confidence placements in one action.
4. THE IntakeFlow SHALL require the user to resolve each uncertain and unmatched file individually before the batch upload is considered complete.

---

### Requirement 32: Register Existing Drive Files

**User Story:** As an Admin or Mod, I want to register files already in Google Drive into the Architecture, so that pre-existing Drive content becomes accessible and organized through the portal without re-uploading.

#### Acceptance Criteria

1. THE IntakeFlow SHALL allow users with the Admin or Mod Role to select files already present in the connected Google Drive that are outside the managed Architecture and register them into the Architecture.
2. WHEN an existing Drive file is registered, THE IntakeFlow SHALL link the file's existing Drive File ID in the Metadata Store without re-uploading the file binary.
3. WHEN an existing Drive file is registered, THE Upload Router SHALL analyze the file and suggest a Category placement using the same routing logic applied to uploaded files.

---

### Requirement 33: Upload Notes

**User Story:** As an uploader, I want to add a short note to a file when I upload it, so that other users understand the context or purpose of the file without having to open it.

#### Acceptance Criteria

1. THE File Portal SHALL provide an optional text input during the upload flow that allows the uploader to add a note of up to 280 characters describing the file.
2. THE IntakeFlow SHALL store the Upload Note in the Metadata Store and SHALL NOT write the note to Google Drive.
3. THE File Portal SHALL display the Upload Note in the file detail view for all users who have permission to view the file.

---

### Requirement 34: Drag-and-Drop Upload to Specific Folder

**User Story:** As an Admin or Mod, I want to drag files directly onto a folder in the File Portal to upload them there, so that I can bypass automated routing when I already know where a file belongs.

#### Acceptance Criteria

1. WHEN a user is browsing a folder in the File Portal, THE File Portal SHALL accept files dragged from the user's local machine and dropped onto the folder view as an upload action targeting that specific folder.
2. WHEN a file is uploaded via drag-and-drop onto a specific folder, THE IntakeFlow SHALL place the file in that folder directly, bypassing the automated Upload Router routing flow.
3. WHEN a file is uploaded via drag-and-drop, THE Upload Router SHALL check the Metadata Store for potential duplicates in the target folder before completing the upload, using the same Duplicate Detection logic defined in Requirement 35.

---

### Requirement 35: Duplicate Detection

**User Story:** As an uploader, I want to be warned before uploading a file that already exists in the target folder, so that I can avoid creating redundant copies in the Architecture.

#### Acceptance Criteria

1. WHEN the Upload Router is about to place a file into a Category, THE Upload Router SHALL query the Metadata Store for existing files in that Category with the same filename and a file size within 5% of the uploaded file's size.
2. WHEN a potential duplicate is found, THE IntakeFlow SHALL display a warning to the uploader showing the existing file's name, the name of the user who uploaded it, and the upload date.
3. WHEN a duplicate warning is displayed, THE IntakeFlow SHALL require the uploader to explicitly confirm whether to proceed with the upload or cancel it before completing the placement.

---

### Requirement 36: Upload History

**User Story:** As a user, I want to view a history of all files I have uploaded, so that I can track my contributions and check the status of past uploads.

#### Acceptance Criteria

1. THE IntakeFlow SHALL provide each authenticated user with a personal Upload History page.
2. THE Upload History page SHALL display all files the user has uploaded, showing the file name, upload date, placement Category, and placement status (placed, pending, or failed) for each entry.
3. THE Upload History page SHALL display entries in reverse chronological order with the most recent uploads first.
4. THE Upload History page SHALL paginate results when the total number of entries exceeds a single page.

---

### Requirement 37: AI Rename Suggestion

**User Story:** As an uploader, I want the system to suggest a cleaner filename when my uploaded file has a vague or inconsistent name, so that the Architecture maintains consistent and meaningful file naming.

#### Acceptance Criteria

1. WHEN a file is uploaded, THE Upload Router SHALL evaluate the filename for vagueness, inconsistency with the club's naming conventions, or common noise patterns such as "final_FINAL_v3", "copy of", or "untitled".
2. WHEN the Upload Router determines the filename meets the criteria for an AI Rename Suggestion, THE IntakeFlow SHALL present the suggested canonical filename to the uploader before placement is confirmed.
3. WHEN an AI Rename Suggestion is presented, THE IntakeFlow SHALL allow the uploader to accept the suggestion, edit the suggestion, or keep the original filename before confirming placement.

---

### Requirement 38: AI File Summary

**User Story:** As a user, I want to see a brief AI-generated summary of a file's content in the file detail view, so that I can understand what a file contains without opening it.

#### Acceptance Criteria

1. WHEN a file of a supported type (PDF, Google Docs, Google Slides, or plain text) is uploaded or registered and its size does not exceed 10 MB, THE IntakeFlow SHALL use Gemini to generate a single concise sentence summarizing the file content.
2. THE IntakeFlow SHALL store the AI Summary in the Metadata Store and SHALL display it in the file detail view.
3. IF a file exceeds 10 MB, is binary, or is of an unsupported type (including .csv, .xlsx, images, and video), THEN THE IntakeFlow SHALL not generate an AI Summary for that file.

---

### Requirement 39: AI Folder Description

**User Story:** As a user browsing the File Portal, I want to see a brief description of each folder's purpose, so that I can understand what belongs in a folder without opening it.

#### Acceptance Criteria

1. WHEN a new Category is created in the Architecture, THE AI Architect SHALL generate a single concise sentence describing the purpose of the folder based on its name and position in the hierarchy.
2. THE IntakeFlow SHALL store the Folder Description in the Metadata Store and SHALL display it as a subtitle under the folder name in the File Portal.
3. THE IntakeFlow SHALL allow users with the Admin Role to manually edit the Folder Description for any Category.

---

### Requirement 40: "Why Here?" Confidence Explanation

**User Story:** As an uploader, I want to understand why the system placed my file in a particular folder, so that I can trust the routing decision or correct it if it seems wrong.

#### Acceptance Criteria

1. WHEN the Upload Router automatically places a file in a Category, THE IntakeFlow SHALL generate a plain-English explanation of the routing decision using Gemini and store it with the placement record.
2. THE File Portal SHALL display a "Why here?" tooltip on the placement confirmation that shows the stored routing explanation when the uploader activates it.
3. THE routing explanation SHALL describe the specific signals used in the placement decision, such as filename keywords and file type.

---

### Requirement 41: AI Re-organization Suggestions (Admin Only)

**User Story:** As an Admin, I want the AI to suggest ways to clean up the Architecture when it becomes disorganized, so that I can maintain a tidy folder structure without manually auditing every folder.

#### Acceptance Criteria

1. WHEN an Admin triggers an on-demand re-organization analysis, THE AI Architect SHALL analyze the current Architecture and recent file placements and generate a suggested cleanup plan.
2. WHEN the Unsorted folder contains more than 10 files, THE IntakeFlow SHALL automatically trigger a re-organization analysis and surface the resulting suggestions to the Admin.
3. THE suggested cleanup plan SHALL include: files recommended for relocation, folders recommended for merging or renaming, and new Categories recommended for creation.
4. THE IntakeFlow SHALL display Re-organization Suggestions only to users with the Admin Role in a dedicated review panel.
5. THE IntakeFlow SHALL allow the Admin to accept individual suggestions or dismiss them independently.

---

### Requirement 42: Smart Folder Naming

**User Story:** As an Admin or Mod, I want the system to suggest a normalized folder name when I create a new Category, so that the Architecture maintains consistent naming conventions automatically.

#### Acceptance Criteria

1. WHEN a user enters a new Category name during upload routing, architecture editing, or a Mod suggestion, THE AI Architect SHALL compare the entered name against the naming conventions of the existing Architecture, including casing, separators, and verbosity.
2. WHEN the entered Category name deviates from the detected naming conventions, THE IntakeFlow SHALL display a normalized name suggestion inline alongside the entered name.
3. THE IntakeFlow SHALL allow the user to accept the Smart Folder Naming suggestion or ignore it and proceed with the originally entered name.

---

### Requirement 43: File Request

**User Story:** As a Member, I want to submit a request for a specific file, so that I can ask Admins or Mods to upload documents I need without having to contact them outside the platform.

#### Acceptance Criteria

1. THE IntakeFlow SHALL allow users with the Member Role to submit a File Request by entering a short description of the file they need.
2. WHEN a File Request is submitted, THE IntakeFlow SHALL surface the request in the notification center for all users with the Admin or Mod Role.
3. WHEN an Admin or Mod uploads a file and links it to an open File Request, THE IntakeFlow SHALL notify the requesting Member that their request has been fulfilled.

---

### Requirement 44: Access Request Flow

**User Story:** As a Member or Mod, I want to request access to a restricted folder, so that I can ask an Admin to grant me permission without needing to contact them outside the platform.

#### Acceptance Criteria

1. WHEN a Member or Mod encounters a folder they do not have permission to view in the File Portal, THE File Portal SHALL display a "Request Access" option for that folder.
2. WHEN a user submits an Access Request, THE IntakeFlow SHALL send the request to the Notification Center for all users with the Admin Role.
3. WHEN an Admin approves an Access Request, THE IntakeFlow SHALL immediately update the requesting user's permissions to grant access to the restricted Category.
4. WHEN an Admin denies an Access Request, THE IntakeFlow SHALL notify the requesting user that their request was denied.

---

### Requirement 45: In-App Notification Center

**User Story:** As an authenticated user, I want an in-app notification center, so that I can stay informed about activity relevant to my role without leaving the platform.

#### Acceptance Criteria

1. THE IntakeFlow SHALL provide a Notification Center accessible to all authenticated users via a bell icon in the portal navigation.
2. THE Notification Center SHALL surface the following notification types based on the user's Role: new files in folders the user has favorited or been granted individual access to (all Roles); pending File Requests (Admin and Mod); pending Category approval requests (Admin); Structural Drift alerts (Admin); and Access Request notifications (Admin).
3. WHEN a user views a notification in the Notification Center, THE IntakeFlow SHALL mark that notification as read.
4. THE IntakeFlow SHALL allow users to dismiss individual notifications from the Notification Center.

---

### Requirement 46: Uploader Attribution

**User Story:** As a user browsing the File Portal, I want to see who uploaded each file and when, so that I know who to contact if I have questions about a file's content.

#### Acceptance Criteria

1. THE IntakeFlow SHALL record the uploading user's identity and the upload timestamp in the Metadata Store at the time a file is placed in the Architecture.
2. THE File Portal SHALL display the uploader's name and upload date on every file visible to an authenticated user, subject to that user's Role-based permission to view the file.

---

### Requirement 47: Dark Mode

**User Story:** As a user, I want to switch the File Portal to a dark color theme, so that I can use the platform comfortably in low-light environments.

#### Acceptance Criteria

1. THE File Portal SHALL support a dark mode theme in addition to the default light mode theme.
2. THE IntakeFlow SHALL allow users to toggle dark mode from their profile settings.
3. WHILE dark mode is active, THE File Portal SHALL apply a palette using muted, low-contrast tones rather than pure black backgrounds.
4. THE IntakeFlow SHALL persist the user's dark mode preference across sessions.

---

### Requirement 48: First-Login Orientation

**User Story:** As a new user, I want a brief orientation when I first log in, so that I can quickly locate the key areas of the interface without reading documentation.

#### Acceptance Criteria

1. WHEN a user logs in to IntakeFlow for the first time, THE IntakeFlow SHALL display a First-Login Orientation overlay that highlights three interface elements: the folder tree, the search bar, and the Quick Access section.
2. THE First-Login Orientation overlay SHALL be dismissible by the user at any time.
3. THE First-Login Orientation overlay SHALL complete automatically in under 20 seconds if the user does not interact with it.
4. THE First-Login Orientation overlay SHALL indicate the location of each highlighted element without explaining how to use it.
5. THE IntakeFlow SHALL display the First-Login Orientation overlay only once per user account.

---

### Requirement 49: Club Activity Dashboard (Admin)

**User Story:** As an Admin, I want a compact activity dashboard showing key metrics about my club's file system, so that I can monitor the health and activity of the platform at a glance.

#### Acceptance Criteria

1. THE IntakeFlow SHALL provide a Club Activity Dashboard accessible only to users with the Admin Role.
2. THE Club Activity Dashboard SHALL display the following metrics: total files in the Architecture, number of files uploaded in the last 30 days, top 3 uploaders by file count, and count of unresolved items including Unsorted files, Structural Drift items, and pending requests.
3. WHEN a metric has no meaningful value (e.g., zero uploads in the last 30 days for a new club), THE Club Activity Dashboard SHALL omit that widget rather than displaying an empty or zero-value widget.

---

### Requirement 50: "New Since Last Visit" Badge

**User Story:** As a user, I want to see which files and folders are new since my last visit, so that I can quickly identify what has changed without reviewing the entire folder tree.

#### Acceptance Criteria

1. THE File Portal SHALL display a "New" badge on files and folders that were added or modified since the authenticated user's most recent login session.
2. THE "New" badge SHALL be displayed for up to 7 days after the file or folder was added or modified.
3. WHEN a user views a file or folder marked with a "New" badge, THE IntakeFlow SHALL dismiss the badge for that user on that item.
