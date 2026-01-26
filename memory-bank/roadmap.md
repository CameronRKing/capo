# Phased Implementation Roadmap

## Phase 1: Foundation - Schema & Storage (Week 1)

**Demo:** "Developers can define a model using Zod schemas and automatically get a database table with client-side and server-side validation running"

**Requirements:**
- Schema-Definition: Zod Schema Definition
- Schema-Definition: Database Table Instantiation
- Schema-Definition: Cross-Boundary Validation
- Schema-Definition: Validation Performance
- Schema-Definition: Data Integrity and Reliability

**Success Criteria:**
- Developer writes a Zod schema → Convex table is created automatically
- Client-side validation provides immediate feedback (<50ms)
- Server-side validation rejects invalid mutations with clear error messages
- Schema evolution (add/remove fields) migrates existing data safely
- Unit tests verify validation consistency across client/server boundaries

---

## Phase 2: Auto-Generated CRUD UI (Week 2)

**Demo:** "Users can create, read, update, and delete model instances through automatically generated forms, cards, and tables without writing any UI code"

**Requirements:**
- Domain-Expansion: Dynamic Component Mapping
- Domain-Expansion: Property Input Components
- Domain-Expansion: Property Presenter Components
- Domain-Expansion: Model Utility Components (Card, Form, Table)
- Domain-Expansion: Validation Integration
- Domain-Expansion: Component Generation Performance

**Success Criteria:**
- Introspect Zod schema → generate appropriate input/presenter components for each property type
- Render Card component → displays all model properties using presenters
- Render Form component → validates and submits mutations to backend
- Render Table component → displays all model instances with inline editing
- Schema introspection completes in <100ms
- Table renders 100 rows in <1 second
- All components display validation errors inline

---

## Phase 3: Foundation Security (Week 3)

**Demo:** "Each user sees only their own data, and unauthorized access attempts are automatically rejected"

**Requirements:**
- RBAC-Security: Row-Level Security Policies
- RBAC-Security: CRUD Security Helpers
- RBAC-Security: Security Baseline (TLS, Auth, Rate Limiting)
- RBAC-Security: Security Performance

**Success Criteria:**
- Define read policy (e.g., `users can only read documents they own`) → policy is enforced
- Define write policy → unauthorized mutations are rejected
- User's access is revoked → data immediately disappears from their queries
- All connections use TLS 1.2+
- Rate limiting throttles at 1000 requests/minute
- Policy evaluation adds <50ms overhead
- Security tests verify policies enforce correctly

---

## Phase 4: Role-Based Access Control (Week 4)

**Demo:** "Administrators can assign users predefined roles (owner/editor/viewer) with appropriate permissions, and custom roles can be defined for specific needs"

**Requirements:**
- RBAC-Security: Role-Based Access Control
- RBAC-Security: Policy Definition Syntax
- RBAC-Security: Security Policy Testing

**Success Criteria:**
- Assign user to "viewer" role → they can read but not write
- Assign user to "editor" role → they can read and write
- Assign user to "owner" role → they have full permissions
- Define custom role → role is available for assignment
- User with multiple roles → receives union of all permissions
- Policy tests verify each user context receives appropriate data

---

## Phase 5: Basic Notebook (Week 5)

**Demo:** "Users can create multi-page notebooks with a hierarchical document tree, and all changes are automatically saved"

**Requirements:**
- Notebook-Infrastructure: Domain Explorer
- Notebook-Infrastructure: Document Tree
- Notebook-Infrastructure: Notebook Persistence
- Notebook-Infrastructure: Notebook Performance (basic)
- Notebook-Infrastructure: Storage and Caching (page caching)

**Success Criteria:**
- Domain explorer displays all registered models with descriptions
- Drag model component from explorer → component is added to page
- Create document tree with folders and pages → structure persists
- Navigate tree → page loads within 2 seconds
- Edit page content → changes auto-save every 30 seconds
- Close tab and reopen → all changes are restored
- Page loads from cache in <200ms when revisited within 10 minutes

---

## Phase 6: Sharing & Collaboration (Week 6-7)

**Demo:** "Users can share their notebooks with colleagues, who see changes in real-time with presence indicators showing who is viewing which properties"

