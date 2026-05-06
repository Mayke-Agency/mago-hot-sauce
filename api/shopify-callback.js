export default async function handler(req, res) {
  const { code, shop } = req.query;

  if (!code || !shop) {
    return res.status(400).send("Missing code or shop");
  }

  const response = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return res.status(500).json(data);
  }

  return res.status(200).send(`
    <h1>Copy this token into Vercel</h1>
    <p><strong>SHOPIFY_ADMIN_TOKEN</strong></p>
    <pre>${data.access_token}</pre>
    <p>After saving it, delete this route.</p>
  `);
}
