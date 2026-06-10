# Swag Pet V1 Requirements

## Summary

Swag Pet V1 is a macOS-first local desktop pet application. The first version validates the core companionship experience: a pet appears on the desktop, reacts to basic interactions, saves local state, and uses a simple resource package format.

V1 does not include account login, cloud sync, a backend service, payment, marketplace features, or direct DeepSeek integration. The backend folder is reserved for a future Java Spring Boot + Spring AI service.

Default V1 choices:

- Frontend: Electron + React + TypeScript.
- Pet style: pixel / frame animation.
- Data: local-only JSON state.
- AI: local rule-based behavior with an interface reserved for future model integration.

## Functional Requirements

### Desktop Pet Window

- Show a transparent, frameless, always-on-top pet window.
- Support dragging the pet around the desktop.
- Save and restore the pet position after restart.
- Provide a tray menu with show/hide, reset position, and quit.
- Prioritize macOS behavior for V1.

### Pet Interaction

- Clicking the pet triggers a short reaction animation and a local preset message.
- The pet supports these animation states:
  - `idle`
  - `walk`
  - `sleep`
  - `happy`
  - `tap`
- The pet tracks basic growth properties:
  - mood
  - energy
  - affinity
  - first launch time
  - last interaction time
- Long inactivity can move the pet toward idle or sleep behavior.
- Feeding or tapping can change mood, energy, and affinity.

### Local Storage

- Store pet state locally.
- Generate default state on first launch.
- Recover gracefully if the local state file is missing or invalid.
- Do not introduce a database in V1.

### Pet Resource Package

V1 includes one default pet under the frontend project:

```text
frontend/public/pets/default/
  pet.json
  animations/
    idle/
    walk/
    sleep/
    happy/
    tap/
```

Each pet package must include a `pet.json` manifest and animation frame assets.

Minimum manifest shape:

```json
{
  "id": "default-pet",
  "name": "Swag Pet",
  "version": "1.0.0",
  "style": "pixel",
  "animations": {
    "idle": { "fps": 6, "loop": true, "frames": [] },
    "walk": { "fps": 8, "loop": true, "frames": [] },
    "sleep": { "fps": 4, "loop": true, "frames": [] },
    "happy": { "fps": 8, "loop": false, "frames": [] },
    "tap": { "fps": 10, "loop": false, "frames": [] }
  }
}
```

V1 does not need a user-facing resource import UI, but the code should keep the package shape extensible.

### AI Extension Point

V1 uses a local rule-based `PetBrain`.

The implementation should keep a replaceable pet brain boundary so future versions can connect to:

- Java Spring Boot backend.
- Spring AI.
- DeepSeek.
- Local models.

Future backend API candidates:

```text
POST /api/pet/chat
GET  /api/pet/state
POST /api/pet/action
WS   /ws/pet-events
```

These APIs are not implemented in V1.

## Non-Goals

- No user account system.
- No cloud sync.
- No backend requirement.
- No marketplace or paid resources.
- No social features, rankings, or friend visits.
- No Live2D, Spine, VRM, or 3D character runtime.
- No full custom pet import workflow in V1.

## Acceptance Criteria

### Desktop Experience

- Launching the frontend app opens a transparent desktop pet window.
- The pet window is frameless and does not show a large white background.
- The pet stays above normal windows by default.
- The user can drag the pet to a new position.
- Restarting the app restores the last saved position.
- The tray menu can show/hide the pet, reset position, and quit.

### Animation And Interaction

- The default pet plays an idle animation.
- Clicking the pet switches to a reaction animation and shows a message.
- Feeding changes the pet state and produces feedback.
- Inactivity can trigger idle or sleep behavior.
- State changes do not resize or visibly destabilize the UI.

### Storage

- First launch creates default local state.
- Restart restores mood, energy, affinity, and position.
- Invalid state data falls back to defaults without crashing.

### Resource Loading

- The default pet loads through `pet.json`.
- Missing animation frames should fall back safely where possible.
- Developers can add another pet by following the same package structure.

## Repository Layout

```text
swag-pet/
  doc/
    requirements-v1.md
  frontend/
    Electron + React + TypeScript client
  backend/
    reserved Spring Boot backend
```

## Validation Commands

Run from the frontend directory:

```bash
cd frontend
npm run typecheck
npm run test
npm run build
```

Start the desktop pet:

```bash
cd frontend
npm run dev
```
