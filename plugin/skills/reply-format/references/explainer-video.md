# Explainer video

Make a short video with motion, voice-over and diagrams after a big change. Use the `interactive-explanation` skill.

## When

| Make a video | Skip the video |
|---|---|
| A new feature or a new flow | A small fix or a config change |
| Several files changed | Answers and research |
| The user says "video" or "explain it" | Nothing to show on screen |

## Steps

1. Load the `interactive-explanation` skill in `task` mode. Done when its instructions are loaded.
2. Write the script with an `architecture` video: title, before-after, diagram and bullets scenes. Done when the script validates.
3. Build the page with the skill's `build.mjs`. Done when `index.html` opens with no errors.
4. Embed the video on the first line of the reply, next to the sketch, as an
   image link with its absolute path:
   `![<title>](<project>/temp/explainers/<slug>/architecture.mp4)`.
   Done when the link is in the reply.
5. Delete the explainer folder after the user has seen it. Done when the folder is gone.

Reason: a short narrated video explains a big change faster than text. The dashboard panel turns an image link to an .mp4 into a player with play, pause, seek, sound and fullscreen.
