import {
    // constants
    totalAttempts, baseUrl, apiKey, goodsURI, ordersURI,
    // functions
    notify, buildCard, createNothingBlock
} from './utils.js';

let attemptCount = 0;

let total = 0;
let deliveryCost = 200;


function prepareDateField() {
    const dateInput = document.getElementById('delivery-date');
    const todayRaw = new Date();
    const tomorrowRaw = new Date(todayRaw);
    tomorrowRaw.setDate(todayRaw.getDate() + 1);

    const year = todayRaw.getFullYear();
    const month = todayRaw.getMonth() + 1;
    const date = todayRaw.getDate();
    const today = `${year}\
        -${String(month).padStart(2, '0')}\
        -${String(date).padStart(2, '0')}`.replaceAll(' ', '');
    const tomorrowYear = tomorrowRaw.getFullYear();
    const tomorrowMonth = tomorrowRaw.getMonth() + 1;
    const tomorrowDate = tomorrowRaw.getDate();
    const tomorrow = `${tomorrowYear}\
        -${String(tomorrowMonth).padStart(2, '0')}\
        -${String(tomorrowDate).padStart(2, '0')}`.replaceAll(' ', '');

    dateInput.min = today;
    dateInput.value = tomorrow;
}


function recalculateTotal(removeBlock = false) {
    let totalCost = document.querySelector('p.total-cost');

    if (totalCost && removeBlock) totalCost.remove();

    // If interface element doesn't exist
    if (!(totalCost) && total) {
        const formPart2 = document.querySelector('div#form-part-2');
        const formButtonsContainer = document.querySelector(
            '.form-buttons-container'
        );

        totalCost = document.createElement('p');
        totalCost.classList.add('total-cost');
        totalCost.innerHTML = `
            Итоговая стоимость: <span id="total-cost">7777</span> ₽
            <br>
            <span class="total-cost-delivery">
                (стоимость доставки: <span id="delivery-cost">200</span> ₽)
            </span>
        `;
        
        formPart2.insertBefore(totalCost, formButtonsContainer);
    }
    if (document.querySelector('p.total-cost')) {
        const totalCostField = document.querySelector('#total-cost');
        const deliveryCostField = document.querySelector('#delivery-cost');
    
        totalCostField.textContent = total + deliveryCost;
        deliveryCostField.textContent = deliveryCost;
    }
}

function addOrderGoods(orderGoods, goods) {
    const preparedCardIds = Object.keys(orderGoods).map(Number);
    const orderCards = document.querySelector('div#order-cards');
    if (preparedCardIds.length) {
        for (let good of goods) {
            if (preparedCardIds.includes(good.id)) {
                const card = buildCard(good, false);
                orderCards.appendChild(card);
                total += Number(card.dataset.price);
            }
        }
    } else {
        const nothingBlockMain = "Корзина пуста...";
        const nothingBlockDescription = 
            'Перейдите в <a href="/">каталог</a>, чтобы добавить товары';
        const nothingBlock = createNothingBlock(
            nothingBlockMain,
            nothingBlockDescription
        );
        
        orderCards.parentElement.insertBefore(nothingBlock, orderCards);
    }
}
function deleteCard(event) {
    const card = event.target.parentElement.parentElement;
    card.style.transition = 'width 0.3s ease, opacity 0.28s ease';
    card.style.opacity = 0;

    let updatedOrderGoods = JSON.parse(localStorage.getItem('orderGoods'));
    delete updatedOrderGoods[card.dataset.id];
    localStorage.setItem('orderGoods', JSON.stringify(updatedOrderGoods));
    total -= card.dataset.price;

    setTimeout(() => {
        card.style.height = '200px';
        card.style.width = '0';
    }, 300);
    setTimeout(() => {
        const orderCards = document.querySelector('div#order-cards');

        card.remove();
        recalculateTotal();

        if (!(orderCards.children.length)) {
            const nothingBlockMain = "Корзина пуста...";
            const nothingBlockDescription = 
                'Перейдите в <a href="/">каталог</a>, чтобы добавить товары';
            const nothingBlock = createNothingBlock(
                nothingBlockMain,
                nothingBlockDescription
            );
            
            orderCards.parentElement.insertBefore(nothingBlock, orderCards);

            recalculateTotal(true);
        }
    }, 500); 
}
function validate(event) {
    const orderGoods = JSON.parse(localStorage.getItem('orderGoods'));
    const length = Object.keys(orderGoods).length;
    if (!(length)) {
        event.preventDefault();
        const message = `Вы не выбрали ни одного товара`;
        notify(message, "info");
    }
}

