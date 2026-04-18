export const healthCheck = (_req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
};

export const ping = (_req, res) => {
  res.json({ success: true, message: 'pong' });
};
