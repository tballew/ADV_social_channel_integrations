/* global resources */

var csrfToken;
var temporaryList;

function init() {
    var myHeaders = new Headers();

    myHeaders.append('Type', 'SalesChannelFeedConfig');
    myHeaders.append('System', 'false');
    myHeaders.append('Config', 'undefined');

    var myInit = { method: 'GET',
        headers: myHeaders
    };

    fetch(resources.urlAllSites, myInit)
        .then(sites => sites.json())
        .then(sites => {
            createSiteList(sites);
        });

    fetch(resources.urlReadObjects, myInit)
        .then(response => response.json())
        .then(response => {
            temporaryList = response.customObjects;
            createSelectOptions();
            listProductFeeds();
            createInputHidden(response);
            selectProductFeed();
            selectInitialFeed();
            addNewProductFeed(response);
            deleteFeedItem();
            createFeedItem();
            revertChanges();
        });
}

document.addEventListener("DOMContentLoaded", (event) => {
    const spinup = () => {
        const token = document.querySelector('input[name="csrf_token"]');
        if(!token?.value) {
            return setTimeout(spinup, 500);
        }
        csrfToken = document.querySelector('input[name="csrf_token"]').value;
        init();
    };

    spinup();
});

function createSiteList(sites) {
    sites.forEach(site => {
        document.querySelector('.slds-checkbox--content').innerHTML += `
            <li class="slds-checkbox">
                <input type="checkbox" name="${site.id}" id="${site.id}"
                    value="${site.id}" class="slds-checkbox--checkbox" />
                <label class="slds-checkbox__label" for="${site.id}">
                    <span class="slds-checkbox_faux"></span>
                    <span class="slds-form-element__label">${site.name}</span>
                </label>
            </li>
        `;
    });
}

function createSelectOptions() {
    const type = {
        id: 'type',
        options: [
            'CSV'
        ]
    };

    const fileEncoding = {
        id: 'fileEncoding',
        options: [
            'UTF-8',
            'ISO-8859-1'
        ]
    };

    const feedContext = {
        id: 'feedContext',
        options: [
            'Catalog'
        ]
    };

    const socialCategory = {
        id: 'socialCategory',
        options: [
            { value: 'None', label: 'None' },
            { value: 'SocialChannelGoogle', label: 'Google' },
            { value: 'SocialChannelInstagram', label: 'Instagram' },
            { value: 'SocialChannelSnapchat', label: 'Snapchat' },
            { value: 'SocialChannelTiktok', label: 'TikTok' }
        ]
    };

    const folderName = {
        id: 'folderName',
        options: [
            'IMPEX/',
            'REALMDATA/',
            'IMPEX/src/feeds/export/',
            'TEMP/',
            'CATALOGS/'
        ]
    };

    const googleShoppingCategories = {
        id: 'googleShoppingCategories',
        options: [
            'Animals & Pet Supplies',
            'Apparel & Accessories',
            'Arts & Entertainment',
            'Baby & Toddler',
            'Business & Industrial',
            'Cameras & Optics',
            'Electronics',
            'Food, Beverages & Tobacco',
            'Furniture',
            'Hardware',
            'Health & Beauty',
            'Home & Garden',
            'Luggage & Bags',
            'Mature',
            'Media',
            'Office Supplies',
            'Religious & Ceremonial',
            'Software',
            'Sporting Goods',
            'Toys & Games',
            'Vehicles & Parts'
        ]
    };

    const selectFields = [
        type,
        fileEncoding,
        feedContext,
        socialCategory,
        folderName,
        googleShoppingCategories
    ];

    const populateOptions = options => options.map(option => `<option value="${Object.hasOwnProperty.call(option, 'value') ? option.value : option}">${Object.hasOwnProperty.call(option, 'label') ? option.label : option}</option>`);

    const populateItems = options => options.map(option => `
        <li role="presentation" class="slds-listbox__item">
            <div id="${option}" data-value="${option}"
                class="slds-media slds-listbox__option slds-listbox__option_plain slds-media_small"
                role="option">
                <span
                    class="slds-media__figure slds-listbox__option-icon"></span>
                <span class="slds-media__body">
                    <span class="slds-truncate" title="${option}">${option}</span>
                </span>
            </div>
        </li>
    `).join('');

    selectFields.forEach(el => {
        if (el.id === 'folderName') {
            const folderNameUl = document.querySelector(`#${el.id} ul`);
            folderNameUl.innerHTML += populateItems(el.options);
            controlCombobox(el);
        } else {
            const thisSelect = document.querySelector(`.slds-select#${el.id}`);
            thisSelect.innerHTML += populateOptions(el.options);
        }
    });
}

