# Beat Lounge Pro

Full Project Brief — Beatmaker Website & Beat Marketplace MVP
1. IMPORTANT — START BY ANALYZING THE EXISTING PROJECT
I am uploading a ZIP file containing an existing web project.
Do NOT start from scratch.
First, inspect and understand the entire existing codebase:
Project structure
Framework and libraries
Existing components
Existing pages
Existing styling
Existing database/backend logic, if any
Existing assets
Existing routing
Existing functionality
Existing dependencies
Existing environment configuration
Then determine what can be preserved, what should be refactored, and what needs to be added.
The goal is to continue and significantly improve the existing project, not unnecessarily rebuild everything from zero.
Before making major architectural changes, understand the existing implementation.
2. PROJECT OBJECTIVE
This project is for a professional music producer / beatmaker.
The website should allow the producer to:
Showcase and sell beats
Upload and manage beats through an admin dashboard
Present professional beat artwork
Let visitors listen to beat previews
Let users create accounts
Let users like beats
Let users comment on beats
Track engagement and analytics
Allow interested users to contact the producer through WhatsApp
For the MVP, do NOT implement online payment processing yet.
Instead, users interested in purchasing a beat should be redirected to WhatsApp with a pre-filled message identifying the beat.
However, the architecture should be designed so that a real payment provider can be added later without rebuilding the application.
3. TECHNOLOGY / ARCHITECTURE
Use the existing project's framework where practical.
Use:
Supabase for backend infrastructure
Supabase Auth for authentication
Supabase PostgreSQL for application data
Supabase Storage for audio files and cover images
Supabase Row Level Security (RLS) for authorization
Supabase Realtime where useful, especially for online presence
The application should be production-oriented and maintainable.
Do not expose secret keys or privileged credentials in client-side code.
Use environment variables correctly.
4. NEW VISUAL DESIGN
The current visual style is not approved by the client.
The existing website should receive a major visual redesign.
Do not simply change the background color.
Create a completely coherent modern visual identity suitable for a professional music producer / beatmaker.
The design should feel:
Modern
Premium
Musical
Creative
Minimal
Professional
Dark / atmospheric if appropriate
Strong visual hierarchy
Excellent typography
High-quality spacing
Smooth but restrained animations
Create a coherent design system covering:
Colors
Typography
Buttons
Cards
Navigation
Forms
Audio player
Modals
Dashboard
Tables
Badges
Inputs
Empty states
Loading states
Error states
Make the design responsive and mobile-first.
Do not make the interface look like a generic SaaS dashboard.
The public website should feel like a real professional music brand.
5. PUBLIC WEBSITE
Create/refactor the following public-facing pages.
Home
Include:
Strong hero section
Producer/artist branding
Short introduction
Featured beats
Popular beats
Call-to-action
Link to browse all beats
WhatsApp contact CTA
The hero should immediately communicate what the producer does.
Example concept:
"Premium Beats for Artists Who Want Their Sound to Stand Out."
Do not copy this exact wording if the existing branding suggests something better.
6. BEATS CATALOG
Create a dedicated /beats or equivalent page.
Users should be able to:
Browse all published beats
Search beats
Filter beats
Sort beats
Useful filters:
Genre
Mood
BPM
Price
Popularity
Newest
Each beat card should display:
Cover image
Beat title
Genre
BPM
Price / starting price
Play button
Like button
Number of likes
Number of plays/views if appropriate
CTA
Cards should look excellent on both desktop and mobile.
7. BEAT DETAILS PAGE
Every beat should have its own dedicated page.
Example:
/beats/beat-name
Display:
Large cover image
Beat title
Producer name
Description
Genre
BPM
Mood
Tags
Price/licensing information
Audio player
Like button
Like count
Play count
Comments
WhatsApp purchase/contact button
The page should clearly communicate that the user can contact the producer to purchase the beat.
8. AUDIO PLAYER
Implement a professional audio preview player.
It should support:
Play
Pause
Progress bar
Current time
Duration
Volume
Mobile-friendly controls
Track audio engagement.
When a user starts playing a beat, record an analytics event such as:
beat_play
Do not count every tiny interaction as a new play.
Use reasonable event handling to avoid artificially inflating statistics.
9. USER AUTHENTICATION
Every user should be able to create an account.
Use Supabase Auth.
Implement:
Sign up
Login
Logout
Password reset
Session persistence
Protected user pages
Users should have profiles.
Suggested user fields:
id
email
display_name
avatar_url
created_at
updated_at
Users must be authenticated before performing social actions such as:
Like
Comment
Browsing and listening to public beats can remain available to visitors.
10. USER PROFILE
Create a user profile/dashboard.
Users should be able to see:
Their profile information
Liked beats
Recently interacted-with beats if practical
Their comments
Account information
Keep this interface simple and clean.
11. LIKES
Users should be able to like/unlike beats.
Requirements:
One user can have only one like per beat.
Users must be authenticated to like.
Like/unlike should update the UI immediately where practical.
Prevent duplicate likes at the database level.
Display like counts.
Create an appropriate database relationship/table for this.
Do not rely only on frontend logic to prevent duplicate likes.
12. COMMENTS
Users should be able to comment on beats.
Each comment should include:
User
Beat
Content
Created date
Requirements:
Authentication required
Users can delete their own comments
Admin can delete/moderate any comment
Prevent empty comments
Basic input validation
Reasonable character limit
Secure database policies
Display comments clearly
Include loading, empty, and error states.
13. WHATSAPP PURCHASE / CONTACT FLOW
For now, do NOT implement Stripe or another online payment provider.
Instead, create a WhatsApp CTA.
When the user clicks:
"Purchase / Inquire About This Beat"
open WhatsApp with a pre-filled message.
The message should automatically include:
Beat name
Producer name
User's name if available
Optional beat ID
Example:
"Hello, I'm interested in purchasing the beat '[Beat Name]'. I found it on your website and would like to know the available licenses and pricing."
Use a configurable WhatsApp phone number rather than hardcoding it in multiple components.
The WhatsApp number should ideally be stored in a configuration/settings system.
Track the event:
whatsapp_click
This will allow the admin to measure purchase interest.
14. ADMIN SYSTEM
Create a secure admin dashboard.
There must be a clear separation between:
Regular users
Administrators
Do not rely solely on hiding frontend routes.
Use Supabase authorization/RLS properly.
The admin dashboard should include:
Overview
Beats
Add Beat
Edit Beat
Users
Comments
Analytics
Settings
15. ADMIN — BEAT MANAGEMENT
The admin must be able to create a beat.
Fields:
Title
Description
Genre
Mood
BPM
Price
License information
Tags
Cover image
Audio file
Published / Draft status
The admin should be able to:
Upload audio
Upload cover image
Preview the beat
Save draft
Publish
Unpublish
Edit
Delete
Use Supabase Storage for media files.
Organize storage logically.
For example:
covers/
beats/
Do not store large audio files directly inside PostgreSQL.
16. ADMIN — BEAT EDITOR
Create a clean admin form for editing beats.
The admin should be able to change:
Title
Description
Metadata
Cover
Audio
Price
Tags
Publication status
Show clear upload progress and success/error states.
Confirm destructive actions such as deleting a beat.
17. ADMIN DASHBOARD — OVERVIEW
Create an analytics overview dashboard.
Display useful KPIs such as:
Total registered users
Active users
Total published beats
Total views
Total plays
Total likes
Total comments
WhatsApp inquiries/clicks
Also show:
Most popular beats
Most played beats
Most liked beats
Most commented beats
Most contacted beats
Use charts where they genuinely improve understanding.
Do not add decorative charts with meaningless data.
18. ANALYTICS SYSTEM
Implement an event-based analytics system.
At minimum track:
beat_view
beat_play
beat_like
beat_unlike
beat_comment
whatsapp_click
Potentially:
user_signup
user_login
The database should store enough information to calculate meaningful statistics.
For example:
user_id when authenticated
beat_id where relevant
event_type
timestamp
optional anonymous/session identifier when appropriate
Avoid collecting unnecessary personal information.
19. ANALYTICS PER BEAT
The admin should be able to open a beat and see detailed statistics.
Example:
Beat Analytics
Views: 1,240
Plays: 720
Likes: 94
Comments: 18
WhatsApp inquiries: 31
Then calculate useful metrics such as:
Play rate
Like rate
Comment rate
WhatsApp inquiry rate
Example:
Play Rate = Plays / Views
Engagement Rate = (Likes + Comments) / Views
Inquiry Rate = WhatsApp Clicks / Views
Also show trends over time when enough data exists.
For example:
Last 7 days
Last 30 days
All time
20. ONLINE USERS / PRESENCE
The admin should be able to see an approximation of currently online users.
Use Supabase Realtime presence if appropriate.
Clearly distinguish:
Total registered users
Currently online users
Recently active users
Do not pretend that a user is "online" indefinitely after they close the browser.
Use reasonable presence expiration/heartbeat behavior.
21. ADMIN — USER MANAGEMENT
Create a user management page.
The admin should be able to see:
User name
Email
Account creation date
Recent activity
Likes/comments count where useful
Do not expose unnecessary sensitive information.
The admin should be able to manage/moderate users where appropriate, but do not create destructive capabilities unless necessary.
22. ADMIN — COMMENT MODERATION
Admin should be able to:
View comments
See which beat they belong to
See the author
Delete inappropriate comments
Keep moderation simple for the MVP.
23. DATABASE DESIGN
Create a clean relational Supabase database.
At minimum consider tables similar to:
profiles
id
display_name
avatar_url
role
created_at
updated_at
beats
id
title
slug
description
genre
mood
bpm
price
cover_url
audio_url
status
created_at
updated_at
published_at
likes
id
user_id
beat_id
created_at
Add a unique constraint on:
user_id + beat_id
comments
id
user_id
beat_id
content
created_at
updated_at
analytics_events
id
event_type
user_id nullable
beat_id nullable
session_id nullable
created_at
Adjust the schema based on the existing project where appropriate.
Do not blindly create duplicate tables if equivalent structures already exist.
24. SUPABASE SECURITY
This is extremely important.
Implement proper Row Level Security policies.
Examples:
Users can:
Read published beats
Read appropriate public profile information
Create their own likes
Delete their own likes
Create their own comments
Delete their own comments
Read their own private account data
Admins can:
Manage beats
Moderate comments
Access appropriate analytics
Manage appropriate administrative data
Do NOT expose service-role credentials to the browser.
Do NOT bypass RLS simply to make the application work.
25. MEDIA SECURITY
Be careful with audio files.
The public should be able to listen to the intended preview audio.
But the architecture should allow the producer to later introduce:
Protected full-length files
Paid downloads
License-specific downloads
Do not accidentally expose private production files if the uploaded files contain material intended only for buyers.
26. SEARCH / DISCOVERY
Implement a good discovery experience.
Search by:
Beat title
Genre
Mood
Tags
Provide useful empty states.
Example:
"No beats found. Try another genre, mood, or keyword."
27. RESPONSIVE DESIGN
The entire application must work properly on:
Mobile phones
Tablets
Laptops
Large desktop screens
Pay special attention to:
Audio player
Beat cards
Navigation
Authentication
Comments
Admin tables
Upload forms
Analytics charts
Do not simply shrink the desktop interface.
Design mobile layouts intentionally.
28. UX DETAILS
Include proper:
Loading states
Skeletons where useful
Empty states
Error states
Success notifications
Form validation
Confirmation dialogs
Disabled states
Upload progress
Responsive navigation
Avoid excessive animations.
Animations should support the experience rather than distract from the music.
29. PERFORMANCE
Optimize the application.
Pay attention to:
Image optimization
Lazy loading
Audio loading
Database queries
Pagination where appropriate
Avoid unnecessary re-renders
Avoid fetching all analytics events when aggregated queries are sufficient
The beats catalog should remain fast even with hundreds of beats.
30. SEO
Implement basic SEO for public beat pages.
Each beat should have:
Unique title
Meta description
SEO-friendly slug
Open Graph metadata where practical
Use meaningful URLs.
Example:
/beats/summer-nights
rather than:
/beat?id=38473
31. ACCESSIBILITY
Follow reasonable accessibility practices.
Include:
Proper semantic HTML
Keyboard navigation
Accessible buttons
Labels for inputs
Sufficient contrast
Alt text for images
Accessible audio controls
Visible focus states
32. ERROR HANDLING
Do not allow silent failures.
Handle:
Failed login
Failed signup
Failed uploads
Failed database operations
Failed image loading
Failed audio loading
Failed comments
Failed likes
Failed analytics events
Analytics failures should not break the main user experience.
For example, if an analytics event fails, the beat should still play.
33. FUTURE PAYMENT ARCHITECTURE
Do NOT implement online payments right now.
However, structure the application so that later we can add:
Online checkout
Multiple licenses
Payment confirmation
Automatic file delivery
Order history
Purchase history
Do not tightly couple the current WhatsApp flow to the entire purchasing architecture.
Create a clear abstraction or service layer where appropriate.
34. FUTURE LICENSING SYSTEM
The system should eventually support different licenses, such as:
Basic
Premium
Exclusive
For the MVP, it is enough to display licensing information and direct the user to WhatsApp.
Do not build a complicated licensing engine unless necessary.
35. ADMIN SETTINGS
Create a basic settings area for configurable information such as:
Producer name
Producer bio
WhatsApp number
Social media links
Contact email
Website branding information
Avoid hardcoding these values throughout the application.
36. DATA VALIDATION
Validate all important inputs.
Examples:
Beat title required
Audio file type validation
Image file type validation
Reasonable file size limits
BPM must be numeric and within a reasonable range
Price must be numeric
Comment length limits
Required fields
Do validation both client-side and server-side/database-side where appropriate.
37. DO NOT OVERENGINEER
This is an MVP for a real client.
Prioritize:
Professional appearance
Reliability
Clean UX
Core beat management
Authentication
Likes/comments
Analytics
WhatsApp purchase flow
Mobile responsiveness
Maintainable architecture
Do not build unnecessary features just because they are technically possible.
38. IMPORTANT IMPLEMENTATION ORDER
Work in logical phases.
Phase 1
Analyze the existing ZIP and architecture.
Phase 2
Redesign the visual system and public interface.
Phase 3
Integrate Supabase.
Phase 4
Implement authentication and user roles.
Phase 5
Implement beat database + Supabase Storage.
Phase 6
Implement admin beat management.
Phase 7
Implement user interactions:
Likes
Comments
Profiles
Phase 8
Implement analytics/event tracking.
Phase 9
Implement admin analytics dashboard.
Phase 10
Implement WhatsApp purchase/contact flow.
Phase 11
Responsive/mobile optimization.
Phase 12
Security audit, RLS review, error handling and final UX polish.
39. IMPORTANT: DO NOT DESTROY EXISTING FUNCTIONALITY
Before replacing an existing component or feature, determine whether it is still useful.
Reuse existing code when it is well implemented.
Refactor when necessary.
Remove obsolete code only when you are confident it is no longer required.
Avoid introducing unnecessary dependencies.
40. FINAL QUALITY REQUIREMENT
The final result should NOT feel like:
"an AI-generated template."
It should feel like a professionally designed website for a real music producer.
The public-facing experience should prioritize the music and the beats.
The admin experience should prioritize efficiency and useful data.
The user experience should prioritize:
Discover → Listen → Engage → Contact → Purchase
The producer experience should prioritize:
Upload → Publish → Track → Engage → Sell
41. BEFORE CONSIDERING THE PROJECT COMPLETE
Verify that:
The existing project builds successfully.
No major existing functionality was accidentally broken.
Supabase connection works.
Authentication works.
User roles work.
RLS policies are properly configured.
Admin routes are protected.
Beat uploads work.
Cover uploads work.
Audio uploads work.
Beat publishing works.
Beat editing works.
Beat deletion works.
Audio playback works.
Likes work.
Duplicate likes are prevented.
Comments work.
Comment moderation works.
Analytics events are recorded.
Beat analytics are calculated correctly.
WhatsApp links work.
Mobile layout works.
Error states work.
Loading states work.
SEO metadata exists for public beat pages.
No secret keys are exposed.
No obvious console errors remain.
If something cannot be completed because it requires a credential, API key, Supabase configuration, or external service setup, do not fake it.
Clearly identify what configuration is required from me.
42. IMPORTANT FINAL INSTRUCTION
Do not just generate the UI.
Build the actual working application architecture.
Use real Supabase integration where required.
Do not create fake analytics numbers.
Do not use fake authentication.
Do not create fake database operations.
Do not hardcode data that should come from Supabase.
If you need to make reasonable implementation decisions that are not explicitly specified above, choose the simplest production-quality solution that fits the architecture.
Start by inspecting the uploaded ZIP and understanding the existing project before implementing changes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c9c6f0e6-5c94-4715-b74f-e5a88f37ffee).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
