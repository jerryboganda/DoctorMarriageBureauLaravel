---
name: stitch-mcp
description: Google Stitch MCP Skill for AI-powered UI/UX design generation and front-end code extraction.
---

# Stitch MCP Skill

Google Stitch is a powerful tool for generating UI/UX designs and front-end code. This skill enables AI agents to create projects, generate screens from text descriptions, and extract design context from existing screens.

## Setup & Authentication

Stitch is a **Remote MCP server**. To connect, you must provide a secure handshake via one of two methods:

### Method A: API Keys (Recommended)

1. Go to **Stitch Settings**.
2. Create an **API Key**.
3. In **Antigravity**, click the three dots in the top right of the Agent Panel -> **Manage MCP Servers** -> **View raw config**.
4. Add the following entry:

```json
{
  "mcpServers": {
    "stitch": {
      "serverUrl": "https://stitch.googleapis.com/mcp",
      "headers": {
        "X-Goog-Api-Key": "YOUR-API-KEY"
      }
    }
  }
}
```

### Method B: OAuth (Temporary Tokens)

Used when permanent keys are restricted. Requires the Google Cloud SDK.

1. Run `gcloud auth application-default login`.
2. Generate a token: `gcloud auth application-default print-access-token`.
3. Use the token in headers: `"Authorization": "Bearer <TOKEN>"`.
4. **Note**: Tokens expire every 1 hour.

## Workflow: The "Designer Flow"

To ensure consistent and high-quality UI generation, follow this 2-step process:

1. **Extract Context**: Use `get_screen` or `list_screens` to understand the existing design system or a reference screen.
2. **Generate Screen**: Call `generate_screen_from_text` with the specific requirements, referencing the context extracted in step 1 to maintain consistency.

## Available Tools & Options

- `create_project`: Create a new container for designs.
- `generate_screen_from_text`:
  - `model_id`: Use `GEMINI_3_PRO` for high quality or `GEMINI_3_FLASH` for speed.
- `list_projects` / `get_project`.
- `list_screens` / `get_screen`.

## Usage Guidelines

- **Project ID**: Most tools require a `project_id`. Use `list_projects` to find the correct ID.
- **Prompt Engineering**: Be descriptive when using `generate_screen_from_text`. Include details about the layout, color scheme (e.g., "follow the existing brand colors"), and specific components.
- **Iterative Design**: Use `get_screen` to review generated screens and provide follow-up prompts for refinements.

## Redirection & Integration

When a user asks for a new UI/UX design or mobile screen:

1. Detect the domain (Web or Mobile).
2. Route the task to the appropriate specialist (`frontend-specialist` or `mobile-developer`).
3. Use Stitch tools to generate high-fidelity designs or code snippets.