function controlCombobox(el) {
    const showItens = (itens, value) => {
        if (value) {
            itens.style.display = 'hide';
            itens.style.visibility = 'hidden';
            itens.style.opacity = '0';
        } else {
            itens.style.display = 'block';
            itens.style.visibility = 'visible';
            itens.style.opacity = '1';
        }
    };

    const combobox = document.querySelector(`#${el.id}-combobox`);
    const itens = document.querySelector(`#${el.id}-dropdown`);

    document.addEventListener('click', (event) => {
        if (event.target.closest(`#${el.id} .slds-combobox__form-element`)) {
            showItens(itens, false);
        } else {
            showItens(itens, true);
        }
        if (event.target.closest('.slds-listbox__option')) {
            const thisValue = event.target.closest('.slds-listbox__option').dataset.value;

            combobox.dataset.value = thisValue;

            document.querySelector(`#${el.id}-combobox-value`).value = thisValue;
        }
    });
}

function addNewProductFeed() {
    const buttonAddFeed = document.querySelector('#addfeedbutton');
    const tableBody = document.querySelector('#productsocial-feed-list tbody');
    const modelOfFeed = modelOfNewFeed();

    buttonAddFeed.addEventListener('click', () => {
        let hasNewfeed = true;

        document.querySelectorAll('#productsocial-feed-list tr .slds-truncate span').forEach(el => {
            if (el.innerHTML.indexOf('New Feed') > -1) hasNewfeed = false;
        });

        if (!hasNewfeed) return;

        const tableBodyContent = tableBody.innerHTML;

        const newLine = `
            <tr class="slds-hint-parent" data-position="-1">
                <td data-label="feed-test-2">
                    <div class="slds-truncate" title="${modelOfFeed.id}">
                        <span tabindex="-1">${modelOfFeed.id}</span>
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML = newLine + tableBodyContent;

        productFeedData(modelOfFeed);
        selectProductFeed();
        selectInitialFeed();
    });
}

function changeFeedOnTemporaryList(objModel, rule) {
    const feedId = objModel.id;
    const thisList = temporaryList;
    let newIndex = 0;

    if (rule === 'delete') {
        thisList.forEach((el, i) => {
            if (el.id === feedId) temporaryList.splice(i, 1);
        });
        listProductFeeds();
    }

    if (rule === 'save') {
        const list = [objModel].concat(temporaryList);
        temporaryList = list;
        listProductFeeds("don't sort");
    }

    if (rule === 'update') {
        temporaryList.forEach((el, i) => {
            if (el.id === objModel.id) {
                temporaryList[i] = objModel;
                newIndex = i;
            }
        });
        listProductFeeds();
    }

    selectProductFeed();
    selectInitialFeed(newIndex);
}

function deleteFeedItem() {
    const deleteFeedSequence = () => {
        const objModel = modelOfNewFeed();

        for (const key in objModel) {
            const thisValue = el => el.tagName === 'DIV' ? document.querySelector('#folderName-combobox-value').value : document.querySelector(`#${key}`).value;

            objModel[key] = thisValue(document.querySelector(`#${key}`));
        }

        const myHeaders = new Headers();

        myHeaders.append('Type', 'SalesChannelFeedConfig');
        myHeaders.append('System', 'false');
        myHeaders.append('Config', 'undefined');

        var myInit = { method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(objModel)
        };

        fetch(`${resources.urlDeleteObjects}?csrf_token=${csrfToken}`, myInit)
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    document.querySelector('#informational').innerHTML = 'This product feed has been removed.';
                    document.querySelector('#modalTargetPlace .slds-button--first').style.display = 'none';
                    document.querySelector('#modalTargetPlace .custommodalcancel').innerHTML = 'Close';
                    changeFeedOnTemporaryList(objModel, 'delete');
                } else {
                    document.querySelector('#informational').innerHTML = 'This Product Feed cannot be removed at this time, please try again later.';
                    document.querySelector('#modalTargetPlace .slds-button--first').style.display = 'none';
                    document.querySelector('#modalTargetPlace .custommodalcancel').innerHTML = 'Close';
                }
            });
    };

    document.querySelector('#removefeedbutton').addEventListener('click', () => {
        confirmationModal('destructive', '<h1 class="slds-text-heading_large slds-align_absolute-center" id="informational">Are you sure you want to remove this feed?</h1>', deleteFeedSequence);
    });
}

