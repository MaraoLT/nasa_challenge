export async function getPopulationDensity(lat, lng){
    const parser = new DOMParser();

    // Reverse geocode to get country code
    const rcUrl = `https://api-bdc.io/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lng)}&localityLanguage=en`;

    const rcResp = await fetch(rcUrl);
        
    if (!rcResp.ok) return "This";
    const rcJson = await rcResp.json();
    const countryCode = rcJson.countryCode;
    if (!countryCode) return "Aqui";

    // World Bank API for population density (EN.POP.DNST)
    // Request JSON and get the most recent non-null value
    const wbUrl = `https://api.worldbank.org/v2/country/${encodeURIComponent(
      countryCode
    )}/indicator/EN.POP.DNST`;

    const wbResp = await fetch(wbUrl);
    
    const wbString = await wbResp.text();

    if (!wbResp.ok) return null;

    const xmlDoc = parser.parseFromString(wbString, "text/xml");
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML parsing error:', parseError.textContent);
    } else {
      
      const docElement = xmlDoc.documentElement;

      let data = 0;

      for (const r of docElement.children) {
        if(r.children.item(4).innerHTML != 0){
          data = r.children.item(4).innerHTML;
          break;
        }
      }

      return data;
    }
    return null;
}
