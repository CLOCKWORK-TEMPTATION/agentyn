---
inclusion: always
---
# Critical Dependency Management Framework

## The "Surgical Audit" Methodology

Based on a rigorous analytical cycle (Evaluating → Devising → Implementing → Analyzing → Assessing → Refining), this framework functions as a "Mental Algorithm" to be activated whenever a package.json file is created or updated. It ensures the transition from mere "number bumping" to true "Stability Engineering."

## Core Philosophy

When handling dependencies, do not merely seek the "Latest"; seek the "Fittest and Most Stable." Adhere strictly to the following rules:

## 1. Temporal Anchoring

**Principle:** Updates are relative to time.

**Action:** Before writing a single line of code, explicitly define "Today's Date" (e.g., December 22, 2025). This date is the absolute benchmark for measuring package freshness.

**Rule:** Any JavaScript package that has not been updated for over a year is considered "archaic" and requires extreme caution.

## 2. Source Interrogation

**Principle:** Zero reliance on memory or internal caching.

**Action:** All queries must effectively hit the live npmjs.com registry.

**Tactic:** Formulate precise queries (e.g., `npm view [package] version`) to retrieve the latest Stable release. Strictly ignore Beta/Canary builds unless explicitly requested by the requirement.

## 3. Gap Categorization

**Principle:** Not all updates are created equal. Triage findings into three distinct zones:

- 🟢 **Safe Zone:** Patch/Minor updates (Safe, bug fixes)
- 🟡 **Caution Zone:** Stable packages requiring updates, but with a notable time/version jump
- 🔴 **Critical Mismatches:** The "Danger Zone" (e.g., mismatched LlamaIndex or LangChain versions). This indicates fundamental structural divergence

## 4. Detecting "Software Seismic Shifts" (Major Version Changes)

**Principle:** A change in the Major Version number equals Breaking Changes.

**Critical Analysis:** When OpenAI jumps from 4.x to 6.x, or LangChain from 0.3 to 1.x, this is not an update; it is a Refactoring Event.

**Directive:** You must issue a mandatory "Red Flag" warning that the current code base will likely fail and requires significant Code Refactoring.

## 5. Contextual Compatibility

**Principle:** The "Newest" is not always the "Best" for the specific runtime environment.

**Case Study:** Never install @types/node v25.x if the user is running Node.js 22 LTS. This is a common error that breaks type compatibility.

**Rule:** Type definitions must match the user's Engine, not outpace it. Adhere to "Latest Safe", not "Latest Absolute."

## 6. Peer Dependencies Audit

**Principle:** Packages do not exist in isolation.

**Action:**
- Verify compatibility between coupled ecosystems (e.g., the LangChain family vs. React versions)
- Strictly distinguish between similarly named packages across languages (e.g., Python's llamaindex vs. TypeScript's @llamaindex/core) to prevent cross-language hallucination

## 7. Constructing the Final Deliverable

**Structure:** Provide a clean, executable package.json containing the audited versions.

**The Risk Report:** Never deliver the file silently. Always append a "Risk Assessment Report" detailing:
- What was updated safely
- What requires code review (due to Breaking Changes)
- Justifications for specific version pinning (e.g., "Pinned Node types to v22 to match LTS")