function revertChanges() {
    document.querySelector('button#revertchanges').addEventListener('click', () => {
        document.querySelector('#productsocial-feed-list .selected').click();
    });
}

function createFeedItem() {
    const createFeedSequence = () => {
        const objModel = modelOfNewFeed();

        const isNewFeed = document.querySelector('#productsocial-feed-list .selected').dataset.position * 1 === -1;

        const availableSites = () => {
            const assignedSites = [];
            const assignedSitesAll = document.querySelectorAll('#assignedSitesContent input[type="checkbox"]');

            assignedSitesAll.forEach(checkbox => {
                if (checkbox.checked) assignedSites.push(checkbox.value);
            });

            return assignedSites;
        };

        for (const key in objModel) {
            const thisValue = el => {
                const element = document.querySelector(`#${key}`);
                if (el.tagName === 'DIV') {
                    return document.querySelector('#folderName-combobox-value').value;
                } if (el.type === 'checkbox') {
                    return element.checked;
                }
                return element.value;
            };

            objModel[key] = thisValue(document.querySelector(`#${key}`));
            if (key === 'socialCategory' && !objModel[key]) objModel.socialCategory = 'None';
        }

        objModel.assignedSites = availableSites();

        const myHeaders = new Headers();

        myHeaders.append('Type', 'SalesChannelFeedConfig');
        myHeaders.append('System', 'false');
        myHeaders.append('Config', 'undefined');

        var myInit = { method: 'POST',
            headers: myHeaders,
            body: JSON.stringify(objModel)
        };

        fetch(`${isNewFeed ? resources.urlCreateObjects : resources.urlSaveObjects}?csrf_token=${csrfToken}`, myInit)
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    document.querySelector('#informational').innerHTML = isNewFeed ? 'This new product feed has been created.' : 'This product feed has been updated';
                    document.querySelector('#modalTargetPlace .slds-button--first').style.display = 'none';
                    document.querySelector('#modalTargetPlace .custommodalcancel').innerHTML = 'Close';

                    changeFeedOnTemporaryList(objModel, (isNewFeed ? 'save' : 'update'));
                } else {
                    document.querySelector('#informational').innerHTML = isNewFeed ? 'This Product Feed cannot be created at this time, please try again later.' : 'This product feed cannot be saved at this time. Try later.';
                    document.querySelector('#modalTargetPlace .slds-button--first').style.display = 'none';
                    document.querySelector('#modalTargetPlace .custommodalcancel').innerHTML = 'Close';
                }
            });
    };

    document.querySelector('#createfeedbutton').addEventListener('click', () => {
        const inputId = document.querySelector('input#id');

        const fileName = document.querySelector('input#fileName');

        const folderName = document.querySelector('#folderName-combobox-value');

        const configuration = document.querySelector('#configuration');

        if (inputId.value.indexOf('New Feed') >= 0 || inputId.value === '') {
            inputId.closest('td').classList.add('slds-has-error');
            return;
        }
        inputId.closest('td').classList.remove('slds-has-error');

        if (folderName.value === '' || !folderName.value) {
            folderName.closest('#folderName-combobox').classList.add('slds-has-error');
            return;
        }
        folderName.closest('#folderName-combobox').classList.remove('slds-has-error');

        if (fileName.value.indexOf('New Feed') >= 0 || fileName.value === '') {
            fileName.closest('td').classList.add('slds-has-error');
            return;
        }
        fileName.closest('td').classList.remove('slds-has-error');

        if (configuration.value === '') {
            configuration.closest('#formconfiguration').classList.add('slds-has-error');
            return;
        }
        configuration.closest('#formconfiguration').classList.remove('slds-has-error');

        confirmationModal('success', '<h1 class="slds-text-heading_large slds-align_absolute-center" id="informational">Are you sure you want save this feed?</h1>', createFeedSequence);
    });
}

