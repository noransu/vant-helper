'use strict';

$(document.body).addClass('fixed').css({
  'display': 'none',
  'min-width': '720px',
});
$(window).on('load', () => {
  setTimeout(() => {
    const container = $('.van-doc');

    container.find('.van-doc-header').remove();

    container.find('.van-doc-nav').css({
      'opacity': '0',
      'z-index': '-10'
    });

    container.find('.van-doc-container').css({
      'padding-left': '0px',
      'padding-right': '0px',
      'width': '380px',
    });

    container.find('.van-doc-simulator').css({
      'left': '390px',
      'padding-right': '0px',
      'width': '320px',
    });

    $(document.body).css('display', 'block');
    window.postMessage({ loaded: true }, '*');
  }, 300)
});
