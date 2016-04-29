"use strict";

var fs = require('fs');
var path = require('path');
var express = require('express');
var router = express.Router();

var sequelize = require('../models').sequelize;
var Blocks = require('../models').Blocks;
var PosAvg = require('../models').PosAvg;
var Stats = require('../models').Stats;
var Hashrate = require('../models').Hashrate;
var Pools = require('../models').Pools;

const SUPPLY = 21000000;
const FIRST_BLOCK_TIME = 1454954535;
const SUBSIDY = 31.19582664;
const PREMINE = 1680000;
/* (4095 - 1) blocks * 21.83707864 DCR ~ 89401 */
const MINED_DCR_BEFORE_POS = 89401;
const DCR_TOTAL = PREMINE + MINED_DCR_BEFORE_POS;

router.get('/pos', function (req, res) {
  var result = {};
  var sbits = [];
  if (!req.query.time || req.query.time == '365') {
    var query = `SELECT DISTINCT(sbits), MIN(datetime) as datetime
             from blocks group by sbits order by datetime asc`;
  } else {
    var day = parseInt(req.query.time);
    if (isNaN(day)) {
      day = 365;
    }

    var datetime = Math.floor((new Date()) / 1000) - day * 24 * 60 * 60;
    var query = `SELECT DISTINCT(sbits), MIN(datetime) as datetime
             from blocks ` + `WHERE datetime >= ` + datetime + ` group by sbits order by datetime asc`;
  }

  sequelize.query(query, { model: Blocks }).then(function(prices) {
    for (let row of prices) {
      /* if date is 8 FEB, set it to 23 FEB
       * just to beautify a little chart, because PoS diff adjustment
       * started only after 4895 block */
      if (row.datetime == 1454954535) {
        row.datetime = 1456228800;
      }
      sbits.push([row.datetime * 1000, row.sbits]);
    }
    if (req.query.data == "sbits") {
      result.sbits = sbits;
      res.status(200).json(result);
      return;
    }
  }).catch(function(err) {
    console.log(err);
    res.status(500).json({error : true});
  });
});

router.get('/popular_ticket_prices', function(req, res) {
  var raw = req.query.raw || false;
  let query = {
    attributes: ['sbits',[sequelize.fn('SUM', sequelize.col('num_tickets')), 'num_tickets']],
    where: {
      height: {$gt : 4895}
    },
    group: ['sbits'],
    order: 'sbits ASC'
  };

  Blocks.findAll(query).then(function(result) {
    if (raw) {
      return res.status(200).json(result);
    }
    var processed = [];
    for (let item of result) {
      let sbits = Math.ceil(item.sbits);
      let key = sbits - 1;
      let num_tickets = parseInt(item.num_tickets, 10);
      processed[key] = processed[key] ? processed[key] + num_tickets : num_tickets;
    }
    var output = [];
    for (let row in processed) {
      output.push([row, processed[row] ]);
    }
    return res.status(200).json(output);
  }).catch(function(err) {
    console.log(err);
    res.status(500).json({error : true});
  });
});

router.get('/difficulty', function(req, res) {
  if (!req.query.time || req.query.time == '365') {
    var query = `SELECT DISTINCT(difficulty), MIN(datetime) as datetime
             from blocks group by difficulty order by datetime asc`;
  } else {
    var day = parseInt(req.query.time);
    if (isNaN(day)) {
      day = 365;
    }
    var datetime = Math.floor((new Date()) / 1000) - day * 24 * 60 * 60;
    var query = `SELECT DISTINCT(difficulty), MIN(datetime) as datetime
             from blocks ` + `WHERE datetime >= ` + datetime + ` group by difficulty order by datetime asc`;
  }

  sequelize.query(query, { model: Blocks }).then(function(data) {
    var result = [];
    for (let block of data) {
      result.push([block.datetime * 1000, block.difficulty]);
    }
    return res.status(200).json(result);
  }).catch(function(err) {
    console.log(err);
    res.status(500).json({error : true});
  });
});

