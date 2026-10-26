const notFound = (req, res) =>
  res.status(404).json({ success: false, message: "Route not found" });

// One place that turns every error into a clean JSON response.
const errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message;

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid JSON body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Payload too large";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  } else if (err.code === 11000) {
    status = 409;
    message = "That value already exists";
  } else if (err.name === "CastError") {
    status = 400;
    message = "Invalid identifier";
  }

  if (status >= 500) {
    console.error(err); // log the details, never send them to the client
    message = "Internal server error";
  }

  res.status(status).json({ success: false, message });
};

module.exports = { notFound, errorHandler };