function listProductFeeds(noSort) {
    const customObjects = temporaryList;

    let htmlList = '';

    if (!noSort) {
        customObjects.sort(function (a, b) {
            if (a.creationDate < b.creationDate) {
                return 1;
            }
            if (a.creationDate > b.creationDate) {
                return -1;
            }
            return 0;
        });
    }

    customObjects.forEach((el, i) => {
        htmlList += `
        <tr class="slds-hint-parent" data-position="${i}">
            <td data-label="feed-test-2">
                <div class="slds-truncate" title="${el.id}">
                    <span tabindex="-1">${el.id}</span>
                </div>
            </td>
        </tr>`;
    });

    document.querySelector('#productsocial-feed-list tbody').innerHTML = htmlList;
}

function selectInitialFeed(index) {
    const thisIndex = index || 0;

    document.querySelectorAll('#productsocial-feed-list tbody tr').forEach((el, i) => {
        if (i === thisIndex) el.click();
    });
}

function selectProductFeed() {
    const customObjects = temporaryList;

    const trList = document.querySelectorAll('#productsocial-feed-list tbody tr');

    const objModel = modelOfNewFeed();

    trList.forEach((el) => {
        el.addEventListener('click', (event) => {
            trList.forEach(element => {
                element.classList.remove('selected');
            });

            const position = event.currentTarget.getAttribute('data-position');

            if (position >= 0) {
                productFeedData(customObjects[position]);
            } else {
                productFeedData(objModel);
            }

            event.currentTarget.classList.add('selected');
        });
    });
}

function productFeedData(customObjects) {
    document.querySelector('#feed-data-title').innerHTML = customObjects.id;

    for (const key in customObjects) {
        const htmlElement = document.getElementById(key);

        document.querySelectorAll('.slds-checkbox--checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        if (customObjects.assignedSites.length) {
            customObjects.assignedSites.forEach(site => {
                const thisCheckbox = document.querySelector(`input#${site}`);
                if (thisCheckbox) {
                    thisCheckbox.checked = true;
                } else {
                    console.log(`The ${site} website does not appear to be available on this page. Please contact your administrator.`);
                }
            });
        }

        if (htmlElement) {
            if (htmlElement.getAttribute('type') === 'checkbox') {
                htmlElement.checked = customObjects[key];
            } else if (htmlElement.classList.contains('slds-combobox')) {
                document.querySelector('#folderName-combobox-value').value = customObjects[key];
            } else {
                htmlElement.value = customObjects[key];
            }
        }
    }
}

function createInputHidden(response) {
    const fields = response.metaData.fields;

    const otherFields = fields.filter(field => !document.querySelector(`#${field.name}`));

    otherFields.forEach(field => {
        document.querySelector('.hidden_fields').innerHTML += `
            <input type="hidden" id="${field.name}" name="${field.name}" value="" />
        `;
    });
}

