"use strict";

var bigInt = require('big-integer');
var exec = require('child_process').execSync;
var fs = require('fs');
var CronJob = require('cron').CronJob;
var memwatch = require('memwatch-next');

memwatch.on('leak', function(info) {
  console.log('Wow! Memory leak detected.');
  console.dir(info);
});
memwatch.on('stats', function(stats) {
  console.log('Memory stats:');
  console.dir(stats);
});

var Stats = require('../models').Stats;
var Blocks = require('../models').Blocks;

var node_cache = {};

/* flush node_cache each 1 day of month */
new CronJob('0 0 0 1 * *', function() {
  console.log('Flush node_cache', new Date());
  fs.writeFileSync('./bin/node_cache.json', JSON.stringify({}));
}, null, true, 'Europe/Rome');

new CronJob('0 */5 * * * *', function() {
  Blocks.findOne({order: 'height DESC', limit: 1}).then(function(block) {
    console.log(new Date());
    var hd = new memwatch.HeapDiff();
    var result = updateNextDifficulty(block.hash);
    fs.writeFileSync('./bin/node_cache.json', JSON.stringify(node_cache));
    node_cache = {};
    var diff = hd.end();
    console.log(diff);
    console.log(new Date());
    if (result[0]) {
      console.error(result[0]); return;
    } else {
      Stats.findOne({where : {id : 1}}).then(function(stats) {
        stats.update({est_sbits : result[1], prev_est_sbits : stats.est_sbits});
      });
      Blocks.findOne({where : {hash : block.hash}}).then(function(row) {
        row.update({estimated_ticket_price : result[1]});
      });
    }
  }).catch(function(err) {
    console.log(err);
  });

}, null, true, 'Europe/Rome');

