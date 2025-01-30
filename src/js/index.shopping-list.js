// @ts-check
import { ArticleFactory, ARTICLE_TYPES } from 'classes/ShopArticle'
import { simpleFetch } from '../js/lib/simpleFetch.js'
import { HttpError } from './classes/HttpError.js'
import { INITIAL_STATE, store } from './store/redux.js'
import { installRouter } from './lib/router.js'

/** @import {State} from './store/redux.js' */
/** @import {Article, UsualProduct} from './classes/ShopArticle.js' */

const myFactory = new ArticleFactory

// Assign DOM Content Loaded event
document.addEventListener('DOMContentLoaded', onDomContentLoaded)

// ======== EVENTS ======== //
function onDomContentLoaded() {
  const articleNameElement = document.getElementById('articleName')
  const newArticleElement = document.getElementById('newArticle')
  const newListElement = document.getElementById('newList')

  // Activate router
  installRouter((/** @type {Location} */ location) => {handleNavigation(location)})

  articleNameElement?.addEventListener('keyup', onArticleNameKeyUp)
  newArticleElement?.addEventListener('click', onNewArticleClick)
  newListElement?.addEventListener('click', onNewListClick)

  window.addEventListener('stateChanged', (event) => {
    console.log('stateChanged', /** @type {CustomEvent} */(event).detail)
  })

  readShoppingList()
  getShoppingListTotalAmount()
  getUsualProducts()
}

function onArticleNameKeyUp() {
  const articleNameElement = document.getElementById('articleName')
  const newArticleElement = document.getElementById('newArticle')

  if (articleNameElement?.getAttribute('value') !== '') {
    newArticleElement?.removeAttribute('disabled')
  } else {
    newArticleElement?.setAttribute('disabled', 'true')
  }
}

function onNewArticleClick() {
  createShoppingListItem()
  cleanUpForm()
}

function onNewListClick() {
  resetShoppingList()
}

// ======== METHODS ======== //

/**
 * Reset shopping list
 */
function resetShoppingList() {
  // 1. Empty the shopping list
  store.article.deleteAll(() => {updateLocalStorage(store.getState())})
  // 2. Empty Table Element
  emptyTableElement()
  // 3. Update Table total amount cell
  getShoppingListTotalAmount()
  // 4. Clean Up form
  cleanUpForm()
}

/**
 * Clean up form
 */
function cleanUpForm() {
  // 1. Get inputs and save them in const
  const articleNameElement = document.getElementById('articleName')
  const qtyElement = document.getElementById('qty')
  const priceElement = document.getElementById('price')
  // 2. Set input values to ''
  if (articleNameElement) {
    /** @type {HTMLInputElement} */(articleNameElement).value = ''
  }
  if (qtyElement) {
    /** @type {HTMLInputElement} */(qtyElement).value = ''
  }
  if (priceElement) {
    /** @type {HTMLInputElement} */(priceElement).value = ''
  }
}

// C.R.U.D.

/**
 * Create new shopping list item
 */
function createShoppingListItem() {
  const articleNameElement = document.getElementById('articleName')
  const qtyElement = document.getElementById('qty')
  const priceElement = document.getElementById('price')

  const articleData = {
    name: getInputValue(articleNameElement),
    qty: getInputValue(qtyElement),
    price: getInputValue(priceElement)
  }
  const newArticle = myFactory.create({ type: ARTICLE_TYPES.USUAL, articleData: articleData })
  store.article.create(newArticle, () => {updateLocalStorage(store.getState())})

  // Update html
  getShoppingListTotalAmount()
  addNewRowToShoppingListTable(newArticle)
  resetFocus()
}

/**
 * Retrieves the value from the specified input element.
 * @param {HTMLElement | null} inputElement - The input element from which to get the value.
 * @returns {string} The value of the input element, or an empty string if the element is null.
 */
function getInputValue(inputElement) {
  if (inputElement) {
    return /** @type {HTMLInputElement} */(inputElement).value
  } else {
    return ''
  }
}

/**
 * Add a new row to the shopping list table element
 * @param {Article | UsualProduct} newArticleObject
 * @returns {any}
 */
