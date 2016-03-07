"use strict";

var fs = require('fs');
var marked = require('marked');
var express = require('express');
var router = express.Router();

var strings = require('../public/strings/seo.json');
var env = process.env.NODE_ENV || 'development';

router.get('/', function (req, res) {
  let data = {
    env : env,
    page: 'index',
    title: strings.main_title,
    desc: strings.main_desc
  };
  res.render('index', data);
});

router.get('/pow', function(req, res) {
  let data = {
    env : env,
    page: 'pow',
    title: strings.pow_title,
    desc: strings.pow_desc
  };
  res.render('pow', data);
});

router.get('/articles', function(req, res) {
  let data = {
    env : env,
    page: 'articles',
    title: strings.articles_title,
    desc: strings.articles_desc
  };
  res.render('news', data);
});

router.get('/articles/:uri', function(req, res) {
  var uri = req.params.uri;
  fs.readFile('./public/articles/' + uri + '.md', 'utf8', function(err, data) {
    if (err) {
      console.error('Page not found: ', uri);
      res.render('404');
    } else {
      var content = marked(data);
      res.render('article', {content : content, uri : uri});
    }
  });
});

module.exports = router;