function updateNextDifficulty(startHash) {

var b = {}
// @see https://github.com/decred/dcrd/blob/master/chaincfg/params.go
b.chainParams = {
  StakeDiffAlpha: 1,
  CoinbaseMaturity: 256,
  RetargetAdjustmentFactor: 4,
  TicketPoolSizeWeight: 4,
  MinimumStakeDiff: 2 * 1e8, // 2 Coin
  StakeDiffWindowSize: 144,
  StakeDiffWindows: 20,
  TicketsPerBlock: 5,
  TicketPoolSize: 8192
}

// Cache the processed block nodes
var cache = fs.readFileSync('./bin/node_cache.json', 'utf8')
if (cache) {
  node_cache = JSON.parse(cache)
}

b.getPrevNodeFromNode = function(oldNode) {
  if (node_cache[oldNode.previousblockhash]) {
    return [null, node_cache[oldNode.previousblockhash]]
  }

  var data = exec('dcrctl getblock ' + oldNode.previousblockhash)
  if ( ! data) {
    return ['Something went wrong.', null]
  }
  data = JSON.parse(data)
  console.log('*** ' + data.height)

  var node = {
    hash : data.hash,
    height: data.height,
    previousblockhash: data.previousblockhash,
    header: {
      SBits: data.sbits * 1e8,
      FreshStake: data.freshstake,
      PoolSize: data.poolsize
    }
  }

  node_cache[data.hash] = node

  return [null, node]
}

// Get the most current block node
var node = {}

var tmp_node = b.getPrevNodeFromNode({
  previousblockhash: startHash
})
node = tmp_node[1]

// calcNextRequiredStakeDifficulty calculates the exponentially weighted average
// and then uses it to determine the next stake difficulty.
// TODO: You can combine the first and second for loops below for a speed up
// if you'd like, I'm not sure how much it matters.
function calcNextRequiredStakeDifficulty(curNode) {
  var alpha = b.chainParams.StakeDiffAlpha
  var stakeDiffStartHeight = b.chainParams.CoinbaseMaturity + 1
  var maxRetarget = b.chainParams.RetargetAdjustmentFactor
  var TicketPoolWeight = b.chainParams.TicketPoolSizeWeight

  // Number of nodes to traverse while calculating difficulty.
  var nodesToTraverse = b.chainParams.StakeDiffWindowSize * b.chainParams.StakeDiffWindows

  // Genesis block. Block at height 1 has these parameters.
  // Additionally, if we're before the time when people generally begin
  // purchasing tickets, just use the MinimumStakeDiff.
  // This is sort of sloppy and coded with the hopes that generally by
  // stakeDiffStartHeight people will be submitting lots of SStx over the
  // past nodesToTraverse many nodes. It should be okay with the default
  // Decred parameters, but might do weird things if you use custom
  // parameters.
  if (curNode == null || curNode.height < stakeDiffStartHeight) {
    return [null, b.chainParams.MinimumStakeDiff / 1e8]
  }

  // Get the old difficulty; if we aren't at a block height where it changes,
  // just return this.
  var oldDiff = curNode.header.SBits
  if ((curNode.height + 1) % b.chainParams.StakeDiffWindowSize != 0) {
    // Skip this, because we want to get an estimated ticket price based
    // on the most current block node
    // return [null, oldDiff / 1e8]
  }

  // The target size of the ticketPool in live tickets. Recast these as int64
  // to avoid possible overflows for large sizes of either variable in
  // params.
  var targetForTicketPool = b.chainParams.TicketsPerBlock * b.chainParams.TicketPoolSize

  // Initialize bigInt slice for the percentage changes for each window period
  // above or below the target.
  var windowChanges = []

  // Regress through all of the previous blocks and store the percent changes
  // per window period; use bigInts to emulate 64.32 bit fixed point.
  var oldNode = curNode
  var windowPeriod = 0
  var weights = 0

  for (var i = 0; ; i++) {
    // Store and reset after reaching the end of every window period.
    if ((i + 1) % b.chainParams.StakeDiffWindowSize == 0) {
      // First adjust based on ticketPoolSize. Skew the difference
      // in ticketPoolSize by max adjustment factor to help
      // weight ticket pool size versus tickets per block.
      var poolSizeSkew = (oldNode.header.PoolSize - targetForTicketPool) * TicketPoolWeight + targetForTicketPool

      // Don't let this be negative or zero.
      if (poolSizeSkew <= 0) {
        poolSizeSkew = 1
      }

      var curPoolSizeTemp = bigInt(poolSizeSkew)
      curPoolSizeTemp = curPoolSizeTemp.shiftLeft(32) // Add padding
      var targetTemp = bigInt(targetForTicketPool)

      var windowAdjusted = curPoolSizeTemp.divide(targetTemp)

      // Weight it exponentially. Be aware that this could at some point
      // overflow if alpha or the number of blocks used is really large.
      windowAdjusted = windowAdjusted.shiftLeft((b.chainParams.StakeDiffWindows - windowPeriod) * alpha)

      // Sum up all the different weights incrementally.
      weights += 1 << ((b.chainParams.StakeDiffWindows - windowPeriod) * alpha)

      // Store it in the slice.
      windowChanges[windowPeriod] = windowAdjusted

      // windowFreshStake = 0
      windowPeriod++
    }

    if ((i + 1) == nodesToTraverse) {
      break // Exit for loop when we hit the end.
    }

    // Get the previous block node.
    var tempNode = oldNode
    var ret = b.getPrevNodeFromNode(oldNode)
    var err = ret[0]
    oldNode = ret[1]
    if (err != null) {
      return [err, 0]
    }

    // If we're at the genesis block, reset the oldNode
    // so that it stays at the genesis block.
    if (oldNode == null) {
      oldNode = tempNode
    }
  }

  // Sum up the weighted window periods.
  var weightedSum = bigInt(0)
  for (i = 0; i < b.chainParams.StakeDiffWindows; i++) {
    weightedSum = weightedSum.add(windowChanges[i])
  }

  // Divide by the sum of all weights.
  var weightsBig = bigInt(weights)
  var weightedSumDiv = weightedSum.divide(weightsBig)

  // Multiply by the old stake diff.
  var oldDiffBig = bigInt(oldDiff)
  var nextDiffBig = weightedSumDiv.multiply(oldDiffBig)

  // Right shift to restore the original padding (restore non-fixed point).
  nextDiffBig = nextDiffBig.shiftRight(32)
  var nextDiffTicketPool = nextDiffBig

  // Check to see if we're over the limits for the maximum allowable retarget;
  // if we are, return the maximum or minimum except in the case that oldDiff
  // is zero.
  if (oldDiff == 0) { // This should never really happen, but in case it does...
    return [null, nextDiffTicketPool]
  } else if (nextDiffTicketPool.equals(0)) {
    nextDiffTicketPool = oldDiff / maxRetarget
  } else if (nextDiffTicketPool.divide(oldDiff).gt(maxRetarget - 1)) {
    nextDiffTicketPool = oldDiff * maxRetarget
  } else if (oldDiffBig.divide(nextDiffTicketPool).gt(maxRetarget - 1)) {
    nextDiffTicketPool = oldDiff / maxRetarget
  }

  // The target number of new SStx per block for any given window period.
  var targetForWindow = b.chainParams.StakeDiffWindowSize * b.chainParams.TicketsPerBlock

  // Regress through all of the previous blocks and store the percent changes
  // per window period; use bigInts to emulate 64.32 bit fixed point.
  oldNode = curNode
  var windowFreshStake = 0
  windowPeriod = 0
  weights = 0

  for (i = 0; ; i++) {
    // Add the fresh stake into the store for this window period.
    windowFreshStake += oldNode.header.FreshStake

    // Store and reset after reaching the end of every window period.
    if ((i + 1) % b.chainParams.StakeDiffWindowSize == 0) {
      // Don't let fresh stake be zero.
      if (windowFreshStake <= 0) {
        windowFreshStake = 1
      }

      var freshTemp = bigInt(windowFreshStake)
      freshTemp = freshTemp.shiftLeft(32) // Add padding
      var targetTemp = bigInt(targetForWindow)

      // Get the percentage change.
      var windowAdjusted = freshTemp.divide(targetTemp)

      // Weight it exponentially. Be aware that this could at some point
      // overflow if alpha or the number of blocks used is really large.
      windowAdjusted = windowAdjusted.shiftLeft((b.chainParams.StakeDiffWindows - windowPeriod) * alpha)

      // Sum up all the different weights incrementally.
      weights += 1 << ((b.chainParams.StakeDiffWindows - windowPeriod) * alpha)

      // Store it in the slice.
      windowChanges[windowPeriod] = windowAdjusted

      windowFreshStake = 0
      windowPeriod++
    }

    if ((i + 1) == nodesToTraverse) {
      break // Exit for loop when we hit the end.
    }

    // Get the previous block node.
    tempNode = oldNode
    var ret = b.getPrevNodeFromNode(oldNode)
    var err = ret[0]
    oldNode = ret[1]
    if (err != null) {
      return [err, 0]
    }

    // If we're at the genesis block, reset the oldNode
    // so that it stays at the genesis block.
    if (oldNode == null) {
      oldNode = tempNode
    }
  }

  // Sum up the weighted window periods.
  weightedSum = bigInt(0)
  for (i = 0; i < b.chainParams.StakeDiffWindows; i++) {
    weightedSum = weightedSum.add(windowChanges[i])
  }

  // Divide by the sum of all weights.
  weightsBig = bigInt(weights)
  weightedSumDiv = weightedSum.divide(weightsBig)

  // Multiply by the old stake diff.
  oldDiffBig = bigInt(oldDiff)
  nextDiffBig = weightedSumDiv.multiply(oldDiffBig)

  // Right shift to restore the original padding (restore non-fixed point).
  nextDiffBig = nextDiffBig.shiftRight(32)
  var nextDiffFreshStake = nextDiffBig

  // Check to see if we're over the limits for the maximum allowable retarget;
  // if we are, return the maximum or minimum except in the case that oldDiff
  // is zero.
  if (oldDiff == 0) { // This should never really happen, but in case it does...
    return [null, nextDiffFreshStake]
  } else if (nextDiffFreshStake.equals(0)) {
    nextDiffFreshStake = oldDiff / maxRetarget
  } else if (nextDiffFreshStake.divide(oldDiff).gt(maxRetarget - 1)) {
    nextDiffFreshStake = oldDiff * maxRetarget
  } else if (oldDiffBig.divide(nextDiffFreshStake).gt(maxRetarget - 1)) {
    nextDiffFreshStake = oldDiff / maxRetarget
  }

  // Average the two differences using scaled multiplication.
  var nextDiff = mergeDifficulty(oldDiff, nextDiffTicketPool, nextDiffFreshStake)

  // Check to see if we're over the limits for the maximum allowable retarget;
  // if we are, return the maximum or minimum except in the case that oldDiff
  // is zero.
  if (oldDiff == 0) { // This should never really happen, but in case it does...
    return [null, oldDiff]
  } else if (nextDiff.equals(0)) {
    nextDiff = oldDiff / maxRetarget
  } else if (nextDiff.divide(oldDiff).gt(maxRetarget - 1)) {
    nextDiff = oldDiff * maxRetarget
  } else if (oldDiffBig.divide(nextDiff).gt(maxRetarget - 1)) {
    nextDiff = oldDiff / maxRetarget
  }

  // If the next diff is below the network minimum, set the required stake
  // difficulty to the minimum.
  if (nextDiff.lt(b.chainParams.MinimumStakeDiff)) {
    return [null, b.chainParams.MinimumStakeDiff / 1e8]
  }

  return [null, nextDiff / 1e8]
}




// mergeDifficulty takes an original stake difficulty and two new, scaled
// stake difficulties, merges the new difficulties, and outputs a new
// merged stake difficulty.
function mergeDifficulty(oldDiff, newDiff1, newDiff2) {
  var newDiff1Big = bigInt(newDiff1)
  var newDiff2Big = bigInt(newDiff2)
  newDiff2Big = newDiff2Big.shiftLeft(32)

  var oldDiffBig = bigInt(oldDiff)
  var oldDiffBigLSH = oldDiffBig.shiftLeft(32)

  newDiff1Big = oldDiffBigLSH.divide(newDiff1Big)
  newDiff2Big = newDiff2Big.divide(oldDiffBig)

  // Combine the two changes in difficulty.
  var summedChange = newDiff2Big.shiftLeft(32)
  summedChange = summedChange.divide(newDiff1Big)
  summedChange = summedChange.multiply(oldDiffBig)
  summedChange = summedChange.shiftRight(32)

  return summedChange
}

var result = calcNextRequiredStakeDifficulty(node);
console.log(result);
return result;
}
