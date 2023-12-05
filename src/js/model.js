import 'core-js/stable';
import 'regenerator-runtime/runtime';

import { API_URL, RESULTS_PER_PAGE, KEY } from './config.js';
import { AJAX } from './helpers.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    currentPage: 1,
    resultsPerPage: RESULTS_PER_PAGE,
  },
  bookmarks: [],
};

/**
 * Creates a recipe object based on the provided recipe data.
 *
 * @param {Object} recipeData - The recipe data to create the object from.
 * @return {Object} The created recipe object.
 */
const createRecipeObject = function (recipeData) {
  const { recipe } = recipeData.data;

  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

/**
 * Loads a recipe from the API.
 *
 * @param {string} id - The ID of the recipe to load.
 * @return {Promise<void>} - A Promise that resolves once the recipe is loaded.
 */
export const loadRecipe = async function (id) {
  try {
    const recipeURL = `${API_URL}${id}?key=${KEY}`;
    const recipeData = await AJAX(recipeURL);

    state.recipe = createRecipeObject(recipeData);

    if (state.bookmarks.some(bookmark => bookmark.id === id)) {
      state.recipe.bookmarked = true;
    } else {
      state.recipe.bookmarked = false;
    }
  } catch (err) {
    throw err;
  }
};

/**
 * Loads search results based on the given query.
 *
 * @param {string} query - The search query.
 * @return {Promise<void>} - A promise that resolves when the search results are loaded.
 */
export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;

    const searchData = await AJAX(`${API_URL}?search=${query}&key=${KEY}`);

    state.search.results = searchData.data.recipes.map(recipe => {
      return {
        id: recipe.id,
        title: recipe.title,
        publisher: recipe.publisher,
        image: recipe.image_url,
        ...(recipe.key && { key: recipe.key }),
      };
    });

    state.search.currentPage = 1;
  } catch (err) {
    throw err;
  }
};

/**
 * Retrieves a specific page of search results.
 *
 * @param {number} page - The page number to retrieve. Defaults to the current page.
 * @return {Array} An array containing the search results for the specified page.
 */
export const getPageSearchResults = function (page = state.search.currentPage) {
  state.search.currentPage = page;

  const start = (page - 1) * state.search.resultsPerPage;
  const end = page * state.search.resultsPerPage;

  return state.search.results.slice(start, end);
};

/**
 * Updates the servings of a recipe and adjusts the quantities of ingredients accordingly.
 *
 * @param {number} newServings - The new number of servings for the recipe.
 */
export const updateServings = function (newServings) {
  state.recipe.ingredients.forEach(ingredient => {
    ingredient.quantity = (ingredient.quantity * newServings) / state.recipe.servings;
  });

  state.recipe.servings = newServings;
};

/**
 * Persists the bookmarks to the local storage.
 */
const persistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

/**
 * Adds the current recipe to the bookmarks array and marks the recipe as bookmarked.
 */
export const addBookmark = function () {
  state.bookmarks.push(state.recipe);
  state.recipe.bookmarked = true;

  persistBookmarks();
};

/**
 * Deletes a bookmark from the state.bookmarks array and updates the state.recipe.bookmarked property if necessary.
 *
 * @param {number} id - The id of the bookmark to be deleted.
 */
export const deleteBookmark = function (id) {
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  if (id === state.recipe.id) {
    state.recipe.bookmarked = false;
  }

  persistBookmarks();
};

/**
 * Uploads a recipe to the server.
 *
 * @param {Object} newRecipe - The new recipe object to be uploaded.
 * @return {Promise} A promise that resolves with the uploaded recipe data.
 * @throws {Error} If the ingredient format is incorrect.
 */
export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].split(',').map(el => el.trim());

        if (ingArr.length !== 3) {
          throw new Error('Wrong ingredient format! Please use the correct format.');
        }

        const [quantity, unit, description] = ingArr;

        return { quantity: quantity ? +quantity : null, unit, description };
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    const recipeData = await AJAX(`${API_URL}?key=${KEY}`, recipe);

    state.recipe = createRecipeObject(recipeData);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};

/**
 * Initializes the application by retrieving bookmarks from local storage,
 * if they exist.
 */
const init = function () {
  const storage = localStorage.getItem('bookmarks');

  if (storage) {
    state.bookmarks = JSON.parse(storage);
  }
};

init();
