# Capo: A Convex Framework for Data-Driven Notebooks

This repository houses an application framework for Convex & React that empowers developers to rapidly ship custom Notion- or Coda-like applications. From the core definition of a model, the framework derives property inputs & presenters, entity cards, forms, & tables. The framework builds in to these components features like automatic realtime validation & user presence (hover/focus/change-made signifiers). Row-level & column-level security policies can be defined & reactively enforced (i.e., the moment a user loses certain access rights, the data automatically disappears from their queries) via helpers that auto-generate CRUD facilities for the model. Finally, the framework provides a TipTap editor extended with inline & block components for looking up & embedding model components, as well as some simple styling components for custom layouts. With a simple shareable notebook ecosystem built on top, non-technical users can quickly find and/or create workspaces for exercising a provided domain model--with automatic persistence, reactivity, collaboration, client-side data caching, universal (client & server) data validation, strong yet flexible access controls, data introspection, and live UI construction.

The goal of Capo is to solve some of the fundamental issues inhibiting current knowledge management solutions: poor private/secure collaboration & limited extensibility. Dropping to the level of code allows developers to extend any and every aspect of the system in whatever way they please, as well as provide whatever access-control mechanisms they so desire. Having a hard-coded base model also provides certain protections against change (unintentional or malicious) that current systems don't always provide.

Ultimately, the goal is an ecosystem of cooperating backend models & the UI notebooks that weave them together as a platform for collaborative cognition.

## High-Level Architecture Overview

### Schema Definition: Zod (via convex-helpers)
Convex schemas specify only types, free from all refinements. Zod gives us greater fidelity in describing data, then, and generates validators that are run both client-side (for quick feedback) & server-side (in mutations, for data integrity).

In the long run, it would probably be better to shift to Standard Schema as the API surface (and perhaps Arktype as the implementation?), so users can choose their preferred shape definition library, but for now, it's okay to ship an opinionated starting build on top of existing glue code.

We may need to provide helpers for database-related validation (e.g., ensuring that an email is unique) that cross server-client boundaries invisibly & effectively, but we'll cross that bridge if/when we come to it.

In addition to instantiating basic tables, we'll also provide a couple database-level services for configuration by developers.

#### Change Management
I can imagine configs like full-history (like datomic), latest-only for the model as whole, latest-only for individual properties, last-x-minutes/hours/days, etc. Automatic checkpoints would be a good idea (e.g., hourly/daily, maybe even minutely for some docs).

In addition to tracking writes, I'm sure some users will want the ability to audit reads, at least of some very sensitive data. That should be trivial to implement here.

It also makes sense to present some kind of user-facing "snapshot" mechanism to track user-versioned copies of specific documents.

Shipping a universal undo/redo also seems like a pretty strong choice, though this too will have its complications.
    - there are several interdependent streams of changes that a user might want to wade through
        - user-specific changes: undoing only the things *I have done* when collaborating with others
        - workspace-level changes: undoing whatever was just done, no matter by whom
        - domain-level changes: undoing whatever was just done by anybody on this specific page/table/column/row/property
    - while we can (probably) provide automatic undo/redo at the level of database transactions, is there any special client-side state that we'll need to track separately & integrate? At this moment, I'm not so sure. Maybe. Maybe not. We'll see. The database-oriented stuff will be challenging enough without jumping ahead into abstract problems that I'm not experiencing yet.

#### Working Docs
A "working" doc is a database-persisted version of a schema with relaxed refinements. Types and property sets are enforced, but all other logic is ignored. The purpose of "working" docs is to enable users to safely collaborate on complex data where states that are technically "invalid" are still useful. We'll then provide form components that take care of synchronization and submission, so client-side it's as simple as "<MyModel.Form sync='working-submit' />" or (sync='working-auto') vs "<MyModel.Form sync='live' />".

