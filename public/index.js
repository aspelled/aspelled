const articleContent = (function() {
  const authors = [];

  function getArticles(skip, top, filterConfig, callback) {
    const oReq = new XMLHttpRequest();
    function handler() {
      callback(JSON.parse(oReq.responseText, (key, value) =>
        ((key === 'createdAt') ? new Date(value) : value)));
      cleanUp();
    }

    function cleanUp() {
      oReq.removeEventListener('load', handler);
    }

    oReq.addEventListener('load', handler);

    if (filterConfig) {
      const params = `skip=${skip}&top=${top}&filter=${JSON.stringify(filterConfig)}`;
      oReq.open('GET', `/articles?${params}`);
    }
    else {
      const params = `skip=${skip}&top=${top}`;
      oReq.open('GET', `/articles?${params}`);
    }

    oReq.send();
  }

  function getArticle(id, callback) {
    const oReq = new XMLHttpRequest();

    function handler () {
      callback(JSON.parse(oReq.responseText, (key, value) =>
        ((key === 'createdAt') ? new Date(value) : value)));
      cleanUp();
    }

    function cleanUp () {
      oReq.removeEventListener('load', handler);
    }

    oReq.addEventListener('load', handler);
    oReq.open('GET', `/article/${id}`);
    oReq.send();
  }

  function addArticle(article, callback) {
    const oReq = new XMLHttpRequest();

    function handler() {
      callback();
      cleanUp();
    }

    function cleanUp() {
      oReq.removeEventListener('load', handler);
    }

    oReq.addEventListener('load', handler);
    oReq.open('POST', '/article');
    oReq.setRequestHeader('content-type', 'application/json');
    const body = JSON.stringify(article);
    oReq.send(body);

    const author = article.author;
    let key = true;
    authors.forEach(function(item) {
      if (item === author) {
        key = false;
      }
    });

    if (key) {
      authors.push(author);
    }

    authors.sort();
  }

  function editArticle(article, callback) {
    const oReq = new XMLHttpRequest();

    function handler() {
      callback();
      cleanUp();
    }

    function cleanUp() {
      oReq.removeEventListener('load', handler);
    }

    oReq.addEventListener('load', handler);
    oReq.open('PATCH', '/article');
    oReq.setRequestHeader('content-type', 'application/json');
    const body = JSON.stringify(article);
    oReq.send(body);
  }

  function removeArticle(id, callback) {
    const oReq = new XMLHttpRequest();

    function handler() {
      callback();
      cleanUp();
    }

    function cleanUp() {
      oReq.removeEventListener('load', handler);
    }

    oReq.addEventListener('load', handler);
    oReq.open('DELETE', `/article/${id}`);
    oReq.setRequestHeader('content-type', 'application/json');
    oReq.send();
  }

  function authorsInit() {
    getArticlesAmount((top) => {
      articleContent.getArticles(0, top, undefined, (articles) => {
        articles.forEach(function(article) {
          const author = article.author;
          let key = true;
          authors.forEach((item) => {
            if (item === author) {
              key = false;
            }
          });
          if (key) {
            authors.push(author);
          }
        });
        authors.sort();
      });
    });
  }

  function getArticlesAmount(callback) {
    const oReq = new XMLHttpRequest();

    function handler() {
      callback(Number(oReq.responseText));
      cleanUp();
    }

    function cleanUp() {
      oReq.removeEventListener('load', handler);
    }

    oReq.addEventListener('load', handler);
    oReq.open('GET', '/articles/amount');
    oReq.send();
  }

  return {
    getArticlesAmount: getArticlesAmount,
    authors: authors,
    authorsInit: authorsInit,
    getArticle: getArticle,
    getArticles: getArticles,
    removeArticle: removeArticle,
    editArticle: editArticle,
    addArticle: addArticle
  }
}());

