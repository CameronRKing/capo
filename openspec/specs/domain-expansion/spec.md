# Domain Expansion

## Purpose
The domain-expansion capability dynamically maps Zod schemas to React components, automatically generating inputs, presenters, forms, tables, and action components for each model. This enables developers to ship fully functional UIs without manual component creation.

## Scope
This capability covers:
- Dynamic component mapping from JSON schemas
- Property input components (block, inline, cell)
- Property presenter components
- Model utility components (Card, Form, Table)
- Action components for custom queries/mutations
- TipTap integration for model references
- Validation integration in all components

Out of scope:
- Schema definition itself (see schema-definition)
- Security policy enforcement (see rbac-security)
- Real-time synchronization (see real-time-collaboration)

## Requirements

### Requirement: Property Input Components
The system SHALL automatically generate input components for each property in a model schema, supporting block, inline, and cell variants.

#### Scenario: Generate block input
- **GIVEN** a property in a Zod schema (e.g., string, number, boolean)
- **WHEN** the system generates a block input component
- **THEN** the input component handles validation for that property type
- **AND** the input component displays inline validation errors
- **AND** the input component supports user presence indicators

#### Scenario: Generate inline input
- **GIVEN** a property in a Zod schema
- **WHEN** the system generates an inline input component
- **THEN** the input is compact and suitable for embedding in text
- **AND** the input maintains full validation capabilities

#### Scenario: Generate cell input
- **GIVEN** a property in a Zod schema
- **WHEN** the system generates a cell input component for table integration
- **THEN** the input is optimized for table cell display
- **AND** the input supports table-wide operations (e.g., bulk edit)

### Requirement: Property Presenter Components
The system SHALL automatically generate presenter components for displaying property values in value-only (inline) and key/value pair (block) formats.

#### Scenario: Display value inline
- **GIVEN** a property value from a model instance
- **WHEN** the value is displayed using an inline presenter
- **THEN** the value is formatted according to its type
- **AND** the presenter is compact and suitable for embedding in text

#### Scenario: Display key/value pair
- **GIVEN** a property from a model instance
- **WHEN** the property is displayed using a block presenter
- **THEN** both the property name and formatted value are displayed
- **AND** the display follows the design system conventions

### Requirement: Model Utility Components
The system SHALL generate Card, Form, and Table components for each model, supporting multiple collaboration modes.

#### Scenario: Generate model Card
- **GIVEN** a model schema and an instance
- **WHEN** the Card component is rendered
- **THEN** all properties are displayed using presenters
- **AND** the Card supports user presence indicators
- **AND** the Card can switch to edit mode

#### Scenario: Generate model Form (Live mode)
- **GIVEN** a model schema
- **WHEN** a Form is rendered in Live mode
- **THEN** every change triggers a mutation to keep the database in sync
- **AND** validation errors are displayed inline
- **AND** multiple users can collaborate in real-time

#### Scenario: Generate model Form (Working mode)
- **GIVEN** a model schema with refinements
- **WHEN** a Form is rendered in Working mode
- **THEN** changes are broadcast to collaborators and persisted as "working"
- **AND** refinements are relaxed during editing
- **AND** a submit button validates and promotes the document to "real" status

#### Scenario: Generate model Form (Patch mode)
- **GIVEN** a model schema
- **WHEN** a Form is rendered in Patch mode
- **THEN** changes are local-first and not broadcast
- **AND** changes are sent to the server only on form submission
- **AND** the form operates non-collaboratively

#### Scenario: Generate model Table
- **GIVEN** a model schema
- **WHEN** the Table component is rendered
- **THEN** all model instances are displayed as rows
- **AND** each cell uses the cell input component
- **AND** the table supports sorting, filtering, and inline editing
- **AND** user presence indicators show which cells are being edited

### Requirement: Action Components
The system SHALL detect custom queries and mutations and generate buttons/action menus for triggering them.

#### Scenario: Detect custom query
- **GIVEN** a model with a custom query function
- **WHEN** the system introspects the model
- **THEN** a button or action menu item is generated for the query
- **AND** the action displays the query results appropriately

