import {
    // constants
    totalAttempts, baseUrl, apiKey, goodsURI,
    // functions
    notify, buildCard, createNothingBlock
} from './utils.js';


let attemptCount = 0;

let startIndex = 0;
let filterOptions = {};


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


function workWithCard(event) {
    const card = event.target.parentElement.parentElement;
    const id = card.dataset.id;
    
    let updatedOrderGoods = JSON.parse(localStorage.getItem('orderGoods'));

    const cardChosen = card.classList.contains('chosen');
    if (!(cardChosen)) {
        updatedOrderGoods[id] = id;
        event.target.textContent = 'Удалить';
    } else {
        delete updatedOrderGoods[id];
        event.target.textContent = 'Добавить';
    }
    localStorage.setItem('orderGoods', JSON.stringify(updatedOrderGoods));
    card.classList.toggle('chosen');
}
function fillCategories(categories) {
    const filterMenu = document.querySelector('ul.filter-menu');
    for (let category in categories) {
        const label = document.createElement('label');
        label.classList.add('filter-item');
        let catCapitalized = category.charAt(0).toUpperCase()
                            + category.slice(1);
        label.innerHTML = `
            <input type="checkbox" name="${category}">
            <span>${catCapitalized}</span>
        `;
        filterMenu.appendChild(label);
    }
}
function getCategories(goods) {
    const categories = {};
    for (let i = 0; i < goods.length; i++) {
        let good = goods[i];
        categories[good.main_category] = good.main_category;
    }
    return categories;
}
function createFetchMoreButton() {
    const fetchMoreButton = document.createElement('button');
    fetchMoreButton.classList.add('main-buttons');
    fetchMoreButton.id = 'fetch-more-button';
    fetchMoreButton.textContent = 'Загрузить ещё';
    
    return fetchMoreButton;
}
function filter(good, filterOptions, categoryCount) {
    console.log(`global id = ${good.id}`);

    let goodDiscount = false;
    if (good.discount_price) {
        goodDiscount = true;
    }
    
    const goodPrice = good.discount_price || good.actual_price;
    if (!(filterOptions["priceMax"] === filterOptions["priceMax"]
      && !(filterOptions["priceMax"]))) {
        if (
            !(filterOptions["priceMax"]
           && (filterOptions["priceMax"] >= goodPrice
           && goodPrice >= filterOptions["priceMin"]))
        ) {
            return false;
        }
    }

    if (!(goodDiscount) && filterOptions["filterSaled"]) {
        return false;
    }
    const filterCategories = filterOptions['filterCategories'];

    if (filterCategories.length === 0 
     || filterCategories.length === categoryCount) {
        return true;
    }
    if (!(filterCategories.includes(good.main_category))) {
        return false;
    }
    
    return true;
}

