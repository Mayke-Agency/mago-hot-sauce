(function () {
  "use strict";

  let magoShopifyUi = null;
  let magoShopifyClient = null;
  let cartStateWatcher = null;

  document.addEventListener("DOMContentLoaded", () => {
    initFlavorCarousel();
    initShopifyButtons();
    setupCustomCartTrigger();
    initStoreLocator();
    initNewsletterForm();
    initMobileNav();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.body.classList.remove("cart-open");
    }
  });

  const FLAVORS = [
    {
      key: "roasted-habanero",
      name: "Roasted Habanero",
      href: "/roasted-habanero",
      image: "/assets/images/flavors/roasted-habanero.png",
      imageAlt: "Bottle of Mago Roasted Habanero hot sauce",
      kicker: "Featured Flavor",
      description:
        "Smoky, bold, and built to wake up tacos, eggs, burritos, burgers, and more.",
      shopifyHandle: "roasted-habanero-home",
      heat: "Medium-Hot",
    },
    {
      key: "pineapple-habanero",
      name: "Pineapple Habanero",
      href: "/pineapple-habanero",
      image: "/assets/images/flavors/pineapple-habanero.png",
      imageAlt: "Bottle of Mago Pineapple Habanero hot sauce",
      kicker: "Featured Flavor",
      description:
        "Sweet up front, heat on the finish, and made to light up tacos, shrimp, grilled chicken, and anything that needs a little extra.",
      shopifyHandle: "pineapple-habanero-home",
      heat: "Medium",
    },
    {
      key: "ghost-pepper",
      name: "Ghost Pepper",
      href: "/ghost-pepper",
      image: "/assets/images/flavors/ghost-pepper.png",
      imageAlt: "Bottle of Mago Ghost Pepper hot sauce",
      kicker: "Featured Flavor",
      description:
        "Big heat, bold flavor, and a serious finish for the people who want more fire.",
      shopifyHandle: "ghost-pepper-home",
      heat: "Hot",
    },
    {
      key: "roasted-verde",
      name: "Roasted Verde",
      href: "/roasted-verde",
      image: "/assets/images/flavors/roasted-verde.png",
      imageAlt: "Bottle of Mago Roasted Verde hot sauce",
      kicker: "Featured Flavor",
      description:
        "Fresh, easy, and made for everyday use on eggs, tacos, rice bowls, and everything else.",
      shopifyHandle: "roasted-verde-home",
      heat: "Mild-Medium",
    },
  ];

  function initFlavorCarousel() {
    const carouselShell = document.querySelector('[data-carousel="flavors"]');
    if (!carouselShell) return;

    const carouselTrack = carouselShell.querySelector(".flavor-carousel");
    const prevButton = carouselShell.querySelector("[data-carousel-prev]");
    const nextButton = carouselShell.querySelector("[data-carousel-next]");

    if (!carouselTrack || !prevButton || !nextButton) return;

    let currentIndex = getInitialFlavorIndex(carouselTrack);
    let touchStartX = 0;
    let touchEndX = 0;

    renderCarousel();
    carouselShell.setAttribute("tabindex", "0");

    prevButton.addEventListener("click", () => {
      currentIndex = getWrappedIndex(currentIndex - 1, FLAVORS.length);
      renderCarousel();
    });

    nextButton.addEventListener("click", () => {
      currentIndex = getWrappedIndex(currentIndex + 1, FLAVORS.length);
      renderCarousel();
    });

    carouselShell.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        currentIndex = getWrappedIndex(currentIndex - 1, FLAVORS.length);
        renderCarousel();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        currentIndex = getWrappedIndex(currentIndex + 1, FLAVORS.length);
        renderCarousel();
      }
    });

    carouselTrack.addEventListener(
      "touchstart",
      (event) => {
        if (!event.changedTouches.length) return;
        touchStartX = event.changedTouches[0].clientX;
      },
      { passive: true },
    );

    carouselTrack.addEventListener(
      "touchend",
      (event) => {
        if (!event.changedTouches.length) return;
        touchEndX = event.changedTouches[0].clientX;
        handleSwipeGesture();
      },
      { passive: true },
    );

    function handleSwipeGesture() {
      const deltaX = touchEndX - touchStartX;
      const minimumSwipeDistance = 40;

      if (Math.abs(deltaX) < minimumSwipeDistance) return;

      currentIndex =
        deltaX > 0
          ? getWrappedIndex(currentIndex - 1, FLAVORS.length)
          : getWrappedIndex(currentIndex + 1, FLAVORS.length);

      renderCarousel();
    }

    function renderCarousel() {
      const previousIndex = getWrappedIndex(currentIndex - 1, FLAVORS.length);
      const nextIndex = getWrappedIndex(currentIndex + 1, FLAVORS.length);

      carouselTrack.innerHTML = `
        ${buildSideCard(FLAVORS[previousIndex], "previous")}
        ${buildFeaturedCard(FLAVORS[currentIndex])}
        ${buildSideCard(FLAVORS[nextIndex], "next")}
      `;

      carouselTrack.setAttribute(
        "aria-label",
        `Featured flavor: ${FLAVORS[currentIndex].name}. Use previous and next buttons to browse flavors.`,
      );

      attachCardClickHandlers();
      mountShopifyButtonsWithin(carouselTrack);
    }

    function attachCardClickHandlers() {
      carouselTrack.querySelectorAll(".flavor-card-side").forEach((card) => {
        card.addEventListener("click", (event) => {
          if (event.target.closest("a")) return;

          const action = card.getAttribute("data-carousel-position");
          if (!action) return;

          currentIndex =
            action === "previous"
              ? getWrappedIndex(currentIndex - 1, FLAVORS.length)
              : getWrappedIndex(currentIndex + 1, FLAVORS.length);

          renderCarousel();
        });
      });
    }
  }

  function getInitialFlavorIndex(carouselTrack) {
    const featuredCard = carouselTrack.querySelector(
      ".flavor-card-featured[data-flavor]",
    );

    const initialKey = featuredCard
      ? featuredCard.getAttribute("data-flavor")
      : "";

    const initialIndex = FLAVORS.findIndex(
      (flavor) => flavor.key === initialKey,
    );

    return initialIndex >= 0 ? initialIndex : 1;
  }

  function getWrappedIndex(index, length) {
    return ((index % length) + length) % length;
  }

  function buildSideCard(flavor, position) {
    return `
      <article
        class="flavor-card flavor-card-side"
        data-flavor="${escapeHtml(flavor.key)}"
        data-carousel-position="${escapeHtml(position)}"
        aria-label="${escapeHtml(flavor.name)}"
      >
        <a
          class="flavor-card-link"
          href="${escapeHtml(flavor.href)}"
          aria-label="View ${escapeHtml(flavor.name)} hot sauce"
        >
          <img
            src="${escapeHtml(flavor.image)}"
            alt="${escapeHtml(flavor.imageAlt)}"
            width="260"
            height="520"
          />
          <h3>${escapeHtml(flavor.name)}</h3>
        </a>
      </article>
    `;
  }

  function buildFeaturedCard(flavor) {
    return `
      <article
        class="flavor-card flavor-card-featured"
        data-flavor="${escapeHtml(flavor.key)}"
      >
        <a
          class="flavor-card-link"
          href="${escapeHtml(flavor.href)}"
          aria-label="View ${escapeHtml(flavor.name)} hot sauce"
        >
          <img
            src="${escapeHtml(flavor.image)}"
            alt="${escapeHtml(flavor.imageAlt)}"
            width="340"
            height="680"
          />
        </a>

        <div class="flavor-card-content">
          <p class="flavor-kicker">${escapeHtml(flavor.kicker)}</p>
          <h3><a href="${escapeHtml(flavor.href)}">${escapeHtml(flavor.name)}</a></h3>
          <p class="product-heat">${escapeHtml(flavor.heat)}</p>
          <p>${escapeHtml(flavor.description)}</p>

          <div class="carousel-actions">
            <div
              class="shopify-button-wrapper"
              data-shopify-product="${escapeHtml(flavor.shopifyHandle)}"
              data-shopify-button="buy"
              aria-label="Add ${escapeHtml(flavor.name)} to cart"
            ></div>

            <a class="btn btn-secondary" href="/shop">Shop All Flavors</a>
          </div>
        </div>
      </article>
    `;
  }

  function initShopifyButtons() {
    mountShopifyButtonsWithin(document);
  }

  function mountShopifyButtonsWithin(root) {
    const wrappers = root.querySelectorAll(".shopify-button-wrapper");
    if (!wrappers.length) return;

    wrappers.forEach((wrapper) => {
      if (wrapper.dataset.shopifyMounted === "true") return;

      const productKey = wrapper.dataset.shopifyProduct;
      const config = window.MAGO_SHOPIFY_CONFIG;
      const buyButton = window.ShopifyBuy;
      const uiGlobal = window.ShopifyBuy && window.ShopifyBuy.UI;

      if (!productKey || !config || !buyButton || !uiGlobal) {
        renderShopifyFallback(wrapper, productKey);
        return;
      }

      const productConfig = config.products && config.products[productKey];

      if (!productConfig || !productConfig.id) {
        renderShopifyFallback(wrapper, productKey);
        return;
      }

      wrapper.innerHTML = "";
      wrapper.dataset.shopifyMounted = "true";

      if (!magoShopifyClient) {
        magoShopifyClient = buyButton.buildClient({
          domain: config.domain,
          storefrontAccessToken: config.storefrontAccessToken,
        });
      }

      uiGlobal
        .onReady(magoShopifyClient)
        .then((ui) => {
          magoShopifyUi = ui;

          ui.createComponent("product", {
            id: productConfig.id,
            node: wrapper,
            moneyFormat: config.moneyFormat || "%24%7B%7Bamount%7D%7D",
            options: buildShopifyUiOptions(productConfig),
          });

          updateCartIconAfterShopifyChange();
        })
        .catch((error) => {
          console.error("Shopify button failed:", error);
          renderShopifyFallback(wrapper, productKey);
        });
    });
  }

  function buildShopifyUiOptions(productConfig) {
    return {
      product: {
        iframe: false,
        buttonDestination: "cart",
        events: {
          afterRender: updateCartIconAfterShopifyChange,
          addVariantToCart: () => {
            document.body.classList.add("cart-open");
            updateCartOffset();
            startCartStateWatcher();
            updateCartIconAfterShopifyChange();
          },
        },
        contents: {
          img: false,
          imgWithCarousel: false,
          title: false,
          variantTitle: false,
          price: false,
          description: false,
          quantityInput: false,
        },
        text: {
          button: productConfig.buttonText || "Add to Cart",
        },
      },
      cart: {
        popup: false,
        startOpen: false,
        events: {
          afterRender: updateCartIconAfterShopifyChange,
          updateItemQuantity: updateCartIconAfterShopifyChange,
          removeLineItem: updateCartIconAfterShopifyChange,
        },
        text: {
          total: "Subtotal",
          button: "Checkout",
        },
      },
    };
  }

  function setupCustomCartTrigger() {
    document.addEventListener("click", (event) => {
      const cartButton = event.target.closest(".js-open-cart");
      if (!cartButton) return;

      event.preventDefault();

      const cart = magoShopifyUi?.components?.cart?.[0];

      if (!cart || typeof cart.open !== "function") {
        console.warn("Shopify cart is not ready yet.");
        return;
      }

      cart.open();
      document.body.classList.add("cart-open");
      updateCartOffset();
      startCartStateWatcher();
      updateCartIconAfterShopifyChange();
    });
  }

  function startCartStateWatcher() {
    if (cartStateWatcher) return;

    cartStateWatcher = window.setInterval(() => {
      const cartFrame = document.querySelector(".shopify-buy-frame--cart");
      if (!cartFrame) return;

      const rect = cartFrame.getBoundingClientRect();

      const cartIsVisible =
        rect.width > 0 &&
        rect.height > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0 &&
        window.getComputedStyle(cartFrame).display !== "none" &&
        window.getComputedStyle(cartFrame).visibility !== "hidden";

      if (!cartIsVisible) {
        document.body.classList.remove("cart-open");
        window.clearInterval(cartStateWatcher);
        cartStateWatcher = null;
        updateCartIconAfterShopifyChange();
      }
    }, 50);
  }

  function updateCartIcon() {
    const cartButton = document.querySelector(".js-open-cart");
    const cartIcon = document.querySelector(".js-cart-icon");
    const cart = magoShopifyUi?.components?.cart?.[0];

    if (!cartButton || !cartIcon || !cart) return;

    const emptyIcon = cartButton.dataset.cartEmptyIcon;
    const fullIcon = cartButton.dataset.cartFullIcon;

    if (!emptyIcon || !fullIcon) return;

    const lineItems = cart.model?.lineItems || [];

    const itemCount = lineItems.reduce((total, item) => {
      return total + Number(item.quantity || 0);
    }, 0);

    const hasItems = itemCount > 0;

    cartIcon.src = hasItems ? fullIcon : emptyIcon;

    cartButton.setAttribute(
      "aria-label",
      hasItems
        ? `Open cart, ${itemCount} item${itemCount === 1 ? "" : "s"}`
        : "Open cart",
    );
  }

  function updateCartIconAfterShopifyChange() {
    setTimeout(updateCartIcon, 150);
    setTimeout(updateCartIcon, 500);
    setTimeout(updateCartIcon, 1000);
  }

  function renderShopifyFallback(wrapper, productKey) {
    wrapper.dataset.shopifyMounted = "true";
    wrapper.innerHTML = `
      <a class="btn btn-primary" href="${escapeHtml(getProductUrlFromKey(productKey))}">
        Add to Cart
      </a>
    `;
  }

  function getProductUrlFromKey(productKey) {
    if (!productKey) return "/shop";

    if (productKey.includes("roasted-habanero")) return "/roasted-habanero";
    if (productKey.includes("pineapple-habanero")) return "/pineapple-habanero";
    if (productKey.includes("ghost-pepper")) return "/ghost-pepper";
    if (productKey.includes("roasted-verde")) return "/roasted-verde";

    return "/shop";
  }

  function updateCartOffset() {
    const cartFrame = document.querySelector(".shopify-buy-frame--cart");
    if (!cartFrame) return;

    const width = cartFrame.getBoundingClientRect().width || 380;

    document.documentElement.style.setProperty(
      "--shopify-cart-width",
      `${width}px`,
    );
  }

  function initStoreLocator() {
    const form = document.querySelector(".locator-search");
    const input = document.querySelector("#store-search");
    const results = document.querySelector(".locator-results");
    const map = document.querySelector(".locator-map iframe");

    if (!form || !input || !results || !map) return;

    let stores = [];

    fetch("/assets/data/stores.json")
      .then((response) => {
        if (!response.ok) throw new Error("Could not load stores.json");
        return response.json();
      })
      .then((data) => {
        stores = Array.isArray(data) ? data : [];
        renderStores(stores);
      })
      .catch((error) => {
        console.error(error);
        results.innerHTML = `
          <h2>Retail Locations</h2>
          <p>Store locations could not be loaded right now.</p>
        `;
      });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const query = input.value.trim().toLowerCase();

      if (!query) {
        renderStores(stores);
        return;
      }

      const matches = stores.filter((store) => {
        const searchable = [
          store.name,
          store.address,
          store.city,
          store.state,
          store.zip,
          ...(store.products || []),
        ]
          .join(" ")
          .toLowerCase();

        return searchable.includes(query);
      });

      renderStores(matches);

      if (matches[0]) updateMap(matches[0]);
    });

    function renderStores(list) {
      if (!list.length) {
        results.innerHTML = `
          <h2>Retail Locations</h2>
          <p>No locations found. Try searching by city, ZIP code, or store name.</p>
        `;
        return;
      }

      results.innerHTML = `
        <h2>Retail Locations</h2>
        <div class="store-results-grid">
          ${list.map(buildStoreCard).join("")}
        </div>
      `;

      results.querySelectorAll("[data-store-index]").forEach((button) => {
        button.addEventListener("click", () => {
          const index = Number(button.dataset.storeIndex);
          const store = list[index];
          if (store) updateMap(store);
        });
      });
    }

    function buildStoreCard(store, index) {
      const products = Array.isArray(store.products) ? store.products : [];

      return `
        <article class="store-card">
          <h3>${escapeHtml(store.name || "Retail Location")}</h3>
          <p>${escapeHtml(store.address || "")}</p>
          <p>
            ${escapeHtml(store.city || "")}${store.city ? ", " : ""}
            ${escapeHtml(store.state || "")}
            ${escapeHtml(store.zip || "")}
          </p>
          ${
            products.length
              ? `<p class="store-products">${products.map(escapeHtml).join(", ")}</p>`
              : ""
          }
          <button class="btn btn-secondary" type="button" data-store-index="${index}">
            View on Map
          </button>
        </article>
      `;
    }

    function updateMap(store) {
      const query = encodeURIComponent(
        `${store.name || ""} ${store.address || ""} ${store.city || ""} ${
          store.state || ""
        } ${store.zip || ""}`,
      );

      map.src = `https://www.google.com/maps?q=${query}&output=embed`;
    }
  }

  function initNewsletterForm() {
    const newsletterForm = document.getElementById("newsletter-form");
    if (!newsletterForm) return;

    newsletterForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const emailInput = document.getElementById("newsletter-email");
      const message = document.getElementById("newsletter-message");

      if (!emailInput || !message) return;

      message.textContent = "Submitting...";

      try {
        const response = await fetch("/api/newsletter", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name:
              document.getElementById("newsletter-name")?.value.trim() || "",
            email: emailInput.value.trim(),
            company: document.getElementById("newsletter-company")?.value || "",
          }),
        });

        const text = await response.text();

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          console.error("Non-JSON API response:", text);
          message.textContent = "Server returned an error.";
          return;
        }

        if (!response.ok || !data.success) {
          console.error("Newsletter API error:", data);
          message.textContent = data.error || "Something went wrong.";
          return;
        }

        emailInput.value = "";
        message.textContent = "Thanks for subscribing!";
      } catch (error) {
        console.error("Newsletter request failed:", error);
        message.textContent = "Something went wrong.";
      }
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function initMobileNav() {
    const toggle = document.querySelector(".mobile-nav-toggle");
    const nav = document.querySelector(".site-nav");

    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");

      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      toggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation",
      );
    });
  }
})();
