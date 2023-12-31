import 'core-js/stable';
import 'core-js/actual';
import 'regenerator-runtime/runtime';

import View from './view.js';
import icons from 'url:../../img/icons.svg';

class PaginationView extends View {
  _parentElement = document.querySelector('.pagination');

  addHandlerClick(handler) {
    this._parentElement.addEventListener('click', function (e) {
      e.preventDefault();

      const btn = e.target.closest('.btn--inline');

      if (!btn) {
        return;
      }

      const goToPage = +btn.dataset.goto;
      handler(goToPage);
    });
  }

  _generatePrevButtonMarkup() {
    const { currentPage } = this._data;

    return `
      <button data-goto="${currentPage - 1}" class="btn--inline pagination__btn--prev">
        <svg class="search__icon">
          <use href="${icons}#icon-arrow-left"></use>
        </svg>
        <span>Page ${currentPage - 1}</span>
      </button>
    `;
  }

  _generateNextButtonMarkup() {
    const { currentPage } = this._data;

    return `
      <button data-goto="${currentPage + 1}" class="btn--inline pagination__btn--next">
        <span>Page ${currentPage + 1}</span>
        <svg class="search__icon">
          <use href="${icons}#icon-arrow-right"></use>
        </svg>
      </button>
    `;
  }

  _generateMarkup() {
    const { currentPage } = this._data;
    const numPages = Math.ceil(this._data.results.length / this._data.resultsPerPage);

    // Page 1 and there are other pages
    if (currentPage === 1 && numPages > 1) {
      return this._generateNextButtonMarkup();
    }

    // Last page (if there are more pages)
    if (currentPage === numPages && numPages > 1) {
      return this._generatePrevButtonMarkup();
    }

    // Other page
    if (currentPage < numPages) {
      return `${this._generatePrevButtonMarkup()}\n${this._generateNextButtonMarkup()}`;
    }

    // Page 1 and there are no other pages
    return '';
  }
}

export default new PaginationView();