// eslint-disable-next-line no-unused-vars
function modalProductListControls() {
    const buttons = document.querySelectorAll('#productPickerModal .slds-button');

    const modalPrincipal = document.querySelector('#productPickerModal');

    const modalInputPageNumber = document.querySelector('input#pages-input');

    // const productstr = document.querySelectorAll('.btn-productid');

    document.querySelector('#feed-product-modal-open').addEventListener('click', () => openProductListModal());

    buttons.forEach((button) => {
        button.addEventListener('click', (event) => {
            const pageNumber = modalPrincipal.dataset.pageNumber * 1;
            const numberOfItens = modalPrincipal.dataset.numberOfItens * 1;
            const totalproducts = modalPrincipal.dataset.totalproducts * 1;
            const totalPages = Math.ceil(totalproducts / numberOfItens);

            if (event.currentTarget.classList.contains('slds-button--first')) {
                if (pageNumber > 1) {
                    getProductList(1, 0);
                }
            }
            if (event.currentTarget.classList.contains('slds-button--prev')) {
                if (pageNumber > 1) {
                    const nextPage = pageNumber - 1;
                    const prevItens = (nextPage - 1) * numberOfItens;
                    getProductList(nextPage, prevItens);
                }
            }
            if (event.currentTarget.classList.contains('slds-button--next')) {
                if (pageNumber < totalPages) {
                    const nextPage = pageNumber + 1;
                    const nextItens = (nextPage - 1) * numberOfItens;
                    getProductList(nextPage, nextItens);
                }
            }
            if (event.currentTarget.classList.contains('slds-button--last')) {
                if (pageNumber !== totalPages) {
                    const nextPage = totalPages - 1;
                    const nextItens = (nextPage * numberOfItens);
                    getProductList(totalPages, nextItens);
                }
            }
            if ((event.currentTarget.classList.contains('slds-button--goto'))) {
                const inputPageNumberValue = modalInputPageNumber.value * 1;
                if (pageNumber === inputPageNumberValue) return;
                if (inputPageNumberValue > 0 && inputPageNumberValue <= totalPages) {
                    const nextPage = inputPageNumberValue;
                    const nextItens = (nextPage - 1) * numberOfItens;
                    getProductList(nextPage, nextItens);
                } else {
                    modalInputPageNumber.value = pageNumber;
                }
            }
            if ((event.currentTarget.classList.contains('slds-modal__close'))) {
                closeProductListModdalModal();
            }
        });
    });
}

function modalIdProductsButtons() {
    document.querySelectorAll('.slds-hint-parent--products').forEach(button => {
        button.addEventListener('dblclick', (e) => {
            const productId = e.currentTarget.dataset.productid;
            document.querySelector('#feedproductid').value = productId;
            // closeModal();
        });
    });
}

function closeProductListModdalModal() {
    document.querySelector('#productPickerModal').classList.remove('slds-fade-in-open');
    document.querySelector('.slds-backdrop--productPickerModal').classList.remove('slds-backdrop_open');
}

function openProductListModal() {
    getProductList(1, 1);
    document.querySelector('#productPickerModal').classList.add('slds-fade-in-open');
    document.querySelector('.slds-backdrop--productPickerModal').classList.add('slds-backdrop_open');
}

function getProductList(page, start) {
    const myHeaders = new Headers();

    const pageNumber = (page && page > 1) ? page.toString() : '1';
    const startNumber = (start && start > 0) ? start.toString() : '0';
    const numberOfItens = 15;
    const modalPrincipal = document.querySelector('#productPickerModal');

    myHeaders.append('Type', 'Product');
    myHeaders.append('System', 'true');
    myHeaders.append('Config', 'undefined');

    var myInit = { method: 'GET',
        headers: myHeaders
    };

    fetch(`${resources.urlReadObjects}?page=${pageNumber}&start=${startNumber}&limit=${numberOfItens}&csrf_token=${csrfToken}`, myInit)
        .then(response => response.json())
        .then(json => {
            modalPrincipal.dataset.pageNumber = pageNumber;
            modalPrincipal.dataset.startNumber = startNumber;
            modalPrincipal.dataset.numberOfItens = numberOfItens;
            modalPrincipal.dataset.totalproducts = json.total;

            populateProductPickerModal(json.customObjects);
        });
}

