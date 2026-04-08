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
  if (!plaats) return;

  status.textContent = "Postcodes ophalen…";
  resultaat.innerHTML = "";

  try {
    const res = await fetch(
      `https://postcode-api.jouwnaam.workers.dev/?plaats=${encodeURIComponent(plaats)}`
    );
    const data = await res.json();

    if (data.error) {
      status.textContent = data.error;
      return;
    }

    status.textContent = `${data.aantal} postcodes gevonden`;

    resultaat.innerHTML = `
      <h2>Postcodes (PC6) voor ${data.plaats}</h2>
      <div class="postcodes">
        ${data.postcodes.map(pc => `<div class="postcode">${pc}</div>`).join("")}
      </div>
    `;
  } catch (err) {
    status.textContent = "Ophalen mislukt.";
  }
}
