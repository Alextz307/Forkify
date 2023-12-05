import 'core-js/stable';
import 'core-js/actual';
import 'regenerator-runtime/runtime';

import * as model from './model.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultsView from './views/resultsView.js';
import paginationView from './views/paginationView.js';
import bookmarksView from './views/bookmarksView.js';
import addRecipeView from './views/addRecipeView.js';

import { MODAL_CLOSE_SEC } from './config.js';

/**
 * Control the recipe by performing a set of actions:
 * 1. Extract the ID from the URL.
 * 2. If there is no ID, return.
 * 3. Render a spinner on the recipe view.
 * 4. Update the search results on the results view.
 * 5. Update the bookmarks view with the current state of bookmarks.
 * 6. Load the recipe with the given ID.
 * 7. Render the recipe on the recipe view.
 * 8. If any error occurs, log the error and render an error message on the recipe view.
 *
 * @return {Promise<void>} The function does not return anything.
 */
const controlRecipe = async function () {
  try {
    const id = window.location.hash.slice(1);

    if (!id) {
      return;
    }

    recipeView.renderSpinner();

    resultsView.update(model.getPageSearchResults());

    bookmarksView.update(model.state.bookmarks);

    await model.loadRecipe(id);

    recipeView.render(model.state.recipe);
  } catch (err) {
    console.error(err);
    recipeView.renderError();
  }
};

/**
 * Controls the search results by executing the following steps:
 * 1. Get the query from the search view.
 * 2. If there is no query, return early.
 * 3. Render a spinner in the results view.
 * 4. Load the search results using the query.
 * 5. Render the page search results in the results view.
 * 6. Render the pagination view using the search state from the model.
 *
 * @return {Promise<void>} Returns a Promise that resolves when the search results are controlled.
 */
const controlSearchResults = async function () {
  try {
    const query = searchView.getQuery();

    if (!query) {
      return;
    }

    resultsView.renderSpinner();

    await model.loadSearchResults(query);

    resultsView.render(model.getPageSearchResults());

    paginationView.render(model.state.search);
  } catch (err) {
    console.error(err);
  }
};

/**
 * Control pagination based on the provided page number.
 *
 * @param {number} goToPage - The page number to navigate to.
 */
const controlPagination = function (goToPage) {
  resultsView.render(model.getPageSearchResults(goToPage));
  paginationView.render(model.state.search);
};

/**
 * Update the number of servings for the recipe and update the recipe view.
 *
 * @param {number} newServings - The new number of servings.
 * @return {undefined} This function does not return a value.
 */
const controlServings = function (newServings) {
  model.updateServings(newServings);

  recipeView.update(model.state.recipe);
};

/**
 * Toggles the bookmark status of the current recipe.
 */
const controlToggleBookmark = function () {
  if (!model.state.recipe.bookmarked) {
    model.addBookmark(model.state.recipe);
  } else {
    model.deleteBookmark(model.state.recipe.id);
  }

  recipeView.update(model.state.recipe);

  bookmarksView.render(model.state.bookmarks);
};

/**
 * Controls the bookmarks by rendering them in the bookmarks view.
 */
const controlBookmarks = function () {
  bookmarksView.render(model.state.bookmarks);
};

/**
 * Adds a new recipe to the model and updates the views.
 *
 * @param {Object} newRecipe - The new recipe to be added.
 * @return {Promise} A promise that resolves when the recipe is successfully added.
 */
const controlAddRecipe = async function (newRecipe) {
  try {
    addRecipeView.renderSpinner();

    await model.uploadRecipe(newRecipe);

    recipeView.render(model.state.recipe);

    addRecipeView.renderMessage();

    bookmarksView.render(model.state.bookmarks);

    window.history.pushState(null, '', `#${model.state.recipe.id}`);

    setTimeout(() => {
      addRecipeView.hideWindow();
    }, MODAL_CLOSE_SEC * 1000);
  } catch (err) {
    addRecipeView.renderError(err.message);
  }
};

/**
 * Initializes the application by setting up event handlers for various views.
 */
const init = function () {
  bookmarksView.addHandlerRender(controlBookmarks);
  recipeView.addHandlerRender(controlRecipe);
  recipeView.addHandlerServings(controlServings);
  recipeView.addHandlerToggleBookmark(controlToggleBookmark);
  searchView.addHandlerSearch(controlSearchResults);
  paginationView.addHandlerClick(controlPagination);
  addRecipeView.addHandlerUpload(controlAddRecipe);
};

init();
