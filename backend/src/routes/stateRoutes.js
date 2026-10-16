const express = require("express");

const {
    getStates,
    getStateById
} = require("../controllers/stateController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const {
    authorizeRoles
} = require("../middleware/roleMiddleware");

const router = express.Router();

router.get(
    "/",
    authenticate,
    authorizeRoles("NATIONAL_HEAD", "STATE_HEAD"),
    getStates
);

router.get(
    "/:stateId",
    authenticate,
    authorizeRoles("NATIONAL_HEAD", "STATE_HEAD"),
    getStateById
);

module.exports = router;