router.get('/hashrate', function(req, res) {
  if (!req.query.time || req.query.time == '365') {
    var query = `SELECT DISTINCT(networkhashps), MIN(timestamp) as timestamp
                 from hashrate group by networkhashps order by timestamp asc`;
  } else {
    var day = parseInt(req.query.time);
    if (isNaN(day)) {
      day = 365;
    }
    var datetime = Math.floor((new Date()) / 1000) - day * 24 * 60 * 60;
    var query = `SELECT DISTINCT(networkhashps), MIN(timestamp) as timestamp
             from hashrate ` + `WHERE timestamp >= ` + datetime + ` group by networkhashps order by timestamp asc`;
  }

  sequelize.query(query, { model: Hashrate }).then(function(data) {
    var result = [];
    for (let block of data) {
      result.push([block.timestamp * 1000, block.networkhashps / 1000 / 1000 / 1000 / 1000]);
    }
    return res.status(200).json(result);
  }).catch(function(err) {
    console.log(err);
    res.status(500).json({error : true});
  });
});

router.get('/pools', function(req, res) {
  Stats.findOne({where : {id : 1}}).then(function(stats) {
    Pools.findAll({order: 'hashrate DESC'}).then(function(pools) {
      var networkTotal = Math.round((stats.networkhashps / 1000 / 1000 / 1000) * 100) / 100;
      var result = [];
      var total = 0;
      var hashrate = 0;
      for (let pool of pools) {
        total += pool.hashrate;
        hashrate = Math.round(pool.hashrate * 100) / 100;
        result.push({workers: pool.workers, name : pool.name, y : hashrate, network: networkTotal});
      }
      var soloMiners = Math.round((stats.networkhashps / 1000 / 1000 / 1000 - total) * 100) / 100;
      if (soloMiners > 0) {
        result.push({
          workers: '-',
          name : 'Solo miners',
          y : soloMiners
        });
      }
      return res.status(200).json(result);
    }).catch(function(err) {
      console.log(err);
      res.status(500).json({error : true}); return;
    });
  }).catch(function(err) {
    console.error(err);
    res.status(500).json({error : true}); return;
  });
});

router.get('/prices', function (req, res) {
  var ticker = req.query.ticker;

  if (ticker != 'btc' && ticker != 'usd') {
    res.status(500).json({error : true});
    return;
  }
  fs.readFile('./uploads/prices.json', 'utf8', function (err, data) {
    if (err) {
      console.log(err);
      res.status(500).json({error : true}); return;
    }
    try {
      var result = JSON.parse(data);
    } catch(e) {
      console.log(e);
      res.status(500).json({error : true});
      return;
    }
    if (ticker === 'usd') {
      res.status(200).json(result.usd_price);
    } else {
      res.status(200).json(result.btc_price);
    }
  });
});

router.get('/estimated_ticket_price', function (req, res) {
  res.status(404).json({error : true, message: "Feature disabled"});
  return;

  console.log('Estimated ticket price start: ', (new Date()).getTime());
  let query = {
    attributes: ['datetime', 'estimated_ticket_price'],
    order: 'height DESC',
    limit: 720
  };
  Blocks.findAll(query).then(function(blocks) {
    var result = [];
    for (let row of blocks) {
      result.push([row.datetime * 1000,row.estimated_ticket_price]);
    }
    console.log('Estimated ticket price end: ', (new Date()).getTime());
    res.status(200).json(result);
  }).catch(function(err) {
    console.log(err);
    res.status(500).json({error : true});
  });
});

router.get('/get_stats', function (req, res) {
  Stats.findOne({where : {id : 1}}).then(function(stats) {

    if (!stats) {
      res.status(500).json({error : true});
      return;
    }

    Blocks.findOne({order: 'height DESC'}).then(function(block) {
      stats = stats.dataValues;
      stats.average_time = Math.floor((block.datetime - FIRST_BLOCK_TIME) / block.height);
      stats.average_minutes = Math.floor(stats.average_time / 60);
      stats.average_seconds = Math.floor(stats.average_time % 60);
      stats.poolsize = block.poolsize;
      stats.sbits = block.sbits;
      stats.supply = SUPPLY;
      stats.premine = PREMINE;
      stats.mined_before_pos = MINED_DCR_BEFORE_POS;
      stats.reward = SUBSIDY;

      res.status(200).json(stats);
    });
  }).catch(function(err) {
    console.error(err);
  });
});

router.get('/peerinfo', function(req, res) {
  res.sendFile(path.normalize(__dirname + '/../uploads/peers.json'));
});

module.exports = router;
