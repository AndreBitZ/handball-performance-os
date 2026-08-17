# Storage integration tests

The storage suite exercises backup, validation, preview, comparison, merge restore, and rollback against Dexie using `fake-indexeddb`.

The production build runs `npm run test:storage` before `next build`, so a storage regression blocks deployment instead of reaching production.
