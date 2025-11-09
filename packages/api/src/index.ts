import app from './app';

// Export the app for serverless/bridge usage (CommonJS)
module.exports = app;

// Only start server when not being required by another module (i.e. local dev)
if (process.env.VERCEL !== '1' && require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 VPN Enterprise API running on port ${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Health check: http://localhost:${PORT}/health`);
  });
}