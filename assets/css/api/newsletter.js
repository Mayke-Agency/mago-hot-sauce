export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email required",
      });
    }

    const store = process.env.SHOPIFY_STORE_DOMAIN;
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    /*
      STEP 1:
      Request access token
    */

    const tokenResponse = await fetch(
      `https://${store}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
        }),
      },
    );

    const tokenData = await tokenResponse.json();

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return res.status(500).json({
        error: "Could not get Shopify access token",
        details: tokenData,
      });
    }

    /*
      STEP 2:
      Create customer
    */

    const customerResponse = await fetch(
      `https://${store}/admin/api/2024-10/customers.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": accessToken,
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
        error: "Customer creation failed",
        details: customerData,
      });
    }

    return res.status(200).json({
      success: true,
      customer: customerData,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
}
