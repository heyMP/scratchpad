# @heymp/scratchpad

## 1.0.0-next.1

### Patch Changes

- 8883144: Fix log arguments typings

## 1.0.0-next.0

### Major Changes

- 79b0eda: Typescript Support

  Compiles files ending in `.ts` using tsc.

  Example:

  ```bash
  npm install @heymp/scratchpad
  ```

  Recommended tsconfig.json settings.

  ```json
  {
    "target": "esnext",
    "compilerOptions": {
      "types": ["./node_modules/@heymp/scratchpad/types.d.ts"]
    }
  }
  ```
