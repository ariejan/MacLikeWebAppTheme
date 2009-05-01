// Place your application-specific JavaScript functions and classes here
// This file is automatically included by javascript_include_tag :defaults

jQuery(document).ready(function($) {
  
    // lightbox activation
  if ($.facebox) 
    $('a[rel*=facebox]').facebox({
      next_image    : 'facebox/fast_forward.png',
      play_image    : 'facebox/play.png',
      pause_image   : 'facebox/pause.png',
      prev_image    : 'facebox/rewind.png'
    });

});
