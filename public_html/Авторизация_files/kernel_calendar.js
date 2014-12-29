; /* /bitrix/js/calendar/cal-core.js*/
; /* /bitrix/js/calendar/cal-dialogs.js*/
; /* /bitrix/js/calendar/cal-week.js*/
; /* /bitrix/js/calendar/cal-events.js*/
; /* /bitrix/js/calendar/cal-controlls.js*/
; /* /bitrix/js/calendar/cal-planner.js*/
; /* /bitrix/js/calendar/core_planner_handler.js*/

; /* Start:/bitrix/js/calendar/core_planner_handler.js*/
;(function(){

if(!!window.BX.CCalendarPlannerHandler)
	return;

var BX = window.BX;

BX.CCalendarPlannerHandler = function()
{
	this.PLANNER = null;
	this.EVENTS = null;
	this.EVENTS_LIST = null;
	this.EVENTWND = {};
	this.CLOCK = null;

	BX.addCustomEvent('onPlannerDataRecieved', BX.proxy(this.draw, this));
};

BX.CCalendarPlannerHandler.prototype.draw = function(obPlanner, DATA)
{
	this.PLANNER = obPlanner;

	if(!DATA.CALENDAR_ENABLED)
		return;

	if (!this.EVENTS)
	{
		this.EVENTS = BX.create('DIV');
		this.EVENTS.appendChild(BX.create('DIV', {
			props: {className: 'tm-popup-section tm-popup-section-events'},
			html: '<span class="tm-popup-section-text">' + BX.message('JS_CORE_PL_EVENTS') + '</span>'
		}));

		this.EVENTS.appendChild(BX.create('DIV', {
			props: {className: 'tm-popup-events' + (BX.isAmPmMode() ? " tm-popup-events-ampm" : "")},
			children: [
				(this.EVENTS_LIST = BX.create('DIV', {
					props: {className: 'tm-popup-event-list'}
				})),
				this.drawEventForm(BX.proxy(this._createEventCallback, this))
			]
		}));
	}
	else
	{
		BX.cleanNode(this.EVENTS_LIST);
	}

	if (DATA.EVENTS.length > 0)
	{
		BX.removeClass(this.EVENTS, 'tm-popup-events-empty');
		var LAST_EVENT = null;
		for (var i=0,l=DATA.EVENTS.length;i<l;i++)
		{
			var q = this.EVENTS_LIST.appendChild(this.drawEvent(DATA.EVENTS[i]));

			if (DATA.EVENT_LAST_ID && DATA.EVENT_LAST_ID == DATA.EVENTS[i].ID)
				LAST_EVENT = q;
		}

		if (!!LAST_EVENT)
		{
			BX.defer(function()
			{
				if (LAST_EVENT.offsetTop < this.EVENTS_LIST.scrollTop || LAST_EVENT.offsetTop + LAST_EVENT.offsetHeight > this.EVENTS_LIST.scrollTop + this.EVENTS_LIST.offsetHeight)
				{
					this.EVENTS_LIST.scrollTop = LAST_EVENT.offsetTop - parseInt(this.EVENTS_LIST.offsetHeight/2);
				}
			})();
		}
	}
	else
	{
		BX.addClass(this.EVENTS, 'tm-popup-events-empty');
	}

	obPlanner.addBlock(this.EVENTS, 300);
};

BX.CCalendarPlannerHandler.prototype.drawEvent = function(event, additional_props, fulldate)
{
	additional_props = additional_props || {};
	additional_props.className = 'tm-popup-event-name';
	fulldate = fulldate || false;

	return BX.create('DIV', {
		props: {
			className: 'tm-popup-event',
			bx_event_id: event.ID
		},
		children: [
			BX.create('DIV', {
				props: {className: 'tm-popup-event-datetime'},
				html: '<span class="tm-popup-event-time-start' + (event.DATE_FROM_TODAY ? '' : ' tm-popup-event-time-passed') + '">'+(fulldate?BX.timeman.formatDate(event.DATE_FROM)+' ':'')+ event.TIME_FROM + '</span><span class="tm-popup-event-separator">-</span><span class="tm-popup-event-time-end' + (event.DATE_TO_TODAY ? '' : ' tm-popup-event-time-passed') + '">' +(fulldate?BX.timeman.formatDate(event.DATE_TO)+' ':'')+  event.TIME_TO + '</span>'
			}),
			BX.create('DIV', {
				props: additional_props,
				events: event.ID ? {click: BX.proxy(this.showEvent, this)} : null,
				html: '<span class="tm-popup-event-text">' + BX.util.htmlspecialchars(event.NAME) + '</span>'
			})
		]
	});
};

BX.CCalendarPlannerHandler.prototype.showEvent = function(e)
{
	var event_id = BX.proxy_context.parentNode.bx_event_id;

	if (this.EVENTWND[event_id] && this.EVENTWND[event_id].node != BX.proxy_context)
	{
		this.EVENTWND[event_id].Clear();
		this.EVENTWND[event_id] = null;
	}

	if (!this.EVENTWND[event_id])
	{
		this.EVENTWND[event_id] = new BX.CCalendarPlannerEventPopup({
			planner: this.PLANNER,
			node: BX.proxy_context,
			bind: this.EVENTS.firstChild,
			id: event_id
		});
	}

	BX.onCustomEvent(this, 'onEventWndShow', [this.EVENTWND[event_id]]);

	this.EVENTWND[event_id].Show(this.PLANNER);

	return BX.PreventDefault(e);
};

BX.CCalendarPlannerHandler.prototype.drawEventForm = function(cb)
{
	var mt_format_css = BX.isAmPmMode() ? '_am_pm' : '';

	var handler = BX.delegate(function(e, bEnterPressed)
		{
			inp_Name.value = BX.util.trim(inp_Name.value);
			if (inp_Name.value && inp_Name.value!=BX.message('JS_CORE_PL_EVENTS_ADD'))
			{
				cb({
					from: inp_TimeFrom.value,
					to: inp_TimeTo.value,
					name: inp_Name.value,
					absence: inp_Absence.checked ? 'Y' : 'N'
				});

				BX.timer.start(inp_TimeFrom.bxtimer);
				BX.timer.start(inp_TimeTo.bxtimer);

				if (!bEnterPressed)
				{
					BX.addClass(inp_Name.parentNode, 'tm-popup-event-form-disabled')
					inp_Name.value = BX.message('JS_CORE_PL_EVENTS_ADD');
				}
				else
				{
					inp_Name.value = '';
				}
			}

			return (e || window.event) ? BX.PreventDefault(e) : null;
		}, this),

		handler_name_focus = function()
		{
			BX.removeClass(this.parentNode, 'tm-popup-event-form-disabled');
			if(this.value == BX.message('JS_CORE_PL_EVENTS_ADD'))
				this.value = '';
		};

	var inp_TimeFrom = BX.create('INPUT', {
		props: {type: 'text', className: 'tm-popup-event-start-time-textbox' + mt_format_css}
	});

	inp_TimeFrom.onclick = BX.delegate(function()
	{
		var cb = BX.delegate(function(value) {
			this.CLOCK.closeWnd();

			var oldvalue_From = unFormatTime(inp_TimeFrom.value),
				oldvalue_To = unFormatTime(inp_TimeTo.value);

			var diff = 3600;
			if (oldvalue_From && oldvalue_To)
				diff = oldvalue_To - oldvalue_From;

			BX.timer.stop(inp_TimeFrom.bxtimer);
			BX.timer.stop(inp_TimeTo.bxtimer);

			inp_TimeFrom.value = value;

			inp_TimeTo.value = formatTime(unFormatTime(value) + diff);

			inp_TimeTo.focus();
			inp_TimeTo.onclick();
		}, this);

		if (!this.CLOCK)
		{
			this.CLOCK = new BX.CClockSelector({
				start_time: unFormatTime(inp_TimeFrom.value),
				node: inp_TimeFrom,
				callback: cb
			});
		}
		else
		{
			this.CLOCK.setNode(inp_TimeFrom);
			this.CLOCK.setTime(unFormatTime(inp_TimeFrom.value));
			this.CLOCK.setCallback(cb);
		}

		inp_TimeFrom.blur();
		this.CLOCK.Show();
	}, this);

	inp_TimeFrom.bxtimer = BX.timer(inp_TimeFrom, {dt: 3600000, accuracy: 3600});

	var inp_TimeTo = BX.create('INPUT', {
		props: {type: 'text', className: 'tm-popup-event-end-time-textbox' + mt_format_css}
	});

	inp_TimeTo.onclick = BX.delegate(function()
	{
		var cb = BX.delegate(function(value) {
			this.CLOCK.closeWnd();
			inp_TimeTo.value = value;

			BX.timer.stop(inp_TimeFrom.bxtimer);
			BX.timer.stop(inp_TimeTo.bxtimer);

			inp_Name.focus();
			handler_name_focus.apply(inp_Name);
		}, this);

		if (!this.CLOCK)
		{
			this.CLOCK = new BX.CClockSelector({
				start_time: unFormatTime(inp_TimeTo.value),
				node: inp_TimeTo,
				callback: cb
			});
		}
		else
		{
			this.CLOCK.setNode(inp_TimeTo);
			this.CLOCK.setTime(unFormatTime(inp_TimeTo.value));
			this.CLOCK.setCallback(cb);
		}

		inp_TimeTo.blur();
		this.CLOCK.Show();
	}, this);

	inp_TimeTo.bxtimer = BX.timer(inp_TimeTo, {dt: 7200000, accuracy: 3600});

	var inp_Name = BX.create('INPUT', {
		props: {type: 'text', className: 'tm-popup-event-form-textbox' + mt_format_css, value: BX.message('JS_CORE_PL_EVENTS_ADD')},
		events: {
			keypress: function(e) {
				return (e.keyCode == 13) ? handler(e, true) : true;
			},
			blur: function() {
				if (this.value == '')
				{
					BX.addClass(this.parentNode, 'tm-popup-event-form-disabled');
					this.value = BX.message('JS_CORE_PL_EVENTS_ADD');
				}
			},
			focus: handler_name_focus
		}
	});

	var id = 'bx_tm_absence_' + Math.random();
	var inp_Absence = BX.create('INPUT', {
		props: {type: 'checkbox', className: 'checkbox', id: id}
	});

	this.EVENTS_FORM = BX.create('DIV', {
		props: {className: 'tm-popup-event-form tm-popup-event-form-disabled'},
		children: [
			inp_TimeFrom, inp_TimeTo, inp_Name,
			BX.create('SPAN', {
				props: {className: 'tm-popup-event-form-submit'},
				events: {
					click: handler
				}
			}),
			BX.create('DIV', {
				props: {className:'tm-popup-event-form-options'},
				children: [
					inp_Absence,
					BX.create('LABEL', {props: {htmlFor: id}, text: BX.message('JS_CORE_PL_EVENT_ABSENT')})
				]
			})
		]
	});

	return this.EVENTS_FORM;
};

BX.CCalendarPlannerHandler.prototype._createEventCallback = function(ev)
{
	calendarLastParams = ev;

	this.PLANNER.query('calendar_add', ev);

	this.EVENTS_LIST.appendChild(this.drawEvent({
		DATE_FROM_TODAY: true, DATE_TO_TODAY: true,
		NAME: BX.util.htmlspecialchars(ev.name),
		TIME_FROM: ev.from,
		TIME_TO: ev.to
	}));
};

/**************************/
BX.CCalendarPlannerEventPopup = function(params)
{
	this.params = params;
	this.node = params.node;

	var ie7 = false;
	/*@cc_on
		 @if (@_jscript_version <= 5.7)
			ie7 = true;
		/*@end
	@*/

	this.popup = BX.PopupWindowManager.create('event_' + this.params.id, this.params.bind, {
		closeIcon : {right: "12px", top: "10px"},
		closeByEsc: true,
		offsetLeft : ie7 || (document.documentMode && document.documentMode <= 7) ? -347 : -340,
		autoHide: true,
		bindOptions : {
			forceBindPosition : true,
			forceTop : true
		},
		angle : {
			position: "right",
			offset : this.params.angle_offset || 27
		}
	});

	BX.addCustomEvent(this.parent, 'onEventWndShow', BX.delegate(this.onEventWndShow, this))

	this.bSkipShow = false;
	this.isReady = false;
};

BX.CCalendarPlannerEventPopup.prototype.onEventWndShow = function(wnd)
{
	if (wnd != this)
	{
		if (this.popup)
			this.popup.close();
		else
			this.bSkipShow = true;
	}
};

BX.CCalendarPlannerEventPopup.prototype.Show = function(planner, data)
{
	BX.removeCustomEvent(planner, 'onPlannerDataRecieved', BX.proxy(this.Show, this));

	data = data || this.data;

	if (data && data.error)
		return;

	if (!data)
	{
		BX.addCustomEvent(planner, 'onPlannerDataRecieved', BX.proxy(this.Show, this));
		return planner.query('calendar_show', {id: this.params.id});
	}

	if(data.EVENT)
	{
		data = data.EVENT;
	}

	this.data = data;

	if (this.bSkipShow)
	{
		this.bSkipShow = false;
	}
	else
	{
		this.popup.setContent(this.GetContent());
		this.popup.setButtons(this.GetButtons());

		var offset = 0;
		if (this.params.node && this.params.node.parentNode && this.params.node.parentNode.parentNode)
		{
			offset = this.params.node.parentNode.offsetTop - this.params.node.parentNode.parentNode.scrollTop;
		}

		this.popup.setOffset({offsetTop: this.params.offsetTop || (offset - 20)});
		//popup.setAngle({ offset : 27 });
		this.popup.adjustPosition();
		this.popup.show();
	}

	return true;
};

BX.CCalendarPlannerEventPopup.prototype.GetContent = function()
{
	var html = '<div class="tm-event-popup">',
		hr = '<div class="popup-window-hr"><i></i></div>';

	html += '<div class="tm-popup-title"><a class="tm-popup-title-link" href="' + this.data.URL + '">' + BX.util.htmlspecialchars(this.data.NAME) +'</a></div>';
	if (this.data.DESCRIPTION)
	{
		html += hr + '<div class="tm-event-popup-description">' + this.data.DESCRIPTION + '</div>';
	}

	html += hr;

	html += '<div class="tm-event-popup-time"><div class="tm-event-popup-time-interval">' + this.data.DATE_F + '</div>';
	if (this.data.DATE_F_TO)
		html += '<div class="tm-event-popup-time-hint">(' + this.data.DATE_F_TO + ')</div></div>'


	if (this.data.GUESTS)
	{
		html += hr + '<div class="tm-event-popup-participants">';

		if (this.data.HOST)
		{
			html += '<div class="tm-event-popup-participant"><div class="tm-event-popup-participant-status tm-event-popup-participant-status-accept"></div><div class="tm-event-popup-participant-name"><a class="tm-event-popup-participant-link" href="' + this.data.HOST.url + '">' + this.data.HOST.name + '</a><span class="tm-event-popup-participant-hint">' + BX.message('JS_CORE_PL_EVENT_HOST') + '</span></div></div>';
		}

		if (this.data.GUESTS.length > 0)
		{
			html += '<table cellspacing="0" class="tm-event-popup-participants-grid"><tbody><tr>';

			var d = Math.ceil(this.data.GUESTS.length/2),
				grids = ['',''];

			for (var i=0;i<this.data.GUESTS.length; i++)
			{
				var status = '';
				if (this.data.GUESTS[i].status == 'Y')
					status = 'tm-event-popup-participant-status-accept';
				else if (this.data.GUESTS[i].status == 'N')
					status = 'tm-event-popup-participant-status-decline';

				grids[i<d?0:1] += '<div class="tm-event-popup-participant"><div class="tm-event-popup-participant-status ' + status + '"></div><div class="tm-event-popup-participant-name"><a class="tm-event-popup-participant-link" href="' + this.data.GUESTS[i].url + '">' + this.data.GUESTS[i].name + '</a></div></div>';
			}

			html += '<td class="tm-event-popup-participants-grid-left">' + grids[0] + '</td><td class="tm-event-popup-participants-grid-right">' + grids[1] + '</td>';

			html += '</tr></tbody></table>';

		}

		html += '</div>';
	}

	html += '</div>';

	return html;
};

BX.CCalendarPlannerEventPopup.prototype.GetButtons = function()
{
	var btns = [], q = BX.proxy(this.Query, this);

	if (this.data.STATUS === 'Q')
	{
		btns.push(new BX.PopupWindowButton({
			text : BX.message('JS_CORE_PL_EVENT_CONFIRM'),
			className : "popup-window-button-create",
			events : {
				click: function() {q('CONFIRM=Y');}
			}
		}));
		btns.push(new BX.PopupWindowButton({
			text : BX.message('JS_CORE_PL_EVENT_REJECT'),
			className : "popup-window-button-cancel",
			events : {
				click: function() {q('CONFIRM=N');}
			}
		}));
	}
	else
	{
		btns.push(new BX.PopupWindowButtonLink({
			text : BX.message('JS_CORE_WINDOW_CLOSE'),
			className : "popup-window-button-link-cancel",
			events : {click : function(e) {this.popupWindow.close();return BX.PreventDefault(e);}}
		}));

	}

	return btns;
};

BX.CCalendarPlannerEventPopup.prototype.Clear = function()
{
	if (this.popup)
	{
		this.popup.close();
		this.popup.destroy();
		this.popup = null;
	}

	this.node = null;
};

BX.CCalendarPlannerEventPopup.prototype.Query = function(str)
{
	BX.ajax({
		method: 'GET',
		url: this.data.URL + '&' + str,
		processData: false,
		onsuccess: BX.proxy(this._Query, this)
	});
};

BX.CCalendarPlannerEventPopup.prototype._Query = function()
{
	this.data = null;
	this.Show();
};


function formatTime(time, bSec, bSkipAmPm)
{
	var mt = '';
	if (BX.isAmPmMode() && !bSkipAmPm)
	{
		if (parseInt(time/3600) > 12)
		{
			time = parseInt(time) - 12*3600;
			mt = ' pm';
		}
		else if (parseInt(time/3600) == 12)
		{
			mt = ' pm';
		}
		else if (parseInt(time/3600) == 0)
		{
			time = parseInt(time) + 12*3600;
			mt = ' am';
		}
		else
			mt = ' am';

		if (!!bSec)
			return parseInt(time/3600) + ':' + BX.util.str_pad(parseInt((time%3600)/60), 2, '0', 'left') + ':' + BX.util.str_pad(time%60, 2, '0', 'left') + mt;
		else
			return parseInt(time/3600) + ':' + BX.util.str_pad(parseInt((time%3600)/60), 2, '0', 'left') + mt;
	}
	else
	{
		if (!!bSec)
			return BX.util.str_pad(parseInt(time/3600), 2, '0', 'left') + ':' + BX.util.str_pad(parseInt((time%3600)/60), 2, '0', 'left') + ':' + BX.util.str_pad(time%60, 2, '0', 'left') + mt;
		else
			return BX.util.str_pad(parseInt(time/3600), 2, '0', 'left') + ':' + BX.util.str_pad(parseInt((time%3600)/60), 2, '0', 'left') + mt;
	}
};

function unFormatTime(time)
{
	var q = time.split(/[\s:]+/);
	if (q.length == 3)
	{
		var mt = q[2];
		if (mt == 'pm' && q[0] < 12)
			q[0] = parseInt(q[0], 10) + 12;

		if (mt == 'am' && q[0] == 12)
			q[0] = 0;

	}
	return parseInt(q[0], 10) * 3600 + parseInt(q[1], 10) * 60;
};

new BX.CCalendarPlannerHandler();
})();
/* End */
;
; /* Start:/bitrix/js/calendar/cal-core.js*/
function JCEC(Params) // Javascript Class Event Calendar
{
	this.arConfig = Params;
	top.BXCRES = {};

	// Data
	this.id = Params.id;
	this.pCalCnt = BX(this.id + '_bxcal');
	//this.arEvents = Params.events;
	//this.arAttendees = Params.attendees;
	this.dragDrop = new ECDragDropControl({calendar: this});
	this.arEvents = [];
	this.arAttendees = {};
	this.arSections = Params.sections;
	this.sectionsIds = Params.sectionsIds;
	this.type = Params.type;
	this.bSuperpose = Params.bSuperpose || false;
	this.canAddToSuperpose = Params.canAddToSuperpose;
	this.bTasks = Params.bTasks || false;
	this.userId = Params.userId;
	this.userName = Params.userName;
	this.ownerId = Params.ownerId || false;
	this.sectionControlsDOMId = Params.sectionControlsDOMId;
	this.PERM = Params.perm;
	this.permEx = Params.permEx;
	this.settings = Params.settings;
	this.userSettings = Params.userSettings;
	this.pathToUser = Params.pathToUser;
	this.bIntranet = !!Params.bIntranet;
	this.allowMeetings = !!Params.bSocNet && this.bIntranet;
	this.allowReminders = !!Params.bSocNet && this.bIntranet;
	this.plannerSettings = Params.plannerSettings;
	this.days = Params.days;
	this.showBanner = !!Params.bShowBanner;
	this.bReadOnly = !!Params.readOnly;
	this.bAnonym = !!Params.bAnonym;
	this.startupEvent = Params.startupEvent;
	this.accessColors = Params.accessColors;
	this.initMonth = Params.init_month;
	this.initYear = Params.init_year;
	this.weekHolidays = Params.week_holidays;
	this.yearHolidays = Params.year_holidays;
	this.yearWorkdays = Params.year_workdays;
	this.new_section_access = Params.new_section_access || {};
	this.bExtranet = !!Params.bExtranet;
	this.Colors = Params.arCalColors;
	this.bAMPM = Params.bAMPM;
	this.bWideDate = Params.bWideDate;
	this.weekStart = Params.week_start;
	this.weekDays = Params.week_days;
	this.lastSection = Params.lastSection;

	this.bCalDAV = !!Params.bCalDAV;
	if (this.bCalDAV)
		this.arConnections = Params.connections;

	// Init vars
	this.arSectionsInd = {};
	this.oActiveSections = {};
	this.dayHeight = 100;
	this.darkColor = '#E6E6E6';
	this.brightColor = '#000000';
	this.arMenuItems = {};
	this.newEventUF = {};

	// Access names
	this.arNames = {};
	this.HandleAccessNames(Params.accessNames);

	var ind, sectId, isGoogle, i, sect;
	for (ind in this.arSections)
	{
		sect = this.arSections[ind];
		if (sect.EXPORT && !sect.EXPORT.ALLOW)
			sect.EXPORT = false;
		if (!sect.TEXT_COLOR)
			sect.TEXT_COLOR = '';
		sectId = sect.ID;

		if (this.bCalDAV && sect.CAL_DAV_CAL && sect.CAL_DAV_CON && this.arConnections && this.arConnections.length > 0)
		{
			for (i in this.arConnections)
			{
				if (this.arConnections[i].id == sect.CAL_DAV_CON)
				{
					sect['~CAL_DAV_LAST_SYNC'] = this.arConnections[i].last_result;
					break;
				}
			}
		}

		this.arSectionsInd[sectId] = ind;
		this.oActiveSections[sectId] = true;

		if (!this.lastSection && sect.PERM && sect.PERM.add)
			this.lastSection = parseInt(sectId);
	}

	this.bOnunload = false;
	this.actionUrl = Params.page;
	this.path = Params.path;
	this.bUser = this.type == 'user';
	this.meetingRooms = Params.meetingRooms || [];
	this.allowResMeeting = !!Params.allowResMeeting;
	this.allowVideoMeeting = !!Params.allowVideoMeeting;
	this.bUseMR = this.bIntranet && (this.allowResMeeting || this.allowVideoMeeting) && this.meetingRooms.length > 0;

	if (this.bTasks)
	{
		this.taskBgColor = "#F5B39A";
		this.taskTextColor = "#000000";

		//Event handlers for handle result after Adding, Editing and Deleting of tasks from popups
		BX.addCustomEvent('onCalendarPopupTaskAdded', BX.delegate(this.OnTaskChanged, this));
		BX.addCustomEvent('onCalendarPopupTaskChanged', BX.delegate(this.OnTaskChanged, this));
		BX.addCustomEvent('onCalendarPopupTaskDeleted', BX.delegate(this.OnTaskKilled, this));

		this.oActiveSections.tasks = true;// !Params.hiddenSections['tasks'];
	}

	// Set hidden sections
	for (ind in Params.hiddenSections)
		this.oActiveSections[Params.hiddenSections[ind]] = false;

	if (this.PERM.access)
		this.typeAccess = Params.TYPE_ACCESS || {};

	this.Init();
}

JCEC.prototype = {
	Init: function()
	{
		this.DaysTitleCont = BX(this.id + '_days_title');
		this.DaysGridCont = BX(this.id + '_days_grid');

		//Prevent selection while drag
		DenyDragEx(this.DaysGridCont);

		this.maxEventCount = 3; // max count of visible events in day
		this.activeDateDays = {};
		this._bScelTableSixRows = false;
		this.oDate = new Date();

		this.currentDate =
		{
			date: this.oDate.getDate(),
			day: this.ConvertDayIndex(this.oDate.getDay()),
			month: this.oDate.getMonth(),
			year: this.oDate.getFullYear()
		};

		this.activeDate = BX.clone(this.currentDate);

		if (this.initMonth && this.initYear)
		{
			this.activeDate.month = this.initMonth - 1;
			this.activeDate.year = this.initYear;
		}

		this.activeDate.week = this.GetWeekByDate(this.activeDate);
		this.arLoadedMonth = {};
		this.arLoadedMonth[this.activeDate.month + '.' + this.activeDate.year] = true;
		this.arLoadedEventsId = {};
		this.arLoadedParentId = {};
		this.Event = new window.JSECEvent(this);

		this.HandleEvents(this.arConfig.events, this.arConfig.attendees);

		var _this = this;

		//Days selection init
		this.selectDaysMode = false;
		this.selectDaysStartObj = false;
		this.selectDaysEndObj = false;
		this.curTimeSelection = {};
		this.curDayTSelection = {};

		this.week_holidays = {};
		for (i = 0; i < this.weekHolidays.length; i++)
			this.week_holidays[this.weekHolidays[i]] = true;

		this.year_holidays = {};
		for (i in this.yearHolidays)
			this.year_holidays[this.yearHolidays[i]] = true;

		this.year_workdays = {};
		for (i in this.yearWorkdays)
			this.year_workdays[this.yearWorkdays[i]] = true;

		window.onbeforeunload = function(){_this.bOnunload = true;};

		this.BuildSectionBlock();
		this.Selector = new ECMonthSelector(this);

		this.ColorPicker = new ECColorPicker({});

		this.BuildButtonsCont();
		this.pCalCnt.className = "bxcal";
		this.InitTabControl();

		setTimeout(function(){BX.bind(window, "resize", BX.proxy(_this.OnResize, _this))},200);

		if (this.showBanner && this.userSettings.showBanner)
			new ECBanner(this);

		if (this.arConfig.showNewEventDialog && !this.bReadOnly)
			this.ShowEditEventPopup({bChooseMR: this.arConfig.bChooseMR});
	},

	InitTabControl: function()
	{
		this.Tabs = {};

		this.InitTab({id: 'month', tabContId: this.id + '_tab_month', bodyContId: this.id + '_scel_table_month'});
		this.InitTab({id: 'week', tabContId: this.id + '_tab_week', bodyContId: this.id + '_scel_table_week', daysCount: 7});
		this.InitTab({id: 'day', tabContId: this.id + '_tab_day', bodyContId: this.id + '_scel_table_day', daysCount: 1});

		this.SetTab(this.userSettings.tabId, true);
	},

	InitTab : function(arParams)
	{
		var pTabCont = BX(arParams.tabContId);
		if (!pTabCont)
			return;

		var _this = this;
		pTabCont.onclick = function() {_this.SetTab(arParams.id);};

		this.Tabs[arParams.id] = {
			id : arParams.id,
			pTabCont : pTabCont,
			bodyContId : arParams.bodyContId,
			daysCount : arParams.daysCount || false,
			needRefresh: false,
			setActiveDate : false
		}
	},

	SetTab : function(tabId, bFirst, P)
	{
		var
			_this = this,
			oTab = this.Tabs[tabId];
		if (tabId == this.activeTabId)
			return;

		var
			prevTabId = this.activeTabId,
			tblDis = '';

		if (!oTab.bLoaded || bFirst)
		{
			oTab.pBodyCont = BX(oTab.bodyContId);
			BX.bind(oTab.pBodyCont, 'click', BX.proxy(this.EventClick, this));
			DenyDragEx(oTab.pBodyCont); //Prevent selection while drag
		}

		if (this.activeTabId)
		{
			BX.removeClass(this.Tabs[this.activeTabId].pTabCont, 'bxec-tab-div-act'); // Deactivate TAB
			this.Tabs[this.activeTabId].pBodyCont.style.display = 'none'; // Hide body cont
		}

		BX.addClass(oTab.pTabCont, 'bxec-tab-div-act'); // Activate cur tab
		this.activeTabId = tabId;
		this.Selector.ChangeMode(tabId);

		if (!oTab.bLoaded || bFirst) // Called ONCE!
		{
			var
				ad = this.activeDate,
				cd = this.currentDate,
				d, w, m, y;

			if ((ad.month && ad.month != cd.month) || (ad.year && ad.year != cd.year))
			{
				d = 1;
				w = 0;
				m = ad.month;
				y = ad.year;
			}
			else
			{
				var xd = (prevTabId == 'day' && ad) ? ad : cd;
				w = this.GetWeekByDate(xd);
				d = xd.date;
				m = xd.month;
				y = xd.year;
			}

			switch (tabId)
			{
				case 'month':
					setTimeout(BX.delegate(this.BuildDaysTitle, this), 0);
					this.SetMonth(m, y);
					break;
				case 'week':
					this.BuildWeekDaysTable();
					this.SetWeek(w, m, y);
					break;
				case 'day':
					this.BuildSingleDayTable();
					if (!P || P.bSetDay !== false)
						this.SetDay(d, m, y);
					break;
			}
			oTab.bLoaded = true;
		}
		else if(!P || P.bSetDay !== false)
		{
			if (prevTabId == 'day' && tabId == 'week')
				oTab.setActiveDate = true;

			if (oTab.needRefresh)
			{
				if (tabId == 'month')
					this.DisplayEventsMonth(true);
				else
					setTimeout(function(){_this.ReBuildEvents(tabId);}, 20);
			}
			else if (oTab.setActiveDate)
			{
				switch (tabId)
				{
					case 'month':
						this.SetMonth(this.activeDate.month, this.activeDate.year);
						break;
					case 'week':
						this.SetWeek(this.GetWeekByDate(this.activeDate), this.activeDate.month, this.activeDate.year);
						break;
					case 'day':
						this.SetDay(1, this.activeDate.month, this.activeDate.year);
						break;
				}
			}
		}

		if (this.startupEvent && !this.startupEvent.viewed)
			this.ShowStartUpEvent();

		oTab.needRefresh = false;
		oTab.setActiveDate = false;

		this.Selector.Show(tabId);

		oTab.pBodyCont.style.display = tblDis; // Show tab content
		oTab.bLoaded = true;

		if (this._bScelTableSixRows)
		{
			if (this.activeTabId == 'month')
				BX.addClass(this.pCalCnt, 'BXECSceleton-six-rows');
			else
				BX.removeClass(this.pCalCnt, 'BXECSceleton-six-rows');
		}

		if (!bFirst)
			BX.userOptions.save('calendar', 'user_settings', 'tabId', tabId);
	},

	GetWeekByDate : function(oDate)
	{
		var D1 = new Date();
		D1.setFullYear(oDate.year, oDate.month, 1); // 1'st day of month
		var day = this.GetWeekDayByInd(D1.getDay());
		var offset = this.GetWeekDayOffset(day) - 1;
		var dd = oDate.date + offset;
		var weekIndex = Math.floor(dd / 7);

		return weekIndex;
		//return Math.floor((oDate.date + this.ConvertDayIndex(D1.getDay()) - 1) / 7);
	},

	SetTabNeedRefresh : function(tabId, bNewDate)
	{
		var i, Tab;
		for (i in this.Tabs)
		{
			Tab = this.Tabs[i];
			if (typeof Tab != 'object' || Tab.id == tabId)
				continue;
			if (!bNewDate && Tab.needRefresh === false)
				Tab.needRefresh = true;
			else if (bNewDate && Tab.setActiveDate === false)
				Tab.setActiveDate = true;
		}
	},

	BuildButtonsCont : function()
	{
		this.ButtonsCont = BX(this.id + '_buttons_cont');
		var
			addSeparator = false,
			_this = this;

		if (!this.bReadOnly)
		{
			var
				pAddBut = this.ButtonsCont.appendChild(BX.create('SPAN', {props: {className: 'bxec-add-but', title: EC_MESS.AddNewEvent}})),
				pIcon = pAddBut.appendChild(BX.create('I')),
				pText = pAddBut.appendChild(BX.create('SPAN', {props: {}, html: EC_MESS.Add})),
				pMore = pAddBut.appendChild(BX.create('A', {props: {href: 'javascript: void(0);', className: 'bxec-add-more'}}));

			addSeparator = true;

			pIcon.onclick = pText.onclick = BX.proxy(this.ShowEditEventPopup, this);
			var arMenuItems = [];
			arMenuItems.push({
				text : EC_MESS.Event,
				title : EC_MESS.AddNewEvent,
				className : "bxec-menu-add-event",
				onclick: function(){_this.ClosePopupMenu();_this.ShowEditEventPopup();}
			});

			if (this.allowMeetings)
			{
				arMenuItems.push({
					text : EC_MESS.EventPl,
					title : EC_MESS.AddNewEventPl,
					className : "bxec-menu-add-pl",
					onclick: function(){_this.ClosePopupMenu();_this.ShowEditEventPopup({bRunPlanner: true});}
				});
			}

			if (this.bTasks)
			{
				arMenuItems.push({
					text : EC_MESS.NewTask,
					title : EC_MESS.NewTaskTitle,
					className : "bxec-menu-add-task",
					onclick: function(){_this.ClosePopupMenu();_this.Event.Edit({bTasks: true});}
				});
			}

			//if (this.type == 'user' && this.userId == this.ownerId || this.type != 'user' /* &&  .... */)
			if (this.type == 'user' && this.userId == this.ownerId || this.permEx.edit_section)
			{
				arMenuItems.push({
					text : EC_MESS.NewSect,
					title : EC_MESS.NewSectTitle,
					className : "bxec-menu-add-sect",
					onclick: function(){_this.ClosePopupMenu();_this.ShowSectionDialog();}
				});
			}

			// External - only for users calendars and only for owner
			if (this.bCalDAV && this.type == 'user' && this.userId == this.ownerId)
			{
				arMenuItems.push({
					text : EC_MESS.NewExtSect,
					title : EC_MESS.NewExtSectTitle,
					className : "bxec-menu-add-sect-ex",
					onclick: function(){_this.ClosePopupMenu();_this.ShowExternalDialog({});}
				});
			}

			pMore.onclick = function()
			{
				BX.PopupMenu.show('bxec_add_menu', pMore, arMenuItems, {events: {onPopupClose: function() {BX.removeClass(this.bindElement, "bxec-add-more-over");}}, offsetLeft: -(pAddBut.offsetWidth - 15)});
				BX.addClass(pMore, "bxec-add-more-over");
			};
		}

		if(!this.bAnonym)
		{
			// User settings
			if (addSeparator)
				this.ButtonsCont.appendChild(BX.create('SPAN', {props: {className: 'bxec-but-sep'}}));

			this.ButtonsCont.appendChild(BX.create('SPAN', {props: {className: 'bxec-settings-but', title: EC_MESS.Settings}, events: {click: BX.proxy(this.ShowSetDialog, this)}}));
		}
	},

	ClosePopupMenu: function()
	{
		if (BX.PopupMenu && BX.PopupMenu.currentItem && BX.PopupMenu.currentItem.popupWindow)
			BX.PopupMenu.currentItem.popupWindow.close();
	},

	SetView : function(P)
	{
		if (!bxInt(P.week) && P.week !== 0)
			P.week = this.activeDate.week;
		if (!bxInt(P.date))
			P.date = this.activeDate.date;

		switch (this.activeTabId)
		{
			case 'month':
				return this.SetMonth(P.month, P.year);
			case 'week':
				return this.SetWeek(P.week, P.month, P.year);
			case 'day':
				return this.SetDay(P.date || 1, P.month, P.year);
		}
	},

	SetMonth : function(m, y)
	{
		if (!this.arLoadedMonth[m + '.'+ y])
			return this.LoadEvents(m, y);
		var bSetActiveDate = this.activeDate.month != m || this.activeDate.year != y;
		this.activeDate.month = m;
		this.activeDate.year = y;
		if (!this.activeDate.week)
			this.activeDate.week = 0;
		if (bSetActiveDate)
			this.SetTabNeedRefresh('month', true);

		this.Selector.OnChange(y, m);

		this.BuildDaysGrid(m, y);
	},

	BuildDaysTitle : function()
	{
		var
			i, day,
			w = this.DaysTitleCont.offsetWidth / 7;

		w = Math.round(w * 10) / 10;
		for (i = 0; i < 7; i++)
		{
			day = this.DaysTitleCont.childNodes[i];
			day.style.width = w + 'px';

			if (i == 6)
				day.style.width = Math.abs(w - 2) + 'px';
		}

		this.DaysTitleCont.style.visibility = 'visible';
	},

	BuildDaysGrid : function(month, year)
	{
		BX.cleanNode(this.DaysGridCont);
		var oDate = new Date();
		oDate.setFullYear(year, month, 1);
		this.dragDrop.Reset();

		this.activeDateDaysAr = [];
		this.activeDateDaysArO = [];
		this.arWeeks = [];

		this.oDaysGridTable = BX.create('TABLE', {props: {className : 'bxec-days-grid-table', cellPadding: 0, cellSpacing: 0}});

		if (this.GetWeekStart() != this.GetWeekDayByInd(oDate.getDay()))
			this.BuildPrevMonthDays(this.GetWeekDayByInd(oDate.getDay()), month, year);

		var date, day;
		while(oDate.getMonth() == month)
		{
			date = oDate.getDate();
			this.BuildDayCell(date, this.GetWeekDayByInd(oDate.getDay()), true, month, year);
			oDate.setDate(date + 1);
		}

		this.BuildNextMonthDays(this.GetWeekDayByInd(oDate.getDay()), month, year);

		//this.maxEventCount = this.oDaysGridTable.rows.length > 5 ? 2 : 3;

		this.DaysGridCont.appendChild(this.oDaysGridTable);
		var rowLength = this.oDaysGridTable.rows.length;
		if (rowLength == 6 && !this._bScelTableSixRows)
		{
			this._bScelTableSixRows = true;
			BX.addClass(this.pCalCnt, 'BXECSceleton-six-rows');
		}
		else if(this.pCalCnt && this._bScelTableSixRows && rowLength < 6)
		{
			this._bScelTableSixRows = false;
			BX.removeClass(this.pCalCnt, 'BXECSceleton-six-rows');
		}

		this.BuildEventHolder();
	},

	BuildPrevMonthDays : function(day, curMonth, curYear)
	{
		var
			i,
			dayOffset = this.GetWeekDayOffset(day),
			oDate = new Date();

		oDate.setFullYear(curYear, curMonth, 1);
		oDate.setDate(oDate.getDate() - dayOffset);

		for (i = 0; i < dayOffset; i++)
		{
			this.BuildDayCell(oDate.getDate(), this.GetWeekDayByInd(oDate.getDay()), false, oDate.getMonth(), oDate.getFullYear());
			oDate.setDate(oDate.getDate() + 1);
		}
	},

	BuildNextMonthDays : function(day, curMonth, curYear)
	{
		if (this.GetWeekStart() != day)
		{
			var i, dayOffset = this.GetWeekDayOffset(day);
			var oDate = new Date();
			oDate.setFullYear(curYear, curMonth + 1, 1);
			for (i = dayOffset; i < 7; i++)
			{
				this.BuildDayCell(oDate.getDate(), this.GetWeekDayByInd(oDate.getDay()), false, oDate.getMonth(), oDate.getFullYear());
				oDate.setDate(oDate.getDate() + 1);
			}
		}
	},

	BuildDayCell : function(date, day, bCurMonth, month, year)
	{
		var oDay, cn, _this = this;
		if (this.GetWeekStart() == day)
			this._curRow = this.oDaysGridTable.insertRow(-1);

		var dayInd = this.activeDateDaysAr.length;

		// Make className
		//It's Holliday
		var bHol = (this.week_holidays[{MO: 0,TU: 1,WE: 2, TH: 3,FR: 4,SA: 5,SU: 6}[day]] || this.year_holidays[date + '.' + month]) && !this.year_workdays[date + '.' + month];

		cn = 'bxec-day';
		if (!bCurMonth && !bHol)
			cn += ' bxec-day-past';
		else if(!bCurMonth)
			cn += ' bxec-day-past-hol';
		else if (bHol)
			cn += ' bxec-holiday';

		if (date == this.currentDate.date && month == this.currentDate.month && year == this.currentDate.year)
			cn += ' bxec-current-day';

		oDay = this._curRow.insertCell(-1);
		oDay.id = 'bxec_ind_' + dayInd;
		oDay.className = cn;

		var
			dayCont = oDay.appendChild(BX.create('DIV', {props: {className: 'bxc-day'}, style: {height: this.dayHeight + 'px'}})),
			title = dayCont.appendChild(BX.create('DIV', {props: {className: 'bxc-day-title'}})),
			link = title.appendChild(BX.create('A', {props: {href: 'javascript:void(0)', className: 'bxc-day-link', title: EC_MESS.GoToDay, id: 'bxec-day-lnk-' + dayInd}, html: date}));

		this.dragDrop.RegisterDay(dayCont);

		link.onmousedown = function(e){return BX.PreventDefault(e);};
		link.onclick = function(e)
		{
			var date = _this.activeDateDaysAr[this.id.substr('bxec-day-lnk-'.length)];
			_this.SetTab('day', false, {bSetDay: false});
			_this.SetDay(date.getDate(), date.getMonth(), date.getFullYear());
			return BX.PreventDefault(e);
		};

		if (this.GetWeekDayOffset(day) == 6) // Layout hack
			oDay.style.borderRight = '0px';

		if (!this.bReadOnly)
		{
			oDay.onmouseover = function(){_this.oDayOnMouseOver(this);};
			oDay.onmousedown = function(){_this.oDayOnMouseDown(this)};
			oDay.onmouseup = function() {_this.oDayOnMouseUp(this)};
		}

		this.activeDateDaysAr.push(new Date(year, month, date));
		this.activeDateDaysArO.push(
		{
			pDiv: oDay,
			pDayCont: dayCont,
			arEvents: {begining : [], all : []}
		});
	},

	oDayOnMouseOver : function(pDay)
	{
		if (this.selectDaysMode)
		{
			this.selectDaysEndObj = pDay;
			this.SelectDays();
		}
	},

	oDayOnMouseDown : function(pDay)
	{
		this.selectDaysMode = true;
		this.selectDaysStartObj = this.selectDaysEndObj = pDay;
		if (pDay.className.indexOf('bxec-day-selected') == -1)
			return this.SelectDays();
		this.selectDaysMode = false;
		this.DeSelectDays();
		this.CloseAddEventDialog();
	},

	oDayOnMouseUp : function(pDay)
	{
		if (!this.selectDaysMode)
			return;
		this.selectDaysEndObj = pDay;
		this.SelectDays();

		this.ShowAddEventDialog();

		this.selectDaysMode = false;
	},

	oDayOnDoubleClick : function(pDay) {},
	oDayOnContextMenu : function(pDay) {},

	RefreshEventsOnWeeks : function(arWeeks)
	{
		for (var i = 0, l = arWeeks.length; i < l; i++)
			this.RefreshEventsOnWeek(arWeeks[i]);
	},

	RefreshEventsOnWeek : function(ind)
	{
		var
			startDayInd = ind * 7,
			endDayInd = (ind + 1) * 7,
			day, i, arEv, j, ev, arAll, displ, arHid,
			slots = [],
			step = 0;

		for(j = 0; j < this.maxEventCount; j++)
			slots[j] = 0;

		for (i = startDayInd; i < endDayInd; i++)
		{
			day = this.activeDateDaysArO[i];

			if (!day)
				continue;
			day.arEvents.hidden = [];
			arEv = day.arEvents.begining;
			arHid = [];

			if (arEv.length > 0)
			{
				arEv.sort(function(a, b)
				{
					if (b.daysCount == a.daysCount && a.daysCount == 1)
						return a.oEvent.DT_FROM_TS - b.oEvent.DT_FROM_TS;
					return b.daysCount - a.daysCount;
				});

				eventloop:
				for(k = 0; k < arEv.length; k++)
				{
					ev = arEv[k];
					if (!ev)
						continue;

					if (!this.arEvents[ev.oEvent.ind])
					{
						day.arEvents.begining = arEv = BX.util.deleteFromArray(arEv, k);
						ev = arEv[k];
						if (!ev)
							continue; //break ?
					}

					for(j = 0; j < this.maxEventCount; j++)
					{
						if (slots[j] - step <= 0)
						{
							slots[j] = step + ev.daysCount;
							this.ShowEventOnLevel(ev.oEvent.oParts[ev.partInd], j, ind);
							continue eventloop;
						}
					}
					arHid[ev.oEvent.ID] = true;
					day.arEvents.hidden.push(ev);
				}
			}
			// For all events in the day
			arAll = day.arEvents.all;
			for (var x = 0; x < arAll.length; x++)
			{
				ev = arAll[x];
				if (!ev || arHid[ev.oEvent.ID])
					continue;
				if (!this.arEvents[ev.oEvent.ind])
				{
					day.arEvents.all = arAll = BX.util.deleteFromArray(arAll, x);
					ev = arAll[x];
					if (!ev)
						continue;
				}

				if (ev.oEvent.oParts && ev.partInd != undefined && ev.oEvent.oParts[ev.partInd] && ev.oEvent.oParts[ev.partInd].style.display == 'none')
					day.arEvents.hidden.push(ev);
			}
			this.ShowMoreEventsSelect(day);
			step++;
		}
	},

	ShowEventOnLevel : function(pDiv, level, week)
	{
		if (!this.arWeeks[week])
			this.arWeeks[week] = {top: parseInt(this.oDaysGridTable.rows[week].cells[0].offsetTop) + 22};

		var top = this.arWeeks[week].top + level * 18;
		pDiv.style.display = 'block';
		pDiv.style.top = top + 'px';
	},

	ShowMoreEventsSelect : function(oDay)
	{
		var
			arEv = oDay.arEvents.hidden,
			l = arEv.length;

		if (arEv.length <= 0)
		{
			if(oDay.pMoreDiv)
				oDay.pMoreDiv.style.display = 'none';
			return; // Exit
		}

		if (!oDay.pMoreDiv)
			oDay.pMoreDiv = oDay.pDayCont.appendChild(BX.create('DIV', {props: {className: 'bxc-day-more'}}));

		var
			_this = this,
			i, el, part, arHidden = [];

		for (i = 0; i < arEv.length; i++)
		{
			el = arEv[i];
			part = el.oEvent.oParts[el.partInd];
			part.style.display = "none"; // Hide event from calendar grid

			if (!el.oEvent.pMoreDivs)
				el.oEvent.pMoreDivs = [];
			el.oEvent.pMoreDivs.push(oDay.pMoreDiv);
			arHidden.push({pDiv: part, oEvent: el.oEvent});
		}

		BX.adjust(oDay.pMoreDiv, {
			style: {display: 'block'},
			html: EC_MESS.MoreEvents + ' (' + arHidden.length + ' ' + EC_MESS.Item + ')'
		});

		oDay.pMoreDiv.onmousedown = function(e){if(!e) e = window.event; BX.PreventDefault(e);};
		oDay.pMoreDiv.onclick = function(){_this.ShowMoreEventsWin({Events: arHidden, id: oDay.pDiv.id, pDay: oDay.pDiv, pSelect: oDay.pMoreDiv});};
	},

	SelectDays : function()
	{
		if (!this.arSelectedDays)
			this.arSelectedDays = [];
		this.bInvertedDaysSelection = false;

		if (this.arSelectedDays.length > 0)
			this.DeSelectDays();

		if (!this.selectDaysStartObj || !this.selectDaysEndObj)
			return;

		var
			start_ind = this.GetDayIndexByElement(this.selectDaysStartObj),
			end_ind = this.GetDayIndexByElement(this.selectDaysEndObj),
			el, i, _a;

		if (start_ind > end_ind) // swap start_ind and end_ind
		{
			_a = end_ind;
			end_ind = start_ind;
			start_ind = _a;
			this.bInvertedDaysSelection = true;
		}

		for (i = start_ind; i <= end_ind; i++)
		{
			el = this.activeDateDaysArO[i];
			if (!el || !el.pDiv)
				continue;
			BX.addClass(el.pDiv, 'bxec-day-selected');
			this.arSelectedDays.push(el.pDiv);
		}
	},

	GetDayIndexByElement: function(pDay)
	{
		return parseInt(pDay.id.substr(9));
	},

	GetDayByIndex: function(ind)
	{
		return this.activeDateDaysArO[ind];
	},

	DeSelectDays : function()
	{
		if (!this.arSelectedDays)
			return;
		var el, i, l;
		for (i = 0, l = this.arSelectedDays.length; i < l; i++)
			BX.removeClass(this.arSelectedDays[i], 'bxec-day-selected');
		this.arSelectedDays = [];
	},

	DisplayError : function(str, bReloadPage)
	{
		var _this = this;
		setTimeout(function(){
			if (!_this.bOnunload)
			{
				alert(str || '[Event Calendar] Error!');
				if (bReloadPage)
					window.location = window.location;
			}
		}, 200);
	},

	BuildSectionBlock : function()
	{
		this.oSections = {};

		var bMove = (this.sectionControlsDOMId && (this.pSidebar = BX(this.sectionControlsDOMId)));
		this.pSectCont = BX(this.id + '_sect_cont');

		if (!this.pSectCont)
			return;

		if (bMove)
		{
			if (this.pSidebar.firstChild)
				this.pSidebar.insertBefore(this.pSectCont, this.pSidebar.firstChild);
			else
				this.pSidebar.appendChild(this.pSectCont);

			BX.addClass(this.pSectCont, "bxec-sect-cont-side");
		}
		else
		{
			BX.addClass(this.pSectCont, "bxec-sect-cont-top");
		}

		var _this = this;
		this.pSectCont.style.display = "block";
		if (this.arSections.length < 1 && this.bReadOnly)
			return;

		this.pOwnerSectCont = BX(this.id + 'sections');
		if(this.pOwnerSectCont)
		{
			this.pOwnerSectCont.onmouseover = function(){if(_this._sect_over_timeout){clearInterval(_this._sect_over_timeout);} BX.addClass(_this.pOwnerSectCont, 'bxec-hover');};
			this.pOwnerSectCont.onmouseout = function(){_this._sect_over_timeout = setTimeout(function(){BX.removeClass(_this.pOwnerSectCont, 'bxec-hover');}, 100);};
		}
		this.pOwnerSectBlock = BX(this.id + 'sections-cont');

		if (!this.pOwnerSectBlock)
			return;

		BX.cleanNode(this.pOwnerSectBlock);
		this.pOwnerSectBlock.style.display = '';

		// Prepare block for superposed sections
		if (this.bSuperpose)
		{
			this.pSPSectCont = BX(this.id + 'sp-sections');
			this.pSPSectCont.onmouseover = function(){if(_this._sect_over_timeout){clearInterval(_this._sect_over_timeout);} BX.addClass(_this.pSPSectCont, 'bxec-hover');};
			this.pSPSectCont.onmouseout = function(){_this._sect_over_timeout = setTimeout(function(){BX.removeClass(_this.pSPSectCont, 'bxec-hover');}, 100);};

			this.pSpSectBlock = BX(this.id + 'sp-sections-cont');

			var pManageSPBut = BX(this.id + '-manage-superpose');
			pManageSPBut.onclick = function(){_this.ShowSuperposeDialog()};
		}

		this.BuildSectionElements();

		var pAddSectBut = BX(this.id + '-add-section');
		//if (this.Personal() || !this.bReadOnly)
		if (this.Personal() || this.permEx.section_edit)
		{
			if (pAddSectBut)
				pAddSectBut.onclick = function(){_this.ShowSectionDialog();};
		}
		else
		{
			if (pAddSectBut)
				BX.cleanNode(pAddSectBut, true);
		}
	},

	BuildSectionElements : function()
	{
		var
			bShowOwnerSection = false,
			bShowSuperpose = false,
			i, l = this.arSections.length, oSect;

		for (i = 0; i < l; i++)
		{
			oSect = this.arSections[i];
			if (!oSect.DOM)
				oSect.DOM = {}

			// Add to owner's sections only if section added first time
			if (!this.bSuperpose || (oSect.CAL_TYPE == this.type && oSect.OWNER_ID == this.ownerId))
			{
				if (oSect.DOM.pEl)
					this.BuildSectionMenu(oSect.ID);
				else
					this.BuildSectionElement(oSect, this.oActiveSections[oSect.ID]);

				if (!bShowOwnerSection)
					bShowOwnerSection = true;
			}

			// Add to superposed section
			if (this.bSuperpose)
			{
				// Add to superpose block
				if (oSect.SUPERPOSED)
				{
					if (oSect.DOM.pSPEl)
						this.BuildSectionMenu(oSect.ID, true);
					else
						this.BuildSectionElement(oSect, this.oActiveSections[oSect.ID], true);
				}
				// Section was superposed, but now we have to remove it from superposed
				else if(!oSect.SUPERPOSED && oSect.DOM.pSPEl)
				{
					// Clean DOM and vars
					if (oSect.DOM.pSPEl.parentNode)
						oSect.DOM.pSPEl.parentNode.removeChild(oSect.DOM.pSPEl);

					var menuId = 'bxec-sect-sp-' + oSect.ID;
					if (this.arMenuItems[menuId])
					{
						if (BX.PopupMenu.Data[menuId])
						{
							BX.PopupMenu.Data[menuId].popupWindow.destroy();
							BX.PopupMenu.Data[menuId] = false;
						}
						this.arMenuItems[menuId] = null;
						delete this.arMenuItems[menuId];
					}

					oSect.DOM.pSPEl = oSect.DOM.pSPWrap = oSect.DOM.pSPText = null;
					delete oSect.DOM.pSPEl;
					delete oSect.DOM.pSPWrap;
					delete oSect.DOM.pSPText;
				}

				if (oSect.SUPERPOSED && !bShowSuperpose)
					bShowSuperpose = true;
			}
		}

		if (this.bTasks && !this.oSections['tasks'])
		{
			bShowOwnerSection = true;
			this.BuildSectionElement({
				ID: 'tasks',
				CAL_TYPE : 'user',
				COLOR : this.taskBgColor,
				CREATED_BY : this.userId,
				DESCRIPTION : EC_MESS.MyTasks,
				DOM : {},
				NAME : EC_MESS.MyTasks,
				OWNER_ID : this.userId,
				PERM : {},
				SORT : 100,
				SUPERPOSED : false,
				TEXT_COLOR : this.taskTextColor
			}, this.oActiveSections.tasks);
		}

		if (this.pSPSectCont)
			this.pSPSectCont.style.display = bShowSuperpose ? "" : "none";

		this.pOwnerSectCont.style.display = bShowOwnerSection ? "" : "none";

		return true;
	},

	BuildSectionElement : function(el, bChecked, bSuperpose)
	{
		bSuperpose = !!bSuperpose;
		if (!el.DOM)
			el.DOM = {};

		// Determine container
		var
			isGoogle = this.bCalDAV && el.CAL_DAV_CAL && el.CAL_DAV_CON && el['~CAL_DAV_LAST_SYNC'],
			isTask = this.bTasks && el.ID == 'tasks',
			pCont = this.pOwnerSectBlock;

		if (bSuperpose) // Superposed
		{
			pCont = this.pSpSectBlock;
		}
		else
		{
			if (isTask) // My tasks
			{
				pCont = BX(this.id + 'tasks-sections-cont');
			}
			else
			{
				if (!this.pSectSubCont)
					this.pSectSubCont = this.pOwnerSectBlock.appendChild(BX.create("DIV"));
				pCont = this.pSectSubCont;
			}
		}

		el.bDark = this.ColorIsDark(el.COLOR);
		var
			_this = this,
			menu = [],
			menuId = 'bxec-sect-' + (bSuperpose ? 'sp-' : '') + el.ID,
			//bActive = !this.bReadOnly || el.EXPORT,
			pEl = pCont.appendChild(BX.create('DIV', {props: {id: 'el-' + menuId, className: 'bxec-sect-el'}})),
			pWrap = pEl.appendChild(BX.create("DIV", {props: {className: 'bxec-sect-el-wrap'  + (isTask ? ' bxec-task-el-wrap' : '')}})),
			pCh = pWrap.appendChild(BX.create("SPAN", {props: {className: 'bxec-spr bxec-checkbox'}}));

		if(isTask)
			pWrap.appendChild(BX.create("SPAN", {props: {className: 'bxec-spr bxec-tasks-sect'}}));

		if (isGoogle)
		{
			if (el['~CAL_DAV_LAST_SYNC'].indexOf("[200]") >= 0)
				pWrap.appendChild(BX.create("SPAN", {props: {className: 'bxec-spr bxec-cal-dav-google'}}));
			else
				pWrap.appendChild(BX.create("SPAN", {props: {className: 'bxec-spr bxec-cal-dav-google-fail', title: EC_MESS.SyncError + ': ' + el['~CAL_DAV_LAST_SYNC']}}));
		}

		var
			pText = pWrap.appendChild(BX.create("DIV", {text: el.NAME, props: {className: 'bxc-sect-text-wrap'}})),
			pMenu = pEl.appendChild(BX.create("A", {props: {id: menuId, href: "javascript: void(0);", className: 'bxec-spr bxec-sect-menu', hidefocus: true}}));

		pMenu.onclick = function(e){_this.ShowCPopup(this.id, this);return BX.PreventDefault(e);};

		if (bSuperpose)  // For superposed
		{
			el.DOM.pSPEl = pEl;
			el.DOM.pSPWrap = pWrap;
			el.DOM.pSPText = pText;
		}
		else
		{
			el.DOM.pEl = pEl;
			el.DOM.pWrap = pWrap;
			el.DOM.pText = pText;
		}

		pEl.onclick = function() {_this.ShowCalendar(el, this.className.indexOf('bxec-sect-el-checked') == -1);};
		this.oSections[el['ID']] = el;
		this.oActiveSections[el['ID']] = bChecked;
		this.BuildSectionMenu(el['ID'], bSuperpose);

		this.ShowCalendar(el, bChecked, true);
	},

	BuildSectionMenu : function(sectionId, bSuperpose)
	{
		var el = this.oSections[sectionId];

		if (!el || (this.bTasks && el.ID == 'tasks'))
			return false;

		var
			_this = this,
			menu = [],
			isGoogle = el.CAL_DAV_CAL && el.CAL_DAV_CON,
			isFirstExchange = this.arConfig.bExchange && el.IS_EXCHANGE && el.DAV_EXCH_CAL == 'calendar_' + el.OWNER_ID,
			pEl = bSuperpose ? el.DOM.pSPEl : el.DOM.pEl,
			menuId = 'bxec-sect-' + (bSuperpose ? 'sp-' : '') + el.ID;

		if (BX.PopupMenu.Data[menuId] && BX.PopupMenu.Data[menuId].popupWindow)
		{
			BX.PopupMenu.Data[menuId].popupWindow.destroy();
			BX.PopupMenu.Data[menuId] = false;
		}

		if (el.PERM.edit_section && !isGoogle && !bSuperpose)
		{
			menu.push({
				text : EC_MESS.Edit,
				title : EC_MESS.EditCalendarTitle,
				className : "bxec-menu-sect-edit",
				onclick: function(){_this.CloseCPopup();_this.ShowSectionDialog(el);}
			});
		}

		if (!el.SUPERPOSED && this.canAddToSuperpose)
		{
			menu.push({
				text : EC_MESS.CalAdd2SP,
				title : EC_MESS.CalAdd2SPTitle,
				className : "bxec-menu-sect-add2sp",
				onclick: function(){_this.CloseCPopup();_this.SetSuperposed(el, true);}
			});
		}
		else if(el.SUPERPOSED)
		{
			menu.push({
				text : EC_MESS.CalHide,
				title : EC_MESS.CalHideTitle,
				className : "bxec-menu-sect-del-from-sp",
				onclick: function(){_this.CloseCPopup();_this.SetSuperposed(el, false);}
			});
		}

		if (el.OUTLOOK_JS  && !isGoogle)
		{
			menu.push({
				text : EC_MESS.ConnectToOutlook,
				title : EC_MESS.ConnectToOutlookTitle,
				className : "bxec-menu-sect-outlook",
				onclick: function(){
					_this.CloseCPopup();
					if (!window.jsOutlookUtils)
						BX.loadScript('/bitrix/js/calendar/outlook.js', function(){try{eval(el.OUTLOOK_JS);}catch(e){}});
					else
						try{eval(el.OUTLOOK_JS);}catch(e){};
				}
			});
		}

		if (el.EXPORT && el.EXPORT.ALLOW)
		{
			menu.push({
				text : EC_MESS.Export,
				title : EC_MESS.ExportTitle,
				className : "bxec-menu-sect-export",
				onclick: function(){_this.CloseCPopup();_this.ShowExportDialog(el);}
			});
		}

		if (el.PERM.edit_section && !isGoogle  && !bSuperpose && !isFirstExchange)
		{
			menu.push({
				text : EC_MESS.Delete,
				title : EC_MESS.DelCalendarTitle,
				className : "bxec-menu-sect-del",
				onclick: function(){_this.CloseCPopup();_this.DeleteSection(el);}
			});
		}

		if (isGoogle  && !bSuperpose)
		{
			menu.push({
				text : EC_MESS.Refresh,
				className : "bxec-menu-sect-edit",
				onclick: function(){
					_this.CloseCPopup();
					_this.bSyncGoogle = true;
					_this.Event.ReloadAll();
				}
			});

			if (el.PERM.edit_section)
				menu.push({
					text : EC_MESS.Adjust,
					title : EC_MESS.CalDavDialogTitle,
					className : "bxec-menu-sect-edit",
					onclick: function(){_this.CloseCPopup();_this.ShowExternalDialog({});}
				});
		}

		this.arMenuItems[menuId] = menu;

		if (menu.length > 0)
		{
			pEl.onmouseover = function(){if(_this['_sect_el_over_timeout' + this.id]){clearInterval(_this['_sect_el_over_timeout' + this.id]);} BX.addClass(pEl, 'bxec-sect-el-hover');};
			pEl.onmouseout = function(){_this['_sect_el_over_timeout' + this.id] = setTimeout(function(){BX.removeClass(pEl, 'bxec-sect-el-hover');}, 100);};
		}
		else
		{
			pEl.onmouseover = BX.False;
			pEl.onmouseout = BX.False;
		}
	},

	ShowCPopup: function(menuId, pEl)
	{
		if (this.arMenuItems[menuId])
		{
			BX.PopupMenu.show(menuId, pEl, this.arMenuItems[menuId], {events: {onPopupClose: function(){BX.removeClass(this.bindElement, "bxec-menu-over");}}});
			BX.addClass(pEl, "bxec-menu-over");
		}
	},

	CloseCPopup: function()
	{
		BX.PopupMenu.currentItem.popupWindow.close();
	},

	ColorIsDark: function(color)
	{
		if (!color)
			return false;

		if (color.charAt(0) == "#")
			color = color.substring(1, 7);
		var
			r = parseInt(color.substring(0, 2), 16),
			g = parseInt(color.substring(2, 4), 16),
			b = parseInt(color.substring(4, 6), 16),
			light = (r * 0.8 + g + b * 0.2) / 510 * 100;
		return light < 50;
	},

	AppendCalendarHint: function(el, bSuperpose)
	{
		if (el.oHint && el.oHint.Destroy)
			el.oHint.Destroy();

		//append Hint
		var hintContent;
		if (bSuperpose && el.SP_PARAMS)
			hintContent = '<b>' + el.SP_PARAMS.GROUP_TITLE + ' > ' + el.SP_PARAMS.NAME + ' > ' + el.NAME + '</b>';
		else
			hintContent = '<b>' + el.NAME + '</b>';

		var desc_len = el.DESCRIPTION.length, max_len = 350;
		if (desc_len > 0)
		{
			if (desc_len < max_len)
				hintContent += "<br>" + el.DESCRIPTION;
			else
				hintContent += "<br>" + el.DESCRIPTION.substr(0, max_len) + '...';
		}

		el.oHint = new BX.CHintSimple({parent: el._pElement, hint: hintContent});
	},

	ShowCalendar : function(el, bShow, bDontReload, bEffect2Bro)
	{
		if (!el)
			return;

		if (bShow)
		{
			if (el.DOM.pWrap)
				el.DOM.pWrap.style.backgroundColor = el.COLOR;

			// text color
			var txtColor = el.TEXT_COLOR;
			if (!txtColor)
				txtColor = el.bDark ? this.darkColor : this.brightColor;
			if (el.DOM.pText)
				el.DOM.pText.style.color = txtColor;
			if (el.DOM.pEl)
				BX.addClass(el.DOM.pEl, 'bxec-sect-el-checked');

			// For superposed
			if (el.DOM.pSPEl)
				BX.addClass(el.DOM.pSPEl, 'bxec-sect-el-checked');
			if (el.DOM.pSPText)
				el.DOM.pSPText.style.color = txtColor;
			if (el.DOM.pSPWrap)
				el.DOM.pSPWrap.style.backgroundColor = el.COLOR;
		}
		else
		{
			if (el.DOM.pEl)
				BX.removeClass(el.DOM.pEl, 'bxec-sect-el-checked');
			if (el.DOM.pWrap)
				el.DOM.pWrap.style.backgroundColor = 'transparent';
			if (el.DOM.pText)
				el.DOM.pText.style.color = '#484848';

			// For superposed
			if (el.DOM.pSPEl)
				BX.removeClass(el.DOM.pSPEl, 'bxec-sect-el-checked');
			if (el.DOM.pSPWrap)
				el.DOM.pSPWrap.style.backgroundColor = 'transparent';
			if (el.DOM.pSPText)
				el.DOM.pSPText.style.color = '#484848';
		}
		this.oActiveSections[el.ID] = el.bShowed = !!bShow

		if (!bDontReload)
		{
			this.SetTabNeedRefresh(this.activeTabId);
			this.Event.ReloadAll();
		}
	},

	SaveSection : function()
	{
		var
			D = this.oSectDialog,
			oSect = D.CAL.oSect;

		D.CAL.DOM.Name.value = BX.util.trim(D.CAL.DOM.Name.value);
		if (D.CAL.DOM.Name.value == "")
		{
			alert(EC_MESS.CalenNameErr);
			this.bEditCalDialogOver = true;
			return false;
		}

		var postData = this.GetReqData('section_edit', {
			name : D.CAL.DOM.Name.value,
			desc : D.CAL.DOM.Desc.value,
			//color : D.CAL.DOM.Color.value
			color : D.CAL.Color,
			text_color : D.CAL.TextColor
		});

		if (D.CAL.Access)
			postData.access = D.CAL.Access.GetValues();

		if (oSect.ID)
			postData.id = bxInt(oSect.ID);

		if (D.CAL.DOM.Exch)
			postData.is_exchange = D.CAL.DOM.Exch.checked ? 'Y' : 'N';

		//if (this.bUser)
		//	postData.private_status = D.CAL.DOM.Status.value;

		if (this.bUser && this.Personal() && D.CAL.DOM.MeetingCalendarCh.checked)
			postData.is_def_meet_calendar = 'Y';

		if (D.CAL.DOM.ExpAllow.checked)
		{
			postData['export'] = 'Y';
			postData.exp_set = D.CAL.DOM.ExpSet ? D.CAL.DOM.ExpSet.value : 'all';
		}

		var _this = this;
		this.Request({
			postData: postData,
			errorText: EC_MESS.CalenSaveErr,
			handler: function(oRes)
			{
				if (oRes && oRes.calendar && oRes.calendar.ID)
				{
					if (oRes.accessNames)
						_this.HandleAccessNames(oRes.accessNames);

					_this.SaveSectionClientSide(oRes.calendar);
					if (_this.bUser &&  _this.Personal() && _this.oSectDialog.CAL.DOM.MeetingCalendarCh.checked && _this.userSettings.meetSection != oRes.calendar.ID)
					{
						_this.userSettings.meetSection = oRes.calendar.ID;
						_this.Event.ReloadAll();
					}
					return true;
				}
				return false;
			}
		});
		return true;
	},

	SaveSectionClientSide : function(oSect)
	{
		if (oSect.EXPORT && !oSect.EXPORT.ALLOW)
			oSect.EXPORT = false;

		// It's new sections
		if (typeof this.arSectionsInd[oSect.ID] == 'undefined')
		{
			this.arSections.push(oSect);
			this.arSectionsInd[oSect.ID] = this.arSections.length - 1;
			this.BuildSectionElement(oSect, true);
			// Feature - we set new section as default for new events.
			this.SaveLastSection(oSect.ID);

			if (this.bSuperpose && this.oSectDialog.CAL.DOM.add2SP)
				this.SetSuperposed(oSect, (!this.oSectDialog || this.oSectDialog.CAL.DOM.add2SP.checked));
		}
		else // Save and update section
		{
			var
				key,
				exSect = this.arSections[this.arSectionsInd[oSect.ID]];
				bCol = !exSect || oSect.COLOR != exSect.COLOR || oSect.TEXT_COLOR != exSect.TEXT_COLOR;

			if (!exSect)
				return;

			// Copy all properties
			for (key in oSect)
				exSect[key] = oSect[key];

			// Rename
			exSect.DOM.pText.innerHTML = BX.util.htmlspecialchars(exSect.NAME);
			if (exSect.DOM.pSPText)
				exSect.DOM.pSPText.innerHTML = BX.util.htmlspecialchars(exSect.NAME);
			exSect.bDark = this.ColorIsDark(exSect.COLOR);

			//if (this.bSuperpose && this.oSectDialog.CAL.DOM.add2SP)
			this.BuildSectionMenu(oSect.ID);
			if (exSect.DOM.pSPEl)
				this.BuildSectionMenu(oSect.ID, true);

			this.UpdateSectionColor(exSect);
			this.ShowCalendar(exSect, exSect.bShowed, true);
		}
	},

	DeleteSection : function(el)
	{
		if (!el.ID || !confirm(EC_MESS.DelCalendarConfirm))
			return false;
		var _this = this;
		this.Request({
			getData: this.GetReqData('section_delete', {id : el.ID}),
			errorText: EC_MESS.DelCalendarErr,
			handler: function(oRes)
			{
				return oRes.result ? _this.DeleteSectionClientSide(el) : false;
			}
		});

		return true;
	},

	DeleteSectionClientSide : function(oSect)
	{
		BX.cleanNode(oSect.DOM.pEl, true);

		if (oSect.DOM.pSPEl)
			BX.cleanNode(oSect.DOM.pSPEl, true);

		var i, l = this.arSections.length;
		for (i = 0; i < l; i++)
		{
			if (this.arSections[i].ID == oSect.ID)
			{
				this.arSections = BX.util.deleteFromArray(this.arSections, i);
				break;
			}
		}

		delete this.oActiveSections[oSect.ID];
		delete this.oSections[oSect.ID];
		this.Event.ReloadAll();
	},

	UpdateSectionColor : function(oSect)
	{
		if (!oSect)
			return;

		var
			color = oSect.COLOR,
			txtColor = oSect.TEXT_COLOR ? oSect.TEXT_COLOR : (oSect.bDark ? this.darkColor : this.brightColor);

		oSect.DOM.pWrap.style.backgroundColor = color;
		oSect.DOM.pText.style.color = txtColor;

		var
			keys = [['oTLParts', 'week'], ['oTLParts', 'day'], ['oDaysT', 'week'], ['oDaysT', 'day']],
			i, l = this.arEvents.length, ev, j, n, x, y;

		for (i = 0; i < l; i++)
		{
			ev = this.arEvents[i];
			if (!ev)
				continue;
			if (ev.SECT_ID != oSect.ID)
				continue;

			// Month
			n = ev.oParts.length;
			for (j = 0; j < n; j++)
			{
				ev.oParts[j].style.backgroundColor = color;
				ev.oParts[j].style.color = txtColor;
			}

			n = keys.length;
			for (j = 0; j < n; j++)
			{
				if (ev[keys[j][0]] && ev[keys[j][0]][keys[j][1]])
				{
					y = ev[keys[j][0]][keys[j][1]];
					if (typeof y == 'object' && y.nodeType)
					{
						y.style.backgroundColor = color;
						y.style.color = txtColor;
					}
					else
					{
						for (x = 0; x < y.length; x++)
						{
							y[x].style.backgroundColor = color;
							y[x].style.color = txtColor;
						}
					}
				}
			}
			ev.displayColor = color;
		}
	},

	InitCalBarGlobChecker : function(bSP)
	{
		return;
		var id, GlCh;
		if (bSP)
		{
			id = this.id + '_sp_cal_bar_check';
			GlCh = 'CalBarGlobCheckerSP';
		}
		else
		{
			id = this.id + '_cal_bar_check';
			GlCh = 'CalBarGlobChecker';
		}

		this[GlCh] = {};
		this[GlCh].pWnd = BX(id);

		this[GlCh].flag = false; //
		this[GlCh].pWnd.title = EC_MESS.DeSelectAll; //

		var _this = this;
		this[GlCh].pWnd.onclick = function()
		{
			if (_this[GlCh].flag) // Show
			{
				_this[GlCh].flag = false;
				_this.ShowAllCalendars(true, bSP);
				_this[GlCh].pWnd.className = 'bxec-iconkit bxec-cal-bar-check';
				_this[GlCh].pWnd.title = EC_MESS.DeSelectAll;
			}
			else // Hide
			{
				_this[GlCh].flag = true;
				_this.ShowAllCalendars(false, bSP);
				_this[GlCh].pWnd.className = 'bxec-iconkit bxec-cal-bar-uncheck';
				_this[GlCh].pWnd.title = EC_MESS.SelectAll;
			}

		};
	},

	ShowAllCalendars : function(bShow, bSP)
	{
		var arCals = bSP ? this.arSPCalendarsShow : this.arSections;
		var i, l = arCals.length;
		for (i = 0; i < l; i++)
		{
			el = arCals[i];
			this.ShowCalendar(el, bShow, true, !bSP);
		}
		this.Event.ReloadAll();
	},

	CheckCalBarGlobChecker : function(bCheck, bSP)
	{
		var GlCh = bSP ? 'CalBarGlobCheckerSP' : 'CalBarGlobChecker';

		if (bCheck == 'none')
		{
			this[GlCh].pWnd.className = 'bxec-cal-bar-none';
			this[GlCh].pWnd.title = '';
		}
		else if (bCheck)
		{

			this[GlCh].flag = false;
			this[GlCh].pWnd.className = 'bxec-iconkit bxec-cal-bar-check';
			this[GlCh].pWnd.title = EC_MESS.DeSelectAll;
		}
		else
		{
			this[GlCh].flag = true;
			this[GlCh].pWnd.className = 'bxec-iconkit bxec-cal-bar-uncheck';
			this[GlCh].pWnd.title = EC_MESS.SelectAll;
		}
	},

	// * * * *  * * * *  * * * * SUPERPOSED CALENDARS, EVENTS  * * * *  * * * *  * * * *
	SetSuperposed : function(oSect, bAdd)
	{
		if(oSect)
			oSect.SUPERPOSED = !!bAdd;

		var
			_this = this, i, arSPIds = [];

		for (i = 0; i < this.arSections.length; i++)
			if (this.arSections[i].SUPERPOSED)
				arSPIds.push(parseInt(this.arSections[i].ID));

		this.Request({
			getData: this.GetReqData('set_superposed', {sect: arSPIds, trackedUser: oSect && oSect.CAL_TYPE == 'user' ? oSect.OWNER_ID : 0}),
			errorText: EC_MESS.AppendSPCalendarErr,
			handler: function(res)
			{
				if (res.result)
				{
					if (!_this.bSuperpose && _this.canAddToSuperpose)
						return BX.reload();
					return _this.BuildSectionElements();
				}
				return  false;
			}
		});
	},

	GetReqData : function(action, O)
	{
		if (!O)
			O = {};
		if (action)
			O.action = action;
		O.sessid = BX.bitrix_sessid();
		O.bx_event_calendar_request = 'Y';
		O.reqId = Math.round(Math.random() * 1000000);

		return O;
	},

	GetCenterWindowPos : function(w, h)
	{
		if (!w) w = 400;
		if (!h) h = 300;
		var S = BX.GetWindowSize(document);
		var top = bxInt(bxInt(S.scrollTop) + (S.innerHeight - h) / 2 - 30);
		var left = bxInt(bxInt(S.scrollLeft) + (S.innerWidth - w) / 2 - 30);
		return {top: top, left: left};
	},

	ShowWaitWindow : function()
	{
		//BX.showWait(this.pCalCnt);
	},

	CloseWaitWindow : function()
	{
		//BX.closeWait(this.pCalCnt);
	},

	ShowStartUpEvent : function()
	{
		for (var i = 0; i < this.arEvents.length; i++)
		{
			if (this.startupEvent.ID == this.arEvents[i].ID)
			{
				var _this = this;
				if (this.startupEvent.EDIT)
					setTimeout(function(){_this.Event.Edit({oEvent: _this.arEvents[i]});}, 50);
				else
					setTimeout(function(){_this.Event.View(_this.arEvents[i]);}, 50);
				this.startupEvent.viewed = true;
				return;
			}
		}
	},

	InitFliper : function(pFliper, strCont)
	{
		return;
		var
			_this = this,
			td = pFliper.parentNode,
			tr = _this[strCont].parentNode.parentNode,
			tbl = BX.findParent(tr, {tagName: 'TABLE'}),
			flag = 'b' + strCont + 'Hidden';

		td.title = EC_MESS.FlipperHide;
		_this[flag] = this.arConfig.Settings[strCont];
		var Hide = function(flag)
		{
			if (_this[flag])
			{
				pFliper.className = 'bxec-iconkit bxec-hide-arrow';
				tbl.style.width = null;
				tr.style.display = BX.browser.IsIE() ? 'inline' : 'table-row';
				td.title = EC_MESS.FlipperHide;
			}
			else
			{
				pFliper.className = 'bxec-iconkit bxec-show-arrow';
				tbl.style.width = tbl.offsetWidth + 'px';
				tr.style.display = 'none';
				td.title = EC_MESS.FlipperShow;
			}
			_this[flag] = !_this[flag];
		};
		td.onclick = function() {Hide(flag); _this.SaveSettings();};
		if (_this[flag])
		{
			_this[flag] = false;
			Hide(flag);
		}
	},

	SaveSettings : function()
	{
		var D = this.oSetDialog;

		// Save user settings
		if (D.CAL.inPersonal)
		{
			this.userSettings.blink = D.CAL.DOM.Blink.checked ? 1 : 0;
			this.userSettings.showBanner = D.CAL.DOM.ShowBanner.checked ? 1 : 0;
			this.userSettings.showDeclined = D.CAL.DOM.ShowDeclined.checked ? 1 : 0;
			this.userSettings.meetSection = D.CAL.DOM.SectSelect.value;
		}
		this.userSettings.showMuted = D.CAL.DOM.ShowMuted.checked ? 1 : 0;

		// Save settings
		var postData = this.GetReqData('save_settings',
			{user_settings: this.userSettings});

		if (this.PERM.access)
		{
			postData.type_access = D.CAL.Access.GetValues();
			// Set access for calendar type
			D.CAL.Access.SetSelected(this.typeAccess);

			this.settings.work_time_start = D.CAL.DOM.WorkTimeStart.value;
			this.settings.work_time_end = D.CAL.DOM.WorkTimeEnd.value;

			this.settings.week_holidays = [];
			for(var i = 0, l = D.CAL.DOM.WeekHolidays.options.length; i < l; i++)
				if (D.CAL.DOM.WeekHolidays.options[i].selected)
					this.settings.week_holidays.push(D.CAL.DOM.WeekHolidays.options[i].value);

			this.settings.year_holidays = D.CAL.DOM.YearHolidays.value;
			this.settings.year_workdays = D.CAL.DOM.YearWorkdays.value;
			//this.settings.week_start = D.CAL.DOM.WeekStart.value;
			postData.settings = this.settings;
		}

		this.Request({
			postData: postData,
			handler: function(oRes)
			{
				BX.reload();
			}
		});
	},

	ClearPersonalSettings: function()
	{
		this.Request({
			postData: this.GetReqData('save_settings', {clear_all: 1}),
			handler: function(){BX.reload();}
		});
	},

	GetUserHref: function(userId)
	{
		return this.pathToUser.replace(/#user_id#/ig, userId);
	},

	GetUserProfileLink : function(uid, bHtml, User, cn, bOwner)
	{
		if (User.type == 'ext')
		{
			var html = '';
			if (User.email)
				html = BX.util.htmlspecialchars(User.email);
			else if (User.name)
				html = BX.util.htmlspecialchars(User.name);

			return html;
		}
		else
		{
			var path = this.arConfig.pathToUser.toLowerCase();
			path = path.replace('#user_id#', uid);

			cn = cn ? ' class="' + cn + '"' : '';

			if (!bHtml)
				return path;

			var html = BX.util.htmlspecialchars(User.name);
			if (bOwner)
				html += ' <span style="font-weight: normal !important;">(' + EC_MESS.Host + ')</span>';

			return '<a' + cn + ' href="' + path + '" target="_blank" title="' + EC_MESS.UserProfile + ': ' + BX.util.htmlspecialchars(User.name) + '" >' + html + '</a>';
		}
	},

	Day : function(day)
	{
		return this.days[{MO: 0,TU: 1,WE: 2, TH: 3,FR: 4,SA: 5,SU: 6}[day]];
	},

	GetWeekDayByInd : function(i)
	{
		return ['SU','MO','TU','WE','TH','FR','SA'][i];
	},

	ConvertDayIndex : function(i)
	{
		if (i == 0)
			return 6;
		return i - 1;
	},

	Request : function(P)
	{
		if (!P.url)
			P.url = this.actionUrl;
		if (P.bIter !== false)
			P.bIter = true;

		if (!P.postData && !P.getData)
			P.getData = this.GetReqData();

		var errorText;
		if (!P.errorText)
			errorText = false;

		var reqId = P.getData ? P.getData.reqId : P.postData.reqId;

		var _this = this, iter = 0;
		var handler = function(result)
		{
			var handleRes = function()
			{
				_this.CloseWaitWindow();
				var erInd = result.toLowerCase().indexOf('bx_event_calendar_action_error');
				if (!result || result.length <= 0 || erInd != -1)
				{
					var errorText = '';
					if (erInd >= 0)
					{
						var
							ind1 = erInd + 'BX_EVENT_CALENDAR_ACTION_ERROR:'.length,
							ind2 = result.indexOf('-->', ind1);
						errorText = result.substr(ind1, ind2 - ind1);
					}
					if (P.onerror && typeof P.onerror == 'function')
						P.onerror();

					return _this.DisplayError(errorText || P.errorText || '');
				}

				var res = P.handler(_this.GetRequestRes(reqId), result);
				if(res === false && ++iter < 20 && P.bIter)
					setTimeout(handleRes, 5);
				else
					_this.ClearRequestRes(reqId);
			};
			setTimeout(handleRes, 50);
		};
		this.ShowWaitWindow();

		if (P.postData)
			BX.ajax.post(P.url, P.postData, handler);
		else
			BX.ajax.get(P.url, P.getData, handler);
	},

	GetRequestRes: function(key)
	{
		if (top.BXCRES && typeof top.BXCRES[key] != 'undefined')
			return top.BXCRES[key];

		return {};
	},

	ClearRequestRes: function(key)
	{
		if (top.BXCRES)
		{
			top.BXCRES[key] = null;
			delete top.BXCRES[key];
		}
	},

	ExtendUserSearchInput : function()
	{
		if (!window.SonetTCJsUtils)
			return;
		var _this = this;
		if (!SonetTCJsUtils.EC__GetRealPos)
			SonetTCJsUtils.EC__GetRealPos = SonetTCJsUtils.GetRealPos;

		SonetTCJsUtils.GetRealPos = function(el)
		{
			var res = SonetTCJsUtils.EC__GetRealPos(el);
			if (_this.oSuperposeDialog && _this.oSuperposeDialog.bShow)
			{
				scrollTop = _this.oSuperposeDialog.oCont.scrollTop;
				res.top = bxInt(res.top) - scrollTop;
				res.bottom = bxInt(res.bottom) - scrollTop;
			}
			return res;
		}
	},

	ParseLocation : function(str, bGetMRParams)
	{
		if (!str)
			str = '';

		var res = {mrid : false, mrevid : false, str : str};
		if (str.length > 5 && str.substr(0, 5) == 'ECMR_')
		{
			var ar_ = str.split('_');
			if (ar_.length >= 2)
			{
				if (!isNaN(parseInt(ar_[1])) && parseInt(ar_[1]) > 0)
					res.mrid = parseInt(ar_[1]);
				if (!isNaN(parseInt(ar_[2])) && parseInt(ar_[2]) > 0)
					res.mrevid = parseInt(ar_[2]);
			}
		}

		if (res.mrid && bGetMRParams === true)
		{
			for (var i = 0, l = this.meetingRooms.length; i < l; i++)
			{
				if (this.meetingRooms[i].ID == res.mrid)
				{
					res.mrind = i;
					res.MR = this.meetingRooms[i];
					break;
				}
			}
		}
		return res;
	},

	RunPlanner: function(params)
	{
		if (!params)
			params = {};

		if (!this.Planner)
		{
			this.Planner = new ECPlanner({
				id: this.id,
				workTime: this.arConfig.workTime,
				meetingRooms: this.bUseMR ? this.meetingRooms : false,
				currentDate: this.currentDate,
				actionUrl : this.actionUrl,
				userId: this.userId,
				config: {
					days: this.days,
					week_holidays: this.week_holidays,
					year_holidays: this.year_holidays
				},
				settings: this.plannerSettings,
				bAddGroupMembers: !this.bExtranet && this.type == 'group',
				AddGroupMembers: BX.proxy(this.AddGroupMembers, this),
				bAMPM: this.bAMPM,
				minWidth: this.bWideDate ? 880 : 760,
				minHeight: this.bWideDate ? 430 : 300,
				pathToUser : this.arConfig.pathToUser
			});

			var _this = this;
			BX.addCustomEvent(this.Planner, 'onSubmit', function(Params)
			{
				var
					D = _this.oEditEventDialog,
					con = D.oController;

				var bDateChanged = !(con.pFromDate.value == Params.fromDate && con.pToDate.value == Params.toDate && con.pFromTime.value == Params.fromTime && con.pToTime.value == Params.toTime);
				con._FromDateValue = con.pFromDate.value = Params.fromDate;
				con.pToDate.value = Params.toDate;
				con._FromTimeValue = con.pFromTime.value = Params.fromTime;
				con.pToTime.value = Params.toTime;

				var bTime = !!(Params.fromTime || Params.toTime);
				con.pFullDay.checked = !bTime;
				con.FullDay(false, bTime);

				// Destination
				BX.SocNetLogDestination.obItemsSelected[editEventDestinationFormName] = BX.SocNetLogDestination.getSelected(plannerDestFormName);
				BX('event-grid-dest-item').innerHTML = BX('event-planner-dest-item').innerHTML;

				if(parseInt(Params.locInd) != Params.locInd)
					Params.locInd = false;
				con.Location.Set(Params.locInd, Params.locValue || '');

				if (Params.attendees.length > 0)
				{
					BX.addClass(con.pAttCont, 'event-grid-dest-cont-full');
					con.pMeetingParams.style.display = 'block';
				}
				else
				{
					BX.removeClass(con.pAttCont, 'event-grid-dest-cont-full');
					con.pMeetingParams.style.display = 'none';
				}
				con.DisplayAttendees(Params.attendees);

				if (bDateChanged)
					con.DestinationOnChange();

				D.show();
			});
		}

		this.Planner.OpenDialog(params);
	},

	OnResize: function(timeout)
	{
		if (this._resizeTimeout)
			this._resizeTimeout = clearTimeout(this._resizeTimeout);

		var _this = this;
		if (timeout !== false)
		{
			this._resizeTimeout = setTimeout(function(){_this.OnResize(false);}, timeout || 200);
			return;
		}
		else
		{
			switch (this.activeTabId)
			{
				case 'month':
					setTimeout(BX.delegate(this.BuildDaysTitle, this), 100);
					break;
				case 'week':
				case 'day':
					this.ResizeTabTitle(this.Tabs[this.activeTabId]);
					break;
			}

			this.bJustRedraw = true;
			this.SetView({month: this.activeDate.month, year: this.activeDate.year});
			setTimeout(function(){_this.bJustRedraw = false;}, 500);
		}
	},

	CreateStrut: function(width)
	{
		return BX.create("IMG", {props: {src: '/bitrix/images/1.gif'}, style: {width: width + 'px', height: '1px'}});
	},

	CheckMouseInCont: function(pWnd, e, d)
	{
		var
			pos = BX.pos(pWnd),
			wndSize = BX.GetWindowScrollPos(),
			x = e.clientX + wndSize.scrollLeft,
			y = e.clientY + wndSize.scrollTop;

		if (typeof d == 'undefined')
			d = 0;

		return (x >= pos.left - d && x <= pos.right + d && y <= pos.bottom + d && y >= pos.top - d);
	},

	SaveConnections: function(Calback, onError)
	{
		var connections = [], i, l = this.arConnections.length, con;
		for (i = 0; i < l; i++)
		{
			con = this.arConnections[i];
			connections.push({
				id: con.id || 0,
				name: con.name,
				link: con.link,
				user_name: con.user_name,
				pass: typeof con.pass == 'undefined' ? 'bxec_not_modify_pass' : con.pass,
				del: con.del ? 'Y' : 'N',
				del_calendars: con.pDelCalendars.checked ? 'Y' : 'N'
			});
		}

		this.Request({
			postData: this.GetReqData('connections_edit', {connections : connections}),
			handler: function()
			{
				setTimeout(function(){
					if (Calback && typeof Calback == 'function')
						Calback(true);
				}, 100);
			},
			onerror: function()
			{
				if (onError && typeof onError == 'function')
					onError();
			}
		});
		return true;
	},

	IsDavCalendar: function(id)
	{
		return this.oSections[id] && (this.oSections[id].IS_EXCHANGE || this.oSections[id].CAL_DAV_CON);
	},

	SyncExchange: function()
	{
		this.Request({
			postData: this.GetReqData('exchange_sync'),
			handler: function(oRes)
			{
				var res = oRes.result;
				setTimeout(function(){
					if (res === true)
						top.window.location = top.window.location;
					else if (res === false)
						alert(EC_MESS.ExchNoSync);
				}, 100);
			}
		});
	},

	Section: function(id)
	{
		var s = {};
		if (this.arSectionsInd[id] && this.arSections[this.arSectionsInd[id]])
			s = this.arSections[this.arSectionsInd[id]];
		return s;
	},

	CanDo: function(action, id)
	{
		var S = this.Section(id);
		return S.ID && S.PERM[action];
	},

	// DefaultAction() - for check and reset
	// DefaultAction(false) - for prevent default action
	DefaultAction: function(mod)
	{
		if(typeof mod == 'undefined' && !this.bDoDefault) //
		{
			this.bDoDefault = true;
			return false;
		}

		if(mod === false) // Custom handler set state
			this.bDoDefault = false;

		return true;
	},

	OnTaskChanged : function(arTask)
	{
		if (!this.oActiveSections['tasks']) // Show tasks
			return this.ShowCalendar(this.oSections['tasks'], true);

		this.Event.ReloadAll();
	},

	OnTaskKilled : function(taskId)
	{
		for (var i = 0, l = this.arEvents.length; i < l; i++)
		{
			if (this.arEvents[i]['~TYPE'] == 'tasks' && this.arEvents[i].ID == taskId)
			{
				this.Event.UnDisplay(this.arEvents[i]);
				break;
			}
		}
	},

	HandleAccessNames: function(arNames)
	{
		for (var code in arNames)
			this.arNames[code] = arNames[code];
	},

	GetAccessName: function(code)
	{
		return this.arNames[code] || code;
	},

	GetMeetingSection: function()
	{
		if (this.userSettings.meetSection && this.oSections[this.userSettings.meetSection])
			return this.userSettings.meetSection;

		return this.arSections[0]['ID'];
	},

	CheckMeetingRoom: function(Params, callback)
	{
		this.Request({
			postData: this.GetReqData('check_meeting_room', Params),
			handler: function(oRes)
			{
				if (oRes)
				{
					if (callback && typeof callback == 'function')
						callback(oRes.check);
					return true;
				}
			}
		});
	},

	AddGroupMembers : function(Params)
	{
		var _this = this, arPost = {};

		this.Request({
			postData: this.GetReqData('get_group_members', arPost),
			handler: function(oRes)
			{
				if (oRes)
				{
					if (oRes.users)
						BX.onCustomEvent(_this, 'onGetGroupMembers', [oRes.users]);
					return true;
				}
			}
		});
	},

	ItsYou: function(userId)
	{
		if (userId == this.userId)
			return '<span class="bxc-it-is-you"> (' + EC_MESS.ItIsYou + ')</span>';
		return '';
	},

	Personal: function()
	{
		return this.type == 'user' && this.ownerId == this.userId;
	},

	GetFreeDialogColor: function()
	{
		var
			result = this.Colors[0],
			ind, colorMap = {}, color;

		for (ind in this.Colors)
			colorMap[this.Colors[ind]] = true;

		for (ind in this.arSections)
		{
			color = this.arSections[ind].COLOR;
			if (colorMap[color])
				colorMap[color] = false;
		}

		for (ind in colorMap)
		{
			if (colorMap[ind])
			{
				result = ind;
				break;
			}
		}

		return result;
	},

	FormatTimeByNum: function(h, m)
	{
		var res = '';
		if (m == undefined)
			m = '00';
		else
		{
			m = parseInt(m, 10);
			if (isNaN(m))
				m = '00';
			else
			{
				if (m > 59)
					m = 59;
				m = (m < 10) ? '0' + m.toString() : m.toString();
			}
		}

		h = parseInt(h, 10);
		if (h > 24)
			h = 24;
		if (isNaN(h))
			h = 0;

		if (this.bAMPM)
		{
			var ampm = 'am';

			if (h == 0)
			{
				h = 12;
			}
			else if (h == 12)
			{
				ampm = 'pm';
			}
			else if (h > 12)
			{
				ampm = 'pm';
				h -= 12;
			}

			res = h.toString() + ':' + m.toString() + ' ' + ampm;
		}
		else
		{
			res = ((h < 10) ? '0' : '') + h.toString() + ':' + m.toString();
		}
		return res;
	},

	ParseTime: function(str)
	{
		var h, m, arTime;
		str = BX.util.trim(str);
		str = str.toLowerCase();

		if (this.bAMPM)
		{
			var ampm = 'pm';
			if (str.indexOf('am') != -1)
				ampm = 'am';

			str = str.replace(/[^\d:]/ig, '');
			arTime = str.split(':');
			h = parseInt(arTime[0] || 0, 10);
			m = parseInt(arTime[1] || 0, 10);

			if (h == 12)
			{
				if (ampm == 'am')
					h = 0;
				else
					h = 12;
			}
			else if (h != 0)
			{
				if (ampm == 'pm' && h < 12)
				{
					h += 12;
				}
			}
		}
		else
		{
			arTime = str.split(':');
			h = arTime[0] || 0;
			m = arTime[1] || 0;

			if (h.toString().length > 2)
				h = parseInt(h.toString().substr(0, 2));
			m = parseInt(m);
		}

		if (isNaN(h) || h > 24)
			h = 0;
		if (isNaN(m) || m > 60)
			m = 0;

		return {h: h, m: m};
	},

	CheckType: function(type, ownerId)
	{
		return this.type == type && this.ownerId == ownerId;
	},

	CheckSectionsCount: function()
	{
		var i;
		for (i = 0; i < this.arSections.length; i++)
		{
			if (this.arSections[i].PERM.edit_section && this.IsCurrentViewSect(this.arSections[i]))
				return true;
		}
		return false;
	},

	GetWeekStart: function()
	{
		return this.weekStart;
	},

	GetWeekDayOffset: function(day)
	{
		if (!this.weekDayOffsetIndex)
		{
			this.weekDayOffsetIndex = {};
			for(var i = 0; i < this.weekDays.length; i++)
				this.weekDayOffsetIndex[this.weekDays[i][2]] = i;
		}
		return this.weekDayOffsetIndex[day];
	},

	SaveLastSection: function(sectionId)
	{
		this.lastSection = parseInt(sectionId);
		BX.userOptions.save('calendar', 'last_section', this.type + '_' + this.ownerId, this.lastSection);
	},

	GetLastSection: function()
	{
		return this.lastSection;
	},

	GetAttendeesByCodes: function(arCodes, callback, from, to, eventId)
	{
		this.Request({
			getData: this.GetReqData('get_attendees_by_codes', {
				codes: arCodes,
				event_from_ts: from || '',
				event_to_ts: to || '',
				cur_event_id: eventId,
				path_to_user: this.arConfig.pathToUser
			}),
			handler: function(oRes)
			{
				if (callback)
					callback(oRes.users);
			}
		});
	}
};



window.bxInt = function(x)
{
	return parseInt(x, 10);
}

window.bxIntEx = function(x)
{
	x = parseInt(x, 10);
	if (isNaN(x)) x = 0;
	return x;
}

window.bxSpCh = function(str)
{
	if (!str)
		return '';
	str = str.replace(/script_>/g, 'script>');
	str = str.replace(/&/g, '&amp;');
	str = str.replace(/"/g, '&quot;');
	str = str.replace(/</g, '&lt;');
	str = str.replace(/>/g, '&gt;');
	return str;
}

window.bxSpChBack = function(str)
{
	if (!str)
		return '';
	str = str.replace(/&lt;/g, '<');
	str = str.replace(/&gt;/g, '>');
	str = str.replace(/&quot;/g, '"');
	str = str.replace(/&amp;/g, '&');
	str = str.replace(/script_>/g, 'script>');
	return str;
}

window.EnterAndNotTextArea = function(e, id)
{
	if(e.keyCode == 13)
	{
		var targ = e.target || e.srcElement;
		if (targ && targ.nodeName && targ.nodeName.toLowerCase() != 'textarea' && targ.id.indexOf(id) == -1)
		{
			BX.PreventDefault(e);
			return true;
		}
	}
	return false;
}

function bxGetDateFromTS(ts, getObject)
{
//	if(!this.browserOffset)
//		this.browserOffset = new Date().getTimezoneOffset() * 60000;
	//var oDate = new Date(ts - this.browserOffset);

	var oDate = new Date(ts);
	if (!getObject)
	{
		var
			ho = oDate.getHours() || 0,
			mi = oDate.getMinutes() || 0;

		oDate = {
			date: oDate.getDate(),
			month: oDate.getMonth() + 1,
			year: oDate.getFullYear(),
			bTime: !!(ho || mi),
			oDate: oDate
		};

		if (oDate.bTime)
		{
			oDate.hour = ho;
			oDate.min = mi;
		}
	}

	return oDate;
}

window.bxFormatDate = function(d, m, y)
{
	var str = BX.message("FORMAT_DATE");

	str = str.replace(/YY(YY)?/ig, y);
	str = str.replace(/MMMM/ig, BX.message('MONTH_'+this.Number(m)));
	str = str.replace(/MM/ig, zeroInt(m));
	str = str.replace(/M/ig, BX.message('MON_' + this.Number(m)));
	str = str.replace(/DD/ig, zeroInt(d));

	return str;
}

window.bxGetPixel = function(bFlip)
{
	var q = BX.browser.IsIE() || BX.browser.IsOpera();
	if (bFlip)
		q = !q;
	return q ? 0 : 1;
}

window.zeroInt = function(x)
{
	x = bxInt(x);
	if (isNaN(x))
		x = 0;
	return x < 10 ? '0' + x.toString() : x.toString();
}

window.DenyDragEx = function(pEl)
{
	pEl.style.MozUserSelect = 'none';
	pEl.ondrag = BX.False;
	pEl.ondragstart = BX.False;
	pEl.onselectstart = BX.False;
}

JCEC.prototype.LoadEvents = function(m, y, P)
{
	if (m == undefined)
		m = this.activeDate.month;
	if (y == undefined)
		y = this.activeDate.year;
	if (P == undefined)
		P = {};

	var
		ameetid = [],
		i, _this = this,
		active = [],
		hidden = [];

	for (i in this.oActiveSections)
	{
		if (i != 'tasks')
		{
			i = parseInt(i);
			if (i < 0 || isNaN(i))
				continue;
		}

		if (this.oActiveSections[i])
		{
			active.push(i);
			if (this.oSections[i] && this.oSections[i]['~IS_MEETING_FOR_OWNER'])
				ameetid.push({ID: this.oSections[i]['OWNER_ID'], SECTION_ID: this.oSections[i]['ID']});
		}
		else
		{
			hidden.push(i);
		}
	}

	this.Request({
		getData: this.GetReqData('load_events', {
			month: parseInt(m, 10) + 1,
			year: y,
			usecl: 'Y',
			ameetid: ameetid,
			sa: active, // section - active
			sh: hidden, // section - hidden,
			cal_dav_data_sync: this.bSyncGoogle ? 'Y' : 'N'
		}),
		errorText: EC_MESS.LoadEventsErr,
		handler: function(oRes)
		{
			_this.bSyncGoogle = false;
			_this.HandleLoadedEvents({
				events: oRes.events,
				attendees: oRes.attendees,
				month: m,
				year: y,
				Params: P
			});
		}
	});
};

JCEC.prototype.HandleLoadedEvents = function(P)
{
	this.HandleEvents(P.events, P.attendees);

	this.arLoadedMonth[P.month + '.' + P.year] = true;
	if (!P.Params)
		P.Params = {};
	if (isNaN(bxInt(P.Params.month)))
		P.Params.month = P.month;
	if (isNaN(bxInt(P.Params.year)))
		P.Params.year = P.year;

	this.SetView(P.Params);
};

JCEC.prototype.HandleEvents = function(events, attendees)
{
	var i, e, a, sid, id;
	if (events && events.length)
	{
		for (i = 0; i < events.length; i++)
		{
			e = this.Event.PreHandle(events[i]);
			sid = this.Event.SmartId(e);
			if (!e.ID)
				continue;

			if (this.arLoadedEventsId[sid])
				continue;

			this.arEvents.push(e);
			this.arLoadedEventsId[sid] = true;
		}
	}

	if(attendees)
	{
		for (i in attendees)
		{
			id = parseInt(i, 10);
			a = attendees[i];
			if (!isNaN(id) && a && a.length)
				this.arAttendees[id] = a;
		}
	}
};

// BUILDING MONTH
JCEC.prototype.BuildEventHolder = function()
{
	if (this.EventHolderCont)
	{
		BX.cleanNode(this.EventHolderCont, true);
		this.EventHolderCont = null;
	}
	this.EventHolderCont = this.DaysGridCont.appendChild(BX.create('DIV', {props: {className : 'bxec-event-holder'}}));

	var _this = this;
	var c = this.oDaysGridTable.rows[0].cells[0];

	setTimeout(function()
	{
		_this.arCellCoords = {};
		for (var d = 0; d < 7; d ++)
		{
			_this.arCellCoords[d] = {
				left: bxInt(_this.oDaysGridTable.rows[0].cells[d].offsetLeft),
				width: bxInt(_this.oDaysGridTable.rows[0].cells[d].offsetWidth) + bxGetPixel(true)
			};
			if (d / 2 == Math.round(d / 2))
				_this.arCellCoords[d].width += bxGetPixel();
		}
		_this.dayCellHeight = parseInt(c.offsetHeight);
		_this.dayCellWidth = parseInt(c.offsetWidth);

		_this.DisplayEventsMonth();
	}, 10);
}

JCEC.prototype.EventClick = function(e)
{
	if (!e)
		e = window.event;

	var
		ind, action, ev_action, oEvent,
		o = e.target || e.srcElement;

	while(o)
	{
		if (o.getAttribute)
		{
			ind = parseInt(o.getAttribute('data-bx-event-ind'));
			action = o.getAttribute('data-bx-event-action');
			if (action)
				ev_action = action;

			if (!isNaN(ind) && this.arEvents[ind])
			{
				oEvent = this.arEvents[ind];
				if (!ev_action || ev_action == 'view')
				{
					this.Event.View(oEvent);
				}
				else if(ev_action == 'edit')
				{
					this.Event.Edit({oEvent: oEvent});
				}
				else if(ev_action == 'del')
				{
					if (this.Event.IsAttendee(oEvent) && !this.Event.IsHost(oEvent))
					{
						if(oEvent.USER_MEETING.STATUS != 'N')
							this.Event.SetMeetingStatus(false, {eventId: bxInt(oEvent.ID), comment: ''});
					}
					else if(oEvent['~TYPE'] != 'tasks')
					{
						this.Event.Delete(oEvent);
					}
				}

				if (this.MoreEventsWin)
					this.MoreEventsWin.close();

				break;
			}
		}
		o = o.parentNode;
	}
}

JCEC.prototype.DisplayEventsMonth = function(bRefresh)
{
	var i, l;
	if (bRefresh || this.bJustRedraw) // Redisplay all events
	{
		BX.cleanNode(this.EventHolderCont);
		for (i = 0, l = this.activeDateDaysArO.length; i < l; i++)
			this.activeDateDaysArO[i].arEvents = {begining : [], all : []};
	}
	else
	{
		this.activeFirst = this.activeDateDaysAr[0].getTime();
		this.activeLast = this.activeDateDaysAr[this.activeDateDaysAr.length - 1].getTime();
	}

	for (i = 0, l = this.arEvents.length; i < l; i++)
		if (this.arEvents[i])
			this.HandleEventMonth(this.arEvents[i], i);

	this.RefreshEventsOnWeeks([0, 1, 2, 3, 4, 5]);
}

JCEC.prototype.HandleEventMonth = function(el, ind, arPrehandle)
{
	var d_from, d_to, _d_from, _d_to;
	//this.arLoadedEventsId[this.Event.SmartId(el)] = true;

	el = this.HandleEventCommon(el, ind);

	if (!el)
		return;
	el.oParts = [];
	el.oWeeks = [];

	if (!arPrehandle)
	{
		d_from = bxGetDateFromTS(el.DT_FROM_TS);
		d_to = bxGetDateFromTS(el.DT_TO_TS);

		// Works only for events with 24:00 ent time - in the end of the day for  correct displaying
		if (d_from.bTime && !d_to.bTime)
			d_to = bxGetDateFromTS(el.DT_TO_TS - 60 * 60 * 24);

		d_from = {
			date: d_from.date,
			month: d_from.month - 1,
			year: d_from.year
		};

		d_to = {
			date: d_to.date,
			month: d_to.month - 1,
			year: d_to.year
		};

		_d_from = new Date(d_from.year, d_from.month, d_from.date).getTime();
		_d_to = new Date(d_to.year, d_to.month, d_to.date).getTime();
	}
	else
	{
		d_from = arPrehandle.d_from;
		d_to = arPrehandle.d_to;
		_d_from = arPrehandle._d_from;
		_d_to = arPrehandle._d_to;
	}

	if (_d_from > _d_to || _d_to < this.activeFirst || _d_from > this.activeLast)
		return;

	var arInit = {
		real_from: d_from,
		real_to: d_to,
		from: _d_from,
		to: _d_to,
		real_from_t: _d_from,
		real_to_t: _d_to
	};

	if (_d_from < this.activeFirst && _d_to < this.activeLast) // event started earlier but ends in the active period
	{
		arInit.from = this.activeFirst;
	}
	else if (_d_from > this.activeFirst && _d_to > this.activeLast) // The event began in the active period, but will end in the future
	{
		arInit.to = this.activeLast;
	}
	else if (_d_from < this.activeFirst && _d_to > this.activeLast) // Event started earlier and ends later
	{
		arInit.from = this.activeFirst;
		arInit.to = this.activeLast;
	}

	el.display = true;
	var bInPast = el.DT_TO_TS + 300 /* 5 min */ < new Date().getTime();
	el.bMuted = this.userSettings.showMuted && bInPast;

	this.DisplayEvent_M(arInit, el);

	if (!bInPast)
		this.Event.Blink(el, true, true);
}

JCEC.prototype.HandleEventCommon = function(ev, ind)
{
	if(!this.userSettings.showDeclined && ev.USER_MEETING && ev.USER_MEETING.STATUS == 'N' && ev.MEETING_HOST != this.userId && (!this.startupEvent || (this.startupEvent && this.startupEvent.ID != ev.ID)))
		return false;

	if (!ev.oParts)
		ev.oParts = [];
	if (!ev.oWeeks)
		ev.oWeeks = [];

	ev.ind = ind;
	ev = this.Event.SetColor(ev);

	return ev;
}

JCEC.prototype.DisplayEvent_M = function(arInit, oEvent)
{
	var
		date, j, n,
		dayOffset,
		arEvParams = {partDaysCount: 0},
		bEventStart = false,
		bEventEnd = false;

	for (j = 0, n = this.activeDateDaysAr.length; j < n; j++)
	{
		date = this.activeDateDaysAr[j];
		dayOffset = this.GetWeekDayOffset(this.GetWeekDayByInd(date.getDay()));

		if (date.getTime() == arInit.from)
		{
			bEventStart = true;
			arEvParams = {left: this.arCellCoords[dayOffset].left + 1, arInit: arInit, dayIndex: j, partDaysCount: 0};
		}
		arEvParams.partDaysCount++;

		if (!bEventStart)
			continue;

		this.activeDateDaysArO[j].arEvents.all.push({oEvent: oEvent, partInd: oEvent.oParts.length, daysCount: arEvParams.partDaysCount});
		if (dayOffset == 6)
		{
			bEventEnd = date.getTime() == arInit.to;
			arEvParams.width = this.arCellCoords[dayOffset].left + this.arCellCoords[dayOffset].width - arEvParams.left - 3;
			arEvParams.bEnd = bEventEnd && arInit.to == arInit.real_to_t;
			this.BuildEventDiv(arEvParams, oEvent);
			if (bEventEnd)
				break;
		}

		if (!bEventEnd && dayOffset == 0 && date.getTime() != arInit.from)
			arEvParams = {left: this.arCellCoords[0].left + 1, arInit: arInit, dayIndex: j, partDaysCount: 1};

		if (date.getTime() == arInit.to)
		{
			bEventEnd = true;
			arEvParams.width = this.arCellCoords[dayOffset].left + this.arCellCoords[dayOffset].width - arEvParams.left - 3;
			arEvParams.bEnd = true;
			this.BuildEventDiv(arEvParams, oEvent);
			break;
		}
	}
}

JCEC.prototype.BuildEventDiv = function(arAtr, oEvent)
{
	if (parseInt(arAtr.width) <= 0)
		return;

	var oDiv, t, r, c;
	this.activeDateDaysArO[arAtr.dayIndex].arEvents.begining.push({oEvent: oEvent, partInd: oEvent.oParts.length, daysCount: arAtr.partDaysCount});

	var
		isTask = this.Event.IsTask(oEvent),
		isCrm = this.Event.IsCrm(oEvent);

	var cn = 'bxec-event';

	if(oEvent.bMuted)
		cn += ' bxec-event-muted';

	oDiv = BX.create('DIV', {props: {className : cn}, style: {left: arAtr.left + 'px', width: bxInt(arAtr.width) + 'px', minWidth: bxInt(arAtr.width) + 'px', display: 'none', backgroundColor: oEvent.displayColor, color: oEvent.displayTextColor}});

	t = oDiv.appendChild(BX.create('TABLE'));
	r = t.insertRow(-1);

	var _this = this;
	if (oEvent.oParts.length > 0 || arAtr.arInit.real_from_t < arAtr.arInit.from)
		BX.adjust(r.insertCell(-1), {props: {className: 'bxec-event-ar'}, html: '<i></i>'});

	var
		bEnc = this.Event.IsMeeting(oEvent),
		statQ = this.Event.GetQuestIcon(oEvent),
		titleCell = r.insertCell(-1),
		typeIcon = '';

	if (bEnc)
		typeIcon = '<i class="bxc-e-meeting"></i>';
	if (isTask)
		typeIcon = '<i class="bxc-e-task"></i>';
	if (isCrm && !isTask)
		typeIcon = '<i class="bxc-e-crm"></i>';

	titleCell.innerHTML = '<div class="bxec-event-title">' + typeIcon + '<span class="bxec-event-label"' + this.Event.GetLabelStyle(oEvent) + '>' + statQ + BX.util.htmlspecialchars(oEvent.NAME) + '</span></div>';

	this.Event.BuildActions({cont: titleCell, oEvent: oEvent, evCont: oDiv});
	if (!arAtr.bEnd)
		BX.adjust(r.insertCell(-1), {props: {className: 'bxec-event-ar'}, html: '<b></b>'});

	oDiv.onmouseover = function(){_this.HighlightEvent_M(oEvent, this);};
	oDiv.onmouseout = function(){_this.HighlightEvent_M(oEvent, this, true);}
	oDiv.ondblclick = function(){_this.Event.View(oEvent);};

	oDiv.setAttribute('data-bx-event-ind', oEvent.ind);

	// Drag & Drop
	this.dragDrop.RegisterEvent(oDiv, oEvent, 'month');

	oEvent.oWeeks.push({dayIndex: arAtr.dayIndex, bEnd: arAtr.bEnd});
	oEvent.oParts.push(oDiv);

	// Applied only for last days on the week. mantis #0045907
	if ((arAtr.dayIndex + 1) % 7 == 0)
		titleCell.firstChild.style.maxWidth = bxInt(arAtr.width) + 'px';

	this.EventHolderCont.appendChild(oDiv);
}

JCEC.prototype.HighlightEvent_M = function(oEvent, pEl, bUn)
{
	if (!oEvent || !oEvent.oParts || oEvent.oParts.length == 0)
		return;

	var i, l, f = bUn ? BX.removeClass : BX.addClass;

	for (i = 0, l = oEvent.oParts.length; i < l; i++)
		f(oEvent.oParts[i], 'bxec-event-over');

	if (pEl)
		f(pEl, 'bxec-event-over');

	if (oEvent.pMoreDivs)
		for (i = 0, l = oEvent.pMoreDivs.length; i < l; i++)
			f(oEvent.pMoreDivs[i], 'bxec-event-over');
}

JCEC.prototype.GetEventWeeks = function(oEvent)
{
	var dind, j, arWeeks = [], i, l;
	for (i = 0, l = oEvent.oParts.length; i < l; i++)
	{
		dind = oEvent.oWeeks[i].dayIndex;
		for (j = 0; j < 6; j++)
		{
			if (dind >= j * 7 && dind < (j + 1) * 7)
			{
				arWeeks.push(j);
				break;
			}
		}
	}
	return arWeeks;
}

// ####################################################################################

JCEC.prototype.BuildWeekEventHolder = function()
{
	if (this._bBETimeOut)
		clearTimeout(this._bBETimeOut);

	var _this = this;

	this._bBETimeOut = setTimeout(
		function()
		{
			var Tab = _this.Tabs[_this.activeTabId || _this.userSettings.tabId];
			// Days title event holder;
			if (!Tab.pEventHolder)
				Tab.pEventHolder = Tab.pBodyCont.rows[0].cells[0].firstChild;

			if (_this.bJustRedraw)
				_this.ReBuildEvents(Tab.id);
			else
				_this.DisplayWeekEvents(Tab);
		},
		0
	);
}

JCEC.prototype.DisplayWeekEvents = function(Tab)
{
	BX.cleanNode(Tab.pEventHolder);
	for (var i = 0, l = this.arEvents.length; i < l; i++)
		if (this.arEvents[i])
			this.HandleEventWeek({Tab : Tab, Event: this.arEvents[i], ind: i});

	this.RefreshEventsInDayT(Tab);
	this.ArrangeEventsInTL(Tab);
}

JCEC.prototype.ReBuildEvents = function(tabId)
{
	var
		Tab = this.Tabs[tabId],
		cont = Tab.pTimelineCont,
		node, i, l, oDay;

	BX.cleanNode(Tab.pEventHolder);

	for (i = 0; i < Tab.daysCount; i++) // Clean days params
	{
		oDay = Tab.arDays[i];
		oDay.TLine = {};
		oDay.Events = {begining: [], hidden: [], all: []};
		oDay.EventsCount = 0;
	}

	l = cont.childNodes.length;
	i = 0;
	while (i < l)
	{
		node = cont.childNodes[i];
		if (node.className.toString().indexOf('bxec-tl-event') == -1)
		{
			i++;
			continue;
		}
		cont.removeChild(node);
		l = cont.childNodes.length;
	}
	this.DisplayWeekEvents(Tab);
}

JCEC.prototype.HandleEventWeek = function(P)
{
	var ev = this.HandleEventCommon(P.Event, P.ind);
	if (!ev)
		return;

	if (!ev.oDaysT)
		ev.oDaysT = {};
	if (!ev.oTLParts)
		ev.oTLParts = {};

	ev.oTLParts[P.Tab.id] = [];

	var
		_d_from = ev.DT_FROM_TS,
		_d_to = ev.DT_TO_TS,
		d_from = bxGetDateFromTS(_d_from),
		d_to = bxGetDateFromTS(_d_to);

	// Event is out of view area
	if (_d_to < P.Tab.activeFirst || _d_from > P.Tab.activeLast)
		return;

	// for excluding displaying events ended in the 00:00
	if (ev.DT_SKIP_TIME != 'Y' && _d_to == P.Tab.activeFirst && _d_to !== _d_from)
		return;

	// Works only for events with 24:00 ent time - in the end of the day for  correct displaying
	if (d_from.bTime && !d_to.bTime)
		_d_to -= 1000;

	var arInit = {
		real_from: d_from,
		real_to: d_to,
		from: _d_from,
		to: _d_to,
		real_from_t: _d_from,
		real_to_t: _d_to
	};

	if (_d_from < P.Tab.activeFirst && _d_to <= P.Tab.activeLast) // event started earlier but ends in the active period
	{
		arInit.from = P.Tab.activeFirst;
	}
	else if (_d_from >= P.Tab.activeFirst && _d_to > P.Tab.activeLast) // The event began in the active period, but will end in the future
	{
		arInit.to = P.Tab.activeLast;
	}
	else if (_d_from < P.Tab.activeFirst && _d_to > P.Tab.activeLast) // Event started earlier and ends later
	{
		arInit.from = P.Tab.activeFirst;
		arInit.to = P.Tab.activeLast;
	}

	ev.display = true;
	var bInPast = ev.DT_TO_TS + 300 /* 5 min */ < new Date().getTime();
	ev.bMuted = this.userSettings.showMuted && bInPast;

	//if(!d_from.bTime && !d_to.bTime)
	if(P.Event.DT_SKIP_TIME == "Y") // Display event on the top sector
		this.DisplayEvent_DT(arInit, ev, P.Tab);
	else  // Display event on the TIMELINE
		this.DisplayEvent_TL(arInit, ev, P.Tab);

	if (!bInPast)
		this.Event.Blink(ev, true, true);
}

JCEC.prototype.DisplayEvent_DT = function(arInit, oEvent, Tab)
{
	var
		_this = this,
		bEventStart = false,
		day_from = this.ConvertDayIndex(new Date(arInit.from).getDay()),
		day_to = this.ConvertDayIndex(new Date(arInit.to).getDay()),
		_event = {oEvent : oEvent, daysCount: day_to - day_from + 1},
		startDay,
		endDay,
		isTask = this.Event.IsTask(oEvent),
		isCrm = this.Event.IsCrm(oEvent),
		typeIcon = '',
		i, oDay;

	for (i = 0; i < Tab.daysCount; i++)
	{
		oDay = Tab.arDays[i];
		if (oDay.day == day_from)
		{
			startDay = oDay;
			bEventStart = true;
			oDay.Events.begining.push(_event);
		}
		if (!bEventStart)
			continue;
		oDay.Events.all.push(_event);
		oDay.EventsCount++;
		if (oDay.day == day_to)
		{
			endDay = oDay;
			break;
		}
	}

	var
		left = bxInt(startDay.pWnd.offsetLeft) + 2 - bxGetPixel(),
		right = bxInt(endDay.pWnd.offsetLeft) + bxInt(endDay.pWnd.offsetWidth),
		width = right - left - 5,

		// Build div
		oDiv = BX.create('DIV', {props: {className : 'bxec-event'}, style: {left: left.toString()+ 'px', width: width.toString() + 'px', backgroundColor: oEvent.displayColor, color: oEvent.displayTextColor}}),
		t = oDiv.appendChild(BX.create('TABLE')),
		r = t.insertRow(-1);
	oEvent.oDaysT[Tab.id] = oDiv;

	oDiv.setAttribute('data-bx-event-ind', oEvent.ind);

	if(oEvent.bMuted)
		BX.addClass(oDiv, 'bxec-event-muted');

	if (arInit.real_from_t < arInit.from)
	{
		c = r.insertCell(-1);
		c.innerHTML = '<img class="bxec-iconkit" src="/bitrix/images/1.gif">';
		c.className = 'bxec-event-ar-l';
	}

	if (this.Event.IsMeeting(oEvent))
		typeIcon = '<i class="bxc-e-meeting"></i>';
	if (isTask)
		typeIcon = '<i class="bxc-e-task"></i>';
	if (isCrm && !isTask)
		typeIcon = '<i class="bxc-e-crm"></i>';

	var
		statQ = this.Event.GetQuestIcon(oEvent),
		titleCell = r.insertCell(-1);
	titleCell.innerHTML = '<div class="bxec-event-title">' + typeIcon + '<span class="bxec-event-label"' + this.Event.GetLabelStyle(oEvent) + '>' + statQ + BX.util.htmlspecialchars(oEvent.NAME) + '</span></div>';

	this.Event.BuildActions({cont: titleCell, oEvent: oEvent, evCont: oDiv});
	oDiv.onmouseover = function(){_this.HighlightEvent_DT(this);};
	oDiv.onmouseout = function(){_this.HighlightEvent_DT(this, true);}
	oDiv.ondblclick = function(){_this.Event.View(oEvent);};

	// Drag & Drop
	this.dragDrop.RegisterEvent(oDiv, oEvent, 'week_title');

	Tab.pEventHolder.appendChild(oDiv);
}

JCEC.prototype.DisplayEvent_TL = function(arInit, oEvent, Tab)
{
	var
		bEventStart = false,
		nd_f = new Date(arInit.from),
		nd_t = new Date(arInit.to),
		day_from = this.ConvertDayIndex(nd_f.getDay()),
		day_to = this.ConvertDayIndex(nd_t.getDay()),
		h_from = nd_f.getHours() || 0,
		m_from = nd_f.getMinutes() || 0,
		h_to = nd_t.getHours(),
		m_to = nd_t.getMinutes(),
		startDay,
		endDay,
		i, oDay;

	if (!nd_t)
	{
		h_to = 23;
		m_to = 59;
	}
	else if (arInit.from == arInit.to)
	{
		if (m_to == 59)
		{
			h_to++;
			m_to = 00;
		}
		else
		{
			m_to++;
		}
	}
	else
	{
		if (m_to == 0)
		{
			h_to--;
			m_to = 59;
		}
		else if(m_to > 1)
		{
			m_to--;
		}
	}

	for (i = 0; i < Tab.daysCount; i++)
	{
		oDay = Tab.arDays[i];
		if (oDay.day == day_from)
		{
			startDay = oDay;
			bEventStart = true;
		}
		if (!bEventStart)
			continue;

		if (oDay.day == day_to)
		{
			endDay = oDay;
			break;
		}
	}

	if (startDay && endDay)
	{
		this._SetTimeEvent(startDay, h_from, m_from, {oEvent : oEvent, bStart: true, arInit: arInit});
		this._SetTimeEvent(endDay, h_to, m_to, {oEvent : oEvent, bStart: false, arInit: arInit});
	}
}

JCEC.prototype._SetTimeEvent = function(oDay, h, m, oEv)
{
	if (!oDay.TLine)
		oDay.TLine = {};
	h = bxInt(h);
	m = bxInt(m);

	if (!oDay.TLine[h])
		oDay.TLine[h] = {};
	if (!oDay.TLine[h][m])
		oDay.TLine[h][m] = [];

	oDay.TLine[h][m].push(oEv);
}

JCEC.prototype.HighlightEvent_DT = function(pWnd, bHide)
{
	var f = bHide ? BX.removeClass : BX.addClass;
	f(pWnd, 'bxec-event-over');
}

JCEC.prototype.RefreshEventsInDayT = function(Tab)
{
	var
		slots = [],
		step = 0,
		max = 3,
		day, i, arEv, j, ev, arAll, dis, arHid, top;

	for(j = 0; j < max; j++)
		slots[j] = 0;


	for (i = 0; i < Tab.daysCount; i++)
	{
		day = Tab.arDays[i];
		arEv = day.Events.begining;
		n = arEv.length;
		arHid = [];
		if (n > 0)
		{
			arEv.sort(function(a, b){return b.daysCount - a.daysCount});
			eventloop:
			for(k = 0; k < n; k++)
			{
				ev = arEv[k];
				if (!ev)
					continue;

				if (!this.arEvents[ev.oEvent.ind])
				{
					day.Events.begining = arEv = BX.util.deleteFromArray(arEv, k);
					ev = arEv[k];
					if (!ev)
						continue;
				}

				for(j = 0; j < max; j++)
				{
					if (slots[j] - step <= 0)
					{
						slots[j] = step + ev.daysCount;
						top = 21 + j * 18;
						ev.oEvent.oDaysT[Tab.id].style.top = (21 + j * 18).toString() + 'px';
						continue eventloop;
					}
				}
				arHid[ev.oEvent.ID] = true;
				day.Events.hidden.push(ev);
			}
		}
		// For all events in the day
		arAll = day.Events.all;
		for (var x = 0, f = arAll.length; x < f; x++)
		{
			ev = arAll[x];
			if (!ev || arHid[ev.oEvent.ID])
				continue;
			if (!this.arEvents[ev.oEvent.ind])
			{
				day.Events.all = arAll = BX.util.deleteFromArray(arAll, x);
				ev = arAll[x];
				if (!ev)
					continue;
			}
			dis = ev.oEvent.oDaysT[Tab.id].style.display;
			if (dis && dis.toLowerCase() == 'none')
				day.Events.hidden.push(ev);
		}
		this.ShowMoreEventsSelectWeek(day, Tab.id);
		step++;
	}
}

JCEC.prototype.ShowMoreEventsSelectWeek = function(oDay, tabId)
{
	var
		_this = this,
		arEv = oDay.Events.hidden,
		l = arEv.length,
		arHidden = [],
		pMoreDiv = oDay.pMoreEvents.firstChild,
		i, el, p;

	if (l <= 0)
	{
		pMoreDiv.style.display = 'none';
		return;
	}

	for (i = 0; i < l; i++)
	{
		el = arEv[i];
		p = el.oEvent.oDaysT[tabId];
		p.style.display = "none"; // Hide event
		arHidden.push({pDiv: p, oEvent: el.oEvent});
	}

	pMoreDiv.style.display = 'block';
	pMoreDiv.innerHTML = EC_MESS.MoreEvents + ' (' + l + ' ' + EC_MESS.Item + ')';
	pMoreDiv.onmousedown = function(e){if(!e) e = window.event; BX.PreventDefault(e);};
	pMoreDiv.onclick = function(e){_this.ShowMoreEventsWin({Events: arHidden, id: 'day_t_' + tabId + oDay.day, pDay: oDay.pWnd, mode: 'day_t', pSelect: pMoreDiv});};
}

JCEC.prototype.ArrangeEventsInTL = function(Tab)
{
	try{ //
	var
		bStarted = false,
		h, m, e, pDiv, _e, leftDrift,
		arProceed = {},
		procCnt = 0,
		procRows = 0,
		_row,
		RowSet,
		Rows,
		Row,
		bClosedAllRows, // All rows finished, start new row in rowset
		startedEvents = {},
		startedEventsCount = 0,
		arAll = [],
		Day, i, arEv, ev;

	for (i = 0; i < Tab.daysCount; i++) // For every day
	{
		Day = Tab.arDays[i];
		RowSet = [];

		if (startedEventsCount > 0)
		{
			if (!Day.TLine)
				Day.TLine = {};
			for (_e in startedEvents)
			{
				if (startedEvents[_e] && typeof startedEvents[_e] == 'object' && startedEvents[_e].oEvent)
				{
					if (!Day.TLine['0'])
						Day.TLine['0'] = {};
					if (!Day.TLine['0']['0'])
						Day.TLine['0']['0'] = [];
					Day.TLine['0']['0'].push({oEvent : startedEvents[_e].oEvent, bStart: true, dontClose: false, arInit: startedEvents[_e].arInit});
				}
			}
		}
		if (!bStarted && !Day.TLine)
			continue;
		bClosedAllRows = true;

		if (Day.TLine) // some events starts or ends in this day
		{
			for (h = 0; h <= 23; h++) // hour loop
			{
				if (!Day.TLine[h] && h != 23)
					continue;
				for (m = 0; m < 60; m++) // minutes loop
				{
					arEv = Day.TLine[h] && Day.TLine[h][m] ? Day.TLine[h][m] : false;
					if (h == 23 && m == 59)
					{
						if (arEv === false)
							arEv = [];
						for (_e in startedEvents)
						{
							if (startedEvents[_e] && typeof startedEvents[_e] == 'object' && startedEvents[_e].oEvent)
								arEv.push({oEvent : startedEvents[_e].oEvent, bStart: false, dontClose: true, arInit: startedEvents[_e].arInit});
						}
					}

					if (!arEv)
						continue;

					// TODO: Sort by event length
					for (e = 0; e < arEv.length; e++) // events in current moment
					{
						ev = arEv[e];
						if (ev.bStart) // Event START
						{
							startedEvents[ev.oEvent.ID] = ev;
							startedEventsCount++;
							if (bClosedAllRows)
								RowSet.push([]);
							Rows = RowSet[RowSet.length - 1];
							freeRowId = false;
							bClosedAllRows = false;
							if (Rows.length > 1)
							{
								for(r = 0, rl = Rows.length; r < rl; r++)
								{
									Row = Rows[r];
									if (!Row.bFilled)
									{
										freeRowId = r;
										break;
									}
								}
							}
							_row = {
								bFilled: true,
								evId: ev.oEvent.ID,
								h_f: h,
								m_f: m
							};
							if (freeRowId !== false) // we have free row
							{
								_row.arEvents = Rows[freeRowId].arEvents;
								Rows[freeRowId] = _row;
							}
							else // push new row
							{
								Rows.push(_row);
							}
						}
						else // Event END
						{
							bClosedAllRows = true;
							if (!ev.dontClose)
							{
								startedEvents[ev.oEvent.ID] = false;
								startedEventsCount--;
							}

							for(r = 0, rl = Rows.length; r < rl; r++)
							{
								Row = Rows[r];
								if (Row.bFilled && Row.evId == ev.oEvent.ID)
								{
									Row.bFilled = false;
									pDiv = this.BuildEventDiv_TL(
										{
											Tab: Tab,
											dayInd: i,
											from: {h: Row.h_f, m: Row.m_f},
											to: {h: h, m: m},
											oEvent: ev.oEvent,
											arInit: ev.arInit,
											lastPart: !ev.dontClose
										}
									); // Build div
									if (!Row.arEvents)
										Row.arEvents = [pDiv];
									else
										Row.arEvents.push(pDiv);
								}
								if (Row.bFilled && bClosedAllRows)
									bClosedAllRows = false;
							}
						}
					}
				}
			}
		}

		var
			cell = Tab.pTimelineTable.rows[0].cells[i + 1],
			arRS, rs, rsl, rowsCount, rowWidth, r, rl, rw, pEv,
			sWidth = cell.offsetWidth - 15;

		for (rs = 0, rsl = RowSet.length; rs < rsl; rs++) // For each rowset
		{
			arRS = RowSet[rs];
			rowsCount = arRS.length;
			rowWidth = Math.round((sWidth - rowsCount) / rowsCount);
			for (r = 0; r < arRS.length; r++) // For each row
			{
				Row = arRS[r];
				if (r == 0) // first row
				{
					rw = rowWidth;
					leftDrift = bxInt(Row.arEvents[0].style.left);
					rl = false;
				}
				else
				{
					leftDrift += rowWidth + 1;
					rl = leftDrift;
					if (r == arRS.length- 1) // last row
						rw = sWidth - (rowWidth + 1) * (arRS.length- 1) - 1;
					else
						rw = rowWidth;
				}
				for (e = 0; e < Row.arEvents.length; e++) // For each event
				{
					pEv = Row.arEvents[e];
					pEv.style.width = rw + 'px';
					pEv.style.minWidth = rw + 'px';

					if (rl !== false)
						pEv.style.left = rl + 'px';
				}
			}
		}
	}
	}catch(e){}
}

JCEC.prototype.BuildEventDiv_TL = function(P)
{
	var
		_this = this,
		oEvent = P.oEvent,
		isTask = this.Event.IsTask(oEvent),
		isCrm = this.Event.IsCrm(oEvent),
		m_f = P.from.m,
		m_t = P.to.m,
		typeIcon = '',
		rowInd_f = Math.floor((P.from.h + m_f / 60) * 2),
		rowInd_t = Math.floor((P.to.h + m_t / 60) * 2),
		cellStart = P.Tab.pTimelineTable.rows[rowInd_f].cells[this.__ConvertCellIndex(rowInd_f, P.dayInd + 1, true)],
		cellEnd = P.Tab.pTimelineTable.rows[rowInd_t].cells[this.__ConvertCellIndex(rowInd_t, P.dayInd + 1, true)],
		top = bxInt(cellStart.offsetTop) + 1 + bxGetPixel(true),
		bottom = bxInt(cellEnd.offsetTop) - 1 - bxGetPixel(),
		left = bxInt(cellStart.offsetLeft) + 2 - bxGetPixel(),
		// Build div
		oDiv = BX.create('DIV', {
			props: {className : 'bxec-tl-event' + (oEvent.bMuted ? ' bxec-event-muted' : '')},
			style: {left: left + 'px', backgroundColor: oEvent.displayColor, color: oEvent.displayTextColor},
			events: {
				mouseover: function(e) {_this.HighlightEvent_TL(oEvent, this, false, P.Tab.id, e || window.event);},
				mouseout: function(e) {_this.HighlightEvent_TL(oEvent, this, true, P.Tab.id, e || window.event);},
				dblclick: function() {_this.Event.View(oEvent);}
			}
		});

	oDiv.setAttribute('data-bx-event-ind', oEvent.ind);
	oDiv.setAttribute('data-bx-original-width', '');
	oDiv.setAttribute('data-bx-original-height', '');

	oEvent._eventViewed = false;
	oEvent._contentSpan = false;

	if (this.Event.IsMeeting(oEvent))
		typeIcon = '<i class="bxc-e-meeting"></i>';
	if (isTask)
		typeIcon = '<i class="bxc-e-task"></i>';
	if (isCrm && !isTask)
		typeIcon = '<i class="bxc-e-crm"></i>';

	var
		rf = P.arInit.real_from,
		rt = P.arInit.real_to,
		statQ = this.Event.GetQuestIcon(oEvent),
		innerHTML = typeIcon + statQ+ '<u ' + this.Event.GetLabelStyle(oEvent) + '>' + BX.util.htmlspecialchars(oEvent.NAME) + '</u><br />',
		t1 = this.FormatTimeByNum(rf.hour, rf.min),
		t2 = this.FormatTimeByNum(rt.hour, rt.min);

	 // consider minutes
	if (m_f != 30 && m_f != 0)
		top += Math.round((m_f > 30 ? m_f - 30 : m_f) * 40 / 60) - 1;
	if (m_t != 30 && m_t != 0)
		bottom += Math.round((m_t > 30 ? m_t - 30 : m_t) * 40 / 60) + 2;
	var height = bottom - top;

	if (height <= 17)
		height = 17;

	oDiv.style.top = top + 'px';
	oDiv.style.height = height + 'px';

	if (rf.year == rt.year && rf.month == rt.month && rf.date == rt.date) // during one day
		innerHTML += t1 + ' &mdash; ' + t2;
	else
		innerHTML += bxFormatDate(rf.date, rf.month, rf.year) + ' ' + t1 + ' &mdash; ' + bxFormatDate(rt.date, rt.month, rt.year) + ' ' +  t2;

	oDiv.appendChild(BX.create("DIV", {children: [BX.create("SPAN", {props: {className: 'bxec-cnt-sp'}, html: innerHTML})]}));

	this.Event.BuildActions({cont: oDiv, oEvent: oEvent, evCont: oDiv, bTimeline: true});

	if (P.lastPart)
	{
		var ddResizer = oDiv.appendChild(BX.create("DIV", {props: {className: "bxec-tl-event-resizer-cnt"}}));
		this.dragDrop.RegisterTimelineEventResizer(ddResizer, oDiv, oEvent, P.Tab.id);
	}

	P.Tab.pTimelineCont.appendChild(oDiv);

	if (!oEvent.oTLParts[P.Tab.id])
		oEvent.oTLParts[P.Tab.id] = [];
	oEvent.oTLParts[P.Tab.id].push(oDiv);

	this.dragDrop.RegisterTimelineEvent(oDiv, oEvent, P.Tab.id);

	return oDiv;
}

JCEC.prototype.HighlightEvent_TL = function(oEvent, pWnd, bHide, tabId, e)
{
	var _this = this;
	var originalWidth = pWnd.getAttribute('data-bx-original-width');
	var originalHeight = pWnd.getAttribute('data-bx-original-height');

	if (!bHide && !oEvent._eventViewed)
	{
		if (this._highlightIntKeypWnd == pWnd && this._highlightInt)
			return;

		if (this._highlightInt)
			clearInterval(this._highlightInt);

		if (!originalWidth)
		{
			originalWidth = parseInt(pWnd.style.width);
			pWnd.setAttribute('data-bx-original-width', originalWidth);
		}
		if (!originalHeight)
		{
			originalHeight = parseInt(pWnd.style.height);
			pWnd.setAttribute('data-bx-original-height', originalHeight);
		}

		oEvent._contentSpan = BX.findChild(pWnd, {className: 'bxec-cnt-sp'}, true);

		var
			d = 0,
			w1 = originalWidth,
			w2 = parseInt(oEvent._contentSpan.offsetWidth) + 20,
			h1 = originalHeight,
			h2 = parseInt(oEvent._contentSpan.offsetHeight) + 30;

		if (w2 <= 60)
			w2 = 60;

		if (h2 <= 55)
			h2 = 55;

		if (w2 - w1 > 0 || h2 - h1 > 0)
		{
			this._highlightIntKeypWnd = pWnd;
			this._highlightInt = setInterval(function(){
				var
					bWidth = (w2 - w1) <= 0,
					bHeight = (h2 - h1) <= 0;

				if (bWidth && bHeight)
				{
					oEvent._eventViewed = true;
					return clearInterval(_this._highlightInt);
				}

				d += 12;
				if (!bWidth)
				{
					w1 += d;
					if (w1 > w2)
						w1 = w2 + 2;
					pWnd.style.width = w1 + 'px';
				}

				if (!bHeight)
				{
					h1 += d;
					if (h1 > h2)
						h1 = h2 + 2;
					pWnd.style.height = h1 + 'px';
				}
			}, 5);
		}
	}
	else
	{
		if (this.CheckMouseInCont(pWnd, e, -2))
			return true;

		this._highlightIntKeypWnd = false;
		if (this._highlightInt)
			clearInterval(this._highlightInt);
		this._highlightInt = false;

		if (originalWidth)
		{
			pWnd.style.width = originalWidth + "px";
			oEvent._eventViewed = false;
		}

		if (originalHeight)
		{
			pWnd.style.height = originalHeight + "px";
			oEvent._eventViewed = false;
		}
	}

	if (bHide)
		BX.removeClass(pWnd, 'bxec-tl-ev-hlt');
	else
		BX.addClass(pWnd, 'bxec-tl-ev-hlt');

	if (oEvent.oTLParts && oEvent.oTLParts[tabId])
	{
		var arParts = oEvent.oTLParts[tabId], pl = arParts.length, p, ow, oh;
		for (p = 0; p < pl; p++)
		{
			if (arParts[p] == pWnd)
				continue;

			if (bHide)
			{
				BX.removeClass(arParts[p], 'bxec-tl-ev-hlt');

				ow = arParts[p].getAttribute('data-bx-original-width');
				oh = arParts[p].getAttribute('data-bx-original-height');
				if (ow)
					arParts[p].style.width = ow + "px";
				if (oh)
					arParts[p].style.height = oh + "px";
			}
			else
			{
				BX.addClass(arParts[p], 'bxec-tl-ev-hlt');
			}
		}
	}
}

JCEC.prototype.SimpleSaveNewEvent = function(arParams)
{
	var D = this.oAddEventDialog;
	D.CAL.DOM.Name.value = BX.util.trim(D.CAL.DOM.Name.value);
	if (D.CAL.DOM.Name.value == "")
	{
		D.CAL.bHold = true;
		alert(EC_MESS.EventNameError);
		setTimeout(function(){D.CAL.bHold = false;}, 100);
		return false;
	}

	var
		fd = D.CAL.Params.from,
		td = D.CAL.Params.to,
		res = {
			name: D.CAL.DOM.Name.value,
			desc: '',//Ob.oDesc.value,
			calendar: D.CAL.DOM.SectSelect.value,
			from: BX.date.getServerTimestamp(fd.getTime()),
			to: BX.date.getServerTimestamp(td.getTime()),
			skip_time: (fd.getHours() == 0 && fd.getMinutes() == 0 && td.getHours() == 0 && td.getMinutes() == 0) ? 'Y' : 'N'
		};

	if (D.CAL.DOM.Accessibility)
		res.accessibility = D.CAL.DOM.Accessibility.value;

	this.Event.Save(res);
	return true;
}


JCEC.prototype.ExtendedSaveEvent = function(Params)
{
	var
		D = this.oEditEventDialog,
		cnt = D.oController,
		CE = cnt.oEvent,
		_this = this, i,
		err = function(str){alert(str); this.bEditEventDialogOver = true; return false;};

	//if (cnt.pName.value.length <= 0)
	//	return err(EC_MESS.EventNameError);

	var res = {
		name: cnt.pName.value,
		calendar: cnt.pSectSelect.value,
		desc: cnt.GetLHE().GetContent(),
		guests: [],
		arGuests: [],
		color: '',
		text_color: ''
	};

	if (res.calendar && this.oSections[res.calendar])
	{
		//if (this.oSections[res.calendar].COLOR && this.oSections[res.calendar].COLOR.toLowerCase() != cnt.Color.toLowerCase())
		//	res.color = cnt.Color;

		//if (D.CAL.TextColor && this.oSections[res.calendar].TEXT_COLOR.toLowerCase() != D.CAL.TextColor.toLowerCase())
		//	res.text_color = D.CAL.TextColor;
	}

	// Datetime limits
	var fd = BX.parseDate(cnt.pFromDate.value);
	if (!fd)
		return err(EC_MESS.EventDiapStartError);

	res.skip_time = cnt.pFullDay.checked;
	if (res.skip_time)
		cnt._FromTimeValue = cnt.pFromTime.value = cnt.pToTime.value = '';

	var fromTime = this.ParseTime(cnt.pFromTime.value);
	fd.setHours(fromTime.h);
	fd.setMinutes(fromTime.m);
	res.from = BX.date.getServerTimestamp(fd.getTime());

	var td = BX.parseDate(cnt.pToDate.value);
	if (td)
	{
		var toTime = this.ParseTime(cnt.pToTime.value);
		td.setHours(toTime.h);
		td.setMinutes(toTime.m);
		res.to = BX.date.getServerTimestamp(td.getTime());

		if (res.from == res.to && toTime.h == 0 && toTime.m == 0)
		{
			fd.setHours(0);
			fd.setMinutes(0);
			td.setHours(0);
			td.setMinutes(0);

			res.from = BX.date.getServerTimestamp(fd.getTime());
			res.to = BX.date.getServerTimestamp(td.getTime());
		}
	}
	else
	{
		if (CE.ID)
			return err(EC_MESS.EventDiapEndError);
		else
			res.to = res.from;
	}

	if (res.from > res.to) // Date To earlier Date From - send error
		return err(EC_MESS.EventDatesError);

	if (!res.skip_time)
	{
		res.skip_time = fd.getHours() == 0 && fd.getMinutes() == 0;
		if (res.skip_time && td && td.getHours && td.getMinutes)
			res.skip_time = td.getHours() == 0 && td.getMinutes() == 0;
	}
	res.skip_time = res.skip_time ? 'Y' : 'N';

	if (this.allowMeetings)
	{
		// ***** MEETING *****
		var Attendees = cnt.GetAttendees();
		for(i in Attendees)
		{
			if (Attendees[i] && typeof Attendees[i] == 'object' && Attendees[i].User)
			{
				if (Attendees[i].User.type == 'ext')
					res.guests.push("BXEXT:" + i);
				else
					res.guests.push(bxInt(i));
			}
		}

		res.isMeeting = CE.IS_MEETING || res.guests.length > 0;
		res.meeting = {
			host: this.userId,
			text: BX.util.trim(cnt.MeetText.value),
			open: !!cnt.OpenMeeting.checked ? 1 : 0,
			notify: cnt.NotifyStatus.checked ? 1 : 0,
			reinvite: !!cnt.Reinvite.checked ? 1 : 0
		};
	}

	if (CE.ID)
		res.id = CE.ID;

	// Location
	res.location = {
		OLD: cnt.Loc.OLD || false,
		NEW: cnt.Loc.NEW,
		CHANGED: cnt.Loc.CHANGED || (res.from != CE.DT_FROM || res.to != CE.DT_TO)
	};

	if (cnt.Loc.NEW.substr(0, 5) == 'ECMR_' && cnt.RepeatSelect.value != 'NONE')
		return err(EC_MESS.EventMRCheckWarn);

	if (cnt.RepeatSelect.value != 'NONE')
	{
		var FREQ = cnt.RepeatSelect.value;
		res.RRULE = {
			FREQ : FREQ,
			INTERVAL : cnt.RepeatCount.value
		};

		if (cnt.RepeatDiapTo.value != EC_MESS.NoLimits)
		{
			var until = BX.parseDate(cnt.RepeatDiapTo.value);
			if (until && until.getTime)
				res.RRULE.UNTIL = BX.date.getServerTimestamp(until.getTime());
		}

		//if (Ob.bRepSetDiapFrom)
		//	res.per_from = res.from;
		//else
		//	res.per_from = Ob.oRepeatDiapFrom;
		if (FREQ == 'WEEKLY')
		{
			var ar = [];
			for (i = 0; i < 7; i++)
				if (cnt.RepeatWeekDaysCh[i].checked)
					ar.push(cnt.RepeatWeekDaysCh[i].value);

			if (ar.length == 0)
				delete res.RRULE;
			else
				res.RRULE.BYDAY = ar.join(',');
		}
	}

	// Check Meeting and Video Meeting rooms accessibility
	if (res.location.NEW.substr(0, 5) == 'ECMR_' && !Params.bLocationChecked)
	{
		this.CheckMeetingRoom(
			{
				id : res.id || 0,
				from : res.from,
				to : res.to,
				location_new : res.location.NEW,
				location_old : res.location.OLD || ''
			},
			function(check){
				if (!check)
					return alert(EC_MESS.MRReserveErr);
				if (check == 'reserved')
					return alert(EC_MESS.MRNotReservedErr);

				Params.bLocationChecked = true;
				_this.ExtendedSaveEvent(Params);
			}
		);
		return false;
	}

	// Reminders
	if (this.allowReminders)
	{
		res.remind = cnt.pReminder.checked;
		res.remind_count = cnt.pRemCount.value || '';
		res.remind_count = res.remind_count.replace(/,/g, '.');
		res.remind_count = res.remind_count.replace(/[^\d|\.]/g, '');
		res.remind_type = cnt.pRemType.value;
	}

	// Other
	if (cnt.Importance)
		res.importance = cnt.Importance.value;

	if (cnt.Accessibility)
		res.accessibility = cnt.Accessibility.value;

	if (cnt.Private)
		res.private_event = cnt.Private.checked;

	if (!D.CAL.New)
	{
		res.id = CE.ID;
		if (CE.STATUS)
			res.status = CE.STATUS;
	}
	res.oEvent = CE;

	// Here we save form with userfields but we will post it ONLY AFTER saving main event
	// if (D.CAL.DOM.UFForm)
	//	res.UFForm = D.CAL.DOM.UFForm;

	this.Event.Save(res);

	if (Params.callback)
		Params.callback();
}

// More events window
JCEC.prototype.ShowMoreEventsWin = function(P)
{
	var _this = this;

	if(this.MoreEventsWin)
	{
		this.MoreEventsWin.close();
		this.MoreEventsWin.destroy();
		this.MoreEventsWin = null;
		return;
	}

	this.MoreEventsWin = BX.PopupWindowManager.create(this.id + "bxc-month-sel" + P.id, P.pSelect, {
		autoHide : true,
		closeByEsc : true,
		offsetTop : -1,
		offsetLeft : 1,
		lightShadow : true,
		content : BX.create('DIV', {props:{id: 'bxc-more-' + this.id + P.id, className : 'bxec-more-event-popup'}})
	});

	BX.addCustomEvent(this.MoreEventsWin, 'onPopupClose', function(){
		if(_this.MoreEventsWin && _this.MoreEventsWin.destroy)
			_this.MoreEventsWin.destroy();
	});

	var
		pWnd = BX('bxc-more-' + this.id + P.id),
		pNewDiv, pOldDiv, i;

	BX.bind(pWnd, 'click', BX.proxy(this.EventClick, this));

	pWnd.innerHTML = "";

	for (i = 0; i < P.Events.length; i++)
	{
		pOldDiv = P.Events[i].pDiv;
		pNewDiv = pOldDiv.cloneNode(true);

		BX.addClass(pNewDiv, 'bxec-event-static');
		pNewDiv.onmouseover = pOldDiv.onmouseover;
		pNewDiv.onmouseout = pOldDiv.onmouseout;
		pNewDiv.ondblclick = pOldDiv.ondblclick;
		pWnd.appendChild(pNewDiv);

		// Drag & Drop
		this.dragDrop.RegisterEvent(pNewDiv, P.Events[i].oEvent, 'month');
	}

	this.MoreEventsWin.show(true); // Show window
}

JCEC.prototype.GetUsableDateTime = function(timestamp, roundMin)
{
	var date = bxGetDateFromTS(timestamp);
	if (!roundMin)
		roundMin = 10;

	date.min = Math.ceil(date.min / roundMin) * roundMin;

	if (date.min == 60)
	{
		if (date.hour == 23)
			date.bTime = false;
		else
			date.hour++;
		date.min = 0;
	}

	date.oDate.setHours(date.hour);
	date.oDate.setMinutes(date.min);
	return date;
}


/* End */
;
; /* Start:/bitrix/js/calendar/cal-dialogs.js*/
// # # #  #  #  # Add Event Dialog  # # #  #  #  #
JCEC.prototype.ShowAddEventDialog = function(bShowCalendars)
{
	var _this = this;
	if (this.bReadOnly)
		return;

	if (!this.CheckSectionsCount())
		return alert(EC_MESS.NoCalendarsAlert);

	var D = this.oAddEventDialog;
	if (!D)
	{
		D = new BX.PopupWindow("BXCAddEvent", null, {
			overlay: {opacity: 10},
			autoHide: true,
			closeByEsc : true,
			zIndex: 0,
			offsetLeft: 0,
			offsetTop: 0,
			draggable: true,
			bindOnResize: false,
			titleBar: {content: BX.create("span", {html: EC_MESS.NewEvent})},
			closeIcon: { right : "12px", top : "10px"},
			className: 'bxc-popup-window',
			buttons: [
				new BX.PopupWindowButton({
					text: EC_MESS.GoExt,
					title: EC_MESS.GoExtTitle,
					className: "bxec-popup-link-icon bxec-popup-add-ex",
					events: {click : function(){_this.OpenExFromSimple();}}
				}),
				new BX.PopupWindowButton({
					text: EC_MESS.Add,
					className: "popup-window-button-accept",
					events: {click : function(){
						if (_this.SimpleSaveNewEvent())
							_this.CloseAddEventDialog(true);
					}}
				}),
				new BX.PopupWindowButtonLink({
					text: EC_MESS.Close,
					className: "popup-window-button-link-cancel",
					events: {click : function(){_this.CloseAddEventDialog(true);}}
				})
			],
			content: BX('bxec_add_ed_' + this.id),
			events: {}
		});

		D.CAL = {
			DOM: {
				Name: BX(this.id + '_add_ed_name'),
				PeriodText: BX(this.id + '_add_ed_per_text'),
				SectSelect: BX(this.id + '_add_ed_calend_sel'),
				Warn: BX(this.id + '_add_sect_sel_warn')
			}
		};

		if (this.bIntranet && (this.Personal() || this.type != 'user'))
		{
			D.CAL.DOM.Accessibility = BX(this.id + '_add_ed_acc');
			if (D.CAL.DOM.Accessibility && BX.browser.IsIE())
				D.CAL.DOM.Accessibility.style.width = '250px';
		}
		this.oAddEventDialog = D;

		D.CAL.DOM.SectSelect.onchange = function()
		{
			_this.SaveLastSection(this.value);
			D.CAL.DOM.Warn.style.display = _this.oActiveSections[D.CAL.DOM.SectSelect.value] ? 'none' : 'block';
		};

		BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseAddEventDialog, this));
	}

	var
		f, t, cts, a, cdts, perHTML,
		time_f = '', time_t = '';

	D.CAL.DOM.Name.value = '';
	this.BuildSectionSelect(D.CAL.DOM.SectSelect, this.GetLastSection());
	D.CAL.DOM.Warn.style.display = _this.oActiveSections[D.CAL.DOM.SectSelect.value] ? 'none' : 'block';

	if (this.selectDaysMode) // Month view
	{
		var
			start_ind = parseInt(this.selectDaysStartObj.id.substr(9)),
			end_ind = parseInt(this.selectDaysEndObj.id.substr(9));
		if (start_ind > end_ind) // swap start_ind and end_ind
		{
			a = end_ind;
			end_ind = start_ind;
			start_ind = a;
		}

		f = this.activeDateDaysAr[start_ind];
		t = this.activeDateDaysAr[end_ind];
	}
	else if (this.selectTimeMode) // Week view - time select
	{
		cts = this.curTimeSelection;
		f = new Date(cts.sDay.year, cts.sDay.month, cts.sDay.date, cts.sHour, cts.sMin);
		t = new Date(cts.eDay.year, cts.eDay.month, cts.eDay.date, cts.eHour, cts.eMin);

		if (f.getTime() > t.getTime())
		{
			a = f;
			f = t;
			t = a; // swap "f" and "t"
		}
	}
	else if (this.selectDayTMode) // Week view - days select
	{
		cdts = this.curDayTSelection;
		f = new Date(cdts.sDay.year, cdts.sDay.month, cdts.sDay.date);
		t = new Date(cdts.eDay.year, cdts.eDay.month, cdts.eDay.date);
	}
	else
		return;

	var
		f_day = this.ConvertDayIndex(f.getDay()),
		t_day = this.ConvertDayIndex(t.getDay());

	if (f.getTime() == t.getTime()) // one day
	{
		perHTML = this.days[f_day][0] + ' ' + bxFormatDate(f.getDate(), f.getMonth() + 1, f.getFullYear());
	}
	else
	{
		var
			d_f = f.getDate(), m_f = f.getMonth() + 1, y_f = f.getFullYear(), h_f = f.getHours(), mi_f = f.getMinutes(),
			d_t = t.getDate(), m_t = t.getMonth() + 1, y_t = t.getFullYear(), h_t = t.getHours(), mi_t = t.getMinutes(),
			bTime = !(h_f == h_t && h_f == 0 && mi_f == mi_t && mi_f == 0);

		if (bTime)
		{
			time_f = this.FormatTimeByNum(h_f, mi_f);
			time_t = this.FormatTimeByNum(h_t, mi_t);
		}

		if (m_f == m_t && y_f == y_t && d_f == d_t && bTime) // Same day, different time
			perHTML = this.days[f_day][0] + ' ' + bxFormatDate(d_f, m_f, y_f) + ', ' + time_f + ' &mdash; ' + time_t;
		else
			perHTML = this.days[f_day][0] + ' ' + bxFormatDate(d_f, m_f, y_f) + ' ' +  time_f + ' &mdash; ' +
				this.days[t_day][0] + ' ' + bxFormatDate(d_t, m_t, y_t) + ' ' + time_t;
	}

	D.CAL.DOM.PeriodText.innerHTML = perHTML;
	D.CAL.Params = {
		from: f,
		to: t,
		time_f: time_f || '',
		time_t: time_t || ''
	};
	setTimeout(function(){BX.focus(D.CAL.DOM.Name);}, 500);

	if (this.bIntranet && (this.Personal() || this.type != 'user'))
		D.CAL.DOM.Accessibility.value = 'busy';

	pos = this.GetAddDialogPosition();
	if (pos)
	{
		D.popupContainer.style.top = pos.top + "px";
		D.popupContainer.style.left = pos.left + "px";
	}

	D.show();
}

JCEC.prototype.OpenExFromSimple = function(bCallback)
{
	this.CloseAddEventDialog(true);
	if (!bCallback)
		return this.ShowEditEventPopup({bExFromSimple: true});

	var
		D1 = this.oAddEventDialog,
		D2 = this.oEditEventDialog,
		con = D2.oController,
		f = D1.CAL.Params.from,
		t = D1.CAL.Params.to;

	con._FromDateValue = con.pFromDate.value = bxFormatDate(f.getDate(), f.getMonth() + 1, f.getFullYear());
	con.pToDate.value = bxFormatDate(t.getDate(), t.getMonth() + 1, t.getFullYear());
	con._FromTimeValue = con.pFromTime.value = D1.CAL.Params.time_f || '';
	con.pToTime.value = D1.CAL.Params.time_t || '';

	var bTime = !!(D1.CAL.Params.time_f || D1.CAL.Params.time_t);
	con.pFullDay.checked = !bTime;
	con.FullDay(false, bTime);

	con.pName.value = D1.CAL.DOM.Name.value;

	if (this.bIntranet && con.pAccessibility && D1.CAL.DOM.Accessibility)
		con.pAccessibility.value = D1.CAL.DOM.Accessibility.value;

	//Set WUSIWUG Editor Content
	//setTimeout(function(){window.pLHEEvDesc.SetEditorContent('');}, 100);

	if (D1.CAL.DOM.SectSelect.value)
	{
		con.pSectSelect.value = D1.CAL.DOM.SectSelect.value;
		if (con.pSectSelect.onchange)
			con.pSectSelect.onchange();
	}
}

JCEC.prototype.CloseAddEventDialog = function(bClosePopup)
{
	if (!this.oAddEventDialog)
		return;
	switch (this.activeTabId)
	{
		case 'month':
			this.DeSelectDays();
			break;
		case 'week':
			this.DeSelectTime(this.activeTabId);
			this.DeSelectDaysT();
			break;
		case 'day':
			break;
	}
	if (bClosePopup === true)
		this.oAddEventDialog.close();
}

JCEC.prototype.GetAddDialogPosition = function()
{
	if (this.activeTabId == 'month')
	{
		var last_selected = this.arSelectedDays[this.bInvertedDaysSelection ? 0 : this.arSelectedDays.length - 1];
		if (!last_selected)
			return false;

		var pos = BX.pos(last_selected);
		pos.top += parseInt(this.dayCellHeight / 2) + 20;
		pos.left += parseInt(this.dayCellWidth / 2) + 20;

		pos.right = pos.left;
		pos.bottom = pos.top;
		pos = BX.align(pos, 360, 180);
		return pos;
	}
	else //if (this.activeTabId == 'week')
	{
		return false;
	}
}

// # # #  #  #  # Edit Event Dialog  # # #  #  #  #
JCEC.prototype.CreateEditEventPopup = function(bCheck)
{
	var
		_this = this,
		content = BX.create('DIV'),
		pTitle = BX.create("span", {props:{className: 'bxce-dialog-title'}, html: EC_MESS.NewEvent});

	var D = new BX.PopupWindow("BXCEditEvent", null, {
		overlay: {opacity: 10},
		autoHide: false,
		closeByEsc : true,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		titleBar: {content: pTitle},
		closeIcon: { right : "12px", top : "10px"},
		className: "bxc-popup-tabed bxc-popup-window",
		buttons: [
			new BX.PopupWindowButton({
				text: EC_MESS.Delete,
				id: this.id + 'ed-del-button',
				className: "bxec-popup-link-icon bxec-popup-del-ex",
				events: {click : function(){
					if (_this.Event.Delete(D.CAL.oEvent))
						_this.CloseEditEventDialog(true);
				}}
			}),
			new BX.PopupWindowButton({
				text: EC_MESS.Save,
				className: "popup-window-button-accept",
				events: {click : function(){
					if (_this.oEditEventDialog.CAL.bMeetingStyleFields)
					{
						_this.Event.SetMeetingParams({callback: function(){_this.CloseEditEventDialog(true);}, bLocationChecked: false});
					}
					else
					{
						_this.oEditEventDialog.oController.SaveForm({callback: function(){_this.CloseEditEventDialog(true);}});
						//if (window.pLHEEvDesc)
						//	window.pLHEEvDesc.SaveContent();
						//_this.ExtendedSaveEvent({callback: function(){_this.CloseEditEventDialog(true);}, bLocationChecked: false});
					}
				}}
			}),
			new BX.PopupWindowButtonLink({
				text: EC_MESS.Close,
				className: "popup-window-button-link-cancel",
				events: {click : function(){_this.CloseEditEventDialog(true);}}
			})
		],
		content: content,
		//content: BX('bxec_edit_ed_' + this.id),
		events: {}
	});

	BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseEditEventDialog, this));

	D.CAL = {
		DOM: {
			content: content,
			Title: pTitle,
			DelBut: BX(this.id + 'ed-del-button')
		}
	};

	this.oEditEventDialog = D;
}


JCEC.prototype.ShowEditEventPopup = function(Params)
{
	if (!this.oEditEventDialog)
		this.CreateEditEventPopup();

	if (!Params)
		Params = {};

	var
		_this = this, eventId,
		bExFromSimple = Params.bExFromSimple,
		D = this.oEditEventDialog;

	D.CAL.oEvent = Params.oEvent || {};
	eventId = (D.CAL.oEvent && D.CAL.oEvent.ID) ? D.CAL.oEvent.ID : 0;

	if (eventId)
	{
		D.CAL.DOM.DelBut.style.display = '';
		D.CAL.DOM.Title.innerHTML = EC_MESS.EditEvent;
	}
	else
	{
		D.CAL.DOM.DelBut.style.display = 'none';
		D.CAL.DOM.Title.innerHTML = EC_MESS.NewEvent;
	}

	BX.ajax.get(
		this.actionUrl,
		this.GetReqData('get_edit_event_dialog',
			{
				event_id : eventId ,
				js_id: this.id
			}),
		function(html)
		{
			D.CAL.DOM.content.innerHTML = html;
		}
	);

	// Destination
	function f()
	{
		D.CAL.DOM.pTabs = BX(_this.id + '_edit_tabs');
		if (!D.CAL.DOM.pTabs)
			return;
		_this.ChargePopupTabs(D, _this.id + 'ed-tab-');
		D.CAL.DOM.pFilesCont = BX('bxed_file_cont_' + _this.id);
		BX.addCustomEvent(D.CAL.Tabs[1], 'OnSetTab', function(tab, showed)
		{
			D.CAL.DOM.pFilesCont.style.display = showed ? 'block' : 'none';
		});

		if (!Params.bRunPlanner)
			_this.oEditEventDialog.show();

		if (window.__ATTENDEES_ACC)
			D.CAL.oEvent['~ATTENDEES'] = window.__ATTENDEES_ACC;

		D.oController = new EditEventPopupController({
			form: document.forms.event_edit_form,
			oEC: _this,
			oEvent: D.CAL.oEvent,
			id: _this.id,
			editorContId: "bx_cal_editor_cont_" + _this.id,
			LHEJsObjName: 'pLHEEvDesc',
			LHEId: 'LHEEvDesc',
			WDControllerCID : window.__UPLOAD_WEBDAV_ELEMENT_CID,
			arFiles: window.__UPLOAD_WEBDAV_ELEMENT_VALUE,
			Title: D.CAL.DOM.Title
		});

		if (window.editEventDestinationFormName)
		{
			BxEditEventGridSetLinkName(window.editEventDestinationFormName);
			BX.bind(BX('event-grid-dest-input'), 'keyup', BxEditEventGridSearch);
			BX.bind(BX('event-grid-dest-input'), 'keydown', BxEditEventGridSearchBefore);
			BX.bind(BX('event-grid-dest-add-link'), 'click', function(e){BX.SocNetLogDestination.openDialog(editEventDestinationFormName); BX.PreventDefault(e); });
			BX.bind(BX('event-grid-dest-cont'), 'click', function(e){BX.SocNetLogDestination.openDialog(editEventDestinationFormName); BX.PreventDefault(e);});
		}
		BX.removeCustomEvent('onAjaxSuccessFinish', f);

		if (Params.bRunPlanner)
			_this.RunPlanner(
				{curEventId: false, attendees: [{id: _this.userId, name: _this.userName}]}
			);

		if (bExFromSimple)
			_this.OpenExFromSimple(true);
	}
	BX.addCustomEvent('onAjaxSuccessFinish', f);
};

JCEC.prototype.GetUserFieldsHTML = function(oEvent, bEdit)
{
	var
		eventId = oEvent.ID || 0,
		_this = this;

	if (!bEdit && eventId == 0 && this.newEventUF[bEdit ? 'edit' : 'view'])
		return Callback(this.newEventUF[bEdit ? 'edit' : 'view']);

	if (!bEdit && eventId > 0 && oEvent[bEdit ? '_UF_EDIT' : '_UF_VIEW'])
		return Callback(oEvent[bEdit ? '_UF_EDIT' : '_UF_VIEW']);

	function Callback(html)
	{
		if (bEdit)
		{
			html = BX.util.trim(html);
			var D = _this.oEditEventDialog;
			if (html != "")
			{
				D.CAL.DOM.UFGroup.style.display = "";
				D.CAL.DOM.UFCont.innerHTML = html;
				D.CAL.DOM.UFForm = document.forms['calendar-event-uf-form' + eventId]
			}
			else
			{
				D.CAL.DOM.UFGroup.style.display = "none";
				D.CAL.DOM.UFCont.innerHTML = '';
				D.CAL.DOM.UFForm = null;
			}

			if (eventId == 0)
				_this.newEventUF.edit = html;
			else
				oEvent._UF_EDIT = html;
		}
		else
		{
			html = BX.util.trim(html);
			var D = _this.oViewEventDialog;
			if (html != "")
			{
				D.CAL.DOM.UFGroup.style.display = "";
				D.CAL.DOM.UFCont.innerHTML = html;
			}
			else
			{
				D.CAL.DOM.UFGroup.style.display = "none";
				D.CAL.DOM.UFCont.innerHTML = '';
			}

			oEvent._UF_VIEW = html;
		}
		return true;
	};

	this.Request({
		getData: this.GetReqData(bEdit ? 'userfield_edit' : 'userfield_view', {event_id : eventId}),
		handler: function(oRes, html)
		{
			if (oRes)
			{
				Callback(html);
				return true;
			}
			return true;
		}
	});
}

JCEC.prototype._LocOnChange = function(oLoc, ind, value)
{
	var D = this.oEditEventDialog;
	if (ind === false)
	{
		D.CAL.Loc.NEW = value || '';
	}
	else
	{
		// Same meeting room
		if (ind != D.CAL.Loc.OLD_mrid)
			D.CAL.Loc.CHANGED = true;
		D.CAL.Loc.NEW = 'ECMR_' + this.meetingRooms[ind].ID;
	}
};

JCEC.prototype.SetEditingMeetingFields = function(bDeactivate)
{
	bDeactivate = !!bDeactivate;
	var D = this.oEditEventDialog;
	if (D.CAL.bMeetingStyleFields != bDeactivate)
	{
		D.CAL.bMeetingStyleFields = bDeactivate; //
		if (bDeactivate)
		{
			BX.addClass(D.CAL.Tabs[0].cont, 'bxc-meeting-edit-dis');
			D.CAL.DOM.pTabs.style.display = bDeactivate ? 'none' : '';
			// Move reminder params to first tab
			D.CAL.Tabs[0].cont.appendChild(D.CAL.DOM.RemindCnt);
		}
		else
		{
			BX.removeClass(D.CAL.Tabs[0].cont, 'bxc-meeting-edit-dis');
			D.CAL.DOM.pTabs.style.display = '';
			// Move reminder params back to the third tab
			D.CAL.Tabs[3].cont.insertBefore(D.CAL.DOM.RemindCnt, D.CAL.Tabs[3].cont.firstChild);
		}
	}
}

JCEC.prototype.CloseEditEventDialog = function(bClosePopup)
{
	if (!this.oEditEventDialog)
		return;
	if (bClosePopup === true)
	{
		if (this.oEditEventDialog.oController.Location && this.oEditEventDialog.oController.Location.oPopup)
			this.oEditEventDialog.oController.Location.oPopup.destroy();

		this.oEditEventDialog.close();
	}
}

//JCEC.prototype.OnChangeRepeatSelect = function(val)
//{
//	var
//		D = this.oEditEventDialog,
//		i, l, BYDAY, date;
//
//	val = val.toUpperCase();
//
//	if (val == 'NONE')
//	{
//		D.CAL.DOM.RepeatSect.style.display =  'none';
//	}
//	else
//	{
//		var oEvent = D.CAL.oEvent;
//		D.CAL.DOM.RepeatSect.style.display =  'block';
//		D.CAL.DOM.RepeatPhrase2.innerHTML = EC_MESS.DeDot; // Works only for de lang
//
//		if (val == 'WEEKLY')
//		{
//			D.CAL.DOM.RepeatPhrase1.innerHTML = EC_MESS.EveryF;
//			D.CAL.DOM.RepeatPhrase2.innerHTML += EC_MESS.WeekP;
//			D.CAL.DOM.RepeatWeekDays.style.display = (val == 'WEEKLY') ? 'block' : 'none';
//			BYDAY = {};
//
//			if (!D.CAL.DOM.RepeatWeekDaysCh)
//			{
//				D.CAL.DOM.RepeatWeekDaysCh = [];
//				for (i = 0; i < 7; i++)
//					D.CAL.DOM.RepeatWeekDaysCh[i] = BX(this.id + 'bxec_week_day_' + i);
//			}
//
//			if (!D.CAL.bNew && oEvent && oEvent.RRULE && oEvent.RRULE.BYDAY)
//			{
//				BYDAY = oEvent.RRULE.BYDAY;
//			}
//			else
//			{
//				var date = BX.parseDate(D.CAL.DOM.FromDate.value);
//				if (!date)
//					date = bxGetDateFromTS(oEvent.DT_FROM_TS);
//
//				if(date)
//					BYDAY[this.GetWeekDayByInd(date.getDay())] = true;
//			}
//
//			for (i = 0; i < 7; i++)
//				D.CAL.DOM.RepeatWeekDaysCh[i].checked = !!BYDAY[D.CAL.DOM.RepeatWeekDaysCh[i].value];
//		}
//		else
//		{
//			if (val == 'YEARLY')
//				D.CAL.DOM.RepeatPhrase1.innerHTML = EC_MESS.EveryN;
//			else
//				D.CAL.DOM.RepeatPhrase1.innerHTML = EC_MESS.EveryM;
//
//			if (val == 'DAILY')
//				D.CAL.DOM.RepeatPhrase2.innerHTML += EC_MESS.DayP;
//			else if (val == 'MONTHLY')
//				D.CAL.DOM.RepeatPhrase2.innerHTML += EC_MESS.MonthP;
//			else if (val == 'YEARLY')
//				D.CAL.DOM.RepeatPhrase2.innerHTML += EC_MESS.YearP;
//
//			D.CAL.DOM.RepeatWeekDays.style.display = 'none';
//		}
//
//		var bPer = oEvent && this.Event.IsRecursive(oEvent);
//		D.CAL.DOM.RepeatCount.value = (D.CAL.bNew || !bPer) ? 1 : oEvent.RRULE.INTERVAL;
//
//		if (D.CAL.bNew || !bPer)
//		{
//			D.CAL.DOM.RepeatDiapTo.value = '';
//		}
//		else
//		{
//			if (oEvent.RRULE.UNTIL)
//			{
//				var d = bxGetDateFromTS(oEvent.RRULE.UNTIL);
//				if (d.date == 1 && d.month == 1 && d.year == 2038)
//					D.CAL.DOM.RepeatDiapTo.value = '';
//				else
//					D.CAL.DOM.RepeatDiapTo.value = bxFormatDate(d.date, d.month, d.year);
//			}
//			else
//			{
//				D.CAL.DOM.RepeatDiapTo.value = '';
//			}
//
//		}
//		D.CAL.DOM.RepeatDiapTo.onchange();
//	}
//}

// # # #  #  #  # View Event Dialog  # # #  #  #  #
JCEC.prototype.CreateViewEventPopup = function()
{
	var
		_this = this,
		content = BX.create('DIV'),
		D = new BX.PopupWindow("BXCViewEvent", null, {
		overlay: {opacity: 10},
		autoHide: false,
		closeByEsc : true,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		titleBar: {content: BX.create("span", {props: {className: 'bxec-popup-title', id: this.id + '_viewev_title'}, html: EC_MESS.ViewingEvent})},
		closeIcon: {right : "12px", top : "10px"},
		className: "bxc-popup-tabed bxc-popup-window",
		buttons: [
			new BX.PopupWindowButton({
				text:  EC_MESS.Delete,
				id: this.id + '_viewev_del_but',
				className: "bxec-popup-link-icon bxec-popup-del-ev",
				events: {click : function(){
					if(_this.Event.Delete(D.CAL.oEvent))
						_this.CloseViewDialog(true);
				}}
			}),
			new BX.PopupWindowButton({
				text: EC_MESS.Edit,
				className: "bxec-popup-link-icon bxec-popup-ed-ev",
				id: this.id + '_viewev_edit_but',
				events: {click : function(){
					_this.ShowEditEventPopup({oEvent: D.CAL.oEvent});
					_this.CloseViewDialog(true);
				}}
			}),
			new BX.PopupWindowButton({
				text: EC_MESS.Close,
				className: "popup-window-button-accept",
				events: {click : function(){_this.CloseViewDialog(true);}}
			})
		],
		content: content,
		//content: BX('bxec_view_ed_' + this.id),
		events: {}
	});

	BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseViewDialog, this));

	D.CAL = {
		DOM: {
			content: content,
			TITLE: BX(this.id + '_viewev_title'),
			//pTabs: BX(this.id + '_viewev_tabs'),
//			Name: BX(this.id + 'view-name-cnt'),
//			Period: BX(this.id + 'view-period'),
//			repRow: BX(this.id + 'view-repeat-cnt'),
//			locationRow: BX(this.id + 'view-loc-cnt'),
//			Location: BX(this.id + 'view-location'),
//			Desc: BX(this.id + '_view_ed_desc'),
//			sectRow: BX(this.id + 'view-sect-cnt'),
//			sectCont: BX(this.id + 'view-ed-sect'),
//			SpecRow: BX(this.id + 'view-spec-cnt'),
//			ImpRow: BX(this.id + 'view-import-cnt'),
//			ImpSpan: BX(this.id + '_view_ed_imp'),
//			UFGroup: BX(this.id + 'bxec_view_uf_group'),
//			UFCont: BX(this.id + 'bxec_view_uf_cont'),
			delBut : BX(this.id + '_viewev_del_but'),
			editBut : BX(this.id + '_viewev_edit_but')
		}
	};

	BX.bind(D.CAL.DOM.content, "click", function(e)
	{
		var targ = e.target || e.srcElement;

		var bxMoreUsers = targ.getAttribute('data-bx-more-users');
		if (!!bxMoreUsers)
		{
			var attCont = BX(bxMoreUsers);
			if (attCont)
				BX.addClass(attCont, 'bx-cal-view-att-cont-full');
			return;
		}

		var bxSetStatusLink = targ.getAttribute('data-bx-set-status') || targ.parentNode.getAttribute('data-bx-set-status');
		if (!!bxSetStatusLink)
		{
			_this.Event.SetMeetingStatus(bxSetStatusLink == 'Y');
			D.close();
			return BX.PreventDefault(e || window.event);
		}
	});

	/*
	if (this.bIntranet)
	{
		D.CAL.DOM.AccessabRow = BX(this.id + 'view-accessab-cnt');
		D.CAL.DOM.AccessSpan = BX(this.id + '_view_ed_accessibility');
		D.CAL.DOM.privateRow = BX(this.id + 'view-priv-cnt');
	}

	if (false && this.allowMeetings)
	{
		D.CAL.DOM.meetingTextRow = BX(this.id + 'view-meet-text-cnt');
		D.CAL.DOM.MeetingText = BX(this.id + '_view_ed_meet_text');

		D.CAL.UserControl = new ECUserControll({
			oEC: this,
			view: true,
			AttendeesCont : BX(this.id + 'view_att_cont'),
			AttendeesList : BX(this.id + 'view_att_list'),
			SummaryCont: BX(this.id + 'view_att_summary')
		});
		D.CAL.DOM.Host = BX(this.id + 'view_host_link');

		D.CAL.DOM.AttRow = BX(this.id + 'attendees_cnt');
		D.CAL.DOM.ConfRow = BX(this.id + 'confirm_cnt');
		D.CAL.DOM.ConfCnt1 = BX(this.id + 'status-conf-cnt1');
		D.CAL.DOM.ConfCnt2 = BX(this.id + 'status-conf-cnt2');
		D.CAL.DOM.ConfCnt3 = BX(this.id + 'status-conf-cnt3');
		D.CAL.DOM.ConfCnt4 = BX(this.id + 'status-conf-cnt4');

		D.CAL.DOM.AcceptLink2 = BX(this.id + 'accept-link-2');
		D.CAL.DOM.AcceptLink3 = BX(this.id + 'accept-link-3');
		D.CAL.DOM.AcceptLink4 = BX(this.id + 'accept-link-4');
		D.CAL.DOM.AcceptLink2.onclick =
		D.CAL.DOM.AcceptLink3.onclick =
		D.CAL.DOM.AcceptLink4.onclick = function(e){if (_this.Event.SetMeetingStatus(true)){D.close(); }; return BX.PreventDefault(e || window.event);};

		D.CAL.DOM.DeclineLink1 = BX(this.id + 'decline-link-1');
		D.CAL.DOM.DeclineLink2 = BX(this.id + 'decline-link-2');
		D.CAL.DOM.DeclineLink1.onclick =
		D.CAL.DOM.DeclineLink2.onclick = function(e){if(_this.Event.SetMeetingStatus(false)){D.close();}; return BX.PreventDefault(e || window.event);};
		D.CAL.DOM.DeclineNotice = BX(this.id + 'decline-notice');

		D.CAL.DOM.StatusComCnt = BX(this.id + 'status-conf-comment');
		D.CAL.DOM.StatusComInp = BX(this.id + 'conf-comment-inp');

		D.CAL.defStatValue = D.CAL.DOM.StatusComInp.value;
		D.CAL.DOM.StatusComInp.onclick = D.CAL.DOM.StatusComInp.onfocus = function()
		{
			if (this.value == D.CAL.defStatValue)
				this.value = "";
			BX.removeClass(this, 'bxc-st-dis');
		};
		D.CAL.DOM.StatusComInp.onblur = function()
		{
			if (BX.util.trim(this.value) == "")
				this.value = D.CAL.defStatValue;
			BX.addClass(this, 'bxc-st-dis');
		};
	}
*/
	this.oViewEventDialog = D;
}

JCEC.prototype.ShowViewEventPopup = function(oEvent)
{
	if (!this.oViewEventDialog)
		this.CreateViewEventPopup();

	var
		_this = this,
		D = this.oViewEventDialog,
		eventId = oEvent.ID;

	BX.addCustomEvent("OnUCFeedChanged", BX.proxy(function(){this.AdjustOverlay(this.oViewEventDialog);}, this));

	D.CAL.oEvent = oEvent;
	BX.ajax.get(
		this.actionUrl,
		this.GetReqData('get_view_event_dialog',
			{
				event_id : eventId,
				js_id: this.id,
				section_name: this.oSections[oEvent.SECT_ID] ? this.oSections[oEvent.SECT_ID].NAME : '',
				from_ts: BX.date.getServerTimestamp(oEvent.DT_FROM_TS)
			}),
		function(html)
		{
			D.CAL.DOM.content.innerHTML = html;
			D.CAL.DOM.pTabs = BX(_this.id + '_viewev_tabs');
			_this.ChargePopupTabs(D, _this.id + 'view-tab-');
			_this.oViewEventDialog.show();

			D.CAL.DOM.TITLE.innerHTML = EC_MESS.ViewingEvent + ': ' + BX.util.htmlspecialchars(oEvent.NAME);

			// Hide edit & delete links for read only events
			if (_this.bIntranet && _this.Event.IsHost(oEvent))
			{
				D.CAL.DOM.delBut.style.display = "";
				D.CAL.DOM.editBut.style.display = "";
			}
			else if (_this.bIntranet && _this.Event.IsAttendee(oEvent))
			{
				D.CAL.DOM.delBut.style.display = "none";
				D.CAL.DOM.editBut.style.display = "none";
			}
			else
			{
				if (_this.Event.CanDo(oEvent, 'edit'))
				{
					D.CAL.DOM.delBut.style.display = "";
					D.CAL.DOM.editBut.style.display = "";
				}
				else
				{
					D.CAL.DOM.delBut.style.display = "none";
					D.CAL.DOM.editBut.style.display = "none";
				}
			}

			BX.viewElementBind(
				'bx-cal-view-files-' + _this.id + eventId,
				{showTitle: true},
				function(node){
					return BX.type.isElementNode(node) && (node.getAttribute('data-bx-viewer') || node.getAttribute('data-bx-image'));
				}
			);
		}
	);
};

JCEC.prototype.AdjustOverlay = function(popup)
{
	setTimeout(function(){
		if (popup && popup.overlay && popup.resizeOverlay)
			popup.resizeOverlay();
	}, 200);
}

JCEC.prototype.ShowViewEventPopup1 = function(oEvent)
{
	if (!this.oViewEventDialog)
		this.CreateViewEventPopup();

	var
		D = this.oViewEventDialog,
		perHTML,
		d_from = bxGetDateFromTS(oEvent.DT_FROM_TS),
		d_to = bxGetDateFromTS(oEvent.DT_TO_TS),
		s_day_from = this.days[this.ConvertDayIndex(d_from.oDate.getDay())][0],
		s_day_to = this.days[this.ConvertDayIndex(d_to.oDate.getDay())][0];

	D.CAL.DOM.TITLE.innerHTML = EC_MESS.ViewingEvent + ': ' + BX.util.htmlspecialchars(oEvent.NAME);
	D.CAL.DOM.Name.innerHTML = '<span' + this.Event.GetLabelStyle(oEvent) + '>' + BX.util.htmlspecialchars(oEvent.NAME) + '</span>';
	D.CAL.DOM.Name.title = oEvent.NAME;

	perHTML = s_day_from + ' ' + bxFormatDate(d_from.date, d_from.month, d_from.year);
	if (d_from.bTime)
		perHTML +=  ' ' + this.FormatTimeByNum(d_from.hour, d_from.min);

	if (oEvent.DT_FROM_TS != oEvent.DT_TO_TS)
	{
		perHTML += ' - ' + s_day_to + ' ' + bxFormatDate(d_to.date, d_to.month, d_to.year);
		if (d_to.bTime)
			perHTML +=  ' ' + this.FormatTimeByNum(d_to.hour, d_to.min);
	}

	D.CAL.DOM.Period.innerHTML = perHTML;
	D.CAL.DOM.ImpSpan.innerHTML = EC_MESS['Importance_' + oEvent.IMPORTANCE];

	// Calendar
	if (this.oSections[oEvent.SECT_ID])
	{
		D.CAL.DOM.sectRow.style.display = '';
		D.CAL.DOM.sectCont.innerHTML = BX.util.htmlspecialchars(this.oSections[oEvent.SECT_ID].NAME);
	}
	else
	{
		D.CAL.DOM.sectRow.style.display = 'none';
	}

	// Description
	if (oEvent['~DESCRIPTION'] != '')
	{
		D.CAL.DOM.Desc.innerHTML = oEvent['~DESCRIPTION'];
		D.CAL.Tabs[1].tab.style.display = 'block'; // Show tab
	}
	else
	{
		D.CAL.Tabs[1].tab.style.display = 'none'; // Hide tab
	}

	// Location
	var
		lochtml = '',
		loc = this.ParseLocation(oEvent.LOCATION, true);

	if (loc.mrid == false && loc.str.length > 0)
		lochtml = BX.util.htmlspecialchars(loc.str);
	else if (loc.mrid && loc.MR)
		lochtml = loc.MR.URL ? '<a href="' + loc.MR.URL+ '" target="_blank">' + BX.util.htmlspecialchars(loc.MR.NAME) + '</a>' : BX.util.htmlspecialchars(loc.MR.NAME);

	if (lochtml.length > 0)
	{
		D.CAL.DOM.locationRow.style.display = '';
		D.CAL.DOM.Location.innerHTML = lochtml;
	}
	else
	{
		D.CAL.DOM.locationRow.style.display = 'none';
	}

	// repeating
	if (this.Event.IsRecursive(oEvent))
	{
		D.CAL.DOM.repRow.style.display = '';
		var repeatHTML = '';
		switch (oEvent.RRULE.FREQ)
		{
			case 'DAILY':
				repeatHTML += '<b>' + EC_MESS.EveryM_ + ' ' + oEvent.RRULE.INTERVAL + EC_MESS.DeDot + EC_MESS._J + ' ' + EC_MESS.DayP + '</b>';
				break;
			case 'WEEKLY':
				repeatHTML += '<b>' + EC_MESS.EveryF_ + ' ';
				if (oEvent.RRULE.INTERVAL > 1)
					repeatHTML += oEvent.RRULE.INTERVAL + EC_MESS.DeDot + EC_MESS._U + ' ';
				repeatHTML += EC_MESS.WeekP + ': ';
				var n = 0;
				for (var i in oEvent.RRULE.BYDAY)
				{
					if(oEvent.RRULE.BYDAY[i])
						repeatHTML += (n++ > 0 ? ', ' : '') + this.Day(oEvent.RRULE.BYDAY[i])[0];
				}
				repeatHTML += '</b>';
				break;
			case 'MONTHLY':
				repeatHTML += '<b>' + EC_MESS.EveryM_ + ' ';
				if (oEvent.RRULE.INTERVAL > 1)
					repeatHTML += oEvent.RRULE.INTERVAL + EC_MESS.DeDot + EC_MESS._J + ' ';
				repeatHTML +=  EC_MESS.MonthP + ', ' + EC_MESS.DeAm + bxInt(d_from.date) + EC_MESS.DeDot + EC_MESS.DateP_ + '</b>';
				break;
			case 'YEARLY':
				repeatHTML += '<b>' + EC_MESS.EveryN_ + ' ';
				if (oEvent.RRULE.INTERVAL > 1)
					repeatHTML += oEvent.RRULE.INTERVAL + EC_MESS.DeDot + EC_MESS._J + ' ';
				repeatHTML +=  EC_MESS.YearP + ', ' + EC_MESS.DeAm + bxInt(d_from.date) + EC_MESS.DeDot + EC_MESS.DateP_ + ' ' + EC_MESS.DeDes + bxInt(d_from.month) + EC_MESS.DeDot + EC_MESS.MonthP_ + '</b>';
				break;
		}

		var d = bxGetDateFromTS(oEvent['~DT_FROM_TS']);
		repeatHTML += '<br> ' + EC_MESS.From_ + ' ' + bxFormatDate(d.date, d.month, d.year);

		d = bxGetDateFromTS(oEvent.RRULE.UNTIL);
		if (d && (d.date != 1 || d.month != 1 || d.year != 2038))
			repeatHTML += ' ' + EC_MESS.To_ + ' ' + bxFormatDate(d.date, d.month, d.year);

		D.CAL.DOM.repRow.cells[1].innerHTML = repeatHTML;
	}
	else
	{
		D.CAL.DOM.repRow.style.display = 'none';
	}
	D.CAL.oEvent = oEvent;

	if (this.bIntranet)
	{
		if (this.allowMeetings)
		{
			D.CAL.DOM.meetingTextRow.style.display = 'none';
			D.CAL.DOM.AttRow.style.display = "none";
			D.CAL.DOM.ConfCnt1.style.display = "none";
			D.CAL.DOM.ConfCnt2.style.display = "none";
			D.CAL.DOM.ConfCnt3.style.display = "none";
			D.CAL.DOM.ConfCnt4.style.display = "none";
			D.CAL.DOM.StatusComCnt.style.display = "none";
		}

		if (this.allowMeetings && this.Event.IsMeeting(oEvent))
		{
			// Set host info
			if (oEvent.MEETING)
			{
				D.CAL.DOM.Host.innerHTML = BX.util.htmlspecialchars(oEvent.MEETING.HOST_NAME || oEvent.MEETING_HOST) + this.ItsYou(oEvent.MEETING_HOST);
				D.CAL.DOM.Host.href = this.GetUserHref(oEvent.MEETING_HOST);
			}

			D.CAL.DOM.AttRow.style.display = "";
			var Attendees = this.Event.Attendees(oEvent);
			D.CAL.UserControl.SetValues(Attendees);

			if (oEvent.USER_MEETING)
			{
				// User already confirmed
				var isAttendee = this.Event.IsAttendee(oEvent);

				if (isAttendee)
				{
					if (oEvent.USER_MEETING.STATUS == 'Y')
					{
						D.CAL.DOM.ConfCnt1.style.display = '';
					}
					else if(oEvent.USER_MEETING.STATUS == 'N')
					{
						D.CAL.DOM.ConfCnt4.style.display = '';
						D.CAL.DOM.DeclineNotice.style.display = (this.startupEvent && this.startupEvent.ID == oEvent.ID && !this.userSettings.showDeclined) ? '' : 'none';
					}
					else if(oEvent.USER_MEETING.STATUS == 'Q')
					{
						D.CAL.DOM.ConfCnt2.style.display = '';
						D.CAL.DOM.StatusComCnt.style.display = '';
					}
				}
			}

			if (oEvent.MEETING && oEvent.MEETING.OPEN)
			{
				var bSet = true;
				for(var ind in Attendees)
				{
					if (Attendees[ind] && Attendees[ind].id == this.userId && Attendees[ind].status != 'N')
					{
						bSet = false;
						break;
					}
				}
				if (bSet)
					D.CAL.DOM.ConfCnt3.style.display = '';
			}

			// Show invitation text
			if (oEvent.MEETING.TEXT && oEvent.MEETING.TEXT.length > 0)
			{
				var text = BX.util.htmlspecialchars(oEvent.MEETING.TEXT);
				text = text.replace(/\n/g, "<br>");
				D.CAL.DOM.MeetingText.innerHTML = text;
				D.CAL.DOM.meetingTextRow.style.display = '';
			}
		}

		if (oEvent.ACCESSIBILITY)
		{
			D.CAL.DOM.AccessabRow.style.display = '';
			D.CAL.DOM.AccessSpan.innerHTML = EC_MESS['Acc_' + oEvent.ACCESSIBILITY];
		}
		else
		{
			D.CAL.DOM.AccessabRow.style.display = 'none';
		}

		if (oEvent.PRIVATE_EVENT)
			D.CAL.DOM.privateRow.style.display = '';
		else
			D.CAL.DOM.privateRow.style.display = 'none';

	}

	// Hide edit & delete links for read only events
	if (this.bIntranet && this.Event.IsHost(oEvent))
	{
		D.CAL.DOM.delBut.style.display = "";
		D.CAL.DOM.editBut.style.display = "";
	}
	else if (this.bIntranet && this.Event.IsAttendee(oEvent))
	{
		D.CAL.DOM.delBut.style.display = "none";
		D.CAL.DOM.editBut.style.display = "";
	}
	else
	{
		if (this.Event.CanDo(oEvent, 'edit'))
		{
			D.CAL.DOM.delBut.style.display = "";
			D.CAL.DOM.editBut.style.display = "";
		}
		else
		{
			D.CAL.DOM.delBut.style.display = "none";
			D.CAL.DOM.editBut.style.display = "none";
		}
	}

	D.show();
	this.SetPopupTab(0, D); // Activate first tab

	// Get userfields html
	this.GetUserFieldsHTML(oEvent, false);

	this.Event.Blink(oEvent, false);
}

JCEC.prototype.CloseViewDialog = function(bClosePopup)
{
	BX.removeCustomEvent("OnUCFeedChanged", BX.proxy(function(){this.AdjustOverlay(this.oViewEventDialog);}, this));
	if (bClosePopup === true)
		this.oViewEventDialog.close();
};

// # # #  #  #  # EDIT CALENDAR DIALOG # # #  #  #  #
JCEC.prototype.CreateSectDialog = function()
{
	var
		pTitle = BX.create("span", {html: EC_MESS.NewCalenTitle}),
		_this = this;

	var D = new BX.PopupWindow("BXCSection", null, {
		overlay: {opacity: 10},
		autoHide: false,
		closeByEsc : true,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		titleBar: {content: pTitle},
		closeIcon: {right : "12px", top : "10px"},
		className: "bxc-popup-tabed bxc-popup-window",
		buttons: [
			new BX.PopupWindowButton({
				text: EC_MESS.DelSect,
				id: this.id + '_bxec_cal_del_but',
				className: "bxec-popup-link-icon bxec-popup-del-ex",
				events: {click : function(){
					if (_this.DeleteSection(D.CAL.oSect))
						_this.CloseSectDialog(true);
				}}
			}),
			new BX.PopupWindowButton({
				text: EC_MESS.Save,
				className: "popup-window-button-accept",
				events: {click : function(){if (_this.SaveSection()){_this.CloseSectDialog(true);}}}
			}),
			new BX.PopupWindowButtonLink({
				text: EC_MESS.Close,
				className: "popup-window-button-link-cancel",
				events: {click : function(){_this.CloseSectDialog(true);}}
			})
		],
		content: BX('bxec_sect_d_' + this.id),
		events: {}
	});

	BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseSectDialog, this));

	D.CAL = {
		DOM: {
			Title: pTitle,
			pTabs: BX(this.id + '_editsect_tabs'),
			Name: BX(this.id + '_edcal_name'),
			Desc: BX(this.id + '_edcal_desc'),
			//Color: pColor,
			ExpAllow: BX(this.id + '_bxec_cal_exp_allow'),
			delBut: BX(this.id + '_bxec_cal_del_but')
		}
	};

	D.CAL.Access = new ECCalendarAccess({
		bind: 'calendar_section',
		GetAccessName: BX.proxy(this.GetAccessName, this),
		pCont: BX(this.id + 'access-values-cont'),
		pLink: BX(this.id + 'access-link')
	});

	D.CAL.ColorControl = this.InitColorDialogControl('sect', function(color, textColor){
		D.CAL.Color = color;
		D.CAL.TextColor = textColor;
	});

	if (this.arConfig.bExchange && this.Personal())
		D.CAL.DOM.Exch = BX(this.id + '_bxec_cal_exch');

	this.ChargePopupTabs(D, this.id + 'sect-tab-');
	this.oSectDialog = D;

	if (this.bUser && this.Personal())
		D.CAL.DOM.MeetingCalendarCh = BX(this.id + '_bxec_meeting_calendar');

	if (this.bSuperpose && this.Personal())
	{
		D.CAL.DOM.add2SPCont = BX(this.id + '_bxec_cal_add2sp_cont');
		D.CAL.DOM.add2SP = BX(this.id + '_bxec_cal_add2sp');
	}
	D.CAL.DOM.ExpAllow.onclick = function() {_this._AllowCalendarExportHandler(this.checked);};
}

JCEC.prototype.ShowSectionDialog = function(oSect)
{
	if (!this.oSectDialog)
		this.CreateSectDialog();

	var D = this.oSectDialog;
	D.show();
	this.SetPopupTab(0, D); // Activate first tab

	if (!oSect)
	{
		oSect = {
			PERM: {
				access:true,//this.PERM.access,
				add:true, edit:true, edit_section:true, view_full:true, view_time:true, view_title:true
			}
		};
		D.CAL.bNew = true;

		D.CAL.DOM.Title.innerHTML = EC_MESS.NewCalenTitle;
		D.CAL.DOM.delBut.style.display = 'none';

		oSect.COLOR = this.GetFreeDialogColor();

		D.CAL.DOM.ExpAllow.checked = true;
		this._AllowCalendarExportHandler(true);
		if (D.CAL.DOM.ExpSet)
			D.CAL.DOM.ExpSet.value = 'all';

		if (this.bSuperpose && this.Personal())
		{
			D.CAL.DOM.add2SP.checked = true;
			D.CAL.DOM.add2SPCont.style.display = BX.browser.IsIE() ? 'inline' : 'table-row';
		}

		if (this.arConfig.bExchange && this.Personal())
		{
			D.CAL.DOM.Exch.disabled = false;
			D.CAL.DOM.Exch.checked = true;
		}

		// Default access
		oSect.ACCESS = this.new_section_access;
	}
	else // Edit Section
	{
		if (this.arConfig.bExchange && this.Personal())
		{
			D.CAL.DOM.Exch.checked = !!oSect.IS_EXCHANGE;
			D.CAL.DOM.Exch.disabled = true;
		}

		D.CAL.bNew = false;
		D.CAL.DOM.Title.innerHTML = EC_MESS.EditCalenTitle;
		D.CAL.DOM.delBut.style.display = '';

		if (!oSect.COLOR)
			oSect.COLOR = this.arConfig.arCalColors[0];

		D.CAL.DOM.ExpAllow.checked = oSect.EXPORT || false;
		this._AllowCalendarExportHandler(oSect.EXPORT);
		if (oSect.EXPORT)
			D.CAL.DOM.ExpSet.value = oSect.EXPORT_SET || 'all';
		if (this.bSuperpose  && this.Personal())
			D.CAL.DOM.add2SPCont.style.display = 'none';
	}

	D.CAL.ColorControl.Set(oSect.COLOR, oSect.TEXT_COLOR);

	// Access
	this.ShowPopupTab(D.CAL.Tabs[1], oSect.PERM.access);
	if (oSect.PERM.access)
	{
		if (this.type == 'user' && this.Personal() && oSect.ACCESS['U' + this.ownerId])
			delete oSect.ACCESS['U' + this.ownerId];
		else if (this.type == 'group' && oSect.ACCESS['SG' + this.ownerId + '_A'])
			delete oSect.ACCESS['SG' + this.ownerId + '_A'];

		D.CAL.Access.SetSelected(oSect.ACCESS);
	}

	D.CAL.oSect = oSect;
	this.bEditCalDialogOver = false;

	if (this.bUser && this.Personal())
		D.CAL.DOM.MeetingCalendarCh.checked = (!D.CAL.bNew && this.userSettings.meetSection == oSect.ID);

	var _this = this;
	D.CAL.DOM.Name.value = oSect.NAME || '';
	D.CAL.DOM.Desc.value = oSect.DESCRIPTION || '';

	BX.focus(D.CAL.DOM.Name);
}

JCEC.prototype.CloseSectDialog = function(bClosePopup)
{
	if (bClosePopup === true)
		this.oSectDialog.close();
}

JCEC.prototype._AllowCalendarExportHandler = function(bAllow)
{
	if (!this.oSectDialog.CAL.DOM.ExpDiv)
		this.oSectDialog.CAL.DOM.ExpDiv = BX(this.id + '_bxec_calen_exp_div');
	if (!this.oSectDialog.CAL.DOM.ExpSet && bAllow)
		this.oSectDialog.CAL.DOM.ExpSet = BX(this.id + '_bxec_calen_exp_set');
	this.oSectDialog.CAL.DOM.ExpDiv.style.display = bAllow ? 'block' : 'none';
}

// # # #  #  #  # Export Calendar Dialog # # #  #  #  #
JCEC.prototype.CreateExportDialog = function()
{
	var _this = this;
	var pTitle = BX.create("span");
	var D = new BX.PopupWindow("BXCExportDialog", null, {
		overlay: {opacity: 10},
		autoHide: false,
		closeByEsc : true,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		titleBar: {content: pTitle},
		closeIcon: {right : "12px", top : "10px"},
		className: "bxc-popup-window",
		buttons: [
			new BX.PopupWindowButton({
				text: EC_MESS.Close,
				className: "popup-window-button-accept",
				events: {click : function(){_this.CloseExportDialog(true);}}
			})
		],
		content: BX('bxec_excal_' + this.id)
	});

	BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseExportDialog, this));

	D.CAL = {
		DOM: {
			Title: pTitle,
			Link: BX(this.id + '_excal_link'),
			NoticeLink: BX(this.id + '_excal_link_outlook'),
			Text: BX(this.id + '_excal_text'),
			Warn: BX(this.id + '_excal_warning')
		}
	};

	D.CAL.DOM.NoticeLink.onclick = function(){this.parentNode.className = "";};
	this.oExportDialog = D;
}

JCEC.prototype.ShowExportDialog = function(oCalen)
{
	if (oCalen && oCalen.EXPORT && !oCalen.EXPORT.ALLOW)
		return;

	if (!this.oExportDialog)
		this.CreateExportDialog();

	var D = this.oExportDialog;
	D.show();

	D.CAL.DOM.NoticeLink.parentNode.className = "bxec-excal-notice-hide"; // Hide help
	D.CAL.DOM.Warn.className = 'bxec-export-warning-hidden';

	// Create link
	var link = this.path;
	link += (link.indexOf('?') >= 0) ? '&' : '?';

	if (oCalen)
	{
		D.CAL.DOM.Title.innerHTML = EC_MESS.ExpDialTitle;
		D.CAL.DOM.Text.innerHTML = EC_MESS.ExpText;
		link += 'action=export' + oCalen.EXPORT.LINK;
	}

	var webCalLink = 'webcal' + link.substr(link.indexOf('://'));
	D.CAL.DOM.Link.onclick = function(e) {window.location.href = webCalLink; BX.PreventDefault(e);};
	D.CAL.DOM.Link.href = link;
	D.CAL.DOM.Link.innerHTML = link;

	BX.ajax.get(link + '&check=Y', "", function(result)
	{
		setTimeout(function()
		{
			BX.closeWait(D.CAL.DOM.Title);
			if (!result || result.length <= 0 || result.toUpperCase().indexOf('BEGIN:VCALENDAR') == -1)
				D.CAL.DOM.Warn.className = 'bxec-export-warning';
		}, 300);
	});
}

JCEC.prototype.CloseExportDialog = function(bClosePopup)
{
	if (bClosePopup === true)
		this.oExportDialog.close();
};

// # # #  #  #  # Superpose Calendar Dialog # # #  #  #  #
JCEC.prototype.CreateSuperposeDialog = function()
{
	var _this = this;
	var D = new BX.PopupWindow("BXCSuperpose", null, {
		overlay: {opacity: 10},
		autoHide: false,
		closeByEsc : true,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		titleBar: {content: BX.create("span", {html: EC_MESS.SPCalendars})},
		closeIcon: { right : "12px", top : "10px"},
		className: "bxc-popup-window",
		buttons: [
			new BX.PopupWindowButton({
				text: EC_MESS.Save,
				className: "popup-window-button-accept",
				events: {click : function(){
					_this.SPD_SaveSuperposed();
					_this.CloseSuperposeDialog(true);
				}}
			}),
			new BX.PopupWindowButtonLink({
				text: EC_MESS.Close,
				className: "popup-window-button-link-cancel",
				events: {click : function(){_this.CloseSuperposeDialog(true);}}
			})
		],
		content: BX('bxec_superpose_' + this.id),
		events: {}
	});

	BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseSuperposeDialog, this));

	D.CAL = {
		DOM: {
			UserCntInner: BX('bxec_sp_type_user_cont_' + this.id),
			GroupCnt: BX('bxec_sp_type_group_' + this.id),
			GroupCntInner: BX('bxec_sp_type_group_cont_' + this.id),
			CommonCnt: BX('bxec_sp_type_common_' + this.id),
			DelAllUsersLink: BX('bxec_sp_dell_all_sp_' + this.id),
			UserSearchCont: BX(this.id + '_sp_user_search_input_cont'),
			NotFoundNotice: BX(this.id + '_sp_user_nf_notice'),
			arCat : {}
		},
		arSect: {},
		arGroups: {},
		arCals: {},
		curTrackedUsers: {}
	};

	BX.addCustomEvent(window, "onUserSelectorOnChange", function(arUsers){D.CAL.curTrackedUsers = arUsers;});

	D.CAL.DOM.AddUsersLinkCont = BX(this.id + '_user_control_link_sp');

	D.CAL.DOM.AddUsersLinkCont.onclick = function(e)
	{
		if (BX.PopupMenu && BX.PopupMenu.currentItem)
			BX.PopupMenu.currentItem.popupWindow.close();

		if(!e)
			e = window.event;

		if (!D.CAL.DOM.SelectUserPopup)
		{
			D.CAL.DOM.SelectUserPopup = BX.PopupWindowManager.create("bxc-user-popup-sp", D.CAL.DOM.AddUsersLinkCont, {
				offsetTop : 1,
				autoHide : true,
				closeByEsc : true,
				content : BX("BXCalUserSelectSP_selector_content"),
				className: 'bxc-popup-user-select',
				buttons: [
					new BX.PopupWindowButton({
						text: EC_MESS.Add,
						events: {click : function()
						{
							D.CAL.DOM.SelectUserPopup.close();

							var users = [], i;
							for (i in D.CAL.curTrackedUsers)
								if (D.CAL.curTrackedUsers[i] && i > 0 && parseInt(i) == i)
									users.push(i);

							_this.Request({
								postData: _this.GetReqData('spcal_user_cals', {users : users}),
								errorText: EC_MESS.CalenSaveErr,
								handler: function(oRes)
								{
									if (oRes)
									{
										if (oRes.sections)
										{
											_this.SPD_BuildSections(oRes.sections, true);
										}
										else
										{
											_this.oSupDialog.CAL.DOM.NotFoundNotice.style.visibility = 'visible';
											setTimeout(function(){_this.oSupDialog.CAL.DOM.NotFoundNotice.style.visibility = 'hidden';}, 4000);
										}
										return true;
									}
									return false;
								}
							});
						}}
					}),
					new BX.PopupWindowButtonLink({
						text: EC_MESS.Close,
						className: "popup-window-button-link-cancel",
						events: {click : function(){D.CAL.DOM.SelectUserPopup.close();}}
					})
				]
			});
		}

		D.CAL.curTrackedUsers = {};
		D.CAL.DOM.SelectUserPopup.show();
		BX.PreventDefault(e);
	};

	this.oSupDialog = D;

	if (this.arSPSections)
		this.SPD_BuildSections(this.arSPSections, false); // All sections with checkboxes and groups and categories builds here
}

JCEC.prototype.SPD_BuildSections = function(arSections, bRegister)
{
	var
		_this = this,
		D = this.oSupDialog,
		i, oSect, pCatCont, pItem, key, catTitle, id;

	for (i in arSections)
	{
		oSect = arSections[i];
		if (!oSect.ID)
			return;

		if (oSect.CAL_TYPE == 'user')
		{
			pCatCont = D.CAL.DOM.UserCntInner;
		}
		else if(oSect.CAL_TYPE == 'group')
		{
			pCatCont = D.CAL.DOM.GroupCntInner;
			D.CAL.DOM.GroupCnt.style.display = "block";
		}
		else
		{
			pCatCont = D.CAL.DOM.CommonCnt;
			D.CAL.DOM.CommonCnt.style.display = "block";
		}

		key = oSect.CAL_TYPE + oSect.OWNER_ID;
		if (!D.CAL.DOM.arCat[key] || !BX.isNodeInDom(D.CAL.DOM.arCat[key].pCat))
		{
			if (oSect.CAL_TYPE == 'user' || oSect.CAL_TYPE == 'group')
				catTitle = oSect.OWNER_NAME;
			else
				catTitle = oSect.TYPE_NAME;

			pCat = pCatCont.appendChild(BX.create("DIV", {props: {className: "bxc-spd-cat"}}));
			pCatTitle = pCat.appendChild(BX.create("DIV", {props: {className: "bxc-spd-cat-title"}, html: '<span class="bxc-spd-cat-plus"></span><span class="bxc-spd-cat-title-inner">' + BX.util.htmlspecialchars(catTitle) + '</span>'}));
			pCatSections = pCat.appendChild(BX.create("DIV", {props: {className: "bxc-spd-cat-sections"}}));
			pCatTitle.onclick = function(){BX.toggleClass(this.parentNode, "bxc-spd-cat-collapsed")}

			// Add link for del user from tracking users list
			if (oSect.CAL_TYPE == 'user' && oSect.OWNER_ID != this.userId)
			{
				pCatTitle.appendChild(BX.create("A", {props: {href: "javascript:void(0);", className: "bxc-spd-del-cat", title: EC_MESS.DeleteDynSPGroupTitle}, text: EC_MESS.DeleteDynSPGroup, events: {click: function(e){_this.SPD_DelTrackingUser(this.getAttribute('bx-data'), this); return BX.PreventDefault(e)}}})).setAttribute('bx-data', oSect.OWNER_ID);
			}

			D.CAL.DOM.arCat[key] = {
				pCat : pCat,
				pTitle : pCatTitle,
				pSections : pCatSections
			};
		}

		id = this.id + "spd-sect" + oSect.ID;
		pItem = BX.create("DIV", {props: {className: "bxc-spd-sect-cont"}});
		pCh = pItem.appendChild(BX.create("SPAN", {props: {className: "bxc-spd-sect-check"}})).appendChild(BX.create("INPUT", {props: {type: "checkbox", id: id}}));
		pLabel = pItem.appendChild(BX.create("SPAN", {props: {className: "bxc-spd-sect-label"}, html: '<label for="' + id + '"><span>' + BX.util.htmlspecialchars(oSect.NAME) + '</span></label>'}));

		D.CAL.DOM.arCat[key].pSections.appendChild(pItem);
		D.CAL.arSect[oSect.ID] = {pCh: pCh, pItem: pItem, oSect: oSect};

		if (bRegister)
			this.arSPSections.push(oSect);
	}
};

JCEC.prototype.SPD_SaveSuperposed = function()
{
	var
		i, item;

	for (i in this.oSupDialog.CAL.arSect)
	{
		item = this.oSupDialog.CAL.arSect[i];
		if (item.pCh.checked)
		{
			// Section already added to superposed
			if(this.arSectionsInd[i])
			{
				this.arSections[this.arSectionsInd[i]].SUPERPOSED = true;
			}
			else if(!this.arSectionsInd[i])
			{
				item.oSect.SUPERPOSED = true;
				this.arSections.push(item.oSect);
				this.arSectionsInd[item.oSect.ID] = this.arSections.length - 1;
			}
		}
		else
		{
			if (this.arSectionsInd[i])
			{
				this.arSections[this.arSectionsInd[i]].SUPERPOSED = false;
			}
		}
	}
	this.SetSuperposed();
};

JCEC.prototype.SPD_DelTrackingUser = function(userId, pLink)
{
	var pCont = BX.findParent(pLink, {className: 'bxc-spd-cat'});
	if (pCont)
		pCont.parentNode.removeChild(pCont);

	for (i in this.oSupDialog.CAL.arSect)
	{
		item = this.oSupDialog.CAL.arSect[i];
		if (item && item.oSect && item.oSect.CAL_TYPE=='user' && item.oSect.OWNER_ID == userId)
			item.pCh.checked = false;
	}
	this.SPD_SaveSuperposed();

	this.Request({
		postData: this.GetReqData('spcal_del_user', {userId: parseInt(userId)}),
		handler: function(oRes)
		{
			if (oRes)
				return true;
		}
	});
}

JCEC.prototype.ShowSuperposeDialog = function()
{
	var _this = this;
	if (!this.arSPSections)
	{
		return this.Request({
			getData: _this.GetReqData('get_superposed'),
			handler: function(oRes)
			{
				if (oRes)
				{
					_this.arSPSections = oRes.sections || [];
					return _this.ShowSuperposeDialog();
				}
				return false;
			}
		});
	}

	if (!this.oSupDialog)
		this.CreateSuperposeDialog();

	var D = this.oSupDialog;
	D.show();

	for (var i = 0, l = l = this.arSections.length; i < l; i++)
	{
		if (this.arSections[i].ID && D.CAL.arSect[this.arSections[i].ID])
			D.CAL.arSect[this.arSections[i].ID].pCh.checked = !!this.arSections[i].SUPERPOSED;
	}
}

JCEC.prototype.CloseSuperposeDialog = function(bClosePopup)
{
	if (bClosePopup === true)
		this.oSupDialog.close();
};

JCEC.prototype.BuildSectionSelect = function(oSel, value)
{
	oSel.options.length = 0;
	var i, opt, el, selected;
	oSel.parentNode.className = 'bxec-cal-sel-cel';
	for (i = 0; i < this.arSections.length; i++)
	{
		el = this.arSections[i];
		if (el.PERM.edit_section && this.IsCurrentViewSect(el))
		{
			selected = value == el.ID;
			opt = new Option(el.NAME, el.ID, selected, selected);
			oSel.options.add(opt);
			if(!BX.browser.IsIE())
				opt.style.backgroundColor = el.COLOR;
		}
	}

	if (oSel.options.length <= 0)
		oSel.parentNode.className = 'bxec-cal-sel-cel-empty';
};

JCEC.prototype.IsCurrentViewSect = function(el)
{
	return el.CAL_TYPE == this.type && el.OWNER_ID == this.ownerId;
};

// # # #  #  #  # User Settings Dialog # # #  #  #  #
JCEC.prototype.CreateSetDialog = function()
{
	var _this = this;
	var D = new BX.PopupWindow("BXCSettings", null, {
		overlay: {opacity: 10},
		autoHide: false,
		closeByEsc : true,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		titleBar: {content: BX.create("span", {props: {className: 'bxec-popup-title', id: this.id + '_viewev_title'}, html: this.PERM.access ? EC_MESS.Settings : EC_MESS.UserSettings})},
		closeIcon: {right : "12px", top : "10px"},
		className: 'bxc-popup-tabed bxc-popup-window',
		buttons: [
			new BX.PopupWindowButton({
				text: EC_MESS.Save,
				className: "popup-window-button-accept",
				events: {click : function(){
					_this.CloseSetDialog(true);
					_this.SaveSettings();
				}}
			}),
			new BX.PopupWindowButtonLink({
				text: EC_MESS.Close,
				className: "popup-window-button-link-cancel",
				events: {click : function(){_this.CloseSetDialog(true);}}
			})
		],
		content: BX('bxec_uset_' + this.id)
	});

	BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseSetDialog, this));

	D.CAL = {
		inPersonal : this.type == 'user' && this.ownerId == this.userId,
		DOM: {
			pTabs: BX(this.id + '_set_tabs'),
			ShowMuted: BX(this.id + '_show_muted')
		}
	};

	if (D.CAL.inPersonal)
	{
		D.CAL.DOM.SectSelect = BX(this.id + '_set_sect_sel');
		D.CAL.DOM.Blink = BX(this.id + '_uset_blink');
		D.CAL.DOM.ShowBanner = BX(this.id + '_show_banner');
		D.CAL.DOM.ShowDeclined = BX(this.id + '_show_declined');
	}


	if (this.PERM.access)
	{
		D.CAL.Access = new ECCalendarAccess({
			bind: 'calendar_type',
			GetAccessName: BX.proxy(this.GetAccessName, this),
			pCont: BX(this.id + 'type-access-values-cont'),
			pLink: BX(this.id + 'type-access-link')
		});

		D.CAL.DOM.WorkTimeStart = BX(this.id + 'work_time_start');
		D.CAL.DOM.WorkTimeEnd = BX(this.id + 'work_time_end');
		D.CAL.DOM.WeekHolidays = BX(this.id + 'week_holidays');
		D.CAL.DOM.YearHolidays = BX(this.id + 'year_holidays');
		D.CAL.DOM.YearWorkdays = BX(this.id + 'year_workdays');
		D.CAL.DOM.WeekStart = BX(this.id + 'week_start');
	}

	if (this.bSuperpose)
	{
		D.CAL.DOM.ManageSuperpose = BX(this.id + '-set-manage-sp');
		D.CAL.DOM.ManageSuperpose.onclick = function(){_this.ShowSuperposeDialog()};
	}

	D.CAL.DOM.ManageCalDav = BX(this.id + '_manage_caldav');
	if (D.CAL.DOM.ManageCalDav)
		D.CAL.DOM.ManageCalDav.onclick = function(){_this.ShowExternalDialog()};

	D.CAL.DOM.UsetClearAll = BX(this.id + '_uset_clear');
	if (D.CAL.DOM.UsetClearAll)
		D.CAL.DOM.UsetClearAll.onclick = function()
		{
			if (confirm(EC_MESS.ClearUserSetConf))
			{
				_this.CloseSetDialog(true);
				_this.ClearPersonalSettings();
			}
		};

	this.ChargePopupTabs(D, this.id + 'set-tab-');

	if (!this.PERM.access && D.CAL.DOM.pTabs)
		D.CAL.DOM.pTabs.style.display = 'none';

	this.oSetDialog = D;
}

JCEC.prototype.ShowSetDialog = function()
{
	if (!this.oSetDialog)
		this.CreateSetDialog();

	var D = this.oSetDialog;
	D.show();
	this.SetPopupTab(0, D); // Activate first tab

	// Set personal user settings

	if (D.CAL.inPersonal)
	{
		D.CAL.DOM.SectSelect.options.length = 0;
		var i, l = this.arSections.length, opt, el, sel = !this.userSettings.meetSection;
		D.CAL.DOM.SectSelect.options.add(new Option(' - ' + EC_MESS.FirstInList + ' - ', 0, sel, sel));
		for (i = 0; i < l; i++)
		{
			el = this.arSections[i];
			if (el.CAL_TYPE == 'user' && el.OWNER_ID == this.userId)
			{
				sel = this.userSettings.meetSection == el.ID;
				opt = new Option(el.NAME, el.ID, sel, sel);
				opt.style.backgroundColor = el.COLOR;
				D.CAL.DOM.SectSelect.options.add(opt);
			}
		}

		D.CAL.DOM.Blink.checked = !!this.userSettings.blink;
		D.CAL.DOM.ShowBanner.checked = !!this.userSettings.showBanner;
		D.CAL.DOM.ShowDeclined.checked = !!this.userSettings.showDeclined;
	}
	D.CAL.DOM.ShowMuted.checked = !!this.userSettings.showMuted;

	if (this.PERM.access)
	{
		// Set access for calendar type
		D.CAL.Access.SetSelected(this.typeAccess);
		D.CAL.DOM.WorkTimeStart.value = this.settings.work_time_start;
		D.CAL.DOM.WorkTimeEnd.value = this.settings.work_time_end;
		for(var i = 0, l = D.CAL.DOM.WeekHolidays.options.length; i < l; i++)
			D.CAL.DOM.WeekHolidays.options[i].selected = BX.util.in_array(D.CAL.DOM.WeekHolidays.options[i].value, this.settings.week_holidays);
		D.CAL.DOM.YearHolidays.value = this.settings.year_holidays;
		D.CAL.DOM.YearWorkdays.value = this.settings.year_workdays;
		D.CAL.DOM.WeekStart.value = this.settings.week_start;
	}
};

JCEC.prototype.CloseSetDialog  = function(bClosePopup)
{
	if (bClosePopup === true)
		this.oSetDialog.close();
};

// # # #  #  #  # External Calendars Dialog # # #  #  #  #
JCEC.prototype.CreateExternalDialog = function()
{
	var _this = this;
	var D = new BX.PopupWindow("BXCExternalDialog", null, {
		overlay: {opacity: 10},
		autoHide: false,
		closeByEsc : true,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		titleBar: {content: BX.create("span", {html: EC_MESS.CalDavDialogTitle})},
		closeIcon: {right : "12px", top : "10px"},
		className: "bxc-popup-window",
		buttons: [
			new BX.PopupWindowButton({
				text: EC_MESS.AddCalDav,
				className: "bxec-popup-link-icon bxec-popup-add-ex",
				events: {click : function(){
					var i = D.CAL.arConnections.length;
					D.CAL.arConnections.push({bNew: true, name: EC_MESS.NewExCalendar, link: '', user_name: ''});
					_this.ExD_DisplayConnection(D.CAL.arConnections[i], i);
					_this.ExD_EditConnection(i);
				}}
			}),
			new BX.PopupWindowButton({
				text: EC_MESS.Save,
				className: "popup-window-button-accept",
				events: {click : function(){
					if (D.CAL.bLockClosing)
						return alert(EC_MESS.CalDavConWait);

					if (D.CAL.curEditedConInd !== false && D.CAL.arConnections[D.CAL.curEditedConInd])
						_this.ExD_SaveConnectionData(D.CAL.curEditedConInd);

					_this.arConnections = D.CAL.arConnections;
					D.CAL.bLockClosing = true;

					_this.SaveConnections(
						function(res)
						{
							D.CAL.bLockClosing = false;
							if (res)
							{
								_this.CloseExternalDialog(true);
								window.location = window.location;
							}
						},
						function(){D.CAL.bLockClosing = false;}
					);
				}}
			}),
			new BX.PopupWindowButtonLink({
				text: EC_MESS.Close,
				className: "popup-window-button-link-cancel",
				events: {click : function(){_this.CloseExternalDialog(true);}}
			})
		],
		content: BX('bxec_cdav_' + this.id)
	});

	BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseExternalDialog, this));

	D.CAL = {
		DOM: {
			List: BX(this.id + '_bxec_dav_list'),
			EditConDiv: BX(this.id + '_bxec_dav_new'),
			EditName: BX(this.id + '_bxec_dav_name'),
			EditLink: BX(this.id + '_bxec_dav_link'),
			UserName: BX(this.id + '_bxec_dav_username'),
			Pass: BX(this.id + '_bxec_dav_password')
		}
	};

	this.oExternalDialog = D;
}

JCEC.prototype.ShowExternalDialog = function()
{
	if (!this.oExternalDialog)
		this.CreateExternalDialog();

	var D = this.oExternalDialog, i;
	D.show();
	D.CAL.curEditedConInd = false;

	BX.cleanNode(D.CAL.DOM.List);
	D.CAL.arConnections = BX.clone(this.arConnections);
	for (i = 0; i < this.arConnections.length; i++)
		this.ExD_DisplayConnection(D.CAL.arConnections[i], i);

	if (this.arConnections.length == 0) // No connections - open form to add new connection
	{
		i = D.CAL.arConnections.length;
		D.CAL.arConnections.push({bNew: true, name: EC_MESS.NewExCalendar, link: '', user_name: ''});
		this.ExD_DisplayConnection(D.CAL.arConnections[i], i);
		this.ExD_EditConnection(i);
	}
	else if (this.arConnections.length == 1)
	{
		this.ExD_EditConnection(0);
	}
};

JCEC.prototype.CloseExternalDialog = function(bClosePopup)
{
	if (bClosePopup === true)
		this.oExternalDialog.close();
};

JCEC.prototype.ExD_EditConnection = function(ind)
{
	var
		D = this.oExternalDialog,
		con = D.CAL.arConnections[ind];

	for(var _ind in D.CAL.arConnections)
	{
		if (D.CAL.arConnections[_ind] && _ind != ind && BX.hasClass(D.CAL.arConnections[_ind].pConDiv, "bxec-dav-item-edited"))
		{
			if (D.CAL.DOM.EditConDiv.parentNode == D.CAL.arConnections[_ind].pConDiv)
				this.ExD_SaveConnectionData(_ind);
			BX.removeClass(D.CAL.arConnections[_ind].pConDiv, "bxec-dav-item-edited");
		}
	}

	if (con.del || D.CAL.curEditedConInd === ind)
		return;

	if (D.CAL.curEditedConInd !== false && D.CAL.arConnections[D.CAL.curEditedConInd])
	{
		this.ExD_SaveConnectionData(D.CAL.curEditedConInd);
		BX.removeClass(D.CAL.arConnections[D.CAL.curEditedConInd].pConDiv, "bxec-dav-item-edited");
	}

	D.CAL.curEditedConInd = ind;

	D.CAL.DOM.EditName.value = con.name;
	D.CAL.DOM.EditLink.value = con.link;
	D.CAL.DOM.UserName.value = con.user_name;

	if (con.id > 0)
		this.ExD_CheckPass();
	else
		D.CAL.DOM.Pass.value = '';

	setTimeout(function(){BX.focus(D.CAL.DOM.EditLink);}, 100);

	D.CAL.DOM.EditName.onkeyup = D.CAL.DOM.EditName.onfocus = D.CAL.DOM.EditName.onblur = function()
	{
		if (D.CAL.changeNameTimeout)
			clearTimeout(D.CAL.changeNameTimeout);

		D.CAL.changeNameTimeout = setTimeout(function(){
			if (D.CAL.curEditedConInd !== false && D.CAL.arConnections[D.CAL.curEditedConInd])
			{
				var val = D.CAL.DOM.EditName.value;
				if (val.length > 25)
					val = val.substr(0, 23) + "...";
				D.CAL.arConnections[D.CAL.curEditedConInd].pText.innerHTML = BX.util.htmlspecialchars(val);
				D.CAL.arConnections[D.CAL.curEditedConInd].pText.title = D.CAL.DOM.EditName.value;
			}
		}, 50);
	};

	con.pConDiv.appendChild(D.CAL.DOM.EditConDiv);
	BX.addClass(con.pConDiv, "bxec-dav-item-edited");
};

JCEC.prototype.ExD_DisplayConnection = function(con, ind)
{
	var
		_this = this,
		D = this.oExternalDialog,
		pConDiv = D.CAL.DOM.List.appendChild(BX.create("DIV", {props: {id: 'bxec_dav_con_' + ind, className: 'bxec-dav-item' + (ind % 2 == 0 ? '' : ' bxec-dav-item-1')}})),
		pTitle = pConDiv.appendChild(BX.create("DIV", {props: {className: 'bxec-dav-item-name'}})),
		pStatus = pTitle.appendChild(BX.create("IMG", {props: {src: "/bitrix/images/1.gif", className: 'bxec-dav-item-status'}})),
		pText = pTitle.appendChild(BX.create("SPAN", {text: con.name})),
		pCount = pTitle.appendChild(BX.create("SPAN", {text: ''})),
		pEdit = pTitle.appendChild(BX.create("A", {props: {href: 'javascript: void(0);', className: 'bxec-dav-edit'}, text: EC_MESS.CalDavEdit})),
		pCol = pTitle.appendChild(BX.create("A", {props: {href: 'javascript: void(0);', className: 'bxec-dav-col'}, text: EC_MESS.CalDavCollapse})),
		pDel = pTitle.appendChild(BX.create("A", {props: {href: 'javascript: void(0);', className: 'bxec-dav-del'}, text: EC_MESS.CalDavDel})),
		pRest = pTitle.appendChild(BX.create("A", {props: {href: 'javascript: void(0);', className: 'bxec-dav-rest'}, text: EC_MESS.CalDavRestore})),
		pDelCalendars = pTitle.appendChild(BX.create("DIV", {props: {className: 'bxec-dav-del-cal'}, children: [BX.create("LABEL", {props: {htmlFor: 'bxec_dav_con_del_cal_' + ind}, text: EC_MESS.DelConCalendars})]})),
		pDelCalCh = pDelCalendars.appendChild(BX.create("INPUT", {props: {type: 'checkbox', id: 'bxec_dav_con_del_cal_' + ind, checked: true}}));

	if (con.id > 0)
	{
		var cn = 'bxec-dav-item-status', title;
		if (con.last_result.indexOf("[200]") >= 0)
		{
			cn += ' bxec-dav-ok';
			title = EC_MESS.SyncOk + '. ' + EC_MESS.SyncDate + ': ' + con.sync_date;
		}
		else
		{
			cn += ' bxec-dav-error';
			title = EC_MESS.SyncError + ': ' + con.last_result + '. '+ EC_MESS.SyncDate + ': ' + con.sync_date;
		}
		pStatus.className = cn;
		pStatus.title = title;

		var i, l = this.arSections.length, count = 0;
		for (i = 0; i < l; i++)
			if (this.arSections[i] && this.arSections[i].CAL_DAV_CON == con.id)
				count++;

		pCount.innerHTML = " (" + count + ")";
	}

	pConDiv.onmouseover = function(){BX.addClass(this, "bxec-dav-item-over");};
	pConDiv.onmouseout = function(){BX.removeClass(this, "bxec-dav-item-over");};

	pConDiv.onclick = function()
	{
		ind = parseInt(this.id.substr('bxec_dav_con_'.length));
		_this.ExD_EditConnection(ind);
	};

	pCol.onclick = function(e)
	{
		var ind = parseInt(this.parentNode.parentNode.id.substr('bxec_dav_con_'.length));
		if (D.CAL.arConnections[ind])
		{
			_this.ExD_SaveConnectionData(ind);
			BX.removeClass(D.CAL.arConnections[ind].pConDiv, "bxec-dav-item-edited");
			_this.oExternalDialog.curEditedConInd = false;
		}
		return BX.PreventDefault(e);
	};

	pDel.onclick = function(e)
	{
		var ind = parseInt(this.parentNode.parentNode.id.substr('bxec_dav_con_'.length));
		if (D.CAL.arConnections[ind])
		{
			D.CAL.arConnections[ind].del = true;
			BX.removeClass(D.CAL.arConnections[ind].pConDiv, "bxec-dav-item-edited");
			BX.addClass(D.CAL.arConnections[ind].pConDiv, "bxec-dav-item-deleted");
			_this.ExD_SaveConnectionData(ind);
			_this.oExternalDialog.curEditedConInd = false;
		}

		return BX.PreventDefault(e);
	};

	pRest.onclick = function(e)
	{
		var ind = parseInt(this.parentNode.parentNode.id.substr('bxec_dav_con_'.length));
		if (D.CAL.arConnections[ind])
		{
			D.CAL.arConnections[ind].del = false;
			BX.removeClass(D.CAL.arConnections[ind].pConDiv, "bxec-dav-item-deleted");
		}
		return BX.PreventDefault(e);
	};

	pEdit.onclick = function(e)
	{
		var ind = parseInt(this.parentNode.parentNode.id.substr('bxec_dav_con_'.length));
		if (D.CAL.arConnections[ind])
		{
			for(var _ind in D.CAL.arConnections)
			{
				if (D.CAL.arConnections[_ind] && _ind != ind && BX.hasClass(D.CAL.arConnections[_ind].pConDiv, "bxec-dav-item-edited"))
				{
					if (D.CAL.DOM.EditConDiv.parentNode == D.CAL.arConnections[_ind].pConDiv)
						_this.ExD_SaveConnectionData(_ind);
					BX.removeClass(D.CAL.arConnections[_ind].pConDiv, "bxec-dav-item-edited");
				}
			}

			var con = D.CAL.arConnections[ind];
			BX.addClass(con.pConDiv, "bxec-dav-item-edited");
			con.pConDiv.appendChild(D.CAL.DOM.EditConDiv);
			_this.oExternalDialog.curEditedConInd = true;

			D.CAL.DOM.EditName.value = con.name;
			D.CAL.DOM.EditLink.value = con.link;
			D.CAL.DOM.UserName.value = con.user_name;

			if (con.id > 0)
				_this.ExD_CheckPass();
			else
				D.CAL.DOM.Pass.value = '';

		}
		return BX.PreventDefault(e);
	};

	con.pConDiv = pConDiv;
	con.pText = pText;
	con.pDelCalendars = pDelCalCh;
}

JCEC.prototype.ExD_SaveConnectionData = function(ind)
{
	var
		D = this.oExternalDialog,
		con = D.CAL.arConnections[ind];

	con.name = D.CAL.DOM.EditName.value;
	con.link = D.CAL.DOM.EditLink.value;
	con.user_name = D.CAL.DOM.UserName.value;
	con.pass = 'bxec_not_modify_pass';

	if (D.CAL.DOM.Pass.type.toLowerCase() == 'password' && D.CAL.DOM.Pass.title != EC_MESS.CalDavNoChange)
		con.pass = D.CAL.DOM.Pass.value;
};

JCEC.prototype.ExD_CheckPass = function()
{
	var D = this.oExternalDialog;

	if (!BX.browser.IsIE())
	{
		D.CAL.DOM.Pass.type = 'text';
		D.CAL.DOM.Pass.value = EC_MESS.CalDavNoChange;
	}
	else
	{
		D.CAL.DOM.Pass.value = '';
	}

	D.CAL.DOM.Pass.title = EC_MESS.CalDavNoChange;
	D.CAL.DOM.Pass.className = 'bxec-dav-no-change';
	D.CAL.DOM.Pass.onfocus = D.CAL.DOM.Pass.onmousedown = function()
	{
		if (!BX.browser.IsIE())
			this.type = 'password';
		this.value = '';
		this.title = '';
		this.className = '';
		this.onfocus = this.onmousedown = null;
		BX.focus(this);
	};
};

// # # #  #  #  # Mobile help Dialog # # #  #  #  #
JCEC.prototype.CreateMobileHelpDialog = function()
{
	var _this = this;
	var D = new BX.PopupWindow("BXCMobileHelp", null, {
		overlay: {opacity: 10},
		autoHide: false,
		closeByEsc : true,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		titleBar: {content: BX.create("span", {html: EC_MESS.MobileHelpTitle})},
		closeIcon: {right : "12px", top : "10px"},
		className: "bxc-popup-window",
		buttons: [
			new BX.PopupWindowButton({
				text: EC_MESS.Close,
				className: "popup-window-button-accept",
				events: {click : function(){_this.CloseMobileHelpDialog(true);}}
			})
		],
		content: BX('bxec_mobile_' + this.id)
	});

	BX.addCustomEvent(D, 'onPopupClose', BX.proxy(this.CloseMobileHelpDialog, this));

	D.CAL = {
		DOM: {
			iPhoneLink: BX('bxec_mob_link_iphone_' + this.id),
			macLink: BX('bxec_mob_link_mac_' + this.id),
			birdLink: BX('bxec_mob_link_bird_' + this.id),
			iPhoneAllCont: BX('bxec_mobile_iphone_all' + this.id),
			iPhoneOneCont: BX('bxec_mobile_iphone_one' + this.id),
			macCont: BX('bxec_mobile_mac_cont' + this.id),
			birdAllCont: BX('bxec_mobile_sunbird_all' + this.id),
			birdOneCont: BX('bxec_mobile_sunbird_one' + this.id)
		}
	};

	D.CAL.DOM.iPhoneLink.onclick = function()
	{
		if (D.CAL.calendarId == 'all')
		{
			if (D.CAL.biPhoneAllOpened)
			{
				D.CAL.DOM.iPhoneAllCont.style.display = 'none';
				BX.addClass(this, 'bxec-link-hidden');
			}
			else
			{
				D.CAL.DOM.iPhoneAllCont.style.display = 'block';
				BX.removeClass(this, 'bxec-link-hidden');
			}
			D.CAL.biPhoneAllOpened = !D.CAL.biPhoneAllOpened;
		}
		else
		{
			if (D.CAL.biPhoneOneOpened)
			{
				D.CAL.DOM.iPhoneOneCont.style.display = 'none';
				BX.addClass(this, 'bxec-link-hidden');
			}
			else
			{
				D.CAL.DOM.iPhoneOneCont.style.display = 'block';
				BX.removeClass(this, 'bxec-link-hidden');
			}
			D.CAL.biPhoneOneOpened = !D.CAL.biPhoneOneOpened;
		}
	};

	D.CAL.DOM.macLink.onclick = function()
	{
		if (D.CAL.bMacOpened)
		{
			D.CAL.DOM.macCont.style.display = 'none';
			BX.addClass(this, 'bxec-link-hidden');
		}
		else
		{
			D.CAL.DOM.macCont.style.display = 'block';
			BX.removeClass(this, 'bxec-link-hidden');
		}
		D.CAL.bMacOpened = !D.CAL.bMacOpened;
	};

	D.CAL.DOM.birdLink.onclick = function()
	{
		if (D.CAL.calendarId == 'all')
		{
			if (D.CAL.bbirdAllOpened)
			{
				D.CAL.DOM.birdAllCont.style.display = 'none';
				BX.addClass(this, 'bxec-link-hidden');
			}
			else
			{
				D.CAL.DOM.birdAllCont.style.display = 'block';
				BX.removeClass(this, 'bxec-link-hidden');
			}
			D.CAL.bbirdAllOpened = !D.CAL.bbirdAllOpened;
		}
		else
		{
			if (D.CAL.bbirdOneOpened)
			{
				D.CAL.DOM.birdOneCont.style.display = 'none';
				BX.addClass(this, 'bxec-link-hidden');
			}
			else
			{
				D.CAL.DOM.birdOneCont.style.display = 'block';
				BX.removeClass(this, 'bxec-link-hidden');
			}
			D.CAL.bbirdOneOpened = !D.CAL.bbirdOneOpened;
		}
	};

	this.oMobileDialog = D;
}

JCEC.prototype.ShowMobileHelpDialog = function(calendarId)
{
	if (!this.oMobileDialog)
		this.CreateMobileHelpDialog();

	var D = this.oMobileDialog;
	D.show();

	D.CAL.calendarId = calendarId;
	D.CAL.DOM.iPhoneAllCont.style.display = "none";
	D.CAL.DOM.iPhoneOneCont.style.display = "none";
	D.CAL.DOM.birdAllCont.style.display = "none";
	D.CAL.DOM.birdOneCont.style.display = "none";
	D.CAL.DOM.macCont.style.display = "none";

	BX.addClass(D.CAL.DOM.birdLink, 'bxec-link-hidden');
	BX.addClass(D.CAL.DOM.iPhoneLink, 'bxec-link-hidden');
	BX.addClass(D.CAL.DOM.macLink, 'bxec-link-hidden');

	var arLinks = [], i;
	if (calendarId == 'all')
	{
		arLinks = arLinks.concat(BX.findChildren(D.CAL.DOM.iPhoneAllCont, {tagName: 'SPAN', className: 'bxec-link'}, true));
		arLinks = arLinks.concat(BX.findChildren(D.CAL.DOM.birdAllCont, {tagName: 'SPAN', className: 'bxec-link'}, true));

		for (i = 0; i < arLinks.length; i++)
			if (arLinks[i] && arLinks[i].nodeName)
				arLinks[i].innerHTML = this.arConfig.caldav_link_all;
	}
	else
	{
		arLinks = arLinks.concat(BX.findChildren(D.CAL.DOM.iPhoneOneCont, {tagName: 'SPAN', className: 'bxec-link'}, true));
		arLinks = arLinks.concat(BX.findChildren(D.CAL.DOM.birdOneCont, {tagName: 'SPAN', className: 'bxec-link'}, true));

		for (i = 0; i < arLinks.length; i++)
			if (arLinks[i] && arLinks[i].nodeName)
				arLinks[i].innerHTML = BX.util.htmlspecialchars(this.arConfig.caldav_link_one.replace('#CALENDAR_ID#', calendarId));
	}

	arLinks = BX.findChildren(D.CAL.DOM.macCont, {tagName: 'SPAN', className: 'bxec-link'}, true);
	for (i = 0; i < arLinks.length; i++)
		if (arLinks[i] && arLinks[i].nodeName)
			arLinks[i].innerHTML = this.arConfig.caldav_link_all;
};

JCEC.prototype.CloseMobileHelpDialog = function(bClosePopup)
{
	if (bClosePopup === true)
		this.oMobileDialog.close();
};

JCEC.prototype.ChargePopupTabs = function(oPopup, idPrefix)
{
	if (!oPopup || !oPopup.CAL || !oPopup.CAL.DOM || !oPopup.CAL.DOM.pTabs)
		return;

	// Set tabs
	oPopup.CAL.Tabs = [];
	oPopup.CAL.activeTab = false;
	var tab, _this = this;
	for (var i in oPopup.CAL.DOM.pTabs.childNodes)
	{
		tab = oPopup.CAL.DOM.pTabs.childNodes[i];
		if (tab.nodeType == '1' && tab.className  && tab.className.indexOf('bxec-d-tab') != -1)
		{
			oPopup.CAL.Tabs.push(
			{
				tab: tab,
				cont: BX(tab.id + '-cont'),
				showed: tab.style.display != 'none'
			});
			tab.onclick = function(){_this.SetPopupTab(parseInt(this.id.substr(idPrefix.length)), oPopup)};
		}
	}
}

JCEC.prototype.ShowPopupTab = function(Tab, bShow)
{
	Tab.tab.style.display = bShow ? '' : 'none';
	Tab.cont.style.display = bShow ? '' : 'none';
	Tab.showed = !!bShow;
}

JCEC.prototype.SetPopupTab = function(curInd, oPopup)
{
	var
		i, Tab, Tabs = oPopup.CAL.Tabs;

	if (Tabs && oPopup.CAL.activeTab != curInd && !Tabs[curInd].bDisabled)
	{
		for (i in Tabs)
		{
			Tab = Tabs[i];
			if (!Tab || !Tab.cont)
				continue;

			if (i == curInd)
			{
				Tab.cont.style.display = 'block';
				BX.addClass(Tab.tab, 'bxec-d-tab-act');
			}
			else
			{
				Tab.cont.style.display = 'none';
				BX.removeClass(Tab.tab, 'bxec-d-tab-act');
			}

			BX.onCustomEvent(Tab, 'OnSetTab', [Tab, (i == curInd)]);
		}
		oPopup.CAL.activeTab = curInd;
		this.AdjustOverlay(oPopup);
	}
}

JCEC.prototype.InitColorDialogControl = function(key, OnSetValues)
{
	var
		_this = this,
		id = this.id + '-' + key,
		colorCont = BX(id + '-color-cont'),
		pColor = BX(id + '-color-inp'),
		pTextColor = BX(id + '-text-color-inp');

	function SetColors(color, text_color, check)
	{
		if (!text_color || (check && (text_color == '#FFFFFF' || text_color == '#000000')))
			text_color = _this.ColorIsDark(color) ? '#FFFFFF' : '#000000';

		try
		{
			pColor.value = color;
			pColor.style.backgroundColor = color;
			pColor.style.color = text_color;
		}
		catch(e)
		{
			color = this.arConfig.arCalColors[0];
			pColor.style.color = '#000000';
		}

		if (OnSetValues && typeof OnSetValues == 'function')
			OnSetValues(color, text_color);
	}

	colorCont.onclick = function(e)
	{
		if (!e)
			e = window.event;
		var targ = e.target || e.srcElement;
		if (targ && targ.nodeName && targ.nodeName.toLowerCase() == 'a')
		{
			var ind = parseInt(targ.id.substr((id + '-color-').length), 10);
			if (_this.arConfig.arCalColors[ind])
				SetColors(_this.arConfig.arCalColors[ind]);
		}
	};
	pColor.onblur = pColor.onkeyup = function(){SetColors(this.value);};
	pColor.onclick = function(){_this.ColorPicker.Open(
		{
			pWnd: this,
			key: key,
			id: id + '-bg',
			onSelect: function(value){SetColors(value, pColor.style.color, true);}
		});
	};

	pTextColor.onclick = function(){_this.ColorPicker.Open(
		{
			pWnd: this,
			key: key,
			id: id + '-text',
			onSelect: function(value){SetColors(pColor.value, value, false);}
		});
	};

	return {Set: SetColors}
}
/* End */
;
; /* Start:/bitrix/js/calendar/cal-week.js*/
JCEC.prototype.BuildWeekDaysTable = function()
{
	var
		oTab = this.Tabs['week'],
		pTitleR = oTab.pBodyCont.rows[0],
		pMoreEvR = oTab.pBodyCont.rows[1],
		pGridR = oTab.pBodyCont.rows[2],
		i, c;

	for (i = 0; i < 7; i++)
	{
		pTitleR.insertCell(i + 1);
		c = pMoreEvR.insertCell(i + 1);
		c.innerHTML = '<div class="bxec-wdv-more-ev">&nbsp;</div>';
	}
	pGridR.cells[0].colSpan = "9";
	oTab.pTimelineCont = pGridR.cells[0].firstChild;

	this.ResizeTabTitle(oTab);
}

JCEC.prototype.ResizeTabTitle = function(oTab)
{
	var
		width = bxInt(oTab.pBodyCont.parentNode.offsetWidth) - 40 - 16, // width - Time Column - scroll width
		dW, i;

	if (oTab.id == 'week')
	{
		oTab.dayColWidth = Math.round(width / 7);
		oTab.arDayColWidth = [];
		dW = width - (oTab.dayColWidth * 7);
		for (i = 0; i < 7; i++)
		{
			oTab.arDayColWidth[i] = oTab.dayColWidth;
			if (dW < 0)
			{
				oTab.arDayColWidth[i]--;
				dW++;
			}
			else if(dW > 0)
			{
				oTab.arDayColWidth[i]++;
				dW--;
			}
		}
	}
	else if(oTab.id == 'day')
	{
		oTab.dayColWidth = width;
		oTab.arDayColWidth = [oTab.dayColWidth];
	}
}

JCEC.prototype.FillWeekDaysTitle = function(P)
{
	this.dragDrop.Reset();
	var
		Tab = this.Tabs[P.tabId],
		tbl = Tab.pBodyCont,
		pTitleR = tbl.rows[0],
		pMoreEvR = tbl.rows[1],
		oDate = P.startDate,
		arDays = [],
		_this = this,
		i, cn, innerHtml, title, day, date, month, year, bCurDay, bHoliday, c1, c2, link;

	Tab.curDay = false;
	for (i = 1; i <= P.count; i++)
	{
		day = this.ConvertDayIndex(oDate.getDay());
		date = oDate.getDate();
		month = oDate.getMonth();
		year = oDate.getFullYear();

		innerHtml = this.days[day][1] + ', ' + oDate.getDate();
		title = this.days[day][0] + ', ' + oDate.getDate() + ' ' + this.arConfig.month_r[month] + ' ' + year;

		c1 = pTitleR.cells[i];
		c2 = pMoreEvR.cells[i];
		c1.setAttribute('data-bx-day-ind', i - 1);
		c2.setAttribute('data-bx-day-ind', i - 1);

		link = BX.create('A', {props: {className: 'bxec-day-link', href: 'javascript:void(0)', title: EC_MESS.GoToDay}, html: innerHtml});
		BX.cleanNode(c1);

		c1.appendChild(this.CreateStrut(Tab.arDayColWidth[i - 1] - 2));
		c1.appendChild(BX.create("BR"));
		c1.appendChild(link);
		link.onmousedown = function(e){return BX.PreventDefault(e);};
		link.onclick = function(e)
		{
			var D = Tab.arDays[this.parentNode.cellIndex - 1];
			_this.SetTab('day', false, {bSetDay: false});
			_this.SetDay(D.date, D.month, D.year);
			return BX.PreventDefault(e);
		};
		c1.title = title;

		bHoliday = this.week_holidays[day] || this.year_holidays[date + '.' + month]; //It's Holliday
		bCurDay = date == this.currentDate.date && month == this.currentDate.month && year == this.currentDate.year;

		cn = '';
		if (bCurDay || bHoliday)
		{
			if (bCurDay)
			{
				cn = 'bxec-cur-day';
				Tab.curDay = {cellInd: i};
			}
			if (bHoliday)
				cn += ' bxec-hol-day';
		}
		c1.className = c2.className = cn;
		arDays.push({
			day: day,
			date: date,
			month: month,
			year: year,
			bHoliday: bHoliday,
			bCurDay: bCurDay,
			pWnd: c1,
			pMoreEvents: c2,
			Events: {begining: [], hidden: [], all: []},
			EventsCount: 0
		});

		if (!this.bReadOnly)
		{
			c1.onmousedown = c2.onmousedown = function(){_this.DayTitleOnMouseDown(this, P.tabId)};
			c1.onmouseup = c2.onmouseup = function(e){if (!_this.dragDrop.IsDragDropNow()){_this.DayTitleOnMouseUp(this, P.tabId); BX.PreventDefault(e);}};
			c1.onmouseover = c2.onmouseover = function(){_this.DayTitleOnMouseOver(this, P.tabId)};
		}
		oDate.setDate(oDate.getDate() + 1); // Next day
		if (i == 1)
			Tab.activeFirst = new Date(year, month, date).getTime();
		if (i == P.count)
			Tab.activeLast = new Date(year, month, date, 23, 59).getTime();

		this.dragDrop.RegisterTitleDay(c1, c2, Tab.id);
	}

	return arDays;
}

JCEC.prototype.BuildTimelineGrid = function(oTab, arDays)
{
	var
		tbl = BX.create('TABLE', {props: {className: 'bxec-wdv-timeline-tbl'}}),
		adCN = '',
		_this = this,
		tabId = oTab.id,
		i, r1, r2, c, cj1, cj2, ghostDiv, oDay, cn
		arTF = this.arConfig.workTime[0].split('.'),
		arTT = this.arConfig.workTime[1].split('.'),
		fromHour = bxIntEx(arTF[0]),
		fromMin = bxIntEx(arTF[1]),
		toHour = bxIntEx(arTT[0]),
		toMin = bxIntEx(arTT[1]);

	oTab.arDays = arDays; // save in oTab

	if (oTab.pTimelineCont)
		BX.cleanNode(oTab.pTimelineCont);

	for (i = 0; i < 24; i++) // Every hour
	{
		bHol1 = ((i < fromHour + 1 && fromMin == 30) || (i >= toHour && toMin == 0) || i > toHour || i < fromHour);
		bHol2 = ((i >= toHour && toMin == 30) || i < fromHour || i >= toHour);

		adCN = bHol1 ? ' bxec-wdv-hol-row' : '';
		adCN2 = bHol2 ? ' bxec-wdv-hol-row' : '';

		r1 = tbl.insertRow(-1);
		r1.className = 'bxec-half-time-row1' + adCN;
		c = r1.insertCell(-1);
		c.innerHTML = this.FormatTimeByNum(i);
		c.rowSpan = '2';
		c.className = 'bxec-time';

		r2 = tbl.insertRow(-1);
		r2.className = 'bxec-half-time-row2' + adCN2;

		for (j = 0; j < oTab.daysCount; j++)
		{
			cj1 = r1.insertCell(-1);

			if (i == 0)
				cj1.appendChild(this.CreateStrut(oTab.arDayColWidth[j] - 2));

			cj2 = r2.insertCell(-1);

			if (!this.bReadOnly)
			{
				cj1.onmousedown = cj2.onmousedown = function(){_this.TimeCellOnMouseDown(this, tabId)};
				cj1.onmouseup = cj2.onmouseup = function(){_this.TimeCellOnMouseUp(this, tabId)};
				cj1.onmouseover = cj2.onmouseover = function(){_this.TimeCellOnMouseOver(this, tabId)};
			}

			oDay = arDays[j];
			if (!oDay.bHoliday && !oDay.bCurDay)
				continue;

			if (oDay.bHoliday)
			{
				BX.addClass(cj1, 'bxec-time-hol-c1');
				BX.addClass(cj2, 'bxec-time-hol-c2');
			}
			if (oDay.bCurDay)
			{
				BX.addClass(cj1, 'bxec-time-cur-c1');
				BX.addClass(cj2, 'bxec-time-cur-c2');
			}
		}
	}

	// Add Strut
	tbl.rows[0].cells[0].appendChild(this.CreateStrut(40));

	if (BX.browser.IsIE()) // Add scroll width for IE
	{
		setTimeout(function(){
			try{
				var c = tbl.rows[0].cells[tbl.rows[0].cells.length - 1];
				var c2 = oTab.pBodyCont.rows[0].cells[oTab.pBodyCont.rows[0].cells.length - 2];

				if (c.offsetLeft - c2.offsetLeft > 2)
					c.style.width = oTab.dayColWidth + 50 + 'px';
			}
			catch(e){}
		}, 500);
	}

	oTab.pTimelineTable = tbl;
	oTab.pTimelineCont.appendChild(tbl);
	setTimeout(function() {oTab.pTimelineCont.scrollTop = 40 * bxInt(fromHour);}, 0); // Scroll to the start of the work time

	if (oTab.curDay)
		setTimeout(function(){_this.ShowCurTimePointer(tabId);}, 100);
	else
		this.HideCurTimePointer(tabId);

	this.dragDrop.RegisterTimeline(oTab.pTimelineCont, oTab);

	this.BuildWeekEventHolder();
}

JCEC.prototype.TimeCellOnMouseOver = function(pCell, tabId)
{
	if (this.selectTimeMode)
	{
		this.selectTimeEndObj = pCell;
		this.SelectTime(tabId);
	}
}

JCEC.prototype.TimeCellOnMouseDown = function(pCell, tabId)
{
	this.selectTimeMode = true;
	this.selectTimeStartObj = this.selectTimeEndObj = pCell;
	if (pCell.className.indexOf('bxec-time-selected') == -1)
		return this.SelectTime(tabId);
	this.selectTimeMode = false;
	this.DeSelectTime(tabId);
	this.CloseAddEventDialog();
}

JCEC.prototype.TimeCellOnMouseUp = function()
{
	if (!this.selectTimeMode)
		return;
	this.ShowAddEventDialog();
	this.selectTimeMode = false;
}


JCEC.prototype.DayTitleOnMouseOver = function(pCell, tabId)
{
	if (this.selectTimeMode && !this.selectDayTMode)
	{
		var o = this.__GetRelativeCell(pCell);
		this.selectTimeEndObj = this.Tabs[tabId].pTimelineTable.rows[o.rowInd].cells[o.cellInd]; // Select 00:00 time cell in the timeline
		this.SelectTime(tabId);
		return;
	}

	if (this.selectDayTMode)
	{
		this.selectDayTEndObj = pCell;
		this.SelectDaysT(tabId);
	}
}

JCEC.prototype.DayTitleOnMouseDown = function(pCell, tabId)
{
	this.selectDayTMode = true;
	this.selectDayTStartObj = this.selectDayTEndObj = pCell;

	if (pCell.className.indexOf('bxec-day-t-selected') == -1)
	{
		if (this.arSelectedTime && this.arSelectedTime.length > 0)
			this.SelectTime(tabId);
		this.SelectDaysT(tabId);
		return;
	}

	this.selectDayTMode = false;
	this.DeSelectDaysT();
	this.CloseAddEventDialog();
}

JCEC.prototype.DayTitleOnMouseUp = function(pCell, tabId)
{
	if (this.selectTimeMode && !this.selectDayTMode)
	{
		var o = this.__GetRelativeCell(pCell);
		this.selectTimeEndObj = this.Tabs[tabId].pTimelineTable.rows[o.rowInd].cells[o.cellInd]; // Select 00:00 time cell in the timeline
		this.TimeCellOnMouseOver(this.selectTimeEndObj, tabId);
		this.TimeCellOnMouseUp(this.selectTimeEndObj, tabId);
		return;
	}
	if (!this.selectDayTMode)
		return;
	this.ShowAddEventDialog();
	this.selectDayTMode = false;
}

JCEC.prototype.__GetRelativeCell = function(pCell)
{
	var cellInd = pCell.cellIndex, rowInd = 0;
	if (cellInd > this.__ConvertCellIndex(this.selectTimeStartObj.parentNode.rowIndex, this.selectTimeStartObj.cellIndex))
	{
		cellInd--;
		rowInd = 47;
	}
	return {cellInd: cellInd, rowInd: rowInd};
}

JCEC.prototype.SelectDaysT = function(tabId)
{
	if (!this.arSelectedDaysT)
		this.arSelectedDaysT = [];

	if (!this.selectDayTStartObj || !this.selectDayTEndObj)
		return;

	if (this.arSelectedDaysT.length > 0)
		this.DeSelectDaysT();

	var
		oTab = this.Tabs[tabId],
		sCell = this.selectDayTStartObj, // Start cell
		eCell = this.selectDayTEndObj, // End cell
		sCol = sCell.cellIndex,
		eCol = eCell.cellIndex,
		tbl = oTab.pBodyCont,
		pTitleR = tbl.rows[0],
		pMoreEvR = tbl.rows[1],
		i;

	if (sCol > eCol) // Swap
	{
		sCell = this.selectDayTEndObj;
		eCell = this.selectDayTStartObj;
		sCol = sCell.cellIndex;
		eCol = eCell.cellIndex;
	}
	this.curDayTSelection = {sDay: oTab.arDays[sCol - 1], eDay: oTab.arDays[eCol - 1]};

	for (i = sCol; i <= eCol; i++)
	{
		c1 = pTitleR.cells[i];
		c2 = pMoreEvR.cells[i];

		BX.addClass(c1, 'bxec-day-t-selected');
		BX.addClass(c2, 'bxec-day-t-selected');
		this.arSelectedDaysT.push({pCell1 : c1, pCell2 : c2});
	}
}

JCEC.prototype.DeSelectDaysT = function()
{
	if (!this.arSelectedDaysT)
		return;
	var i, l;
	for (i = 0, l = this.arSelectedDaysT.length; i < l; i++)
	{
		BX.removeClass(this.arSelectedDaysT[i].pCell1, 'bxec-day-t-selected');
		BX.removeClass(this.arSelectedDaysT[i].pCell2, 'bxec-day-t-selected');
	}
	this.arSelectedDaysT = [];
}


JCEC.prototype.SelectTime = function(tabId)
{
	if (!this.arSelectedTime)
		this.arSelectedTime = [];

	if (!this.selectTimeStartObj || !this.selectTimeEndObj)
		return;

	if (this.arSelectedTime.length > 0)
		this.DeSelectTime(tabId);

	var
		oTab = this.Tabs[tabId],
		sCell = this.selectTimeStartObj, // Start cell
		sRow = sCell.parentNode.rowIndex,
		sCol = this.__ConvertCellIndex(sRow, sCell.cellIndex),
		eCell = this.selectTimeEndObj, // End cell
		eRow = eCell.parentNode.rowIndex,
		eCol = this.__ConvertCellIndex(eRow, eCell.cellIndex),
		oDays = {
			sDay: oTab.arDays[sCol - 1],
			eDay: oTab.arDays[eCol - 1],
			sTime: sRow / 2,
			eTime: eRow / 2 + 0.5
		},
		i, min, max, r1, r2, sRow_, eRow_;

	if (sRow > eRow && sCol == eCol || sCol > eCol) // Reverse selection
	{
		oDays.sTime += 0.5;
		oDays.eTime -= 0.5;
	}

	oDays.sHour = Math.floor(oDays.sTime);
	oDays.eHour = Math.floor(oDays.eTime);
	oDays.sMin = (oDays.sTime - oDays.sHour) * 60;
	oDays.eMin = (oDays.eTime - oDays.eHour) * 60;

	this.curTimeSelection = oDays;
	// Show selection in the timeline
	if (sCol == eCol) // during one day
	{
		this._SelectTime({sRow: sRow, eRow: eRow, col: sCol, bShowNotifier: true, tabId: tabId, oDays: oDays});
	}
	else // Several days
	{
		if (sCol < eCol)
		{
			min = sCol;
			max = eCol;
			sRow_ = sRow;
			eRow_ = eRow;
		}
		else
		{
			min = eCol;
			max = sCol;
			sRow_ = eRow;
			eRow_ = sRow;

			_d = oDays.sDay; oDays.sDay = oDays.eDay; oDays.eDay = _d; // Swap days
			_t = oDays.sTime; oDays.sTime = oDays.eTime; oDays.eTime = _t;  // Swap time
		}

		for (i = min; i <= max; i++)
		{
			r1 = (i == min) ? sRow_ : 0;
			r2 = (i == max) ? eRow_ : 47;
			this._SelectTime({sRow: r1, eRow: r2, col: i, bShowNotifier: i == min, tabId: tabId, oDays: oDays});
		}
	}
}

JCEC.prototype._SelectTime = function(P)
{
	var
		pTable = this.Tabs[P.tabId].pTimelineTable,
		min = Math.min(P.eRow, P.sRow),
		max = Math.max(P.eRow, P.sRow),
		i, pCell;

	for (i = min; i <= max; i++)
	{
		pCell = pTable.rows[i].cells[this.__ConvertCellIndex(i, P.col, true)];
		BX.addClass(pCell, 'bxec-time-selected');
		xxx = this.arSelectedTime.push({pCell : pCell});
	}

	if (P.bShowNotifier)
	{
		if (min == P.eRow && (P.eRow != P.sRow))
		{
			_d = P.oDays.sDay; P.oDays.sDay = P.oDays.eDay; P.oDays.eDay = _d; // Swap days
			_t = P.oDays.sTime; P.oDays.sTime = P.oDays.eTime; P.oDays.eTime = _t; // Swap time
		}
		this.ShowSelectTimeNotifier({tabId: P.tabId, rowInd: min, colInd: P.col, oDays: P.oDays});
	}
}

JCEC.prototype.__ConvertCellIndex = function(rowInd, cellInd, bInv)
{
	if ((rowInd / 2) !== Math.round((rowInd / 2)))
		cellInd += bInv ? -1 : 1;
	return cellInd;
}

JCEC.prototype.DeSelectTime = function(tabId)
{
	if (!this.arSelectedTime)
		return;
	var i, l;
	for (i = 0, l = this.arSelectedTime.length; i < l; i++)
		BX.removeClass(this.arSelectedTime[i].pCell, 'bxec-time-selected');
	this.HideSelectTimeNotifier({tabId: tabId});
	this.arSelectedTime = [];
}

JCEC.prototype.ShowSelectTimeNotifier = function(P, bShow)
{
	var
		oTab = this.Tabs[P.tabId],
		pTable = oTab.pTimelineTable,
		pCell = pTable.rows[P.rowInd].cells[this.__ConvertCellIndex(P.rowInd, P.colInd, true)],
		left = bxInt(pCell.offsetLeft),
		top = bxInt(pCell.offsetTop),
		sHour = Math.floor(P.oDays.sTime),
		eHour = Math.floor(P.oDays.eTime),
		sMin = (P.oDays.sTime - sHour) * 60,
		eMin = (P.oDays.eTime - eHour) * 60,
		d1 = P.oDays.sDay,
		d2 = P.oDays.eDay,
		dTop = -19,
		dLeft = 15,
		innnerHTML, t1, t2;

	if (eHour == 24)
		eHour = '00';

	if (!oTab.pSTNotifier)
		oTab.pSTNotifier = pTable.parentNode.appendChild(BX.create('DIV', {props: {className: 'bxec-st-notifier'}}));

	//if (sMin < 10)
	//	sMin = '0' + sMin.toString();
	//if (eMin < 10)
	//	eMin = '0' + eMin.toString();

	t1 = this.FormatTimeByNum(sHour, sMin);
	t2 = this.FormatTimeByNum(eHour, eMin);
	//t1 = sHour + ':' + sMin;
	//t2 = eHour + ':' + eMin;

	if (P.oDays.sDay == P.oDays.eDay) // during one day
		innnerHTML = '<nobr>' + t1 + ' - ' + t2 + '</nobr>';
	else
		innnerHTML = '<nobr>' + bxFormatDate(d1.date, d1.month + 1, d1.year) + ' ' + t1 + ' - ' +
				bxFormatDate(d2.date, d2.month + 1, d2.year) + ' ' + t2 + '</nobr>';

	if (bxInt(sHour) <= 0) // If start time 00:00
		dTop = 20;

	oTab.pSTNotifier.innerHTML = '<img class="bxec-iconkit" src="/bitrix/images/1.gif">' + innnerHTML;
	oTab.pSTNotifier.style.left = left + dLeft + 'px';
	oTab.pSTNotifier.style.top = top + dTop + 'px';
	oTab.pSTNotifier.style.display = 'block';
}

JCEC.prototype.HideSelectTimeNotifier = function(P)
{
	var oTab = this.Tabs[P.tabId];
	if (!oTab.pSTNotifier)
		return;
	oTab.pSTNotifier.style.display = 'none';
}

JCEC.prototype.BuildSingleDayTable = function()
{
	var
		oTab = this.Tabs['day'],
		tbl = oTab.pBodyCont,
		pTitleR = tbl.rows[0],
		pMoreEvR = tbl.rows[1],
		pGridR = tbl.rows[2], c;

	pTitleR.insertCell(1);
	c = pMoreEvR.insertCell(1);
	c.innerHTML = '<div class="bxec-wdv-more-ev">&nbsp;</div>';
	pGridR.cells[0].colSpan = "3";

	oTab.pTimelineCont = pGridR.cells[0].firstChild;
	this.ResizeTabTitle(oTab);
}

JCEC.prototype.ShowCurTimePointer = function(tabId)
{
	var _this = this;
	var oTab = this.Tabs[tabId];
	if (!oTab.oCurTimePointer)
		this.CreateCurTimePointer(tabId);

	function fMove()
	{
		var
			curTime = new Date(),
			h = bxInt(curTime.getHours()),
			m = bxInt(curTime.getMinutes()),
			cnt = oTab.pTimelineTable.rows[h * 2].cells[1],
			dTop = cnt.offsetTop + Math.round(cnt.offsetHeight * 2 * m / 6) / 10 - (BX.browser.IsSafari() ? 3 : 4);

		oTab.oCurTimePointer.pWnd.style.top = dTop + 'px';
		oTab.oCurTimePointer.pWnd.title = EC_MESS.CurTime + ' - ' + _this.FormatTimeByNum(h, m);
	};

	var
		oCTP = oTab.oCurTimePointer,
		c = oTab.pTimelineTable.rows[0].cells[oTab.curDay.cellInd];

	if (!c)
		return;

	oTab.pTimelineCont.appendChild(oCTP.pWnd);
	oCTP.pWnd.style.display = 'block';
	oCTP.pWnd.style.left = (bxInt(c.offsetLeft) - bxGetPixel()) + 'px';
	oCTP.pWnd.style.width = bxInt(c.offsetWidth) + 'px';
	oCTP.interval = setInterval(fMove, 60000);

	fMove();
}

JCEC.prototype.CreateCurTimePointer = function(tabId)
{
	this.Tabs[tabId].oCurTimePointer = {pWnd : BX.create('DIV', {props: {className: 'bxec-time-pointer'}, html: '<img class="bxec-iconkit" src="/bitrix/images/1.gif">'})};
}

JCEC.prototype.HideCurTimePointer = function(tabId)
{
	var oTab = this.Tabs[tabId];
	if (!oTab.oCurTimePointer)
		return;

	if (oTab.oCurTimePointer.interval)
		clearInterval(oTab.oCurTimePointer.interval);
	oTab.oCurTimePointer.pWnd.style.display = 'none';
}

JCEC.prototype.SetWeek = function(w1, m1, y1)
{
	var
		res = this.Selector.OnChange(y1, m1, w1),
		m = res.monthTo,
		y = res.yearTo,
		w = this.GetWeekByDate({date: res.dateTo, month: res.monthTo, year: res.yearTo});

	if (!this.arLoadedMonth[m + '.'+ y])
		return this.LoadEvents(m, y, {week: w1, month: m1, year: y1});

	var curTs = new Date().getTime();
	// Cur week
	if (curTs >= res.weekStartDate.getTime() && curTs <= res.weekEndDate.getTime())
	{
		m = this.currentDate.month;
		y = this.currentDate.year;
		w = this.GetWeekByDate(this.currentDate);
	}

	var bSetActiveDate = this.activeDate.month != m || this.activeDate.year != y;

	this.activeDate.week = w;
	this.activeDate.month = m;
	this.activeDate.year = y;

	if (bSetActiveDate)
		this.SetTabNeedRefresh('week', true);
	this.BuildTimelineGrid(this.Tabs['week'], this.FillWeekDaysTitle({tabId: 'week', count: 7, startDate: res.weekStartDate}));
}

JCEC.prototype.SetDay = function(d, m1, y1)
{
	var
		res = this.Selector.OnChange(y1, m1, false, d),
		m = res.month,
		y = res.year;

	if (!this.arLoadedMonth[m + '.'+ y])
		return this.LoadEvents(m, y, {date: d, month: m1, year: y1});

	var bSetActiveDate = this.activeDate.month != res.month || this.activeDate.year != res.year;
	this.activeDate.date = res.date;
	this.activeDate.month = res.month;
	this.activeDate.year = res.year;
	if (bSetActiveDate)
		this.SetTabNeedRefresh('day', true);

	var arDays = this.FillWeekDaysTitle({tabId: 'day', count: 1, startDate: res.oDate});
	this.BuildTimelineGrid(this.Tabs['day'], arDays);
}
/* End */
;
; /* Start:/bitrix/js/calendar/cal-events.js*/
// Doesn't contain data, coolects common methods to manipulate events
(function(window) {
window.JSECEvent = function(oEC)
{
	this.oEC = oEC;
};

JSECEvent.prototype = {
	Get: function(id)
	{
		for (i = 0, l = this.oEC.arEvents.length; i < l; i++)
			if (this.oEC.arEvents[i].ID == id)
				return this.oEC.arEvents[i];
	},

	IsMeeting: function(oEvent)
	{
		return this.oEC.allowMeetings && oEvent && !!oEvent.IS_MEETING;
	},

	Attendees: function(oEvent)
	{
		var res = {};
		if (oEvent && oEvent.ID && this.oEC.arAttendees[oEvent.ID])
			res = this.oEC.arAttendees[oEvent.ID];

		return res;
	},

	View: function(oEvent)
	{
		if (oEvent)
			this.oEC.HighlightEvent_M(oEvent, false, true);

		this.oEC.DefaultAction(); // Reset state

		// Call custom handlers here
		BX.onCustomEvent(this.oEC, 'onBeforeCalendarEventView', [this.oEC, oEvent]);

		if (this.oEC.DefaultAction()) // Check state from custom handlers
		{
			if (oEvent['~TYPE'] == 'tasks' && window.taskIFramePopup && oEvent.ID > 0)
				taskIFramePopup.view(parseInt(oEvent.ID));
			else
				this.oEC.ShowViewEventPopup(oEvent);
			BX.onCustomEvent(this.oEC, 'onAfterCalendarEventView', [this.oEC, oEvent]);
		}
	},

	Edit: function(Params)
	{
		if (Params.oEvent)
			this.oEC.HighlightEvent_M(Params.oEvent, false, true);

		this.oEC.DefaultAction(); // Reset state

		// Call custom handlers here
		BX.onCustomEvent(this.oEC, 'onBeforeCalendarEventEdit', [this.oEC, Params]);

		if (this.oEC.DefaultAction()) // Check state from custom handlers
		{
			if (((!Params.oEvent && Params.bTasks) || (Params.oEvent && Params.oEvent['~TYPE'] == 'tasks' && Params.oEvent.ID > 0))  && window.taskIFramePopup)
			{
				if (Params.oEvent)
					taskIFramePopup.edit(parseInt(Params.oEvent.ID)); // Edit task
				else
					taskIFramePopup.add(); // Add task
			}
			else
				this.oEC.ShowEditEventPopup(Params);
			BX.onCustomEvent(this.oEC, 'onAfterCalendarEventView', [this.oEC, Params]);
		}
	},

	Delete: function(oEvent)
	{
		if (oEvent)
			this.oEC.HighlightEvent_M(oEvent, false, true);

		if (!oEvent || !oEvent.ID)
			return false;

		this.oEC.DefaultAction(); // Reset state

		// Call custom handlers here
		BX.onCustomEvent(this.oEC, 'onBeforeCalendarEventDelete', [this.oEC, oEvent]);

		if (this.oEC.DefaultAction()) // Check state from custom handlers
		{
			if (oEvent['~TYPE'] == 'tasks')
			{
				// Do nothing
			}
			else
			{
				var bConfirmed = false;
				if (this.IsAttendee(oEvent) &&  !this.IsHost(oEvent))
				{
					bConfirmed = true;
					if (!confirm(EC_MESS.DelMeetingGuestConfirm))
						return false;
				}

				if (this.IsHost(oEvent) && !bConfirmed)
				{
					bConfirmed = true;
					if (!confirm(EC_MESS.DelMeetingConfirm))
						return false;
				}

				if ((!oEvent.IS_MEETING || this.IsHost(oEvent)) && !bConfirmed)
				{
					bConfirmed = true;
					if (!confirm(EC_MESS.DelEventConfirm))
						return false;
				}

				var _this = this;
				if (this.IsAttendee(oEvent) && !this.IsHost(oEvent))
				{
					return this.SetMeetingStatus(true, {eventId: bxInt(oEvent.ID), comment: ''});
				}
				else
				{
					this.oEC.Request({
						postData: this.oEC.GetReqData('delete', {
							id : bxInt(oEvent.ID),
							name : oEvent.NAME,
							calendar : bxInt(oEvent.SECT_ID)
						}),
						errorText: EC_MESS.DelEventError,
						handler: function(oRes)
						{
							if (oRes)
								_this.UnDisplay(oEvent);
						}
					});
				}
			}
			BX.onCustomEvent(this.oEC, 'onAfterCalendarEventDelete', [this.oEC]);
		}
		return true;
	},

	SetColor : function(oEvent)
	{
		var
			sect,
			_this = this,
			id = oEvent.SECT_ID,
			color, textColor;

		function getSectColor(id)
		{
			var sect = {};
			if (_this.oEC.arSectionsInd[id] && _this.oEC.arSections[_this.oEC.arSectionsInd[id]])
				sect = _this.oEC.arSections[_this.oEC.arSectionsInd[id]];

			if (!sect.TEXT_COLOR && sect.COLOR)
				sect.TEXT_COLOR = _this.oEC.ColorIsDark(sect.COLOR) ? '#FFFFFF' : '#000000';

			return sect;
		}

		if (oEvent['~TYPE'] == 'tasks')
		{
			color = this.oEC.taskBgColor;
			textColor =  this.oEC.taskTextColor;
		}
		else
		{
			if (oEvent.USER_MEETING && !this.IsHost(oEvent))
			{
				color = oEvent.USER_MEETING.COLOR;
				textColor = oEvent.USER_MEETING.TEXT_COLOR;

				if (!color)
					color = oEvent.COLOR;
				if (!textColor)
					textColor = oEvent.TEXT_COLOR;

				if (!color)
				{
					sect = getSectColor(id);
					if (sect.COLOR)
					{
						color = this.oEC.oSections[id].COLOR;
						textColor = this.oEC.oSections[id].TEXT_COLOR;
					}
				}

				if ((!color || !textColor) && this.oEC.arSections.length)
				{
					id = this.oEC.GetMeetingSection();
					sect = getSectColor(id);
					if (id)
					{
						if (!color && sect.COLOR)
							color = sect.COLOR;
						if (!textColor && sect.TEXT_COLOR)
							textColor = sect.TEXT_COLOR;
					}
				}
			}
			else if (id)
			{
				color = oEvent.COLOR;
				textColor = oEvent.TEXT_COLOR;

				sect = getSectColor(id);
				if (!color && sect.COLOR)
					color = sect.COLOR;
				if (!textColor && sect.TEXT_COLOR)
					textColor = sect.TEXT_COLOR;
			}
		}

		if (!color)
			color = '#CEE669';

		oEvent.displayColor = color;
		oEvent.bDark = this.oEC.ColorIsDark(color);
		if (!textColor)
			textColor = oEvent.bDark ? '#FFFFFF' : '#000000';
		oEvent.displayTextColor = textColor;

		return oEvent;
	},

	SaveUserFields: function(UFForm, eventId)
	{
		if (UFForm && UFForm.event_id && eventId > 0)
		{
			UFForm.event_id.value = parseInt(eventId);
			var reqId = this.oEC.GetReqData('').reqId;
			var _this = this;

			if(UFForm.reqId)
				UFForm.reqId.value = reqId;

			BX.ajax.submit(
				UFForm,
				function()
				{
					var oRes = top.BXCRES[reqId];
					if(oRes && oRes['refresh'])
						_this.ReloadAll(false);
				}
			);
		}
	},

	GetQuestIcon: function(oEvent)
	{
		if (!this.IsBlinked(oEvent))
			return '';
		return '<b title="' + EC_MESS.NotConfirmed + '" class="bxec-stat-q">?</b>';
	},

	IsTask: function(oEvent)
	{
		return oEvent['~TYPE'] == 'tasks';
	},

	IsHost: function(oEvent, userId)
	{
		if (!userId)
			userId = this.oEC.userId;
		return !!(oEvent.IS_MEETING && oEvent.MEETING_HOST == userId);
	},

	IsAttendee: function(oEvent, userId)
	{
		if (!userId)
			userId = this.oEC.userId;

		if (oEvent.IS_MEETING && oEvent.USER_MEETING)
		{
			if (oEvent.USER_MEETING.ATTENDEE_ID != userId)
				return false;
			return true;
		}
		return false;
	},

	IsCrm: function(oEvent)
	{
		return oEvent.UF_CRM_CAL_EVENT && oEvent.UF_CRM_CAL_EVENT != "";
	},

	IsBlinked: function(oEvent)
	{
		return oEvent.USER_MEETING && oEvent.USER_MEETING.STATUS == 'Q';
	},

	IsRecursive: function(oEvent)
	{
		return !!(oEvent.RRULE && oEvent.RRULE.FREQ && oEvent.RRULE.FREQ != 'NONE');
	},

	Blink: function(oEvent, bBlink, bCheck)
	{
		if (!this.IsAttendee(oEvent) || this.IsHost(oEvent))
			return;

		if (!oEvent || !oEvent.display)
			return;

		if (bCheck)
			bBlink = this.IsBlinked(oEvent);

		if (bBlink && this.oEC.userSettings.blink) // Set blinked
		{
			var _this = this;
			oEvent._blinkInterval = setInterval(function(){_this.BlinkInterval(oEvent);}, 550);
		}
		else if(!bBlink && oEvent._blinkInterval) // Clear blinking
		{
			oEvent._blinkInterval = !!clearInterval(oEvent._blinkInterval);

			var i, len, cn = "bxec-event-blink";
			if (oEvent.oParts)
			{
				len = oEvent.oParts.length;
				for (i = 0; i < len; i++)
					if (oEvent.oParts[i])
						BX.removeClass(oEvent.oParts[i], cn);
			}

			if (oEvent.oDaysT)
			{
				if (oEvent.oDaysT.week)
					BX.removeClass(oEvent.oDaysT.week, cn);

				if (oEvent.oDaysT.day)
					BX.removeClass(oEvent.oDaysT.day, cn);
			}

			if (oEvent.oTLParts)
			{
				if (oEvent.oTLParts.week)
				{
					len2 = oEvent.oTLParts.week.length;
					for (i = 0; i < len2; i++)
						if (oEvent.oTLParts.week[i])
							BX.removeClass(oEvent.oTLParts.week[i], cn);
				}

				if (oEvent.oTLParts.day)
				{
					len2 = oEvent.oTLParts.day.length;
					for (i = 0; i < len2; i++)
						if (oEvent.oTLParts.day[i])
							BX.removeClass(oEvent.oTLParts.day[i], cn);
				}
			}
		}
	},

	BlinkInterval: function(oEvent)
	{
		if (!this.oEC.userSettings.blink)
			return this.Blink(oEvent, false, false);

		var i, len, cn = "bxec-event-blink", tab = this.oEC.activeTabId;
		if (tab == 'month')
		{
			if (oEvent.oParts)
			{
				len = oEvent.oParts.length;
				for (i = 0; i < len; i++)
					if (oEvent.oParts[i])
						BX.toggleClass(oEvent.oParts[i], cn);
			}
		}
		else // week, day
		{
			if (oEvent.oDaysT && oEvent.oTLParts)
			{
				if (oEvent.oDaysT[tab])
					BX.toggleClass(oEvent.oDaysT[tab], cn);

				if (oEvent.oTLParts[tab])
				{
					len = oEvent.oTLParts[tab].length;
					for (i = 0; i < len; i++)
						if (oEvent.oTLParts[tab][i])
							BX.toggleClass(oEvent.oTLParts[tab][i], cn);
				}
			}
		}
	},

	SetMeetingStatus: function(bAccept, Params) // Confirm
	{
		if (!bAccept && !confirm(EC_MESS.DelMeetingGuestConfirm))
			return false;

		var
			oEvent = {},
			eventId = Params ? Params.eventId : 0;

		if (!eventId && this.oEC.oViewEventDialog)
		{
			oEvent = this.oEC.oViewEventDialog.CAL.oEvent;
			eventId = this.oEC.oViewEventDialog.CAL.oEvent.ID;
		}

		if (typeof Params == 'undefined')
		{
			Params = {
				eventId: eventId,
				comment: '' //this.oEC.oViewEventDialog.CAL.DOM.StatusComInp.value
			};
			//if (Params.comment == this.oEC.oViewEventDialog.CAL.defStatValue)
			//	Params.comment = '';
		}

		var _this = this;
		this.oEC.Request({
			postData: this.oEC.GetReqData('set_meeting_status',
			{
				event_id: parseInt(Params.eventId),
				status: bAccept ? 'Y' : 'N',
				status_comment: Params.comment || ''
			}),
			handler: function(oRes)
			{
				if (oRes)
				{
					if (!_this.oEC.userSettings.showDeclined && !_this.IsHost(oEvent) && !bAccept)
					{
						_this.UnDisplay(_this.Get(Params.eventId));
					}
					else if (bAccept)
					{
						_this.ReloadAll(false);
					}
				}
				return true;
			}
		});
		return true;
	},

	SmartId : function(e)
	{
		var sid = e.ID;
		if (this.IsRecursive(e))
			sid += e.DT_FROM_TS;
		if (e['~TYPE'] == 'tasks')
			sid += 'task';
		return sid;
	},

	ReloadAll: function(bTimeout)
	{
		if (this._reloadTimeout)
			clearTimeout(this._reloadTimeout);

		var _this = this;
		this.oEC.arLoadedEventsId = {};
		this.oEC.arLoadedParentId = {};
		this.oEC.arLoadedMonth = {};
		this.oEC.arEvents = [];

		if (bTimeout === false)
			this.oEC.LoadEvents();
		else
			this._reloadTimeout = setTimeout(function(){_this.oEC.LoadEvents();}, 600);
	},

	Save: function(P)
	{
		var
			month = parseInt(this.oEC.activeDate.month, 10),
			year = this.oEC.activeDate.year;

		var postData = this.oEC.GetReqData('edit_event',
			{
				id: P.id || 0,
				name: P.name,
				desc: P.desc || '',
				from_ts: parseInt(P.from, 10), // timestamp here
				to_ts: parseInt(P.to, 10),
				sections: [P.calendar],
				location: P.location || {OLD: '', NEW: '', CHANGED: ''},
				month: month + 1,
				year: year,
				skip_time: P.skip_time || 'N'
			}
		);

		this.oEC.arLoadedMonth = {};

		if (P.RRULE && P.RRULE)
			postData.rrule = P.RRULE;

		if (P.remind)
			postData.remind = [{type: P.remind_type, count: P.remind_count}];

		if (this.oEC.allowMeetings)
		{
			postData.is_meeting = P.isMeeting || '';
			if (P.isMeeting)
			{
				postData.meeting = P.meeting || {};
				if (P.guests)
					postData.guest = P.guests.length > 0 ? P.guests : [0];
			}
		}

		postData.color = P.color || '';
		postData.text_color = P.text_color || '';

		// Other
		if (P.accessibility)
			postData.accessibility = P.accessibility;
		if (P.importance)
			postData.importance = P.importance;
		if (P.private_event)
			postData.private_event = P.private_event;

		var _this = this;
		this.oEC.Request({
			postData: postData,
			errorText: EC_MESS.EventSaveError,
			handler: function(oRes)
			{
				// Try to save userfields
				if (oRes.id && P.UFForm)
					_this.SaveUserFields(P.UFForm, oRes.id);

				_this.UnDisplay(oRes.id, false);
				_this.oEC.HandleEvents(oRes.events, oRes.attendees);
				_this.oEC.arLoadedMonth[month + '.' + year] = true;

				if (oRes.deletedEventId > 0)
					_this.UnDisplay(oRes.deletedEventId, false);

				_this.Display();
				return true;
			}
		});
	},

	Display: function()
	{
		this.oEC.SetTabNeedRefresh(this.oEC.activeTabId);
		if (this.oEC.activeTabId == 'month')
		{
			this.oEC.DisplayEventsMonth(true);
		}
		else // week, day
		{
			this.oEC.DeSelectTime(this.oEC.activeTabId);
			this.oEC.ReBuildEvents(this.oEC.activeTabId);
		}
	},

	UnDisplay: function(oEvent, bDisplay)
	{
		var id;
		if (typeof oEvent == 'object' && oEvent.ID)
			id = oEvent.ID;
		else if(oEvent > 0)
			id = oEvent;

		// Clean events
		var
			e, arLoadedEventsId = {},
			i, arEvents = [];

		for (i = 0; i < this.oEC.arEvents.length; i++)
		{
			e = this.oEC.arEvents[i];
			if (e && (e.ID != id || e['~TYPE'] == 'tasks'))
			{
				arLoadedEventsId[this.SmartId(e)] = true;
				arEvents.push(e);
			}
			else
				this.Blink(this.oEC.arEvents[i], false);
		}
		this.oEC.arEvents = arEvents;
		this.oEC.arLoadedEventsId = arLoadedEventsId;

		if (bDisplay !== false)
			this.Display();
	},

	SetMeetingParams: function(Params)
	{
		var D = this.oEC.oEditEventDialog;

		var postData = this.oEC.GetReqData('set_meeting_params',
			{
				event_id: D.CAL.oEvent.ID,
				accessibility: D.CAL.DOM.Accessibility.value
			}
		);

		if (this.oEC.allowReminders && D.CAL.DOM.RemCheck.checked)
		{
			var rcount = D.CAL.DOM.RemCount.value || '';
			rcount = rcount.replace(/,/g, '.');
			rcount = rcount.replace(/[^\d|\.]/g, '');
			postData.remind = [{
				type: D.CAL.DOM.RemType.value,
				count: rcount
			}];
		}

		this.oEC.Request({
			postData: postData,
			handler: function(oRes)
			{
				D.CAL.oEvent.USER_MEETING.REMIND = postData.remind || [];
				D.CAL.oEvent.USER_MEETING.ACCESSIBILITY = postData.accessibility;
			}
		});

		if (Params.callback && typeof Params.callback == 'function')
			Params.callback();
	},

	CanDo: function(oEvent, action, userId)
	{
		if (!oEvent)
			return false;

		if (!userId)
			userId = this.oEC.userId;

		if (action == 'edit' || action == 'delete')
		{
			if (this.bReadOnly)
				return false;

			if (oEvent.SECT_ID)
			{
				var oSect = this.oEC.oSections[oEvent.SECT_ID];
				if(oSect)
				{
					if (oSect.SUPERPOSED && (oSect.OWNER_ID != this.oEC.ownerId || oSect.CAL_TYPE != this.oEC.type))
						return false;
					if (oSect.PERM)
						return !!oSect.PERM.edit;
				}
			}
		}
		return false;
	},

	BuildActions: function(P)
	{
		var
			ic,
			oEvent = P.oEvent,
			isTask = oEvent['~TYPE'] == 'tasks',
			count = 0,
			oDiv = BX.create('DIV', {props:{className : 'bxec-event-actions'}}),
			oDiv_ = oDiv.appendChild(BX.create('DIV', {props: {className : P.bTimeline ? 'bxec-icon-cont-tl' : 'bxec-icon-cont'}}));

		if (this.CanDo(oEvent, 'edit') || (isTask && oEvent.CAN_EDIT))
		{
			ic = oDiv_.appendChild(BX.create('I', {props: {className : 'bxec-event-but bxec-ev-edit-icon', title: isTask ? EC_MESS.TaskEdit : EC_MESS.EditEvent}}));
			ic.setAttribute('data-bx-event-action', 'edit');
			count++;

			// Add del button
			if (this.IsAttendee(oEvent) && !this.IsHost(oEvent))
			{
				if (oEvent.USER_MEETING.STATUS != 'N')
				{
					ic = oDiv_.appendChild(BX.create('I', {props: {className : 'bxec-event-but bxec-ev-del-icon', title: EC_MESS.DelEncounter}}));
					ic.setAttribute('data-bx-event-action', 'del');
					count++;
				}
			}
			else if (!isTask)
			{
				ic = oDiv_.appendChild(BX.create('I', {props: {className : 'bxec-event-but bxec-ev-del-icon', title: EC_MESS.DelEvent}}));
				ic.setAttribute('data-bx-event-action', 'del');
				count++;
			}
		}

		if (count != 2)
		{
			oDiv_.style.height = '18px';
			oDiv_.style.width = (18 * count) + 'px';
			oDiv_.style.left = '-' + (18 * count) + 'px';
		}

		P.cont.appendChild(oDiv);
	},

	GetLabelStyle: function(oEvent)
	{
		var
			labelStyle = ''
			imp = oEvent.IMPORTANCE;
		if (imp && imp != 'normal')
			labelStyle = ' style="' + (imp == 'high' ? 'font-weight: bold;' : 'color: #535353;') + '"';
		return labelStyle;
	},

	PreHandle: function(oEvent)
	{
		oEvent.DT_FROM_TS = BX.date.getBrowserTimestamp(oEvent.DT_FROM_TS);
		oEvent.DT_TO_TS = BX.date.getBrowserTimestamp(oEvent.DT_TO_TS);

		if (oEvent.DT_FROM_TS > oEvent.DT_TO_TS)
			oEvent.DT_FROM_TS = oEvent.DT_TO_TS;

		if (this.IsRecursive(oEvent))
		{
			oEvent['~DT_FROM_TS'] = BX.date.getBrowserTimestamp(oEvent['~DT_FROM_TS']);
			oEvent['~DT_TO_TS'] = BX.date.getBrowserTimestamp(oEvent['~DT_TO_TS']);

			if (oEvent.RRULE && oEvent.RRULE.UNTIL)
				oEvent.RRULE.UNTIL = BX.date.getBrowserTimestamp(oEvent.RRULE.UNTIL);
		}

		return oEvent;
	}
};
})(window);



// BX.addCustomEvent(this, 'onCalendarEventView', function(oEC, oEvent)
// {
	// if (oEvent && oEvent['~TYPE'] == 'tasks')
	// {
		// if (window.taskIFramePopup && parseInt(oEvent['ID']) > 0)
		// {
			// taskIFramePopup.view(parseInt(oEvent['ID']));
			// oEC.DefaultAction(false);
		// }
	// }
// });


/* End */
;
; /* Start:/bitrix/js/calendar/cal-controlls.js*/
var ECUserControll = function(Params)
{
	this.oEC = Params.oEC;
	var _this = this;
	this.count = 0;
	this.countAgr = 0;
	this.countDec = 0;

	this.bEditMode = Params.view !== true;
	this.pAttendeesCont = Params.AttendeesCont;
	this.pAttendeesList = Params.AttendeesList;
	this.pParamsCont = Params.AdditionalParams;
	this.pSummary = Params.SummaryCont;

	this.pCount = this.pSummary.appendChild(BX.create("A", {props: {className: 'bxc-count', href:"javascript:void(0)"}}));
	this.pCountArg = this.pSummary.appendChild(BX.create("A", {props: {className: 'bxc-count-agr', href:"javascript:void(0)"}}));
	this.pCountDec = this.pSummary.appendChild(BX.create("A", {props: {className: 'bxc-count-dec', href:"javascript:void(0)"}}));

	this.pCount.onclick = function(){_this.ListMode('all');};
	this.pCountArg.onclick = function(){_this.ListMode('agree');};
	this.pCountDec.onclick = function(){_this.ListMode('decline');};

	this._getFromDate = (Params.fromDateGetter && typeof Params.fromDateGetter == 'function') ? Params.fromDateGetter : function(){return false;};
	this._getToDate = (Params.toDateGetter && typeof Params.toDateGetter == 'function') ? Params.toDateGetter : function(){return false;};
	this._getEventId = (Params.eventIdGetter && typeof Params.eventIdGetter == 'function') ? Params.eventIdGetter : function(){return false;};

	this.ListMode('all');
	this.Attendees = {};

	// Only if we need to add or delete users
	if (this.bEditMode)
	{
		this.pLinkCont = Params.AddLinkCont;
		var
			pIcon = this.pLinkCont.appendChild(BX.create("I")),
			pTitle = this.pLinkCont.appendChild(BX.create("SPAN", {text: EC_MESS.AddAttendees}));
		pIcon.onclick = pTitle.onclick = BX.proxy(this.OpenSelectUser, this);

		var arMenuItems = [{text : EC_MESS.AddGuestsDef, onclick: BX.proxy(this.OpenSelectUser, this)}];
		if (!this.oEC.bExtranet && this.oEC.type == 'group')
			arMenuItems.push({text : EC_MESS.AddGroupMemb, title: EC_MESS.AddGroupMembTitle, onclick: BX.proxy(this.oEC.AddGroupMembers, this.oEC)});
		//arMenuItems.push({text : EC_MESS.AddGuestsEmail,onclick: BX.proxy(this.AddByEmail, this)});

		if (arMenuItems.length > 1)
		{
			pMore = this.pLinkCont.appendChild(BX.create("A", {props: {href: 'javascript: void(0);', className: 'bxec-add-more'}}));
			pMore.onclick = function()
			{
				BX.PopupMenu.show('bxec_add_guest_menu', _this.pLinkCont, arMenuItems, {events: {onPopupClose: function() {BX.removeClass(pMore, "bxec-add-more-over");}}});
				BX.addClass(pMore, "bxec-add-more-over");
			};
		}

		BX.addCustomEvent(window, "onUserSelectorOnChange", BX.proxy(this.UserOnChange, this));
	}
}

ECUserControll.prototype = {
SetValues: function(Attendees)
{
	var i, l = Attendees.length, User;

	// Clear list
	BX.cleanNode(this.pAttendeesList);
	this.Attendees = {};
	this.count = 0;
	this.countAgr = 0;
	this.countDec = 0;

	for(i = 0; i < l; i++)
	{
		User = Attendees[i];
		User.key = User.id || User.email;
		if (User && User.key && !this.Attendees[User.key])
			this.DisplayAttendee(User);
	}

	if (this.bEditMode)
	{
		this.DisableUserOnChange(true, true);
		O_BXCalUserSelect.setSelected(Attendees);
	}

	this.UpdateCount();
},

GetValues: function()
{
	// for (var key in this.Attendees)
	// {
	// }

	return this.Attendees;
},

SetEmpty: function(bEmpty)
{
	if (this.bEmpty === bEmpty)
		return;

	BX.onCustomEvent(this, 'SetEmpty', [bEmpty]);

	if (bEmpty)
	{
		BX.addClass(this.pAttendeesCont, 'bxc-att-empty');
		if (this.pParamsCont)
			this.pParamsCont.style.display = 'none';
	}
	else
	{
		BX.removeClass(this.pAttendeesCont, 'bxc-att-empty');
		if (this.pParamsCont)
			this.pParamsCont.style.display = '';
	}
	this.bEmpty = bEmpty;
},

UpdateCount: function()
{
	this.pCount.innerHTML = EC_MESS.AttSumm + ' - ' + (parseInt(this.count) || 0);

	if (this.countAgr > 0)
	{
		this.pCountArg.innerHTML = EC_MESS.AttAgr + ' - ' + parseInt(this.countAgr);
		this.pCountArg.style.display = "";
	}
	else
	{
		this.pCountArg.style.display = "none";
	}

	if (this.countDec > 0)
	{
		this.pCountDec.innerHTML = EC_MESS.AttDec + ' - ' + parseInt(this.countDec);
		this.pCountDec.style.display = "";
	}
	else
	{
		this.pCountDec.style.display = "none";
	}

	this.SetEmpty(this.count == 0);
},

OpenSelectUser : function(e)
{
	if (BX.PopupMenu && BX.PopupMenu.currentItem)
		BX.PopupMenu.currentItem.popupWindow.close();

	if(!e) e = window.event;
	if (!this.SelectUserPopup)
	{
		var _this = this;
		this.SelectUserPopup = BX.PopupWindowManager.create("bxc-user-popup", this.pLinkCont, {
			offsetTop : 1,
			autoHide : true,
			closeByEsc : true,
			content : BX("BXCalUserSelect_selector_content"),
			className: 'bxc-popup-user-select',
			buttons: [
				new BX.PopupWindowButton({
					text: EC_MESS.Add,
					events: {click : function()
					{
						_this.SelectUserPopup.close();
						for (var id in _this.selectedUsers)
						{
							id = parseInt(id);
							if (!isNaN(id) && id > 0)
							{

								if (!_this.Attendees[id] && _this.selectedUsers[id]) // Add new user
								{
									_this.selectedUsers[id].key = id;
									_this.DisplayAttendee(_this.selectedUsers[id]);
								}
								else if(_this.Attendees[id] && !_this.selectedUsers[id]) // Del user from our list
								{
									_this.RemoveAttendee(id, false);
								}
							}
						}

						BX.onCustomEvent(_this, 'UserOnChange');
						_this.UpdateCount();
					}}
				}),
				new BX.PopupWindowButtonLink({
					text: EC_MESS.Close,
					className: "popup-window-button-link-cancel",
					events: {click : function(){_this.SelectUserPopup.close();}}
				})
			]
		});
	}

	// Clean
	if (this.bEditMode)
	{
		this.selectedUsers = {};
		var Attendees = [], k;
		for (k in this.Attendees)
		{
			if (this.Attendees[k] && this.Attendees[k].type != 'ext')
				Attendees.push(this.Attendees[k].User);
		}
		O_BXCalUserSelect.setSelected(Attendees);
	}

	this.SelectUserPopup.show();
	BX.PreventDefault(e);
},

AddByEmail : function(e)
{
	var _this = this;
	if (BX.PopupMenu && BX.PopupMenu.currentItem)
		BX.PopupMenu.currentItem.popupWindow.close();

	if(!e) e = window.event;
	if (!this.EmailPopup)
	{
		var pDiv = BX.create("DIV", {props:{className: 'bxc-email-cont'}, html: '<label class="bxc-email-label">' + EC_MESS.UserEmail + ':</label>'});
		this.pEmailValue = pDiv.appendChild(BX.create('INPUT', {props: {className: 'bxc-email-input'}}));

		this.EmailPopup = BX.PopupWindowManager.create("bxc-user-popup-email", this.pLinkCont, {
			offsetTop : 1,
			autoHide : true,
			content : pDiv,
			className: 'bxc-popup-user-select-email',
			closeIcon: { right : "12px", top : "5px"},
			closeByEsc : true,
			buttons: [
			new BX.PopupWindowButton({
				text: EC_MESS.Add,
				className: "popup-window-button-accept",
				events: {click : function(){
					var email = BX.util.trim(_this.pEmailValue.value);
					if (email != "" && !_this.Attendees[email])
					{
						var User = {name: email, key: email, type: 'ext', status: 'Y'};
						_this.DisplayAttendee(User);
						_this.UpdateCount();
					}
					_this.EmailPopup.close();
				}}
			}),
			new BX.PopupWindowButtonLink({
				text: EC_MESS.Close,
				className: "popup-window-button-link-cancel",
				events: {click : function(){_this.EmailPopup.close();}}
			})
		]
		});
	}

	this.EmailPopup.show();
	setTimeout(function(){BX.focus(_this.pEmailValue);}, 50);
	BX.PreventDefault(e);
},

DisableUserOnChange: function(bDisable, bTime)
{
	this.bDisableUserOnChange = bDisable === true;
	if (bTime)
		setTimeout(BX.proxy(this.DisableUserOnChange, this), 300);
},

UserOnChange: function(arUsers)
{
	if (this.bDisableUserOnChange)
		return;

	this.selectedUsers = arUsers;
},

DisplayAttendee: function(User, bUpdate)
{
	this.count++;
	if (User.status == 'Y')
		this.countAgr++;
	else if (User.status == 'N')
		this.countDec++;
	else
		User.status = 'Q';

	if (bUpdate && User.id && this.Attendees[User.id])
	{
		// ?
	}
	else
	{
		var
			_this = this,
			pBusyInfo = false,
			status = User.status.toLowerCase(),
			pRow = this.pAttendeesList.appendChild(BX.create("SPAN", {props:{className: 'bxc-attendee-row bxc-att-row-' + status}})),
			pStatus = pRow.appendChild(BX.create("I", {props: {className: 'bxc-stat-' + status, title: EC_MESS['GuestStatus_' + status] + (User.desc ? ' - ' + User.desc : '')}}));

		if (User.type == 'ext')
			pName = pRow.appendChild(BX.create("span", {props:{className: "bxc-name"}, text: (User.name || User.email)}));
		else
			pName = pRow.appendChild(BX.create("A", {props:{href: this.oEC.GetUserHref(User.id), className: "bxc-name"}, text: User.name}));


		if (this.bEditMode && User.type != 'ext')
			pBusyInfo = pRow.appendChild(BX.create("SPAN", {props:{className: "bxc-busy"}}));
		pRow.appendChild(BX.create("SPAN", {props: {className: "bxc-comma"}, html: ','}));

		if (this.bEditMode)
		{
			pRow.appendChild(BX.create("A", {props: {id: 'bxc-att-key-' + User.key, href: 'javascript:void(0)', title: EC_MESS.Delete, className: 'bxc-del-att'}})).onclick = function(e){_this.RemoveAttendee(this.id.substr('bxc-att-key-'.length)); return BX.PreventDefault(e || window.event)};
		}

		this.Attendees[User.key] = {
			User : User,
			pRow: pRow,
			pBusyCont: pBusyInfo
		};
	}
},

RemoveAttendee: function(key, bAffectToControl)
{
	bAffectToControl = bAffectToControl !== false;

	if (this.Attendees[key])
	{
		this.Attendees[key].pRow.parentNode.removeChild(this.Attendees[key].pRow);

		if (this.Attendees[key].User.status == 'Y')
			this.countAgr--;
		if (this.Attendees[key].User.status == 'N')
			this.countDec--;
		this.count--;

		this.Attendees[key] = null;
		delete this.Attendees[key];

		if (this.bEditMode)
		{
			var Attendees = [];
			for (k in this.Attendees)
			{
				if (this.Attendees[k] && this.Attendees[k].type != 'ext')
					Attendees.push(this.Attendees[k].User);
			}

			this.DisableUserOnChange(true, true);

			if (bAffectToControl)
				O_BXCalUserSelect.setSelected(Attendees);
		}
	}

	this.UpdateCount();
},

ListMode: function(mode)
{
	if (this.mode == mode)
		return;

	if (this.mode) // In start
	{
		BX.removeClass(this.pAttendeesList, 'bxc-users-mode-' + this.mode);
		BX.removeClass(this.pSummary, 'bxc-users-mode-' + this.mode);
	}

	this.mode = mode;
	BX.addClass(this.pAttendeesList, 'bxc-users-mode-' + this.mode);
	BX.addClass(this.pSummary, 'bxc-users-mode-' + this.mode);
},

CheckAccessibility : function(Params, timeout)
{
	if (this.check_access_timeout)
		this.check_access_timeout = clearTimeout(this.check_access_timeout);

	var
		bTimeout = timeout > 0,
		_this = this;

	if (bTimeout)
	{
		this.check_access_timeout = setTimeout(function(){_this.CheckAccessibility(Params, 0);}, timeout);
		return;
	}

	var
		attendees = [],
		values = this.GetValues(),
		eventId = parseInt(this._getEventId()),
		fd = this._getFromDate(),
		td = this._getToDate();

	for(id in values)
		attendees.push(id);

	if (!fd || attendees.length <= 0)
		return false;

	var reqData = {
		event_id : eventId,
		attendees : attendees,
		from: BX.date.getServerTimestamp(fd.getTime())
	};

	if (td)
		reqData.to = BX.date.getServerTimestamp(td.getTime());

	this.oEC.Request({
		postData: this.oEC.GetReqData('check_guests', reqData),
		handler: function(oRes)
		{
			if (!oRes)
				return false;

			if (oRes.data)
			{
				var id, acc, pBusyCont;
				for (id in oRes.data)
				{
					if (!_this.Attendees[id])
						continue;
					acc = oRes.data[id];
					pBusyCont = _this.Attendees[id].pBusyCont;
					if (acc &&  pBusyCont && EC_MESS['Acc_' + acc])
					{
						pBusyCont.innerHTML = '(' + EC_MESS['Acc_' + acc] + ')';
						pBusyCont.title = EC_MESS.UserAccessibility;
						pBusyCont.style.display = '';
					}
					else
					{
						pBusyCont.style.display = 'none';
					}
				}
			}
			return true;
		}
	});
}
}

var ECBanner = function(oEC)
{
	var _this = this;
	this.oEC = oEC;

	this.pWnd = BX(this.oEC.id + 'banner');
	this.pWnd.onmouseover = function(){if(_this._sect_over_timeout){clearInterval(_this._sect_over_timeout);} BX.addClass(_this.pWnd, 'bxec-hover');};
	this.pWnd.onmouseout = function(){_this._sect_over_timeout = setTimeout(function(){BX.removeClass(_this.pWnd, 'bxec-hover');}, 100);};

	BX(this.oEC.id + '_ban_close').onclick = function(){_this.Close(); return false;};

	if (this.oEC.bIntranet)
	{
		this.pOutlSel = BX(oEC.id + '_outl_sel');
		if (this.pOutlSel && this.pOutlSel.parentNode)
		{
			this.pOutlSel.parentNode.onclick = function(){_this.ShowPopup('outlook');};
			this.pOutlSel.onmouseover = function(){BX.addClass(this, "bxec-ban-over");};
			this.pOutlSel.onmouseout = function(){BX.removeClass(this, "bxec-ban-over");};
		}
	}

	if (this.oEC.bCalDAV)
	{
		this.pMobSel = BX(oEC.id + '_mob_sel');
		if (this.pMobSel && this.pMobSel.parentNode)
		{
			this.pMobSel.parentNode.onclick = function(){_this.ShowPopup('mobile');};
			this.pMobSel.onmouseover = function(){BX.addClass(this, "bxec-ban-over");};
			this.pMobSel.onmouseout = function(){BX.removeClass(this, "bxec-ban-over");};
		}
	}

	if (this.oEC.arConfig.bExchange)
	{
		var pLink = BX(oEC.id + '_exch_sync');
		if (pLink)
			pLink.onclick = function(){_this.oEC.SyncExchange();return false;};
	}

	this.Popup = {};

	if (!window.jsOutlookUtils)
		return BX.loadScript('/bitrix/js/calendar/outlook.js', _this.outlookRun);
}

ECBanner.prototype =
{
	ShowPopup: function(type)
	{
		var _this = this;
		if (!this.Popup[type])
			this.CreatePopup(type);

		if (this.Popup[type].bShowed)
			return this.ClosePopup(type);

		this.ClosePopup(type);
		var pWnd = this.Popup[type].pWin.Get();
		this.Popup[type].bShowed = true;

		var
			rowsCount = 0,
			i, l = this.oEC.arSections.length, cal, name, pItem;

		BX.cleanNode(pWnd);

		if (type == 'mobile')
		{
			rowsCount++;
			pItem = pWnd.appendChild(BX.create("DIV", {
				props: {id: 'ecpp_all', title: EC_MESS.AllCalendars},
				style: {backgroundColor: '#F2F8D6'},
				text: EC_MESS.AllCalendars,
				events: {
					mouseover: function(){BX.addClass(this, 'bxec-over');},
					mouseout: function(){BX.removeClass(this, 'bxec-over');}
				}
			}));

			pItem.onclick = function()
			{
				_this.RunMobile(this.id.substr('ecpp_'.length));
				_this.ClosePopup();
			}
		}

		for (i = 0; i < l; i++)
		{
			cal = this.oEC.arSections[i];
			if (!this.oEC.IsCurrentViewSect(cal))
				continue;

			if(type == 'outlook' && !cal.OUTLOOK_JS)
				continue;

			rowsCount++;
			pItem = pWnd.appendChild(BX.create("DIV", {
				props: {id: 'ecpp_' + cal.ID, title: cal.NAME, className: 'bxec-text-overflow' + (cal.bDark ? ' bxec-dark' : '')},
				style: {backgroundColor: cal.COLOR},
				text: cal.NAME,
				events: {
					mouseover: function(){BX.addClass(this, 'bxec-over');},
					mouseout: function(){BX.removeClass(this, 'bxec-over');}
				}
			}));

			if (type == 'outlook')
			{
				pItem.onclick = function()
				{
					_this.RunOutlook(this.id.substr('ecpp_'.length));
					_this.ClosePopup();
				}
			}
			else if (type == 'mobile')
			{
				pItem.onclick = function()
				{
					_this.RunMobile(this.id.substr('ecpp_'.length));
					_this.ClosePopup();
				}
			}
		}

		// Add events
		if (!this.bCloseEventsAttached)
		{
			BX.bind(document, "keyup", BX.proxy(this.OnKeyUp, this));
			setTimeout(function()
			{
				_this.bPreventClickClosing = false;
				BX.bind(document, "click", BX.proxy(_this.ClosePopup, _this));
			}, 100);
			this.bCloseEventsAttached = true;
		}

		var pos = BX.pos(this.Popup[type].pSel);
		this.Popup[type].pWin.Show(true); // Show window
		pWnd.style.width = '200px';
		pWnd.style.height = '';

		// Set start position
		pWnd.style.left = (pos.left + 0) + 'px';
		pWnd.style.top = (pos.bottom + 0) + 'px';
	},

	OnKeyUp: function(e)
	{
		if(!e) e = window.event;
		if(e.keyCode == 27)
			this.ClosePopup();
	},

	ClosePopup: function()
	{
		// if (this.bPreventClickClosing)
			// return;

		for (var type in this.Popup)
		{
			this.Popup[type].pWin.Get().style.display = "none";
			this.Popup[type].bShowed = false;
			this.Popup[type].pWin.Close();
		}

		if (this.bCloseEventsAttached)
		{
			this.bCloseEventsAttached = false;
			BX.unbind(document, "keyup", BX.proxy(this.OnKeyUp, this));
			BX.unbind(document, "click", BX.proxy(this.ClosePopup, this));
		}
	},

	CreatePopup: function(type)
	{
		var _this = this;
		this.Popup[type] = {pWin: new BX.CWindow(false, 'float')};

		if (type == 'outlook')
			this.Popup[type].pSel = this.pOutlSel;
		else if (type == 'mobile')
			this.Popup[type].pSel = this.pMobSel;

		BX.addClass(this.Popup[type].pWin.Get(), "bxec-ban-popup");
	},

	Close: function(bSaveSettings)
	{
		this.pWnd .parentNode.removeChild(this.pWnd);
		if (bSaveSettings !== false)
		{
			if (BX.admin && BX.admin.panel)
				BX.admin.panel.Notify(EC_MESS.CloseBannerNotify);
			this.oEC.userSettings.showBanner = false;
			BX.userOptions.save('calendar', 'user_settings', 'showBanner', 0);
		}
	},

	RunOutlook: function(id)
	{
		var oSect = this.oEC.oSections[id];
		if(oSect && oSect.OUTLOOK_JS && oSect.OUTLOOK_JS.length > 0)
			try{eval(oSect.OUTLOOK_JS);}catch(e){};
	},

	RunMobile: function(id)
	{
		this.oEC.ShowMobileHelpDialog(id);
	}
};

var ECMonthSelector = function(oEC)
{
	this.oEC = oEC;
	this.Build();
	this.content = {month: '', week: '', day: ''};
}

ECMonthSelector.prototype = {
	Build : function()
	{
		var _this = this;
		this.pPrev = BX(this.oEC.id + "selector-prev");
		this.pNext = BX(this.oEC.id + "selector-next");
		this.pCont = BX(this.oEC.id + "selector-cont");
		this.pContInner = BX(this.oEC.id + "selector-cont-inner");

		this.pPrev.onclick = function(){_this.ChangeValue(false);};
		this.pNext.onclick = function(){_this.ChangeValue(true);};
	},

	ChangeMode : function(mode)
	{
		this.mode = mode || this.oEC.activeTabId;
		if (this.mode == 'month')
		{
			this.pCont.className = 'bxec-sel-but';
			this.pCont.onclick = BX.proxy(this.ShowMonthPopup, this);
		}
		else
		{
			this.pCont.className = 'bxec-sel-text';
			this.pCont.onclick = BX.False;
		}
	},

	OnChange : function(year, month, week, date)
	{
		month = parseInt(month, 10);
		year = parseInt(year);
		var res, dayOffset;

		this.pNext.style.marginLeft = (this.mode == 'month' && BX.browser.IsIE() && !BX.browser.IsIE9()) ? '10px' : ''; // Hack for IE 8

		if (this.mode == 'month')
		{
			if (month < 0 || month > 11)
				return alert('Error! Incorrect month');

			this.content.month = this.oEC.arConfig.month[month] + ',&nbsp;' + year + '<span class="bxec-sel-but-arr">';
		}
		else if (this.mode == 'week')
		{
			var startWeekDate = new Date();
			startWeekDate.setFullYear(year, month, 1);

			//if (week < 0 && this.oEC.weekStart != this.oEC.GetWeekDayByInd(startWeekDate.getDay()))
			//	week = 0;

			dayOffset = this.oEC.GetWeekDayOffset(this.oEC.GetWeekDayByInd(startWeekDate.getDay()));

			if(dayOffset > 0)
				startWeekDate.setDate(startWeekDate.getDate() - dayOffset); // Now it-s first day in of this week

			if (week != 0)
				startWeekDate.setDate(startWeekDate.getDate() + (7 * week));

			var oSunDate = new Date(startWeekDate.getTime());
			oSunDate.setDate(oSunDate.getDate() + 6);
			var
				content,
				month_r = this.oEC.arConfig.month_r,
				d_f = startWeekDate.getDate(),
				m_f = startWeekDate.getMonth(),
				y_f = startWeekDate.getFullYear(),
				d_t = oSunDate.getDate(),
				m_t = oSunDate.getMonth(),
				y_t = oSunDate.getFullYear();

			if (m_f == m_t)
				content = d_f + '&nbsp;-&nbsp;' + d_t + '&nbsp;' + month_r[m_f] + '&nbsp;' + y_f;
			else if(y_f == y_t)
				content = d_f + '&nbsp;' + month_r[m_f] + '&nbsp;-&nbsp;' + d_t + '&nbsp;' + month_r[m_t] + '&nbsp;' + y_f;
			else
				content = d_f + '&nbsp;' + month_r[m_f] + '&nbsp;' + y_f + '&nbsp;-&nbsp;' + d_t + '&nbsp;' + month_r[m_t] + '&nbsp;' + y_t;

			this.content.week = '<nobr>' + content + '</nobr>';
			res = {
				dateFrom: d_f,
				monthFrom: m_f,
				yearFrom: y_f,
				weekStartDate: startWeekDate,
				monthTo: m_t,
				yearTo: y_t,
				dateTo: d_t,
				weekEndDate: oSunDate
			};
		}
		else if (this.mode == 'day')
		{
			var oDate = new Date();
			oDate.setFullYear(year, month, date);
			day = this.oEC.ConvertDayIndex(oDate.getDay());
			date = oDate.getDate(),
			month = oDate.getMonth(),
			year = oDate.getFullYear();

			this.content.day = '<nobr>' + this.oEC.arConfig.days[day][0] + ',&nbsp;' + date + '&nbsp;' + this.oEC.arConfig.month_r[month] + '&nbsp;' + year + '</nobr>';
			res = {date: date, month: month, year: year, oDate: oDate};
		}

		this.Show(this.mode);
		return res;
	},

	Show: function(mode)
	{
		this.pContInner.innerHTML = this.content[mode];
	},

	ChangeValue: function(bNext)
	{
		var delta = bNext ? 1 : -1;
		if (this.mode == 'month')
		{
			//IncreaseCurMonth
			var m = bxInt(this.oEC.activeDate.month) + delta;
			var y = this.oEC.activeDate.year;
			if (m < 0)
			{
				m += 12;
				y--;
			}
			else if (m > 11)
			{
				m -= 12;
				y++;
			}
			this.oEC.SetMonth(m, y);
		}
		else if (this.mode == 'week')
		{
			this.oEC.SetWeek(this.oEC.activeDate.week + delta, this.oEC.activeDate.month, this.oEC.activeDate.year);
		}
		else if (this.mode == 'day')
		{
			this.oEC.SetDay(this.oEC.activeDate.date + delta, this.oEC.activeDate.month, this.oEC.activeDate.year);
		}
	},

	ShowMonthPopup: function()
	{
		if (!this.oMonthWin)
		{
			var _this = this;
			this.oMonthWin = new BX.PopupWindow(this.oEC.id + "bxc-month-sel", this.pCont, {
				overlay: {opacity: 1},
				autoHide : true,
				offsetTop : 1,
				offsetLeft : 0,
				lightShadow : true,
				content : BX('bxec_month_win_' + this.oEC.id)
			});
			this.oMonthWin.CAL = {
				DOM : {
					Year: BX(this.oEC.id + 'md-year'),
					MonthList: BX(this.oEC.id + 'md-month-list')
				},
				curYear: parseInt(this.oEC.activeDate.year)
			};

			this.oMonthWin.CAL.DOM.Year.innerHTML = this.oMonthWin.CAL.curYear;
			BX(this.oEC.id + 'md-selector-prev').onclick = function(){_this.oMonthWin.CAL.DOM.Year.innerHTML = --_this.oMonthWin.CAL.curYear;};
			BX(this.oEC.id + 'md-selector-next').onclick = function(){_this.oMonthWin.CAL.DOM.Year.innerHTML = ++_this.oMonthWin.CAL.curYear;};

			var
				i, m, div,
				arM = [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7, 11];

			for (i = 0; i < 12; i++)
			{
				m = arM[i];
				div = this.oMonthWin.CAL.DOM.MonthList.appendChild(BX.create("DIV", {
					props: {id: 'bxec_ms_m_' + arM[i], className: 'bxec-month-div' + (arM[i] == this.oEC.activeDate.month ? ' bxec-month-act' : '') + ' bxec-' + this.GetSeason(arM[i])},
					html: '<span>' + this.oEC.arConfig.month[arM[i]] + '</span>',
					events: {click: function()
					{
						//_this.MonthWinSetMonth(this);
						BX.removeClass(_this.oMonthWin.CAL.DOM.curMonth, 'bxec-month-act');
						BX.addClass(this, 'bxec-month-act');
						_this.oMonthWin.CAL.DOM.curMonth = this;
						_this.oEC.SetMonth(parseInt(this.id.substr('bxec_ms_m_'.length)), _this.oMonthWin.CAL.curYear);
						_this.oMonthWin.close();
					}}
				}));
				if (arM[i] == this.oEC.activeDate.month)
					this.oMonthWin.CAL.DOM.curMonth = div;
			}
		}

		this.oMonthWin.show();
	},

	GetSeason : function(m)
	{
		switch(m)
		{
			case 11: case 0: case 1:
				return 'winter';
			case 2: case 3: case 4:
				return 'spring';
			case 5: case 6: case 7:
				return 'summer';
			case 8: case 9: case 10:
				return 'autumn';
		}
	}
};

var ECCalendarAccess = function(Params)
{
	BX.Access.Init();
	if (!window.EC_MESS)
		EC_MESS = {};

	this.bind = Params.bind;
	this.GetAccessName = Params.GetAccessName;
	this.pTbl = Params.pCont.appendChild(BX.create("TABLE", {props: {className: "bxc-access-tbl"}}));
	this.pSel = BX('bxec-' + this.bind);
	var _this = this;
	this.delTitle = Params.delTitle || EC_MESS.Delete;
	this.noAccessRights = Params.noAccessRights || EC_MESS.NoAccessRights;

	this.inputName = Params.inputName || false;

	Params.pLink.onclick = function(){
		BX.Access.ShowForm({
			callback: BX.proxy(_this.InsertRights, _this),
			bind: _this.bind
		});
	};
}

ECCalendarAccess.prototype = {
	InsertRights: function(obSelected)
	{
		var provider, code;
		for(provider in obSelected)
			for(code in obSelected[provider])
				this.InsertAccessRow(BX.Access.GetProviderName(provider) + ' ' + obSelected[provider][code].name, code);
	},

	InsertAccessRow: function(title, code, value)
	{
		var _this = this, row, pLeft, pRight, pTaskSelect;
		if (this.pTbl.rows[0] && this.pTbl.rows[0].cells[0] && this.pTbl.rows[0].cells[0].className.indexOf('bxc-access-no-vals') != -1)
			this.DeleteRow(0);

		row = this.pTbl.insertRow(-1);
		pLeft = BX.adjust(row.insertCell(-1), {props : {className: 'bxc-access-c-l'}, html: title + ':'});
		pRight = BX.adjust(row.insertCell(-1), {props : {className: 'bxc-access-c-r'}});
		pTaskSelect = pRight.appendChild(this.pSel.cloneNode(true));
		//pTaskSelect.name = 'BXEC_ACCESS_' + code;
		pTaskSelect.id = 'BXEC_ACCESS_' + code;

		if (value)
			pTaskSelect.value = value;
		pDel = pRight.appendChild(BX.create('A', {props:{className: 'access-delete', href: 'javascript:void(0)', title: this.delTitle}, events: {click: function(){_this.DeleteRow(this.parentNode.parentNode.rowIndex);}}}));

		if (this.inputName)
		{
			pTaskSelect.name = this.inputName + '[' + code + ']';
			//pRight.appendChild(BX.create('INPUT', {props:{type: 'hidden', value: this.inputName + '[' + code + ']'}}));
		}
	},

	DeleteRow: function(rowIndex)
	{
		if (this.pTbl.rows[rowIndex])
			this.pTbl.deleteRow(rowIndex);
	},

	GetValues: function()
	{
		var
			id, taskId,
			res = {},
			arSelect = this.pTbl.getElementsByTagName("SELECT"),
			i, l = arSelect.length;

		for(i = 0; i < l; i++)
		{
			id = arSelect[i].id.substr('BXEC_ACCESS_'.length);
			taskId = arSelect[i].value;
			res[id] = taskId;
		}

		return res;
	},

	SetSelected: function(oAccess)
	{
		if (!oAccess)
			oAccess = {};

		while (this.pTbl.rows[0])
			this.pTbl.deleteRow(0);

		var
			code,
			oSelected = {};

		for (code in oAccess)
		{
			this.InsertAccessRow(this.GetTitleByCode(code), code, oAccess[code]);
			oSelected[code] = true;
		}

		// Insert 'no value'  if no permissions exists
		if (this.pTbl.rows.length <= 0)
			BX.adjust(this.pTbl.insertRow(-1).insertCell(-1), {props : {className: 'bxc-access-no-vals', colSpan: 2}, html: '<span>' + this.noAccessRights + '</span>'});

		BX.Access.SetSelected(oSelected, this.bind);
	},

	GetTitleByCode: function(code)
	{
		return this.GetAccessName(code);
	}
};

function ECColorPicker(Params)
{
	//this.bCreated = false;
	this.bOpened = false;
	this.zIndex = 5000;
	this.id = '';
	this.Popups = {};
	this.Conts = {};
}

ECColorPicker.prototype = {
	Create: function ()
	{
		var _this = this;
		var pColCont = document.body.appendChild(BX.create("DIV", {props: {className: "ec-colpick-cont"}, style: {zIndex: this.zIndex}}));

		var
			arColors = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF', '#EBEBEB', '#E1E1E1', '#D7D7D7', '#CCCCCC', '#C2C2C2', '#B7B7B7', '#ACACAC', '#A0A0A0', '#959595',
			'#EE1D24', '#FFF100', '#00A650', '#00AEEF', '#2F3192', '#ED008C', '#898989', '#7D7D7D', '#707070', '#626262', '#555', '#464646', '#363636', '#262626', '#111', '#000000',
			'#F7977A', '#FBAD82', '#FDC68C', '#FFF799', '#C6DF9C', '#A4D49D', '#81CA9D', '#7BCDC9', '#6CCFF7', '#7CA6D8', '#8293CA', '#8881BE', '#A286BD', '#BC8CBF', '#F49BC1', '#F5999D',
			'#F16C4D', '#F68E54', '#FBAF5A', '#FFF467', '#ACD372', '#7DC473', '#39B778', '#16BCB4', '#00BFF3', '#438CCB', '#5573B7', '#5E5CA7', '#855FA8', '#A763A9', '#EF6EA8', '#F16D7E',
			'#EE1D24', '#F16522', '#F7941D', '#FFF100', '#8FC63D', '#37B44A', '#00A650', '#00A99E', '#00AEEF', '#0072BC', '#0054A5', '#2F3192', '#652C91', '#91278F', '#ED008C', '#EE105A',
			'#9D0A0F', '#A1410D', '#A36209', '#ABA000', '#588528', '#197B30', '#007236', '#00736A', '#0076A4', '#004A80', '#003370', '#1D1363', '#450E61', '#62055F', '#9E005C', '#9D0039',
			'#790000', '#7B3000', '#7C4900', '#827A00', '#3E6617', '#045F20', '#005824', '#005951', '#005B7E', '#003562', '#002056', '#0C004B', '#30004A', '#4B0048', '#7A0045', '#7A0026'],
			row, cell, colorCell,
			tbl = BX.create("TABLE", {props: {className: 'ec-colpic-tbl'}}),
			i, l = arColors.length;

		row = tbl.insertRow(-1);
		cell = row.insertCell(-1);
		cell.colSpan = 8;
		var defBut = cell.appendChild(BX.create("SPAN", {props: {className: 'ec-colpic-def-but'}, text: EC_MESS.DefaultColor}));
		defBut.onmouseover = function()
		{
			this.className = 'ec-colpic-def-but ec-colpic-def-but-over';
			colorCell.style.backgroundColor = '#FF0000';
		};
		defBut.onmouseout = function(){this.className = 'ec-colpic-def-but';};
		defBut.onmousedown = function(e){_this.Select('#FF0000');}

		colorCell = row.insertCell(-1);
		colorCell.colSpan = 8;
		colorCell.className = 'ec-color-inp-cell';
		colorCell.style.backgroundColor = arColors[38];

		for(i = 0; i < l; i++)
		{
			if (Math.round(i / 16) == i / 16) // new row
				row = tbl.insertRow(-1);

			cell = row.insertCell(-1);
			cell.innerHTML = '&nbsp;';
			cell.className = 'ec-col-cell';
			cell.style.backgroundColor = arColors[i];
			cell.id = 'lhe_color_id__' + i;

			cell.onmouseover = function (e)
			{
				this.className = 'ec-col-cell ec-col-cell-over';
				colorCell.style.backgroundColor = arColors[this.id.substring('lhe_color_id__'.length)];
			};
			cell.onmouseout = function (e){this.className = 'ec-col-cell';};
			cell.onmousedown = function (e)
			{
				var k = this.id.substring('lhe_color_id__'.length);
				_this.Select(arColors[k]);
			};
		}

		pColCont.appendChild(tbl);

		this.Conts[this.id] = pColCont;
		//this.bCreated = true;
	},

	Open: function(Params)
	{
		this.id = Params.id + Math.round(Math.random() * 1000000);
		this.key = Params.key;
		this.OnSelect = Params.onSelect;

		if (!this.Conts[this.id])
			this.Create();

		if (!this.Popups[this.id])
		{
			this.Popups[this.id] = BX.PopupWindowManager.create("bxc-color-popup" + this.id, Params.pWnd, {
				autoHide : true,
				offsetTop : 1,
				offsetLeft : 0,
				lightShadow : true,
				content : this.Conts[this.id]
			});
		}

		this.Popups[this.id].show();
	},

	Close: function ()
	{
		this.Popups[this.id].close();
		this.Popups[this.id].destroy();
	},

	OnKeyPress: function(e)
	{
		if(!e) e = window.event
		if(e.keyCode == 27)
			this.Close();
	},

	Select: function (color)
	{
		if (this.OnSelect && typeof this.OnSelect == 'function')
			this.OnSelect(color);
		this.Close();
	}
};


/* DESTINATION */
// Calbacks for destination
window.BxEditEventGridSetLinkName = function(name)
{
	var destLink = BX('event-grid-dest-add-link');
	if (destLink)
		destLink.innerHTML = BX.SocNetLogDestination.getSelectedCount(name) > 0 ? BX.message("BX_FPD_LINK_2") : BX.message("BX_FPD_LINK_1");
}

window.BxEditEventGridSelectCallback = function(item, type, search)
{
	var type1 = type;
	prefix = 'S';
	if (type == 'sonetgroups')
		prefix = 'SG';
	else if (type == 'groups')
	{
		prefix = 'UA';
		type1 = 'all-users';
	}
	else if (type == 'users')
		prefix = 'U';
	else if (type == 'department')
		prefix = 'DR';

	BX('event-grid-dest-item').appendChild(
		BX.create("span", { attrs : {'data-id' : item.id }, props : {className : "event-grid-dest event-grid-dest-"+type1 }, children: [
			BX.create("input", { attrs : {type : 'hidden', name : 'EVENT_DESTINATION['+prefix+'][]', value : item.id }}),
			BX.create("span", { props : {className : "event-grid-dest-text" }, html : item.name}),
			BX.create("span", { props : {className : "feed-event-del-but"}, attrs: {'data-item-id': item.id, 'data-item-type': type}})
		]})
	);

	BX.onCustomEvent('OnDestinationAddNewItem', [item]);
	BX('event-grid-dest-input').value = '';
	BxEditEventGridSetLinkName(editEventDestinationFormName);
}

// remove block
window.BxEditEventGridUnSelectCallback = function(item, type, search)
{
	var elements = BX.findChildren(BX('event-grid-dest-item'), {attribute: {'data-id': ''+item.id+''}}, true);
	if (elements != null)
	{
		for (var j = 0; j < elements.length; j++)
			BX.remove(elements[j]);
	}

	BX.onCustomEvent('OnDestinationUnselect');
	BX('event-grid-dest-input').value = '';
	BxEditEventGridSetLinkName(editEventDestinationFormName);
}
window.BxEditEventGridOpenDialogCallback = function()
{
	BX.style(BX('event-grid-dest-input-box'), 'display', 'inline-block');
	BX.style(BX('event-grid-dest-add-link'), 'display', 'none');
	BX.focus(BX('event-grid-dest-input'));
}

window.BxEditEventGridCloseDialogCallback = function()
{
	if (!BX.SocNetLogDestination.isOpenSearch() && BX('event-grid-dest-input').value.length <= 0)
	{
		BX.style(BX('event-grid-dest-input-box'), 'display', 'none');
		BX.style(BX('event-grid-dest-add-link'), 'display', 'inline-block');
		BxEditEventGridDisableBackspace();
	}
}

window.BxEditEventGridCloseSearchCallback = function()
{
	if (!BX.SocNetLogDestination.isOpenSearch() && BX('event-grid-dest-input').value.length > 0)
	{
		BX.style(BX('event-grid-dest-input-box'), 'display', 'none');
		BX.style(BX('event-grid-dest-add-link'), 'display', 'inline-block');
		BX('event-grid-dest-input').value = '';
		BxEditEventGridDisableBackspace();
	}

}
window.BxEditEventGridDisableBackspace = function(event)
{
	if (BX.SocNetLogDestination.backspaceDisable || BX.SocNetLogDestination.backspaceDisable != null)
		BX.unbind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable);

	BX.bind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable = function(event){
		if (event.keyCode == 8)
		{
			BX.PreventDefault(event);
			return false;
		}
	});
	setTimeout(function(){
		BX.unbind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable);
		BX.SocNetLogDestination.backspaceDisable = null;
	}, 5000);
}

window.BxEditEventGridSearchBefore = function(event)
{
	if (event.keyCode == 8 && BX('event-grid-dest-input').value.length <= 0)
	{
		BX.SocNetLogDestination.sendEvent = false;
		BX.SocNetLogDestination.deleteLastItem(editEventDestinationFormName);
	}

	return true;
}
window.BxEditEventGridSearch = function(event)
{
	if (event.keyCode == 16 || event.keyCode == 17 || event.keyCode == 18 || event.keyCode == 20 || event.keyCode == 244 || event.keyCode == 224 || event.keyCode == 91)
		return false;

	if (event.keyCode == 13)
	{
		BX.SocNetLogDestination.selectFirstSearchItem(editEventDestinationFormName);
		return true;
	}
	if (event.keyCode == 27)
	{
		BX('event-grid-dest-input').value = '';
		BX.style(BX('event-grid-dest-add-link'), 'display', 'inline');
	}
	else
	{
		BX.SocNetLogDestination.search(BX('event-grid-dest-input').value, true, editEventDestinationFormName);
	}

	if (!BX.SocNetLogDestination.isOpenDialog() && BX('event-grid-dest-input').value.length <= 0)
	{
		BX.SocNetLogDestination.openDialog(editEventDestinationFormName);
	}
	else
	{
		if (BX.SocNetLogDestination.sendEvent && BX.SocNetLogDestination.isOpenDialog())
			BX.SocNetLogDestination.closeDialog();
	}
	if (event.keyCode == 8)
	{
		BX.SocNetLogDestination.sendEvent = true;
	}
	return true;
}
/* END DESTINATION */

;(function(window){
	window.EditEventPopupController = function(config)
	{
		this.config = config;
		this.id = this.config.id;
		this.oEC = this.config.oEC;
		this.oEvent = this.config.oEvent;
		this.WDControllerCID = this.config.WDControllerCID;
		this.Form = this.config.form;

		this.parser = {
			postimage : {
				exist : true,
				tag : 'postimage',
				thumb_width : 800,
				regexp : /\[IMG ID=((?:\s|\S)*?)(?:\s*?WIDTH=(\d+)\s*?HEIGHT=(\d+))?\]/ig,
				code : '[IMG ID=#ID##ADDITIONAL#]',
				html : '<img id="#ID#" src="#SRC#" lowsrc="#LOWSRC#" title=""#ADDITIONAL# />'
			},
			postfile : {
				exist : true,
				tag : 'postfile',
				thumb_width : 800,
				regexp : /\[FILE ID=((?:\s|\S)*?)(?:\s*?WIDTH=(\d+)\s*?HEIGHT=(\d+))?\]/ig,
				code : '[FILE ID=#ID##ADDITIONAL#]',
				html : '<span style="color: #2067B0; border-bottom: 1px dashed #2067B0; margin:0 2px;" id="#ID#"#ADDITIONAL#>#NAME#</span>'
			},
			postdocument : {
				exist : true,
				tag : "postdocument", // and parser LHE
				thumb_width : 800,
				regexp : /\[DOCUMENT ID=((?:\s|\S)*?)(?:\s*?WIDTH=(\d+)\s*?HEIGHT=(\d+))?\]/ig,
				code : '[DOCUMENT ID=#ID##ADDITIONAL#]',
				html : '<span style="color: #2067B0; border-bottom: 1px dashed #2067B0; margin:0 2px;" id="#ID#"#ADDITIONAL#>#NAME#</span>'
			}
		};
		this.arFiles = [];
		this.Init();
	};

	window.EditEventPopupController.prototype = {
		Init: function()
		{
			var _this = this;
			BX('bx_cal_file_' + this.id).onclick = BX.proxy(this.InitWDFileController, this);

			// *************** Init events ***************
			if(window[this.config.LHEJsObjName])
			{
				this.OnEditorInit(window[this.config.LHEJsObjName]);
			}
			else
			{
				function __lheOnInit(pEditor)
				{
					if (pEditor.id == _this.config.LHEId)
					{
						setTimeout(function(){_this.OnEditorInit(pEditor);}, 100);
						BX.removeCustomEvent('LHE_OnInit', __lheOnInit);
					}
				}
				BX.addCustomEvent('LHE_OnInit', __lheOnInit);
			}

			this.InitDateTimeControls();
			if (this.oEC.allowMeetings)
				this.InitDestinationControls();
			this.FillFormFields();
		},

		GetFromToValues: function()
		{
			// Datetime limits
			var fd = BX.parseDate(this.pFromDate.value);
			if (!fd)
				return alert(EC_MESS.EventDiapStartError);

			if (this.pFullDay.checked)
				this._FromTimeValue = this.pFromTime.value = this.pToTime.value = '';

			var fromTime = this.oEC.ParseTime(this.pFromTime.value);
			fd.setHours(fromTime.h);
			fd.setMinutes(fromTime.m);
			var
				to,
				from = fd.getTime();

			var td = BX.parseDate(this.pToDate.value);
			if (td)
			{
				var toTime = this.oEC.ParseTime(this.pToTime.value);
				td.setHours(toTime.h);
				td.setMinutes(toTime.m);
				to = td.getTime();

				if (from == to && toTime.h == 0 && toTime.m == 0)
				{
					fd.setHours(0);
					fd.setMinutes(0);
					td.setHours(0);
					td.setMinutes(0);

					from = fd.getTime();
					to = td.getTime();
				}
			}
			else
			{
				if (this.oEvent.ID)
					return alert(EC_MESS.EventDiapEndError);
				else
					to = from;
			}

			if (from > to) // Date To earlier Date From - send error
				return alert(EC_MESS.EventDatesError);

			return {from: from, to: to};
		},

		SaveForm: function(Params)
		{
			var
				_this = this,
				month = parseInt(this.oEC.activeDate.month, 10),
				year = this.oEC.activeDate.year,
				url = this.oEC.actionUrl,
				reqId = Math.round(Math.random() * 1000000);

			url += (url.indexOf('?') == -1) ? '?' : '&';
			url += 'action=edit_event&bx_event_calendar_request=Y&sessid=' + BX.bitrix_sessid() + '&reqId=' + reqId;
			this.Form.action = url;

			BX('event-id' + this.id).value = this.oEvent.ID || 0;
			BX('event-month' + this.id).value = month + 1;
			BX('event-year' + this.id).value = year;

			// Datetime limits
			var fromTo = this.GetFromToValues();
			if (typeof fromTo !== 'object')
				return;

			BX('event-from-ts' + this.id).value = BX.date.getServerTimestamp(fromTo.from);
			BX('event-to-ts' + this.id).value = BX.date.getServerTimestamp(fromTo.to);

			// RRULE
			if (this.RepeatSelect.value != 'NONE')
			{
				var FREQ = this.RepeatSelect.value;

				BX('event-rrule-until' + this.id).value = '';
				if (this.RepeatDiapTo.value != EC_MESS.NoLimits)
				{
					var until = BX.parseDate(this.RepeatDiapTo.value);
					if (until && until.getTime)
						BX('event-rrule-until' + this.id).value = BX.date.getServerTimestamp(until.getTime());
				}

				if (FREQ == 'WEEKLY')
				{
					var ar = [], i;
					for (i = 0; i < 7; i++)
						if (this.RepeatWeekDaysCh[i].checked)
							ar.push(this.RepeatWeekDaysCh[i].value);

					if (ar.length == 0)
						this.RepeatSelect.value = 'NONE';
					else
						BX('event-rrule-byday' + this.id).value = ar.join(',');
				}
			}

			// Location
			BX('event-location-old' + this.id).value = this.Loc.OLD || false;
			BX('event-location-new' + this.id).value = this.Loc.NEW;


			// Check Meeting and Video Meeting rooms accessibility
			if (this.Loc.NEW.substr(0, 5) == 'ECMR_' && !Params.bLocationChecked)
			{
				this.oEC.CheckMeetingRoom(
					{
						id : this.oEvent.ID || 0,
						from : BX.date.getServerTimestamp(fromTo.from),
						to : BX.date.getServerTimestamp(fromTo.to),
						location_new : this.Loc.NEW,
						location_old : this.Loc.OLD || false
					},
					function(check)
					{
						if (!check)
							return alert(EC_MESS.MRReserveErr);
						if (check == 'reserved')
							return alert(EC_MESS.MRNotReservedErr);

						Params.bLocationChecked = true;
						_this.SaveForm(Params);
					}
				);
				return false;
			}

			BX.ajax.submit(this.Form, function(html)
			{
				var oRes = top.BXCRES[reqId];
				if(top.BXCRES[reqId])
				{
					_this.oEC.Event.UnDisplay(oRes.id, false);
					_this.oEC.HandleEvents(oRes.events, oRes.attendees);
					_this.oEC.arLoadedMonth[month + '.' + year] = true;

					if (oRes.deletedEventId > 0)
						_this.oEC.Event.UnDisplay(oRes.deletedEventId, false);

					_this.oEC.Event.Display();
				}
			});

			// Color
			var
				sectId = this.pSectSelect.value,
				oSect = _this.oEC.oSections && _this.oEC.oSections[sectId] ? _this.oEC.oSections[sectId] : {},
				text_color = this.TextColor,
				color = this.Color;

			if (!oSect.COLOR || oSect.COLOR && oSect.COLOR.toLowerCase() != color.toLowerCase())
				BX(this.id + '_bxec_color').value = color;
			if (!oSect.TEXT_COLOR || oSect.TEXT_COLOR && oSect.TEXT_COLOR.toLowerCase() != text_color.toLowerCase())
				BX(this.id + '_bxec_text_color').value = text_color;

			if (Params.callback)
				Params.callback();
		},

		InitDestinationControls: function()
		{
			var _this = this;
			BX.addCustomEvent('OnDestinationAddNewItem', BX.proxy(this.DestinationOnChange, this));
			BX.addCustomEvent('OnDestinationUnselect', BX.proxy(this.DestinationOnChange, this))

			this.pAttCont = BX('event-grid-att' + this.id);
			this.pMeetingParams = BX('event-grid-meeting-params' + this.id);

			this.pDestValuesCont = BX('event-grid-dest-item');

			BX.bind(this.pDestValuesCont, 'click', function(e)
			{
				var targ = e.target || e.srcElement;
				if (targ.className == 'feed-event-del-but') // Delete button
				{
					BX.SocNetLogDestination.deleteItem(targ.getAttribute('data-item-id'), targ.getAttribute('data-item-type'), editEventDestinationFormName);
					BX.PreventDefault(e);
				}
			});

			BX.bind(this.pDestValuesCont, 'mouseover', function(e)
			{
				var targ = e.target || e.srcElement;
				if (targ.className == 'feed-event-del-but') // Delete button
					BX.addClass(targ.parentNode, 'event-grid-dest-hover');
			});
			BX.bind(this.pDestValuesCont, 'mouseout', function(e)
			{
				var targ = e.target || e.srcElement;
				if (targ.className == 'feed-event-del-but') // Delete button
					BX.removeClass(targ.parentNode, 'event-grid-dest-hover');
			});

			this.pAttContY = BX('event-edit-att-y');
			this.pAttContN = BX('event-edit-att-n');
			this.pAttContQ = BX('event-edit-att-q');

			this.attendeeIndex = {};

			if (this.oEvent.IS_MEETING)
			{
				BX.addClass(this.pAttCont, 'event-grid-dest-cont-full');
				this.pMeetingParams.style.display = 'block';
				this.DisplayAttendees(this.oEvent['~ATTENDEES']);
			}

			this.AddMeetTextLink = BX(this.id + '_add_meet_text');
			this.HideMeetTextLink = BX(this.id + '_hide_meet_text');
			this.MeetTextCont = BX(this.id + '_meet_text_cont');
			this.MeetText = BX(this.id + '_meeting_text');

			this.OpenMeeting = BX(this.id + '_ed_open_meeting');
			this.NotifyStatus = BX(this.id + '_ed_notify_status');
			this.Reinvite = BX(this.id + '_ed_reivite');
			this.ReinviteCont = BX(this.id + '_ed_reivite_cont');

			this.AddMeetTextLink.onclick = function()
			{
				this.parentNode.style.display = 'none';
				_this.MeetTextCont.style.display = 'block';
				BX.focus(_this.MeetText);
			};

			this.HideMeetTextLink.onclick = function()
			{
				_this.AddMeetTextLink.parentNode.style.display = 'block';
				_this.MeetTextCont.style.display = 'none';
			};

			if (this.oEvent.IS_MEETING)
			{
				this.OpenMeeting.checked = !!(this.oEvent.MEETING && this.oEvent.MEETING.OPEN);
				this.NotifyStatus.checked = !!(this.oEvent.MEETING && this.oEvent.MEETING.NOTIFY);

				if (this.oEvent.MEETING)
				{
					this.MeetText.value = this.oEvent.MEETING.TEXT || '';
					if (this.oEvent.MEETING.TEXT != '')
						this.AddMeetTextLink.onclick();
				}
				else
				{
					this.MeetText.value = '';
				}
				this.Reinvite.checked = true;
			}
			else
			{
				this.AddMeetTextLink.parentNode.style.display = 'block';
				this.MeetTextCont.style.display = 'none';

				if(this.oEvent.MeetText)
					this.oEvent.MeetText.value = '';
				if (this.oEvent.HideMeetTextLink)
					this.oEvent.HideMeetTextLink.onclick();
			}

			BX(this.id + '_planner_link').onclick = function()
			{
				var attendees = [];

				if (attendees.length == 0)
					attendees.push({id: _this.oEC.userId, name: _this.oEC.userName});

				var
					loc = _this.Loc.NEW,
					arLoc = _this.oEC.ParseLocation(loc, true),
					locMrind = arLoc.mrind == undefined ? false : arLoc.mrind;

				_this.oEC.RunPlanner({
					curEventId: _this.oEvent.ID || false,
					attendees: attendees,
					fromDate: _this.pFromDate.value,
					toDate: _this.pToDate.value,
					fromTime: _this.pFromTime.value,
					toTime: _this.pToTime.value,
					location: _this.Loc.NEW,
					locationMrind: locMrind,
					oldLocationMRId: _this.Loc.OLD_mrevid
				});
			};


		},

		DestinationOnChange: function()
		{
			var
				_this = this,
				from, to,
				arInputs = this.pDestValuesCont.getElementsByTagName('INPUT'),
				i, arCodes = [];
			for (i = 0; i < arInputs.length; i++)
				arCodes.push(arInputs[i].value);

			var fromTo = this.GetFromToValues();
			if (typeof fromTo === 'object')
			{
				from = BX.date.getServerTimestamp(fromTo.from);
				to = BX.date.getServerTimestamp(fromTo.to);
			}

			this.oEC.GetAttendeesByCodes(arCodes, function(users)
			{
				if (users.length > 0)
				{
					BX.addClass(_this.pAttCont, 'event-grid-dest-cont-full');
					_this.pMeetingParams.style.display = 'block';
				}
				else
				{
					BX.removeClass(_this.pAttCont, 'event-grid-dest-cont-full');
					_this.pMeetingParams.style.display = 'none';
				}
				_this.DisplayAttendees(users);
			},
			from,
			to,
			this.oEvent.ID || false
			);
		},

		DisplayAttendees: function(users)
		{
			BX.cleanNode(this.pAttContY);
			BX.cleanNode(this.pAttContN);
			BX.cleanNode(this.pAttContQ);
			this.pAttContY.style.display = this.pAttContN.style.display = this.pAttContQ.style.display = 'none';

			var dis = {Y: false, N: false, Q: false};
			for(var i in users)
			{
				if (this.attendeeIndex[users[i].USER_ID])
					users[i].STATUS = this.attendeeIndex[users[i].USER_ID] || 'Q';
				else
					users[i].STATUS = this.attendeeIndex[users[i].USER_ID] = users[i].STATUS || 'Q';

				if (users[i].STATUS == 'Q')
				{
					this.AddAttendee(users[i], this.pAttContQ);
					if (!dis.Q)
						dis.Q = !(this.pAttContQ.style.display = '');
				}
				else if (users[i].STATUS == 'Y')
				{
					this.AddAttendee(users[i], this.pAttContY);
					if (!dis.Y)
						dis.Y = !(this.pAttContY.style.display = '');
				}
				else
				{
					this.AddAttendee(users[i], this.pAttContN);
					if (!dis.N)
						dis.N = !(this.pAttContN.style.display = '');
				}
			}
		},

		AddAttendee: function(user, cont)
		{
			var row = cont.appendChild(BX.create("DIV", {props: {}, children: [
				BX.create("A", {props: {href: user.URL, title: user.DISPLAY_NAME, className: 'bxcal-user bxcal-user-link-name', target: "_blank"}, html: '<span class="bxcal-user-status"></span><span class="bxcal-user-avatar-outer"><span class="bxcal-user-avatar"><img src="' + user.AVATAR + '" width="21" height="21" /></span></span><span class="bxcal-user-name">' + BX.util.htmlspecialchars(user.DISPLAY_NAME) + '</span>'})
			]}));

			if (user.ACC == 'busy' || user.ACC == 'absent')
				row.appendChild(BX.create("SPAN", {props: {className: 'bxcal-user-acc'}, text: '(' + EC_MESS['acc_status_' + user.ACC] + ')'}));
		},

		InitDateTimeControls: function()
		{
			// From-to
			this.pFromToCont = BX('feed-cal-from-to-cont' + this.id);
			this.pFromDate = BX('feed-cal-event-from' + this.id);
			this.pToDate = BX('feed-cal-event-to' + this.id);
			this.pFromTime = BX('feed_cal_event_from_time' + this.id);
			this.pToTime = BX('feed_cal_event_to_time' + this.id);
			this.pFullDay = BX('event-full-day' + this.id);
			this.pFromTs = BX('event-from-ts' + this.id);
			this.pToTs = BX('event-to-ts' + this.id);
			//Reminder
			this.pReminderCont = BX('feed-cal-reminder-cont' + this.id);
			this.pReminder = BX('event-reminder' + this.id);
			this.pRemType = BX('event_remind_type' + this.id);
			this.pRemCount = BX('event_remind_count' + this.id);
			// Control events
			this.pFullDay.onclick = BX.proxy(this.FullDay, this);
			this.pReminder.onclick = BX.proxy(this.Reminder, this);

			var _this = this;
			// Date
			this.pFromDate.onclick = function(){BX.calendar({node: this.parentNode, field: this, bTime: false});};
			this.pToDate.onclick = function(){BX.calendar({node: this.parentNode, field: this, bTime: false});};

			this.pFromDate.onchange = function()
			{
				if(_this._FromDateValue)
				{
					var
						prevF = BX.parseDate(_this._FromDateValue),
						F = BX.parseDate(_this.pFromDate.value),
						T = BX.parseDate(_this.pToDate.value);

					if (F)
					{
						var duration = T.getTime() - prevF.getTime();
						T = new Date(F.getTime() + duration);
						_this.pToDate.value = bxFormatDate(T.getDate(), T.getMonth() + 1, T.getFullYear());
					}
				}
				_this._FromDateValue = _this.pFromDate.value;
			};

			// Time
			this.pFromTime.parentNode.onclick = this.pFromTime.onclick = window['bxShowClock_' + 'feed_cal_event_from_time' + _this.id];
			this.pToTime.parentNode.onclick = this.pToTime.onclick = window['bxShowClock_' + 'feed_cal_event_to_time' + _this.id];

			this.pFromTime.onchange = function()
			{
				if (_this.pToTime.value == "")
				{
					if(BX.util.trim(_this.pFromDate.value) == BX.util.trim(_this.pToDate.value) && BX.util.trim(_this.pToDate.value) != '')
					{
						var fromTime = _this.oEC.ParseTime(this.value);
						if (fromTime.h >= 23)
						{
							_this.pToTime.value = _this.oEC.FormatTimeByNum(0, fromTime.m);
							var date = BX.parseDate(_this.pFromDate.value);
							if (date)
							{
								date.setDate(date.getDate() + 1);
								_this.pToDate.value = bxFormatDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
							}
						}
						else
						{
							_this.pToTime.value = _this.oEC.FormatTimeByNum(parseInt(fromTime.h, 10) + 1, fromTime.m);
						}
					}
					else
					{
						_this.pToTime.value = _this.pFromTime.value;
					}
				}
				else if (_this.pToDate.value == '' || _this.pToDate.value == _this.pFromDate.value)
				{
					if (_this.pToDate.value == '')
						_this.pToDate.value = _this.pFromDate.value;

					// 1. We need prev. duration
					if(_this._FromTimeValue)
					{
						var
							F = BX.parseDate(_this.pFromDate.value),
							T = BX.parseDate(_this.pToDate.value),
							prevFromTime = _this.oEC.ParseTime(_this._FromTimeValue),
							fromTime = _this.oEC.ParseTime(_this.pFromTime.value),
							toTime = _this.oEC.ParseTime(_this.pToTime.value);

						F.setHours(prevFromTime.h);
						F.setMinutes(prevFromTime.m);
						T.setHours(toTime.h);
						T.setMinutes(toTime.m);

						var duration = T.getTime() - F.getTime();
						if (duration != 0)
						{
							F.setHours(fromTime.h);
							F.setMinutes(fromTime.m);

							T = new Date(F.getTime() + duration);
							_this.pToDate.value = bxFormatDate(T.getDate(), T.getMonth() + 1, T.getFullYear());
							_this.pToTime.value = _this.oEC.FormatTimeByNum(T.getHours(), T.getMinutes());
						}
					}
				}

				_this._FromTimeValue = _this.pFromTime.value;
			};

			// Set values
			var fd, td;
			if (this.oEvent.DT_FROM_TS || this.oEvent.DT_TO_TS)
			{
				if (!this.oEC.Event.IsRecursive(this.oEvent))
				{
					fd = bxGetDateFromTS(this.oEvent.DT_FROM_TS);
					td = bxGetDateFromTS(this.oEvent.DT_TO_TS);
				}
				else
				{
					fd = bxGetDateFromTS(this.oEvent['~DT_FROM_TS']),
					td = bxGetDateFromTS(this.oEvent['~DT_TO_TS']);
				}
			}
			else
			{
				fd = this.oEC.GetUsableDateTime(new Date().getTime());
				td = this.oEC.GetUsableDateTime(new Date().getTime() + 3600000 /* one hour*/);
			}

			if (fd)
			{
				this._FromDateValue = this.pFromDate.value = bxFormatDate(fd.date, fd.month, fd.year);
				this._FromTimeValue = this.pFromTime.value = fd.bTime ? this.oEC.FormatTimeByNum(fd.hour, fd.min) : '';
			}
			else
			{
				this._FromDateValue = this._FromTimeValue = this.pFromDate.value = this.pFromTime.value = '';
			}

			if (td)
			{
				this.pToDate.value = bxFormatDate(td.date, td.month, td.year);
				this.pToTime.value = td.bTime ? this.oEC.FormatTimeByNum(td.hour, td.min) : '';
			}
			else
			{
				this.pToDate.value = this.pToTime.value = '';
			}

			if (this.oEvent.ID)
			{
				// Reminder
				this.pFullDay.checked = this.bFullDay = this.oEvent.DT_SKIP_TIME == 'Y';
				this.pFullDay.onclick();

				if(this.oEvent.REMIND && this.oEvent.REMIND.length > 0)
				{
					// Default value
					this.pReminder.checked = true;
					this.pRemType.value = this.oEvent.REMIND[0].type;
					this.pRemCount.value = this.oEvent.REMIND[0].count;
					this.Reminder(false, true);
				}
				else
				{
					// Default value
					this.pReminder.checked = false;
					this.pRemType.value = 'min';
					this.pRemCount.value = '15';
					this.Reminder(false, false);
				}
			}
			else
			{
				// Default value
				this.pFullDay.checked = false;
				this.FullDay(false, true);

				// Default value
				this.pReminder.checked = true;
				this.pRemType.value = 'min';
				this.pRemCount.value = '15';
				this.Reminder(false, true);
			}
		},

		FillFormFields: function()
		{
			var _this = this;
			this.pName = BX(this.id + '_edit_ed_name');
			this.pName.value = this.oEvent.NAME || '';
			this.Title = this.config.Title;

			this.pName.onkeydown = this.pName.onchange = function()
			{
				if (this._titleTimeout)
					clearTimeout(this._titleTimeout);

				this._titleTimeout = setTimeout(
					function(){
						var
							val = BX.util.htmlspecialchars(_this.pName.value);
						_this.Title.innerHTML = (_this.oEvent.ID ? EC_MESS.EditEvent : EC_MESS.NewEvent) + (val != '' ? ': ' + val : '');
					}, 20
				);
			};

			// Location
			this.Location = new BXInputPopup({
				id: this.id + 'loc_1',
				values: this.oEC.bUseMR ? this.oEC.meetingRooms : false,
				input: BX(this.id + '_planner_location1'),
				defaultValue: EC_MESS.SelectMR,
				openTitle: EC_MESS.OpenMRPage,
				className: 'calendar-inp calendar-inp-time',
				noMRclassName: 'calendar-inp calendar-inp-time'
			});
			this.Loc = {};
			BX.addCustomEvent(this.Location, 'onInputPopupChanged', BX.proxy(this.LocationOnChange, this));

			if (this.oEvent.ID)
			{
				var loc = BX.util.htmlspecialcharsback(this.oEvent.LOCATION);
				this.Loc.OLD = loc;
				this.Loc.NEW = loc;
				var arLoc = this.oEC.ParseLocation(loc, true);
				if (arLoc.mrid && arLoc.mrevid)
				{
					this.Location.Set(arLoc.mrind, '');
					this.Loc.OLD_mrid = arLoc.mrid;
					this.Loc.OLD_mrevid = arLoc.mrevid;
				}
				else
				{
					this.Location.Set(false, loc);
				}
			}
			else
			{
				this.Location.Set(false, '');
			}

			// Accessibility
			this.pAccessibility = BX(this.id + '_bxec_accessibility');
			if (this.pAccessibility)
				this.pAccessibility.value = this.oEvent.ACCESSIBILITY || 'busy';
			// Private
			this.pPrivate = BX(this.id + '_bxec_private');
			if (this.pPrivate)
				this.pPrivate.checked = this.oEvent.PRIVATE_EVENT || false;
			// Importance
			this.pImportance = BX(this.id + '_bxec_importance');
			if (this.pImportance)
				this.pImportance.value = this.oEvent.IMPORTANCE || 'normal';

			// Sections
			this.pSectSelect = BX(this.id + '_edit_ed_calend_sel');
			var sectId = this.oEvent.SECT_ID || this.oEC.GetLastSection();

			this.oEC.BuildSectionSelect(this.pSectSelect, sectId);
			this.pSectSelect.onchange = function()
			{
				var sectId = this.value;
				if (_this.oEC.oSections[sectId])
				{
					_this.oEC.SaveLastSection(sectId);
					//D.CAL.DOM.Warn.style.display = _this.oActiveSections[sectId] ? 'none' : 'block';
					_this.ColorControl.Set(_this.oEC.oSections[sectId].COLOR, _this.oEC.oSections[sectId].TEXT_COLOR);
				}
			};

			// Repeat
			this.RepeatCheck = BX(this.id + '_edit_ed_rep_check');
			this.RepeatSelect = BX(this.id + '_edit_ed_rep_sel');
			this.RepeatCont = BX(this.id + '_edit_ed_rep_cont');

			this.RepeatPhrase1 = BX(this.id + '_edit_ed_rep_phrase1');
			this.RepeatPhrase2 = BX(this.id + '_edit_ed_rep_phrase2');
			this.RepeatWeekDays = BX(this.id + '_edit_ed_rep_week_days');
			this.RepeatCount = BX(this.id + '_edit_ed_rep_count');
			this.RepeatDiapTo = BX(this.id + 'edit-ev-rep-diap-to');

			this.RepeatSelect.onchange = function() {_this.RepeatSelectOnChange(this.value);};
			this.RepeatCount.onmousedown = function() {_this.bEditEventDialogOver = true;};

			this.RepeatCheck.onclick = function()
			{
				if (this.checked)
					BX.addClass(_this.RepeatCont, 'bxec-popup-row-repeat-show');
				else
					BX.removeClass(_this.RepeatCont, 'bxec-popup-row-repeat-show');
			};

			this.RepeatDiapTo.onblur = this.RepeatDiapTo.onchange = function()
			{
				if (this.value && this.value != EC_MESS.NoLimits)
				{
					this.style.color = '#000000';
					return;
				}
				this.value = EC_MESS.NoLimits;
				this.style.color = '#C0C0C0';
			};

			this.RepeatDiapTo.onclick = function(){BX.calendar({node: this, field: this, bTime: false});BX.focus(this);};
			this.RepeatDiapTo.onfocus = function()
			{
				if (!this.value || this.value == EC_MESS.NoLimits)
					this.value = '';
				this.style.color = '#000000';
			};

			// Set recurtion rules "RRULE"
			if (this.oEC.Event.IsRecursive(this.oEvent))
			{
				this.RepeatCheck.checked = true;
				this.RepeatSelect.value = this.oEvent.RRULE.FREQ;

			}
			else
			{
				this.RepeatCheck.checked = false;
			}
			this.RepeatCheck.onclick();
			this.RepeatSelect.onchange();

			// Color
			this.ColorControl = this.oEC.InitColorDialogControl('event', function(color, textColor)
			{
				_this.Color = color;
				_this.TextColor = textColor;
			});

			if (!this.oEvent.displayColor && this.oEC.oSections[sectId])
				this.oEvent.displayColor = this.oEC.oSections[sectId].COLOR;
			if (!this.oEvent.displayTextColor && this.oEC.oSections[sectId])
				this.oEvent.displayTextColor = this.oEC.oSections[sectId].TEXT_COLOR;
			if (this.oEvent.displayColor)
				this.ColorControl.Set(this.oEvent.displayColor, this.oEvent.displayTextColor);
			else if(this.oEC.oSections[sectId])
				this.ColorControl.Set(this.oEC.oSections[sectId].COLOR, this.oEC.oSections[sectId].TEXT_COLOR);
		},

		LocationOnChange: function(oLoc, ind, value)
		{
			var D = this.oEditEventDialog;
			if (ind === false)
			{
				this.Loc.NEW = value || '';
			}
			else
			{
				// Same meeting room
				//if (ind != this.Loc.OLD_mrid)
				//	this.Loc.CHANGED = true;
				this.Loc.NEW = 'ECMR_' + this.oEC.meetingRooms[ind].ID;
			}
		},

		RepeatSelectOnChange: function(val)
		{
			var
				D = this.oEditEventDialog,
				i, l, BYDAY, date;

			val = val.toUpperCase();

			if (val == 'NONE')
			{
				//this.RepeatSect.style.display =  'none';
			}
			else
			{
				//this.RepeatSect.style.display =  'block';
				this.RepeatPhrase2.innerHTML = EC_MESS.DeDot; // Works only for de lang

				if (val == 'WEEKLY')
				{
					this.RepeatPhrase1.innerHTML = EC_MESS.EveryF;
					this.RepeatPhrase2.innerHTML += EC_MESS.WeekP;
					this.RepeatWeekDays.style.display = (val == 'WEEKLY') ? 'inline-block' : 'none';
					BYDAY = {};

					if (!this.RepeatWeekDaysCh)
					{
						this.RepeatWeekDaysCh = [];
						for (i = 0; i < 7; i++)
							this.RepeatWeekDaysCh[i] = BX(this.id + 'bxec_week_day_' + i);
					}

					if (this.oEvent && this.oEvent.ID && this.oEvent.RRULE && this.oEvent.RRULE.BYDAY)
					{
						BYDAY = this.oEvent.RRULE.BYDAY;
					}
					else
					{
						var date = BX.parseDate(this.pFromDate.value);
						if (!date)
							date = bxGetDateFromTS(this.oEvent.DT_FROM_TS);

						if(date)
							BYDAY[this.oEC.GetWeekDayByInd(date.getDay())] = true;
					}

					for (i = 0; i < 7; i++)
						this.RepeatWeekDaysCh[i].checked = !!BYDAY[this.RepeatWeekDaysCh[i].value];
				}
				else
				{
					if (val == 'YEARLY')
						this.RepeatPhrase1.innerHTML = EC_MESS.EveryN;
					else
						this.RepeatPhrase1.innerHTML = EC_MESS.EveryM;

					if (val == 'DAILY')
						this.RepeatPhrase2.innerHTML += EC_MESS.DayP;
					else if (val == 'MONTHLY')
						this.RepeatPhrase2.innerHTML += EC_MESS.MonthP;
					else if (val == 'YEARLY')
						this.RepeatPhrase2.innerHTML += EC_MESS.YearP;

					this.RepeatWeekDays.style.display = 'none';
				}

				var bPer = this.oEvent && this.oEC.Event.IsRecursive(this.oEvent);
				this.RepeatCount.value = (!this.oEvent.ID || !bPer) ? 1 : this.oEvent.RRULE.INTERVAL;

				if (!this.oEvent.ID || !bPer)
				{
					this.RepeatDiapTo.value = '';
				}
				else
				{
					if (this.oEvent.RRULE.UNTIL)
					{
						var d = bxGetDateFromTS(this.oEvent.RRULE.UNTIL);
						if (d.date == 1 && d.month == 1 && d.year == 2038)
							this.RepeatDiapTo.value = '';
						else
							this.RepeatDiapTo.value = bxFormatDate(d.date, d.month, d.year);
					}
					else
					{
						this.RepeatDiapTo.value = '';
					}

				}
				this.RepeatDiapTo.onchange();
			}
		},

		GetLHE: function()
		{
			if (!this.oLHE)
				this.oLHE = window[this.config.LHEJsObjName];
			return this.oLHE;
		},

		FullDay: function(bSaveOption, value)
		{
			if (value == undefined)
				value = !this.bFullDay;

			if (value)
				BX.removeClass(this.pFromToCont, 'feed-cal-full-day');
			else
				BX.addClass(this.pFromToCont, 'feed-cal-full-day');
			this.bFullDay = value;
		},

		Reminder: function(bSaveOption, value)
		{
			if (value == undefined)
				value = !this.bReminder;

			this.pReminderCont.className = value ? 'bxec-reminder' : 'bxec-reminder-collapsed';

			this.bReminder = value;
		},

		InsertFileButton: function()
		{
			this.InitWDFileController();
		},

		__MoveButton: function(oldButId, newCont, oEditor)
		{
			if (!oEditor)
				oEditor = this.GetLHE();

			var el = BX.findChild(oEditor.pButtonsCont, {'attr': {'id': oldButId}}, true, false);
			if (el)
			{
				BX.remove(BX.findParent(el), true);
				BX(newCont).appendChild(el);
				el.style.backgroundImage = 'url(/bitrix/images/1.gif)';
				el.src = '/bitrix/images/1.gif';
				el.style.width = '25px';
				el.style.height = '25px';
				el.onmouseout = '';
				el.onmouseover = '';
				el.className = '';
			}
		},

		InitWDFileController: function()
		{
			this.WDControllerNode = BX.findParent(BX.findChild(BX('bxed_file_cont_' + this.id), {className: 'wduf-selectdialog'}, true, false));

			BX.addCustomEvent(this.WDControllerNode, 'WDLoadFormControllerInit', BX.proxy(this._OnWDFormInit, this));
			BX.addCustomEvent('WDSelectFileDialogLoaded', BX.proxy(this._OnWDFormInit, this));
			BX.onCustomEvent(this.WDControllerNode, "WDLoadFormController");
			//BX.onCustomEvent(this.WDControllerNode, "WDLoadFormController", ['hide']);

			this._AddWDFileControllerHandlers();
		},

		_AddWDFileControllerHandlers: function()
		{
			BX.addCustomEvent(
				this.WDControllerNode,
				'OnFileUploadSuccess',
				BX.proxy(
					function(result, obj)
					{
						if (!!this.WDController && obj.id == this.WDController.id)
						{
							__WdUfCalendarGetinfofromnode(result, obj);
							this.OnFileUploadSuccess(result, obj);
						}
					},
					this
				)
			);
			BX.addCustomEvent(
				this.WDControllerNode,
				'OnFileUploadRemove',
				BX.proxy(
					function(result, obj){
						if (!!this.WDController && obj.id == this.WDController.id) {
							this.OnFileUploadRemove(result, obj, 'webdav');
						}
					},
					this
				)
			);
		},

		_OnWDFormInit: function(obj)
		{
			var WDControllerCID = this.config.WDControllerCID;
			if (!this.WDController &&
				(
					(WDControllerCID && obj.CID == WDControllerCID)
						||
						(!WDControllerCID && obj.dialogName == 'AttachFileDialog'))
				)
			{
				this.WDController = obj;
				this.OnWDSelectFileDialogLoaded(obj);

				if (this.bRunOnLightEditorShow)
				{
					this.bRunOnLightEditorShow = false;
					this.OnLightEditorShow(this.oEvent.DESCRIPTION || '', false, this.config.arFiles || []);
				}
			}
		},

		OnFileUploadSuccess : function(result, obj)
		{
			var oEditor = this.GetLHE();
			oEditor.SaveContent();
			//BX('calendar_upload_cid' + this.id).value = obj.CID;

			this.arFiles.push(result.element_id);
			this.parser['postimage']['exist'] = (this.parser['postimage']['exist'] === null ?
				!!oEditor['oSpecialParsers']['postimage'] : this.parser['postimage']['exist']);
			this.parser['postfile']['exist'] = (this.parser['postfile']['exist'] === null ?
				!!oEditor['oSpecialParsers']['postfile'] : this.parser['postfile']['exist']);
			this.parser['postdocument']['exist'] = (this.parser['postdocument']['exist'] === null ?
				!!oEditor['oSpecialParsers']['postdocument'] : this.parser['postdocument']['exist']);

			result["isImage"] = (result.element_content_type && result.element_content_type.substr(0,6) == 'image/');

			var id = this.CheckFile(result.element_id, result, true);
			if (!!id)
			{
				var f = this.BindToFile(id);
				this.CheckFileInText(this.CheckFile(id));
				if ((!!oEditor.insertImageAfterUpload && f.isImage) || !!oEditor.insertFileAfterUpload)
					this.InsertFile(id);
			}
		},

		OnFileUploadRemove : function(result, obj, storage)
		{
			if (BX.findChild(BX(this.formID), {'attr': {id: 'wd-doc'+result}}, true, false))
				this.deleteFile(result, null, null, storage);
		},

		OnWDSelectFileDialogLoaded : function(wdFD)
		{
			if (!(typeof wdFD == "object" && !!wdFD && !!wdFD.values && !!wdFD.urlGet))
				return false;
			var needToReparse = false, id = 0, data = {}, node = null, arID = {}, preview = null, did = null;

			for (var ii = 0; ii < wdFD.values.length; ii++)
			{
				id = parseInt(wdFD.values[ii].getAttribute("id").replace("wd-doc", ""));
				if (!!arID['id' + id] )
					continue;
				arID['id' + id] = "Y";
				if (id > 0)
				{
					node = BX.findChild(wdFD.values[ii], {'className': 'f-wrap'}, true, false);
					if(!node)
						continue;
					data = {
						'element_id' : id,
						'element_name' : node.innerHTML,
						'parser' : 'postdocument',
						'storage' : 'webdav'
					};
					__WdUfCalendarGetinfofromnode(data, wdFD);
					did = this.CheckFile(id, data);
					if (did)
					{
						this.bindToFile(did);
						needToReparse = (needToReparse === false ? [] : needToReparse);
						needToReparse.push(id);
						wdFD.values[ii].setAttribute("mpfId", did);
						BX.addCustomEvent(
							wdFD.values[ii],
							'OnMkClose',
							BX.proxy(
								function()
								{
									this.CheckFileInText(
										this.CheckFile(BX.proxy_context.getAttribute("mpfId")),
										null,
										arguments[0]
									);
								},
								this
							)
						);
					}
				}
			}

			if (needToReparse !== false)
			{
				var content, oEditor = this.GetLHE();
				if (oEditor && this.parser.postdocument.exist)
				{
					oEditor.SaveContent();
					content = oEditor.GetContent();

					content = content.replace(new RegExp('\\&\\#91\\;DOCUMENT ID=(' + needToReparse.join("|") + ')([WIDTHHEIGHT=0-9 ]*)\\&\\#93\\;','gim'), '[DOCUMENT ID=$1$2]');

					oEditor.SetContent(content);
					oEditor.SetEditorContent(oEditor.content);
					oEditor.SetFocus();
					oEditor.AutoResize();
				}
			}
		},


		BindToFile : function(id)
		{
			var f = this.CheckFile(id);
			if (!!f)
			{
				var intId = (typeof f.id == "string" ? parseInt(f.id.replace(this.sNewFilePostfix, "")) : f.id);
				if (f.isImage && f.storage == 'bfile')
				{

					var
						img = BX.findChild(BX('wd-doc'+intId), {'tagName': 'img'}, true, false),
						img_wrap = BX.findChild(BX('wd-doc'+intId), {'className': 'feed-add-img-wrap'}, true, false),
						img_title = BX.findChild(BX('wd-doc'+intId), {'className': 'feed-add-img-title'}, true, false);

					BX.bind(img_wrap, "click", BX.delegate(function(){this.InsertFile(id);}, this));
					BX.bind(img_title, "click", BX.delegate(function(){this.InsertFile(id);}, this));

					img_wrap.style.cursor = img_title.style.cursor = "pointer";
					img_wrap.title = img_title.title = BX.message('EC_MPF_IMAGE');
				}
				else
				{
					var
						name_wrap = BX.findChild(BX('wd-doc'+intId), {'className': 'f-wrap'}, true, false),
						img_wrap = BX.findChild(BX('wd-doc'+intId), {'className': 'files-preview'}, true, false);
					if(!name_wrap)
						return false;
					BX.bind(name_wrap, "click", BX.delegate(function(){this.InsertFile(id);}, this));

					name_wrap.style.cursor = "pointer";
					name_wrap.title = BX.message('EC_MPF_FILE');
					if (!!img_wrap)
						BX.bind(img_wrap, "click", BX.delegate(function(){this.InsertFile(id);}, this));
				}
			}
			return f;
		},

		StartMonitoring : function(start)
		{
			start = (start === false ? false : start === true ? true : "Y");
			if (start)
			{
				if (start === true || !this.startMonitoringStatus)
				{
					if (this.startMonitoringStatus)
						clearTimeout(this.startMonitoringStatus);
					this.startMonitoringStatus = setTimeout(BX.delegate(function() {this.CheckFilesInText();}, this), 1000);
				}
			}
			else if (this.startMonitoringStatus)
			{
				clearTimeout(this.startMonitoringStatus);
				this.startMonitoringStatus = null;
			}
		},

		CheckFilesInText: function()
		{
			var result = false;
			for (var id in this.arFiles)
			{
				if (this.CheckFileInText(this.arFiles[id]))
					result = true;
			}
			this.StartMonitoring(result);
		},

		CheckFileInText : function(file, reallyInText, parent)
		{
			if (!file)
				return null;
			parent = BX.findChild((!!parent ? parent : BX('wd-doc'+file["id"])), {'className': 'files-info'}, true, false);

			var oEditor = this.GetLHE();
			if (reallyInText !== true)
			{
				if (oEditor.sEditorMode == "code")
				{
//					var
//						text = oEditor.GetCodeEditorContent(),
//						text1 = text.replace(
//							this.parser[file["parser"]]["regexp"],
//							function(str, id, width, height)
//							{
//								if (file["id"] == id)
//									str = str.replace(id, "__" + id + "__");
//								return str;
//							}
//						);
//					reallyInText = (text != text1);
				}
				else if (oEditor.bxTags)
				{
					for (var ii in oEditor.bxTags)
					{
						if (!!oEditor.bxTags[ii] &&
							oEditor.bxTags[ii]["tag"] == file["parser"] &&
							oEditor.bxTags[ii]["params"]["value"] == file["id"])
						{
							if (oEditor.pEditorDocument.getElementById(oEditor.bxTags[ii]["id"]))
							{
								reallyInText = true;
								break;
							}
							else
							{
								oEditor.bxTags[ii] = null;
							}
						}
					}
				}
			}

			reallyInText = (reallyInText === true || reallyInText === false ? reallyInText : false);
			if (BX.type.isDomNode(parent))
			{
				var insertBtn = BX.findChild(parent, {'className': 'insert-btn'}, true, false),
					insertText = BX.findChild(parent, {'className': 'insert-text'}, true, false);
				if (reallyInText)
				{
					parent.setAttribute("tagInText", true);
					if (!insertText)
					{
						parent.appendChild(
							BX.create('SPAN', {
									'props' : {
										'className' : 'insert-text'
									},
									'html' : BX.message("EC_MPF_FILE_IN_TEXT")
								}
							)
						);
					}
					if (!!insertBtn)
						insertBtn.parentNode.removeChild(insertBtn);
				}
				else
				{
					parent.setAttribute("tagInText", false);
					if (!insertBtn)
					{
						parent.appendChild(
							BX.create('SPAN', {
									'props' : {
										'className' : 'insert-btn'
									},
									'html' : BX.message("EC_MPF_FILE_INSERT_IN_TEXT"),
									'events' : {
										'click' : BX.delegate(function(){this.InsertFile(file["~id"]);}, this)
									}
								}
							)
						);
					}
					if (!!insertText)
						insertText.parentNode.removeChild(insertText);
				}
			}
			if (reallyInText)
				this.StartMonitoring();
			return reallyInText;
		},

		CheckFile : function(id, result, isNew)
		{
			isNew = (!!isNew);
			if (typeof result == "object" && result != null)
			{
				bNew = true;
				id = parseInt(id);

				if (!result.element_content_type && !!result.element_name)
					result.element_content_type = (/(\.png|\.jpg|\.jpeg|\.gif|\.bmp)$/i.test(result.element_name) ? 'image/xyz' : 'isnotimage/xyz');

				if (isNew == true && (result.storage == 'bfile' || !result.storage))
					id = id + this.sNewFilePostfix;

				result.isImage = (!!result.isImage ? result.isImage : (result.element_content_type ? (result.element_content_type.indexOf('image') == 0) : false));

				if (result.isImage && result.storage == 'webdav' && !!this.arSize && !!result.element_url)
				{
					result.element_thumbnail = result.element_url + (result.element_url.indexOf("?") < 0 ? "?" : "&") +
						"width=" + this.arSize.width + "&height=" + this.arSize.height;
				}

				if (!result.element_thumbnail && !result.element_url && !!result.src)
					result.element_thumbnail = result.src;
				if (!result.element_image && !!result.thumbnail)
					result.element_image = result.thumbnail;

				var res = {
					id : id,
					name : (!!result.element_name ? result.element_name : 'noname'),
					size: result.element_size,
					url: result.element_url,
					parser: (!!result['parser'] ? result['parser'] : false),
					type: result.element_content_type,
					src: (!!result.element_thumbnail ? result.element_thumbnail : result.element_url),
					lowsrc: (!!result.lowsrc ? result.lowsrc : ''),
					thumbnail: result.element_image,
					isImage: result.isImage,
					storage: result.storage
				};

				if (res.isImage && parseInt(result.width) > 0 && parseInt(result.height) > 0)
				{
					res.width = parseInt(result.width);
					res.height = parseInt(result.height);
					if (!!this.arSize) {
						var
							width = res.width, height = res.height,
							ResizeCoeff = {
								width : (this.arSize["width"] > 0 ? this.arSize["width"] / width : 1),
								height : (this.arSize["height"] > 0 ? this.arSize["height"] / height : 1)
							},
							iResizeCoeff = Math.min(ResizeCoeff["width"], ResizeCoeff["height"]);

						iResizeCoeff = ((0 < iResizeCoeff) && (iResizeCoeff < 1) ? iResizeCoeff : 1);
						res.width = Math.max(1, parseInt(iResizeCoeff * res.width));
						res.height = Math.max(1, parseInt(iResizeCoeff * res.height));
					}
				}

				if (res['isImage'] && !res['src'])
				{
					res = false;
				}
				else if (!res['parser'] && res.storage == 'webdav' && this.parser['postdocument']['exist'])
				{
					res['parser'] = 'postdocument';
				}

				if (!!res && !!res["parser"])
				{
					if (res.storage == 'bfile')
					{
						this.arFiles['' + id] = res;
						this.arFiles['' + id]["~id"] = '' + id;
					}

					this.arFiles[res['parser'] + id] = res;
					this.arFiles[res['parser'] + id]["~id"] = res['parser'] + id;
					return (res['parser'] + id);
				}
			}

			return (typeof this.arFiles[id] == "object" && this.arFiles[id] != null ? this.arFiles[id] : false);
		},

		InsertFile : function(id, width)
		{
			var file = this.CheckFile(id);
			var oEditor = this.GetLHE();
			if (!oEditor || !file)
				return false;

			var
				fileID = file['id'],
				params = '',
				pattern = this.parser[file['parser']][oEditor.sEditorMode == 'html' ? "html" : "code"];

			if (file['isImage'])
			{
				pattern = (oEditor.sEditorMode == "html" ? this.parser["postimage"]["html"] : pattern);
				if (file.width > 0 && file.height > 0 && oEditor.sEditorMode == "html" )
					params = ' style="width:' + file.width + 'px;height:' + file.height + 'px;" onload="this.style=\' \'"';
			}

			if (oEditor.sEditorMode == 'code' && oEditor.bBBCode) // BB Codes
			{
				oEditor.WrapWith(" ", "", pattern.replace("\#ID\#", fileID).replace("\#ADDITIONAL\#", ""));
			}
			else if(oEditor.sEditorMode == 'html') // WYSIWYG
			{
				oEditor.InsertHTML(' ' + pattern.
					replace("\#ID\#", oEditor.SetBxTag(false, {'tag': file.parser, params: {'value' : fileID}})).
					replace("\#SRC\#", file.src).replace("\#URL\#", file.url).
					replace("\#LOWSRC\#", (!!file.lowsrc ? file.lowsrc : '')).
					replace("\#NAME\#", file.name).replace("\#ADDITIONAL\#", params)
				);
				setTimeout(BX.delegate(oEditor.AutoResize, oEditor), 500);
			}
			this.CheckFileInText(file, true);
		},

		DeleteFile: function(id, url, el, storage)
		{
			var oEditor = this.GetLHE();

			id  = id + '';
			storage = (storage != 'webdav' && storage != 'bfile' ? 'bfile' : storage);
			if (typeof url == "string")
			{
				BX.remove(el.parentNode);
				BX.ajax.get(url, function(data){});
			}
			oEditor.SaveContent();
			var content = oEditor.GetContent();

			if (storage == 'bfile')
			{
				content = content.
					replace(new RegExp('\\[IMG ID='+ id +'\\]','g'), '').
					replace(new RegExp('\\[FILE ID='+ id +'\\]','g'), '').
					replace(new RegExp('\\[IMG ID='+ id + this.sNewFilePostfix +'\\]','g'), '').
					replace(new RegExp('\\[FILE ID='+ id + this.sNewFilePostfix +'\\]','g'), '');
			}
			else
			{
				content = content.replace(new RegExp('\\[DOCUMENT ID='+ id +'\\]','g'), '');
			}

			oEditor.SetContent(content);
			oEditor.SetEditorContent(oEditor.content);
			oEditor.SetFocus();
			oEditor.AutoResize();
			this.arFiles[id] = false;
		},

		Parse : function(sName, sContent, pLEditor, parser)
		{
			this.parser[parser]['exist'] = true;
			var
				arParser = this.parser[parser],
				obj = this;

			if (!!arParser)
			{
				sContent = sContent.replace(
					arParser['regexp'],
					function(str, id, width, height)
					{
						var res = "", strAdditional = "",
							file = obj.CheckFile(arParser["tag"] + id),
							template = (file.isImage ? obj['parser']['postimage']['html'] : arParser.html);
						if (!!file)
						{
							if (file.isImage)
							{
								width = parseInt(width); height = parseInt(height);
								strAdditional = ((width && height && pLEditor.bBBParseImageSize) ?
									(" width=\"" + width + "\" height=\"" + height + "\"") : "");
								if (strAdditional == "" && file["width"] > 0 && file["height"] > 0)
									strAdditional = ' style="width:' + file["width"] + 'px;height:' + file["height"] + 'px;" onload="this.style=\' \'"';
							}

							return template.
								replace("\#ID\#", pLEditor.SetBxTag(false, {tag: arParser["tag"], params: {value : id}})).
								replace("\#NAME\#", file['name']).
								replace("\#SRC\#", file['src']).
								replace("\#ADDITIONAL\#", strAdditional).
								replace("\#WIDTH\#", parseInt(width)).
								replace("\#HEIGHT\#", parseInt(height));
						}
						return str;
					}
				)
			}
			return sContent;
		},

		Unparse: function(bxTag, pNode, pLEditor, parser)
		{
			this.parser[parser]['exist'] = true;
			if (bxTag.tag == parser)
			{
				var

					res = "",
					width = parseInt(pNode.arAttributes['width']),
					height = parseInt(pNode.arAttributes['height']),
					strSize = "";

				if (width && height  && pLEditor.bBBParseImageSize)
					strSize = ' WIDTH=' + width + ' HEIGHT=' + height;

				res = this.parser[parser]["code"].
					replace("\#ID\#", bxTag.params.value).
					replace("\#ADDITIONAL\#", strSize).
					replace("\#WIDTH\#", width).
					replace("\#HEIGHT\#", height);
			}
			return res;
		},

		OnEditorInit: function(pEditor)
		{
			var _this = this;
			pEditor.AddParser(
				{
					name: 'postdocument',
					obj: {
						Parse: function(sName, sContent, pLEditor)
						{
							return _this.Parse(sName, sContent, pLEditor, "postdocument");
						},
						UnParse: function(bxTag, pNode, pLEditor)
						{
							return _this.Unparse(bxTag, pNode, pLEditor, "postdocument");
						}
					}
				}
			);

			this.OnLightEditorShow(this.oEvent.DESCRIPTION || '', false, this.config.arFiles || [], pEditor);
		},

		OnLightEditorShow: function(content, arFiles, arDocs, pEditor)
		{
			if (this.oEvent.ID)
			{
				if (!this.WDController && top['wdFD' + this.WDControllerCID])
				{
					this.WDController = top['wdFD' + this.WDControllerCID];
					if (!this.WDControllerNode)
						this.WDControllerNode = BX.findParent(BX.findChild(BX('bxed_file_cont_' + this.id), {className: 'wduf-selectdialog'}, true, false));
					this._AddWDFileControllerHandlers();
				}

				if (!this.WDController)
				{
					this.bRunOnLightEditorShow = true;
					this.InitWDFileController();
					return;
				}

				var
					res, node, tmp, arRes = [], node1;

				if (!!arDocs && typeof arDocs == "object")
				{
					this.WDController.onLightEditorShowObj = [];

					while ((res = arDocs.pop()) && !!res)
					{
						node1 = BX('wd-doc' + res);
						node = (!!node1 ? (node1.tagName == "A" ? node1 : BX.findChild(node1, {'tagName' : "IMG"}, true)) : null);
						tmp = {
							'element_id' : res,
							'element_url' : '',
							'element_name' : '',
							'element_content_type' : (!!node && node.tagName == "IMG" ? 'image/xyz' : 'notimage/xyz'),
							'storage' : 'webdav'
						};
						if (!!node)
						{
							//tmp['element_url'] = (node.tagName == "A" ? node.href : node.src);
							tmp['element_url'] = node.getAttribute("data-bx-document");
							tmp['element_name'] = node.getAttribute("alt");
							tmp['width'] = node.getAttribute("data-bx-width");
							tmp['height'] = node.getAttribute("data-bx-height");
							this.CheckFile(res, tmp);
						}

						arRes.push(tmp);
						this.WDController.onLightEditorShowObj.push(res);
					}
				}

				if (arRes.length == 0 && this.WDControllerNode)
					BX.onCustomEvent(this.WDControllerNode, "WDLoadFormController", ['hide']);
			}

			var oEditor = this.GetLHE();
			oEditor.ReInit(content || '');
			oEditor.pFrame.style.height = oEditor.arConfig.height;
			oEditor.ResizeFrame();
			oEditor.AutoResize();

			this.__MoveButton('lhe_btn_createlink', BX('bx_cal_link_' + this.id), oEditor);
			this.__MoveButton('lhe_btn_inputvideo', BX('bx_cal_video_' + this.id), oEditor);

			//this.CheckFilesInText();
			BX.defer(oEditor.SetFocus, oEditor);
		},

		GetAttendees: function()
		{
			return [];
		}
	};

	window.ModifyEditorForCalendarGrid = function()
	{
		// Rename image button and change Icon
		LHEButtons['Image'].id = 'ImageLink';
		LHEButtons['Image'].src = '/bitrix/images/calendar/lhelink_image.gif';
		LHEButtons['Image'].name = BX.message('EC_MPF_IMAGE_LINK');

		LHEButtons['InputVideo'] = {
			id : 'InputVideo',
			src : '/bitrix/images/1.gif',
			name : BX.message('EC_FPF_VIDEO'),
			handler: function(pBut)
			{
				pBut.pLEditor.OpenDialog({id : 'InputVideo', obj: false});
			},
			OnBeforeCreate: function(pLEditor, pBut)
			{
				// Disable in non BBCode mode in html
				pBut.disableOnCodeView = !pLEditor.bBBCode || pLEditor.arConfig.bConvertContentFromBBCodes;
				return pBut;
			},
			parser: {
				name: 'postvideo',
				obj: {
					Parse: function(sName, sContent, pLEditor)
					{
						sContent = sContent.replace(/\[VIDEO\s*?width=(\d+)\s*?height=(\d+)\s*\]((?:\s|\S)*?)\[\/VIDEO\]/ig, function(str, w, h, src)
						{
							var
								w = parseInt(w) || 400,
								h = parseInt(h) || 300,
								src = BX.util.trim(src);

							return '<img id="' + pLEditor.SetBxTag(false, {tag: "postvideo", params: {value : src}}) +
								'" src="/bitrix/images/1.gif" class="bxed-video" width=' + w + ' height=' + h + ' title="' + BX.message.Video + ": " + src + '" />';
						});
						return sContent;
					},
					UnParse: function(bxTag, pNode, pLEditor)
					{
						if (bxTag.tag == 'postvideo')
						{
							return "[VIDEO WIDTH=" + pNode.arAttributes["width"] + " HEIGHT=" + pNode.arAttributes["height"] + "]" + bxTag.params.value + "[/VIDEO]";
						}
						return "";
					}
				}
			}
		};

		window.LHEDailogs['InputVideo'] = function(pObj)
		{
			var str = '<table width="100%"><tr>' +
				'<td class="lhe-dialog-label lhe-label-imp"><label for="' + pObj.pLEditor.id + 'lhed_post_video_path"><b>' + BX.message('EC_BPC_VIDEO_P') + ':</b></label></td>' +
				'<td class="lhe-dialog-param">' +
				'<input id="' + pObj.pLEditor.id + 'lhed_post_video_path" value="" size="30"/>' +
				'</td>' +
				'</tr><tr>' +
				'<td></td>' +
				'<td style="padding: 0!important; font-size: 11px!important;">' + BX.message('EC_BPC_VIDEO_PATH_EXAMPLE') + '</td>' +
				'</tr><tr>' +
				'<td class="lhe-dialog-label lhe-label-imp"><label for="' + pObj.pLEditor.id + 'lhed_post_video_width">' + BX.message('EC_MPF_VIDEO_SIZE') + ':</label></td>' +
				'<td class="lhe-dialog-param">' +
				'<input id="' + pObj.pLEditor.id + 'lhed_post_video_width" value="" size="4"/>' +
				' x ' +
				'<input id="' + pObj.pLEditor.id + 'lhed_post_video_height" value="" size="4" />' +
				'</td>' +
				'</tr></table>';

			return {
				title: BX.message('EC_FPF_VIDEO'),
				innerHTML : str,
				width: 480,
				OnLoad: function()
				{
					pObj.pPath = BX(pObj.pLEditor.id + "lhed_post_video_path");
					pObj.pWidth = BX(pObj.pLEditor.id + "lhed_post_video_width");
					pObj.pHeight = BX(pObj.pLEditor.id + "lhed_post_video_height");

					pObj.pLEditor.focus(pObj.pPath);
				},
				OnSave: function()
				{
					var
						src = BX.util.trim(pObj.pPath.value),
						w = parseInt(pObj.pWidth.value) || 400,
						h = parseInt(pObj.pHeight.value) || 300;

					if (src == "")
						return;

					if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode) // BB Codes
					{
						pObj.pLEditor.WrapWith("", "", "[VIDEO WIDTH=" + w + " HEIGHT=" + h + "]" + src + "[/VIDEO]");
					}
					else if(pObj.pLEditor.sEditorMode == 'html') // WYSIWYG
					{
						pObj.pLEditor.InsertHTML('<img id="' + pObj.pLEditor.SetBxTag(false, {tag: "postvideo", params: {value : src}}) + '" src="/bitrix/images/1.gif" class="bxed-video" width=' + w + ' height=' + h + ' title="' + BX.message.Video + ": " + src + '" />');
						pObj.pLEditor.AutoResize();
					}
				}
			};
		};
	};

	window.__WdUfCalendarGetinfofromnode = function(result, obj)
	{
		var preview = BX.findChild(BX('wd-doc' + result.element_id), {'className': 'files-preview', 'tagName' : 'IMG'}, true, false);
		if (!!preview)
		{
			result.lowsrc = preview.src;
			result.element_url = preview.src.replace(/\Wwidth\=(\d+)/, '').replace(/\Wheight\=(\d+)/, '');
			result.width = parseInt(preview.getAttribute("data-bx-full-width"));
			result.height = parseInt(preview.getAttribute("data-bx-full-height"));
		}
		else if (!!obj.urlGet)
		{
			result.element_url = obj.urlGet.
				replace("#element_id#", result.element_id).
				replace("#ELEMENT_ID#", result.element_id).
				replace("#element_name#", result.element_name).
				replace("#ELEMENT_NAME#", result.element_name);
		}
	}

	window.ECDragDropControl = function(Params)
	{
		this.oEC = Params.calendar;
		this.enabled = true;
	};

	window.ECDragDropControl.prototype = {
		Reset: function()
		{
			jsDD.Reset();
		},

		RegisterDay: function(dayCont)
		{
			if(!this.enabled)
				return;

			var _this = this;
			jsDD.registerDest(dayCont);

			dayCont.onbxdestdragfinish = function(currentNode, x, y)
			{
				if (_this.oDiv)
				{
					var
						eventInd = parseInt(_this.oDiv.getAttribute('data-bx-event-ind')),
						dayDate = new Date(_this.oEC.activeDateDaysAr[_this.oEC.GetDayIndexByElement(dayCont.parentNode)].getTime());

					if (!isNaN(eventInd) && _this.oEC.arEvents[eventInd])
						_this.MoveEventToNewDate(_this.oEC.arEvents[eventInd], dayDate, "day");

					BX.removeClass(dayCont, 'bxc-day-drag');
				}

				_this.OnDragFinish();

				return true;
			};
			dayCont.onbxdestdraghover = function(currentNode, x, y)
			{
				if (_this.oDiv)
					BX.addClass(dayCont, 'bxc-day-drag');
			};
			dayCont.onbxdestdraghout = function(currentNode, x, y)
			{
				if (_this.oDiv)
					BX.removeClass(dayCont, 'bxc-day-drag');
			};
		},

		RegisterTitleDay: function(dayCont1, dayCont2, tabId)
		{
			if(!this.enabled)
				return;

			var _this = this;
			jsDD.registerDest(dayCont1);
			jsDD.registerDest(dayCont2);

			dayCont1.onbxdestdragfinish = dayCont2.onbxdestdragfinish = function(currentNode, x, y)
			{
				if (_this.oDiv)
				{
					var
						eventInd = parseInt(_this.oDiv.getAttribute('data-bx-event-ind')),
						dayInd = parseInt(dayCont1.getAttribute('data-bx-day-ind')),
						day = _this.oEC.Tabs[tabId].arDays[dayInd],
						dayDate = new Date();
					dayDate.setFullYear(day.year, day.month, day.date);

					if (!isNaN(eventInd) && _this.oEC.arEvents[eventInd])
						_this.MoveEventToNewDate(_this.oEC.arEvents[eventInd], dayDate, "day");
				}

				BX.removeClass(dayCont1, 'bxc-day-drag');
				BX.removeClass(dayCont2, 'bxc-day-drag');

				_this.OnDragFinish();
				return true;
			};
			dayCont1.onbxdestdraghover = dayCont2.onbxdestdraghover = function(currentNode, x, y)
			{
				BX.addClass(dayCont1, 'bxc-day-drag');
				BX.addClass(dayCont2, 'bxc-day-drag');
			};
			dayCont1.onbxdestdraghout = dayCont2.onbxdestdraghout = function(currentNode, x, y)
			{
				BX.removeClass(dayCont1, 'bxc-day-drag');
				BX.removeClass(dayCont2, 'bxc-day-drag');
			};
		},

		RegisterTimeline: function(timelineCont, oTab)
		{
			if(!this.enabled)
				return;

			var _this = this;
			jsDD.registerDest(timelineCont);

			timelineCont.onbxdestdragfinish = function(currentNode, x, y)
			{
				if (_this.oDiv)
				{
					var eventInd = parseInt(_this.oDiv.getAttribute('data-bx-event-ind'));
					if (isNaN(eventInd) || !_this.oEC.arEvents[eventInd])
						return;
					var oEvent = _this.oEC.arEvents[eventInd];

					if (currentNode.getAttribute('data-bx-event-resizer') == 'Y')
					{
						// Delta height
						var
							originalHeight = parseInt(_this.oDiv.getAttribute('data-bx-original-height'), 10),
							deltaHeight = _this.oDiv.offsetHeight - originalHeight,
							dur = parseInt(((deltaHeight - 1) / 40) * 3600); // In seconds

						_this.ResizeEventTimeline(oEvent, dur);
					}
					else
					{
						var dayInd = _this.oDiv.getAttribute('data-bx-day-index');

						if (dayInd != undefined && oTab.arDays[dayInd])
						{
							var
								curDay = oTab.arDays[dayInd],
								eventY = parseInt(_this.oDiv.style.top, 10) - BX.pos(timelineCont).top + timelineCont.scrollTop,
								dtFrom = Math.max((eventY - 1) / 42 * 60, 0); // In seconds

							dtFrom = Math.round(dtFrom / 10) * 10; // Round to 10 minutes

							var
								hour = parseInt(dtFrom / 60, 10),
								min = Math.max(dtFrom - hour * 60, 0),
								dayDate = new Date();

							dayDate.setFullYear(curDay.year, curDay.month, curDay.date);
							dayDate.setHours(hour);
							dayDate.setMinutes(min);
							dayDate.setSeconds(0);

							if (_this.oDiv.getAttribute("data-bx-title-event"))
							{
								oEvent.DT_SKIP_TIME = 'N'; // It cames from title
								_this.MoveEventToNewDate(oEvent, dayDate, "timeline", 3600000);
							}
							else
								_this.MoveEventToNewDate(oEvent, dayDate, "timeline");
						}
					}
				}

				_this.OnDragFinish();
				return true;
			};

			timelineCont.onbxdestdraghover = function(currentNode, x, y)
			{
				_this.timeLineEventOver = true;
				_this.PrepareTimelineDaysPos(timelineCont, oTab);
				BX.addClass(timelineCont, 'bxec-timeline-div-drag');
			};

			timelineCont.onbxdestdraghout = function(currentNode, x, y)
			{
				_this.ClearTimeline(timelineCont);
			};
			timelineCont.onbxdestdragstop = function(currentNode, x, y)
			{
				_this.ClearTimeline(timelineCont);
			};
		},

		ClearTimeline: function(timelineCont)
		{
			this.timeLineEventOver = false;
			BX.removeClass(timelineCont, 'bxec-timeline-div-drag');
			jsDD.current_dest_index = false;
		},

		GetTimelinePos: function(obDest)
		{
			return obDest.__bxpos;
		},

		PrepareTimelineDaysPos: function(timelineCont, oTab)
		{
			this.timeLinePos = this.GetTimelinePos(timelineCont);

			var pTimelineRow = oTab.pTimelineTable.rows[0];

			var dayCell, i, dayPos;
			this.arDays = [];
			for (var i = 1; i < pTimelineRow.cells.length; i++)
			{
				dayCell = pTimelineRow.cells[i];
				dayPos = BX.pos(dayCell);
				dayPos._left = dayPos.left - this.timeLinePos[0];
				dayPos._right = dayPos.right - this.timeLinePos[0];
				this.arDays.push(dayPos);
			}

			if (!this.activeDayDrop)
			{
				this.activeDayDrop = BX.create("DIV", {props: {className: 'bxec-timeline-active-day-drag-selector'}});
				this.activeDayDrop.style.height = parseInt(oTab.pTimelineTable.offsetHeight, 10) + 'px';
			}
			if (this.activeDayDrop.parentNode != timelineCont)
				timelineCont.appendChild(this.activeDayDrop);

			if (!this.timelineDragOverlay)
			{
				this.timelineDragOverlay = BX.create("DIV", {props: {className: 'bxec-timeline-drag-overlay'}});
				this.timelineDragOverlay.style.height = parseInt(oTab.pTimelineTable.offsetHeight, 10) + 'px';
			}
			if (this.timelineDragOverlay.parentNode != timelineCont)
				timelineCont.appendChild(this.timelineDragOverlay);
		},

		CheckTimelineOverPos: function(x, y)
		{
			if (this.timeLineEventOver)
			{
				this.activeDayDrop.style.display = 'block';
				var i, l = this.arDays.length;

				for (i = 0; i < l; i++)
				{
					if (x >= this.arDays[i].left && x <= this.arDays[i].right)
					{
						this.activeDayDrop.style.left = (this.arDays[i]._left - 1) + 'px';
						this.activeDayDrop.style.width = (this.arDays[i].width -1) + 'px';

						this.oDiv.style.width = (this.arDays[i].width - 5) + 'px';
						this.oDiv.style.left = (this.arDays[i].left + 1) + 'px';
						this.oDiv.style.top = (y - 10) + 'px';

						this.oDiv.setAttribute('data-bx-day-index', i);
						break;
					}
				}
			}
			else
			{
				if (this.activeDayDrop)
					this.activeDayDrop.style.display = 'none';
			}
		},

		RegisterEvent: function(oDiv, event, tab)
		{
			if(!this.enabled)
				return;

			var bDeny = (event['~TYPE'] == 'tasks' || !this.oEC.Event.CanDo(event, 'edit') || this.oEC.Event.IsRecursive(event));

			var _this = this;
			jsDD.registerObject(oDiv);

			oDiv.setAttribute("data-bx-title-event", true);

			oDiv.onbxdragstart = function()
			{
				if (bDeny)
				{
					_this.oDiv = null;
					document.body.style.cursor = 'default';
					_this.ShowDenyNotice(oDiv, event);
				}
				else
				{
					_this.oDiv = oDiv.cloneNode(true);
					_this.oDiv.className = 'bxec-event bxec-event-drag';
					document.body.appendChild(_this.oDiv);
					_this.oDiv.style.top = '-1000px';
					_this.oDiv.style.left = '-1000px';

					var moreEventsWin = _this.oEC.MoreEventsWin;
					if(moreEventsWin)
					{
						moreEventsWin.close();
						moreEventsWin.destroy();
						moreEventsWin = null;
					}
				}
			};

			oDiv.onbxdrag = function(x, y)
			{
				if (_this.oDiv)
				{
					_this.oDiv.style.left = (x - 20) + 'px';
					_this.oDiv.style.top = (y - 10) + 'px';

					if (tab == 'week_title')
					{
						// We move event from title to timeline (week, day mode)
						_this.CheckTimelineOverPos(x, y);
					}
				}
			};

			oDiv.onbxdragstop = function(x, y)
			{
				if (_this.oDiv)
				{
					setTimeout(function()
					{
						if (_this.oDiv && _this.oDiv.parentNode)
						{
							_this.oDiv.parentNode.removeChild(_this.oDiv);
							_this.oDiv = null;
						}
					}, 100);
				}
				_this.OnDragFinish();
			};

			oDiv.onbxdragfinish = function(destination, x, y)
			{
				_this.OnDragFinish();
				return true;
			};
		},

		RegisterTimelineEvent: function(oDiv, event, tab)
		{
			if(!this.enabled)
				return;

			var bDeny = (event['~TYPE'] == 'tasks' || !this.oEC.Event.CanDo(event, 'edit') || this.oEC.Event.IsRecursive(event));

			var _this = this;
			jsDD.registerObject(oDiv);

			oDiv.onbxdragstart = function()
			{
				if (bDeny)
				{
					_this.oDiv = null;
					document.body.style.cursor = 'default';
					_this.ShowDenyNotice(oDiv, event);
				}
				else
				{
					_this.oDiv = oDiv.cloneNode(true);
					_this.oDiv.className = 'bxec-tl-event bxec-event-drag';
					document.body.appendChild(_this.oDiv);
					_this.oDiv.style.top = '-1000px';
					_this.oDiv.style.left = '-1000px';
				}
			};

			oDiv.onbxdrag = function(x, y)
			{
				if (!_this.oDiv)
					return;

				if (_this.timeLineEventOver)
				{
					var i, l = _this.arDays.length;
					for (i = 0; i < l; i++)
					{
						if (x >= _this.arDays[i].left && x <= _this.arDays[i].right)
						{
							_this.oDiv.style.width = (_this.arDays[i].width - 15) + 'px';
							_this.oDiv.style.left = (_this.arDays[i].left + 1) + 'px';
							_this.oDiv.style.top = (y - 10) + 'px';
							_this.oDiv.setAttribute('data-bx-day-index', i);
							break;
						}
					}
				}
			};

			oDiv.onbxdragstop = function(x, y)
			{
				_this.OnDragFinish();
				if (!_this.oDiv)
					return;

				setTimeout(function()
				{
					if (_this.oDiv && _this.oDiv.parentNode)
					{
						_this.oDiv.parentNode.removeChild(_this.oDiv);
						_this.oDiv = null;
					}
				}, 100);
			};

			oDiv.onbxdragfinish = function(destination, x, y)
			{
				_this.OnDragFinish();
			};
		},

		RegisterTimelineEventResizer: function(ddResizer, oDiv, event, tab)
		{
			if(!this.enabled)
				return;

			var bDeny = (event['~TYPE'] == 'tasks' || !this.oEC.Event.CanDo(event, 'edit') || this.oEC.Event.IsRecursive(event));

			ddResizer.setAttribute('data-bx-event-resizer', 'Y');

			BX.bind(ddResizer, "mousedown", function(e)
			{
				var wndSize = BX.GetWindowSize();
				e = e || window.event;

				_this.timelineResize = {
					oDiv : oDiv,
					startY: e.clientY + wndSize.scrollTop,
					height: parseInt(oDiv.offsetHeight)
				};
			});

			var _this = this;
			jsDD.registerObject(ddResizer);

			ddResizer.onbxdragstart = function()
			{
				if (bDeny)
				{
					_this.oDiv = null;
					document.body.style.cursor = 'default';
					_this.ShowDenyNotice(ddResizer, event);
					return;
				}

				document.body.style.cursor = 's-resize';
				_this.oDiv = oDiv;
				BX.removeClass(_this.oDiv, 'bxec-tl-ev-hlt');
			};

			ddResizer.onbxdrag = function(x, y)
			{
				if (_this.oDiv && _this.timeLineEventOver)
				{
					var height = (_this.timelineResize.height + y - _this.timelineResize.startY + 5);
					if (height <= 0)
						height = 5;

					_this.timelineResize.oDiv.style.height = height + 'px';
				}
			};

			ddResizer.onbxdragstop = function(x, y)
			{
				_this.OnDragFinish();
				if (!_this.oDiv)
					return;
			};

			ddResizer.onbxdragfinish = function(destination, x, y)
			{
				_this.OnDragFinish();
			};
		},

		ResizeEventTimeline: function(event, length)
		{
			event.DT_LENGTH = Math.max(parseInt(event.DT_LENGTH, 10) + length, 0);
			// Round to 10 min
			event.DT_LENGTH = Math.round(event.DT_LENGTH / 600) * 600;
			event.DT_TO_TS = parseInt(event.DT_FROM_TS) + event.DT_LENGTH * 1000;
			this.oEC.Event.Display();

			var _this = this;
			this.oEC.Request({
				postData: this.oEC.GetReqData('move_event_to_date',
					{
						id: event.ID,
						from_ts: BX.date.getServerTimestamp(event.DT_FROM_TS),
						to_ts: BX.date.getServerTimestamp(event.DT_TO_TS),
						section: event.SECT_ID,
						skip_time: event.DT_SKIP_TIME
					}
				),
				errorText: EC_MESS.EventSaveError,
				handler: function(oRes)
				{
					return true;
				}
			});
		},

		MoveEventToNewDate: function(event, newDate, mode, DT_LENGTH)
		{
			var from = bxGetDateFromTS(event.DT_FROM_TS);
			if (mode == 'day')
			{
				newDate.setHours(from.hour || 0);
				newDate.setMinutes(from.min || 0);
			}

			var
				_this = this,
				from_ts = newDate.getTime();

			this.oEC.Request({
				postData: this.oEC.GetReqData('move_event_to_date',
					{
						id: event.ID,
						from_ts: BX.date.getServerTimestamp(from_ts),
						to_ts: DT_LENGTH ? BX.date.getServerTimestamp(from_ts + DT_LENGTH) : 0,
						section: event.SECT_ID,
						skip_time: event.DT_SKIP_TIME
					}
				),
				errorText: EC_MESS.EventSaveError,
				handler: function(oRes)
				{
					return true;
				}
			});

			// Update DT_FROM_TS, DT_TO_TS for event
			var dif = DT_LENGTH != undefined ? DT_LENGTH : event.DT_TO_TS - event.DT_FROM_TS;
			event.DT_FROM_TS = from_ts;
			event.DT_TO_TS = parseInt(from_ts) + parseInt(dif);

			if (DT_LENGTH != undefined)
				event.DT_LENGTH = parseInt(DT_LENGTH, 10) / 1000;

			this.oEC.Event.Display();
		},

		ShowDenyNotice: function(oDiv, event)
		{
			if (!this.pNotice)
				this.pNotice = document.body.appendChild(BX.create("DIV", {props: {className: "bxec-event-drag-deny-notice"}}));

			if (this.bNoticeShown)
				this.HideDenyNotice();

			if (event['~TYPE'] == 'tasks')
				this.pNotice.innerHTML = EC_MESS.ddDenyTask;
			else if(this.oEC.Event.IsRecursive(event))
				this.pNotice.innerHTML = EC_MESS.ddDenyRepeted;
			else
				this.pNotice.innerHTML = EC_MESS.ddDenyEvent;

			var pos = BX.align(oDiv, 250, 50, 'top');
			this.pNotice.style.left = pos.left + 'px';
			this.pNotice.style.top = pos.top + 'px';
			this.pNotice.style.display = "block";
			this.bNoticeShown = true;

			BX.bind(document, "mouseup", BX.proxy(this.HideDenyNotice, this));
		},

		HideDenyNotice: function()
		{
			if (this.bNoticeShown)
			{
				this.bNoticeShown = false;
				if (this.pNotice)
					this.pNotice.style.display = "none";

				BX.unbind(document, "mouseup", BX.proxy(this.HideDenyNotice, this));
			}
		},

		OnDragFinish: function()
		{
		},

		IsDragDropNow: function()
		{
			return jsDD.bStarted;
		}
	};
})(window);




/* End */
;
; /* Start:/bitrix/js/calendar/cal-planner.js*/
// # # #  #  #  # Planner for Event Calendar  # # #  #  #  #
;(function(window) {
function ECPlanner(Params)
{
	window._bx_plann_events = {};
	window._bx_plann_mr = {};

	this.id = Params.id;

	this.bOpened = false;
	this.bMRShowed = false;
	this.bFreezed = true;
	this.userId = Params.userId;

	this.accData = {};
	this.accDataMR = {};
	this.accIndex = {};
	this.bAMPM = Params.bAMPM;

	this.minWidth = Params.minWidth || 800;
	this.minHeight = Params.minHeight || 300;
	this.cellWidth = 80;

	this.workTime = Params.workTime || [];
	this.config = Params.config || {};
	this.settings = Params.settings || {};
	this.meetingRooms = Params.meetingRooms || false;
	this.actionUrl = Params.actionUrl || '';

	this.scale = parseInt(this.settings.scale) || 1; // 0 - 30 min;   1 - 1 hour; 2 - 2 hour; 3 - 1day
	this.width = parseInt(this.settings.width) || 700;
	this.height = parseInt(this.settings.height) || 500;
	this.pathToUser = Params.pathToUser;

	if (this.width < this.minWidth)
		this.width = this.minWidth;
	if (this.height < this.minHeight)
		this.height = this.minHeight;

	this.bOnlyWorkTime = true;
	this.preFetch = {back: 8, forward: 26};

	this.bAddGroupMembers = !!Params.bAddGroupMembers;
	if (this.bAddGroupMembers)
	{
		var _this = this;
		this._AddGroupMembers = Params.AddGroupMembers;
		BX.addCustomEvent(window, "onGetGroupMembers", function(users)
		{
			var k, values = [];
			for(k in this.Attendees)
				values.push(this.Attendees[k].User);
			for(k in users)
				values.push({id: users[k].id, name: users[k].name});
			_this.SetValues(values);
		});
	}

	if (this.bOnlyWorkTime)
	{
		var
			arTF = this.workTime[0].split('.'),
			arTT = this.workTime[1].split('.');
		this.oTime = {from: {h: bxIntEx(arTF[0]), m: bxIntEx(arTF[1])}, to: {h: bxIntEx(arTT[0]), m: bxIntEx(arTT[1])}};
		this.oTime.count = this.oTime.to.h - this.oTime.from.h;
	}
	else
	{
		this.oTime = {from: {h: 0, m: 0}, to: {h: 24, m: 0}, count: 24};
	}
};

ECPlanner.prototype = {
Freeze: function(bFreeze)
{
	this.bFreezed = bFreeze;
	if (bFreeze)
		BX.addClass(this.pCont, 'bxecpl-empty');
	else
		BX.removeClass(this.pCont, 'bxecpl-empty');

	if (BX.browser.IsIE()) // Fix IE Bug
	{
		var _this = this;
		setTimeout(function(){_this.BuildGridTitle();}, 1000);
	}
},

OpenDialog: function(Params)
{
	var _this = this;

	this.curEventId = Params.curEventId || false;
	this.oldLocationMRId = Params.oldLocationMRId || false;
	this.initDate = Params.fromDate ? BX.parseDate(Params.fromDate) : new Date();
	this.accIndex = {};

	this.SetCurrentDate(this.initDate);

	if (!this.pWnd)
		this.CreateDialog();

	this.pWnd.show();

	if (BX.browser.IsIE())
		setTimeout(function(){_this.BuildGridTitle();}, 1000);
	else
		this.BuildGridTitle();

	this.ClearUserList(false);

	// Set From - To
	this.pFrom.value = Params.fromDate || '';
	this.pTo.value = Params.toDate || '';
	this.pFromTime.value = Params.fromTime || '';
	this.pToTime.value = Params.toTime || '';

	setTimeout(BX.proxy(this.FieldDatesOnChange, this), 100);

	// Set location;
	if(parseInt(Params.locationMrind) != Params.locationMrind)
		Params.locationMrind = false;
	this.Location.Set(Params.locationMrind, Params.location || '');

	// Set attendees
	if (Params.attendees)
		this.SetValues(Params.attendees);

	// Destination
	BX.SocNetLogDestination.obItemsSelected[plannerDestFormName] = BX.SocNetLogDestination.getSelected(editEventDestinationFormName);
	BX('event-planner-dest-item').innerHTML = BX('event-grid-dest-item').innerHTML;
	this.DestinationOnChange();

//	if(parseInt(Params.locInd) != Params.locInd)
//		Params.locInd = false;
//	con.Location.Set(Params.locInd, Params.locValue || '');
//
//	if (Params.attendees.length > 0)
//	{
//		BX.addClass(con.pAttCont, 'event-grid-dest-cont-full');
//		con.pMeetingParams.style.display = 'block';
//	}
//	else
//	{
//		BX.removeClass(con.pAttCont, 'event-grid-dest-cont-full');
//		con.pMeetingParams.style.display = 'none';
//	}
//	con.DisplayAttendees(Params.attendees);

	this.DisplayDiagram(false, true);

	setTimeout(function()
	{
		_this.Resize(_this.width, _this.height);
		_this.oSel.Adjust();
	}, 100);

	this.bOpened = true;
},

CreateDialog: function()
{
	var _this = this;
	this.pWnd = new BX.PopupWindow("BXCPlanner", null, {
		overlay: {opacity: 10},
		autoHide: false,
		zIndex: -100,
		offsetLeft: 0,
		offsetTop: 0,
		draggable: true,
		closeByEsc : true,
		titleBar: {content: BX.create("span", {html: BXPL_MESS.Planner})},
		closeIcon: { right : "12px", top : "10px"},
		className: "bxc-popup-window",
		buttons: [
			new BX.PopupWindowButton({
				text: BXPL_MESS.Next,
				className: "popup-window-button-accept",
				events: {click : function(){
					_this.Submit();
					_this.Close(true);
				}}
			}),
			new BX.PopupWindowButtonLink({
				id: this.id + 'bcpl-cancel',
				text: BXPL_MESS.Close,
				className: "popup-window-button-link-cancel",
				events: {
					click : function(){_this.Close(true);}
				}
			}),
			BX.create("DIV")
		],
		content: BX('bx-planner-popup' + this.id),
		events: {}
	});
	BX.addCustomEvent(this.pWnd, 'onPopupClose', BX.proxy(this.Close, this));

	this.BuildCore();
	this.pDuration = new ECPlDuration(this);

	this.Location = new BXInputPopup({
		id: this.id + 'loc_2',
		values: this.meetingRooms,
		input: BX(this.id + '_planner_location2'),
		defaultValue: BXPL_MESS.SelectMR,
		openTitle: BXPL_MESS.OpenMRPage,
		className: 'calendar-inp calendar-inp-time',
		noMRclassName: 'calendar-inp calendar-inp-time'
	});
	BX.addCustomEvent(this.Location, 'onInputPopupChanged', BX.proxy(this.LocationOnChange, this));

	this.pResizer = this.pWnd.buttonsContainer.appendChild(BX.create("DIV", {props: {className: 'bxec-plan-resizer'}, events: {mousedown: BX.proxy(this.ResizerMouseDown, this), drag: BX.False}}));

	this.pPopupCont = this.pWnd.popupContainer;
},

Close: function(bClosePopup)
{
	if (bClosePopup === true)
		this.pWnd.close();
},

CloseDialog: function()
{
	this.bOpened = false;
},

BuildCore: function()
{
	var
		id = this.id,
		_this = this;

	this.pCont = BX(id + '_plan_cont');
	this.pGridCont = BX(id + '_plan_grid_cont');
	this.pGridTbl = BX(id + '_plan_grid_tbl');
	//this.pDestCont = BX(id + '_plan_dest_cont');
	this.pTopCont = BX(id + '_plan_top_cont');

	if (this.bAMPM)
		BX.addClass(this.pCont, 'bxec-plan-cont-ampm');

	this.InitDestinationControls();

	this.pUserListCont = this.pGridTbl.rows[2].cells[0];
	this.pGridTitleCont = this.pGridTbl.rows[0].cells[2];
	this.pGridCellCont = this.pGridTbl.rows[2].cells[2];

	this.pUserListDiv = this.pUserListCont.firstChild;
	this.pGridTitleDiv = this.pGridTitleCont.firstChild;
	this.pGridDiv = this.pGridCellCont.firstChild;
	this.pGAccCont = this.pGridDiv.firstChild;

	this.pUserListTable = this.pUserListDiv.appendChild(BX.create("TABLE", {props: {className: 'bxec-user-list'}}));
	this.pGridTitleTable = this.pGridTitleDiv.appendChild(BX.create("TABLE", {props: {className: 'bxec-grid-cont-tbl'}}));
	this.pGridTable = this.pGridDiv.appendChild(BX.create("TABLE", {props: {className: 'bxec-grid-bg-tbl'}}));

	if (BX.browser.IsIE())
		BX.addClass(this.pGridTitleTable, BX.browser.IsDoctype() ? 'bxec-iehack0': 'bxec-iehack');

	DenyDragEx(this.pGridTable);
	this.oSel = new ECPlSelection(this);

	var scrollTmt;
	this.pGridDiv.onscroll = function()
	{
		_this.pGridTitleTable.style.left = '-' + parseInt(this.scrollLeft) + 'px'; // Synchronized scrolling with title
		_this.pUserListTable.style.top = '-' + parseInt(this.scrollTop) + 'px'; // Synchronized scrolling with userlist

		if (_this.oSel._bScrollMouseDown && BX.browser.IsIE())
		{
			if (scrollTmt)
				clearTimeout(scrollTmt);

			scrollTmt = setTimeout(
				function()
				{
					var sl = parseInt(_this.pGridDiv.scrollLeft);
					if (!_this.oSel || sl != _this.oSel._gridScrollLeft)
						_this.GridSetScrollLeft(_this.CheckScrollLeft(sl));
					_this.oSel._bGridMouseDown = false;
					_this.oSel._bScrollMouseDown = false;
				}, 1000
			);
		}
	};

	// Add users block
	//this.InitUserControll();

	this.pScale = BX(id + '_plan_scale_sel');
	this.pScale.value = this.scale;
	this.pScale.onchange = function(e)
	{
		if (_this.bFreezed)
		{
			this.value = _this.scale;
			return BX.PreventDefault(e);
		}
		_this.ChangeScale(this.value);
	};

	// From / To Limits
	this.pFrom = BX(this.id + 'planner-from');
	this.pTo = BX(this.id + 'planner-to');
	this.pFromTime = BX(this.id + 'planner_from_time');
	this.pToTime = BX(this.id + 'planner_to_time');

	this.pFrom.onchange = this.pFromTime.onchange = function(){_this.FieldDatesOnChange(true, true);};
	this.pTo.onchange = this.pToTime.onchange = function(){_this.FieldDatesOnChange(true);};

	//var ts = new Date().getTime() / 1000 ^ 0;
	this.pFrom.onclick = function(){BX.calendar({node: this.parentNode, field: this, bTime: false});};
	this.pTo.onclick = function(){BX.calendar({node: this.parentNode, field: this, bTime: false});};
	this.pFromTime.onclick = window['bxShowClock_' + this.id + 'planner_from_time'];
	this.pToTime.onclick = window['bxShowClock_' + this.id + 'planner_to_time'];
},

Submit: function()
{
	var Params = {
		fromDate: this.pFrom.value,
		toDate: this.pTo.value,
		fromTime: this.pFromTime.value,
		toTime: this.pToTime.value,
		locInd: this.curLocationInd,
		locValue: this.curLocationValue,
		attendees: this.lastUsers
	};

	//var cont
	//BX('event-planner-dest-cont')

	BX.onCustomEvent(this, 'onSubmit', [Params]);
},

CheckSubmit: function()
{
	if (!_this.pFrom.value || !_this.pTo.value)
	{
		alert(BXPL_MESS.NoFromToErr);
		return false;
	}

	if (_this.Attendees.length == 0)
	{
		alert(BXPL_MESS.NoGuestsErr);
		return false;
	}

	return true;
},

ChangeScale: function(scale)
{
	this.scale = parseInt(scale, 10); // Set new scale

	// # CLEANING #
	while(this.pGridTitleTable.rows[0])
		this.pGridTitleTable.deleteRow(0);

	// # BUILDING #
	this.BuildGridTitle();
	this.BuildGrid(this.Attendees.length);

	this.GetTimelineLimits(true);

	this.DisplayDiagram(false, true);
	this.DisplayRoomDiagram(false, true);

	if (this.oSel.pDiv)
	{
		this.oSel.Make({bFromTimeLimits: true, bSetTimeline: false});
		var _this = this;
		setTimeout(function(){_this.FieldDatesOnChange(true, true);}, 500);
	}

	BX.userOptions.save('calendar_planner', 'settings', 'scale', this.scale);
},

AddGroupMembers: function()
{
	if (this.bAddGroupMembers && this._AddGroupMembers && typeof this._AddGroupMembers == 'function')
		this._AddGroupMembers();
},

GetAccessibility: function(users)
{
	if (!users || !users.length)
		return;

	var
		_this = this,
		from, to,
		cd = this.currentDate,
		fromD = new Date(),
		toD = new Date();

	fromD.setFullYear(cd.Y, cd.M, cd.D - this.preFetch.back);
	toD.setFullYear(cd.Y, cd.M, cd.D + this.preFetch.forward);
	this.LoadedLimits = {
		from: fromD.getTime(),
		to: toD.getTime()
	};

	from = bxFormatDate(fromD.getDate(), fromD.getMonth() + 1, fromD.getFullYear());
	to = bxFormatDate(toD.getDate(), toD.getMonth() + 1, toD.getFullYear());

	this.Request({
		postData: this.GetReqData('get_accessibility',
			{
				users: users,
				from: from,
				to: to,
				cur_event_id: this.curEventId
			}
		),
		handler: function(oRes)
		{
			for (var id in oRes.data)
				if (typeof oRes.data[id] == 'object')
					_this.accData[id] = oRes.data[id];

			_this.DisplayDiagram(false, true);
			return true;
		}
	});
},

CheckAccessibility: function(bTimeout)
{
	if (bTimeout === true)
	{
		if (this._check_acc_timeout)
			this._check_acc_timeout = clearTimeout(this._check_acc_timeout);

		this._check_acc_timeout = setTimeout(BX.proxy(this.CheckAccessibility, this), 1500);
		return;
	}

	var users = [], i, uid;
	for (i = 0; i < this.Attendees.length; i++)
	{
		uid = this.Attendees[i].User.id;
		if (uid && !this.accIndex[uid])
		{
			users.push(uid);
			this.accIndex[uid] = true;
		}
	}
	this.GetAccessibility(users);
},

GetMRAccessibility: function(ind)
{
	var
		_this = this,
		mrid = this.Location.Get(ind),
		from, to,
		cd = this.currentDate,
		fromD = new Date(),
		toD = new Date();

	if (mrid === false)
		return;

	fromD.setFullYear(cd.Y, cd.M, cd.D - this.preFetch.back);
	toD.setFullYear(cd.Y, cd.M, cd.D + this.preFetch.forward);
	this.MRLoadedLimits = {from: fromD.getTime(), to: toD.getTime()};

	from = bxFormatDate(fromD.getDate(), fromD.getMonth() + 1, fromD.getFullYear());
	to = bxFormatDate(toD.getDate(), toD.getMonth() + 1, toD.getFullYear());

	this.Request({
		postData: this.GetReqData('get_mr_accessibility',
		{
			id: mrid,
			from: from,
			to: to,
			cur_event_id: this.oldLocationMRId
		}),
		handler: function(oRes)
		{
			if (typeof oRes.data == 'object')
				_this.accDataMR[mrid] = oRes.data;
			_this.DisplayRoomDiagram(_this.accDataMR[mrid], true);
		}
	});
},

DisplayDiagram: function(data, bClean)
{
	var i;
	if (bClean)
	{
		var el;
		for (i = this.pGAccCont.childNodes.length; i > 0; i--)
		{
			el = this.pGAccCont.childNodes[i - 1];
			if (el.getAttribute('data-bx-plan-type') == 'user')
				this.pGAccCont.removeChild(el);
		}
	}

	if (!data)
		data = this.accData;

	this.arACC = [];
	var uid;
	for (i = 0; i < this.Attendees.length; i++)
	{
		uid = this.Attendees[i].User.key || this.Attendees[i].User.USER_ID;
		if (data[uid])
			this.DisplayAccRow({ind: i, events: data[uid], uid: uid});
	}

	if (this.oSel)
		this.oSel.TimeoutCheck(false);
},

DisplayRoomDiagram: function(arEvents, bClean)
{
	if (!this.bMRShowed)
		return;

	//if (bClean) // Clean only MR diagram
		this.CleanMRDiagram();

	this.arMRACC = [];
	var mrid = this.Location.Get();
	if (!arEvents && mrid !== false && this.accDataMR[mrid])
		arEvents = this.accDataMR[mrid];

	if (!arEvents)
		arEvents = {};

	this.DisplayAccRow({events: arEvents, ind: this.Attendees.length + 2, bMR: true});
},

CleanMRDiagram: function()
{
	if (typeof this.arMRACC == 'object')
	{
		var arEl = BX.findChildren(this.pGAccCont, {attr: {'data-bx-plan-type' : 'meeting_room'}})
		for (var i in arEl)
			this.pGAccCont.removeChild(arEl[i]);
	}
	this.arMRACC = [];
},

DisplayDiagramEx: function()
{
	var tl = this.GetTimelineLimits();

	if (!this.LoadedLimits || !tl)
		return;

	if (tl.from.getTime() < this.LoadedLimits.from || tl.to.getTime() > this.LoadedLimits.to)
		this.GetAccessibility(this.AttendeesIds);
	else
		this.DisplayDiagram(false, true);

	if (this.bMRShowed && (tl.from.getTime() < this.MRLoadedLimits.from || tl.to.getTime() > this.MRLoadedLimits.to))
		this.GetMRAccessibility();
	else
		this.DisplayRoomDiagram(false, true);
},

DisplayAccRow: function(Params)
{
	if (typeof Params.events != 'object')
		return false;

	var
		tlLimits = this.GetTimelineLimits(),
		limFrom = tlLimits.from.getTime(),
		limTo = tlLimits.to.getTime(),
		top = (Params.ind * 20 + 0) + 'px', // Get top
		event, df, dt, cn, title, rtf, rtt,
		from, to, rdf, rdt,
		from_ts, to_ts,
		dayLen = 86400000,
		dispTimeF = this.oTime.from.h + this.oTime.from.m / 60,
		dispTimeT = this.oTime.to.h + this.oTime.to.m / 60,
		dayCW = this.GetDayCellWidth(),
		width, left, right, i, l = Params.events.length;

	for (i = 0; i < l; i++)
	{
		event = Params.events[i];
		from_ts = from = BX.date.getBrowserTimestamp(event.FROM);
		to_ts = to = BX.date.getBrowserTimestamp(event.TO);
		rdf = rdt = false;

		if (to < limFrom || from > limTo)
			continue;

		if (from < limFrom)
		{
			from = limFrom;
			rdf = new Date(from_ts);
		}
		if (to > limTo)
		{
			to = limTo;
			rdt = new Date(to_ts);
		}

		df = new Date(from);
		dt = new Date(to);

		// 1. Days count from limitFrom
		left = dayCW * Math.floor((from - limFrom) / dayLen);
		var dfTime = df.getHours() + df.getMinutes() / 60;
		var time = dfTime - dispTimeF;
		if (time > 0)
			left += Math.round((dayCW * time) / this.oTime.count);

		if (event.FROM == event.TO) // One full day event
		{
			width = dayCW - 1;
		}
		else
		{
			right = dayCW * Math.floor((to - limFrom) / dayLen);
			if (this.CheckBTime(dt))
				right += dayCW;

			var dtTime = dt.getHours() + dt.getMinutes() / 60;
			if (dtTime > dispTimeT)
				dtTime = dispTimeT;
			var time2 = dtTime - dispTimeF;
			if (time2 > 0)
				right += Math.round((dayCW * time2) / this.oTime.count);

			width = (right - left) - 1;
		}

		// Display event
		if (width > 0)
		{
			cn = 'bxec-gacc-el';
			if (!Params.bMR && event.ACCESSIBILITY != 'busy')
				cn += ' bxec-gacc-' + event.ACCESSIBILITY;

			if (!rdf)
				rdf = df;
			if (!rdt)
				rdt = dt;

			// Make title:
			rtf = zeroInt(rdf.getHours()) + ':' + zeroInt(rdf.getMinutes());
			rtt = zeroInt(rdt.getHours()) + ':' + zeroInt(rdt.getMinutes());
			rtf = (rtf == '00:00') ? '' : ' ' + rtf;
			rtt = (rtt == '00:00') ? '' : ' ' + rtt;

			title = Params.bMR ? event.NAME + ";\n " : '';
			title += BX.util.trim(bxFormatDate(rdf.getDate(), rdf.getMonth() + 1, rdf.getFullYear()) + ' ' + this.FormatTime(rdf.getHours(), rdf.getMinutes(), true, true)) + ' - ' + BX.util.trim(bxFormatDate(rdt.getDate(), rdt.getMonth() + 1, rdt.getFullYear()) + ' ' + this.FormatTime(rdt.getHours(), rdt.getMinutes(), true, true));

			if (!Params.bMR)
			{
				if (event.ACCESSIBILITY)
					title += ";\n " + BXPL_MESS.UserAccessibility + ': '+ BXPL_MESS['Acc_' + event.ACCESSIBILITY].toLowerCase();
				if(event.IMPORTANCE)
					title += ";\n " + BXPL_MESS.Importance + ': ' + BXPL_MESS['Importance_' + event.IMPORTANCE].toLowerCase();
			}

			if (event.FROM_HR)
				title += ";\n (" + BXPL_MESS.FromHR + ")";

			var pDiv = this.pGAccCont.appendChild(BX.create("DIV", {props: {className: cn, title: title}, style: {top: top, left: left + 'px', width: width + 'px'}}));

			pDiv.setAttribute('data-bx-plan-type', Params.bMR ? 'meeting_room' : 'user');

			if (!rtf && !rtt)
				to += dayLen;

			if (Params.bMR)
				this.arMRACC.push({div: pDiv, from: from, to: to});
			else
				this.arACC.push({div: pDiv, from: from, to: to, uid: Params.uid, aac: event.ACCESSIBILITY});
		}
	}
},

BlinkDiagramDiv: function(div)
{
	var
		iter = 0,
		origClass = div.className,
		warnClass = "bxec-gacc-el bxec-gacc-warn";

	if (origClass != warnClass)
	{
		var blinkInterval = setInterval(
			function()
			{
				div.className = (div.className == warnClass) ? origClass : warnClass;
				if (++iter > 5)
					clearInterval(blinkInterval);
			},250
		);
	}
},

BuildGridTitle: function()
{
	if (this.pGridTitleTable.rows.length > 0)
		BX.cleanNode(this.pGridTitleTable);

	var
		r_day = this.pGridTitleTable.insertRow(-1),
		r_time = this.pGridTitleTable.insertRow(-1),
		c_day, c_time,
		l = this.GetDaysCount(),
		j, i, arCell;

	r_time.className = 'bxec-pl-time-row bxecpl-s' + this.scale;
	r_day.className = 'bxec-plan-grid-day-row';
	this.pGTCells = [];

	// Each day
	for (i = 0; i < l; i++)
	{
		c_day = r_day.insertCell(-1);
		c_day.innerHTML = '<img src="/bitrix/images/1.gif" class="day-t-left"/><div></div><img src="/bitrix/images/1.gif" class="day-t-right"/>';
		arCell = {pDay: c_day, pTitle: c_day.childNodes[1]};

		this.SetDayInCell(c_day, arCell.pTitle, i);

		if (this.scale == 0)
			c_day.colSpan = this.oTime.count * 2;
		else if (this.scale == 1)
			c_day.colSpan = this.oTime.count;
		else if (this.scale == 2)
			c_day.colSpan = Math.ceil(this.oTime.count / 2);

		if (this.scale != 3)
		{
			for (j = this.oTime.from.h; j < this.oTime.to.h; j++)
			{
				c_time = r_time.insertCell(-1);
				c_time.innerHTML = '<div>' + this.FormatTime(j, 0, false, false, true) + '</div>';
				c_time.title = this.FormatTime(i);

				if (this.scale == 2)
					j++;

				if (this.scale == 0)
				{
					c_time = r_time.insertCell(-1);
					c_time.className = 'bxecpl-half-t-cell';
					c_time.title = this.FormatTime(j, 30);

					if (this.bAMPM)
						c_time.innerHTML = '<div></div>';
					else
						c_time.innerHTML = '<div>' + this.FormatTime(j, 30) + '</div>';
				}
			}
		}
		else
		{
			c_time = r_time.insertCell(-1);
			c_time.innerHTML = '<div>' + this.FormatTime(this.oTime.from.h, 0, false, false, true) + ' - ' + this.FormatTime(this.oTime.to.h, 0, false, false, true) + '</div>';
			c_time.title = this.FormatTime(this.oTime.from.h) + ' - ' + this.FormatTime(this.oTime.to.h);

			arCell.pTime = c_time;
		}

		this.pGTCells.push(arCell);
	}
},

FormatTime: function(h, m, addSpace, bSkipZero, skipMinutes)
{
	var res = '';
	if (m == undefined)
		m = '00';
	else
	{
		m = parseInt(m, 10);
		if (isNaN(m))
			m = '00';
		else
		{
			if (m > 59)
				m = 59;
			m = (m < 10) ? '0' + m.toString() : m.toString();
		}
	}

	h = parseInt(h, 10);
	if (h > 24)
		h = 24;

	if (bSkipZero === true && h == 0 && m == '00')
		return '';

	if (this.bAMPM)
	{
		var ampm = 'am';
		if (h == 0)
		{
			h = 12;
		}
		else if (h == 12)
		{
			ampm = 'pm';
		}
		else if (h > 12)
		{
			ampm = 'pm';
			h -= 12;
		}

		if (skipMinutes && m.toString() == '00')
			res = h.toString();
		else
			res = h.toString() + ':' + m.toString();

		res += (addSpace ? ' ' : '') + ampm;
	}
	else
	{
		res = ((h < 10) ? '0' : '') + h.toString() + ':' + m.toString();
	}

	return res;
},

ParseTime: function(str)
{
	var h, m, arTime;
	str = BX.util.trim(str);
	str = str.toLowerCase();

	if (this.bAMPM)
	{
		var ampm = 'pm';
		if (str.indexOf('am') != -1)
			ampm = 'am';

		str = str.replace(/[^\d:]/ig, '');
		arTime = str.split(':');
		h = parseInt(arTime[0] || 0, 10);
		m = parseInt(arTime[1] || 0, 10);

		if (h == 12)
		{
			if (ampm == 'am')
				h = 0;
			else
				h = 12;
		}
		else if (h != 0)
		{
			if (ampm == 'pm' && h < 12)
			{
				h += 12;
			}
		}
	}
	else
	{
		arTime = str.split(':');
		h = arTime[0] || 0;
		m = arTime[1] || 0;
	}

	return {h: h, m: m};
},

SetDayInCell: function(pCell, pTitle, ind)
{
	var
		realInd = ind - (this.scale == 3 ? 2 : 1),
		oDate = new Date();

	oDate.setFullYear(this.currentDate.Y, this.currentDate.M, this.currentDate.D + realInd);

	var
		day = this.ConvertDayIndex(oDate.getDay()),
		date = oDate.getDate(),
		month = oDate.getMonth(),
		year = oDate.getFullYear(),
		str = bxFormatDate(date, month + 1, year),
		CD = this.currentDate,
		bHol = this.config.week_holidays[day] || this.config.year_holidays[date + '.' + month], //It's Holliday
		bCur = date == CD.date && month == CD.month && year == CD.year;

	if (this.scale == 3 && BX.message("FORMAT_DATE").indexOf('MMMM') != -1)
		str = zeroInt(date) + '.' + zeroInt(month + 1) + '.' + year;

	if (bHol && bCur)
		pCell.className = 'cur-hol-day';
	else if(bHol)
		pCell.className = 'hol-day';
	else if(bCur)
		pCell.className = 'cur-day';
	else
		pCell.className = '';

	pTitle.innerHTML = str;
	pCell.title = this.config.days[this.ConvertDayIndex(oDate.getDay())][0] + ', ' + str;
},

BuildGrid : function(length)
{
	var
		_this = this,
		oRow = this.pGridTable.rows[0] || this.pGridTable.insertRow(-1),
		dayWidth,
		cellWidth = this.cellWidth + 1,
		l = this.GetDaysCount(),
		h = length * 20;

	oRow.className = 'bxecp-bg-grid-row bxecpl-s' + this.scale;

	if (this.scale == 0)
		dayWidth = (cellWidth + 1) * this.oTime.count;
	else if(this.scale == 1)
		dayWidth = (cellWidth + 1) * this.oTime.count / 2;
	else if(this.scale == 2)
		dayWidth = (cellWidth + 1) * this.oTime.count / 4;
	else // this.scale == 3
		dayWidth = cellWidth;

	if (!this.oneGridDiv)
		this.oneGridDiv = oRow.insertCell(-1).appendChild(BX.create('DIV'));

	this.oneGridDiv.style.width = dayWidth * l + 'px';

	if (this.bMRShowed)
	{
		setTimeout(function(){_this.AdjustMRStub(true);}, 100);
		h += 60;
	}
	this.oneGridDiv.style.height = h + 'px';

	setTimeout(function(){_this.GridSetScrollLeft(_this.CheckScrollLeft(0, false));}, 100);
},

CheckScrollLeft: function(sl, bOffset)
{
	sl = parseInt(sl);
	var minS;

	if (this.scale == 0)
		minS = this.cellWidth * 2 * this.oTime.count / 2;
	else if(this.scale == 1)
		minS = this.cellWidth * this.oTime.count / 2;
	else if(this.scale == 2)
		minS = this.cellWidth * this.oTime.count / 4;
	else // this.scale == 3
		minS = this.cellWidth * 2;

	var maxS = Math.abs(parseInt(this.pGridDiv.scrollWidth) - this.gridDivWidth - minS);

	if (sl < minS)
	{
		sl = minS + sl;
		if (bOffset !== false)
			this.OffsetCurrentDate(-this.GetScrollOffset());
	}
	else if (sl > maxS)
	{
		sl = sl - minS;
		if (bOffset !== false)
			this.OffsetCurrentDate(this.GetScrollOffset());
	}

	return sl;
},

GridSetScrollLeft: function(sl)
{
	this.pGridTitleTable.style.left = '-' + sl + 'px';
	this.pGridDiv.scrollLeft = sl;
},

OffsetCurrentDate: function(offset, bMakeSel)
{
	var
		It, i, l = this.GetDaysCount(),
		oDate = new Date();

	oDate.setFullYear(this.currentDate.Y, this.currentDate.M, this.currentDate.D + offset);
	this.SetCurrentDate(oDate);
	this.GetTimelineLimits(true);
	this.DisplayDiagramEx();

	if (bMakeSel !== false && this.oSel.pDiv)
		this.oSel.Make({bFromTimeLimits : true, bSetTimeline: false});

	for (i = 0; i < l; i++)
	{
		It = this.pGTCells[i];
		this.SetDayInCell(It.pDay, It.pTitle, i);
	}
},

Resize: function(w, h)
{
	if (w < this.minWidth)
		w = this.minWidth;
	if (h < this.minHeight)
		h = this.minHeight;

	this.width = w;
	this.height = h;

	// Container
	this.pCont.style.width = (w - 22) + 'px';
	this.pCont.style.height = (h - 70) + 'px';

	// Grid container
	var
		topCont = this.pTopCont.offsetHeight,
		gridH = h - topCont - 39/*top cont*/ - 32/*bottom cont*/,
		gridW = w - 20;

	this.pGridCont.style.height = gridH + 'px';
	this.pGridTbl.style.height = gridH + 'px';

	//this.pGridTitle.style.width = (gridW - 180) + 'px';
	this.pUserListCont.style.height = (gridH - 45) + 'px';
	//this.pUserListDiv.style.height = (gridH - 40) + 'px';
	this.pGridCellCont.style.height = (gridH - 45) + 'px';

	this.gridDivWidth = gridW - 180 - 5;
	this.pGridDiv.style.width = (gridW - 180 - 5) + 'px';
	this.pGridTitleDiv.style.width = (gridW - 180 - 5) + 'px';

},

ResizerMouseDown: function()
{
	this.oPos = {top: parseInt(this.pPopupCont.style.top, 10), left: parseInt(this.pPopupCont.style.left, 10)};

	BX.bind(document, "mouseup", BX.proxy(this.ResizerMouseUp, this));
	BX.bind(document, "mousemove", BX.proxy(this.ResizerMouseMove, this));
},

ResizerMouseUp: function()
{
	BX.unbind(document, "mouseup", BX.proxy(this.ResizerMouseUp, this));
	BX.unbind(document, "mousemove", BX.proxy(this.ResizerMouseMove, this));

	this.oSel.Adjust();
	BX.userOptions.save('calendar_planner', 'settings', 'width', this.width);
	BX.userOptions.save('calendar_planner', 'settings', 'height', this.height);
},

ResizerMouseMove: function(e)
{
	var
		windowSize = BX.GetWindowSize(document),
		mouseX = e.clientX + windowSize.scrollLeft,
		mouseY = e.clientY + windowSize.scrollTop,
		w = mouseX - this.oPos.left,
		h = mouseY - this.oPos.top;

	this.Resize(w, h);
},

SetUsersInfo: function()
{

},

SetCurrentDate: function(oDate)
{
	this.currentDate = {oDate: oDate, Y: oDate.getFullYear(), M: oDate.getMonth(), D: oDate.getDate()};
},

GetGridCellWidth: function()
{
	return this.scale == 3 ? this.cellWidth + 1 : this.cellWidth / 2 + 1;
},

GetTimelineLimits: function(bRecalc)
{
	if (bRecalc || !this.TimelineLimits)
	{
		var
			offset = this.GetScrollOffset(),
			cd = this.currentDate,
			D1 = new Date(), D2 = new Date();

		D1.setFullYear(cd.Y, cd.M, cd.D - offset);
		D2.setFullYear(cd.Y, cd.M, cd.D + (this.GetDaysCount() - offset - 1));
		D1.setHours(0, 0, 0, 0);
		D2.setHours(23, 59, 59, 999);
		this.TimelineLimits = {from: D1, to: D2};
	}

	return this.TimelineLimits;
},

GetScrollOffset: function()
{
	return this.scale == 3 ? 2 : 1;
},

GetDaysCount: function()
{
	if (this.scale == 2)
		return 15;
	if (this.scale == 3)
		return 30;
	return 10;
},

GetDayCellWidth: function()
{
	var
		tc = this.oTime.count,
		cw = this.GetGridCellWidth();

	switch(parseInt(this.scale))
	{
		case 0:
			return cw * tc * 2;
		case 1:
			return cw * tc;
		case 2:
			return Math.ceil(cw * tc / 2);
		case 3:
			return cw;
	}
},

SetFields: function(Params)
{
	var
		F = Params.from,
		T = Params.to,
		Ftime = this.FormatTime(F.getHours(), F.getMinutes(), true, true),
		Ttime = this.FormatTime(T.getHours(), T.getMinutes(), true, true);

	if (!F || isNaN(F.getDate()) || !T || isNaN(T.getDate()))
		return;

	this.oSel.curSelFT = {from: F, to: T};
	if (F && T)
	{
		this.pFrom.value = bxFormatDate(F.getDate(), F.getMonth() + 1, F.getFullYear());
		this.pTo.value = bxFormatDate(T.getDate(), T.getMonth() + 1, T.getFullYear());

		this.pFromTime.value = Ftime;
		this.pToTime.value = Ttime;

		this.pDuration.Set(T.getTime() - F.getTime());
	}
	else
	{
		this.pFrom.value = this.pTo.value = this.pFromTime.value = this.pToTime.value = '';
	}
},

GetFieldDate: function(type)
{
	var oDate = BX.parseDate(type == 'from' ? this.pFrom.value : this.pTo.value);
	if (oDate)
	{
		var time = this.ParseTime(type == 'from' ? this.pFromTime.value : this.pToTime.value);
		oDate.setHours(time.h);
		oDate.setMinutes(time.m);
	}

	return oDate;
},

FieldDatesOnChange: function(bRefreshDur, bFrom)
{
	if (this.bFreezed)
		return false;

	if (bFrom && this.oSel)
		this.bFocusSelection = true;

	if (bFrom && !isNaN(parseInt(this.pDuration.pInp.value)))
		return this.pDuration.OnChange();

	var
		time,
		F = BX.parseDate(this.pFrom.value),
		T = BX.parseDate(this.pTo.value);

	if (F)
	{
		time = this.ParseTime(this.pFromTime.value);
		F.setHours(time.h);
		F.setMinutes(time.m);
	}

	if (T)
	{
		time = this.ParseTime(this.pToTime.value);
		T.setHours(time.h);
		T.setMinutes(time.m);
	}

	if (F && T)
	{
		if (bRefreshDur !== false)
			this.pDuration.Set(T.getTime() - F.getTime());
		this.oSel.Make({bFromTimeLimits : true, from: F, to: T, bSetFields: false});
	}
	else
	{
		this.oSel.Hide();
	}
},

CheckBTime: function(date)
{
	return date.getHours() == 0 && date.getMinutes() == 0;
},

ReColourTable: function()
{
	var i, l = this.pUserListTable.rows.length;
	if (this.bMRShowed)
	{
		l -= 2;
		this.MRControll.pLoc.className = (l / 2 == Math.round(l / 2)) ? '' : 'bx-grey';
	}

	for (i = 0; i < l; i++)
		this.pUserListTable.rows[i].className = (i / 2 == Math.round(i / 2)) ? '' : 'bx-grey';
},

LocationOnChange: function(oLoc, ind, value)
{
	this.curLocationInd = ind;
	this.curLocationValue = value;

	if (ind === false)
	{
		this.ShowMRControll(false);
	}
	else
	{
		this.AddMR(ind);
		this.ShowMRControll();
	}
},

AddMR: function(ind)
{
	if (!this.meetingRooms)
		return;
	var
		_this = this,
		oMR = this.meetingRooms[ind];

	if (!oMR)
		return;

	if (!this.MRControll)
	{
		var
			r = this.pUserListTable.insertRow(-1),
			c = r.insertCell(-1);
		r.className = 'bxec-mr-title';
		c.innerHTML = '<b>' + BXPL_MESS.Location + '</b>';

		var
			r1 = this.pUserListTable.insertRow(-1),
			//c1 = r1.insertCell(-1),
			c2 = r1.insertCell(-1);

		c2.onmouseover = function(){this.className = 'bxex-pl-u-over';};
		c2.onmouseout = function(){this.className = '';};

		var mrStubDiv = this.pGridDiv.appendChild(BX.create('DIV', {props:{className: 'bxecpl-mr-stub'}}));
		this.MRControll = {pTitle: r, pLoc: r1, pLocName: c2, stub: mrStubDiv};
	}

	this.MRControll.pLocName.innerHTML = '<div>' + (oMR.URL ? '<a href="' + oMR.URL+ '" target="_blank">' + BX.util.htmlspecialchars(oMR.NAME) + '</a>' : BX.util.htmlspecialchars(oMR.NAME)) + '</div>';
	var pDel = this.MRControll.pLocName.appendChild(BX.create('IMG', {props: {src: '/bitrix/images/1.gif', title: BXPL_MESS.FreeMR, className: 'bxecp-del'}}));
	pDel.onclick = function(){_this.Location.Set(false, '');};

	this.MRControll.pLoc.title = oMR.NAME;

	this.GetMRAccessibility(ind);
},

ShowMRControll: function(bShow)
{
	var
		dis = 'none',
		l1 = this.Attendees.length || 0,
		h = l1 * 20;
	bShow = bShow !== false;
	this.bMRShowed = bShow;

	if (bShow)
	{
		h += 60;
		dis = '';
	}
	else
	{
		this.CleanMRDiagram();
	}

	if (this.oneGridDiv)
		this.oneGridDiv.style.height = h + 'px';

	this.oSel.Adjust();
	if (this.MRControll)
	{
		this.AdjustMRStub(bShow);
		this.MRControll.pLoc.className = (l1 / 2 == Math.round(l1 / 2)) ? '' : 'bx-grey';
		this.MRControll.pTitle.style.display = this.MRControll.pLoc.style.display = dis;
		this.MRControll.pTitle.className = 'bxec-mr-title';
	}
},

AdjustMRStub: function(bShow)
{
	if (this.MRControll && this.MRControll.stub)
	{
		this.MRControll.stub.style.display = bShow ? 'block' : 'none';
		if (bShow)
		{
			var w = parseInt(this.pGridTable.offsetWidth) - 1;
			if (isNaN(w) || w <= 0)
			{
				var _this = this;
				return setTimeout(function(){_this.AdjustMRStub(bShow);}, 100);
			}

			this.MRControll.stub.style.top = parseInt(this.Attendees.length) * 20 + 'px';
			this.MRControll.stub.style.width = (parseInt(this.pGridTable.offsetWidth) - 1) + 'px';
		}
	}
},

GetScrollBarSize: function()
{
	if (!this._sbs)
	{
		var div = this.pPopupCont.appendChild(BX.create('DIV', {props: {className: 'bxex-sbs'}, html: '&nbsp;'}));
		this._sbs = div.offsetWidth - div.clientWidth;
		setTimeout(function(){div.parentNode.removeChild(div);},50);
	}
	return this._sbs || 20;
},

ConvertDayIndex : function(i)
{
	if (i == 0)
		return 6;
	return i - 1;
},

GetReqData : function(action, O)
{
	if (!O)
		O = {};
	if (action)
		O.action = action;
	O.sessid = BX.bitrix_sessid();
	O.bx_event_calendar_request = 'Y';
	O.reqId = Math.round(Math.random() * 1000000);
	return O;
},

Request : function(P)
{
	if (!P.url)
		P.url = this.actionUrl;
	if (P.bIter !== false)
		P.bIter = true;

	if (!P.postData && !P.getData)
		P.getData = this.GetReqData();

	var
		_this = this, iter = 0,
		reqId = P.getData ? P.getData.reqId : P.postData.reqId;

	var handler = function(result)
	{
		var handleRes = function()
		{
			BX.closeWait(_this.pPopupCont);
			var res = P.handler(_this.GetRequestRes(reqId), result);
			if(res === false && ++iter < 20 && P.bIter)
				setTimeout(handleRes, 5);
			else
				_this.ClearRequestRes(reqId);
		};
		setTimeout(handleRes, 20);
	};
	BX.showWait(this.pPopupCont);

	if (P.postData)
		BX.ajax.post(P.url, P.postData, handler);
	else
		BX.ajax.get(P.url, P.getData, handler);

	return reqId;
},

GetRequestRes: function(key)
{
	if (top.BXCRES && typeof top.BXCRES[key] != 'undefined')
		return top.BXCRES[key];

	return {};
},

ClearRequestRes: function(key)
{
	if (top.BXCRES)
	{
		top.BXCRES[key] = null;
		delete top.BXCRES[key];
	}
},

InitUserControll: function(Params)
{

	var _this = this;

	//this.pAddUserLinkCont = BX(this.id + 'pl_user_control_link');
	this.pCount = BX(this.id + 'pl-count');


	return;
	// Clear all users list
	//BX(this.id + '_planner_del_all').onclick = BX.proxy(this.ClearUserList, this);

	//var
	//	pIcon = this.pAddUserLinkCont.appendChild(BX.create("I")),
	//	pTitle = this.pAddUserLinkCont.appendChild(BX.create("SPAN", {text: BXPL_MESS.AddAttendees}));

	//pIcon.onclick = pTitle.onclick = BX.proxy(this.OpenSelectUser, this);

//	var arMenuItems = [{text : BXPL_MESS.AddGuestsDef, onclick: BX.proxy(this.OpenSelectUser, this)}];
//
//	if (this.bAddGroupMembers)
//		arMenuItems.push({text : BXPL_MESS.AddGroupMemb, title: BXPL_MESS.AddGroupMembTitle, onclick: BX.proxy(this.AddGroupMembers, this)});
//	//arMenuItems.push({text : BXPL_MESS.AddGuestsEmail,onclick: BX.proxy(this.AddByEmail, this)});
//
//	if (arMenuItems.length > 1)
//	{
//		pMore = this.pAddUserLinkCont.appendChild(BX.create("A", {props: {href: 'javascript: void(0);', className: 'bxec-add-more'}}));
//		pMore.onclick = function()
//		{
//			BX.PopupMenu.show('bxec_add_guest_menu', _this.pAddUserLinkCont, arMenuItems, {events: {onPopupClose: function() {BX.removeClass(pMore, "bxec-add-more-over");}}});
//			BX.addClass(pMore, "bxec-add-more-over");
//		};
//	}
//
//	BX.addCustomEvent(window, "onPlannerAttendeeOnChange", BX.proxy(this.UserOnChange, this));
},

SetValues: function(Attendees)
{
	var i, l = Attendees.length, User;

	for(i = 0; i < l; i++)
	{
		User = Attendees[i];
		User.key = User.id || User.email;
		if (User && User.key && !this.oAttendees[User.key])
			this.DisplayAttendee(User);
	}

	//this.DisableUserOnChange(true, true);
	//O_BXPlannerUserSelect.setSelected(Attendees);

	this.UpdateCount();
},

UpdateCount: function()
{
	this.BuildGrid(this.count);
	this.ReColourTable();
	this.oSel.Adjust();

	if (this.count == 0)
	{
		this.pCount.innerHTML = '';
		this.Freeze(true);
	}
	else
	{
		this.pCount.innerHTML = ' (' + this.count + ')';
		this.Freeze(false);
		this.CheckAccessibility(true);
	}
},

//OpenSelectUser : function(e)
//{
//	if (BX.PopupMenu && BX.PopupMenu.currentItem)
//		BX.PopupMenu.currentItem.popupWindow.close();
//
//	if(!e) e = window.event;
//	if (!this.SelectUserPopup)
//	{
//		var _this = this;
//		this.SelectUserPopup = BX.PopupWindowManager.create("bxc-user-popup-plan", this.pAddUserLinkCont, {
//			offsetTop : 1,
//			autoHide : true,
//			closeByEsc : true,
//			content : BX("BXPlannerUserSelect_selector_content"),
//			className: 'bxc-popup-user-select',
//			closeIcon: { right : "12px", top : "5px"},
//
//			buttons: [
//				new BX.PopupWindowButton({
//					text: EC_MESS.Add,
//					events: {click : function()
//					{
//						_this.SelectUserPopup.close();
//
//						for (var id in _this.selectedUsers)
//						{
//							id = parseInt(id);
//							if (!isNaN(id) && id > 0)
//							{
//								if (!_this.oAttendees[id] && _this.selectedUsers[id]) // Add new user
//								{
//									_this.selectedUsers[id].key = id;
//									_this.DisplayAttendee(_this.selectedUsers[id]);
//								}
//								else if(_this.oAttendees[id] && !_this.selectedUsers[id]) // Del user from our list
//								{
//									_this.RemoveAttendee(id);
//								}
//							}
//						}
//
//						BX.onCustomEvent(_this, 'UserOnChange');
//						_this.UpdateCount();
//					}}
//				}),
//				new BX.PopupWindowButtonLink({
//					text: EC_MESS.Close,
//					className: "popup-window-button-link-cancel",
//					events: {click : function(){_this.SelectUserPopup.close();}}
//				})
//			]
//		});
//	}
//
//	this.selectedUsers = {};
//	var Attendees = [], key;
//	for (key in this.oAttendees)
//	{
//		if (this.oAttendees[key] && this.oAttendees[key].type != 'ext')
//			Attendees.push(this.oAttendees[key].User);
//	}
//	//O_BXPlannerUserSelect.setSelected(Attendees);
//
//	this.SelectUserPopup.show();
//	BX.PreventDefault(e);
//},

//DisableUserOnChange: function(bDisable, bTime)
//{
//	this.bDisableUserOnChange = bDisable === true;
//	if (bTime)
//		setTimeout(BX.proxy(this.DisableUserOnChange, this), 200);
//},
//
//UserOnChange: function(arUsers)
//{
//	if (this.bDisableUserOnChange)
//		return;
//
//	this.selectedUsers = arUsers;
//},

DisplayAttendee: function(User)
{
	var
		userName = User.DISPLAY_NAME || User.name,
		userId = parseInt(User.USER_ID || User.id);

	if (userId && !this.oAttendees[userId])
	{
		this.count++;
		var pRow = this.pUserListTable.insertRow(this.count - 1);
		pRow.id = 'ec_pl_u_' + userId;
		// User name
		var c2 = pRow.insertCell(-1);
		c2.innerHTML = '<span class="bxec-user-name">' + BX.util.htmlspecialchars(userName) + '</span>';

		this.oAttendees[userId] = {
			User : User,
			pRow: pRow,
			ind: this.Attendees.length
		};
		this.Attendees.push(this.oAttendees[userId]);

		if (userId > 0)
			this.AttendeesIds.push(userId);
	}
},


//RemoveAttendee: function(key)
//{
//	return;
//	if (!this.oAttendees[key])
//		return;
//
//	this.oAttendees[key].pRow.parentNode.removeChild(this.oAttendees[key].pRow);
//
//	this.count--;
//	this.oAttendees[key] = null;
//	delete this.oAttendees[key];
//
//	var Attendees = [];
//	this.Attendees = [];
//	this.AttendeesIds = [];
//	for (key in this.oAttendees)
//	{
//		if (this.oAttendees[key])
//		{
//			if (this.oAttendees[key].type != 'ext')
//			{
//				Attendees.push(this.oAttendees[key].User);
//				this.AttendeesIds.push(this.oAttendees[key].User.id);
//			}
//
//			this.Attendees.push(this.oAttendees[key]);
//		}
//	}
//	//this.DisableUserOnChange(true, true);
//	//O_BXPlannerUserSelect.setSelected(Attendees);
//
//	// Decrease grid height
//	this.UpdateCount();
//	this.DisplayDiagram(false, true);
//	this.DisplayRoomDiagram(false);
//},

ClearUserList: function(bConfirm)
{
	if (bConfirm !== false && !confirm(BXPL_MESS.DelAllGuestsConf))
		return;

	var row = true, rowIndex = 0;
	while(rowIndex < this.pUserListTable.rows.length)
	{
		row = this.pUserListTable.rows[rowIndex];
		if (row && ~row.id.indexOf('ec_pl_u_'))
			row.parentNode.removeChild(row);
		else
			rowIndex++;
	}

	this.count = 0;
	this.oAttendees = {};
	var Attendees = [];
	this.Attendees = [];
	this.AttendeesIds = [];

	//this.DisableUserOnChange(true, true);
	//O_BXPlannerUserSelect.setSelected(Attendees);

	// Decrease grid height
	this.UpdateCount();
	this.DisplayDiagram(false, true);
	this.DisplayRoomDiagram(false);

	var i, l1 = this.Attendees.length;
	for (i = 0; i < l1; i++)
	{
		if (this.Attendees[i].id == id)
		{
			if (this.Attendees[i].bDel === false)
			{
				if (confirm(BXPL_MESS.DelOwnerConfirm))
					this.DelAllGuests();
				return true;
			}

			// Del from list
			pRow.parentNode.removeChild(pRow);
			// Del from arrays
			this.Attendees = BX.util.deleteFromArray(this.Attendees, i);
			break;
		}
	}
},

InitDestinationControls: function()
{
	BX.addCustomEvent('OnDestinationAddNewItemPlanner', BX.proxy(this.DestinationOnChange, this));
	BX.addCustomEvent('OnDestinationUnselectPlanner', BX.proxy(this.DestinationOnChange, this))

	this.pDestValuesCont = BX('event-planner-dest-item');
	this.pCount = BX(this.id + 'pl-count');

	BX.bind(this.pDestValuesCont, 'click', function(e)
	{
		var targ = e.target || e.srcElement;
		if (targ.className == 'feed-event-del-but') // Delete button
		{
			BX.SocNetLogDestination.deleteItem(targ.getAttribute('data-item-id'), targ.getAttribute('data-item-type'), plannerDestFormName);
			BX.PreventDefault(e);
		}
	});

	BX.bind(this.pDestValuesCont, 'mouseover', function(e)
	{
		var targ = e.target || e.srcElement;
		if (targ.className == 'feed-event-del-but') // Delete button
			BX.addClass(targ.parentNode, 'event-grid-dest-hover');
	});
	BX.bind(this.pDestValuesCont, 'mouseout', function(e)
	{
		var targ = e.target || e.srcElement;
		if (targ.className == 'feed-event-del-but') // Delete button
			BX.removeClass(targ.parentNode, 'event-grid-dest-hover');
	});

	BxPlannerSetLinkName(window.plannerDestFormName);
	BX.bind(BX('event-planner-dest-input'), 'keyup', BxPlannerSearch);
	BX.bind(BX('event-planner-dest-input'), 'keydown', BxPlannerSearchBefore);
	BX.bind(BX('event-planner-dest-add-link'), 'click', function(e){BX.SocNetLogDestination.openDialog(plannerDestFormName); BX.PreventDefault(e);});
	BX.bind(BX('event-planner-dest-cont'), 'click', function(e){BX.SocNetLogDestination.openDialog(plannerDestFormName); BX.PreventDefault(e);});
},


DestinationOnChange: function()
{
	var
		_this = this,
		reqId,
		arInputs = this.pDestValuesCont.getElementsByTagName('INPUT'),
		i, arCodes = ['U' + this.userId],
		from, to,
		cd = this.currentDate,
		fromD = new Date(),
		toD = new Date();

	for (i = 0; i < arInputs.length; i++)
		arCodes.push(arInputs[i].value);

	fromD.setFullYear(cd.Y, cd.M, cd.D - this.preFetch.back);
	toD.setFullYear(cd.Y, cd.M, cd.D + this.preFetch.forward);
	this.LoadedLimits = {
		from: fromD.getTime(),
		to: toD.getTime()
	};

	from = BX.date.getServerTimestamp(fromD.getTime());
	to = BX.date.getServerTimestamp(toD.getTime());

	reqId = this.Request({
		getData: this.GetReqData('get_attendees_by_codes_planner', {
			codes: arCodes,
			path_to_user: this.pathToUser,
			from_ts: from,
			to_ts: to,
			cur_event_id: this.curEventId
		}),
		handler: function(oRes)
		{
			if (reqId == _this.lastReqId)
			{
				for (var id in oRes.accessibility)
				{
					_this.accIndex[id] = true;
					if (typeof oRes.accessibility[id] == 'object')
						_this.accData[id] = oRes.accessibility[id];
				}
				_this.DisplayAttendees(oRes.users);
				_this.DisplayDiagram(false, true);
				_this.lastUsers = oRes.users;
			}
		}
	});

	this.lastReqId = reqId;

	setTimeout(function()
	{
		_this.Resize(_this.width, _this.height);
		_this.oSel.Adjust();
	}, 1);
},


DisplayAttendees: function(users)
{
	this.ClearUserList(false);
	if (users.length > 0)
	{
		for (var i in users)
		{
			this.DisplayAttendee(users[i]);
		}
	}

	this.UpdateCount();
	this.DisplayRoomDiagram(false);
}
};

function ECPlSelection(oPlanner)
{
	this.oPlanner = oPlanner;
	this.id = this.oPlanner.id;
	this.pGrid = oPlanner.pGridDiv;

	this.pGrid.onmousedown = BX.proxy(this.MouseDown, this);
	this.pGrid.onmouseup = BX.proxy(this.MouseUp, this);
}

ECPlSelection.prototype = {
Make: function(Params)
{
	var
		left, width,tl,
		cellW = this.oPlanner.GetGridCellWidth(),
		_a,
		from = Params.from,
		to = Params.to;

	if (!this.pDiv)
		this.Create();

	this.pDiv.style.display = 'block';
	if (Params.bFromTimeLimits)
	{
		Params.bSetTimeline = Params.bSetTimeline !== false;
		tl = this.oPlanner.GetTimelineLimits(true);
		if (!from)
			from = this.curSelFT.from;
		if (!to)
			to = this.curSelFT.to;

		var
			off, offms,
			bOutOfLimits1 = from.getTime() < tl.from.getTime(),
			bOutOfLimits2 = to.getTime() > tl.to.getTime();
		if (bOutOfLimits1 || bOutOfLimits2)
		{
			if (Params.bSetTimeline)
			{
				// Get offset
				if (bOutOfLimits1)
					off = Math.round((from.getTime() - tl.from.getTime()) / 86400000) - 2;
				else
					off = Math.round((from.getTime() - tl.to.getTime()) / 86400000) + 5;

				this.oPlanner.OffsetCurrentDate(off, false);
			}
			else
			{
				this.Hide();
			}
		}

		tl = this.oPlanner.GetTimelineLimits(true);
		var
			dcw = this.oPlanner.GetDayCellWidth(),
			x1 = this._GetXByDate({date: from, tl: tl, dcw: dcw}),
			x2 = this._GetXByDate({date: to, tl: tl, dcw: dcw});

		if (this.oPlanner.CheckBTime(to) || x1 == x2)
			x2 = x2 + dcw;

		left = x1;
		width = x2 - x1 - 1;

		if (width <= 0)
			return false;
		this.curSelFT = {from: from, to: to};
	}
	else
	{
		if (from > to) // swap start_ind and end_ind
		{
			_a = from;
			from = to;
			to = _a;
		}

		left = (from - 1) * cellW;
		width = (to) * cellW - left - 1;
	}

	this.pDiv.style.left = left + 'px'; // Set left
	this.pDiv.style.width = width + 'px'; // Set width
	this.Check(this.GetCurrent(), false, Params.bSetFields !== false);
	this.pMover.style.left = (Math.round(width / 2) - 6) + 'px'; // Set Mover

	// Focus
	if (this.oPlanner.bFocusSelection)
	{
		this.pGrid.scrollLeft = left - 50;
		this._bScrollMouseDown = true;
		this.MouseUp();
	}
	this.oPlanner.bFocusSelection = false;
},

Hide: function()
{
	if (this.pDiv)
		this.pDiv.style.display = 'none';
},

_GetXByDate: function(Params)
{
	var
		oTime = this.oPlanner.oTime,
		dayLen = 86400000,
		limFrom = Params.tl.from.getTime(),
		ts = Params.date.getTime(),
		dispTimeF = oTime.from.h + oTime.from.m / 60,
		x = Params.dcw * Math.floor((ts - limFrom) / dayLen),
		dfTime = Params.date.getHours() + Params.date.getMinutes() / 60,
		time = dfTime - dispTimeF;

	if (time > 0)
		x += Math.round((Params.dcw * time) / oTime.count);
	return x;
},

Create: function()
{
	this.pDiv = BX(this.id + '_plan_selection');
	var
		_this = this,
		imgL = this.pDiv.childNodes[0],
		imgR = this.pDiv.childNodes[1];

	imgL.onmousedown = function(e){_this.StartTransform({e: e, bLeft: true}); return BX.PreventDefault(e);};
	imgR.onmousedown = function(e){_this.StartTransform({e: e, bLeft: false}); return BX.PreventDefault(e);};

	this.pMover = this.pDiv.childNodes[2];
	this.pMover.onmousedown = function(e){_this.StartTransform({e: e, bMove: true}); return BX.PreventDefault(e);};

	this.bDenied = false;
	this.curSelFT = {};

	DenyDragEx(imgL);
	DenyDragEx(imgR);
	DenyDragEx(this.pDiv);

	this.Adjust();
},

Adjust: function()
{
	if (!this.pDiv)
		return;

	var
		h1 = parseInt(this.oPlanner.pGridTable.offsetHeight),
		h2 = parseInt(this.oPlanner.pGridCellCont.offsetHeight) - this.oPlanner.GetScrollBarSize();

	this.pDiv.style.height = (Math.max(h1, h2) - 2) + 'px';
},

MouseDown: function(e)
{
	if (this.MoveParams)
		return;

	// Remember  scroll pos
	this._gridScrollLeft = parseInt(this.pGrid.scrollLeft);

	var
		grigPos = BX.pos(this.pGrid),
		mousePos = this.GetMouseXY(e);

	// Click on the scrollbar
	if ((grigPos.top + parseInt(this.pGrid.offsetHeight) - mousePos.y < this.oPlanner.GetScrollBarSize()) // Hor scroll
		|| (grigPos.left + parseInt(this.pGrid.offsetWidth) - mousePos.x < this.oPlanner.GetScrollBarSize())) // Vert scroll
	{
		this._bScrollMouseDown = true;
		return true;
	}

	this._bGridMouseDown = true;
	var ind = this.GetOverCellIndex({mousePos: mousePos, grigPos: grigPos});

	// Remember grigPos
	this.grigPos = grigPos;
	this.curSelection = {from: ind, to: ind};

	// Add mouse move handler
	BX.unbind(document, "mousemove", BX.proxy(this.MouseMove, this));
	BX.bind(document, "mousemove", BX.proxy(this.MouseMove, this));

	this.Make(this.curSelection);
},

MouseMove: function(e)
{
	if (this.MoveParams)
	{
		this.Transform({mousePos: this.GetMouseXY(e), grigPos: this.grigPos, MoveParams: this.MoveParams});
		this.TimeoutCheck(true);
	}
	else
	{
		var ind = this.GetOverCellIndex({mousePos: this.GetMouseXY(e), grigPos: this.grigPos});

		if (this.curSelection && ind != this.curSelection.to)
		{
			this.curSelection.to = ind;
			this.Make(this.curSelection);
		}
	}
},

MouseUp: function()
{
	if (this._bGridMouseDown)
	{
		BX.unbind(document, "mousemove", BX.proxy(this.MouseMove, this));
		if (this.MoveParams)
			this.MoveParams = false;

		this.Check(this.GetCurrent());
	}
	else if (this._bScrollMouseDown)
	{
		var sl = parseInt(this.pGrid.scrollLeft);
		if (sl != this._gridScrollLeft) // User move scroller - and we check and set correct 'middle' - position
			this.oPlanner.GridSetScrollLeft(this.oPlanner.CheckScrollLeft(sl));
	}

	this._bGridMouseDown = false;
	this._bScrollMouseDown = false;
},

StartTransform: function(Params)
{
	if (!Params.bMove && this.oPlanner.pDuration.bLocked)
	{
		this.oPlanner.pDuration.LockerBlink();
		Params.bMoveBySide = !!Params.bLeft;
		Params.bLeft = null;
		Params.bMove = true;
	}
	this.MoveParams = Params;

	// Remember  scroll pos
	this._gridScrollLeft = parseInt(this.pGrid.scrollLeft);
	this._bGridMouseDown = true;

	var
		grigPos = BX.pos(this.pGrid),
		mousePos = this.GetMouseXY(Params.e);

	if (grigPos.top + parseInt(this.pGrid.offsetHeight) - mousePos.y < this.oPlanner.GetScrollBarSize()) // Click on the scrollbar
		return true;

	// Remember grigPos
	this.grigPos = grigPos;
	this.divCurPar = {left: parseInt(this.pDiv.style.left, 10), width: parseInt(this.pDiv.style.width, 10)};
	this.curSelection = false;

	// Add mouse move handler
	BX.unbind(document, "mousemove", BX.proxy(this.MouseMove, this));
	BX.bind(document, "mousemove", BX.proxy(this.MouseMove, this));
},

Transform: function(Params)
{
	if (!this.pDiv)
		return false;

	var newLeft, newWidth;
	if (Params.MoveParams.bLeft) // Move left slider
	{
		newLeft = parseInt(this.pGrid.scrollLeft) + (Params.mousePos.x - Params.grigPos.left);
		if (newLeft < 0)
			newLeft = 0;
		if (newLeft > this.divCurPar.left + this.divCurPar.width - 10)
			newLeft = this.divCurPar.left + this.divCurPar.width - 10;

		newWidth = this.divCurPar.width + this.divCurPar.left - newLeft;

		this.pDiv.style.left = newLeft + 'px'; // Set new left
		this.pDiv.style.width = newWidth + 'px'; // Set new width
		this.pMover.style.left = (Math.round(newWidth / 2) - 6) + 'px'; // Set Mover
	}
	else if (!Params.MoveParams.bMove)// Move right slider
	{
		newWidth = parseInt(this.pGrid.scrollLeft) + (Params.mousePos.x - Params.grigPos.left) - this.divCurPar.left;
		if (newWidth < 10)
			newWidth = 10;

		this.pDiv.style.width = newWidth + 'px'; // Set new width
		this.pMover.style.left = (Math.round(newWidth / 2) - 6) + 'px'; // Set Mover
	}
	else if (Params.MoveParams.bMove) // Move whole selection
	{
		var
			w = this.divCurPar.width / 2,
			mbs = Params.MoveParams.bMoveBySide;

		if (mbs === true) // left
			w =  0;
		else if(mbs === false)
			w =  this.divCurPar.width;

		newLeft = Math.round(parseInt(this.pGrid.scrollLeft) + (Params.mousePos.x - Params.grigPos.left) - w);
		if (newLeft < 0)
			newLeft = 0;
		this.pDiv.style.left = newLeft + 'px'; // Set new left
	}
},

GetOverCellIndex: function(Params)
{
	var grigPos = Params.grigPos || BX.pos(this.pGrid);
	return Math.ceil((parseInt(this.pGrid.scrollLeft) + (Params.mousePos.x - grigPos.left)/*dx*/) / this.oPlanner.GetGridCellWidth());
},

GetCurrent: function()
{
	if (!this.pDiv)
		return;
	var
		tl = this.oPlanner.GetTimelineLimits(),
		dcw = this.oPlanner.GetDayCellWidth(),
		left = parseInt(this.pDiv.style.left, 10),
		width = parseInt(this.pDiv.style.width, 10) + 0.5;

	return {
		from: this._GetDateByX({x: left, fromD: tl.from, dcw: dcw}),
		to: this._GetDateByX({x: left + width, fromD: tl.from, dcw: dcw})
	};
},

_GetDateByX: function(Params)
{
	var
		oTime = this.oPlanner.oTime,
		day = Math.floor(Params.x / Params.dcw),
		time = oTime.count * (Params.x - day * Params.dcw) / Params.dcw,
		timeH = Math.floor(time),
		hour = oTime.from.h + timeH,
		_k = this.oPlanner.scale == 3 ? 10 : 5,
		min = Math.round((time - timeH) * 60 / _k) * _k,
		D = new Date(),
		Df = Params.fromD;

	D.setFullYear(Df.getFullYear(), Df.getMonth(), Df.getDate() + day);
	D.setHours(hour, min, 0, 0);

	return D;
},

Check: function(curSel, bBlink, bSetFields)
{
	if (!this.oPlanner.arACC || !this.pDiv)
		return;

	var
		bDeny = false, i, l,
		aac = this.oPlanner.arACC,
		f = curSel.from.getTime() + 1,
		t = curSel.to.getTime() - 1;

	this.arBusyGuests = {};
	if (this.oPlanner.bMRShowed && typeof this.oPlanner.arMRACC == 'object')
		aac = aac.concat(this.oPlanner.arMRACC);

	l = aac.length;

	for (i = 0; i < l; i++)
	{
		if (aac[i].from < t && aac[i].to > f)
		{
			bDeny = true;

			if (aac[i].uid > 0)
				this.arBusyGuests[aac[i].uid] = aac[i].acc || 'busy';

			if (bBlink !== false)
				this.oPlanner.BlinkDiagramDiv(aac[i].div);
		}
	}

	if (bSetFields !== false)
		this.oPlanner.SetFields(curSel);

	this.SetDenied(bDeny);
},

SetDenied: function(bDeny)
{
	if (!this.pDiv || this.bDenied == bDeny)
		return;

	this.bDenied = bDeny;
	if (bDeny)
		BX.addClass(this.pDiv, 'bxecp-sel-deny');
	else
		BX.removeClass(this.pDiv, 'bxecp-sel-deny');
},

TimeoutCheck: function(bSetFields)
{
	if (!this.bTimeoutCheck)
	{
		var _this = this;
		this.bTimeoutCheck = true;
		setTimeout(
			function()
			{
				_this.Check(_this.GetCurrent(), false, bSetFields);
				_this.bTimeoutCheck = false;
			},
			200
		);
	}
},

GetMouseXY: function(e)
{
	if (!e)
		e = window.event;

	var x = 0, y = 0;
	if (e.pageX || e.pageY)
	{
		x = e.pageX;
		y = e.pageY;
	}
	else if (e.clientX || e.clientY)
	{
		x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
		y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
	}

	return {x: x, y: y};
}
};

function ECPlDuration(oPlanner)
{
	this.oPlanner = oPlanner;
	this.id = this.oPlanner.id;
	var _this = this;

	this.pInp = BX(this.id + '_pl_dur');
	this.pType = BX(this.id + '_pl_dur_type');
	this.pLock = BX(this.id + '_pl_dur_lock');

	this.bLocked = false;
	this.pLock.onclick = function(){_this.Lock();};
	this.pLock.onmouseover = function(){BX.addClass(this, 'icon-hover');};
	this.pLock.onmouseout = function(){BX.removeClass(this, 'icon-hover');};

	this.pInp.onclick = function(){_this.ShowPopup();};

	this.pType.onchange = this.pInp.onchange = function(){_this.OnChange();};
}

ECPlDuration.prototype = {
Set: function(ms)
{
	var
		days,days2,
		type = 'min',
		val = Math.round(ms / (1000 * 60 * 5)) * 5,
		hours = val / 60;

	if (val <= 0)
		return false;

	if (hours == Math.round(hours))
	{
		val = hours;
		type = 'hour';
		days = hours / this.oPlanner.oTime.count;
		days2 = hours / 24;

		if (days == Math.round(days))
		{
			type = 'day';
			val = days;
		}
		else if(days2 == Math.round(days2))
		{
			type = 'day';
			val = days2;
		}
	}

	this.pInp.value = val;
	this.pType.value = type;
},

Lock: function()
{
	this.bLocked = !this.bLocked;
	if (this.blinkInterval)
		this.blinkInterval = clearInterval(this.blinkInterval);
	this.pLock.className = this.bLocked ? 'bxecpl-lock-dur bxecpl-lock-pushed' : 'bxecpl-lock-dur';
},

LockerBlink: function()
{
	if (!this.bLocked)
		return;
	var
		_this = this,
		pel = this.pLock,
		iter = 0,
		origClass = 'bxecpl-lock-dur bxecpl-lock-pushed',
		warnClass = "bxecpl-lock-dur icon-blink";

	if (this.blinkInterval)
		this.blinkInterval = clearInterval(this.blinkInterval);

	if (origClass != warnClass)
	{
		this.blinkInterval = setInterval(
			function()
			{
				pel.className = (pel.className == warnClass) ? origClass : warnClass;
				if (++iter > 5)
					_this.blinkInterval = clearInterval(_this.blinkInterval);
			},250
		);
	}
},

OnChange: function()
{
	var
		dur, // duration in minutes
		Date = this.oPlanner.GetFieldDate('from', false),
		count = parseInt(this.pInp.value, 10),
		type = this.pType.value;

	if (isNaN(count) || count <= 0)
		count = 1;
	else if (type == 'min')
		count = Math.max(Math.round(count / 5) * 5, 5);

	this.pInp.value = count;

	if (Date)
	{
		if (type == 'min')
			dur = count;
		if (type == 'hour')
			dur = count * 60;
		else if (type == 'day')
			dur = count * 60 * 24;

		Date.setTime(Date.getTime() + dur * 60 * 1000); // Set end of the event
		this.oPlanner.pTo.value = bxFormatDate(Date.getDate(), Date.getMonth() + 1, Date.getFullYear());
		var Ttime = zeroInt(Date.getHours()) + ':' + zeroInt(Date.getMinutes());
		this.oPlanner.pToTime.value = Ttime == '00:00' ? '' : Ttime;
	}

	this.oPlanner.FieldDatesOnChange(false);
},

ShowPopup: function()
{
	var _this = this;
	this.pInp.select();

	if (this.bPopupShowed)
		return this.ClosePopup();

	if (!this.Popup)
		this.CreatePopup();

	this.Popup.style.display = 'block';
	this.bPopupShowed = true;
	this.oPlanner.bDenyClose = true;

	this.Popup.style.zIndex = 1000;
	var pos = BX.pos(this.pInp);
	jsFloatDiv.Show(this.Popup, pos.left + 2, pos.top + 22, 5, false, false);

	// Add events
	BX.bind(document, "keypress", window['BXEC_DURDEF_CLOSE_' + this.id]);
	setTimeout(function(){BX.bind(document, "click", window['BXEC_DURDEF_CLOSE_' + _this.id]);}, 1);
},

ClosePopup: function()
{
	this.Popup.style.display = 'none';
	this.bPopupShowed = false;
	this.oPlanner.bDenyClose = false;
	jsFloatDiv.Close(this.Popup);
	BX.unbind(document, "keypress", window['BXEC_DURDEF_CLOSE_' + this.id]);
	BX.unbind(document, "click", window['BXEC_DURDEF_CLOSE_' + this.id]);
},

CreatePopup: function()
{
	this.arDefValues = [
		{val: 15, type: 'min', title: '15 ' + BXPL_MESS.DurDefMin},
		{val: 30, type: 'min', title: '30 ' + BXPL_MESS.DurDefMin},
		{val: 1, type: 'hour', title: '1 ' + BXPL_MESS.DurDefHour1},
		{val: 2, type: 'hour', title: '2 ' + BXPL_MESS.DurDefHour2},
		{val: 3, type: 'hour', title: '3 ' + BXPL_MESS.DurDefHour2},
		{val: 4, type: 'hour', title: '4 ' + BXPL_MESS.DurDefHour2},
		{val: 1, type: 'day', title: '1 ' + BXPL_MESS.DurDefDay}
	];

	var
		_this = this,
		pRow, i, l = this.arDefValues.length;

	this.Popup = document.body.appendChild(BX.create("DIV", {props: {className: "bxecpl-dur-popup"}}));

	for (i = 0; i < l; i++)
	{
		pRow = this.Popup.appendChild(BX.create("DIV", {props: {id: 'ecpp_' + i, title: this.arDefValues[i].title}, text: this.arDefValues[i].title}));

		pRow.onmouseover = function(){this.className = 'bxecpldur-over';};
		pRow.onmouseout = function(){this.className = '';};
		pRow.onclick = function()
		{
			var cur = _this.arDefValues[this.id.substr('ecpp_'.length)];
			_this.pInp.value = cur.val;
			_this.pType.value = cur.type;
			_this.OnChange();
			_this.ClosePopup();
		};
	}

	window['BXEC_DURDEF_CLOSE_' + this.id] = function(e){_this.ClosePopup();};
}
};


/* DESTINATION */
// Calbacks for destination
	window.BxPlannerSetLinkName = function(name)
	{
		var destLink = BX('event-planner-dest-add-link');
		if (destLink)
			destLink.innerHTML = BX.SocNetLogDestination.getSelectedCount(name) > 0 ? BX.message("BX_FPD_LINK_2") : BX.message("BX_FPD_LINK_1");
	}

	window.BxPlannerSelectCallback = function(item, type, search)
	{
		var type1 = type;
		prefix = 'S';
		if (type == 'sonetgroups')
			prefix = 'SG';
		else if (type == 'groups')
		{
			prefix = 'UA';
			type1 = 'all-users';
		}
		else if (type == 'users')
			prefix = 'U';
		else if (type == 'department')
			prefix = 'DR';

		BX('event-planner-dest-item').appendChild(
			BX.create("span", { attrs : {'data-id' : item.id }, props : {className : "event-grid-dest event-grid-dest-"+type1 }, children: [
				BX.create("input", { attrs : {type : 'hidden', name : 'EVENT_DESTINATION['+prefix+'][]', value : item.id }}),
				BX.create("span", { props : {className : "event-grid-dest-text" }, html : item.name}),
				BX.create("span", { props : {className : "feed-event-del-but"}, attrs: {'data-item-id': item.id, 'data-item-type': type}})
			]})
		);

		BX.onCustomEvent('OnDestinationAddNewItemPlanner', [item]);
		BX('event-planner-dest-input').value = '';
		BxPlannerSetLinkName(plannerDestFormName);
	}

	// remove block
	window.BxPlannerUnSelectCallback = function(item, type, search)
	{
		var elements = BX.findChildren(BX('event-planner-dest-item'), {attribute: {'data-id': '' + item.id + ''}}, true);
		if (elements != null)
		{
			for (var j = 0; j < elements.length; j++)
				BX.remove(elements[j]);
		}

		BX.onCustomEvent('OnDestinationUnselectPlanner');
		BX('event-planner-dest-input').value = '';
		BxPlannerSetLinkName(plannerDestFormName);
	}
	window.BxPlannerOpenDialogCallback = function()
	{
		BX.style(BX('event-planner-dest-input-box'), 'display', 'inline-block');
		BX.style(BX('event-planner-dest-add-link'), 'display', 'none');
		BX.focus(BX('event-planner-dest-input'));
	}

	window.BxPlannerCloseDialogCallback = function()
	{
		if (!BX.SocNetLogDestination.isOpenSearch() && BX('event-planner-dest-input').value.length <= 0)
		{
			BX.style(BX('event-planner-dest-input-box'), 'display', 'none');
			BX.style(BX('event-planner-dest-add-link'), 'display', 'inline-block');
			BxPlannerDisableBackspace();
		}
	}

	window.BxPlannerCloseSearchCallback = function()
	{
		if (!BX.SocNetLogDestination.isOpenSearch() && BX('event-planner-dest-input').value.length > 0)
		{
			BX.style(BX('event-planner-dest-input-box'), 'display', 'none');
			BX.style(BX('event-planner-dest-add-link'), 'display', 'inline-block');
			BX('event-planner-dest-input').value = '';
			BxPlannerDisableBackspace();
		}

	}
	window.BxPlannerDisableBackspace = function(event)
	{
		if (BX.SocNetLogDestination.backspaceDisable || BX.SocNetLogDestination.backspaceDisable != null)
			BX.unbind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable);

		BX.bind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable = function(event){
			if (event.keyCode == 8)
			{
				BX.PreventDefault(event);
				return false;
			}
		});
		setTimeout(function(){
			BX.unbind(window, 'keydown', BX.SocNetLogDestination.backspaceDisable);
			BX.SocNetLogDestination.backspaceDisable = null;
		}, 5000);
	}

	window.BxPlannerSearchBefore = function(event)
	{
		if (event.keyCode == 8 && BX('event-planner-dest-input').value.length <= 0)
		{
			BX.SocNetLogDestination.sendEvent = false;
			BX.SocNetLogDestination.deleteLastItem(plannerDestFormName);
		}

		return true;
	}
	window.BxPlannerSearch = function(event)
	{
		if (event.keyCode == 16 || event.keyCode == 17 || event.keyCode == 18 || event.keyCode == 20 || event.keyCode == 244 || event.keyCode == 224 || event.keyCode == 91)
			return false;

		if (event.keyCode == 13)
		{
			BX.SocNetLogDestination.selectFirstSearchItem(plannerDestFormName);
			return true;
		}
		if (event.keyCode == 27)
		{
			BX('event-planner-dest-input').value = '';
			BX.style(BX('event-planner-dest-add-link'), 'display', 'inline');
		}
		else
		{
			BX.SocNetLogDestination.search(BX('event-planner-dest-input').value, true, plannerDestFormName);
		}

		if (!BX.SocNetLogDestination.isOpenDialog() && BX('event-planner-dest-input').value.length <= 0)
		{
			BX.SocNetLogDestination.openDialog(plannerDestFormName);
		}
		else
		{
			if (BX.SocNetLogDestination.sendEvent && BX.SocNetLogDestination.isOpenDialog())
				BX.SocNetLogDestination.closeDialog();
		}
		if (event.keyCode == 8)
		{
			BX.SocNetLogDestination.sendEvent = true;
		}
		return true;
	}
	/* END DESTINATION */

	window.ECPlanner = ECPlanner;
})(window);
/* End */
;