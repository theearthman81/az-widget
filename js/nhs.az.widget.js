/********************************************************************
*	Author: 		Jim English										*	
*	Company: 		JRE Solutions Ltd								*	
*	Description: 	An AZ widget for built for the NHS.				*
********************************************************************/
var nhsAZDefaults = {
	serviceURL: 'http://v1.syndication.nhschoices.nhs.uk/conditions',				// az service url to be used
	apiKey: 'PHRJCDTY',																// az service api key
	articles: [],																	// article holder
	imgUrl: '../img/nhs_choices.gif',														// logo url
	titleText: 'conditions',														// title logo
	headingText: 'NHS Widget',														// heading of widget
	noResults: 'Sorry please try again later.',										// error message
	logoUrl: 'http://www.nhs.uk'													// logo link url
};
(function ($, window, document, undefined) {
	$.nhsAZWidget = function (el, opts) {
		var apiKey,
			rootUrl,
			rootItems,
			$el, $ul, $content, $heading, $video, $tab;
			
		opts = $.extend(true, {}, $.nhsAZWidget.defaults, opts);
		rootItems = opts.articles;
		rootUrl = opts.serviceURL + '/articles';
		apiKey = opts.apiKey;
		cache = {};
		
		$el = $(el).append('<div id="az-nhs-widget"><div class="nhs-widget-inner"></div></div>').find('.nhs-widget-inner');
		$heading = $el.append('<div class="nhs-widget-header"><div class="nhs-widget-logo"><a href="' + opts.logoUrl + '" target="_blank"><img src="' + opts.imgUrl + '" alt="nhs choices"/><span>' + opts.titleText + '</span></a></div><h2 class="nhs-widget-title">' + opts.headingText + '</h2></div>').find('nhs-widget-title');
		$ul = $el.append('<ul class="nhs-widget-nav nhs-widget-clear" />').find('.nhs-widget-nav');
		$tab = $el.append('<div class="nhs-widget-tabs nhs-widget-clear"><div class="nhs-widget-tab"><div class="nhs-widget-video"></div><div class="nhs-widget-content"></div></div></div>').find('.nhs-widget-tab');
		$content = $el.find('.nhs-widget-content');
		$video = $el.find('.nhs-widget-video');
		
		function renderMenu(url, items) {
			if (!items.children) {
				return;
			}
			for(var i = 0, l = items.children.length; i < l; i++) {
				renderTab(items.children[i], i);
				if (i === 0) {
					renderArticle(items.children[i].url);
				}
			}
		}
			
		function renderTab(article, i) {
			var className = ((i == 0) ? 'nhs-widget-first nhs-widget-active' : '') + ''
			$ul.append('<li class="' + className + '"><a href="' + article.url + '">' + article.label + '</a></li>');
		}
			
		function renderArticle(url) {
			url = rootUrl + '/' + url;
			$content.html('');
			$video.html('');
			if (cache[url]) {
				setTimeout(function () {
					$tab.removeClass('nhs-widget-loader'); 
					$video.html(cache[url].video);
					$content.html(cache[url].content);
				}, 200);
			} else {
				getData(url, function(data) {
					var entry = data && data.query.results && data.query.results.feed && data.query.results.feed.entry || {},
						c = $(entry.content && entry.content.content || '').find('a').attr('target', '_blank').end(),
						vid = $(entry.videoEmbedCodes && entry.videoEmbedCodes.videoEmbedCode || '');
					if (c) {
						$tab.removeClass('nhs-widget-loader');
						$video.append(vid);
						$content.append(c);
						cache[url] = {
							content: c,
							video: vid
						};
					} else {
						$tab.removeClass('nhs-widget-loader');
						$content.html('<div class="nhs-widget-error">' + opts.noResults + '</div>');
					}
				});
			}
		}
			
		function getData(url, callback) {
			var prot = 'http' + (/^https/.test(window.location.protocol)?'s':'');
			
			$.getJSON(prot + "://query.yahooapis.com/v1/public/yql?callback=?",
			{
				q: 'select * from xml where url="' + url + '.xml?apikey=' + apiKey + '"',
				format: 'json',
				diagnostics: true
			}, callback);
		}
		
		$ul.delegate('a', 'click', function(){
			var $a = $(this),
				$li = $a.parent('li');
			if ($li.hasClass('nhs-widget-active')) {
				return false;
			}
			$tab.addClass('nhs-widget-loader');
			$ul.find('.nhs-widget-active').removeClass('nhs-widget-active');
			$li.addClass('nhs-widget-active');
			renderArticle($a.attr('href'));
			return false;
		});
		
		$tab.addClass('nhs-widget-loader');
		if (rootItems.length > 1) {
			var articles = [];
			for (var i = 0, l = rootItems.length; i < l; i++) {
				for (var y = 0, len = rootItems[i].children.length; y < len; y++) {
					articles.push(rootItems[i].children[y]);
				}
			}
			renderMenu(rootUrl, { children: articles });
		} else {
			renderMenu(rootUrl, rootItems[0]);
		}
	};
	
	$.nhsAZWidget.defaults = nhsAZDefaults;
	$.nhsAZWidget.widgets = 0;
	
	// extend jQuery object
	$.fn.extend({
		nhsAZWidget: function (options) {
			options = options || {};
			this.each(function () {
				var instance = $.data(this, 'nhsAZWidget');
				if (!instance) {
					$.data(this, 'nhsAZWidget', new $.nhsAZWidget(this, options));
				}
			});
			return this;
		}
	});
	
}(jQuery, window, document));