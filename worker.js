addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const plaatsRaw = url.searchParams.get("plaats");

  if (!plaatsRaw) {
    return json({ error: "parameter 'plaats' ontbreekt" }, 400);
  }

  const plaats = plaatsRaw.toUpperCase();

  try {
    // 1️⃣ BAG woonplaats polygon
    const bagUrl =
      "https://basisregistraties.arcgisonline.nl/arcgis/rest/services/BAG/BAGv3/FeatureServer/5/query" +
      "?f=json" +
      `&where=WPL_NAAM='${plaats}'` +
      "&outFields=WPL_NAAM" +
      "&returnGeometry=true";

    const bagRes = await fetch(bagUrl);
    const bagData = await bagRes.json();

    if (!bagData.features || bagData.features.length === 0) {
      return json({ error: "Woonplaats niet gevonden" }, 404);
    }

    const geom = bagData.features[0].geometry;

    // 2️⃣ Nummeraanduidingen (PC6)
    const pc6Url =
      "https://basisregistraties.arcgisonline.nl/arcgis/rest/services/BAG/BAGv3/FeatureServer/1/query" +
      "?f=json" +
      `&geometry=${encodeURIComponent(JSON.stringify(geom))}` +
      "&geometryType=esriGeometryPolygon" +
      "&spatialRel=esriSpatialRelIntersects" +
      "&outFields=postcode" +
      "&returnGeometry=false";

    const pc6Res = await fetch(pc6Url, { method: "POST" });
    const pc6Data = await pc6Res.json();

    const pc6s = [
      ...new Set(
        (pc6Data.features || [])
          .map(f => f.attributes.postcode)
          .filter(Boolean)
      )
    ].sort();

    return json({
      plaats: plaatsRaw,
      aantal: pc6s.length,
      postcodes: pc6s
    });

  } catch (err) {
    return json(
      { error: "Interne fout", detail: String(err) },
      500
    );
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
