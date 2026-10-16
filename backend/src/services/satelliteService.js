const axios = require("axios");

const TOKEN_URL =
  "https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token";

const PROCESS_URL =
  "https://sh.dataspace.copernicus.eu/process/v1";
const CATALOG_URL =
  "https://sh.dataspace.copernicus.eu/catalog/v1/search";
const SENTINEL1_CATALOG_COLLECTION = "sentinel-1-grd";

let accessToken = null;
let tokenExpiresAt = 0;


async function searchSentinel2Observation({
    latitude,
    longitude,
    startDate,
    endDate
}) {
    try {
        const token = await getAccessToken();

        const delta = 0.05;

        const bbox = [
            longitude - delta,
            latitude - delta,
            longitude + delta,
            latitude + delta
        ];

        const requestBody = {
            bbox: bbox,
            datetime: `${startDate}T00:00:00Z/${endDate}T23:59:59Z`,
            collections: ["sentinel-2-l2a"],
            limit: 1
        };

        console.log(
            "Sentinel-2 Catalog request:",
            JSON.stringify(requestBody, null, 2)
        );

        const response = await axios.post(
            CATALOG_URL,
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        const features =
            response.data?.features || [];

        console.log(
            `Sentinel-2 Catalog results: ${features.length}`
        );

        if (features.length === 0) {
            return null;
        }

        const item = features[0];

        return {
            id: item.id,

            observationDateTime:
                item.properties?.datetime || null,

            cloudCoverage:
                item.properties?.["eo:cloud_cover"] ?? null,

            bbox:
                item.bbox || bbox,

            metadata: item
        };

    } catch (error) {

        console.error(
            "Sentinel-2 Catalog API error:"
        );

        console.error(
            "Status:",
            error.response?.status
        );

        console.error(
            "Response:",
            error.response?.data
        );

        console.error(
            "Message:",
            error.message
        );

        throw new Error(
            "Unable to search Sentinel-2 catalog"
        );
    }
}

/**
 * Get Copernicus OAuth access token
 */
async function getAccessToken() {
  // Reuse existing token if it is still valid
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.COPERNICUS_CLIENT_ID,
        client_secret: process.env.COPERNICUS_CLIENT_SECRET,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = response.data.access_token;

    // Refresh 60 seconds before actual expiry
    tokenExpiresAt =
      Date.now() + (response.data.expires_in - 60) * 1000;

    return accessToken;
  } catch (error) {
    console.error(
      "Copernicus authentication failed:",
      error.response?.data || error.message
    );

    throw new Error("Unable to authenticate with Copernicus");
  }
}

/**
 * Get Sentinel-2 true-color satellite image
 */
async function getSentinel2Image({
  latitude,
  longitude,
  startDate,
  endDate,
}) {
  const token = await getAccessToken();

  const delta = 0.05;

  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta,
  ];

  const evalscript = `
//VERSION=3

function setup() {
  return {
    input: ["B02", "B03", "B04", "dataMask"],
    output: {
      bands: 4
    }
  };
}

function evaluatePixel(sample) {
  return [
    2.5 * sample.B04,
    2.5 * sample.B03,
    2.5 * sample.B02,
    sample.dataMask
  ];
}
`;

  const requestBody = {
    input: {
      bounds: {
        bbox: bbox,
        properties: {
          crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
        },
      },

      data: [
        {
          type: "sentinel-2-l2a",

          dataFilter: {
            timeRange: {
              from: `${startDate}T00:00:00Z`,
              to: `${endDate}T23:59:59Z`,
            },

            mosaickingOrder: "leastCC",
          },
        },
      ],
    },

    output: {
      width: 512,
      height: 512,

      responses: [
        {
          identifier: "default",

          format: {
            type: "image/png",
          },
        },
      ],
    },

    evalscript: evalscript,
  };

  try {
    const response = await axios.post(
      PROCESS_URL,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "image/png",
        },

        responseType: "arraybuffer",
      }
    );

    return {
      image: Buffer.from(response.data),
      contentType: "image/png",

      metadata: {
        satellite: "Sentinel-2",
        product: "Sentinel-2 L2A",
        latitude,
        longitude,
        startDate,
        endDate,
        bbox,
      },
    };
  } catch (error) {
    console.error(
      "Sentinel-2 request failed:",
      error.response?.data
        ? Buffer.from(error.response.data).toString()
        : error.message
    );

    throw new Error("Unable to retrieve Sentinel-2 imagery");
  }
}