const popularTags = (function() {
  const tags = [];
  const allTags = [];

  function init(num, articles) {
    if (typeof num !== 'number') return false;
    if (tags) {
      tags.length = 0;
    }
    if (allTags) {
      allTags.length = 0;
    }
    const tmp = [];
    articles.forEach((article) => {
      article.tags.forEach((tag) => tmp.push(tag));
    });
    tmp.sort();
    let a = 0;
    if (tmp.length > 1) {
      allTags.push(tmp[a]);
      for (let i = 1; i < tmp.length; i++) {
        if (tmp[i] !== tmp[i - 1] || i === (tmp.length - 1)) {
          if ((i - a) >= num) {
            tags.push(tmp[a]);
            a = i;
          }
          allTags.push(tmp[i]);
          a = i;
        }
      }
    }
    else if (num === 1 && tmp.length === 1) {
      tags.push(tmp[a]);
    }
  }

  function removeTagsFromDOM() {
    document.querySelector('.tag-list').innerHTML = '';
    return true;
  }

  function insertTagsInDOM() {
    const popular = document.querySelector('.tag-list');
    popular.textContent = 'Popular: ';
    for (let i = 0; i < tags.length; i++) {
      const li = document.createElement('li');
      li.innerHTML = `<li>${tags[i]}</li>`;
      popular.appendChild(li);
    }
    return true;
  }

  return {
    allTags: allTags,
    init: init,
    removeTagsFromDOM: removeTagsFromDOM,
    insertTagsInDOM: insertTagsInDOM
  }
}());

