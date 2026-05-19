export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, company } = req.body || {};

    if (company) {
      return res.status(200).json({ success: true });
    }

    const timeElapsed = Date.now() - Number(formStarted);

    if (timeElapsed < 2500) {
      return res.status(200).json({ ok: true });
    }

    const store = process.env.SHOPIFY_STORE_DOMAIN;
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!store || !clientId || !clientSecret) {
      return res.status(500).json({
        error: "Missing environment variables",
        hasStore: Boolean(store),
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
      });
    }

    const tokenResponse = await fetch(
      `https://${store}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    );

    const tokenText = await tokenResponse.text();

    let tokenData;
    try {
      tokenData = JSON.parse(tokenText);
    } catch {
      return res.status(500).json({
        error: "Shopify token response was not JSON",
        status: tokenResponse.status,
        responsePreview: tokenText.slice(0, 500),
      });
    }

    if (!tokenResponse.ok || !tokenData.access_token) {
      return res.status(500).json({
        error: "Could not get Shopify access token",
        status: tokenResponse.status,
        details: tokenData,
      });
    }

    const customerResponse = await fetch(
      `https://${store}/admin/api/2024-10/customers.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Shopify-Access-Token": tokenData.access_token,
        },
        body: JSON.stringify({
          customer: {
            first_name: name,
            email,
            tags: "newsletter",
            email_marketing_consent: {
              state: "subscribed",
              opt_in_level: "single_opt_in",
              consent_updated_at: new Date().toISOString(),
            },
          },
        }),
      },
    );

    const customerText = await customerResponse.text();

    let customerData;
    try {
      customerData = JSON.parse(customerText);
    } catch {
      return res.status(500).json({
        error: "Shopify customer response was not JSON",
        status: customerResponse.status,
        responsePreview: customerText.slice(0, 500),
      });
    }

    if (!customerResponse.ok) {
      return res.status(500).json({
        error: "Shopify customer creation failed",
        status: customerResponse.status,
        details: customerData,
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({
      error: "Server error",
      message: error.message,
    });
  }
}
