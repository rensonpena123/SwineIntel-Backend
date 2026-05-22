// @desc    Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  // If the controller didn't explicitly set a status code, default to a 500 Server Error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode);

  res.json({
    message: err.message,
    // Only display the detailed stack trace if you are running locally in development mode
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

// @desc    Fallback middleware for handling invalid API URLs (404 Not Found)
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - [${req.method}] ${req.originalUrl}`);
  res.status(404);
  next(error); // Passes the 404 error straight down to the errorHandler below
};