const express = require("express");
const { generate, upload, list, getOne, remove } = require("../controllers/dataset.controller");
const protect = require("../middlewares/auth.middleware");

const router = express.Router();
router.use(protect); // every dataset route requires login

router.get("/", list);
router.post("/generate", generate);
router.post("/upload", upload);
router.get("/:id", getOne);
router.delete("/:id", remove);

module.exports = router;