const articleRenderer = (function() {
  let ARTICLE_TEMPLATE;
  let ARTICLE_LIST;

  function init() {
    ARTICLE_TEMPLATE = document.querySelector('#template-article');
    ARTICLE_LIST = document.querySelector('.article-list');
  }

  function insertArticlesInDOM(articles) {
    const articlesNodes = renderArticles(articles);
    articlesNodes.forEach(function (node) {
      ARTICLE_LIST.appendChild(node);
      ARTICLE_LIST.lastElementChild.addEventListener('click', readMoreHandler);
    });
  }

  function renderArticles(articles) {
    return articles.map(function (article) {
      return renderArticle(article);
    });
  }

  function renderArticle(article) {
    const template = ARTICLE_TEMPLATE;
    template.content.querySelector('.article').dataset.id = article.id;
    template.content.querySelector('#article-title').textContent = article.title;
    template.content.querySelector('#article-img').src = article.img;
    template.content.querySelector('.article-summary').textContent = article.summary;
    template.content.querySelector('#article-publname').textContent = article.author;
    template.content.querySelector('#article-date').textContent = formatDate(article.createdAt);
    const tags = template.content.querySelector('.article-tags');
    tags.innerHTML = 'Tags: ';

    if (article.tags) {
      for (let i = 0; i < article.tags.length; i++) {
        const li = document.createElement('li');
        li.innerHTML = `<li>${article.tags[i]}</li>`;
        tags.appendChild(li);
      }
    }

    return template.content.querySelector('.article').cloneNode(true);
  }

  function formatDate(d) {
    return `${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
  }

  function removeArticlesFromDom () {
    ARTICLE_LIST.innerHTML = '';
  }

  return {
    init: init,
    insertArticlesInDOM: insertArticlesInDOM,
    removeArticlesFromDom: removeArticlesFromDom
  };
}());

const userLog = ( function() {
  function init(login, password, callback) {
    const oReq = new XMLHttpRequest();

    function handler () {
      callback();
      renderUser();
      cleanUp();
    }

    function cleanUp () {
      oReq.removeEventListener('load', handler);
    }

    oReq.addEventListener('load', handler);
    oReq.open('POST', '/users/login');
    oReq.setRequestHeader('content-type', 'application/json');
    let user = {};
    if (login) {
      user.login = login;
      user.password = password;
    }
    else {
      user.login = ' ';
      user.password = ' ';
    }
    const body = JSON.stringify(user);
    oReq.send(body);
  }

  function renderUser() {
    username((user) => {
      const logInfo = document.querySelector('.log-info');
      const aAdd = document.querySelector('#aAdd');
      if (user) {
        aAdd.textContent = 'Add';
        logInfo.style.fontSize = '50%';
        logInfo.innerHTML = `Profile<br/><div id='username'>${user}</div>`;
      }
      else {
        aAdd.textContent = '';
        logInfo.style.fontSize = '100%';
        logInfo.innerHTML = 'Login';
      }
    });
  }

  function username(callback) {
    const oReq = new XMLHttpRequest();

    function handler () {
      if (oReq.responseText) {
        callback(JSON.parse(oReq.responseText));
      }
      else {
        callback();
      }
      cleanUp();
    }

    function cleanUp () {
      oReq.removeEventListener('load', handler);
    }

    oReq.addEventListener('load', handler);
    oReq.open('GET', '/user');
    oReq.setRequestHeader('content-type', 'application/json');
    oReq.send();
  }

  return {
    renderUser: renderUser,
    username: username,
    init: init
  };
}());

function readMoreHandler(event) {
  window.onscroll = 0;
  const target = event.target;
  if (target === this.querySelector('#readMore') ||
    target === this.querySelector('#article-img') ||
    target === this.querySelector('#article-title')) {
    const id = this.dataset.id;
    articleContent.getArticle(id, (article) => {
      articleRenderer.removeArticlesFromDom();
      popularTags.removeTagsFromDOM();
      document.querySelector('.main-title').firstElementChild.textContent = '';
      const template = document.querySelector('#template-article-full');
      template.content.querySelector('.article').dataset.id = article.id;
      template.content.querySelector('#article-title').textContent = article.title;
      template.content.querySelector('#article-full-img').src = article.img;
      template.content.querySelector('.article-content').textContent = article.content;
      template.content.querySelector('#article-publname').textContent = article.author;
      template.content.querySelector('#article-date').textContent = formatDate(article.createdAt);
      const tags = template.content.querySelector('.article-tags');

      function formatDate(d) {
        return `${d.getDate()}.${(d.getMonth() + 1)}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}`;
      }

      tags.innerHTML = 'Tags: ';
      for (let i = 0; i < article.tags.length; i++) {
        const tmp = document.createElement('li');
        tmp.innerHTML = `<li>${article.tags[i]}</li>`;
        tags.appendChild(tmp);
      }
      userLog.username((user) => {
        if (!user) {
          const footer = template.content.querySelector('.article-footer');
          footer.removeChild(template.content.querySelector('#article-delete'));
          footer.removeChild(template.content.querySelector('#article-change'));
        }
        const content = template.content.querySelector('.article').cloneNode(true);
        document.querySelector('.article-list').appendChild(content);
        if (user) {
          const deleteButton = document.querySelector('#article-delete');
          const changeButton = document.querySelector('#article-change');
          deleteButton.addEventListener('click', articleFullDeleteHandler);
          changeButton.addEventListener('click', articleFullChangeHandler);
        }
      });

      function articleFullDeleteHandler() {
        articleContent.removeArticle(document.querySelector('.article').dataset.id, () => {
          mainPage.loadMainPage();
        });
      }

      function articleFullChangeHandler() {
        const id = document.querySelector('.article').dataset.id;
        const article = articleContent.getArticle(id, (article) => {
          window.onscroll = 0;
          document.querySelector('.main-title').firstElementChild.textContent = 'Change news';
          popularTags.removeTagsFromDOM();
          articleRenderer.removeArticlesFromDom();
          const template = document.querySelector('#template-add-article');
          template.content.querySelector('.article').dataset.id = article.id;
          const tags = popularTags.allTags;
          const tagSelector = template.content.querySelector('.input-tags');
          tagSelector.innerHTML = '';
          const tmp1 = document.createElement('option');
          tmp1.innerHTML = '<option disabled>Возможные теги</option>';
          tagSelector.appendChild(tmp1);
          tags.forEach(function(item) {
            const tmp = document.createElement('option');
            tmp.innerHTML = `<option value='${item}'>${item}</option>`;
            tagSelector.appendChild(tmp);
          });
          const inputButton = template.content.querySelector('.input-button');
          inputButton.setAttribute('onclick', 'changeSubmitHandler()');
          const content = template.content.querySelector('.article').cloneNode(true);
          document.querySelector('.article-list').appendChild(content);
          document.forms.add.title.value = article.title;
          document.forms.add.summary.value = article.summary;
          document.forms.add.content.value = article.content;
          document.forms.add.img.value = article.img;
          document.forms.add.tags.value = article.tags.join(' ');
          document.querySelector('.input-tags').addEventListener('change', tagSelectorHandler);

          function tagSelectorHandler(event) {
            const target = event.currentTarget.value;
            const text = document.forms.add.tags;
            const tmp = text.value.split(' ');
            let key = false;
            tmp.forEach(function(item) {
              if (item === target) {
                key = true;
              }
            });
            if (key) {
              text.value = tmp.map(function(item) {
                if (item === target) {
                  return '';
                }
                return item;
              }).join(' ');
            }
            else if (target === 'Suggested tags');
            else {
              text.value += ` ${target}`;
            }
          }
        });
      }
    });
  }
}

function changeSubmitHandler() {
  const form = document.forms.add;
  if (form.title.value !== '' && form.summary.value !== '' && form.content.value !== '') {
    userLog.username((user) => {
      const article = {
        id: '0',
        title: form.title.value,
        img: '',
        summary: form.summary.value,
        content: form.content.value,
        createdAt: new Date(),
        author: user,
      }
      article.img = form.img.value;

      const tags = form.tags.value.split(' ');

      for (let i = 0; i < tags.length; i++) {
        if (tags[i].length === 0) {
          tags.splice(i, 1);
          i--;
        }
      }

      article.tags = tags;
      article.id = document.querySelector('.article').dataset.id;

      articleContent.editArticle(article, () => {
        mainPage.loadMainPage();
      });
    });
  }
}

document.addEventListener('DOMContentLoaded', startApp);
function startApp() {
  articleRenderer.init();
  userLog.renderUser();
  articleContent.authorsInit();
  mainPage.loadMainPage();

  addEvents();
}

function addEvents() {
  document.querySelector('#aMain').addEventListener('click', aMain);
  document.querySelector('#aAdd').addEventListener('click', aAdd);
  document.querySelector('#aSearch').addEventListener('click', aSearchClosed);
  logInfoAddEvents();

  function aMain(event) {
    mainPage.loadMainPage();
  }

  function aAdd(event) {
    window.onscroll = 0;
    document.querySelector('.main-title').firstElementChild.textContent = 'Add news';
    popularTags.removeTagsFromDOM();
    articleRenderer.removeArticlesFromDom();

    const template = document.querySelector('#template-add-article');
    const tags = popularTags.allTags;
    const tagSelector = template.content.querySelector('.input-tags');
    tagSelector.innerHTML = '';
    const tmp1 = document.createElement('option');
    tmp1.innerHTML = '<option disabled>Possible tags</option>';
    tagSelector.appendChild(tmp1);
    tags.forEach(function(item) {
      const tmp = document.createElement('option');
      tmp.innerHTML = `<option value='${item}'>${item}</option>`;
      tagSelector.appendChild(tmp);
    });
    const content = template.content.querySelector('.article').cloneNode(true);
    document.querySelector('.article-list').appendChild(content);
    document.querySelector('.input-tags').addEventListener('change', tagSelectorHandler);

    function tagSelectorHandler(event) {
      const target = event.currentTarget.value;
      const text = document.forms.add.tags;
      const tmp = text.value.split(' ');
      let key = false;

      tmp.forEach(function(item) {
        if (item === target) {
          key = true;
        }
      });
      if (key) {
        text.value = tmp.map(function(item) {
          if (item === target) {
            return '';
          }
          return item;
        }).join(' ');
      }
      else if (target === 'Possible tags');
      else {
        text.value += ` ${target}`;
      }
    }
  }

  function aSearchClosed(event) {
    this.removeEventListener('click', aSearchClosed);
    this.addEventListener('click', aSearchOpened);

    const template = document.querySelector('#template-search');

    const tags = popularTags.allTags;
    const tagSelector = template.content.querySelector('.search-tags');
    tagSelector.innerHTML = '';
    const tagsOptionDefault = document.createElement('option');
    tagsOptionDefault.innerHTML = '<option disabled>Suggested tags</option>';
    tagSelector.appendChild(tagsOptionDefault);
    tags.forEach(function(tag) {
      const tmp = document.createElement('option');
      tmp.innerHTML = `<option value='${tag}'>${tag}</option>`;
      tagSelector.appendChild(tmp);
    });

    const authors = articleContent.authors;
    const authorSelector = template.content.querySelector('.search-author');
    authorSelector.innerHTML = '';
    const authorsOptionDefault = document.createElement('option');
    authorsOptionDefault.innerHTML = '<option disabled>Suggested authors</option>';
    authorSelector.appendChild(authorsOptionDefault);
    authors.forEach(function(author) {
      const tmp = document.createElement('option');
      tmp.innerHTML = `<option value='${author}'>${author}</option>`;
      authorSelector.appendChild(tmp);
    });

    document.querySelector('.search').innerHTML = '';
    const content = template.content.querySelector('.search-form').cloneNode(true);
    document.querySelector('.search').appendChild(content);

    document.forms.search.createdAfter.addEventListener('change', createdAfterHandler);
    document.forms.search.createdBefore.addEventListener('change', createdBeforeHandler);
    document.forms.search.tags.value = '';

    document.querySelector('.search-tags').addEventListener('change', tagSelectorHandler);

    document.querySelector('.search-button-accept').addEventListener('click', filter);

    function tagSelectorHandler(event) {
      const target = event.currentTarget.value;
      const text = document.forms.search.tags;
      const tmp = text.value.split(' ');
      let key = false;

      tmp.forEach(function(item) {
        if (item === target) {
          key = true;
        }
      });
      if (key) {
        text.value = tmp.map(function(item) {
          if (item === target) {
            return '';
          }
          return item;
        }).join(' ');
      }
      else if (target === 'Suggested tags');
      else {
        text.value += ` ${target}`;
      }
    }

    function createdAfterHandler() {
      document.forms.search.createdBefore.setAttribute('min', this.value);
    }

    function createdBeforeHandler() {
      document.forms.search.createdAfter.setAttribute('max', this.value);
    }

    function filter(event) {
      const form = document.forms.search;
      const filterConfig = {};
      const date1 = new Date(form.createdAfter.value);
      if (date1 !== 'Invalid Date') {
        filterConfig.createdAfter = date1;
      }

      const date2 = new Date(form.createdBefore.value);
      if (date2 !== 'Invalid Date') {
        filterConfig.createdBefore = date2;
      }

      const author = form.author.value;
      if (author !== 'Suggested authors') {
        filterConfig.author = author;
      }

      const tags = form.tags.value.split(' ');

      for (let i = 0; i < tags.length; i++) {
        if (tags[i].length === 0) {
          tags.splice(i, 1);
          i--;
        }
      }

      filterConfig.tags = tags;

      mainPage.setFilter(filterConfig);

      mainPage.loadMainPage();
    }

  }

  function aSearchOpened(event) {
    this.removeEventListener('click', aSearchOpened);
    document.querySelector('.search').innerHTML = '';
    this.addEventListener('click', aSearchClosed);
  }



}

function inputSubmitHandler() {
  const form = document.forms.add;
  if (form.title.value !== '' && form.summary.value !== '' && form.content.value !== '') {
    userLog.username((user) => {
      const article = {
        id: '0',
        title: form.title.value,
        img: '',
        summary: form.summary.value,
        content: form.content.value,
        createdAt: new Date(),
        author: user,
      }
      article.img = form.img.value;

      const tags = form.tags.value.split(' ');

      for (let i = 0; i < tags.length; i++) {
        if (tags[i].length === 0) {
          tags.splice(i, 1);
          i--;
        }
      }

      article.tags = tags;

      articleContent.addArticle(article, () => {
        mainPage.loadMainPage();
      });
    });
  }
}

function searchReset() {
  document.querySelector('.search-input').innerHTML = '';
}

const mainPage = (function() {
  let filterConfig;
  let articleCount = 5;
  function renderArticles() {
    articleContent.getArticlesAmount((top) => {
      articleContent.getArticles(0, top, undefined, (articles) => {
        popularTags.init(2, articles);
        popularTags.insertTagsInDOM();
      });
    });
    articleContent.getArticles(0, articleCount, filterConfig, (articles) => {
      articleRenderer.removeArticlesFromDom();
      articleRenderer.insertArticlesInDOM(articles);
    });
  }

  function loadMainPage() {
    articleCount = 5;
    document.querySelector('.main-title').firstElementChild.textContent = 'News';
    renderArticles();
    window.onscroll = scrollMainPage;
  }

  function setFilter(filter) {
    filterConfig = filter;
  }

  function moreNews() {
    articleContent.getArticlesAmount((count) => {
      if (articleCount + 5 > count) {
        articleCount = count;
        window.onscroll = 0;
      }
      else {
        articleCount += 5;
      }
    });
  }

  return {
    moreNews: moreNews,
    setFilter: setFilter,
    renderArticles: renderArticles,
    loadMainPage: loadMainPage
  }

}());

function scrollMainPage() {
  const footer = document.querySelector('.footer-content');
  const bottom = footer.lastElementChild.getBoundingClientRect().top;
  if (window.pageYOffset > bottom) {
    mainPage.moreNews();
    mainPage.renderArticles();
  }
}

function logInfoAddEvents() {
  const logInfo = document.querySelector('.log-info');
  userLog.username((user) => {
    if (user) {
      logInfo.addEventListener('mouseover', mouseover);
      logInfo.addEventListener('click', logout);
    }
    else {
      logInfo.addEventListener('click', login);
    }
  });

  function mouseover() {
    userLog.username((user) => {
      logInfo.removeEventListener('mouseover', mouseover);
      logInfo.addEventListener('mouseout', mouseout);
      logInfo.innerHTML = `Logout<br/><div id='username'>${user}</div>`;
    });
  }

  function mouseout() {
    userLog.username((user) => {
      logInfo.removeEventListener('mouseout', mouseout);
      logInfo.addEventListener('mouseover', mouseover);
      logInfo.innerHTML = `Profile<br/><div id='username'>${user}</div>`;
    });
  }

  function logout() {
    logInfo.removeEventListener('mouseout', mouseout);
    userLog.init(undefined, undefined, () => {
      logInfo.removeEventListener('click', logout);
      logInfo.addEventListener('click', login);
    });
  }

  function login() {
    window.onscroll = 0;
    document.querySelector('.main-title').firstElementChild.textContent = 'Login';
    popularTags.removeTagsFromDOM();
    articleRenderer.removeArticlesFromDom();
    const template = document.querySelector('#template-login');
    const content = template.content.querySelector('.login-background').cloneNode(true);
    document.querySelector('.article-list').appendChild(content);
  }
}

function loginSubmitHandler() {
  userLog.init(document.forms.login.login.value, document.forms.login.password.value, () => {
    const logInfo = document.querySelector('.log-info');
    userLog.username((user) => {
      if (user) {
        logInfo.removeEventListener('click', login);
        logInfo.addEventListener('mouseover', mouseover);
        logInfo.addEventListener('click', logout);
      }
    });
    mainPage.loadMainPage();

    function mouseover() {
      userLog.username((user) => {
        logInfo.removeEventListener('mouseover', mouseover);
        logInfo.addEventListener('mouseout', mouseout);
        logInfo.innerHTML = `Logout<br/><div id='username'>${user}</div>`;
      });
    }

    function mouseout() {
      userLog.username((user) => {
        logInfo.removeEventListener('mouseout', mouseout);
        logInfo.addEventListener('mouseover', mouseover);
        logInfo.innerHTML = `Profile<br/><div id='username'>${user}</div>`;
      });
    }

    function logout() {
      logInfo.removeEventListener('mouseout', mouseout);
      userLog.init(undefined, undefined, () => {
        logInfo.removeEventListener('click', logout);
        logInfo.addEventListener('click', login);
      });
    }

    function login() {
      window.onscroll = 0;
      document.querySelector('.main-title').firstElementChild.textContent = 'Login';
      popularTags.removeTagsFromDOM();
      articleRenderer.removeArticlesFromDom();

      const template = document.querySelector('#template-login');
      const content = template.content.querySelector('.login-background').cloneNode(true);
      document.querySelector('.article-list').appendChild(content);
    }
  });
}
