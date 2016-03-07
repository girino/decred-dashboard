$(function () {

    $('.pow-group .btn-chart').on('click', function(e) {
      e.preventDefault();
      var $this = $(this);
      var time = $this.data('period');
      var chart = $this.data('chart');

      $this.parent().find('button').each(function(item) { $(this).removeClass('active'); });
      $this.addClass('active');

      updatePowChart(time, chart);     
    });

    updatePowChart(365, 'difficulty');
    updatePowChart(365, 'hashrate');
    setTimeout(function() {
      $('.highcharts-button').remove();
      $("text:contains(Highcharts.com)").remove();
    }, 2000);
});

function updatePowChart(time, chart) {
  $.ajax({
    url: '/api/v1/'+chart+'?data='+chart+'&time='+time,
    type: 'GET',
    dataType: "json",
    success: function (data) {
      if (chart == 'hashrate') {
        drawPow(data, chart, 'Network Hashrate');
      }
      if (chart == 'difficulty') {
        drawPow(data, chart, 'PoW Difficulty');
      }
      setTimeout(function() {
        $('.highcharts-button').remove();
        $("text:contains(Highcharts.com)").remove();
      }, 1000);
    }
  });
}