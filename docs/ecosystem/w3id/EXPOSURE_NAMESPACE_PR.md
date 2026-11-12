## Brief description

Opening `https://w3id.org/sstim/exposure` in a browser currently lands on the general SSTIM homepage. Point its existing HTML branch at the dedicated Exposure namespace page, which explains the identifier and links its RDF representations:

https://w3c-cg.github.io/sstim/namespace/exposure/

The landing page forwards inherited term fragments to the knowledge browser with the `sstim-ex` namespace qualified, so `/sstim/exposure#StimulusChannel` continues to select the exact term. The Turtle, JSON-LD, RDF/XML, default and error responses are unchanged. SSTIM is an OWL/SKOS ontology under CC BY 4.0. The listed namespace maintainer is @ttm.

## Checklist

- Based on current upstream `master`.
- Only `ids/sstim/.htaccess` changes: the Exposure HTML target and its explanatory comment.
- The new target was deployed before this PR and returns HTTP 200 with `text/html`.
- No existing identifier path or RDF destination is removed.

## Automated checks

- `node tools/check/bin/w3id-check.js`: exit 0; no errors or new warnings. It reports 19 existing `htaccess/no-406-fallback` warnings, all marked “already there”. Those unchanged negotiation fallthroughs are outside this change.
- macOS system Apache 2.4.67 with the repository's rootless server configuration: `configtest` passes; all 18 HTTP cases below pass. This uses the installed Apache rather than the tool's compiled Apache.
- SSTIM application checks and browser verification at the production `/sstim/` mount pass: the bare page renders, `#StimulusChannel` selects `sstim-ex:StimulusChannel`, and page section anchors remain on the landing page.

Requests exercised on the local Apache at `http://localhost:8089`:

| URL | Accept cases / expected result |
| --- | --- |
| `/sstim/exposure` | HTML, browser header and XHTML → 303 to the new page |
| `/sstim/exposure#StimulusChannel` | HTML → same 303; fragments are not sent to Apache |
| `/sstim/exposure` | Turtle, JSON-LD, RDF/XML → their existing namespace documents |
| `/sstim/exposure` | `*/*`, no Accept, Turtle + HTML → existing Turtle destination |
| `/sstim/exposure` | `text/html;q=0,application/ld+json` → existing JSON-LD destination |
| `/sstim/exposure` | `application/n-triples` → existing 406 |
| `/sstim/exposure/` | HTML → existing 404 |
| `/sstim/` | HTML → existing `/sstim/namespace/` destination |
| `/sstim/module/exposure` | HTML → existing reference docs; Turtle → existing Exposure module |
| `/sstim/vocab` and `/sstim/ecosystem` | HTML → existing application destination |

## Requests

- [ ] Please squash my commits when merging.
