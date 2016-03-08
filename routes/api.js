"use strict";

var fs = require('fs');
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
  var poolsize = [];
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
    /* TODO: refactoring! */
    if (req.query.time == '7') {

      var sbits_query = {order: 'datetime ASC'};
      if (day) {
        sbits_query.where = {datetime: {$gt : datetime}};
      }
      Blocks.findAll(sbits_query).then(function(data) {
        for (let day of data) {
          poolsize.push([day.datetime * 1000, day.poolsize]);
        }
        result = {
          sbits: sbits,
          poolsize: poolsize
        };

        res.status(200).json(result);
      }).catch(function(err) {
        console.log(err);
        res.status(500).json({error : true});
      });

    } else {

      var sbits_query = {order: 'timestamp ASC'};
      if (day) {
        sbits_query.where = {timestamp: {$gt : day}};
      }
      PosAvg.findAll(sbits_query).then(function(data) {
        for (let day of data) {
          poolsize.push([day.timestamp * 1000, day.poolsize_max]);
        }
        result = {
          sbits: sbits,
          poolsize: poolsize
        };

        res.status(200).json(result);
      }).catch(function(err) {
        console.log(err);
        res.status(500).json({error : true});
      });

    }
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
      result.push({
        workers: '-', 
        name : 'Solo miners', 
        y : soloMiners
      });
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

router.get('/get_day', function (req, res) {
  let now = parseInt(Date.now() / 1000, 10) - 24 * 60 * 60;
  Blocks.findAll({where: {datetime: {$gt: now}}, order: 'height ASC'})
  .then(function(data) {
    var sbits = 0, poolsize = 0, blocktime = 0, result = [], count = 0, timeinterval = 60 * 30;
    for (let row of data) {
      count++;
      blocktime = count == 1 ? row.datetime : blocktime; 
      if (row.datetime - blocktime <= timeinterval) {
        sbits += row.sbits;
        poolsize += row.poolsize;
      } else {
        count = (count == 1) ? 2 : count;
        result.push([blocktime * 1000,poolsize / (count - 1)]);
        sbits = poolsize = blocktime = count = 0;
      }
    }
    res.status(200).json(result);
  }).catch(function(err) {
    console.log(err);
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

module.exports = router;