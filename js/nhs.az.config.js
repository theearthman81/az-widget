/********************************************************************
*	Author: 		Jim English										*	
*	Company: 		JRE Solutions Ltd								*	
*	Description: 	A configuration tool for built for the NHS.		*
********************************************************************/
var stylesheetPath = 'path to stylesheet',											// path to CSS stylesheet file
	javaScriptPath = 'path to javascript',											// path to Javascript file
	apiKey = 'PHRJCDTY',															// carers service API key
	defaultWidth = 600,																// default width of widget
	subjectsUrl = 'http://v1.syndication.nhschoices.nhs.uk/conditions/subjects',	// subjects url
	azUrl = 'http://v1.syndication.nhschoices.nhs.uk/conditions/atoz';				// a-z URL 
(function ($, window, document, undefined) {
	$(function () {
		var idNum = 0,
			$ul = $('#nhs-tree').attr('level', 1),
			$width = $('#width').val(defaultWidth),
			loading = true,
			$widgetTitle = $('#widget-title');
		
		function getData (url, $ul) {
			var prot = 'http' + (/^https/.test(window.location.protocol)?'s':''),
				loader = $('.loader');
			$.getJSON(prot + "://query.yahooapis.com/v1/public/yql?callback=?",
			{
				q: 'select * from xml where url="' + url + '.xml?apikey=' + apiKey + '"',
				format: 'json',
				diagnostics: true
			},
			function (data) {
				var a = (data && data.query && data.query.results && data.query.results.ArrayOfLink) ? data.query.results.ArrayOfLink.Link : [],
					obj,
					html = [],
					childUl,
					treeLnk = '',
					cLevel = Number($ul.attr('level'));
					a = ($.isArray(a)) ? a : [a];
					
				for(var i=0,len=a.length;i < len;i++) {
					obj = a[i];
					if (!obj) {
						break;
					}
					if (obj.Uri) {
						childUl = '<ul level="' + (cLevel + 1) + '" />';
					}
					if (cLevel < 3) {
						treeLnk = '<a class="toggler" href="' + obj.Uri + '"></a>';
					} 
					if (obj.Uri && obj.Uri.indexOf('mapofmedicinepage') < 0) {
						html.push('<li level="' + cLevel + '">' + treeLnk + '<label><input level="' + cLevel + '" jr-label="' + obj.Text + '" type="checkbox" name="url" value="' + obj.Uri + '"/><span class="input-label">' + obj.Text + '</span></label>' + (cLevel == 3 ? '<a class="editLabelLnk" href="#">edit label</a>' : '') + childUl + '</li>');
					}
					childUl = '';
					idNum++;
				}
				$ul.data('loaded', true);
				$ul.append(html.join(''));
				loader.remove();
			});
		}
		
		function loadUl (li, check) {
			var $el = li.find('a'),
				ul = li.find('ul'),
				chkBox = li.find('input[type="checkbox"]'),
				url = chkBox.val().split('?')[0];
			
			if (!ul.data('loaded')) {
				getData(url, ul);
			} 
			if (!check) {
				ul.toggleClass('open');
				$el.toggleClass('open');
			} else {
				ul.addClass('open');
				$el.first().addClass('open');
			}
		}
		
		$ul.delegate('a', 'click', function () {
			loadUl($(this).parent());
			this.blur();
			return false;
		});
		
		$ul.delegate('ul[level="3"] li', 'hover', function (event) {
			$(this).find('.editLabelLnk').css('display', event.type === 'mouseenter' ? 'inline' : 'none');
		});
		
		$ul.delegate('.editLabelLnk', 'click', function() {
			var $editLnk = $(this),
				offset = $editLnk.offset(),
				$input = $editLnk.parent('li').find('input');
			$('#editLabel').show()
						.css({
							position: 'absolute',
							top: offset.top,
							left: offset.left
						})
						.val($input.attr('jr-label'))
						.focus()
						.data('element-ref', $input)
			$editLnk.hide();
			return false;
		});
		
		
		$ul.delegate('input[type="checkbox"]', 'click', function (e) {
			var input = $(this),
				parents = input.parents('li');
			
			if ($widgetTitle.val() === '') {
				$widgetTitle.val(input.parents('li[level="2"]').find('input').first().attr('jr-label'));
			}
			
			if (input.is(':checked')) {
				loadUl(input.parents('li').first(), true);
				parents.each(function () {
					var el = $(this).children('label').find('input').first();
					if(el.val() !== input.val()) {
						el.attr('checked', 'checked');
					}
				});
			} else {
				parents.first().find('input[type="checkbox"]').attr('checked', '');
			}
		});
		
		$('#editLabel').keypress(function(event) {
			var $editInput = $(this),
				$elRef = $editInput.data('element-ref');
			if(event.which == 13) {
				$editInput.hide();
				if ($elRef && $elRef.length) {
					$elRef.attr('jr-label', this.value);
					$elRef.parent('label').find('.input-label').html(this.value);
				}
			}
		}).blur(function() {
			$(this).hide();
		});
		
		$('#generate').click(function () {
			var root = 'http://v1.syndication.nhschoices.nhs.uk/conditions/articles/',
				newObj = {
					articles: []
					};
			$ul.find('input[level="2"]:checked').each(function () {
					tObj = {
						url: this.value.substring(root.length).split('?')[0],
						label: $(this).attr('jr-label'),
						children: []
					};
				$(this).parents('li[level="2"]').first().find('input[level="3"]:checked').each(function() {
						tObj.children.push({
							url: this.value.substring(root.length).split('?')[0],
							label: $(this).attr('jr-label')
						});
				});
				newObj.articles.push(tObj);
			});
			
			newObj.headingText = $widgetTitle.val();
			
			$('#first-page').slideUp(1000, function () {
				var rdn = Math.floor(Math.random()*101),
					el = $('#nhs-impl');
				$('#second-page').show();
				$('#nhs-head-code').html('&lt;link rel=\"stylesheet\" media=\"screen\" type=\"text/css\" href=\"' + stylesheetPath + '\"&gt;').select();
				$('#nhs-code').html(unescape("&lt;div id=\"nhs-widget-" + rdn + "\"" + (($width.val() === '') ? "" :  "style=\"width:" + (Number($width.val()) || defaultWidth) + "px;\"") + "&gt;&lt;/div&gt;%0A&lt;script type=\"text/javascript\" src=\"http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js\"&gt;&lt;/script&gt;%0A&lt;script type=\"text/javascript\" src=\"" + javaScriptPath + "\"&gt;&lt;/script&gt;%0A&lt;script type=\"text/javascript\"&gt;%0A$(function(){%0A$('#nhs-widget-" + rdn + "').nhsAZWidget(" + $.toJSON(newObj) + ');%0A});\n&lt;/script&gt;')).select();
				el.data('nhsAZWidget', null);
				el.html('').nhsAZWidget(newObj);
			});

			this.blur();
			return false;
		});
		
		$('#back').click(function () {
			$('#second-page').hide();
			$('#first-page').slideDown(1000);
			this.blur();
			return false;
		});
		
		
		$('#popup button').click(function () {
			getData(this.id == 'azBtn' ? azUrl : subjectsUrl, $ul);
			$('#popup ').hide();
		});
	});
}(jQuery, window, document));