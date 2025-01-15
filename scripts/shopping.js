import {
    baseUrl, apiKey, goodsURI, ordersURI
} from './utils.js';


async function translateToRussian(word) {
    const apiUrl = "https://libretranslate.de/translate";
    const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            q: word,
            source: "en",
            target: "ru",
            format: "text"
        })
    });

    if (!response.ok) {
        throw new Error("Translation API error: " + response.statusText);
    }

    const data = await response.json();
    return data.translatedText;
}


// // Example usage
// translateToRussian("hello")
//     .then(russianWord => console.log("Translated word:", russianWord))
//     .catch(error => console.error(error));

function prepareInterface() {
    const priceFilterBlock = document.querySelector('div.price-filter-block');
    priceFilterBlock.addEventListener('click', (event) => {
        if (event.target.classList.contains('increase-price')) {
            event.target.parentElement.parentElement.children[0].stepUp();
        }
    });
    priceFilterBlock.addEventListener('click', (event) => {
        if (event.target.classList.contains('decrease-price')) {
            event.target.parentElement.parentElement.children[0].stepDown();
        }
    });
}


function buildCard(good) {
    const card = document.createElement("div");
    card.classList.add('product-card');
    const discount_ratio = Math.round(
        (1 - good.discount_price / good.actual_price) * 100
    );
    const filledStars = Math.round(good.rating);
    const hollowStars = 5 - filledStars;
    card.innerHTML = `
        <img src="${good.image_url}">
        <div class="product-desc-container">
            <h3 class="product-name">${good.name}</h3>
            <div class="product-rating">
                ${
    good.rating
} ${
    "★".repeat(filledStars)
}<span style="color: #1e425a; opacity: 0.4">${
    "★".repeat(hollowStars)
}</span>
            </div>
            <div class="product-price-container"></div>
            <button class="add-to-cart main-buttons">Добавить</button>
        </div>
    `;
    const priceContainer = card.querySelector('div.product-price-container');
    if (good.discount_price) {
        priceContainer.innerHTML = `
            <span class="product-price">${good.discount_price} ₽</span>
            <div class="product-discount-container">
                <span class="product-old-price">
                    ${good.actual_price} ₽
                </span>
                <span class="product-discount">-${discount_ratio}%</span>
            </div>
            `;
    } else {
        priceContainer.innerHTML = `
            <span class="product-price">${good.actual_price} ₽</span>
            <div class="product-discount-container"></div>
            `;
    }
    
    return card;
}
function fillCategories(categories) {
    const filterMenu = document.querySelector('ul.filter-menu');
    for (let category in categories) {
        const label = document.createElement('label');
        label.classList.add('filter-item');
        label.innerHTML = `
            <input type="checkbox" name="${category}">
            <span>${category}</span>
        `;
        filterMenu.appendChild(label);
    }
}
async function fetchGoods() {
    const goodsUrl = `${baseUrl}${goodsURI}?api_key=${apiKey}`;
    try {
        const goodsResponse = await fetch(goodsUrl, {method: 'GET'});
        if (!goodsResponse.ok) {
            throw new Error(`Goods response status: ${goodsResponse.status}`);
        }
        const goods = await goodsResponse.json();
        const categories = {};

        const cardContainer = document.querySelector('div.card-container');

        // Append cards to container
        for (let i = 0; i < goods.length; i++) {
            let good = goods[i];
            let card = buildCard(good);
            cardContainer.appendChild(card);
            categories[good.main_category] = good.main_category;
        }
        // Dynamically fill categories
        fillCategories(categories);

    } catch (error) {
        console.error(error);
    }
}


prepareInterface();
fetchGoods();