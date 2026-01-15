// src/shared/utils/assets.js

/**
 * Resolves a relative asset path from the `src` directory into a valid URL
 * that Vite can process.
 * The path should be an absolute path from the project root (e.g., /src/ide/data/...).
 * @param {string} path - The absolute path to the asset from the project root.
 * @returns {string} The final, usable URL for the asset.
 */
export function resolveAsset(path) {
    // Vite's `new URL` is smart. If we give it an absolute path from the project root,
    // and provide a base URL, it can correctly resolve the asset.
    // The base URL here is `import.meta.url`, which points to this file's location.
    return new URL(path, import.meta.url).href;
}