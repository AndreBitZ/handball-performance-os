# Local-first architecture

The application is a web UI, but the product is designed to work without a cloud database or cloud file storage.

## Principles

1. User data lives on the user's device.
2. Full match videos and generated media stay on the user's device.
3. Video processing is local.
4. Analytics and AI processing are local whenever technically possible.
5. Internet is optional after the application has been installed/cached.
6. GitHub/Vercel are deployment/distribution infrastructure only, not application data stores.
7. No paid SaaS is a requirement of the product.

## Storage layers

### IndexedDB / Dexie

Structured application data:
- clubs
- teams
- seasons
- players
- competitions
- matches
- events
- shots
- clips metadata
- playlists
- scouting reports
- tags
- settings

### Origin Private File System (OPFS)

Large local files where supported:
- source videos
- generated clips
- thumbnails
- exports
- project archives

The UI must gracefully fall back to browser file handles and IndexedDB metadata where OPFS is unavailable.

## Processing

- HTML5 Media APIs for playback.
- Web Workers for CPU-heavy browser tasks.
- FFmpeg compiled for local/browser execution for trimming, thumbnails, concatenation and media conversion.
- WebAssembly/WebGPU and local models for future computer vision/AI features.

## Project portability

The application must provide project export/import so the user can back up and move their data without depending on a server.

Recommended archive structure:

```text
project.hpo/
  manifest.json
  database.json
  media/
  thumbnails/
  exports/
```

A project must remain usable if cloud services are unavailable.

## Privacy

By default, match video and performance data never leave the device. Any future synchronization feature must be explicitly opt-in and must not be required by the core application.
