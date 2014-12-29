
; /* Start:/bitrix/templates/light/components/bitrix/menu/top_links/script.js*/
function ShowSiteSelectorPopup(bindElement, number)
{
	var ie7 = false;
	/*@cc_on
		 @if (@_jscript_version <= 5.7)
			 ie7 = true;
		/*@end
	@*/
	var offsetLeft = 0;
	var offsetTop =  -17;
	if (ie7 || (document.documentMode && document.documentMode <= 7))
	{
		offsetLeft = -2;
		offsetTop = -19;
	}
	var popup = BX.PopupWindowManager.create("site-selector-popup-" + number, bindElement, {
		content : BX("site-selector-popup-" + number),
		autoHide: true,
		offsetLeft : offsetLeft,
		offsetTop : offsetTop,
		lightShadow: true,
		events : {
			onPopupShow : function()
			{

			}
		}
	});

	popup.show();
	BX.bind(popup.popupContainer, "mouseover", BX.proxy(function() {
		if (this.params._timeoutId)
		{
			clearTimeout(this.params._timeoutId);
			this.params._timeoutId = undefined;
		}

		this.show();
	}, popup));

	BX.bind(popup.popupContainer, "mouseout", BX.proxy(OnOutSiteSelectorPopup, popup));
}

function OnOutSiteSelectorPopup(event)
{
	if (!this.params._timeoutId)
		this.params._timeoutId = setTimeout(BX.proxy(function() { this.close()}, this), 300);
}
/* End */
;
; /* Start:/bitrix/components/bitrix/search.title/script.js*/
function JCTitleSearch(arParams)
{
	var _this = this;

	this.arParams = {
		'AJAX_PAGE': arParams.AJAX_PAGE,
		'CONTAINER_ID': arParams.CONTAINER_ID,
		'INPUT_ID': arParams.INPUT_ID,
		'MIN_QUERY_LEN': parseInt(arParams.MIN_QUERY_LEN)
	};
	if(arParams.WAIT_IMAGE)
		this.arParams.WAIT_IMAGE = arParams.WAIT_IMAGE;
	if(arParams.MIN_QUERY_LEN <= 0)
		arParams.MIN_QUERY_LEN = 1;

	this.cache = [];
	this.cache_key = null;

	this.startText = '';
	this.currentRow = -1;
	this.RESULT = null;
	this.CONTAINER = null;
	this.INPUT = null;
	this.WAIT = null;

	this.ShowResult = function(result)
	{
		var pos = BX.pos(_this.CONTAINER);
		pos.width = pos.right - pos.left;
		_this.RESULT.style.position = 'absolute';
		_this.RESULT.style.top = (pos.bottom + 2) + 'px';
		_this.RESULT.style.left = pos.left + 'px';
		_this.RESULT.style.width = pos.width + 'px';
		if(result != null)
			_this.RESULT.innerHTML = result;

		if(_this.RESULT.innerHTML.length > 0)
			_this.RESULT.style.display = 'block';
		else
			_this.RESULT.style.display = 'none';

		//ajust left column to be an outline
		var th;
		var tbl = BX.findChild(_this.RESULT, {'tag':'table','class':'title-search-result'}, true);
		if(tbl) th = BX.findChild(tbl, {'tag':'th'}, true);
		if(th)
		{
			var tbl_pos = BX.pos(tbl);
			tbl_pos.width = tbl_pos.right - tbl_pos.left;

			var th_pos = BX.pos(th);
			th_pos.width = th_pos.right - th_pos.left;
			th.style.width = th_pos.width + 'px';

			_this.RESULT.style.width = (pos.width + th_pos.width) + 'px';

			//Move table to left by width of the first column
			_this.RESULT.style.left = (pos.left - th_pos.width - 1)+ 'px';

			//Shrink table when it's too wide
			if((tbl_pos.width - th_pos.width) > pos.width)
				_this.RESULT.style.width = (pos.width + th_pos.width -1) + 'px';

			//Check if table is too wide and shrink result div to it's width
			tbl_pos = BX.pos(tbl);
			var res_pos = BX.pos(_this.RESULT);
			if(res_pos.right > tbl_pos.right)
			{
				_this.RESULT.style.width = (tbl_pos.right - tbl_pos.left) + 'px';
			}
		}

		var fade;
		if(tbl) fade = BX.findChild(_this.RESULT, {'class':'title-search-fader'}, true);
		if(fade && th)
		{
			res_pos = BX.pos(_this.RESULT);
			fade.style.left = (res_pos.right - res_pos.left - 18) + 'px';
			fade.style.width = 18 + 'px';
			fade.style.top = 0 + 'px';
			fade.style.height = (res_pos.bottom - res_pos.top) + 'px';
			fade.style.display = 'block';
		}
	}

	this.onKeyPress = function(keyCode)
	{
		var tbl = BX.findChild(_this.RESULT, {'tag':'table','class':'title-search-result'}, true);
		if(!tbl)
			return false;

		var cnt = tbl.rows.length;

		switch (keyCode)
		{
		case 27: // escape key - close search div
			_this.RESULT.style.display = 'none';
			_this.currentRow = -1;
			_this.UnSelectAll();
		return true;

		case 40: // down key - navigate down on search results
			if(_this.RESULT.style.display == 'none')
				_this.RESULT.style.display = 'block';

			var first = -1;
			for(var i = 0; i < cnt; i++)
			{
				if(!BX.findChild(tbl.rows[i], {'class':'title-search-separator'}, true))
				{
					if(first == -1)
						first = i;

					if(_this.currentRow < i)
					{
						_this.currentRow = i;
						break;
					}
					else if(tbl.rows[i].className == 'title-search-selected')
					{
						tbl.rows[i].className = '';
					}
				}
			}

			if(i == cnt && _this.currentRow != i)
				_this.currentRow = first;

			tbl.rows[_this.currentRow].className = 'title-search-selected';
		return true;

		case 38: // up key - navigate up on search results
			if(_this.RESULT.style.display == 'none')
				_this.RESULT.style.display = 'block';

			var last = -1;
			for(var i = cnt-1; i >= 0; i--)
			{
				if(!BX.findChild(tbl.rows[i], {'class':'title-search-separator'}, true))
				{
					if(last == -1)
						last = i;

					if(_this.currentRow > i)
					{
						_this.currentRow = i;
						break;
					}
					else if(tbl.rows[i].className == 'title-search-selected')
					{
						tbl.rows[i].className = '';
					}
				}
			}

			if(i < 0 && _this.currentRow != i)
				_this.currentRow = last;

			tbl.rows[_this.currentRow].className = 'title-search-selected';
		return true;

		case 13: // enter key - choose current search result
			if(_this.RESULT.style.display == 'block')
			{
				for(var i = 0; i < cnt; i++)
				{
					if(_this.currentRow == i)
					{
						if(!BX.findChild(tbl.rows[i], {'class':'title-search-separator'}, true))
						{
							var a = BX.findChild(tbl.rows[i], {'tag':'a'}, true);
							if(a)
							{
								window.location = a.href;
								return true;
							}
						}
					}
				}
			}
		return false;
		}

		return false;
	}

	this.onTimeout = function()
	{
		_this.onChange(function(){
			setTimeout(_this.onTimeout, 500);
		});
	}

	this.onChange = function(callback)
	{
		if(_this.INPUT.value != _this.oldValue && _this.INPUT.value != _this.startText)
		{
			_this.oldValue = _this.INPUT.value;
			if(_this.INPUT.value.length >= _this.arParams.MIN_QUERY_LEN)
			{
				_this.cache_key = _this.arParams.INPUT_ID + '|' + _this.INPUT.value;
				if(_this.cache[_this.cache_key] == null)
				{
					if(_this.WAIT)
					{
						var pos = BX.pos(_this.INPUT);
						var height = (pos.bottom - pos.top)-2;
						_this.WAIT.style.top = (pos.top+1) + 'px';
						_this.WAIT.style.height = height + 'px';
						_this.WAIT.style.width = height + 'px';
						_this.WAIT.style.left = (pos.right - height + 2) + 'px';
						_this.WAIT.style.display = 'block';
					}

					BX.ajax.post(
						_this.arParams.AJAX_PAGE,
						{
							'ajax_call':'y',
							'INPUT_ID':_this.arParams.INPUT_ID,
							'q':_this.INPUT.value,
							'l':_this.arParams.MIN_QUERY_LEN
						},
						function(result)
						{
							_this.cache[_this.cache_key] = result;
							_this.ShowResult(result);
							_this.currentRow = -1;
							_this.EnableMouseEvents();
							if(_this.WAIT)
								_this.WAIT.style.display = 'none';
							if (!!callback)
								callback();
						}
					);
					return;
				}
				else
				{
					_this.ShowResult(_this.cache[_this.cache_key]);
					_this.currentRow = -1;
					_this.EnableMouseEvents();
				}
			}
			else
			{
				_this.RESULT.style.display = 'none';
				_this.currentRow = -1;
				_this.UnSelectAll();
			}
		}
		if (!!callback)
			callback();
	}

	this.UnSelectAll = function()
	{
		var tbl = BX.findChild(_this.RESULT, {'tag':'table','class':'title-search-result'}, true);
		if(tbl)
		{
			var cnt = tbl.rows.length;
			for(var i = 0; i < cnt; i++)
				tbl.rows[i].className = '';
		}
	}

	this.EnableMouseEvents = function()
	{
		var tbl = BX.findChild(_this.RESULT, {'tag':'table','class':'title-search-result'}, true);
		if(tbl)
		{
			var cnt = tbl.rows.length;
			for(var i = 0; i < cnt; i++)
				if(!BX.findChild(tbl.rows[i], {'class':'title-search-separator'}, true))
				{
					tbl.rows[i].id = 'row_' + i;
					tbl.rows[i].onmouseover = function (e) {
						if(_this.currentRow != this.id.substr(4))
						{
							_this.UnSelectAll();
							this.className = 'title-search-selected';
							_this.currentRow = this.id.substr(4);
						}
					};
					tbl.rows[i].onmouseout = function (e) {
						this.className = '';
						_this.currentRow = -1;
					};
				}
		}
	}

	this.onFocusLost = function(hide)
	{
		setTimeout(function(){_this.RESULT.style.display = 'none';}, 250);
	}

	this.onFocusGain = function()
	{
		if(_this.RESULT.innerHTML.length)
			_this.ShowResult();
	}

	this.onKeyDown = function(e)
	{
		if(!e)
			e = window.event;

		if (_this.RESULT.style.display == 'block')
		{
			if(_this.onKeyPress(e.keyCode))
				return BX.PreventDefault(e);
		}
	}

	this.Init = function()
	{
		this.CONTAINER = document.getElementById(this.arParams.CONTAINER_ID);
		this.RESULT = document.body.appendChild(document.createElement("DIV"));
		this.RESULT.className = 'title-search-result';
		this.INPUT = document.getElementById(this.arParams.INPUT_ID);
		this.startText = this.oldValue = this.INPUT.value;
		BX.bind(this.INPUT, 'focus', function() {_this.onFocusGain()});
		BX.bind(this.INPUT, 'blur', function() {_this.onFocusLost()});

		if(BX.browser.IsSafari() || BX.browser.IsIE())
			this.INPUT.onkeydown = this.onKeyDown;
		else
			this.INPUT.onkeypress = this.onKeyDown;

		if(this.arParams.WAIT_IMAGE)
		{
			this.WAIT = document.body.appendChild(document.createElement("DIV"));
			this.WAIT.style.backgroundImage = "url('" + this.arParams.WAIT_IMAGE + "')";
			if(!BX.browser.IsIE())
				this.WAIT.style.backgroundRepeat = 'none';
			this.WAIT.style.display = 'none';
			this.WAIT.style.position = 'absolute';
			this.WAIT.style.zIndex = '1100';
		}

		BX.bind(this.INPUT, 'bxchange', function() {_this.onChange()});
	}

	BX.ready(function (){_this.Init(arParams)});
}