**Requirements:**
- Notebook-Infrastructure: Document Forest (Sharing)
- Real-Time-Collaboration: Domain-Based Presence Tracking
- Real-Time-Collaboration: User Presence Indicators (FacePile, ActivityList)
- Real-Time-Collaboration: Collaborative Editing States
- Real-Time-Collaboration: Real-Time Data Synchronization (Live mode)

**Success Criteria:**
- Share notebook with another user → notebook appears in their document forest
- Set permissions (view/edit/admin) → permissions are enforced
- User focuses on property → other users see focus indicator with their avatar
- Multiple users view same model → FacePile shows all active users
- User edits property in Live mode → all clients see change within 500ms
- Presence updates broadcast within 100ms to 95% of users
- 100 concurrent users → system remains responsive

---

## Phase 7: Conflict Resolution & Advanced Collaboration (Week 8)

**Demo:** "Multiple users can edit simultaneously without losing work, and users can jump to or follow collaborators to see what they're working on"

**Requirements:**
- Real-Time-Collaboration: Conflict Resolution
- Real-Time-Collaboration: Collaboration Utilities (Jump to View, Follow User)
- Real-Time-Collaboration: Reliability and Availability

**Success Criteria:**
- Two users edit same text field → last-write-wins with notification to loser
- Two users edit different parts of rich text → changes merge correctly using CRDT
- Click on collaborator's focus indicator → navigate to their view
- Enable "follow user" mode → view switches to match followed user's navigation
- Network drops and reconnects within 5 seconds → user rejoins session, missed updates sync
- System maintains 99.9% uptime for presence/sync services

---

## Phase 8: Version Control & Undo (Week 9)

**Demo:** "Users can undo any mistake, and administrators can restore data from hourly checkpoints if needed"

**Requirements:**
- Change-Management: Universal Undo/Redo
- Change-Management: Change Tracking Metadata
- Change-Management: Automatic Checkpoints

**Success Criteria:**
- User performs undo → only their changes revert, not other users'
- User performs workspace undo → most recent change reverts for everyone
- User performs redo → undone changes reapply in reverse order
- All changes track who, when, and what changed
- Configure hourly checkpoints → snapshots created every hour
- Restore checkpoint → data reverts to checkpoint state
- Undo/redo operations complete within 200ms

---

## Phase 9: Enterprise Compliance (Week 10)

**Demo:** "Security teams can audit who accessed what data and when, and retention policies automatically prune history to meet compliance requirements"

**Requirements:**
- Change-Management: Configurable Retention Policies
- Change-Management: Read Auditing
- Change-Management: Pruning and Cleanup
- Change-Management: Change Visualization
- Change-Management: Storage Efficiency

**Success Criteria:**
- Configure 30-day retention → versions older than 30 days auto-delete
- Enable read auditing → all read operations logged with user/timestamp/ID
- Query audit log → filter by user, document, time range
- View document history → timeline shows who/when/what changed
- Compare two versions → differences highlighted
- Storage uses delta encoding → average <1 KB per version
- Compress history older than 30 days → 50% storage reduction

---

## Phase 10: Advanced Security & Privacy (Week 11-12)

**Demo:** "Sensitive fields (SSN, salary) are hidden from users without appropriate permissions, and users can control their privacy settings for presence tracking"

**Requirements:**
- RBAC-Security: Column-Level Security
- Real-Time-Collaboration: Presence Configuration
- Notebook-Infrastructure: Rich Chat System (with E2E encryption)
- Notebook-Infrastructure: Universal Comments System

**Success Criteria:**
- Define column-level policy for sensitive field → unauthorized users can't see field exists
- User without permissions queries model → sensitive fields excluded from response
- User configures presence to "hide" → other users don't see their presence
- Enable E2E encryption for chat → messages encrypted on sender's device
- Comment on any entity → comment persists and shows rich text
- Reply to comment → thread organizes replies chronologically
- User mentioned in comment → receives notification with link

---

## Phase 11: Working Documents & Schema Evolution (Week 13)

**Demo:** "Users can collaborate on draft documents with relaxed validation, then promote them to 'real' status when complete"

**Requirements:**
- Schema-Definition: Working Document Support
- Schema-Definition: Schema Evolution (migrations)

