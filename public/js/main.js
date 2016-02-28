$(function() {

  updateStats(true);
  setInterval(updateStats, 60000);

  function updateStats(isStartup) {

    var nonce = (new Date()).getTime();
    $.ajax({
      url : '/api/v1/get_stats?'+nonce,
      type: 'GET',
      success: function(response) {

        if (!response.error) {
          var usd_last = (response.btc_last * response.usd_price).toString().substr(0,4);
          var usd_prev = response.prev_day * response.usd_price;

          if (usd_prev <= response.btc_last * response.usd_price) {
            $('span.stats-lastprice')
              .html('$' + usd_last + '<i class="glyphicon glyphicon-arrow-up"></i>')
              .css('color', '#64A537');
          } else {
            $('span.stats-lastprice')
              .html('$' + usd_last + '<i class="glyphicon glyphicon-arrow-down"></i>')
              .css('color', 'rgb(220, 42, 42)');
          }

          var usd_low = (response.btc_low * response.usd_price).toString().substr(0,4);
          $('span.stats-daylow').text('$' + usd_low);

          var usd_high = (response.btc_high * response.usd_price).toString().substr(0,4);
          $('span.stats-dayhigh').text('$' + usd_high);

          if (response.prev_day <= response.btc_last) {
            $('span.stats-btc')
              .html(response.btc_last + '<i class="glyphicon glyphicon-arrow-up"></i>')
              .css('color', '#64A537');
          } else {
            $('span.stats-btc')
              .html(response.btc_last + '<i class="glyphicon glyphicon-arrow-down"></i>')
              .css('color', 'rgb(220, 42, 42)');
          }

          $('span.stats-btc-usd').text('$' + response.usd_price);

          var hashrate = (response.networkhashps / 1000 / 1000 / 1000 / 1000).toString().substr(0,5) + ' <span class="hidden-xs">Thash/s</span>';
          $('span.stats-hashrate').html(hashrate);
          $('span.stats-blocks').html(numberFormat(response.blocks));
          $('span.stats-difficulty').html(numberFormat(Math.floor(response.difficulty)));
          $('span.stats-time').html('0' + response.average_minutes + ':' + response.average_seconds);

          var ticket_price = response.sbits.toString().substr(0,4); 
          /* 2.00000001 -> 2.01
           * 2.09999999 -> 2.10
           */
          ticket_price = parseFloat(ticket_price);
          if (response.sbits > ticket_price) { 
            ticket_price = Math.round((ticket_price + 0.01) * 100) / 100;
          }

          $('span.stats-ticketprice').html(ticket_price + ' <span class="hidden-xs">DCR</span>');
          $('span.stats-poolsize').html(numberFormat(response.poolsize));
          $('span.stats-mempool').html(numberFormat(response.pooledtx));
          var avg_fee = response.fees ? response.fees.toString().substr(0,6) : 0.05;
          var max_fee = response.max_fees ? response.max_fees.toString().substr(0,6) : 0.05;
          $('span.stats-fees').html(avg_fee + ' <span class="hidden-xs">DCR</span>');

          /***** Hints blocks *****/
          /* PoS tickets */
          var html = '';
          if (response.sbits <= response.avg_sbits) {
            html = '<div class="hint hint-red"><h4>Time to buy PoS tickets</h4> <p>Current ticket price <b>'+ticket_price+' DCR</b> is lower than average: '+response.avg_sbits+' DCR. <br> Hurry to take the best price.</p></div>';
          } else {
            html = html = '<div class="hint hint-red"><h4>Don\'t buy new PoS tickets right now</h4> <p>Current ticket price <b>'+ticket_price+' DCR</b> is very high compared with average price '+response.avg_sbits+' DCR and all time low 2 DCR. <br> We suggest to wait for the PoS-difficulty adjustment.</p></div>';
          }
          $('div.hint-pos').html(html);

          var est_pos_blocks = 144 - (response.blocks % 144);
          var est_pos_time = secondsToTime(est_pos_blocks * response.average_time);

          $('.est-pos-time').html('in '+est_pos_time.hours+' hours '+est_pos_time.minutes+' minutes');
          $('.est-pos-blocks').html('<b>' + est_pos_blocks + '</b> blocks left');
          $('.est-pos-price').html('');

          var block_reward = getEstimatedBlockReward(Math.ceil(response.blocks / 6144) - 1, response.reward);
          $('.block-reward').html(block_reward.toString().substr(0,5) + ' DCR');
          $('.pow-block-reward').html('<span class="hidden-xs"><b>PoW-reward</b>: </span><span class="visible-xs-block"><b>PoW</b>: </span>' + (block_reward * 0.6).toString().substr(0,6) + ' DCR');
          $('.pos-block-reward').html('<span><b>PoS vote</span></b>: ' + (block_reward * 0.3 / 5).toString().substr(0,6) + ' DCR');
          $('.dev-block-reward').html('<span class="hidden-xs"><b>Dev subsidy</b>: </span><span class="visible-xs-block"><b>Devs</b>: </span>' + (block_reward * 0.1).toString().substr(0,6) + ' DCR');

          var next_block_subsidy = getEstimatedBlockReward(Math.ceil(response.blocks / 6144), response.reward);
          $('.est-block-reward').html(next_block_subsidy.toString().substr(0,5) + ' DCR');
          //$('.est-pow-block-reward').html('<span><b>PoW-reward</span></b>: ' + (next_block_subsidy * 0.6).toString().substr(0,6) + ' DCR');
          //$('.est-pos-block-reward').html('<span><b>PoS vote</span></b>: ' + (next_block_subsidy * 0.3 / 5).toString().substr(0,6) + ' DCR');
          //$('.est-dev-block-reward').html('<span><b>Dev fee</span></b>: ' + (next_block_subsidy * 0.1).toString().substr(0,6) + ' DCR');

          var est_subsidy_blocks = 6144 - (response.blocks % 6144);
          var est_subsidy_time = secondsToTime(est_subsidy_blocks * response.average_time);
          $('.est-reward-time').html('in '+est_subsidy_time.hours+' hours '+est_subsidy_time.minutes+' minutes');
          $('.est-reward-blocks').html('<b>' + est_subsidy_blocks + '</b> blocks left');

          /* Mempool fees */
          $('b.avg-fee').html(avg_fee + ' DCR');
          $('b.max-fee').html(max_fee + ' DCR');

          /* Draw voters chart on page load */
          if (isStartup) {
            var voters = [{
                      name: '5 voters',
                      y: response.five_voters,
                      color: '#3498DB'
                  }, {
                      name: '4 voters',
                      y: response.four_voters,
                      color: '#E7A03C'
                  }, {
                      name: '3 voters',
                      y: response.three_voters,
                      color: '#E74C3C'
                  }];
            var missed = response.four_voters + 2 * response.three_voters;
            var total = 5 * (response.blocks - 4095);
            drawVotersChart(voters, missed, total);
          }

          /* Draw supply chart on page load */
          if (isStartup) {
            var max_reward = (response.blocks - 4095) * response.reward;
            // TODO: omg, check this math 10 times more
            var supply = {
              premine: 1680000,
              pow: response.mined_before_pos - (response.reward * 0.1 * 4095) + 0.6 * (response.blocks - 4095) * response.reward - 0.2 * 0.6 * missed * response.reward,
              pos: 0.06 * (total - missed) * response.reward,
              devs: (response.reward * 0.1 * 4095) + 0.1 * (response.blocks - 4095) * response.reward - 0.2 * 0.1 * missed * response.reward
            };
            console.log(supply);
            drawSupplyChart(supply);
          }
        }
      }
    });
  };
});


$(function () {

    $.ajax({
      url: '/api/v1/pos',
      type: 'GET',
      dataType: "json",
      success: function (data) {
        drawPoolsize(data.poolsize);
        drawSbits(data.sbits);
      }
    });

    $.ajax({
      url: '/api/v1/usd_price',
      type: 'GET',
      dataType: "json",
      success: function (data) {
        if (!data.error) {
          drawPrice(data);
        }
      }
    });

    setTimeout(function(){
      $('.highcharts-button').remove();
      $("text:contains(Highcharts.com)").remove();
    }, 2000);
});

function getEstimatedBlockReward(cycles, reward) {
  if (cycles) {
    reward = reward * 100/101;
    return getEstimatedBlockReward(cycles - 1, reward);
  } else {
    return reward;
  }
}

function numberFormat(number) {
    return number.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
}

function secondsToTime(secs) {
  var hours = Math.floor(secs / (60 * 60));
  
  var divisor_for_minutes = secs % (60 * 60);
  var minutes = Math.floor(divisor_for_minutes / 60);
  if (minutes < 10) {
    minutes = "0" + minutes.toString();
  }

  return {"hours": hours, "minutes": minutes};
}
