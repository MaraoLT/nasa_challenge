export async function getPopulationDensity(lat: number, lng: number): Promise<number | null> {
  try {
    // Reverse geocode to get country code
    const rcUrl = `https://api-bdc.io/data/reverse-geocode-client?latitude=${encodeURIComponent(
      lat
    )}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`;

    const rcResp = await fetch(rcUrl);
    if (!rcResp.ok) return null;
    const rcJson = await rcResp.json();

    const countryCode = rcJson.countryCode;
    if (!countryCode) return null;

    // World Bank API for population density (EN.POP.DNST)
    // Request JSON and get the most recent non-null value
    const wbUrl = `https://api.worldbank.org/v2/country/${encodeURIComponent(
      countryCode
    )}/indicator/EN.POP.DNST`;

    const wbResp = await fetch(wbUrl);
    if (!wbResp.ok) return null;
    const wbJson = await wbResp.json();

    // wbJson is expected to be [meta, dataArray]
    if (!Array.isArray(wbJson) || wbJson.length < 2) return null;
    const dataArray = wbJson[1];
    if (!Array.isArray(dataArray)) return null;

    // find the most recent entry with a non-null value
    const sorted = dataArray.slice().sort((a: any, b: any) => Number(b.date) - Number(a.date));
    for (const entry of sorted) {
      if (entry && entry.value != null) {
        const num = Number(entry.value);
        if (!Number.isNaN(num)) return num;
      }
    }

    return null;
  } catch (err) {
    // don't throw to keep UI stable
    // eslint-disable-next-line no-console
    console.error("getPopulationDensity error", err);
    return null;
  }
}
