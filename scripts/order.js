import {
    // constants
    totalAttempts, baseUrl, apiKey, goodsURI,
    // functions
    notify, buildCard, createNothingBlock
} from './utils.js';

let total = 0;


function prepareInterface() {
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

        if (!(orderCards.children.length)) {
            const nothingBlockMain = "Корзина пуста...";
            const nothingBlockDescription = 
                'Перейдите в <a href="/">каталог</a>, чтобы добавить товары';
            const nothingBlock = createNothingBlock(
                nothingBlockMain,
                nothingBlockDescription
            );
            
            orderCards.parentElement.insertBefore(nothingBlock, orderCards);
        }
    }, 500); 
}
async function fetchCart() {
    if (!(localStorage.getItem('orderGoods'))) {
        localStorage.setItem('orderGoods', JSON.stringify({}));
    }

    const goodsUrl = `${baseUrl}${goodsURI}?api_key=${apiKey}`;
    try {
        const goodsResponse = await fetch(goodsUrl, {method: 'GET'});
        if (!goodsResponse.ok) {
            throw new Error(`Goods response status: ${goodsResponse.status}`);
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

    } catch (error) {
        notify(error, "error");
        console.error(error);

        if (
            error.message.includes(`Goods response status:`)
            && attemptCount < totalAttempts - 1
        ) {
            attemptCount++;
            setTimeout(fetchGoods, 5000);
        }
    }
}


fetchCart();
prepareInterface();