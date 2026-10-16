const fs = require("fs");
const path = require("path");

const pool = require("../config/database");

const satelliteService =
  require("../services/satelliteService");

const getSatelliteImage = async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      startDate,
      endDate,
    } = req.query;

    if (
      latitude === undefined ||
      longitude === undefined ||
      !startDate ||
      !endDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "latitude, longitude, startDate and endDate are required",
      });
    }

    const lat = Number(latitude);
    const lon = Number(longitude);

    if (
      Number.isNaN(lat) ||
      Number.isNaN(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid latitude or longitude",
      });
    }

    // ---------------------------------------
    // 1. Search Sentinel-2 metadata
    // ---------------------------------------

    const observation =
      await satelliteService.searchSentinel2Observation({
        latitude: lat,
        longitude: lon,
        startDate,
        endDate,
      });

    if (!observation) {
      return res.status(404).json({
        success: false,
        message:
          "No Sentinel-2 observation found for the requested area and period",
      });
    }

    // ---------------------------------------
    // 2. Request satellite image
    // ---------------------------------------

    const result =
      await satelliteService.getSentinel2Image({
        latitude: lat,
        longitude: lon,
        startDate,
        endDate,
      });

    // ---------------------------------------
    // 3. Save image
    // ---------------------------------------

    const imageDirectory = path.join(
      __dirname,
      "../../public/satellite-images"
    );

    if (!fs.existsSync(imageDirectory)) {
      fs.mkdirSync(imageDirectory, {
        recursive: true,
      });
    }

    const filename =
      `sentinel2_${Date.now()}.png`;

    const imagePath = path.join(
      imageDirectory,
      filename
    );

    fs.writeFileSync(
      imagePath,
      result.image
    );

    // ---------------------------------------
    // 4. Create public image URL
    // ---------------------------------------

    const imageUrl =
      `/satellite-images/${filename}`;

    // ---------------------------------------
    // 5. Extract bounding box
    // ---------------------------------------

    const bbox = observation.bbox;

    const minLongitude = bbox[0];
    const minLatitude = bbox[1];
    const maxLongitude = bbox[2];
    const maxLatitude = bbox[3];

    // ---------------------------------------
    // 6. Save observation in MySQL
    // ---------------------------------------

    const metadata = {
      satellite: "Sentinel-2",
      collection: "sentinel-2-l2a",
      catalogId: observation.id,
      requestedStartDate: startDate,
      requestedEndDate: endDate,
      latitude: lat,
      longitude: lon,
      imageFile: filename,
    };
    if (!observation.observationTime) {
        throw new Error(
            "Sentinel-1 catalog observation does not contain an observation time"
        );
    }

    const observationDateTime =
        new Date(observation.observationTime)
            .toISOString()
            .slice(0, 19)
            .replace("T", " ");

    const [dbResult] = await pool.query(
      `
      INSERT INTO satellite_observations
      (
        satellite_source_id,
        observationDateTime,
        min_latitude,
        max_latitude,
        min_longitude,
        max_longitude,
        image_url,
        data_url,
        cloud_coverage,
        metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        2,
        observation.observationTime
          ? new Date(observation.observationTime)
          : new Date(),

        minLatitude,
        maxLatitude,
        minLongitude,
        maxLongitude,

        imageUrl,

        null,

        observation.cloudCoverage,

        JSON.stringify(metadata),
      ]
    );

    // ---------------------------------------
    // 7. Return response
    // ---------------------------------------

    res.setHeader(
      "Content-Type",
      result.contentType
    );

    res.setHeader(
      "X-Satellite-Observation-ID",
      dbResult.insertId
    );

    res.send(result.image);

  } catch (error) {
    console.error(
      "Satellite controller error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getSentinel1Image = async (req, res) => {
    try {
        const {
            latitude,
            longitude,
            startDate,
            endDate
        } = req.query;

        // ---------------------------------------------
        // 1. Validate request
        // ---------------------------------------------

        if (
            latitude === undefined ||
            longitude === undefined ||
            !startDate ||
            !endDate
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "latitude, longitude, startDate and endDate are required"
            });
        }

        // ---------------------------------------------
        // 2. Search Sentinel-1 observation
        // ---------------------------------------------

        const observation =
            await satelliteService.searchSentinel1Observation({
                latitude: Number(latitude),
                longitude: Number(longitude),
                startDate,
                endDate
            });

        if (!observation) {
            return res.status(404).json({
                success: false,
                message:
                    "No Sentinel-1 observation found for the given location and date range"
            });
        }

        // ---------------------------------------------
        // 3. Get Sentinel-1 image
        // ---------------------------------------------

        const result =
            await satelliteService.getSentinel1Image({
                latitude: Number(latitude),
                longitude: Number(longitude),
                startDate,
                endDate
            });

        // ---------------------------------------------
        // 4. Create image directory
        // ---------------------------------------------

        const imageDirectory = path.join(
            __dirname,
            "../../public/satellite-images"
        );

        if (!fs.existsSync(imageDirectory)) {
            fs.mkdirSync(imageDirectory, {
                recursive: true
            });
        }

        // ---------------------------------------------
        // 5. Save Sentinel-1 image
        // ---------------------------------------------

        const filename =
            `sentinel1_${Date.now()}.png`;

        const imagePath =
            path.join(imageDirectory, filename);

        fs.writeFileSync(
            imagePath,
            result.image
        );

        // ---------------------------------------------
        // 6. Image URL
        // ---------------------------------------------

        const imageUrl =
            `/satellite-images/${filename}`;

        // ---------------------------------------------
// 7. Bounding box
// ---------------------------------------------

        const bbox =
            observation.bbox ||
            result.metadata.bbox;

        if (!bbox || bbox.length !== 4) {
            throw new Error(
                "Sentinel-1 observation does not contain a valid bounding box"
            );
        }

        const [
            minLongitude,
            minLatitude,
            maxLongitude,
            maxLatitude
        ] = bbox;


// ---------------------------------------------
// 8. Convert observation time for MySQL
// ---------------------------------------------

        const observationDateTime =
            observation.observationTime
                ? new Date(observation.observationTime)
                    .toISOString()
                    .slice(0, 19)
                    .replace("T", " ")
                : null;


// ---------------------------------------------
// 9. Metadata
// ---------------------------------------------

        const metadata = {
            satellite: "Sentinel-1",
            collection: "sentinel-1-grd",

            catalogId:
                observation.id || null,

            requestedStartDate:
                startDate,

            requestedEndDate:
                endDate,

            latitude:
                Number(latitude),

            longitude:
                Number(longitude),

            imageFile:
                filename,

            imageUrl:
                imageUrl
        };


// ---------------------------------------------
// 10. Save observation in MySQL
// ---------------------------------------------

        const [dbResult] = await pool.execute(
            `
            INSERT INTO satellite_observations
            (
                satellite_source_id,
                observationDateTime,
                min_latitude,
                max_latitude,
                min_longitude,
                max_longitude,
                image_url,
                data_url,
                cloud_coverage,
                metadata
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                1,
                observationDateTime,

                minLatitude,
                maxLatitude,

                minLongitude,
                maxLongitude,

                imageUrl,

                null,

                null,

                JSON.stringify(metadata)
            ]
        );
    // ---------------------------------------------
// 11. Return image
// ---------------------------------------------

        res.setHeader(
            "Content-Type",
            "image/png"
        );

        res.setHeader(
            "X-Satellite-Observation-ID",
            dbResult.insertId
        );

        res.send(result.image);

        } catch (error) {

            console.error(
                "Sentinel-1 controller error:",
                error.response?.data ||
                error.message ||
                error
            );

            return res.status(500).json({
                success: false,
                message:
                    "Failed to retrieve Sentinel-1 image"
            });
        }
};

module.exports = {
    getSatelliteImage,
    getSentinel1Image
};