**Success Criteria:**
- Create "working" document → refinements relaxed, types still enforced
- Submit working document with invalid data → clear error messages provided
- Submit working document with valid data → promoted to "real" document
- Modify Zod schema (add field) → migration path provided for existing data
- Deploy schema change → existing data migrated without loss
- Rollback strategy available if migration fails

---

## Phase 12: Polish & Performance Optimization (Week 14)

**Demo:** "Notebooks with 1000+ pages load quickly, and large tables with virtualization maintain 60 FPS while scrolling"

**Requirements:**
- Notebook-Infrastructure: Document Forest (nested sharing)
- Notebook-Infrastructure: Notebook Performance (large scale targets)
- Notebook-Infrastructure: Storage and Caching (optimization)
- Domain-Expansion: Memory Efficiency
- Real-Time-Collaboration: Real-Time Performance Targets (bandwidth optimization)
- Change-Management: Change Management Performance
- Change-Management: Storage Efficiency (compression)

**Success Criteria:**
- Notebook with 1000 pages → any page loads within 2 seconds
- Table with 1000 rows → virtualization maintains 60 FPS while scrolling
- 1000 components mounted → memory usage remains below 500 MB
- Document tree with 1000 pages → renders within 1 second
- Presence updates batched when multiple events occur within 50ms
- Bandwidth usage <1 KB/s for presence updates per user
- History query for 1000 versions → loads within 1 second

---

# REQUIREMENTS TO CUT

## High Complexity, Low Value (For MVP)

1. **Domain-Expansion: TipTap Integration**
   - **Reason**: Advanced feature, significant complexity, can ship without it
   - **Alternative**: Static documents, add in Phase 13+

2. **Domain-Expansion: Action Components**
   - **Reason**: Custom queries/mutations are edge cases, manual UI is acceptable
   - **Alternative**: Build custom UI for actions when needed

3. **Change-Management: User-Facing Snapshots**
   - **Reason**: Power user feature, overlaps with undo/redo and checkpoints
   - **Alternative**: Use checkpoints and version history

4. **Notebook-Infrastructure: Rich Chat System**
   - **Reason**: Complex feature, users can use Slack/Teams for communication
   - **Alternative**: External chat tools, or add in Phase 15+

5. **Notebook-Infrastructure: Universal Comments System**
   - **Reason**: Nice-to-have, can ship notebook without it
   - **Alternative**: Add in Phase 15+ when focusing on community features

---

# BLOCKERS REQUIRING HUMAN DECISION

## 1. RBAC Manager Interface (Phase 5+)
**Issue**: Requirement exists but no scenarios defined for configuring permissions via UI
**Questions**:
- Should RBAC Manager be a separate admin panel or integrated into Domain Explorer?
- How do non-developer admins configure policies without editing code?
- **Decision needed**: UI/UX approach for permission configuration
- **Impact**: Blocks Phase 5 enterprise readiness

## 2. Working Document Submission Flow (Phase 11)
**Issue**: Schema says "promote to real" but UX is undefined
**Questions**:
- What happens when working document is promoted? Does it replace the original?
- Can multiple users collaborate on the same working document?
- How are conflicts resolved when two users submit different working documents?
- **Decision needed**: UX for working document promotion
- **Impact**: Blocks Phase 11

## 3. Security Policy Inheritance (Phase 4+)
**Issue**: Open question asks "How should permission inheritance work for nested models?"
**Questions**:
- If Model A has a field that references Model B, does the user need access to both models?
- What if user has access to Model A but not Model B?
- **Decision needed**: Security model for relationships
- **Impact**: Blocks Phase 4, affects RBAC design

## 4. Conflict Resolution Strategy (Phase 7)
**Issue**: Requirement says "Last-write-wins for scalar values" but no notification UX defined
**Questions**:
- How does the user who "lost" the conflict find out their changes were overwritten?
- Should there be a conflict resolution panel showing both versions?
- Can users restore their overwritten version?
- **Decision needed**: UX for conflict notification and resolution
- **Impact**: Blocks Phase 7

## 5. End-to-End Encryption Key Management (Phase 10)
**Issue**: Requirement says "preferably end-to-end encryption" but no key management strategy
**Questions**:
- Where are encryption keys stored?
- How are keys provisioned for new users?
- What happens when a user loses their device/key?
- **Decision needed**: E2EE implementation approach
- **Impact**: Blocks Phase 10, or may need to cut E2EE entirely

