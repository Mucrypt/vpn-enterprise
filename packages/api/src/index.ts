import app from './app';

// Export the app for serverless/bridge usage (CommonJS)
module.exports = app;

// Only start server when not being required by another module (i.e. local dev)
if (process.env.VERCEL !== '1' && require.main === module) {
  const PORT = Number(process.env.PORT || 5000);
  const HOST = process.env.LISTEN_HOST || '0.0.0.0';

  const server = app.listen(PORT, HOST, () => {
    const addr = server.address();
    let hostDisplay = HOST;
    if (addr && typeof addr === 'object') {
      hostDisplay = addr.address === '::' ? 'localhost' : addr.address || hostDisplay;
    }

    console.log(`🚀 VPN Enterprise API running on ${hostDisplay}:${PORT}`);
    console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Health check: http://${hostDisplay}:${PORT}/health`);
  });
}