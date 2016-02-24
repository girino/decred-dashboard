"use strict";

var express = require('express');
var request = require('request');
var moment  = require('moment');
var bodyParser = require('body-parser');
var exec    = require('child_process').exec;
var CronJob = require('cron').CronJob;

var env = process.env.NODE_ENV || 'development';
var app = express();
app.set('views', './public/views');
app.set('view engine', 'jade');

// in production we are using Nginx to deliver static files
if (env == 'development') {
  app.use(express.static('public'));
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var sequelize = require('./models').sequelize;
var Blocks = require('./models').Blocks;
var PosAvg = require('./models').PosAvg;
var Stats = require('./models').Stats;

const BITTREX = 'https://bittrex.com/api/v1.1/public/getmarketsummary?market=btc-dcr';
const BTCE = 'https://btc-e.com/api/3/ticker/btc_usd';
const GET_TX = 'https://mainnet.decred.org/api/tx/';

const FIRST_BLOCK_TIME = 1454954535;
const PREMINE = 1680000;
/* (4095 - 1) blocks * 21.83707864 DCR ~ 89401 */
const MINED_DCR_BEFORE_POS = 89401;
const DCR_TOTAL = PREMINE + MINED_DCR_BEFORE_POS;

new CronJob('0 */5 * * * *', function() {
  /* Add new blocks */
  Blocks.findOne({order: 'height DESC', limit: 1}).then(function(block) {
    var newHeight = block ? (block.height + 1) : 1;
    console.log("Searching new blocks with height >= " + newHeight);
    findNewBlock(newHeight);
  }).catch(function(err) {
    console.log(err);
  });

  /* Count total missed tickets */
  checkMissedTickets()

  /* Calculate average fees in the mempool */
  calculateAvgFees();

}, null, true, 'Europe/Rome');

new CronJob('0 */1 * * * *', function() {
  getPrices(function(err, result) {
    if (err) {
      console.error('Error, could not update price and common statistic.'); 
      return;
    } else {
      Stats.findOrCreate({where : {id : 1}, defaults : result }).spread(function(stats, created) {
        stats.update(result).catch(function(err) {
          console.error(err);
        });
      }).catch(function(err) {
        console.error(err);
      });
    }
  });
}, null, true, 'Europe/Rome');

app.get('/', function (req, res) {
  res.render('index', {env : env});
});

app.get('/api/v1/pos', function (req, res) {
  PosAvg.findAll({order: 'timestamp ASC'}).then(function(data) {
    var result = {};
    var poolsize = [];
    var sbits = [];
    for (let day of data) {
      poolsize.push([day.timestamp * 1000, day.poolsize]);
      sbits.push([day.timestamp * 1000, day.sbits]);
    }
    result = {
      sbits: sbits,
      poolsize: poolsize
    };

    res.status(200).json(result);
  }).catch(function(err) {
    console.log(err);
  });
});

app.get('/api/v1/get_day', function (req, res) {
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

app.get('/api/v1/get_stats', function (req, res) {
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

      res.status(200).json(stats);
    });
  }).catch(function(err) {
    console.error(err);
  });
});

function getPrices(next) {
  exec("dcrctl getmininginfo", function(error, stdout, stderr) {
    if (error || stderr) {
      console.error(error, stderr); return(error, null);
    }
    var data = JSON.parse(stdout);
    var result = {
      blocks : data.blocks,
      difficulty: data.difficulty,
      networkhashps: data.networkhashps,
      pooledtx: data.pooledtx
    };
    console.log('Step 1', result);
    request(BITTREX, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        
        data = JSON.parse(body);
        data = data.result[0];

        result.btc_high = data['High'];
        result.btc_low = data['Low'];
        result.btc_last = data['Last'];
        result.btc_volume = data['Volume'];
        result.prev_day = data['PrevDay'];
        
        console.log('Step 2', result);

        request(BTCE, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            data = JSON.parse(body);
            data = data.btc_usd;
            result.usd_price = data.last;
            
            console.log('Step 3', result);

            return next(null, result);
          } else {
            console.error(error); return(error, null);
          }
        });

      } else {
        console.error(error); return(error, null);
      }
    });

  });
}

function findNewBlock(height) {
  exec("bash ./parseblocks.sh " + height, function(error, stdout, stderr) {
    if (error || stderr) {
      console.error(error, stderr); return;
    }

    var data = JSON.parse(stdout);
    var insert = {
      hash : data.hash,
      height: data.height,
      datetime: data.time,
      voters: data.voters,
      poolsize: data.poolsize,
      sbits: data.sbits,
      difficulty: data.difficulty
    };

    Blocks.findOrCreate({where: {hash : insert.hash}, defaults: insert})
      .spread(function(row, created) {
        if (created) {
          console.log('New block was added, height: ' + height);
          updateDailyAveragePoS(row.datetime, row.poolsize, row.sbits, function(err, updated) {
            if (err) console.error(err);
            findNewBlock(height + 1);
          });
        } else {
          console.log('No new blocks found');
        }
      }).catch(function(err) {
        console.log(err);
      });
  });
}