## 6. Performance Target Specifics (Phase 12)
**Issue**: Scenarios reference targets but some are missing specific metrics
**Questions**:
- What's the target for "large notebook page load" (currently says "within 2 seconds") - is this acceptable?
- What's the target for document tree search with 1000 pages (currently "within 500ms") - is this achievable?
- **Decision needed**: Confirm performance targets are achievable
- **Impact**: Phase 12 acceptance criteria

---

# UNDERSPECIFIED REQUIREMENTS

## Need Scenarios Added

1. **Change-Management: Configurable Retention Policies**
   - **Missing**: How are retention policies configured? Via code? UI?
   - **Need**: Scenario for "Configure retention policy"

2. **Change-Management: Pruning and Cleanup**
   - **Missing**: How are users notified of deletions? Can they recover?
   - **Need**: Scenario for "User notification before pruning"

3. **Notebook-Infrastructure: Document Forest (Sharing)**
   - **Missing**: How do users invite others? Email, link, manual add?
   - **Need**: Scenario for "Invite user to shared notebook"

4. **Notebook-Infrastructure: Rich Chat System**
   - **Missing**: How does E2EE work? Key management?
   - **Need**: Scenario for "Provision encryption keys for new user"
   - **Missing**: How are messages organized? Channels? Direct messages?
   - **Need**: Scenario for "Create conversation"

5. **RBAC-Security: Column-Level Security**
   - **Missing**: How does TypeScript typing reflect user-specific column visibility?
   - **Need**: Scenario for "Type generation with column-level security"
   - **Missing**: What happens when a user without permission tries to query a model with only sensitive fields?
   - **Need**: Scenario for "Query model with only sensitive fields"

6. **RBAC-Security: Security Policy Testing**
   - **Missing**: What's the API for running tests with different user contexts?
   - **Need**: Scenario for "Run security test with mock user context"

7. **Real-Time-Collaboration: Presence Configuration**
   - **Missing**: Where are user presence settings configured? UI? API?
   - **Need**: Scenario for "User configures presence privacy settings"

8. **Real-Time-Collaboration: Collaboration Utilities**
   - **Missing**: What happens when user being followed leaves or navigates away?
   - **Need**: Scenario for "Followed user leaves session"

9. **Schema-Definition: Database Table Instantiation**
   - **Missing**: What happens during schema migration if data is invalid?
   - **Need**: Scenario for "Handle invalid data during migration"

10. **Domain-Expansion: Action Components**
    - **Missing**: How does system distinguish between queries that need buttons vs those that don't?
    - **Need**: Scenario for "Suppress action component for specific query"

11. **Domain-Expansion: Property Input Components**
    - **Missing**: How are custom property types registered and mapped to components?
    - **Need**: Scenario for "Register custom property type and component"

---

# SUMMARY

**Total Phases**: 12
**Total Duration**: 14 weeks
**Working Software Delivered**: Every 1-2 weeks
**Critical Path**: Schema → Domain Expansion → RBAC → Notebook → Collaboration → Change Management

**Key Success Factors**:
- ✅ **Foundation is solid** - Schema-Definition, RBAC-Security, Domain-Expansion are all Phase 1-4
- ✅ **Value delivery is early** - Working CRUD by Week 2, sharing by Week 6
- ✅ **Dependencies respected** - Each phase builds on previous capabilities
- ⚠️ **Human decisions needed** - 6 blockers must be resolved before agents can proceed
- ⚠️ **Specs need fleshing out** - 11 requirements need additional scenarios

**Recommended Next Steps**:
1. Resolve 6 human decision blockers (estimated 2-3 hours of discussion)
2. Add missing scenarios for 11 underspecified requirements (estimated 4-6 hours)
3. Begin Phase 1 execution with Schema-Definition foundation

**Risk Mitigation**:
- Cut 5 low-value/high-complexity requirements to reduce scope
- Performance requirements phased to end (can be adjusted based on actual metrics)
- Security baseline in Phase 3 ensures no security debt accumulates

This roadmap enables autonomous AI agents to execute incrementally while delivering value every step of the way.