I'm not sure yet how working docs should be implemented. The easiest method seems like adding a column to the table, like is_working. There's also the option of a separate database or table. For some reason I'm more drawn to separation than integration at the data-layer. We'll auto-expose a mutation that validates & transacts working docs into "real" docs. Keeping the docs separate makes it easier to track changes when users submit a valid doc, then continue working to make further changes. If we collapsed working & real docs, we'd have to rely on consolidating change management information to construct the appropriate versions. If we keep the docs separate, then they can have separate histories.

#### RBAC (RLS + CLS(?))
Convex-helpers comes with RLS built-in. Column-level security can be implemented by splitting sensitive information into a separate table & using RLS, but that adds a level of complexity. Actually, now that I think about it, is it something that I really need to implement right now? It would add all kinds of complications in terms of type generation & security (preventing clients from seeing definitions for data that they can't access; exposing even the shape of data could be compromising in some situations, I'm sure). But maybe it is a fundamental concern. In terms of query/mutation wrappers, it seems easy to implement. But--the all important but--I don't need it right now, and it would be easy to build in later. So let's leave it. We'll just use the provided RLS helpers for now.

#### Simple Event Triggers
As part of mutation infrastructure, at the very end, there's a layer that describes the current mutation as data, then that mutations queries a set of hard-coded objects that describe how triggers (changes in specific tables, rows, and/or properties; custom mutations) cause actions to be run in response.

There should be an extension point for end users to tinker with their own triggers, but that will require either event-streaming to an orchestrator or rule-querying within mutations. I would prefer event-streaming to an orchestrator, which would be more efficient, and allow for more complex event patterns to be matched against in the long run.

But, for now, for speed & simplicity, we'll simply match mutations to "reactions"--extra logic related to how this concept weaves together with others. This "reactions" layer exposes cross-concept dependencies explicitly & keeps mutations clean/simple, rather than obscuring dependencies by weaving them directly into logic.

Reactions can be strict (they're run as queries rather than as actions; if they fail, the original mutation is rolled back too) or loose (they run as actions rather than queries; if they fail, nothing else changes). Strict reactions are for flexible composition of domain-specific cross-concept logic on top of generic CRUD queries/mutators. I suppose "loose" reactions would be good for things like sending notifications or prompting LLMs.

##### Time-Based Triggers
Oh, if we're going to include event sourcing, we might as well include that most basic & universal of all events, the passing of time. Hard-coded cron jobs are covered by a convex component; exposing cron jobs to users would be a more involved affair for later on down the line. Since I don't need cron jobs for now, we're going to leave that component out. I just wanted to mention it here so that the needs are acknowledge & a decision has been made.


### Domain Expansion: Component Mapping
To avoid having to synchronize a code generation step, we can dynamically map schemas to component definitions. We introspect a JSON schema (which we can auto-generate from Zod) and generate, in-code, a large variety of useful components. Custom queries & mutation are also detected & exposed appropriately.

Inputs will handle validation. Inputs & presenters will handle presence (hover/focus/change) indication.

Forms will have several "modes" for working with documents in different ways:
1) "Live" mode (fully collaborative, strong data integrity)
    - every change auto-triggers a mutation, keeping the database in sync
2) "Working" mode (fully collaborative, relaxed data integrity)
    - changes are broadcast among collaborators & persisted as "working" until they are submitted for proper validation & storage as a "real" model (either automatically on passing local validation or when a button is pressed)
3) "Patch" mode (non-collaborative; traditional architecture)
    - changes are local-first, broadcast to a mutation only on form submission

For starters, we'll want components like:

1) Model Properties
    1) Inputs
        1) Block input, for building forms
        2) Inline input, for embedding in text
        3) Cell input, for table integration
    2) Presenters
        1) value-only (inline)
        2) key/value pair (block)
    3) Actions
        1) Buttons for custom queries & mutations
2) Model Utilities
    1) Card, for viewing a single model
    2) Form, for creating/updating a single model
    3) Table, for viewing/creating/updating multiple models
    4) Action Bars & Menus, for triggering custom queries/mutations (& common actions)
