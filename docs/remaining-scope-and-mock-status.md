# Remaining Scope And Mock Status

## A. Mock-Backed Capabilities With Backend Reservation Ready

The following capabilities are still mock-backed in practice, but the front-end has already reserved a backend path for them:

1. script generation
2. script optimization
3. setting image generation
4. storyboard image generation
5. storyboard prompt optimization
6. storyboard image upscale
7. video generation
8. video prompt optimization
9. dialogue optimization
10. dubbing generation

Notes:

- these flows already use generation task services on the front-end
- backend integration should follow `docs/generation-task-contract.md`
- storyboard direct generation endpoints are compatibility-only and not the preferred backend entrypoint

## B. Current Front-End Local Or Lower-Priority Backend Domains

The following areas are still primarily front-end local behavior or lower-priority backend domains:

1. local editor draft persistence and mock project data
2. system management data
3. project-scoped asset persistence
4. script template persistence
5. complete-step JSON export outputs
6. resource/library mock data

Notes:

- these modules now have mock/http API structure where relevant
- real backend integration priority depends on product scope and deployment goals

## C. Explicitly Out Of Scope For Current Version

The following items are not part of the current delivery scope:

1. real TTS provider integration
2. real video generation model integration
3. subtitle timeline editing
4. audio trimming and mixing tools
5. Jianying project export
6. team space functionality
7. points mall and recharge flows
8. third-party social login
9. registration and forgot-password flows
10. full batch task progress management with pause/cancel/retry UI

## D. Recommended Next Priority

If development continues after this delivery stage, the next recommended priorities are:

1. final delivery acceptance and scope confirmation
2. backend implementation of auth, project, editor draft, and generation task APIs
3. setting and voice backend integration
4. storyboard auxiliary API integration
5. lower-priority management modules such as system, asset, and scriptTemplate
