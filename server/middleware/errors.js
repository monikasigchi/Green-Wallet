export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }); }
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err?.code === 11000) return res.status(409).json({ message: "A record with this value already exists." });
  if (err?.name === "ValidationError" || err?.name === "CastError") return res.status(400).json({ message: err.message });
  if (err?.isJoi) return res.status(400).json({ message: err.details?.[0]?.message || "Invalid input." });
  if (err?.name === "MulterError") return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : "An unexpected server error occurred." });
}
