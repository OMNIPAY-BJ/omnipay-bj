module.exports = async (_req, res) => {
  return res.status(200).json({
    ok: true,
    service: 'omnipay-bj',
    databaseConfigured: Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL),
    timestamp: new Date().toISOString()
  });
};