#### Scenario: Detect custom mutation
- **GIVEN** a model with a custom mutation function
- **WHEN** the system introspects the model
- **THEN** a button or action menu item is generated for the mutation
- **AND** the action handles loading states and errors

### Requirement: TipTap Integration
The system SHALL provide TipTap extensions for embedding model references and queries in rich text.

#### Scenario: Direct reference embedding
- **GIVEN** a TipTap editor with model extensions
- **WHEN** a user inserts a direct reference to a model by ID
- **THEN** the model is embedded in the document
- **AND** the user can choose to embed the whole model, a single property (read-only or editable)
- **AND** changes to the model are reflected in real-time

#### Scenario: Query-based embedding
- **GIVEN** a TipTap editor with model extensions
- **WHEN** a user inserts a dynamic query for a group of models
- **THEN** the query results are embedded in the document
- **AND** the user can choose to embed the whole result, specific properties, or custom components
- **AND** the embedded content updates in real-time

### Requirement: Dynamic Component Mapping
The system SHALL introspect JSON schemas (auto-generated from Zod) and generate components at runtime without code generation steps.

#### Scenario: Introspect JSON schema
- **GIVEN** a Zod schema converted to JSON schema format
- **WHEN** the system introspects the JSON schema
- **THEN** property types, required fields, and validation rules are extracted
- **AND** appropriate input components are selected for each property

#### Scenario: Handle complex types
- **GIVEN** a JSON schema with nested objects, arrays, or unions
- **WHEN** the system generates components
- **THEN** nested structures are handled recursively
- **AND** array items are rendered with add/remove controls
- **AND** union types are rendered with appropriate type selectors

### Requirement: Validation Integration
All generated input components SHALL integrate with the validation system, displaying errors and handling presence indicators.

#### Scenario: Display validation errors
- **GIVEN** an input component with invalid data
- **WHEN** validation fails
- **THEN** error messages are displayed inline
- **AND** the input is visually marked as invalid

#### Scenario: User presence indicators
- **GIVEN** multiple users viewing the same model property
- **WHEN** one user focuses on or hovers over an input
- **THEN** presence indicators are shown to all other users
- **AND** the indicators identify which user has focus

### Requirement: Component Generation Performance
The system SHALL generate and render components quickly to ensure responsive UI.

#### Scenario: Schema introspection speed
- **GIVEN** a Zod schema with 20 properties
- **WHEN** the system introspects the schema to generate components
- **THEN** introspection completes within 100ms
- **AND** the UI remains responsive during generation

#### Scenario: Large table rendering
- **GIVEN** a Table component displaying 1000 model instances
- **WHEN** the table is initially rendered
- **THEN** initial render completes within 1 second
- **AND** scrolling through the table maintains 60 FPS
- **AND** virtualization is used for large row counts

#### Scenario: Form rendering performance
- **GIVEN** a Form component for a model with 50 properties
- **WHEN** the form is rendered
- **THEN** rendering completes within 200ms
- **AND** input fields are interactive immediately

### Requirement: Memory Efficiency
The system SHALL manage memory efficiently when generating and rendering components.

#### Scenario: Component instance limits
- **GIVEN** a notebook with multiple pages and components
- **WHEN** 1000 components are mounted simultaneously
- **THEN** memory usage remains below 500 MB for the component tree
- **AND** unmounted components are properly garbage collected
- **AND** memory leaks are prevented through proper cleanup

## Testing Approach
Domain expansion capabilities shall be tested through:
- **Unit tests** for component generation logic, verifying correct input/presenter selection for each property type
- **Visual regression tests** ensuring generated components match expected designs across different schema types
- **Performance tests** measuring render times for tables with 1000+ rows and forms with 50+ properties
- **Memory leak tests** verifying proper cleanup when components are mounted/unmounted
- **Integration tests** validating that generated components correctly integrate with validation and presence systems

## Open Questions
1. How should custom property types be registered and mapped to components?
2. What's the API for extending generated components with custom behavior?
3. How should complex nested structures be displayed in table views?
4. Should there be a plugin system for custom input/presenter components?