function updateDailyAveragePoS (timestamp, new_poolsize, new_sbits, next) {
  timestamp = timestamp * 1000;
  var day = moment(timestamp).format('MM-DD-YYYY');
  console.log('Calculating average PoS stats for ' + day);

  var next_day = moment(timestamp).add(1, 'days').format('MM-DD-YYYY');

  var fromdate = new Date(day).getTime();
  fromdate = parseInt(fromdate / 1000, 10);
  var untildate = new Date(next_day).getTime();
  untildate = parseInt(untildate / 1000, 10);

  PosAvg.findOrCreate({where : {day : day}}).spread(function(average, created) { 
    Blocks.findAll({where : {datetime: {
      $lt: untildate,
      $gt: fromdate
    }}}).then(function(rows) {

    var count = rows.length;
    var poolsize = 0;
    var sbits = 0;
      
    for (let row of rows) {
      poolsize += row.poolsize;
      sbits += row.sbits;
    }

    poolsize = parseInt(poolsize / count, 10);
    sbits = sbits / count;

    var update = {
      poolsize : poolsize, 
      sbits : sbits, 
      timestamp : fromdate
    };

    if (!average.poolsize_min || average.poolsize_min > new_poolsize ) {
      update.poolsize_min = new_poolsize;
    }
    if (!average.poolsize_max || average.poolsize_max < new_poolsize ) {
      update.poolsize_max = new_poolsize;
    }
    if (!average.sbits_min || average.sbits_min > new_sbits ) {
      update.sbits_min = new_sbits;
    }
    if (!average.sbits_max || average.sbits_max < new_sbits ) {
      update.sbits_max = new_sbits;
    }
      
    average.update(update)
      .then(function(updated) {
         next(null, updated);
      }).catch(function(err) { 
        next(err, null); 
      });
  });
  });
}

function calculateAvgFees() {
  exec("dcrctl getrawmempool", function(error, stdout, stderr) {
    try {
      var data = JSON.parse(stdout);
    } catch(e) {
      console.error("Error getrawmempool", e);
      return;
    }

    getAllTransactions(0, data, 0, function(err, fees) {
      if (fees) {
        Stats.findOne({where : {id : 1}}).then(function(stats) {
          stats.update({fees : fees.avg, max_fees: fees.max}).catch(function(err) {
            console.error(err);
          });
        }).catch(function(err) {
          console.error(err);
        });
      }
    });
  });
}

/**
 * Returns object with avg and max fees in the mempool
 * @param {int} counter
 * @param {array} data
 * @param {float} result
 * @param {function} next
 * @param {float} max_fees (arguments[4])
 */
function getAllTransactions(counter, data, result, next) {
  var max_fees = 0;
  if (arguments[4]) {
    max_fees = arguments[4];
  }
  if (counter < data.length) {
    request(GET_TX + data[counter], function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log('Parse ' + (counter+1) + ' / ' + data.length + ' transaction: ' + data[counter]);
        try {
          var json = JSON.parse(body);
        } catch(e) {
          console.error("Bad response from mainnet.decred.org", e);
          return next(e, null);
        }
        
        // "fees" could be null
        if (json.fees) {
          result += json.fees;
          counter++;
          if (json.fees > max_fees) {
            max_fees = json.fees;
          }
        } else {
          data.shift();
        }

        getAllTransactions(counter, data, result, next, max_fees);

      } else {
        /* if transaction was not found, we want to remove it from array and continue */
        if (!error && response.statusCode == 404) {
          var hash = data[counter];
          data = data.filter(function(value) { return hash != value; });
          console.log('Handle 404 response from mainnet.decred.org; Transaction was removed from array');
          
          getAllTransactions(counter, data, result, next, max_fees);
        } else {
          console.error('mainnet.decred.org responded with error:', error);
          console.error('Status code is: ', response.statusCode);
          return next(error,null);
        }
      }
    });
  } else {
    var fees = {};
    fees.avg = data.length ? (result / data.length) : 0;
    fees.max = max_fees;
    console.log('Avg Fee:' + fees.avg);
    console.log('Max Fee:' + fees.max);

    return next(null,fees);
  }
}

function checkMissedTickets() {
  /* Select blocks count grouped by votes amount*/
  let query = {
    attributes: ['voters', [sequelize.fn('COUNT', sequelize.col('id')), 'blocks']],
    where: {
      voters: {$ne : 0}
    }, 
    group: ['voters']
  };

  Blocks.findAll(query).then(function(result) {

    Stats.findOne({where : {id : 1}}).then(function(stats) {
      let data = {};
      for (let row of result) {
        if (row.voters == 3) {
          data.three_voters = row.blocks;
        } else if (row.voters == 4) {
          data.four_voters = row.blocks;
        } else if (row.voters == 5) {
          data.five_voters = row.blocks;
        }
      }
      stats.update(data);
      return;
    }).catch(function(err) {
      console.log(err); return;
    });

  }).catch(function(err) {
    console.log(err); return;
  });

}

app.listen(8080, function () {
  console.log('Listening on port 8080!');
});
