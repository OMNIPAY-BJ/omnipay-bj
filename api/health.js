module.exports = (req, res) => {
  res.status(200).json({
    success: true,
    status: "OmniPay API is running on Vercel",
    timestamp: new Date().toISOString()
  });
};
