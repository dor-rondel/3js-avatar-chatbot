---
name: transform-glb-to-jsx
description: Use this skill whenever the user asks to convert, transform, or generate a React component/JSX file from a 3D GLTF or GLB model asset.
---

# 3D Model Transformation Workflow (GLB to JSX)

This skill utilizes `gltfjsx` via `pnpm dlx` to convert 3D `.glb` or `.gltf` assets into optimized React Three Fiber / Drei components matching our React 19 and Three.js stack.

## 🛠️ Prerequisites & Context

- **Source Directory:** Look for input assets typically in `public/` or an asset folder.
- **Target Directory:** Output components should generally go into the application components directory (e.g., `components/` or `app/components/`).
- **Stack Rules:** Ensure generated code uses TypeScript and matches React 19 / Three r170 conventions.

## 🏃‍♂️ Execution Blueprint

### 1. Basic Transformation

To generate a standard TypeScript component from a GLB asset, run:

    pnpm dlx gltfjsx public/models/avatar.glb --types --output components/Avatar.tsx

### 2. Advanced / Optimized Transformation

If the model requires optimization (like Draco compression or texture resizing), append the necessary flags:

    pnpm dlx gltfjsx public/models/avatar.glb --types --transform --output components/Avatar.tsx

---

## 📐 Common Flags Reference

- `--types` or `-t`: Generates TypeScript types (Mandatory for this codebase).
- `--transform` or `-T`: Optimizes the model (isolates meshes, resizes textures, compresses with Draco).
- `--output` or `-o`: Specifies the output filename.
- `--shadows` or `-s`: Injects shadow properties directly onto the generated meshes.

## ⚙️ Post-Transformation Rules

1. **Verify Imports:** Check that the generated file correctly imports hooks from `@react-three/drei` (e.g., `useGLTF`) and `@react-three/fiber`.
2. **Prettier Check:** Immediately run `pnpm format` on the newly generated `.tsx` file to align it with project style guidelines.
