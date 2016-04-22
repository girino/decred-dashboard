$(function() {

  $.ajax({
    url : '/api/v1/peerinfo?' + new Date().getTime(),
    type : 'GET',
    success : function(peers) {
      // try {
      //   peers = JSON.parse(peers);
      // } catch(e) {
      //   console.error(e);
      //   return;
      // }
      drawMap(peers);
      fillTable(peers);
    }
  });

  function drawMap(peers) {
    /* Prepare array with nodes */
    var map = _.map(peers, function (peer) {
      if(peer.geo != null) {
        return {
          radius: 3,
          latitude: peer.geo.ll[0],
          longitude: peer.geo.ll[1],
          nodeName: peer.geo.city ? peer.geo.city + ", " + peer.geo.country : peer.addr + ", " + peer.geo.country ,
          fillClass: "text-success",
          fillKey: "success",
        };
      } else {
        return {
          radius: 0,
          latitude: 0,
          longitude: 0
        };
      }
    });

    var nodesMap = new Datamap({
      element: document.getElementById('nodes_map'),
      scope: 'world',
        fills: {
          success: '#7BCC3A',
          info: '#10A0DE',
          warning: '#FFD162',
          orange: '#FF8A00',
          danger: '#F74B4B',
          defaultFill: '#282828'
        },
        geographyConfig: {
          borderWidth: 0,
          borderColor: '#000',
          highlightOnHover: false,
          popupOnHover: false
        },
        bubblesConfig: {
          borderWidth: 0,
          highlightOnHover: false,
          popupOnHover: true
        }
    });

    //draw bubbles
    nodesMap.bubbles(map, {
      borderWidth: 0,
      highlightOnHover: false,
      popupOnHover: true,
      popupTemplate: function(geo, data) {
        return ['<div class="tooltip-arrow"></div>',
            '<div class="hoverinfo ' + data.fillClass + '">',
              '<div class="propagationBox"></div>',
              '<strong>',
              data.nodeName,
              '</strong>',
            '</div>'].join('');
      }
    });
  }

  function fillTable(peers) {
    var table = $('#nodes-table');
    if (peers) {
      peers.forEach(function(peer) {

        var city = peer.geo.city ? peer.geo.city + ", " + peer.geo.country : peer.geo.country;
        var latency = peer.lastrecv - peer.lastsend;
        if (latency < 0) latency = 0;
        var color = peer.best_block == 'ok' ? "node-success" : "node-danger";

        var color_latency = "node-success";
        if (latency > 30 && latency < 60) color_latency = "node-warning";
        if (latency > 60) color_latency = "node-danger";

        var html = '<tr><td>'+city+'</td>';
            html += '<td>'+peer.addr+'</td>';
            html += '<td class="'+color_latency+'">'+latency+' sec</td>';
            html += '<td class="'+color+'"># '+peer.currentheight+'</td>';
            html += '<td>'+peer.subver.split('/')[2]+'</td></tr>';
        table.append(html);
      });
    }
  };

});