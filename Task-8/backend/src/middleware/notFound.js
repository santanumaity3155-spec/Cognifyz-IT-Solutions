/**
 * 404 Not Found middleware for undefined routes.
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} does not exist on this server.`,
      details: null,
      requestId: req.id,
      timestamp: new Date().toISOString(),
    },
  });
};

export default notFoundHandler;

