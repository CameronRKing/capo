# Anaris: Meta-Circular Knowledge Bases via Domain Expansion
What is Anaris? It's a knowledge management ecosystem, like Notion or Coda, except that it's completely extensible and totally self-hosted. This means that all users are empowered to change anything at any time. Reifing this principle of permissionless innovation is essential for unfettering our creative potential.

How does it work? Everything--data shapes, actions, event-driven workflows, UI--is defined via models, which are just data in the database. Given a model definition, the core system provides models of service providers that can, for example, automatically derive collaborative input components, property presenters, forms, cards, tables, canvas lookup helpers + embeds, & workflows--with automatic access control, validation, & collaboration/presence/local-first synchronization--all from a simple model definition.

With easily extensible models & highly intuitive editors (rich text block editor, visual drag-n-drop editors, property panel projectional editors, etc.), users can quickly compose, tinker with, & share bespoke digital experiences.

The end goal is to enable collaborative cognition on a grand scale, so that humanity has a better chance of tackling its big, complex, interconnected problems in an effective way.

## High-Level Architecture Overview
The architecture is divided into three layers:
    (1) core, which defines the shape of data & the flow of behavior
    (2) foundation, which defines tools for working with the core
    (3) base, which builds on top of foundation for specific use cases

### Core Architecture: EAVTW + MART
The core of the data system is an EAVT (entity-attribute-value-transaction) database with a fifth column (W-world) for more easily branching & merging value streams.

The core of the system should be small: a meta-schema, followed by database schemas & runtime engines for models, actions (things you can do with models, both client-side (helper functions) & server-side (mutations)), reactions (event-based action triggers), and templates (UI components).

### Foundational Architecture: Service Generators
With this minimal core, we can construct an IDE for working with the core itself--a projectional editor built in terms of the system it edits. In concrete terms, we'll do things like write an action that generates form & table templates from a schema, then use those to write more models/actions/reactions/templates for improving the development experience, self-bootstrapping the meta-circular editing loop.

