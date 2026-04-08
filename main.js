const input = document.getElementById("plaatsInput");
const knop = document.getElementById("zoekBtn");
const status = document.getElementById("status");
const resultaat = document.getElementById("resultaat");

knop.addEventListener("click", zoek);
input.addEventListener("keydown", e => {
  if (e.key === "Enter") zoek();
});

async function zoek() {
  const plaats = input.value.trim();
  resultaat.innerHTML = "";
  status.textContent = "";

  if (!plaats) return;

  status.textContent = "Zoeken…";

  try {
    // ✅ 1. World Geocoder (client-side toegestaan)
    const geoUrl =
      "https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates" +
      "?f=json" +
      `&singleLine=${encodeURIComponent(plaats)}` +
      "&countryCode=NLD" +
      "&maxLocations=1";

    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    if (!geoData.candidates || geoData.candidates.length === 0) {
      throw new Error("Plaats niet gevonden.");
    }

    const { x, y } = geoData.candidates[0].location;

    // ✅ 2. PC4-vlakken op basis van punt
    const pcUrl =
      "https://services.arcgis.com/nSZVuSZjHpEZZbRo/arcgis/rest/services/Postcodevlakken_PC4/FeatureServer/0/query" +
      "?f=json" +
      `&geometry=${x},${y}` +
      "&geometryType=esriGeometryPoint" +
      "&spatialRel=esriSpatialRelIntersects" +
      "&outFields=postcode4" +
      "&returnGeometry=false";

    const pcRes = await fetch(pcUrl);
    const pcData = await pcRes.json();

    if (!pcData.features || pcData.features.length === 0) {
      throw new Error("Geen postcodes gevonden.");
    }

    const postcodes = [
      ...new Set(pcData.features.map(f => f.attributes.postcode4))
    ].sort();

    status.textContent = "";

    resultaat.innerHTML = `
      <h2>Postcodes (PC4) voor ${plaats}</h2>
      <div class="postcodes">
        ${postcodes.map(pc => `<div class="postcode">${pc}</div>`).join("")}
      </div>
    `;
  } catch (err) {
    console.error(err);
    status.textContent = err.message || "Er ging iets mis.";
  }
}
