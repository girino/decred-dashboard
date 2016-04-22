"use strict";

var fs = require('fs');
var jade = require('jade');
var express = require('express');
var validator = require("email-validator");
var nodemailer = require('nodemailer');

var router = express.Router();

var strings = require('../public/strings/seo.json');
var env = process.env.NODE_ENV || 'development';
var config = require('../config/config.json')[env];

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

router.get('/map', function(req, res) {
  let data = {
    env : env,
    page: 'map',
    title: strings.map_title,
    desc: strings.map_desc
  };
  res.render('map', data);
});

router.get('/articles', function(req, res) {
  let data = {
    env : env,
    page: 'articles',
    title: strings.articles_title,
    desc: strings.articles_desc
  };
  res.render('articles', data);
});

router.get('/articles/write-decred-tutorial', function(req, res) {
  let data = {
    env : env,
    page: 'write',
    title: strings.articles_write_title,
    desc: strings.articles_write_desc
  };
  res.render('write', data);
});

router.post('/articles/write-decred-tutorial', function(req, res) {
  var name = req.body.name;
  var email = req.body.email;
  var link = req.body.link;
  var tutorial = req.body.tutorial;

  if (name && validator.validate(email) && tutorial) {
    console.log('New tutorial successfuly submited.');
    var transporter = nodemailer.createTransport('smtps://dcrstats%40gmail.com:'+config.email_pass+'@smtp.gmail.com');
    var mailOptions = {
        from: '"Decred Tutorials" <dcrstats@gmail.com>',
        to: 'info@dcrstats.com',
        subject: 'New Tutorial submited by ' + name,
        text: tutorial + '\n\nEmail: ' + email + '\n\nLink:' + link
    };
    transporter.sendMail(mailOptions, function(error, info){
        if(error) {
          console.log('Email: ' + email);
          console.log(tutorial);
          console.error(error);
          res.status(200).json({error : true, message: strings.mailer_error});
          return;
        }
        res.status(200).json({success : true, message: strings.article_submited});
    });
  } else {
    console.log('New tutorial submission failed.');
    res.status(200).json({error : true, message: strings.article_validation_error});
  }
});

router.get('/articles/:uri', function(req, res) {
  var uri = req.params.uri;
  fs.readFile('./public/articles/' + uri + '.jade', 'utf8', function(err, data) {
    if (err) {
      console.error('Page not found: ', uri);
      res.render('404');
    } else {
      var html = jade.compile(data)();
      res.render('article', {
        env : env,
        content : html, 
        uri : uri,
        title : getTutorialTitle(uri),
        desc: strings.articles_desc
      });
    }
  });
});

function getTutorialTitle(string) {
    var title = string.charAt(0).toUpperCase() + string.slice(1);
    return title.replace(/-/g, ' ') + " | Dcrstats";
}

module.exports = router;