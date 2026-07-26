# Claude Code Project Instructions

## Project-Specific Review Skill

When the user asks to learn, review, quiz, summarize, or prepare interviews for this specific project, use the project-local skill at:

`.claude/skills/linux-vision-perception-review-coach/SKILL.md`

This skill is only for the `Linux视觉感知处理系统` project. Do not apply it to general computer vision, general OpenCV, general deep learning, or unrelated visual perception projects unless the user explicitly connects the request to this project.

Typical trigger phrases include:

- 复习这个项目
- 学习这个 Linux视觉感知处理系统
- 带我过一遍视觉感知项目
- 准备这个项目的面试
- 复习这个项目里的 LIME / NEON / OpenMP / Unet / LSTR / Qt

When triggered, first read:

1. `.claude/skills/linux-vision-perception-review-coach/SKILL.md`
2. `.claude/skills/linux-vision-perception-review-coach/references/project-knowledge.md`
3. `.claude/skills/linux-vision-perception-review-coach/references/review-templates.md`

Then follow the review loop:

`pain point -> mental model -> minimal code -> hand trace -> Feynman check -> break it -> rebuild -> knowledge chain`

Preserve the user's original answers when scoring self-tests, and use the standard answer separately.