### Base Architecture: Domain Models
With a foundational model in place for working with the core, we then provide various "base" models for different kinds of knowledge management--e.g., a notebook base model for something like Coda (TipTap extended with custom components for referencing models & embedding templates + a page tree), or a whiteboard model for something like Miro, or a template IDE model for something like Figma (but with real code & actual logic). All of these things and more--anything built on the Anaris core model--will be automatically schema-safe, access-controlled, real-time, and collaborative by default. It will also be runtime introspectible, forkable, rollbackable (i.e., you can't *force* users to upgrade to a new version, or keep them from using old ones), and extensible by any user at any time.


## Core Architecture: MART (Models-Actions-Reactions-Templates)
I've chosen Convex as an implementation layer because it provides enough built-in services to facilitate rapid development of a prototype. Unless I can find some way to implement the event listening logic on the convex server, we may have to rely on some outside server to query the event store & transact reactions in response.

### Schema Schema
As for the meta-schema, I'm not sure. JSON Schema seems like a decent choice, if we can build in extensions for custom keywords & formats or finding some other way to do more generic refinements (similar to libraries like zod). Varv of course has a simple schema that we could probably extend. We might also try to abstract zod or something like it (arktype?) & build a bridge for hydrating the data. That seems like more work. Not sure what the best solution is here.

### Action Schema
I know that Varv has an action model that seems to work for them. We should start there. Representing JS ASTs directly seems heavy but it *could* work. I have a sneaking suspicion we build something Erlang or Lisp-like by pattern-matching JSON Schema tuples, though providing language services would probably be harder. Since we're working in a projectional space & aiming for rapid prototyping, strong services trump efficient representation for now.

### Reaction Schema
There's an MIT paper with a syntax inspired by SPARQL that's pretty okay. Something that maps more directly to EAV might work better. We need to specify patterns of events (optionally matching & binding on their payloads), then to provide bindings as arguments to a sequence of actions (which we'll already a schema for!)

#### Running Reactions
What I'd like is for some way to "wait" on a query--to define which events we're looking for, and to keep listening in real time until they occur, then to transact the appropriate actions in response. I imagine this may be impossible to run on the Convex server, though that would be my preference. I imagine we can access the convex query client API on a backend somewhere else & set up something using a reactivity framework (RxJS?) for checking queries & combining results.

### Templates Schema
The Mitosis JSON representation will be a good place to start. We want to keep the core API small: props, state (+ derivations), functions, contexts at the component layer (+ a fully-qualified name, of course), with the simple, well-established tag, props, children for elements. We'll have an actions schema for any logic we need.

#### Template Hydration
If we use Mitosis format or translate to it, we could rely on Mitosis to generate components for us on the fly (assuming we can get it to run in-browser, or provide compilation as a backend service).

I've also imagined a solution with more effort but much finer-grained reactivity during building. Instead of compiling & replacing a whole component, we could write our own bridge component for whatever frontend we want that dynamically renders based on the data provided to it. When that data changes, only the affected aspects would change. For example, if I changed some constant text in a template, under normal conditions that would trigger a complete component unmount & re-render. Under the custom bridge, it would simply cause a re-render. Updating a function should cause re-calculation of any data in state that relies on a previous invocation. Adding a prop or state should essentially do nothing at all from the outside perspective. And so on. So, we'd have only a single concrete component for any given frontend framework, and that concrete component would be utterly dynamic, completely data-driven in every aspect of structure, behavior, & presentation. Paradox. Efficient. Delightful.


## Foundational Architecture: RLS+CLS RBAC, Domain Expander, Command Palette, & More
I imagine this layer will end up being several layers when all's said and done. For now, these are the services I know I'll want.

### Access Control Schema + CRUD Service Generator
For access control, we'll implement both row-level security *and* column-level security through a unified mechanism. Users specify access controls for specific worlds, tables, table columns, & even individual rows by providing actions that accept user ID + access information (e.g., which roles they fill, which groups they are a part of) and return true/false + a message. Then we'll auto-generate generic CRUD functions that respect these rules on all invocations. We'll also ensure that any user-defined queries or mutations also respect these rules somehow.

We'll also want UI components for common tasks, like representing roles in the UI & managing access controls for various objects.

### Domain Expander
Given a model definition, we should be able to generate a large number of useful templates from that data. Things like collaborative validated inputs, model property presenters (e.g., for currencies or dates), forms, cards, and interactive tables. We should also be able to automatically lookup models (directly or by query) then embed these templates into a rich text block editor.

### Command Palette
Given a set of models and their actions, we should have rapid lookup & keyboard access to all available affordances in a given context. I'm imagining the standard popup box with improved suggestions based on where the cursor/focus is in the document. Users should be able to specify all keyboard shortcuts, as well as define macros (both directly & from command history)

### History Inspector
Since all mutations will run inside of transactions and be logged immutably, and domain action execution is managed, it should be possible to browse the history of the whole application across the front & back ends (respecting access control, of course) and selectively rollback--e.g., to a given checkpoint, or to undo user actions (i.e., when undoing in a collaborative environment, my ctrl-z should not undo the last action on the document (which might be done by someone else), but my own last action).

### Semi-Omniscent Debugger
The transaction log tells us what data comes in and goes out. When we're investigating and we want more details about what's going on within the actions of a transaction, we want to follow the same sequence of steps, every time:
    1. Go to the start of the suspicious sequence.
    2. Fork program state & mock all external services.
    3. Add a trace to all actions about to run
    4. Run the actions
    5. Inspect the results
A projectional editor where we show the values of variables/calculations in-line next to their definitions as actions would present one excellent experience. A universal value stream that can be filtered & queried for specific questions would be another.

### Template Editor
I've been dreaming about this for a long time. Something with an overall interface similar to Figma or Penpot, but is actually keyboard-driven logic over actual actionable components with all the bells and whistles. I think something like paredit but for element trees would be most excellent here. I'm surprised it's not common practice already (or if it is, I have yet to hear of it).

### Component-based Compression-Oriented ACSS Design System Definition Framework: Flx
I've already built this. It's delightful. It just needs to be translated into this representation. It's really quite simple: the steps of a design system are defined by POJOs, then these options are mapped onto components that link props to styles on specific elements.

Where it gets fun is my orientation towards extreme compression. Since CSS properties are extremely stable and very common, it makes sense to compress their definitions to the maximum minimal cognitive units. So, I can compress something like "<div style="display: flex, justify-content: center; align-items: center; width: 100%; height: fit-content; padding-x: 4px" />" to "<flx cc wf hfc px1 />". While I very much like things this way, I've learned that some others feel differently. So, it would be great to define multiple levels of compression for users to choose their degree of comfort for an interace (i.e., "<flx jc aic />" vs "<flx j='c' ai='c' />" vs. "<flx justify='center' alignItems='center' />" (which completely defeats the point in my opinion but I know some frameworks already provide syntax like that)), but that's not an essential at this point. What is essential is the absolutely minified version.

It would be great if we could implement automatic codemods, too, so that, for instance, a user might write using the extreme minification then have it auto-transformed into the expanded format as part of a pre-commit hook. But that's a bit down the road. Let's just focus on the theoretically minimal surface first, which I believe I already have. We can expand a framework for interaction around that surface (selecting a style family, iterating through options, abstracting common configurations into new props), which will integrate into the template editor.

Thinking longer-term, currently I have no mechanisms for CSS functions or variables (referencing or setting). I imagine these would be good things to provide to the public, though I have no use for them personally right now.

### Model Editor
This should honestly be one of the easiest bits. There's only a few fields with a few options. We should be able to define a minimal interaction language for selection & specification.

### Action Editor
Same here, though we'll need language services (like typed/named access to arguments, model properties, results of previous steps), and there will be more variability in the number of scenarios to support. But that should all be pretty easy via the domain expanders.

### Reaction Editor
This builds on the action editor with a pattern-matching (& binding) engine. I'm not sure what efficient representation & interaction is in this space, as it's new to me. We'll have to evolve the schema first before we can scaffold a projection.

### Module Editor
I suppose we should reify the concept of a collection of models, actions, reactions, and templates. Let's call it a "module". All it needs to do is organize navigation & context for all the sub-editors--as well as any publishing mechanics that may come along later.

### World Weaver
It needs to be easy to fork & merge collaborative state. Given an application, I should be able to quickly & easily make edits to its structure that affect only me, while continuing to receive any mergeable updates from the original, and maintaining a bidirectional stream of live data (i.e., we all share the same data, but can have custom views over that data). I should be able to share my patches with select others for them to collaborate, fork, & merge in turn. We need some kind of living git for the system.



## Base Architecture: Block Trees, Component Canvases, & Community Galleries
The deep flexibility & integrity of this system should allow it to unify within a single environment what is currently a diaspora of different appliances: knowledge management, product management, visual design, IDEs, mind maps, and so on.

I'm imagining four base models to start: three to replace tools I use, and a fourth to serve as the "app store" (community gallery).

1) A document tree-based workspace for knowledge management--a Notion replacement
2) A visual canvas for working with logical templates--a Figma replacement
3) A meta-circular IDE for evolving live Anaris applications--a VS Code replacement
4) The community gallery: so people can find & share other models

Because the lower levels of the system provide most of the basic functionality, it should mostly be a question of simply arranging mid-level architecture for specific purposes.

## Conclusion