function clearOrder(event = null) {
    const orderForm = document.querySelector('form#order');
    localStorage.setItem('orderGoods', JSON.stringify({}));
    total = 0;
    orderForm.reset();

    const orderCards = document.querySelector('div#order-cards');
    let nothingBlock = document.querySelector('.nothing-block');

    while (orderCards.children.length) {
        orderCards.children[0].remove();
    }
    if (!(orderCards.children.length) && !(nothingBlock)) {
        const nothingBlockMain = "Корзина пуста...";
        const nothingBlockDescription = 
            'Перейдите в <a href="/">каталог</a>, чтобы добавить товары';
        nothingBlock = createNothingBlock(
            nothingBlockMain,
            nothingBlockDescription
        );
        
        orderCards.parentElement.insertBefore(nothingBlock, orderCards);

        recalculateTotal(true);
    }
    
}
async function checkSenitizeSend(event) {
    event.preventDefault();

    const form = event.target;
    const subscribeCheckbox = form.querySelector('input[name="subscribe"]');
    if (subscribeCheckbox && subscribeCheckbox.checked) {
        subscribeCheckbox.value = 1;
    }
    const formData = new FormData(form);
    
    // Get ordered goods
    const goodIds = Object.values(
        JSON.parse(
            localStorage.getItem('orderGoods')
        )
    ).map(Number);
    goodIds.forEach((goodId) => {
        formData.append("good_ids", goodId);
    });
    
    // Change date format
    const deliveryDateIn = formData.get('delivery_date').split('-');
    const deliveryDate = 
        `${deliveryDateIn[2]}.${deliveryDateIn[1]}.${deliveryDateIn[0]}`;
    formData.set("delivery_date", deliveryDate);

    const formSendUrl = `${baseUrl}${ordersURI}?api_key=${apiKey}`;
    // Send the form data to the server using fetch
    try {
        const fromSendResponse = await fetch(
            formSendUrl,
            {
                method: 'POST',
                body: formData
            });

        if (!fromSendResponse.ok) {
            if (fromSendResponse.status === 422) {
                throw new Error(
                    `Ошибка обработки заказа. Попробуйте позже`
                );
            } else if (fromSendResponse.status === 404) {
                throw new Error(
                    `Ошибка при отправки заказа. Попробуйте позже`
                );
            } else if (fromSendResponse.status === 500) {
                throw new Error(
                    `Ошибка сервера. Попробуйте позже`
                );
            } else {
                throw new Error(
                    `Неизвестная ошибка. Код ${fromSendResponse.statusText}`
                );
            }
        }
        
        const blank = await fromSendResponse.json();
        console.log(blank);
        
        let message = `Ваш заказ успешно оформлен`;
        notify(message, "success");
        clearOrder();

    } catch (error) {
        notify(error.message, "error");
        console.error(error.message);
    }
}


function recalculateDeliveryCost(dayOfWeek, timeInterval) {
    if (!([0, 6].includes(dayOfWeek)) && timeInterval === "18:00-22:00") {
        deliveryCost = 400;
    } else if ([0, 6].includes(dayOfWeek)) {
        deliveryCost = 500;
    } else {
        deliveryCost = 200;
    }
}
function runFormFunctions() {
    const timeIntervalField = document.querySelector("#delivery-interval");
    timeIntervalField.addEventListener("change", (event) => {
        const deliveryDateInput = document.getElementById('delivery-date');
        const deliveryDate = new Date(deliveryDateInput.value);

        const dayOfWeek = deliveryDate.getDay();
        const timeInterval = event.target.value;
        
        recalculateDeliveryCost(dayOfWeek, timeInterval);
        recalculateTotal();
    });
    const dateField = document.querySelector("#delivery-date");
    dateField.addEventListener("change", (event) => {
        const date = new Date(event.target.value);
        
        const dayOfWeek = date.getDay();
        const timeInterval = document.getElementById('delivery-interval').value;

        recalculateDeliveryCost(dayOfWeek, timeInterval);
        recalculateTotal();
    });
}

async function fetchCart() {
    if (!(localStorage.getItem('orderGoods'))) {
        localStorage.setItem('orderGoods', JSON.stringify({}));
    }

    const goodsUrl = `${baseUrl}${goodsURI}?api_key=${apiKey}`;
    try {
        const goodsResponse = await fetch(goodsUrl, {method: 'GET'});
        if (!goodsResponse.ok) {
            throw new Error(
                `Ошибка загрузки товаров. Код ${goodsResponse.status}`
            );
        }
        const goods = await goodsResponse.json();
        const orderGoods = JSON.parse(localStorage.getItem('orderGoods'));

        addOrderGoods(orderGoods, goods);

        const orderPageWrapper = document.querySelector('.order-page-wrapper');
        orderPageWrapper.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-from-cart')) {
                deleteCard(event, orderGoods);
            }
        });

        const orderForm = document.querySelector('form#order');
        const sendFormButton = document.querySelector('#send-form-button');
        const clearFormButton = document.querySelector('#clear-form-button');
        orderForm.addEventListener('submit', checkSenitizeSend);
        sendFormButton.addEventListener('click', validate);
        clearFormButton.addEventListener('click', clearOrder);

        recalculateTotal();

        runFormFunctions();
        
    } catch (error) {
        const cardContainer = document.querySelector('div.card-container');
        let nothingBlock = document.querySelector('.nothing-block');
        if (!(nothingBlock)) {
            const nothingBlockMain = `Ошибка загрузки товаров...`;
            const nothingBlockDescription = 
                `Повторите попытку позже`;
            const nothingBlock = createNothingBlock(
                nothingBlockMain,
                nothingBlockDescription
            );
            cardContainer.parentElement.insertBefore(
                nothingBlock,
                cardContainer
            );
        }
        
        notify(error.message, "error");
        console.error(error.message);

        if (
            error.message.includes(`Ошибка загрузки товаров. Код`)
            && attemptCount < totalAttempts - 1
        ) {
            attemptCount++;
            setTimeout(fetchCart, 5000);
        }
    }
}

function runOrderPageFunctionality() {
    fetchCart();
    prepareDateField();
}


runOrderPageFunctionality();