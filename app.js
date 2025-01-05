document.addEventListener("DOMContentLoaded", () => {
  const storedProducts = localStorage.getItem("products");

  if (storedProducts) {
    const products = JSON.parse(storedProducts);
    const electronicsProducts = products.filter(
      (product) => product.category.toLowerCase() === "wearable"
    );
    displayProducts(electronicsProducts);

    // Attach event listeners for rating inputs
    attachRatingListeners(products);
  } else {
    fetch("products.json")
      .then((response) => response.json())
      .then((products) => {
        localStorage.setItem("products", JSON.stringify(products));
        const electronicsProducts = products.filter(
          (product) => product.category.toLowerCase() === "electronics"
        );
        displayProducts(electronicsProducts);

        // Attach event listeners for rating inputs
        attachRatingListeners(products);
      })
      .catch((error) => console.log("Error fetching products:", error));
  }

  function attachRatingListeners(products) {
    const ratingInputs = document.querySelectorAll('input[name="rate_product"]');
    ratingInputs.forEach((input) => {
      input.addEventListener("input", (event) => {
        const productId = input.id.split("-")[1]; // Extract product ID from input ID
        const newRating = parseFloat(event.target.value);

        // Update product rating in the products array
        const productIndex = products.findIndex((p) => p.id == productId);
        if (productIndex > -1) {
          products[productIndex].rating = newRating;

          // Update the local storage with the new rating
          localStorage.setItem("products", JSON.stringify(products));
          console.log(
            `Updated rating for product ID ${productId} to ${newRating}`
          );
        }
      });
    });
  }
});


  // Function to display products
  function displayProducts(products) {
    const productContainer = document.querySelector("#product-list"); // Assuming there's a div to hold the products
    productContainer.innerHTML = ""; // Clear existing content

    products.forEach((product) => {
      const productDiv = document.createElement("div");
      productDiv.classList.add("product");

      productDiv.innerHTML = `
        <div class="image_product">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="name_product">
          <h3>${product.name}</h3>
        </div>
        <div class="price_product">
          <h4>${product.price}$</h4>
        </div>
        <div class="desc_product">
          <p>${product.description}</p>
        </div>
        <div>
          <label for="qty-${product.id}">Quantity</label>
          <input type="number" name="qty" id="qty-${product.id}" min="1" max="10">
        </div>
        <label for="rate_product-${product.id}">Rate Product:</label>
        <input type="number" id="rate_product-${product.id}" name="rate_product" min="0" max="5" step="0.1" placeholder="0.0">
        <div class="add_to_cart">
          <a href="#">
            <button type="button">Add To Cart</button>
          </a>
        </div>
      `;

      productContainer.appendChild(productDiv);
    });
  }

  // Search functionality for products
  document.getElementById("search").addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const products = document.querySelectorAll(".product");

    products.forEach((product) => {
      const name = product.querySelector(".name_product h3").textContent.toLowerCase();
      const description = product.querySelector(".desc_product p").textContent.toLowerCase();

      if (name.includes(query) || description.includes(query)) {
        product.style.display = "block";
      } else {
        product.style.display = "none";
      }
    });
  });

  localStorage.setItem("products", JSON.stringify(products));


  function addToCart(id) {
    const LoggedInUser = localStorage.getItem("Loggedinuser");
  
    // Find the product by its ID
    const product = productsData.find((p) => p.id === id);
    if (!product) {
      console.error("Product not found!");
      return;
    }
  
    // Retrieve the existing cart from localStorage
    const existingCart = localStorage.getItem("cart");
    let cart = existingCart ? JSON.parse(existingCart) : [];
  
    // Check if the user has a cart
    let userCart = cart.find((c) => c.user_id === LoggedInUser);
    if (!userCart) {
      userCart = {
        user_id: LoggedInUser,
        items: [],
        summary: {
          total_items: 0,
          total_price_before_discount: 0,
          total_discount: 0,
          total_price_after_discount: 0,
          delivery_fee: 15.0,
          taxes: 17.52,
          final_total: 0,
        },
      };
      cart.push(userCart);
    }
  
    if (product.is_bundle) {
      // Handle bundle products
      let bundleProducts = [];
      let totalBundlePrice = 0;
  
      product.bundle_items.forEach((bundleItemId) => {
        const bundleProduct = productsData.find((prod) => prod.id === bundleItemId);
        if (bundleProduct) {
          const discountedPrice = bundleProduct.price * (1 - parseInt(product.discount) / 100);
          totalBundlePrice += discountedPrice;
  
          // Add individual bundle items with their details
          bundleProducts.push({
            id: bundleProduct.id,
            name: bundleProduct.name,
            image: bundleProduct.image,
            price: bundleProduct.price,
            discounted_price: discountedPrice.toFixed(2),
            discount: product.discount,
            category: bundleProduct.category,
            quantity: 1,
          });
        }
      });
  
      const bundleEntry = {
        id: product.id,
        name: product.name,
        image: product.image,
        price: product.price,
        discounted_price: totalBundlePrice.toFixed(2),
        discount: product.discount,
        category: product.category,
        quantity: 1,
        bundle_items: bundleProducts,
        subtotal: totalBundlePrice.toFixed(2),
      };
  
      userCart.items.push(bundleEntry);
    } else {
      // Handle individual products
      const existingItem = userCart.items.find((item) => item.id === id);
      const discountedPrice = product.price * (1 - parseInt(product.discount || 0) / 100);
  
      if (existingItem) {
        // Update quantity and subtotal for the existing product
        existingItem.quantity += 1;
        existingItem.subtotal = (existingItem.discounted_price * existingItem.quantity).toFixed(2);
      } else {
        // Add the product to the cart as a new entry
        userCart.items.push({
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          discounted_price: discountedPrice.toFixed(2),
          discount: product.discount || 0,
          category: product.category,
          quantity: 1,
          subtotal: discountedPrice.toFixed(2),
        });
      }
    }
  
    // Update the cart summary after adding the item
    updateCartSummary(userCart);
  
    // Save the updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));
  
    console.log(`${product.name} added to cart.`);
  
    // Disable the button for the added bundle
    const addButton = document.getElementById(`add-btn-${id}`);
    if (addButton) {
      addButton.disabled = true;
      addButton.textContent = "Added to Cart";
    }
  }
  
  function updateCartSummary(userCart) {
    let totalItems = 0;
    let totalPriceBeforeDiscount = 0;
    let totalDiscount = 0;
    let totalPriceAfterDiscount = 0;
    const deliveryFee = 15.0;
    const taxes = 17.52;
  
    userCart.items.forEach((item) => {
      const itemQuantity = item.bundle_items ? item.bundle_items.length * item.quantity : item.quantity;
      const itemPriceBeforeDiscount = item.bundle_items
        ? item.bundle_items.reduce((sum, p) => sum + p.price * item.quantity, 0)
        : item.price * item.quantity;
      const itemDiscount = item.bundle_items
        ? item.bundle_items.reduce(
            (sum, p) => sum + ((p.price * (parseFloat(p.discount) || 0)) / 100) * item.quantity,
            0
          )
        : ((item.price * (parseFloat(item.discount) || 0)) / 100) * item.quantity;
      const itemPriceAfterDiscount = parseFloat(item.subtotal);
  
      totalItems += itemQuantity;
      totalPriceBeforeDiscount += itemPriceBeforeDiscount;
      totalDiscount += itemDiscount;
      totalPriceAfterDiscount += itemPriceAfterDiscount;
    });
  
    const finalTotal = totalPriceAfterDiscount + deliveryFee + taxes;
  
    userCart.summary = {
      total_items: totalItems,
      total_price_before_discount: totalPriceBeforeDiscount.toFixed(2),
      total_discount: totalDiscount.toFixed(2),
      total_price_after_discount: totalPriceAfterDiscount.toFixed(2),
      delivery_fee: deliveryFee.toFixed(2),
      taxes: taxes.toFixed(2),
      final_total: finalTotal.toFixed(2),
    };
  }
