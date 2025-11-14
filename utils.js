export default {
    extractRequest
}

async function extractRequest() {

}

function extractGPS(text) {
    const gpsMatch = text.match(
        /https:\/\/maps\.google\.com\/\?q=[^ \n]+|(-?\d{1,3}\.\d+,\s*-?\d{1,3}\.\d+)/
    );
    return gpsMatch ? gpsMatch[0] : null;
}