function populateProductPickerModal(listProducts) {
    const modalProductContent = document.querySelector('#productPickerModal tbody');

    const modalPagePosition = document.querySelector('#productPickerModal .slds-badge');

    const actualPage = document.querySelector('#pages-input');

    const numberOfPages = document.querySelector('.slds-col--modal-footer .totals');

    const modalPrincipal = document.querySelector('#productPickerModal');

    const start = modalPrincipal.dataset.startNumber * 1;

    const itensPerPage = modalPrincipal.dataset.numberOfItens * 1;

    const totalItens = modalPrincipal.dataset.totalproducts * 1;

    const actualProductIndex = start + 1;

    const totalPages = Math.ceil(totalItens / itensPerPage);

    modalProductContent.innerHTML = '';

    listProducts.forEach(product => {
        const productItem = `
            <tr class="slds-hint-parent slds-hint-parent--products"  data-productid="${product.ID}" >
                <td data-label="Product ID">
                    <div class="slds-truncate btn-productid" title="${product.ID}"">${product.ID}</div>
                </td>
                <td data-label="Product Name">
                    <div class="slds-truncate btn-productid" title="${product.name}">${product.name}</div>
                </td>
            </tr>
        `;

        modalProductContent.innerHTML += productItem;
    });

    const actualProductIndexRange = actualProductIndex + 14 < totalItens ? actualProductIndex + 14 : totalItens;

    modalPagePosition.innerHTML = `Displaing ${actualProductIndex} - ${actualProductIndexRange} of ${totalItens}`;

    actualPage.value = modalPrincipal.dataset.pageNumber * 1;

    numberOfPages.innerHTML = `of ${totalPages}`;

    modalIdProductsButtons();
}

function modelOfNewFeed() {
    return {
        fileEncoding: 'UTF-8',
        type: 'CSV',
        includeNoPriceProducts: false,
        includeOfflineProducts: false,
        includeOutOfStockProducts: false,
        includeSearchableIfUnavailableProducts: false,
        id: '- New Feed -',
        UUID: null,
        assignedSites: [],
        configuration: null,
        creationDate: null,
        exportCategoryId: null,
        fileName: null,
        folderName: null,
        googleShoppingCategories: null,
        lastModified: null,
        socialCategory: 'None',
        feedContext: 'Catalog'
    };
}

function confirmationModal(buttonType, text, cb) {
    const modalTargetPlace = document.querySelector('#modalTargetPlace');

    const customModal = `
        <div class="slds-modal__container" id="customModal" data-typeofmodal="">
            <div class="slds-modal__content slds-p-around_medium">
            ${text}
            </div>
            <div class="slds-modal__footer">
                <ul class="slds-button-group-row slds-col slds-size_1-of-1 slds-align_absolute-center">
                    <li class="slds-button-group-item">
                        <button class="slds-button slds-button--first slds-button_${buttonType}" title="First">${buttonType === 'success' ? 'Save' : 'Remove Feed'}</button>
                    </li>
                    <li class="slds-button-group-item">
                        <button class="slds-button custommodalcancel slds-button_neutral" title="Cancel">Cancel</button>
                    </li>
            </div>
        </div>
        <div class="slds-backdrop slds-backdrop_open" id="custom-backdrop"></div>
    `;

    modalTargetPlace.innerHTML = customModal;

    const thisButons = document.querySelectorAll('#modalTargetPlace button');

    thisButons.forEach(btn => {
        btn.addEventListener('click', e => {
            if (e.currentTarget.classList.contains('custommodalcancel')) {
                modalTargetPlace.innerHTML = '';
            } else {
                cb();
            }
        });
    });

    document.querySelector('#custom-backdrop').addEventListener('click', () => {
        modalTargetPlace.innerHTML = '';
    });
}