3) TipTap Integrations
    1) Direct reference--finding a model by id & referencing the whole thing, just a single prop (read-only, editable), or a specific component
    2) Query--finding a group of models dynamically, referencing the whole thing, just a single prop, or a specific component

#### Design System: d-flx
We're going to use a custom, component-based, compression-oriented ACSS framework for this project. The details are defined in /memory-bank/d-flx/projectbrief.md. As far as this project is concerned, it provides only the foundational components for building layouts. It won't be used directly in domain-expansion code (for now), but will be essential for building out higher-level UI. Usage rules will be provided later.

#### Presence Indicators
I'm not sure exactly where they fit in the infrastructure, but we'll want some generic components for handling basic user presence (FacePiles, ActivityLists, UserCursors), as well as some concept of collaborative "user focus", and perhaps a few higher-level utilities (like "jump to focus" for another user, or "follow screen" like in Figma).

To indicate "focus", originally I was thinking in terms of visual elements & their ids. But then a scenario struck me: I'm on a table view of shared data. My colleague is in a form. They modify a live form or submit a patch form. The data in front of me changes. How do I know who changed it, where, & when? Change management provides this information, but only *after* the change has been made (and only if it is configured). What if I want to know the second someone even *thinks* about changing the data?

If "focus" is expressed not in terms of specific visual elements, but in terms of *the domain itself*, then we can cross-pollinate collaboration knowledge across views. In concrete terms, user focus won't be "this input in this form with this id" but "this property of this model". Then, *everywhere that property is represented*, the fact that somebody is focused on an input for it can be represented. Or if users are investigating different views of the same data, a selection of some common property in one view will automatically render in every other. Transforming "focus" from a view element to a domain object enables meaningful cross-view collaboration.

Readers could know who is editing; editors, who is reading. This information can be configured (to what degree it is reported) & access-controlled.

There's one more scenario to consider, one that I haven't yet seen handled in existing work: when multiple users have the same input selected and one of them makes a change, how do we indicate who did it? A simple "last changed by x at y" around the input would do the trick, assuming we have change management configured. We could also do fancy things with styling, but plain text will work to start.

### Notebook Infrastructure
We'll need to provide some utilities for constructing & sharing notebooks. Things like:

1) A domain explorer, for automatically seeing all available data & hosting all the derived model components
2) An RBAC manager, so users can configure permissions for tables, columns, & rows
3) A document tree, for organizing pages
4) A document forest, for sharing trees with other users
5) A rich chat (e.g., sending extended TipTap blocks) for communicating with other users (preferably e2e encrypted)
    - could extend this into a simplified built-in Slack-type thing
6) A universal comments system with rich editing
    - could extend this into a simplified built-in forum/discussion board-type thing

I'm sure we'll stumble across other needs as they come up (e.g., extending models at runtime with custom fields, formulas, etc.), but we'll wait to stumble before we define any more.

#### Payments, Emails, Etc.
I'm not sure how to handle configuring these in a generic way yet. I have a concrete use case that we'll evaluate Capo against; when I'm translating that domain to this meta-model, I'll start by wiring these bits by hand, then look for more generic patterns. This is end-game stuff. No point getting ahead of ourselves. Let's focus on the foundation first.


## The Definition of "Done"
When the architecture is complete such that I can rebuild & ship to production an existing software product **in a single afternoon** by simply defining the data shapes, access rules, & state transitions. Of course, the generated UI will be a little spare, but the point is that it will be *fully functional*.

We could turn elements of this stack into independent libraries for reuse, but for now, we'll just leave all the custom code in-house for ease of reading, and let abstraction occur after the fact only if/when there is clamor for it.

There will need to be some documentation--and I'll also want to complete a personal portfolio site before I tell people about it, as a landing place for people curious about the creator of Capo, my overall vision, and my other works. Of course, that portfolio site should be built in Capo itself, which provides us with a second concrete target.