function addNewRowToShoppingListTable(newArticleObject){
  const shoppingListTableBodyElement = document.getElementById('shoppingListTableBody')
  // 1. Create HTML Elements that represents the new article
  const newArticleTableRow = document.createElement('tr')
  const newArticleTableCellQty = document.createElement('td')
  const newArticleTableCellName = document.createElement('td')
  const newArticleTableCellPrice = document.createElement('td')
  const newArticleTableCellSubtotal = document.createElement('td')
  const newArticleDeleteButtonCell = document.createElement('td')
  const newArticleDeleteButton = document.createElement('button')
  const newArticleImg = document.createElement('img')
  const clickEvent = new MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    view: window
  })
  // 1.1. Assign Table Cells values
  newArticleTableCellQty.innerText = String(newArticleObject.qty)
  newArticleTableCellName.innerText = newArticleObject.name
  newArticleTableCellName.addEventListener('click', buyArticle.bind(newArticleTableCellName, clickEvent, newArticleObject.id, newArticleTableRow))
  newArticleTableCellPrice.innerText = String(newArticleObject.price)
  newArticleTableCellSubtotal.innerText = String(newArticleObject.qty * newArticleObject.price)
  // newArticleDeleteButton.innerHTML = '&#128473;&#xfe0e;'
  newArticleDeleteButton.className = 'icon-button delete-button'
  newArticleImg.src = './assets/img/cancel.png'
  newArticleImg.setAttribute('alt', 'Eliminar')
  newArticleDeleteButton.appendChild(newArticleImg)
  newArticleDeleteButton.addEventListener('click', deleteShoppingListItem.bind(newArticleDeleteButton, clickEvent, newArticleObject.id, newArticleTableRow))
  newArticleDeleteButtonCell.appendChild(newArticleDeleteButton)
  // 1.2. Append Table Cells to Table Row
  newArticleTableRow.appendChild(newArticleTableCellQty)
  newArticleTableRow.appendChild(newArticleTableCellName)
  newArticleTableRow.appendChild(newArticleTableCellPrice)
  newArticleTableRow.appendChild(newArticleTableCellSubtotal)
  newArticleTableRow.appendChild(newArticleDeleteButtonCell)
  if (/** @type {UsualProduct} */(newArticleObject)?.bought === true) {
    newArticleTableRow.classList.add('bought')
  }
  // 2. Append the new Table Row to the shoppingListTableBodyElement
  shoppingListTableBodyElement?.appendChild(newArticleTableRow)
}

/**
 * Update item to bought
 * @param {MouseEvent} e
 * @param {string} itemId
 * @param {HTMLElement} rowToUpdate
 */
function buyArticle(e, itemId, rowToUpdate) {
  // Find item inside shoppingList
  const itemToUpdate = store.article.getById(itemId)
  // Update html
  if (itemToUpdate.bought !== true) {
    rowToUpdate.classList.add('bought')
  } else {
    rowToUpdate.classList.remove('bought')
  }
  // Modify Article data
  itemToUpdate.bought = !itemToUpdate.bought
  store.article.update(itemToUpdate, () => {updateLocalStorage(store.getState())})
}

/**
 * Update existing shopping list item
 */
function updateShoppingListItem() {
  getShoppingListTotalAmount()
}

/**
 * Delete existing shopping list item
 * @param {MouseEvent} e
 * @param {string} itemIdToDelete
 * @param {HTMLElement} rowToDelete
 */
function deleteShoppingListItem(e, itemIdToDelete, rowToDelete) {
  // Delete item from store
  store.article.delete(store.article.getById(itemIdToDelete), () => {updateLocalStorage(store.getState())})
  // Update html
  rowToDelete.remove()
  getShoppingListTotalAmount()
}

/**
 * Empty table element
 */
function emptyTableElement() {
  const shoppingListTableBodyRowsList = document.querySelectorAll('tbody>tr')
  // 1. For each table row found
  for (let tableRow of shoppingListTableBodyRowsList) {
    // 2. Remove it from the table element
    tableRow.remove()
  }
}

/**
 * Calculate shopping list total amount
 */
function getShoppingListTotalAmount() {
  const shoppingListTableTotalElement = document.getElementById('shoppingListTableTotal')
  let totalAmount = 0

  for (let article of store.article.getAll()) {
    // 1. Calculate subtotals for each article
    const subtotal = article.qty * article.price
    // 2. Add all subtotals
    totalAmount += subtotal
  }
  // 3. Show it on table total amount cell
  if (shoppingListTableTotalElement) {
    shoppingListTableTotalElement.innerText = String(totalAmount)
  }
}

/**
 * Sets the focus on the first form field
 */
function resetFocus(){
  const articleNameElement = document.getElementById('articleName')
  articleNameElement?.focus()
}

/**
 * Get usual products and put them on datalist
 */
