# Swag Pet

Swag Pet is a macOS-first local desktop pet MVP built with Electron, React, and TypeScript.

## V1 Features

- Transparent, frameless, always-on-top desktop pet window.
- Drag-to-move with position saved locally.
- Tray menu for show/hide, reset position, and quit.
- Pixel-frame pet animation states: `idle`, `walk`, `sleep`, `happy`, `tap`.
- Local pet growth state: mood, energy, affinity, first launch time, last interaction time.
- Rule-based `PetBrain` abstraction reserved for future Spring AI + DeepSeek integration.
- Default pet resource package under `public/pets/default`.

## Scripts

```bash
cd frontend
npm install
npm run dev
npm run test
npm run build
```

## Pet Package Shape

```text
public/pets/default/
  pet.json
  animations/
    idle/
    walk/
    sleep/
    happy/
    tap/
```

Each animation in `pet.json` declares its `fps`, `loop`, and frame paths. Future custom pets can follow the same shape.

## V2 Direction

The first version is fully local. A later version can connect the reserved pet brain boundary to a Java Spring Boot service using Spring AI and DeepSeek.
