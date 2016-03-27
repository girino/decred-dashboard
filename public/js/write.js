$(document).ready(function() {

  new Vue({
    el: '#editor',
    data: {
      input: '# Decred tutorial'
    },
    filters: {
      marked: marked
    }
  });

  autosize($('#editor textarea'));

  // Retrieve the object from storage onReady
  var autosave = localStorage.getItem('decred_article');
  // parses the string
  try {
    var text = JSON.parse(autosave);
  } catch(e) {
    console.error(e);
  }

  if (text) {
    $("#editor textarea").val(text);
  }

  /* Save textarea content */
  setInterval(function() {
     var text = $('#editor textarea').val();
     if (text) {
      localStorage.setItem('decred_article', JSON.stringify(text));
     }
  }, 1000);

  $("#pop").on("click", function(e) {
    e.preventDefault();
    $('#imagepreview').attr('src', $(this).attr('href'));
    $('#imagemodal').modal('show');
  });

  $('#submit-article').on('click', function(e) {
    e.preventDefault();
    $('.alert').remove();
    $('.submission-progress').show();
    var $this = $(this);
    $this.attr('disabled', 'disabled');
    if (confirm('Are you sure that you want to submit your tutorial?')) {
      var data = {
        'name' : $('#name').val(),
        'email' : $('#email').val(),
        'link' : $('#link').val(),
        'tutorial' : $('#content').val()
      };
      $.ajax({
        url: '/articles/write-decred-tutorial',
        type: 'POST',
        data: data,
        success: function(response) {
          $('.submission-progress').hide();
          $this.removeAttr('disabled');

          if (response.success) {
            $('.submission-response').html('<div class="alert alert-success" role="alert"><span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>'+response.message+'</div>');
            $('form')[0].reset();
            $('#editor textarea').val("");
            $('.article-preview').html("");
            //clear local storage
            localStorage.setItem('decred_article', JSON.stringify(""));
          } else if (response.error) {
            $('.submission-response').html('<div class="alert alert-danger" role="alert"><span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span><span class="sr-only">Error:</span>'+response.message+'</div>');
          }
        }
      });
    } else {
      $('.submission-progress').hide();
      $this.removeAttr('disabled');
    }
  });
});