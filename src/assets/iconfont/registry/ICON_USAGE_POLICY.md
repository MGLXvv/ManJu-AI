# Icon Usage Policy

This project uses a hybrid icon strategy:

- `iconfont` for stable single-color glyphs.
- `svg` fallback for complex, gradient, text-containing, or visually unstable glyphs.

## Force SVG

The following icons should remain SVG for visual fidelity:

- `topbar-points-default`
- `topbar-points-active`
- `topbar-credit-diamond-default`
- `topbar-credit-diamond-active`
- `project-create`
- `create-blank-shot`
- `reference-rail-handle`
- `video-play-large`
- `form-eye-on`
- `form-eye-off`
- `media-play`
- `asset-check`
- `user-menu-notify` (gradient badge)

## Force Iconfont

Prefer iconfont for these frequently used action/navigation icons:

- `topbar-home-*`
- `topbar-resource-*`
- `topbar-voice-*`
- `topbar-team-*`
- `topbar-system-*`
- `topbar-credit-cart-*`
- `topbar-user-*`
- `action-delete`
- `action-save`
- `action-template`
- `action-doc`
- `search`
- `batch`
- `chip-add`
- `pager-prev`
- `pager-next`
- `tool-edit/lock/view/view-off/zoom/zoom-out/copy/delete`
- `chip-close` (state by CSS)
- `star-outline/star-filled` (state by CSS)
- `trash`
- `timeline-upload/copy/delete` (default + active)
- `card-edit/add/delete/upload`
- `social-wechat/qq/alipay`
- `user-menu-password/space/switch-team/logout`

## Notes

- If a glyph becomes blurry, clipped, or visually divergent from Figma, move it back to SVG in `iconRegistry.ts`.
- Keep text labels as real text; do not encode text into iconfont.
- Keep iconfont glyphs shape-only; put active/default/muted colors and backgrounds on button/chip/card CSS states.
