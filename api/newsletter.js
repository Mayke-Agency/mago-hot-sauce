export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const store = process.env.SHOPIFY_STORE_DOMAIN;

    const tokenResponse = await fetch(
      `https://${store}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: process.env.SHOPIFY_CLIENT_ID,
          client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(500).json({
        error: "Could not get Shopify access token",
        details: tokenData,
      });
    }

    const customerResponse = await fetch(
      `https://${store}/admin/api/2024-10/customers.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": tokenData.access_token,
        },
        body: JSON.stringify({
          customer: {
            email,
            tags: "newsletter",
            accepts_marketing: true,
          },
        }),
      },
    );

    const customerData = await customerResponse.json();

    if (!customerResponse.ok) {
      return res.status(500).json({
        error: "Shopify customer creation failed",
        details: customerData,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
