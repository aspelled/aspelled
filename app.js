const express = require('express');

const app = express();
const bodyParser = require('body-parser');

const db = require('diskdb');

app.set('port', (process.env.PORT || 5000));
app.use(express.static(`${__dirname}/public`));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

db.connect(`${__dirname}/private/`, ['articles', 'user', 'users']);

function getArticles(skip, top, filter) {
  if (skip < 0 || top < 0) {
    return undefined;
  }
  const articles = JSON.parse(JSON.stringify(db.articles.find()), (key, value) =>
    (key === 'createdAt') ? new Date(value) : value);
  let filterConfig;
  if (filter) {
    filterConfig = JSON.parse(filter, (key, value) => {
      (key === 'createdAfter' || key === 'createdBefore') ? new Date(value) : value
    });
  }
  skip = skip || 0;
  top = top || articles.length;
  const articlesNew = articles.filter(function(elem) {
    let key = true;
    if (filterConfig) {
      const date = elem.createdAt;
      if (Boolean(filterConfig.author) && filterConfig.author !== elem.author) {
        key = false;
      }
      if (filterConfig.createdAfter) {
        if (filterConfig.createdAfter.getFullYear() > date.getFullYear()) {
          key = false;
        }
        else if (filterConfig.createdAfter.getFullYear() === date.getFullYear()) {
          if (filterConfig.createdAfter.getMonth() > date.getMonth()) {
            key = false;
          }
          else if (filterConfig.createdAfter.getMonth() === date.getMonth()) {
            if (filterConfig.createdAfter.getDate() > date.getDate()) {
              key = false;
            }
          }
        }
      }
      if (filterConfig.createdBefore) {
        if (filterConfig.createdBefore.getFullYear() < date.getFullYear()) {
          key = false;
        }
        else if (filterConfig.createdBefore.getFullYear() === date.getFullYear()) {
          if (filterConfig.createdBefore.getMonth() < date.getMonth()) {
            key = false;
          }
          else if (filterConfig.createdBefore.getMonth() === date.getMonth()) {
            if (filterConfig.createdBefore.getDate() < date.getDate()) {
              key = false;
            }
          }
        }
      }

      if (filterConfig.tags) {
        const tmp = elem.tags.slice().sort();
        const tags = filterConfig.tags.slice().sort();
        for (let i = 0; i < tags.length; i++) {
          let key1 = false;
          for (let j = 0; j < tmp.length; j++) {
            if (tmp[j] === tags[i]) {
              key1 = true;
            }
          }
          if (!key1) {
            key = false;
          }
        }
      }
    }
    return key;
  });

  articlesNew.sort((a, b) => b.createdAt - a.createdAt);
  return articlesNew.slice(skip, skip + top);
}

function getAvailableId() {
  if (db.articles.count()) {
    return Number(db.articles.find().slice(0).sort((a, b) => b.id - a.id)[0].id) + 1;
  }
  return 1;
}

function addArticle(article) {
  if (validateArticle(article)) {
    article.id = `${getAvailableId()}`;
    db.articles.save(article);
  }
}

function validateArticle(article) {
  if (article.title.length === 0 || article.title.length > 99 ||
    article.summary.length === 0 || article.summary.length > 199 ||
    article.author.length === 0 || article.content.length === 0) {
    return false;
  }
  const tags = article.tags;
  for (let i = 0; i < tags.length; i++) {
    if (tags[i].length === 0 || ~tags[i].indexOf(' ')) {
      return false;
    }
  }
  return true;
}

function getArticlesAmount() {
  return db.articles.find().length;
}

function editArticle(article) {
  const tmp = db.articles.findOne({ id: article.id });

  if (tmp) {
    tmp.createdAt = new Date(tmp.createdAt);
    delete tmp._id;
    for (const val in article) {
      if (val === 'title') {
        if (article[val].length !== 0 && article[val].length < 100) {
          tmp.title = article[val];
        }
        else return false;
      }
      else if (val === 'summary') {
        if (article[val].length !== 0 && article[val].length < 200) {
          tmp.summary = article[val];
        }
        else return false;
      }
      else if (val === 'content') {
        if (article[val].length !== 0) {
          tmp.content = article[val];
        }
        else return false;
      }
      else if (val === 'tags') {
        tmp.tags = article[val].slice();
      }
      else if (val === 'img'){
        tmp.img = article[val];
      }
    }
    db.articles.update({ id: article.id }, tmp);
    return true;
  }
  return false;
}

function validateUser(user) {
  const userDb = db.users.findOne({ login: user.login, password: user.password });
  if (userDb) {
    db.connect(`${__dirname}/private/`, ['user']);
    db.user.save(userDb);
    return true;
  }
  db.user.remove();
}

app.get('/articles', (req, res) => {
  res.json(getArticles(req.query.skip, req.query.top, req.query.filter))
});

app.get('/article/:id', (req, res) => res.send(db.articles.findOne({ id: req.params.id })));

app.get('/articles/amount', (req, res) => res.send(getArticlesAmount(req.query.filter).toString()));

app.get('/users', (req, res) => {
  res.json(db.users.find().map((user) => user.login));
});

app.get('/user', (req, res) => {
  if (db.user && db.user.findOne()) {
    res.json(db.user.findOne().login);
  }
  else {
    res.end();
  }
});

app.post('/users/login', (req, res) => {
  validateUser(req.body);
  res.end();
});

app.post('/article', (req, res) => {
  addArticle(req.body);
  res.end();
});

app.patch('/article', (req, res) => {
  editArticle(req.body);
  res.end();
});

app.delete('/article/:id', (req, res) => {
  db.articles.remove({ id: req.params.id });
  res.end();
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
