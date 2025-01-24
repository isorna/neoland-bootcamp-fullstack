// @ts-check
import { Article, UsualProduct } from "../classes/ShopArticle";

/**
 * @typedef {Object} ActionTypeArticle
 * @property {string} type
 * @property {Article | UsualProduct } [article]
 */
/**
 * @typedef {Object} Product
 * @property {string} name
 */
/**
 * @typedef {Object} ActionTypeProduct
 * @property {string} type
 * @property {Product} [product]
 */
const ACTION_TYPES = {
  CREATE_ARTICLE: 'CREATE_ARTICLE',
  READ_LIST: 'READ_LIST',
  UPDATE_ARTICLE: 'UPDATE_ARTICLE',
  DELETE_ARTICLE: 'DELETE_ARTICLE'
}

/**
 * @typedef {Object.<(string), any>} State
 * @property {Array<Article | UsualProduct>} articles
 * @property {boolean} isLoading
 * @property {boolean} error
 */
/**
 * @type {State}
 */
const INITIAL_STATE = {
  articles: [],
  isLoading: false,
  error: false
}

/**
 * Reducer for the app state.
 *
 * @param {State} state - The current state
 * @param {ActionTypeArticle | ActionTypeProduct} action - The action to reduce
 * @returns {State} The new state
 */
const appReducer = (state = INITIAL_STATE, action) => {
  const actionWithArticle = /** @type {ActionTypeArticle} */(action)
  switch (action.type) {
    case ACTION_TYPES.CREATE_ARTICLE:
      return {
        ...state,
        articles: [
          ...state.articles,
          actionWithArticle.article
        ]
      };
    case ACTION_TYPES.READ_LIST:
      return state
    case ACTION_TYPES.UPDATE_ARTICLE:
      return {
        ...state,
        articles: state.articles.map((/** @type {Article | UsualProduct} */article) => {
          if (article.id === actionWithArticle?.article?.id) {
            return actionWithArticle.article
          }
          return article
        })
      };
    case ACTION_TYPES.DELETE_ARTICLE:
      return {
        ...state,
        articles: state.articles.filter((/** @type {Article | UsualProduct} */article) => article.id !== actionWithArticle?.article?.id)
      };
    default:
      return state;
  }
}

/**
 * Creates the store singleton.
 * @param {appReducer} reducer
 * @returns {Object}
 */
const createStore = (reducer) => {
  let currentState = INITIAL_STATE
  let currentReducer = reducer

  // Actions
  /**
   * Creates a new Article inside the store
   * @param {Article} article
   * @returns void
   */
  const createArticle = (article) => _dispatch({ type: ACTION_TYPES.CREATE_ARTICLE, article });
  /**
   * Reads the list of articles
   * @returns void
   */
  const readList = () => _dispatch({ type: ACTION_TYPES.READ_LIST });
  /**
   * Updates an article
   * @param {Article} article
   * @returns void
   */
  const updateArticle = (article) => _dispatch({ type: ACTION_TYPES.UPDATE_ARTICLE, article });
  /**
   * Deletes an article
   * @param {Article} article
   * @returns void
   */
  const deleteArticle = (article) => _dispatch({ type: ACTION_TYPES.DELETE_ARTICLE, article });

  // Public methods
  const getState = () => { return currentState };
  /**
   * Returns the article with the specified id
   * @param {string} id
   * @returns {Article | UsualProduct | undefined}
   */
  const getArticleById = (id) => { return currentState.articles.find((/** @type {Article | UsualProduct} */article) => article.id === id) };

  // Private methods
  /**
   *
   * @param {ActionTypeArticle | ActionTypeProduct} action
   * @param {function | undefined} [onEventDispatched]
   */
  const _dispatch = (action, onEventDispatched) => {
    let previousValue = currentState;
    let currentValue = currentReducer(currentState, action);
    currentState = currentValue;
    // TODO: CHECK IF IS MORE ADDECUATE TO SWITCH TO EventTarget: https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
    window.dispatchEvent(new CustomEvent('stateChanged', {
        detail: {
            changes: _getDifferences(previousValue, currentValue)
        },
        cancelable: true,
        composed: true,
        bubbles: true
    }));
    if (onEventDispatched) {
        onEventDispatched();
    }
  }
  /**
   * Returns a new object with the differences between the `previousValue` and
   * `currentValue` objects. It's used to create a payload for the "stateChanged"
   * event, which is dispatched by the store every time it changes.
   *
   * @param {State} previousValue - The old state of the store.
   * @param {State} currentValue - The new state of the store.
   * @returns {Object} - A new object with the differences between the two
   *     arguments.
   * @private
   */
  const _getDifferences = (previousValue, currentValue) => {
    return Object.keys(currentValue).reduce((diff, key) => {
        if (previousValue[key] === currentValue[key]) return diff
        return {
            ...diff,
            [key]: currentValue[key]
        };
    }, {});
  }

  // Namespaced actions
  const article = {
    create: createArticle,
    read: readList,
    update: updateArticle,
    delete: deleteArticle
  }

  return {
    // Actions
    article,
    // Public methods
    getState,
    getArticleById
  }
}

// Export store
export const store = createStore(appReducer)