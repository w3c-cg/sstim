## Brief description

Opening `https://w3id.org/sstim/exposure` in a browser currently lands on the general SSTIM homepage. Point its existing HTML branch at the dedicated Exposure namespace page, which explains the identifier and links its RDF representations:

https://w3c-cg.github.io/sstim/namespace/exposure/

The landing page forwards inherited term fragments to the knowledge browser with the `sstim-ex` namespace qualified, so `/sstim/exposure#StimulusChannel` continues to select the exact term.

Replace all 19 bounded `406` fallthroughs with the existing browser destination for each path. Each record keeps its own graph entry and namespace context. BSC shapes retain their existing Turtle-file browser destination.

Supported RDF destinations, format priority and Turtle defaults for `*/*` or absent Accept are preserved. `q=0` still excludes a type from explicit negotiation; if no supported branch matches, the final informational fallback applies even to refused-only offers. Paths outside the recognized identifier grammars remain 404. Version IRIs retain their existing unconditional Turtle default.

SSTIM is an OWL/SKOS ontology under CC BY 4.0. The listed namespace maintainer is @ttm.

## Checklist

- Based on current upstream `master`.
- Only `ids/sstim/.htaccess` and its README change.
- The new target was deployed before this PR and returns HTTP 200 with `text/html`.
- No existing identifier path or RDF destination is removed. Unsupported/refused-only offers now receive useful defaults instead of 406.

## Automated checks

- Upstream checker: zero errors and zero warnings, with no suppressed rules.
- macOS system Apache with the repository's rootless server configuration: syntax check and all 1,260 requests pass (63 paths × 20 headers). Against the pre-review rules, 846 non-406 responses are unchanged and 414 former 406 cases reach their original browser destination; 140 closed-path requests remain 404. This uses the installed Apache rather than the tool's compiled Apache.
- SSTIM routing regression suites: 42 tests pass. All 161 committed records resolve to their own RDF document and graph entry. Snapshot-target, staged-mount and quality audits pass.
- SSTIM application checks and browser verification at the production `/sstim/` mount pass: the bare page renders, `#StimulusChannel` selects `sstim-ex:StimulusChannel`, and page section anchors remain on the landing page.

The Apache matrix at `http://localhost:8089` covers all 19 negotiated families, including every module, profile, implementation, original/retired technique, nested evidence record, reference, live-record kind and BSC framework endpoint. It also covers version IRIs, manifests, optional slashes and invalid/reserved-synthetic paths. Headers include HTML/browser/XHTML, each RDF format, uppercase Turtle, absent and wildcard Accept, `application/*`, unsupported types, mixed offers and `q=0` cases. Representative requests:

| URL | Accept cases / expected result |
| --- | --- |
| `/sstim/exposure` | HTML, browser header and XHTML → 303 to the new page |
| `/sstim/exposure#StimulusChannel` | HTML → same 303; fragments are not sent to Apache |
| `/sstim/exposure` | Turtle, JSON-LD, RDF/XML → their existing namespace documents |
| `/sstim/exposure` | `*/*`, no Accept, Turtle + HTML → existing Turtle destination |
| `/sstim/exposure` | `text/html;q=0,application/ld+json` → existing JSON-LD destination |
| `/sstim/exposure` | `application/n-triples` or refused-only offers → new namespace page |
| `/sstim/exposure/` | HTML → existing 404 |
| `/sstim/` | HTML → existing `/sstim/namespace/` destination |
| `/sstim/module/exposure` | HTML → existing reference docs; Turtle → existing Exposure module |
| `/sstim/vocab` and `/sstim/ecosystem` | HTML → existing application destination |

## Requests

- [x] Please squash my commits when merging.