/* End */
;
; /* Start:/bitrix/templates/light/components/bitrix/menu/horizontal_multilevel/script.js*/
(function(window) {

if (!window.BX || BX.PortalTopMenu)
	return;

BX.PortalTopMenu = {
	items : {},
	idCnt : 1,
	currentItem : null,
	touchMode : false,

	getItem : function(item)
	{
		if (!BX.type.isDomNode(item))
			return null;

		var id = !item.id || !BX.type.isNotEmptyString(item.id) ? (item.id = "root-menu-item-" + this.idCnt++) : item.id;

		if (!this.items[id])
			this.items[id] = new PortalTopMenuItem(item);

		return this.items[id];
	},

	itemOver : function(item, forceTouchMode)
	{
		if (forceTouchMode !== true && this.touchMode)
			return;

		var menuItem = this.getItem(item);
		if (!menuItem)
			return false;

		if (this.currentItem && this.currentItem != menuItem)
		{
			this.currentItem.__itemOut();
		}

		this.currentItem = menuItem;
		menuItem.itemOver();
	},

	itemOut : function(item)
	{
		var menuItem = this.getItem(item);
		if (menuItem)
		{
			menuItem.itemOut();
			this.currentItem = null;
		}
	},

	itemTouchStart : function(item, event)
	{
		if (!this.touchMode)
		{
			BX.bind(document, "touchstart", BX.proxy(this.closeCurrentItem, this));
		}

		this.touchMode = true;
		BX.eventCancelBubble(event);
	},

	itemOnclick : function(item, event)
	{
		if (!this.touchMode)
			return;

		var menuItem = this.getItem(item);
		if (this.currentItem != menuItem)
		{
			this.itemOver(item, true);
			BX.PreventDefault(event);
		}
	},

	closeCurrentItem : function()
	{
		if (this.currentItem)
		{
			this.currentItem.itemOut();
			this.currentItem = null;
		}
	}
};


var PortalTopMenuItem = function(item)
{
	this.element = item;
	this.submenu = BX.findChild(item, { className: "submenu" }, true);
	this.timeoutId = null;
	if (this.submenu)
	{
		BX("top-menu-layout", true).appendChild(
			this.submenu.parentNode.removeChild(this.submenu)
		);

		BX.bind(this.submenu, "mouseover", BX.proxy(this.itemOver, this));
		BX.bind(this.submenu, "mouseout", BX.proxy(this.itemOut, this));
		BX.bind(this.submenu, "touchstart", function(event) {
			event = event || window.event;
			BX.eventCancelBubble(event)
		});
	}
};

PortalTopMenuItem.prototype.itemOver = function()
{
	if (this.timeoutId)
		clearTimeout(this.timeoutId);

	if (this.submenu && this.submenu.style.display != "block")
	{
		BX.addClass(this.element, "hover");
		this.adjustPosition();
	}
};

PortalTopMenuItem.prototype.itemOut = function()
{
	this.timeoutId = setTimeout(BX.proxy(this.__itemOut, this), 0);
};

PortalTopMenuItem.prototype.__itemOut = function()
{
	BX.removeClass(this.element, "hover");
	if (this.submenu)
		this.submenu.style.display = "none";
};

PortalTopMenuItem.prototype.adjustPosition = function()
{
	if (!this.submenu)
		return;

	var left = 0;
	var pos = BX.pos(this.element, true);
	var offsetWidth = this.getSubmenuWidth();
	if ((pos.left + offsetWidth + 42) > BX.GetWindowInnerSize().innerWidth)
	{
		left = pos.left - offsetWidth + pos.width + 12;
		BX.addClass(this.submenu, "submenu-rtl");
	}
	else
	{
		left = pos.left;
		BX.removeClass(this.submenu, "submenu-rtl");
	}

	BX.adjust(this.submenu, {
		style: {
			position: "absolute",
			top: pos.bottom + "px",
			left: left + "px",
			display: "block",
			zIndex: 1000
		}
	});
};

PortalTopMenuItem.prototype.getSubmenuWidth = function()
{
	var offsetWidth = BX.hasClass(this.submenu, "submenu-two-columns") ? 400 : 220;
	if (this.element.offsetWidth > offsetWidth - 8)
	{
		offsetWidth = this.element.offsetWidth + 50;
		this.submenu.style.width = this.submenu.style.maxWidth = offsetWidth + "px";
	}
	else
	{
		this.submenu.style.width = "";
		this.submenu.style.maxWidth = "400px";
	}

	return offsetWidth;
};

})(window);
/* End */
;; /* /bitrix/templates/light/components/bitrix/menu/top_links/script.js*/
; /* /bitrix/components/bitrix/search.title/script.js*/
; /* /bitrix/templates/light/components/bitrix/menu/horizontal_multilevel/script.js*/
