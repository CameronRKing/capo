[] Port over old RxDB code for component generation
[] Port over existing d-flx code
[] Replace RxDB references with Convex logic
    [] refactor persistence interaction into an interface, build bridges? worth the effort? probably not... .
[] Set up zod schemas -> convex tables mapper
    [] Set up "working docs" configuration
    [] Set up change tracking configuration
        [] implement only last_change with userId + timestamp for now
            [] for a model as a whole; any property changed, not caring which
            [] for each individual property
    [] Design generic RBAC for users to define extra protections at runtime
[] Generate access-protected generic CRUD actions for all tables
    [] Generate access-protected mutations for turning "working" docs into "real" docs
    [] Respect change tracking config, updating dependent tables as needed in *all* mutations
[] Design domain-driven user focus system
    [] focus is defined not by ids on specific visual components, but by reference to models, properties, & intents
    [] user *view* is also saved, to still track the specific UI & its context that the user is focusing through
[] Design event-trigger mutation wrapper system
    [] index rules by table, rowid, property key, & mutation name (in that order)
    [] track provenance of action executions
---

[] Integrate focus system into input generation
    [] broadcast intent on hover/focus/change
    [] display intents of other users
[] Generate property presenters
    [] Inline, formatted
    [] key/value pair
    [] integrate focus system: display intents of other users, broadcast intent on hover/select
    [] expose tooltip with extra info (icon with key for pair; auto on hover for inline)
[] Upgrade component table generation to use PrimeReact data tables
[] Generate model card (collection of presenters)
[] Generate model form (collection of inputs)
    [] Live mode
    [] Working mode
        [] reify on submit
        [] automatically reify when valid
        [] if working against a document with a known live version, indicate differences between working & live
    [] Patch mode
[] Generate "cell" components (switch between presenter/input on command)
    [] Table cells
    [] Inline cells
    [] Block cells
[] Weave together tables, cards, & forms into a simple "schema explorer" component
[] Collect all schema explorers into a "domain explorer" component

[] Generate individual model lookup/general reference components for TipTap
[] Design "jump to view" & "follow screen" access-controlled presentation components
[] Generate tiptap embeds for inline & block generated components
[] Expose a simple TipTap-embedded query component for finding & rendering collections of models

[] Implement a (reasonably) safe system for executing arbitrary TS code (or Lua?) with access to given queries/mutations/in-memory data
    [] Implement a formulas component for embedding arbitrary logic within documents via a table that stores context-controlled code(functions, constants, queries, common action chains, etc.)

[] Generate a document tree component for TipTap pages
[] Wire together top-level UI: document tree, page panes+tabs, full text search, presence indication

[] Build Tiptap-integrated e2e encrypted chat component
[] Build Tiptap-integrated e2e encrypted universal comment system
    [] Any table, model, property, or rendered template can serve as the hook for starting a comment chain

[] Generate RBAC manager component for user data
[] Generate event reaction component for user data
[] Generate cron job manager for user data

---

[] Implement basic auth flows
[] Sketch architecture of Stripe integration
    [] product/subscription maps to user role(s)
    [] whatever UI/workflows/actions/mutations we need to pay -> gain roles
    [] whatever "..." we need for requesting refunds
    [] whatever "..." we need for tracking sales

---




## Two questions:
1) What is the bare minimum that I need to ship *Cantopia*?
2) What do I consider the "MVP" that I would feel good about sharing publicly?