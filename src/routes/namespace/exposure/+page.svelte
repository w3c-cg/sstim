<script>
  import { onMount } from 'svelte'
  import { goto } from '$app/navigation'
  import { applicationRoute, applicationAsset } from '../../../config/applicationUrls.js'
  import { PREFIXES } from '../../../rdf/namespaces.js'
  import { qualifyArrivalHash } from '../../../ui/graph/deepLink.js'
  import { NAMESPACE_IRI, RELEASE_VERSION, VERSION_IRI } from '../../../ui/entrance/releaseMetadata.js'
  import { ONTOLOGY_DOCS_URL } from '../../../ui/externalLinks.js'

  const prefix = 'sstim-ex'
  const namespace = PREFIXES[prefix]
  const namespaceIri = namespace.slice(0, -1)
  const moduleIri = `${NAMESPACE_IRI}/module/exposure`
  const representations = [
    { accept: 'text/turtle', format: 'Turtle', extension: 'ttl' },
    { accept: 'application/ld+json', format: 'JSON-LD', extension: 'jsonld' },
    { accept: 'application/rdf+xml', format: 'RDF/XML', extension: 'rdf' },
  ]
  const terms = [
    { local: 'ExposureProfile', what: 'Delivery, perception, placement and boundaries of an exposure.' },
    { local: 'StimulusChannel', what: 'An individual channel in a stimulus specification or exposure profile.' },
    { local: 'deliveryMedium', what: 'The physical medium, energy, material or interface used for delivery.' },
    { local: 'perceivedModality', what: 'The sensory or perceptual modality a channel engages.' },
  ]

  onMount(() => {
    // w3id receives /exposure for both the namespace and /exposure#Term.
    // Qualify the preserved fragment so even a shared local name resolves in
    // the exposure namespace, rather than the graph's default sstim# space.
    const hash = window.location.hash
    if (hash && !hash.startsWith('#section-')) {
      const arrival = qualifyArrivalHash(`?ns=${prefix}`, hash, PREFIXES)
      goto(applicationRoute('/graph/') + arrival.hash, { replaceState: true })
    }
  })
</script>

<svelte:head>
  <title>The SSTIM exposure namespace</title>
  <meta
    name="description"
    content="SSTIM exposure vocabulary: stimulus channels, physical delivery, perceived modalities and exposure profiles, with released RDF downloads and term links."
  />
</svelte:head>

<main class="namespace">
  <header>
    <p class="eyebrow">Linked-data namespace · Exposure</p>
    <h1>{namespaceIri}</h1>
    <p class="lede">
      This persistent identifier names SSTIM’s exposure vocabulary: stimulus
      channels, physical delivery media, perceived modalities, devices, placement
      and exposure boundaries.
    </p>
    <p>Use the prefix <code>{prefix}:</code> for terms beginning with <code>{namespace}</code>.</p>
    <a href={applicationRoute('/namespace/')}>All SSTIM namespaces</a>
  </header>

  <section id="section-terms" class="panel">
    <h2>Explore exposure terms</h2>
    <p>A term IRI adds <code>#</code> and its local name to this identifier. Open a term to inspect its definition and relationships.</p>
    <dl class="terms">
      {#each terms as term}
        <div>
          <!-- The graph resolves these fragments after loading RDF; they are
               not HTML element IDs for the prerender crawler to validate. -->
          <dt><a href={applicationRoute('/graph/') + `#${prefix}:${term.local}`} rel="external"><code>{prefix}:{term.local}</code></a></dt>
          <dd>{term.what}</dd>
        </div>
      {/each}
    </dl>
  </section>

  <section id="section-downloads" class="panel">
    <h2>What this IRI returns</h2>
    <p>
      The HTTP <code>Accept</code> header selects a representation. RDF requests
      return the namespace document from the latest released SSTIM snapshot,
      currently <a href={VERSION_IRI}>{RELEASE_VERSION}</a>.
      HTML requests open this page; a term fragment opens the knowledge browser
      with that term selected.
    </p>
    <table>
      <thead><tr><th scope="col">Request <code>Accept</code></th><th scope="col">Download</th></tr></thead>
      <tbody>
        {#each representations as representation}
          <tr>
            <td><code>{representation.accept}</code></td>
            <td>
              <a
                href={applicationAsset(`/ontology/latest/sstim-exposure-namespace.${representation.extension}`)}
                rel="external"
              >{representation.format}</a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <pre><code>curl -H "Accept: text/turtle" -L {namespaceIri}</code></pre>
    <p class="note">
      The namespace document combines the Stimulus and Exposure modules because
      both define terms under <code>{prefix}:</code>. For example,
      <code>{prefix}:StimulusChannel</code> is defined in the Stimulus module.
      To retrieve only the Exposure module, use <a href={moduleIri}><code>{moduleIri}</code></a>.
    </p>
  </section>

  <section id="section-read" class="panel">
    <h2>Read and query</h2>
    <ul>
      <li><a href={ONTOLOGY_DOCS_URL} rel="external">Reference documentation</a> — definitions of classes and properties.</li>
      <li><a href={applicationRoute('/graph/')}>Knowledge browser</a> — navigate terms and relationships.</li>
      <li><a href={applicationRoute('/sparql/')}>SPARQL</a> — query the loaded knowledge graph.</li>
      <li><a href={applicationAsset('/ontology/manifest.json')}>Module inventory</a> — modules, profiles and namespace documents.</li>
    </ul>
    <p class="note">
      Exposure terms are released with SSTIM as a whole. Cite a
      <a href={applicationRoute('/namespace/#section-release')}>versioned SSTIM release</a>
      to keep a reference reproducible.
    </p>
  </section>
</main>

<style>
  .namespace {
    max-width: 54rem;
    margin: 0 auto;
    padding: 2rem 1.25rem 4rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.5rem;
  }
  header { display: grid; gap: 0.6rem; }
  header p { margin: 0; }
  .eyebrow { font-size: 0.72rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--app-accent); }
  h1 { margin: 0; font-size: clamp(1.3rem, 4vw, 2rem); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; overflow-wrap: anywhere; }
  .lede { font-size: 1rem; line-height: 1.6; max-width: 44rem; }
  .panel { padding: 1.1rem 1.25rem; background: var(--app-surface); border: var(--app-border-width) solid var(--app-border); border-radius: var(--app-radius); }
  h2 { margin: 0 0 0.75rem; font-size: 1rem; }
  p, li, dd { font-size: 0.88rem; line-height: 1.6; }
  code { font-size: 0.82em; overflow-wrap: anywhere; }
  .terms { display: grid; gap: 1rem; margin: 1rem 0 0; }
  .terms dt { font-weight: 600; }
  .terms dd { margin: 0.2rem 0 0; }
  table { display: block; overflow-x: auto; width: 100%; border-collapse: collapse; font-size: 0.88rem; }
  th, td { text-align: left; padding: 0.4rem 1rem 0.4rem 0; border-bottom: 1px solid var(--app-border); }
  th { color: var(--app-muted); }
  tbody tr:last-child td { border-bottom: none; }
  pre { margin: 1rem 0; overflow-x: auto; padding: 0.7rem; background: var(--app-accent-soft); border-radius: var(--app-radius); }
  pre code { white-space: pre; }
  .note { margin: 1rem 0 0; font-size: 0.83rem; }
  ul { margin: 0; padding-left: 1.25rem; }
</style>