async function searchSentinel1Observation({
  latitude,
  longitude,
  startDate,
  endDate
}) {
  try {
    const token = await getAccessToken();

    const delta = 0.05;

    const bbox = [
      longitude - delta,
      latitude - delta,
      longitude + delta,
      latitude + delta
    ];

    const requestBody = {
      bbox: bbox,
      datetime: `${startDate}T00:00:00Z/${endDate}T23:59:59Z`,
      collections: [SENTINEL1_CATALOG_COLLECTION],
      limit: 1
    };

    console.log(
      "Sentinel-1 Catalog request:",
      JSON.stringify(requestBody, null, 2)
    );

    const response = await axios.post(
      CATALOG_URL,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    const features =
      response.data?.features || [];

    console.log(
      `Sentinel-1 Catalog results: ${features.length}`
    );

    if (features.length === 0) {
      return null;
    }

    // Get the first catalog item
    const item = features[0];

    console.log(
      "Sentinel-1 catalog item:",
      item
    );

    return {
      id: item.id,

      observationTime:
        item.properties?.datetime || null,

      bbox:
        item.bbox || bbox,

      metadata: item
    };

  } catch (error) {

    console.error(
      "Sentinel-1 Catalog API error:"
    );

    console.error(
      "Status:",
      error.response?.status
    );

    console.error(
      "Response:",
      error.response?.data
    );

    console.error(
      "Message:",
      error.message
    );

    throw new Error(
      "Unable to search Sentinel-1 catalog"
    );
  }
}

async function getSentinel1Image({
  latitude,
  longitude,
  startDate,
  endDate
}) {
  const token = await getAccessToken();

  const delta = 0.05;

  const bbox = [
    longitude - delta,
    latitude - delta,
    longitude + delta,
    latitude + delta
  ];

  const evalscript = `
//VERSION=3

function setup() {
  return {
    input: ["VV", "VH", "dataMask"],
    output: {
      bands: 4
    }
  };
}

function evaluatePixel(sample) {

  // Convert Sentinel-1 backscatter to a
  // displayable 0-1 range.

  let vv = 10 * Math.log10(sample.VV);
  let vh = 10 * Math.log10(sample.VH);

  let vvDisplay = (vv + 25) / 25;
  let vhDisplay = (vh + 25) / 25;

  return [
    vvDisplay,
    vhDisplay,
    0,
    sample.dataMask
  ];
}
`;

  const requestBody = {
    input: {
      bounds: {
        bbox: bbox,
        properties: {
          crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
        }
      },

      data: [
        {
          type: "sentinel-1-grd",

          dataFilter: {
            timeRange: {
              from: `${startDate}T00:00:00Z`,
              to: `${endDate}T23:59:59Z`
            }
          }
        }
      ]
    },

    output: {
      width: 512,
      height: 512,

      responses: [
        {
          identifier: "default",

          format: {
            type: "image/png"
          }
        }
      ]
    },

    evalscript: evalscript
  };

  try {

    const response = await axios.post(
      PROCESS_URL,
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "image/png"
        },

        responseType: "arraybuffer"
      }
    );

    return {
      image: Buffer.from(response.data),

      contentType: "image/png",

      metadata: {
        satellite: "Sentinel-1",
        product: "Sentinel-1 GRD",
        latitude,
        longitude,
        startDate,
        endDate,
        bbox
      }
    };

  } catch (error) {

    console.error(
      "Sentinel-1 request failed:",
      error.response?.data
        ? Buffer.from(error.response.data).toString()
        : error.message
    );

    throw new Error(
      "Unable to retrieve Sentinel-1 imagery"
    );
  }
}



module.exports = {
  getAccessToken,

  // Sentinel-2
  getSentinel2Image,
  searchSentinel2Observation,

  // Sentinel-1
  getSentinel1Image,
  searchSentinel1Observation
};