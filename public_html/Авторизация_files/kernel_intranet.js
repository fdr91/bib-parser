; /* /bitrix/js/intranet/structure.js*/
; /* /bitrix/js/intranet/outlook.js*/
; /* /bitrix/js/intranet/core_planner.js*/

; /* Start:/bitrix/js/intranet/core_planner.js*/
;(function(){

if(!!window.BX.CPlanner)
	return;

var BX = window.BX,
	planner_access_point = '/bitrix/tools/intranet_planner.php';

BX.planner_query = function(url, action, data, callback, bForce)
{
	if (BX.type.isFunction(data))
	{
		callback = data;data = {};
	}

	var query_data = {
		'method': 'POST',
		'dataType': 'json',
		'url': (url||planner_access_point) + '?action=' + action + '&site_id=' + BX.message('SITE_ID') + '&sessid=' + BX.bitrix_sessid(),
		'data':  BX.ajax.prepareData(data),
		'onsuccess': function(data) {
			if(!!callback)
			{
				callback(data, action)
			}

			BX.onCustomEvent('onPlannerQueryResult', [data, action]);
		},
		'onfailure': function(type, e) {
			if (e && e.type == 'json_failure')
			{
				(new BX.PopupWindow('planner_failure_' + Math.random(), null, {
					content: BX.create('DIV', {
						style: {width: '300px'},
						html: BX.message('JS_CORE_PL_ERROR') + '<br /><br /><small>' + BX.util.strip_tags(e.data) + '</small>'
					}),
					buttons: [
						new BX.PopupWindowButton({
							text : BX.message('JS_CORE_WINDOW_CLOSE'),
							className : "popup-window-button-decline",
							events : {
								click : function() {this.popupWindow.close()}
							}
						})
					]
				})).show();
			}
		}
	};

	return BX.ajax(query_data);
};

BX.CPlanner = function(DATA)
{
	this.DATA = DATA;
	this.DIV = null;
	this.DIV_ADDITIONAL = null;
	this.WND = null;

	BX.addCustomEvent('onGlobalPlannerDataRecieved', BX.delegate(this.onPlannerBroadcastRecieved, this));
	BX.onCustomEvent('onPlannerInit', [this, this.DATA]);
};

BX.CPlanner.prototype.onPlannerBroadcastRecieved = function(DATA)
{
	this.DATA = DATA;
	BX.onCustomEvent(this, 'onPlannerDataRecieved', [this, this.DATA]);
}

BX.CPlanner.prototype.draw = function()
{
	if(!this.DIV)
	{
		this.DIV = BX.create('DIV', {props: {className: 'bx-planner-content'}});
	}

	BX.onGlobalCustomEvent('onGlobalPlannerDataRecieved', [this.DATA]);

	return this.DIV;
};

BX.CPlanner.prototype.drawAdditional = function()
{
	if(!this.DIV_ADDITIONAL)
	{
		this.DIV_ADDITIONAL = BX.create('DIV', {style: {minHeight: 0}});
	}

	return this.DIV_ADDITIONAL;
};

BX.CPlanner.prototype.addBlock = function(block, sort)
{
	if(!block||!BX.type.isElementNode(block))
	{
		return;
	}

	block.bxsort = parseInt(sort)||100;

	if(!!block.parentNode)
	{
		block.parentNode.removeChild(block);
	}

	var el = this.DIV.firstChild;
	while(el)
	{
		if(el == block)
			break;

		if(!!el.bxsort&&el.bxsort>block.bxsort)
		{
			this.DIV.insertBefore(block, el);
			break;
		}
		el = el.nextSibling;
	}

	if(!block.parentNode||!BX.type.isElementNode(block.parentNode)) // 2nd case is for IE8
	{
		this.DIV.appendChild(block);
	}
};

BX.CPlanner.prototype.addAdditional = function(block)
{
	this.drawAdditional().appendChild(block);
};

BX.CPlanner.prototype.update = function(data)
{
	if(!!data)
	{
		this.DATA = data;
		this.draw();
	}
	else
	{
		this.query('update');
	}
};

BX.CPlanner.prototype.query = function(action, data)
{
	return BX.planner_query(planner_access_point, action, data, BX.proxy(this.update, this));
};

BX.CPlanner.query = function(action, data)
{
	return BX.planner_query(planner_access_point, action, data);
};

})();