function addGoodCards(
    goods,
    filterOptions = {
        filterCategories: [],
        priceMin: 0,
        priceMax: 0, 
        filterSaled: false
    },
    count = 6,
    categoryCount = 0
) {
    const cardContainer = document.querySelector('div.card-container');
    
    const goodsCount = goods.length;
    let fetchMoreButton = document.querySelector(
        'button#fetch-more-button'
    );
    
    let renderedCount = 0;
    let i = startIndex;
    const orderGoods = JSON.parse(localStorage.getItem('orderGoods'));
    while (renderedCount <= count && i < goodsCount) {
        console.log(`———————————————————`);
        console.log(`id = ${i} out of ${goodsCount}`);

        let good = goods[i];
        if (filter(good, filterOptions, categoryCount)) {
            if (renderedCount < count) {
                // Crete card
                let chosen = good.id in orderGoods;
                let card = buildCard(good, true, chosen);
                cardContainer.appendChild(card);
                if (i + 1 == goodsCount) {
                    if (fetchMoreButton) fetchMoreButton.remove();
                }
            } else if (renderedCount === count) {
                if (!(fetchMoreButton)) {
                    fetchMoreButton = createFetchMoreButton();
                    // "Fetch more" button functioning
                    fetchMoreButton.addEventListener('click', () => {
                        addGoodCards(
                            goods, filterOptions, 6, categoryCount
                        );
                    });
                    cardContainer.parentElement.appendChild(
                        fetchMoreButton
                    );
                }
            }
            renderedCount++;
        } else {
            if (i + 1 == goodsCount) {
                if (fetchMoreButton) fetchMoreButton.remove();
            }
        }
        startIndex = i;
        i++;
    }
    let nothingBlock = document.querySelector('.nothing-block');
    if (!(cardContainer.children.length)) {
        if (!(nothingBlock)) {
            const nothingBlockMain = 'Товаров нет...';
            const nothingBlockDescription = 
                'Поменяйте фильтры или повторите попытку позже';
            nothingBlock = createNothingBlock(
                nothingBlockMain,
                nothingBlockDescription
            );
            cardContainer.parentElement.insertBefore(
                nothingBlock,
                cardContainer
            );
        }
    } else {
        if (nothingBlock) nothingBlock.remove();
    }
}
function collectOptions(filterOptionForm) {
    const activeFilterCategories = Array.from(filterOptionForm.querySelectorAll(
        '.filter-menu > .filter-item > input[type="checkbox"]:checked'
    )).map((inputElement) => {
        return inputElement.getAttribute('name');
    });
    const filterOptions = {
        "filterCategories": activeFilterCategories
    };

    const priceMin = Number(
        filterOptionForm.querySelector('input#price-min').value || 0
    );
    const priceMax = Number(
        filterOptionForm.querySelector('input#price-max').value || 0
    );
    filterOptions["priceMin"] = priceMin;
    filterOptions["priceMax"] = priceMax;
    
    const filterSaled = filterOptionForm.querySelector(
        '#sale-filter-checkbox[type="checkbox"]:checked'
    );
    if (filterSaled) {
        filterOptions["filterSaled"] = true;
    } else {
        filterOptions["filterSaled"] = false;
    }
    
    return filterOptions;
}
async function fetchGoods() {
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

        const catalog = document.querySelector('div.catalog');
        catalog.addEventListener('click', (event) => {
            if (event.target.classList.contains('add-to-cart')) {
                workWithCard(event);
            }
        });
        // Append cards to container
        addGoodCards(goods, undefined);

        const categories = getCategories(goods);
        const fetchMoreButton = document.querySelector(
            'button#fetch-more-button'
        );
        const applyFiltersButton = document.querySelector(
            'button#apply-filters-button'
        );

        // "Apply filters" button functioning
        applyFiltersButton.addEventListener('click', () => {
            filterOptions = collectOptions(
                applyFiltersButton.parentElement
            );
            if (filterOptions['priceMin'] > filterOptions['priceMax']) {
                const message = 
                    "Нижняя граница стоимости не может быть больше верхней";
                notify(message, "error");
                console.error(message);
                return;
            }
            startIndex = 0;
            let cardContainer = document.querySelector('div.card-container');
            let fetchMoreButton = document.querySelector(
                '#fetch-more-button'
            );

            if (cardContainer) cardContainer.remove();
            if (fetchMoreButton) fetchMoreButton.remove();
            
            cardContainer = document.createElement('div');
            cardContainer.classList.add('card-container');
            catalog.appendChild(cardContainer);

            const allCategoriesLength = Object.keys(categories).length;
            addGoodCards(goods, filterOptions, 6, allCategoriesLength);
        });

        // Dynamically fill categories
        fillCategories(categories);

    } catch (error) {
        const cardContainer = document.querySelector('div.card-container');
        let nothingBlock = document.querySelector('.nothing-block');
        if (!(nothingBlock)) {
            const nothingBlockMain = 'Товаров нет...';
            const nothingBlockDescription = 
                'Поменяйте фильтры или повторите попытку позже';
            nothingBlock = createNothingBlock(
                nothingBlockMain,
                nothingBlockDescription
            );
            cardContainer.parentElement.insertBefore(
                nothingBlock,
                cardContainer
            );
        }
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


fetchGoods();
prepareInterface();