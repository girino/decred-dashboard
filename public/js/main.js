$(function() {

  updateStats();
  setInterval(updateStats, 60000);

  function updateStats() {
    $.ajax({
      url : '/api/v1/get_stats',
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
              .css('color', '#C1314A');
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
              .css('color', '#C1314A');
          }

          $('span.stats-btc-usd').text('$' + response.usd_price);

          var hashrate = (response.networkhashps / 1000 / 1000 / 1000 / 1000).toString().substr(0,5) + ' <span class="hidden-xs">Thash/s</span>';
          $('span.stats-hashrate').text(hashrate);
          $('span.stats-blocks').text(numberFormat(response.blocks));
          $('span.stats-difficulty').text(numberFormat(Math.floor(response.difficulty)));
          $('span.stats-time').text('0' + response.average_minutes + ':' + response.average_seconds);
          $('span.stats-ticketprice').text(response.sbits.toString().substr(0,4) + ' <span class="hidden-xs">DCR</span>');
          $('span.stats-poolsize').text(numberFormat(response.poolsize));
          $('span.stats-mempool').text(numberFormat(response.pooledtx));
          $('span.stats-fees').text(response.fees.toString().substr(0,6) + ' <span class="hidden-xs">DCR</span>');
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

    setTimeout(function(){
      $('.highcharts-button').remove();
      $("text:contains(Highcharts.com)").remove();
    }, 2000);
});

function numberFormat(number) {
    return number.toString().replace(/(\d)(?=(\d\d\d)+([^\d]|$))/g, '$1 ');
}
