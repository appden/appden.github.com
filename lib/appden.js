
/***** APPDEN CONFIGURATION *****/

var AppDen = {
	shjs : '/lib/shjs/sh_main.js',
	shjs_css : '/lib/shjs/css/sh_rand01.css',
	shjs_lang : '/lib/shjs/lang/'
};

// remove beginning slash for static page testing and set site mode
if (location.hostname == 'localhost')
	AppDen.dev = true;
else
	AppDen.live = true;


/***** UTILITY FUNCTIONS *****/

// same $extend, but takes any number of objects as arguments
function $extend(target) {
	target = target || {};
	for (var i = 1, l = arguments.length; i < l; i++) {
		for (var key in (arguments[i] || {})) target[key] = arguments[i][key];
	}
	return target;
};

// element creation shortcut
function $E(tag, props) {
	if (typeof props == 'string')
		props = { style : props };
	if (typeof tag == 'string') {
		var id = tag.match(/#([\w-]+)/);
		var classes = tag.match(/(?:\.[\w-]+)+/);
		tag = tag.replace(/[#.].*/, '');
		props = props || {};
		if (id) props.id = id[1];
		if (classes) props['class'] = classes[0].replace(/\./g, ' ');
	}
	return new Element(tag || 'div', props);
};


/***** CLASS MUTATORS *****/

Class.Mutators.BindAll = function(bool) {
	if (!bool) return;
	var init = this.initialize;
	var exclude = arguments.callee.exclude;
	
	this.initialize = function() {
		for (var method in this) {
			if (typeof this[method] != 'function' || exclude.contains(method))
				continue;
			
			var unbound = this[method];
			this[method] = unbound.bind(this);
			
		}
		return init ? init.apply(this, arguments) : this;
	};
};

Class.Mutators.BindAll.exclude = ['constructor', 'initialize', 'parent'];


/***** EVENTS *****/

Native.implement([Element, Window, Document], {
	addKey : function(combo, fn) {
		var keys = this.retrieve('events:keys', {});
		if (keys[combo]) this.removeKey(combo);		// one shortcut at a time
		
		var mods = combo.split('+');
		var key = mods.pop();
		
		keys[combo] = function(event) {
			for (var i = mods.length; i--; ) if (!event[mods[i]]) return;
			if (event.key == key || event.code == key)
				return fn.apply(this, arguments);
		};
		
		return this.addEvent('keyup', keys[combo]);
	},
	
	addKeys : function(keys) {
		for (var combo in keys) this.addKey(combo, keys[combo]);
		return this;
	},
	
	removeKey : function() {
		var keys = this.retrieve('events:keys', {});
		
		Array.flatten(arguments).each(function(combo) {
			if (!keys[combo]) return;
			this.removeEvent('keyup', keys[combo]);
			delete keys[combo];
		}, this);
		
		return this;
	},
	
	oneKey : function(combo, fn) {
		return this.addKey(combo, function() {
			return fn.apply(this.removeKey(combo), arguments);
		});
	}
});

// DevThought
// http://devthought.com/tumble/2009/04/determine-if-caps-lock-is-on-with-mootools/
Event.implement({
   hasCapsLock: function(){
	  return ((this.code > 64 && this.code < 91 && !this.shift) 
		   || (this.code > 96 && this.code < 123 && this.shift));
   }
});

// add some keycodes
Event.Keys.extend({
	'pageup' : 33,
	'pagedown' : 34,
	'end' : 35,
	'home' : 36,
	'capslock' : 20,
	'numlock' : 144,
	'scrolllock' : 145
});

Native.implement([Element, Window, Document, Events], {
	oneEvent : function(type, fn) {
		return this.addEvent(type, function() {
			this.removeEvent(type, arguments.callee);
			return fn.apply(this, arguments);
		});
		
	}
});


/***** INITIALIZATION *****/

window.addEvents({
	domready : function() {
		
		// initialize the Nav
		var nav = new Nav('nav');
		
		// highlight code fragments
		var code = $$('pre > code[class]');
		if (code.length) {
			code.each(function(item) {
				var pre = item.getParent().addClass('sh_' + item.get('class'));
				var contents = pre.get('html').replace(/<\/?code.*?>/gi, '').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
				pre.set('text', contents);
			});
			
			// dynamically load SHJS assets
			new Asset.css(AppDen.shjs_css);
			new Asset.javascript(AppDen.shjs, {
				onload : function() {
					sh_highlightDocument(AppDen.shjs_lang, '.js');
				}
			});
		}
		
		// hide comments if there are none
		var comments = $('comments');
		if (comments && !comments.getElement('.comment'))
			comments.hide();
		
		// create comment form object
		var form = $('comment-form');
		if (form) new CommentForm(form);
		
		// put placeholder text on the search box
		var search = $('search');
		if (search) search.placeholders();
		
		// convert e-mail addresses (Safari 4 broke Elements methods)
		$$('a[href^=mailto:]').each(function(el){
			el.makeEmail();
		});
		
		// convert footnote links
		var links = $$('#alpha a');
		links.each(function(link) {
			if (link.href.test(/#fn\d+$/))
				link.href = link.href.replace(/.+(?=#fn)/, '');
		});
		
		// smooth scroll
		new Fx.SmoothScroll({
		    links: links,
		    wheelStops: false,
		    offset : { y : -10 }
		});
	},
	
	load : function() {
		
		if (!AppDen.live) return;
		
		// Google Analytics
		new Asset.javascript('http://www.google-analytics.com/ga.js', {
			onload : function() {
				try {
					var pageTracker = _gat._getTracker('UA-4604812-1');
					pageTracker._trackPageview();
				} catch(e) {}
			}
		});
	}
});


/***** CLASSES *****/

var Nav = new Class({
	initialize : function(nav) {
		nav = $(nav);
		var timer, open;
		var active = { length : 0 };
		var loc = location.pathname;
		
		function check(li) {
			var link = li.getFirst('a');
			var path = link.get('relative');
			if (path && loc.indexOf(path) == 0 && path.length > active.length) {
				active.link = link;
				active.length = path.length;
			}
		}
		
		nav.getChildren('li').each(function(section) {
			check(section);
			var list = section.getElement('ul');
			if (!list) return;
			
			list.fade('hide');
			var left, links = list.getElements('li');
			links.each(check);
			
			section.addEvents({
				'mouseenter' : function() {
					$clear(timer);
					if (list == open) return;
					
					close();
					open = list.show();
					if (!$chk(left)) left = list.getStyle('left').toInt();
					
					list.morph({
						opacity : 1,
						left : [left - 5, left]
					});
					links.fade('hide');
					
					var i = 0, wave = (function() {
						if (links[i]) links[i++].fade('in');
						else $clear(wave);
					}).periodical(100);
				},
				'mouseleave' : function() {
					if (section != active.section)
						timer = rest.delay(500);
				}
			});
		});
		
		if (active.link) {
			active.link.addClass('active');
			var list = active.link.getParent('ul');
			if (list != nav) {
				active.section = list.getParent('li');
				rest();
			}
		}
		
		function rest() {
			if (active.section)
				active.section.fireEvent('mouseenter');
			else {
				close();
				open = null;
			}
		}
		
		function close() {
			if (open) open.fade('out', open.hide.bind(open));
		}
	}
});

var CommentForm = new Class({
	Implements : Options,
	Binds : ['formcheck', 'uvumi', 'submit'],
	
	options : {
		rules : {
			author : ['required', 'alphanum', 'length[2,20]'],
			email : ['required', 'email'],
			url : 'url',
			text : 'required',
			captcha_code : ['required', 'alphanum']
		},
		formcheck : {
			trimValue : true,
			fieldErrorClass : 'invalid',
			display : {
				addClassErrorToField : 1,
				tipsOffsetY : 5
			},
			regexp : {
				email : /^[a-z0-9._%-+]+@[a-z0-9][a-z0-9.-]+\.[a-z]{2,4}$/i
			},
			submitByAjax : true
		}
	},
	
	initialize : function(form, options) {
		this.setOptions(options);
		this.form = $(form);
		this.form.reset();
		this.inputs = this.form.getElements('input[type=text], textarea').placeholder();
		
		// submit on enter from catpcha and cliking on submit
		this.form.captcha_code.addKey('enter', this.submit);
		this.form.getElement('.submit').addEvent('click', this.submit);
		
		// dynamically load FormCheck and Uvumi assets
		new Asset.css(AppDen.formcheck_css);
		new Asset.javascript(AppDen.formcheck, {
			onload : this.formcheck
		});
		new Asset.javascript(AppDen.uvumi, {
			onload : this.uvumi
		});
	},
	
	uvumi : function() {
		new UvumiTextarea({
			selector : this.form.text,
			maxChar : 0
		});
	},
	
	formcheck : function() {
		var self = this, spinner = this.form.show().getElement('.spinner');
		
		// add validation classes
		for (var input in this.options.rules)
			this.form[input].addRules(this.options.rules[input]);
		
		this.formcheck = new FormCheck(this.form, $extend(this.options.formcheck, {
			onAjaxRequest : function() {
				spinner.show();
			},
			onAjaxFailure : function() {},
			onAjaxSuccess : function(response) {
				spinner.hide();
				
				if (response.test(/Comment Submission Error/i))
					self.error('captcha');
				else {				
					self.create();
					self.form.getChildren('div').set('text', 'Thanks for your comment!');
				}
			}
		}));
		
		// preload tooltip
		var tip = $E('div.ft-tbx', 'position: absolute; left: -1000px;').inject(document.body).adopt(this.formcheck.makeTips([]));
	},
	
	submit : function(event) {
		event.stop();
		this.inputs.placeholder(false).sanitize();
		
		// make sure URLs starts with http://
		this.form.url.value = this.form.url.value.makeURLs();
		this.form.text.value = this.form.text.value.makeURLs();
		
		this.form.fireEvent('submit', event);
	},

	create : function() {
		var comment = $E('div.comment').adopt(
			$E('div.comment-info', {
				'html' : '/* <span class="comment-author">' + 
						 	(this.form.url.value ?
						 		'<a href="' + this.form.url.value + '">' + this.form.author.value + '</a>' : 
						 		this.form.author.value) +
						 ' says...</span> */ <span class="comment-date">Just now</span>'
			}),
			$E('div.comment-contents', {
				'html' : this.form.text.value.replace(/\n/g, '<br />')
			})
		).inject($('comments').show());
		
		// increment comment counter
		var count = $$('.entry-footer a[href$=comments]')[0];
		if (count) count.set('text', count.get('text').toInt() + 1);

		// scroll to new comment
		new Fx.Scroll(window, {
			offset : { y : -10 }
		}).toElement(comment);
	},
	
	error : function(type) {
		switch(type) {
			case 'captcha':
				this.form.captcha_code.addClass('invalid');
		}
	}
});


/***** NATIVE EXTENSIONS *****/

Element.Properties.relative = {get: function() {
	return (!this.href) ? null : this.href.replace(new RegExp('^' + document.location.protocol + '\/\/' + document.location.host), '');
}};

Element.implement({
	
	makeEmail : function() {
		var matches = this.get('href').match(/mailto:(.+)-at-dot(\w+)-after-(\S+)/i);
		if (matches) this.set('href', 'mailto:' + matches[1] + '@' + matches[3] + '.' + matches[2]);
		return this;
	},
	
	sanitize : function() {
		return this.set('value', this.get('value').stripScripts().tidy());
	},
	
	addRules : function() {
		return this.addClass("validate['" + Array.flatten(arguments).join("','") + "']");
	},
	
	placeholder : function(value) {
		if (value === false)
			return this.fireEvent('focus');
		
		value = value || this.defaultValue;
		
		return this.addClass('placeholder').addEvents({
			focus : function() {
				if (this.value == value) this.removeClass('placeholder').value = '';
			},
			blur : function() {
				this.value = this.value.trim();
				if (!this.value) this.addClass('placeholder').value = value;
			}
		});
	},
	
	placeholders : function(value) {
		this.getElements('input[type=text], textarea').placeholder(value);
		return this;
	},
	
	// I like my morph and fade more...
	morph : function(props, duration, callback) {
		var fx = this.retrieve('morph');
		
		if (!fx) fx = this.get('morph', {
			link : 'cancel'
		});
		
		if (!callback && typeof duration == 'function') {
			callback = duration;
			duration = null;
		}
		
		fx.options.duration = duration ? Fx.Durations[duration] || duration.toInt() : 500;
		
		if (callback) fx.chain(callback.bind(this));
		fx.start(props);
		return this;
	},
	
	fade : function(how, speed, callback) {
		how = $pick(how, 'toggle');
		switch(how) {
			case 'show': return this.set('opacity', 1);
			case 'hide': return this.set('opacity', 0);
			case 'in': how = 1; break;
			case 'out': how = 0; break;
			case 'toggle': how = (this.get('opacity') == 1) ? 0 : 1; break;
		}
		
		return this.morph({
			opacity : how
		}, speed, callback);
	}
});

String.implement({
	makeURLs : function() {
		return this.replace(/(^|\s)(([a-z0-9][.-]?)+[a-z0-9]\.[a-z]{2,3}(:\d+)?([\/?#][a-z0-9-._?,'+&%$#=~\/\\]*)?)(?=\s|$)/gi, '$1http://$2');
	}
});


