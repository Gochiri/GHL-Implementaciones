// Simple diagnostic - no imports
export default function handler(req, res) {
  res.status(200).json({
    step: 1,
    message: 'Debug endpoint works',
    nodeVersion: process.version,
    env: process.env.VERCEL ? 'vercel' : 'local'
  });
}
