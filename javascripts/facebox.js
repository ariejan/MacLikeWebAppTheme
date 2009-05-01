/*
 * Facebox (for jQuery)
 * version: 1.1 (01/20/2007)
 * @requires jQuery v1.2 or later
 *
 * Examples at http://famspam.com/facebox/
 *
 * Licensed under the MIT:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Copyright 2007 Chris Wanstrath { chris@ozmm.org }
 *
 * Usage:
 *  
 *  jQuery(document).ready(function($) {
 *    $('a[rel*=facebox]').facebox() 
 *  })
 *
 *  <a href="#terms" rel="facebox">Terms</a>
 *    Loads the #terms div in the box
 *
 *  <a href="terms.html" rel="facebox">Terms</a>
 *    Loads the terms.html page in the box
 *
 *  <a href="terms.png" rel="facebox">Terms</a>
 *    Loads the terms.png image in the box
 *
 *
 *  You can also use it programmatically:
 * 
 *    jQuery.facebox('some html')
 *
 *  This will open a facebox with "some html" as the content.
 *    
 *    jQuery.facebox(function($) { $.ajaxes() })
 *
 *  This will show a loading screen before the passed function is called,
 *  allowing for a better ajax experience.
 *
 */
(function($) {
 /**
   *  The static facebox() function, can be passed a string or
   *  function.
   *
   *  You can also use it programmatically:
   * 
   *    jQuery.facebox('some html')
   *
   *  This will open a facebox with "some html" as the content.
   *    
   *    jQuery.facebox(function($) { $.ajaxes() })
   *
   *  This will show a loading screen before the passed function is called,
   *  allowing for a better ajax experience.
   */
  $.facebox = function(data) {
    facebox_init()
    facebox_loading()
    $.isFunction(data) ? data.call(this, $) : facebox_reveal(data)
    return $
  }

 /**
   * Facebox settings, which can be modified through the facebox() method 
   * or directly.
   *
   *    jQuery('a[rel*=facebox]').facebox({ loading_image: '/images/spinner.gif' })
   *
   *    jQuery.facebox.settings.loading_image = '/images/spinner.gif'
   */
  $.facebox.settings = {
    loading_image : 'facebox/loading.gif',
    close_image   : 'facebox/closelabel.gif',
    image_types   : [ 'png', 'jpg', 'jpeg', 'gif' ],
    next_image    : 'facebox/next.gif',
    prev_image    : 'facebox/prev.gif',
    play_image    : 'facebox/play.gif',
    pause_image   : 'facebox/pause.gif',
    slide_duration: 6,
    facebox_html  : '\
  <div id="facebox" style="display:none;"> \
    <div class="popup"> \
      <table> \
        <tbody> \
          <tr> \
            <td class="tl"/><td class="b"/><td class="tr"/> \
          </tr> \
          <tr> \
            <td class="b"/> \
            <td class="body"> \
              <div class="content"> \
              </div> \
              <div class="info"></div> \
              <div class="footer"> \
                <div class="navigation"></div> \
                <a href="#" class="close"> \
                  <img src="/facebox/loading.gif" title="close" class="close_image" /> \
                </a> \
              </div> \
            </td> \
            <td class="b"/> \
          </tr> \
          <tr> \
            <td class="bl"/><td class="b"/><td class="br"/> \
          </tr> \
        </tbody> \
      </table> \
    </div> \
  </div>'
  }
  var $s = $.facebox.settings

  $.fn.facebox = function(settings) {
    facebox_init(settings)

    var image_types = $s.image_types.join('|')
    image_types = new RegExp('\.' + image_types + '$', 'i')

    // suck out the images
    var images = []
    $(this).each(function() {
      if (this.href.match(image_types) && $.inArray(this.href, images) == -1) 
        images.push(this.href)
    })
    if (images.length == 1) { images = null }

    function click_handler() {
      if ($('#facebox .loading').length == 1) return false
      facebox_loading()

      // support for rel="facebox[.inline_popup]" syntax, to add a class
      var klass = this.rel.match(/facebox\[\.(\w+)\]/)
      if (klass) klass = klass[1]

      // div
      if (this.href.match(/#/)) {
        var url    = window.location.href.split('#')[0]
        var target = this.href.replace(url,'')
        facebox_reveal($(target).clone().show(), klass)

      // image
      } else if (this.href.match(image_types)) {
        facebox_reveal_image(this.href, images, klass)

      // ajax
      } else {
        $.get(this.href, function(data) { facebox_reveal(data, klass) })
      }

      return false
    }

    return this.click(click_handler)
  }

/**
  * The init function is a one-time setup which preloads vital images
  * and other niceities.
  */
  function facebox_init(settings) {
    if ($s.inited && typeof settings == 'undefined')
      return true
    else 
      $s.inited = true

    if (settings) $.extend($s, settings)

    $('body').append($s.facebox_html)

    var preload = [ new Image(), new Image() ]
    preload[0].src = $s.close_image
    preload[1].src = $s.loading_image

    $('#facebox').find('.b:first, .bl, .br, .tl, .tr').each(function() {
      preload.push(new Image())
      preload.slice(-1).src = $(this).css('background-image').replace(/url\((.+)\)/, '$1')
    })

    $('#facebox .close').click(facebox_close)
    $('#facebox .close_image').attr('src', $s.close_image)
  }

/**
  * The loading function prepares the facebox by displaying it
  * in the proper spot, cleaning its contents, attaching keybindings 
  * and showing the loading image.
  */
  function facebox_loading() {
    if ($('#facebox .loading').length == 1) return true

    $(document).unbind('.facebox')
    $('#facebox .content, #facebox .info, #facebox .navigation').empty()
    $('#facebox .body').children().hide().end().
      append('<div class="loading"><img src="'+$s.loading_image+'"/></div>')

    var pageScroll = getPageScroll()
    $('#facebox').css({
      top:	pageScroll[1] + (getPageHeight() / 10),
      left:	pageScroll[0]
    }).show()

    $(document).bind('keydown.facebox', function(e) {
      if (e.keyCode == 27) facebox_close()
    })
  }

/**
  * The facebox_reveal function sets the user-defined class (if any)
  * on the .content div, removes the loading image, and displays
  * the data.  If an extra_setup functino is provided, it will be run
  * right before the data is displayed but after it is added.
  */
  function facebox_reveal(data, klass, extra_setup) {
    $('#facebox .content').addClass(klass).append(data)
    $('#facebox .loading').remove()
    if ($.isFunction(extra_setup)) extra_setup.call(this)
    $('#facebox .body > *').fadeIn('normal')
  }

/**
  * Used to load and show an image in the facebox.  Involved in the slideshow business.
  */
  function facebox_reveal_image(href, images, klass) {
    if (images) var extra_setup = facebox_setup_gallery(href, images, klass)
    var image    = new Image()
    image.onload = function() {
      facebox_reveal('<div class="image"><img src="' + image.src + '" /></div>', klass, extra_setup)
      // load the next image in the background
      if (images) {
        var position = $.inArray(href, images)
        var next = new Image()
        next.src = images[position+1] ? images[position+1] : images[0]
      }
    }
    image.src = href
  }

/**
  * Unbinds all listeners and closes the facebox.
  */
  function facebox_close() {
    facebox_stop_slideshow()
    $(document).unbind('.facebox')
    $('#facebox').fadeOut(function() {
      $('#facebox .content').removeClass().addClass('content')
    })
    return false
  }

  function facebox_setup_gallery(href, images, klass) {
    var position = $.inArray(href, images)

    var jump = function(where) {
      facebox_loading()
      if (where >= images.length) where = 0
      if (where < 0) where = images.length - 1
      facebox_reveal_image(images[where], images, klass)
    }

    return function() {
      $('#facebox .image').click(function() { jump(position + 1) }).css('cursor', 'pointer')
      $('#facebox .info').append('Imagem ' + (position + 1) + ' de ' + images.length)
      $('#facebox .navigation').
        append('<img class="prev" src="' + $s.prev_image + '"/>' +
          '<img class="play" src="' + ($s.playing ? $s.pause_image : $s.play_image) + '"/>' +
          '<img class="next" src="' + $s.next_image + '"/>').
        find('img').css('cursor', 'pointer').end().
        find('.prev').click(function() { jump(position - 1); return false }).end().
        find('.next').click(function() { jump(position + 1); return false }).end()

      $('#facebox .play').bind('click.facebox', function() {
        $s.playing ? facebox_stop_slideshow() : facebox_start_slideshow()
        return false
      })

      $(document).bind('keydown.facebox', function(e) {
        if (e.keyCode == 39) jump(position + 1) // right
        if (e.keyCode == 37) jump(position - 1) // left
      })
    }
  }

  function facebox_start_slideshow() {
    $('#facebox .play').attr('src', $s.pause_image)
    $s.playing = setInterval(function() { $('#facebox .next').click() }, $s.slide_duration * 1000)
  }

  function facebox_stop_slideshow() {
    $('#facebox .play').attr('src', $s.play_image)
    clearInterval($s.playing)
    $s.playing = false
  }

  // getPageScroll() by quirksmode.com
  function getPageScroll() {
    var xScroll, yScroll;
    if (self.pageYOffset) {
      yScroll = self.pageYOffset; xScroll = self.pageXOffset;
    } else if (document.documentElement && document.documentElement.scrollTop) {	 // Explorer 6 Strict
      yScroll = document.documentElement.scrollTop; xScroll = document.documentElement.scrollLeft;
    } else if (document.body) {// all other Explorers
      yScroll = document.body.scrollTop; xScroll = document.body.scrollLeft;	
    }
    return new Array(xScroll,yScroll) 
  }

  // adapter from getPageSize() by quirksmode.com
  function getPageHeight() {
    var windowHeight
    if (self.innerHeight) {	// all except Explorer
      windowHeight = self.innerHeight;
    } else if (document.documentElement && document.documentElement.clientHeight) { // Explorer 6 Strict Mode
      windowHeight = document.documentElement.clientHeight;
    } else if (document.body) { // other Explorers
      windowHeight = document.body.clientHeight;
    }	
    return windowHeight
  }
})(jQuery);