/* End */
;
; /* Start:/bitrix/js/intranet/outlook.js*/
var jsOutlookUtils = {
	encode: function(str)
	{
		var
			i, len = str.length, cur_chr, cur_chr_code,
			out = "",
			bUnicode = false,
			symb_escape = "&\\[]|";
		for (i = 0; i < len; i++)
		{
			cur_chr = str.charAt(i);
			cur_chr_code = cur_chr.charCodeAt(0);

			if (bUnicode && cur_chr_code <= 0x7F) { out += "]"; bUnicode = false; }
			if (!bUnicode && cur_chr_code > 0x7F) { out += "["; bUnicode = true; }

			if (symb_escape.indexOf(cur_chr) >= 0)
				out += "|";

			if (
				(cur_chr_code >= 0x61 && cur_chr_code <= 0x7A)
				||
				(cur_chr_code >= 0x41 && cur_chr_code <= 0x5A)
				||
				(cur_chr_code >= 0x30 && cur_chr_code <= 0x39)
			)
				out += cur_chr;
			else if (cur_chr_code <= 0x0F)
				out += "%0" + cur_chr_code.toString(16).toUpperCase();
			else if (cur_chr_code <= 0x7F)
				out += "%" + cur_chr_code.toString(16).toUpperCase();
			else if (cur_chr_code <= 0x00FF)
				out += "00" + cur_chr_code.toString(16).toUpperCase();
			else if (cur_chr_code <= 0x0FFF)
				out += "0" + cur_chr_code.toString(16).toUpperCase();
			else
				out += cur_chr_code.toString(16).toUpperCase();
		}

		if (bUnicode)
			out += "]";

		return out;
	},

	Sync: function(type, base_url, list_url, list_prefix, list_name, guid)
	{
		var
			maxLinkLen = 500,
			maxNameLen = 20;

		base_url = ((window.location.protocol!="http:")?(window.location.protocol + "//" + window.location.host):"http://portal.biocad.ru:8080") + base_url;
		guid = guid.replace(/{/g, '%7B').replace(/}/g, '%7D').replace(/-/g, '%2D');

		var link = "stssync://sts/?ver=1.1"
			+ "&type=" + type
			+ "&cmd=add-folder"
			+ "&base-url=" + jsOutlookUtils.encode(base_url)
			+ "&list-url=" + jsOutlookUtils.encode(list_url)
			+ "&guid=" + guid;

		var names = "&site-name=" + jsOutlookUtils.encode(list_prefix) + "&list-name=" + jsOutlookUtils.encode(list_name);

		if (
			link.length + names.length > maxLinkLen
			&&
			(list_prefix.length > maxNameLen || list_name.length > maxNameLen)
		)
		{
			if (list_prefix.length > maxNameLen)
				list_prefix = list_prefix.substring(0, maxNameLen-1) + "...";
			if (list_name.length > maxNameLen)
				list_name = list_name.substring(0, maxNameLen-1) + "...";

			names = "&site-name=" + jsOutlookUtils.encode(list_prefix) + "&list-name=" + jsOutlookUtils.encode(list_name);
		}

		link += names;

		try {window.location.href = link;}
		catch (e) {}
	}
}
/* End */
;
; /* Start:/bitrix/js/intranet/structure.js*/
;(function(){

if (!!BX.IntranetStructure)
	return;

BX.IntranetStructure =
{
	bInit: false,
	popup: null,
	arParams: {}
}

BX.IntranetStructure.Init = function(arParams)
{
	if(arParams)
		BX.IntranetStructure.arParams = arParams;

	if(BX.IntranetStructure.bInit)
		return;

	BX.IntranetStructure.bInit = true;

	BX.ready(BX.delegate(function()
	{
		BX.IntranetStructure.popup = BX.PopupWindowManager.create("BXStructure", null, {
			autoHide: false,
			zIndex: 0,
			offsetLeft: 0,
			offsetTop: 0,
			draggable: {restrict:true},
			closeByEsc: true,
			titleBar: {content: BX.create("span", {html: BX.message('INTR_STRUCTURE_TITLE' + (arParams['UF_DEPARTMENT_ID'] > 0 ? '_EDIT' : ''))})},
			closeIcon: { right : "12px", top : "10px"},
			buttons: [
				new BX.PopupWindowButton({
					text : BX.message('INTR_STRUCTURE_BUTTON'),
					className : "popup-window-button-accept",
					events : { click : function()
					{
						var form = BX('STRUCTURE_FORM');
						handler = BX.delegate(function(result) {
							if (result == "close")
							{
								BX.IntranetStructure.popup.close();
								if (window.BXSTRUCTURECALLBACK)
									window.BXSTRUCTURECALLBACK.apply(BX.IntranetStructure.popup, [result])
								else
									BX.reload();
							}
							else if (/^error:/.test(result))
							{
								var obErrors = BX.create('DIV', {
									html: '<div class="webform-round-corners webform-error-block" style="margin-top:5px" id="error">\
												<div class="webform-corners-top"><div class="webform-left-corner"></div><div class="webform-right-corner"></div></div>\
												<div class="webform-content">\
													<ul class="webform-error-list">'+result.substring(6, result.length)+'</ul>\
												</div>\
												<div class="webform-corners-bottom"><div class="webform-left-corner"></div><div class="webform-right-corner"></div></div>\
											</div>'
								})

								if (BX.findChild(BX.IntranetStructure.popup.contentContainer, {className: 'webform-error-block'}, true))
								{
									BX.IntranetStructure.popup.contentContainer.replaceChild(obErrors, BX.IntranetStructure.popup.contentContainer.firstChild);
								}
								else
								{
									BX.IntranetStructure.popup.contentContainer.insertBefore(obErrors, BX.IntranetStructure.popup.contentContainer.firstChild);
								}

							}
							else
							{
								BX.IntranetStructure.popup.setContent(result);
								if (window.BXSTRUCTURECALLBACK)
									window.BXSTRUCTURECALLBACK.apply(BX.IntranetStructure.popup, [result])
							}
						});
						if(form)
						{
							if (!form.reload)
							{
								BX.ajax.submit(form, handler);
							}
							else
							{
								BX.ajax.get(form.action, handler);
							}
						}
					}}
				}),

				new BX.PopupWindowButtonLink({
					text: BX.message('INTR_CLOSE_BUTTON'),
					className: "popup-window-button-link-cancel",
					events: { click : function()
					{
						this.popupWindow.close();
					}}
				})
			],
			content: '<div style="width:450px;height:230px"></div>',
			events: {
				onAfterPopupShow: function()
				{
					this.setContent('<div style="width:450px;height:230px" id="intr_struct_load">'+BX.message('INTR_LOADING')+'</div>');
					BX.ajax.post(
						'/bitrix/tools/intranet_structure.php',
						{
							lang: BX.message('LANGUAGE_ID'),
							site_id: BX.message('SITE_ID') || '',
							arParams: BX.IntranetStructure.arParams
						},
						BX.delegate(function(result)
						{
							this.setContent(result);
						},
						this)
					);
				}
			}
		});
	}, this));
}

BX.IntranetStructure.ShowForm = function(arParams)
{
	BX.IntranetStructure.Init(arParams);
	BX.IntranetStructure.popup.params.zIndex = (BX.WindowManager? BX.WindowManager.GetZIndex() : 0);
	BX.IntranetStructure.popup.show();
}


})();
/* End */
;