# SSTIM Agent Plugins and GitHub-backed MCP proposals

Status: packages and source v0.3.0 exist; they have not yet been published to
public plugin marketplaces or verified against every named client. The npm
registry still serves @sstim/mcp@0.2.0 until an explicit npm release.

## Scope and value

Explore the senses. Understand stimuli. Advance knowledge.

The SSTIM reference can help agents explore stimulus properties, sensory
processes, perceptual phenomena, sound and music-based practices,
experimental methods, multimodal technology, and connected scientific
evidence. It is not yet a comprehensive encyclopedia of perception, nor
does an ontology entry prove a therapeutic outcome.

## Packages

- Portable Agent Plugins 1.0 directory: plugins/sstim/
  Includes a sensory-reference skill and stdio MCP for VS Code and other
  compatible Agent Plugins hosts.
- Claude Code: plugins/claude-code/sstim/
  Includes native .claude-plugin manifest, MCP config and skill. The
  repository root .claude-plugin/marketplace.json provides discovery.
- ChatGPT: plugins/chatgpt/
  Skills-only portable package. This is not yet a ChatGPT remote MCP app.
  ChatGPT requires a separately hosted, accessible HTTPS MCP endpoint.

All configured MCP commands use npx --yes @sstim/mcp@latest. Until
npm v0.3.0 is published, this resolves the existing read-only v0.2.0
implementation and does not expose direct proposal submission.

## Local development

To exercise the new source tools before npm publication, run
node packages/sstim-mcp/server.mjs as a local stdio MCP server.

Public GitHub proposal submission additionally requires SSTIM_GITHUB_TOKEN,
set securely in the host environment, with Issues write permission for
w3c-cg/sstim. An explicit approvedForPublicSubmission true argument is
required for each exact public proposal. Never place tokens in plugin
manifests, Git or prompts.

Supported proposals: correction, missing-knowledge, scientific-evidence,
interoperability, research-need and other. Each submission is a GitHub issue,
not canonical SSTIM RDF. Draft/list/get tools require no credentials.
No automatic evidence acceptance or human-review bypass exists.

## Installation paths

Claude Code with a compatible version may use:
  claude plugin marketplace add w3c-cg/sstim
  claude plugin install sstim-sensory-reference@sstim

If marketplace support differs, use the standalone documented MCP
installation in packages/sstim-mcp/README.md instead.

VS Code and Copilot users may load the portable folder plugins/sstim/
via their installed Agent Plugins feature, or use the existing
.vscode/mcp.json example for read-only MCP access. A VSIX is not required
for basic MCP usage. Client-specific behavior still needs testing.

ChatGPT users may load the standalone skill where supported. A ChatGPT
plugin combining the new MCP tools with that skill awaits a real hosted
Streamable HTTP endpoint, user-specific authorization, directory review
and proof of secure write behavior. Do not invent an endpoint or present
the current stdio service as publicly deployable.

## Release gates

1. Verify source mock-backed tests, protocol dispatcher, security cases,
   static build, RDF CI and deployment tests on main.
2. Configure/verify npm trusted publication with the maintainer, publish
   @sstim/mcp@0.3.0 from w3c-cg/sstim, then update the official
   MCP registry descriptor and verify a real npm install.
3. Test plugins in real Claude Code, VS Code/Copilot and ChatGPT clients,
   then package and submit to applicable marketplaces.
4. Deploy an authenticated remote MCP service for ChatGPT only after
   specifying user identities, consent, moderation, rate limits and
   GitHub issue permissions. The current static site does not provide it.
5. Keep the separate deferred RDF and annotation invitation plan deferred:
   no protected RDF or frozen releases change here.
