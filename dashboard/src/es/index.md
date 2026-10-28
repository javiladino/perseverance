---
title: Percy · Plataforma de datos
toc: false
---

```js
import {TEXT} from "../components/text.js";
import {missionPage} from "../components/mission.js";

display(missionPage(TEXT.es, {
  kpis: await FileAttachment("../data/kpis.json").json(),
  drives: await FileAttachment("../data/drives.csv").csv({typed: true}),
  images: await FileAttachment("../data/images.csv").csv({typed: true}),
  curation: await FileAttachment("../data/curation.csv").csv({typed: true}),
  light: await FileAttachment("../data/light.csv").csv({typed: true}),
  quality: await FileAttachment("../data/quality.json").json()
}));
```

<style>
.lead { font-size: 1.1rem; color: var(--theme-foreground-muted); max-width: 60ch; }
.big { font-size: 2rem; font-weight: 700; }
.lang { float: right; font-size: 0.9rem; }
.play { font-weight: 600; }
h2.section { margin-top: 2rem; }
</style>
