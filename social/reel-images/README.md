# Painted reel images

Reels made with the `scenes` or `action` template can use painted pictures
(like the *Arise and Eat* cover) instead of, or mixed with, the illustrated
SVG scenes. Support lives in `social/lib/painted-scenes.js`.

## Making the images

- **Shape:** 9:16 portrait, at least 1080×1920 (2160×3840 is ideal for the 4K export).
- **No text** in the picture. Captions, scripture and titles are added by the reel.
- **Leave the bottom third calm.** Captions sit there on a dark grade.
- **One picture per moment** of the story, for example Elijah under the tree,
  the angel touching him, the cake on the coals, Horeb.
- Save as JPG (quality ~85, under ~1.5 MB each).

## Where they go

Put each reel's images in a folder named for its date:

```
social/reel-images/2026-11-16/elijah-under-tree.jpg
social/reel-images/2026-11-16/angel-touch.jpg
```

## Using them in a reel

Add `image` to any line in `social/reels/reel-YYYY-MM-DD.json`:

```json
{ "text": "Arise and eat.", "image": "social/reel-images/2026-11-16/angel-touch.jpg",
  "focus": "50% 62%", "kb": "push", "scripture": true }
```

- `focus`: the point (x% y%) the camera moves toward. Put it on the face or the key object.
- `kb`: the camera move, one of `push`, `pull`, `panl`, `panr` or `rise`. Optional; by default the moves rotate.
- Consecutive lines with the same image share one shot.
- Lines without `image` keep their usual `visual` scene, so painted and illustrated shots can be mixed.
- If an image is missing, the line falls back to its `visual` when it has one.

Dry run without spending voice credits:

```
TTS_PROVIDER=silent REEL_FAST=1 node social/generate-reel.js social/reels/reel-YYYY-MM-DD.json /tmp/test-reel
```
