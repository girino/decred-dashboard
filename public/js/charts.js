function drawPoolsize(data) {
  $('#pos-poolsize').highcharts({
    chart: {
        zoomType: 'x'
    },
    title: {
        text: 'PoS Poolsize'
    },
    /*
    subtitle: {
        text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
    },
    */
    xAxis: {
        type: 'datetime'
    },
    /*
    yAxis: {
        title: {
            text: 'Exchange rate'
        }
    },
    */
    legend: {
        enabled: false
    },
    plotOptions: {
        area: {
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            },
            marker: {
                radius: 2
            },
            lineWidth: 1,
            states: {
                hover: {
                    lineWidth: 1
                }
            },
            threshold: null
        }
    },

        series: [
            {
                name: 'Poolsize',
                data: data,
                type: 'areaspline',
                color: "#a0ceff",
                dataGrouping: {
                    approximation: "average",
                    smoothed: true,
                    groupPixelWidth: 30
                },

                tooltip: {
                    valueDecimals: 8
                },
                states: {
                    hover: {
                        enabled: false
                    }
                },
                lineWidth: 1,
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, Highcharts.Color("#CFF0F7").setOpacity(0.5).get("rgba")],
                        [1, Highcharts.Color("#a0ceff").get("rgba")]//.setOpacity(0).get('rgba')]
                    ]
                }
            }
        ]

});
}

function drawSbits(data) {
  $('#pos-sbits').highcharts({
    chart: {
        zoomType: 'x'
    },
    title: {
        text: 'PoS Ticket Price (in DCR)'
    },
    /*
    subtitle: {
        text: document.ontouchstart === undefined ?
                'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
    },
    */
    xAxis: {
        type: 'datetime'
    },
    /*
    yAxis: {
        title: {
            text: 'Exchange rate'
        }
    },
    */
    legend: {
        enabled: false
    },
    plotOptions: {
        area: {
            fillColor: {
                linearGradient: {
                    x1: 0,
                    y1: 0,
                    x2: 0,
                    y2: 1
                },
                stops: [
                    [0, Highcharts.getOptions().colors[0]],
                    [1, Highcharts.Color(Highcharts.getOptions().colors[0]).setOpacity(0).get('rgba')]
                ]
            },
            marker: {
                radius: 2
            },
            lineWidth: 1,
            states: {
                hover: {
                    lineWidth: 1
                }
            },
            threshold: null
        }
    },

        series: [
            {
                name: 'Price',
                data: data,
                type: 'areaspline',
                color: "#a0ceff",
                dataGrouping: {
                    approximation: "average",
                    smoothed: true,
                    groupPixelWidth: 30
                },

                tooltip: {
                    valueDecimals: 8
                },
                states: {
                    hover: {
                        enabled: false
                    }
                },
                lineWidth: 1,
                fillColor: {
                    linearGradient: {
                        x1: 0,
                        y1: 0,
                        x2: 0,
                        y2: 1
                    },
                    stops: [
                        [0, Highcharts.Color("#CFF0F7").setOpacity(0.5).get("rgba")],
                        [1, Highcharts.Color("#a0ceff").get("rgba")]//.setOpacity(0).get('rgba')]
                    ]
                }
            }
        ]

});
}

function drawVotersChart(data, missed, total) {
    $(function () {

    $(document).ready(function () {

        var percent_missed = (missed / total * 100).toString().substr(0,4) + '%';

        // Build the chart
        $('#voters').highcharts({
            chart: {
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false,
                type: 'pie'
            },
            title: {
                text: 'Voters per block'
            },
            subtitle: {
                text: "<b>"+percent_missed+"</b> tickets didn't cast a vote ("+missed+" of "+total+")"
            },
            tooltip: {
                pointFormat: '<b>{point.y} blocks</b>'
            },
            plotOptions: {
                pie: {
                    allowPointSelect: false,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                    },
                    showInLegend: false
                }
            },
            series: [{
                name: 'Votes',
                colorByPoint: true,
                data: data
            }]
        });
    });
});
}