async function getUsualProducts() {
  const dataListElement = document.getElementById('productos')
  const apiData = await getAPIData()

  apiData.forEach((/** @type {UsualProduct} */product) => {
    const newOptionElement = document.createElement('option')
    newOptionElement.value = product.name
    dataListElement?.appendChild(newOptionElement)
  })
}

/**
 * Get data from API
 * @returns {Promise<Array<UsualProduct>>}
 */
async function getAPIData(apiURL = 'api/get.articles.json') {
  // API endpoint
  // const API_USUAL_PRODUCTS_URL = 'api/get.articles.json'
  let apiData

  try {
    // apiData = await simpleFetch(API_USUAL_PRODUCTS_URL, {
    apiData = await simpleFetch(apiURL, {
      // Si la petición tarda demasiado, la abortamos
      signal: AbortSignal.timeout(3000),
    });
  } catch (/** @type {any | HttpError} */err) {
    if (err.name === 'AbortError') {
      console.error('Fetch abortado');
    }
    if (err instanceof HttpError) {
      if (err.response.status === 404) {
        console.error('Not found');
      }
      if (err.response.status === 500) {
        console.error('Internal server error');
      }
    }
  }

  console.log('apiData: ' + apiURL, apiData)

  return apiData
}

/**
 * Get saved sopphing list data
 */
function readShoppingList() {
  /** @type {State} */
  const storedData = getDataFromLocalStorage()
  storedData?.articles.forEach((/** @type {Article | UsualProduct} */ savedArticle) => {
    store.article.create(savedArticle)
    addNewRowToShoppingListTable(savedArticle)
  });
}

/**
 * Saves shopping list on localStorage
 * @param {Array<Article | UsualProduct>} storeValue
 */
function updateLocalStorage(storeValue) {
  localStorage.setItem('shoppingList', JSON.stringify(storeValue))
}

/**
 * Retrieves the shopping list data from local storage.
 *
 * @returns {Array<Article | UsualProduct>} An array of shopping list items.
 * If no data is found, returns an empty array.
 */

function getDataFromLocalStorage() {
  const defaultValue = JSON.stringify(INITIAL_STATE)
  return JSON.parse(localStorage.getItem('shoppingList') || defaultValue)
}

/**
 * Handles navigation changes
 * @param {Location} location - The new location
 */
function handleNavigation(location) {
  const newLocation = location.pathname.replace(/\/src/, '')
  console.log('route before navigation', store.route.get())
  store.route.set(newLocation)
  console.log('route after navigation', store.route.get())

  switch (newLocation) {
    case '/':
      document?.getElementById('login')?.classList.add('hidden')
      document?.getElementById('diary')?.classList.add('hidden')
      document?.getElementById('menus')?.classList.add('hidden')
      document?.getElementById('stats')?.classList.add('hidden')
      document?.getElementById('home')?.classList.remove('hidden')
      break
    case '/login':
      document?.getElementById('diary')?.classList.add('hidden')
      document?.getElementById('menus')?.classList.add('hidden')
      document?.getElementById('stats')?.classList.add('hidden')
      document?.getElementById('home')?.classList.add('hidden')
      document?.getElementById('login')?.classList.remove('hidden')
      break
    case '/diary':
      document?.getElementById('login')?.classList.add('hidden')
      document?.getElementById('menus')?.classList.add('hidden')
      document?.getElementById('stats')?.classList.add('hidden')
      document?.getElementById('home')?.classList.add('hidden')
      document?.getElementById('diary')?.classList.remove('hidden')
      break
    case '/menus':
      document?.getElementById('login')?.classList.add('hidden')
      document?.getElementById('diary')?.classList.add('hidden')
      document?.getElementById('stats')?.classList.add('hidden')
      document?.getElementById('home')?.classList.add('hidden')
      document?.getElementById('menus')?.classList.remove('hidden')
      break
    case '/stats':
      document?.getElementById('login')?.classList.add('hidden')
      document?.getElementById('diary')?.classList.add('hidden')
      document?.getElementById('menus')?.classList.add('hidden')
      document?.getElementById('home')?.classList.add('hidden')
      document?.getElementById('stats')?.classList.remove('hidden')
      break
    default:
      console.log('404', newLocation)
      break
  }
}

/**
 * Exports for testing
 */
export {
  addNewRowToShoppingListTable,
  updateShoppingListItem,
  deleteShoppingListItem,
  getShoppingListTotalAmount,
  getDataFromLocalStorage,
  readShoppingList
}