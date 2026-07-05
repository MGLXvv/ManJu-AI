---
name: encoding-safe-edits
description: Use when editing source files that contain Chinese or other non-ASCII text, especially when shell-based rewrites are involved in this project.
---

# Encoding Safe Edits

## Overview

Use this skill when touching files that contain Chinese UI text or other non-ASCII content. The goal is to prevent mojibake and BOM insertion during scripted edits.

## Rules

1. Prefer `apply_patch` for text edits whenever it is available and working.
2. Do not use `Get-Content ... | Set-Content ...` for Chinese source files.
3. Do not copy terminal-rendered garbled text back into files.
4. When shell-based editing is unavoidable, read and write with explicit UTF-8 without BOM.
5. After editing any non-ASCII source file, inspect `git diff` before claiming success.

## Safe Write Pattern

Use this pattern for PowerShell-based writes:

```powershell
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$text = [System.IO.File]::ReadAllText($path)
# modify $text
[System.IO.File]::WriteAllText($path, $text, $utf8NoBom)
```

## Red Flags

If you see any of these in `git diff`, stop and fix encoding before continuing:

- an unexpected invisible marker at the start of the first line
- Chinese labels replaced by obviously garbled text
- widespread full-file rewrites unrelated to the intended change
- unexpected line-ending churn in a file that should only have small text edits

## Verification

After editing a file with non-ASCII text:

1. Run `git diff -- <file>`
2. Confirm UI text is still readable
3. Confirm there is no BOM marker at file start
4. Only then continue to build or test

## Notes

This project has already hit real encoding regressions from shell-based rewrites. Treat non-ASCII UI text as encoding-sensitive by default.