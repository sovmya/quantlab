const express = require("express");
const { getStrategies, run, list, getOne, remove } = require("../controllers/backtest.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();
router.use(protect);

router.get("/strategies", getStrategies); // must come before "/:id"
router.get("/", list);
router.post("/", run);
router.get("/:id", getOne);
router.delete("/:id", remove);

module.exports = router;