const express = require("express");

const {
    health,
    predict
} = require("../controllers/mlPredictionController");

const router = express.Router();


router.get("/health", health);

router.post("/predict", predict);


module.exports = router;