const input = document.getElementById("plaatsInput");
const knop = document.getElementById("zoekBtn");
const status = document.getElementById("status");
const resultaat = document.getElementById("resultaat");

knop.addEventListener("click", zoek);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") zoek();
});

async function zoek() {
  const plaatsRaw = input.value.trim();
  const plaats = plaatsRaw.toUpperCase();

  resultaat.innerHTML = "";
  status.textContent = "";

  if (!plaats) return;

  status.textContent = "Zoeken…";

  try {
    // ✅ 1. BAG woonplaats (correct veld + hoofdletters)
    const bagUrl =
      "https://basisregistraties.arcgisonline.nl/arcgis/rest/services/BAG/BAGv3/FeatureServer/5/query" +
      "?f=json" +
      `&where=WPL_NAAM='${plaats}'` +
      "&outFields=WPL_NAAM" +
      "&returnGeometry=true";

    const bagRes = await fetch(bagUrl);
    const bagData = await bagRes.json();

    if (!bagData.features || bagData.features.length === 0) {
      throw new Error("Geen Nederlandse woonplaats gevonden.");
    }

    const woonplaatsGeom = bagData.features[0].geometry;

    // ✅ 2. PC4-vlakken die de woonplaats overlappen
    const pcUrl =
      "https://services.arcgis.com/nSZVuSZjHpEZZbRo/arcgis/rest/services/Postcodevlakken_PC4/FeatureServer/0/query" +
      "?f=json" +
      `&geometry=${encodeURIComponent(JSON.stringify(woonplaatsGeom))}` +
      "&geometryType=esriGeometryPolygon" +
      "&spatialRel=esriSpatialRelIntersects" +
      "&outFields=postcode4" +
      "&returnGeometry=false";

    const pcRes = await fetch(pcUrl);
    const pcData = await pcRes.json();

    const postcodes = [
      ...new Set(pcData.features.map(f => f.attributes.postcode4))
    ].sort();

    status.textContent = "";

    resultaat.innerHTML = `
      <h2>Postcodes (PC4) voor ${plaatsRaw}</h2>
      <div class="postcodes">
        ${postcodes.map(pc => `<div class="postcode">${pc}</div>`).join("")}
      </div>
    `;
  } catch (err) {
    console.error(err);
    status.textContent = err.message || "Er ging iets mis.";
  }
}
