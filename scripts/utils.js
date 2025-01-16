export let totalAttempts = 10;

export const baseUrl = 'https://edu.std-900.ist.mospolytech.ru';
export const apiKey = 'ea3b214c-57f1-48a8-836f-6a2446e2c634';

export const goodsURI = '/exam-2024-1/api/goods';
export const ordersURI = '/exam-2024-1/api/orders';


export function notify(message, type) {
    alert(message);
}
export function buildCard(good, onCatalogPage = true, chosen = false) {
    const card = document.createElement("div");
    card.classList.add('product-card');
    card.dataset.id = good.id;
    card.dataset.price = good.discount_price || good.actual_price;

    const filledStars = Math.round(good.rating);
    const hollowStars = 5 - filledStars;
    let buttonText = 'Добавить';
    let buttonClass = 'add-to-cart';
    if (!(onCatalogPage)) {
        buttonText = 'Удалить';
        buttonClass = 'delete-from-cart';
    }
    if (chosen) {
        card.classList.add('chosen');
        buttonText = 'Удалить';
    }
    
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
            <button class="${buttonClass} main-buttons">${buttonText}</button>
        </div>
    `;
    
    const priceContainer = card.querySelector('div.product-price-container');
    if (good.discount_price) {
        card.dataset.price = good.discount_price;
        const discount_ratio = Math.round(
            (1 - good.discount_price / good.actual_price) * 100
        );
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