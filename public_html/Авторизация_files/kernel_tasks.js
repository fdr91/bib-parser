; /* /bitrix/js/tasks/cjstask.js*/
; /* /bitrix/js/tasks/task-quick-popups.js*/
; /* /bitrix/js/tasks/core_planner_handler.js*/
; /* /bitrix/js/tasks/task-iframe-popup.js*/

; /* Start:/bitrix/js/tasks/cjstask.js*/
(function() {

if (BX.CJSTask)
	return;

BX.CJSTask = {
	ajaxUrl    : '/bitrix/components/bitrix/tasks.iframe.popup/ajax.php?SITE_ID=' + BX.message('SITE_ID'),
	sequenceId : 0,
	timers     : {}
};


BX.CJSTask.getMessagePlural = function(n, msgId)
{
	var pluralForm, langId;

	langId = BX.message('LANGUAGE_ID');
	n = parseInt(n);

	if (n < 0)
		n = (-1) * n;

	if (langId)
	{
		switch (langId)
		{
			case 'de':
			case 'en':
				pluralForm = ((n !== 1) ? 1 : 0);
			break;

			case 'ru':
			case 'ua':
				pluralForm = ( ((n%10 === 1) && (n%100 !== 11)) ? 0 : (((n%10 >= 2) && (n%10 <= 4) && ((n%100 < 10) || (n%100 >= 20))) ? 1 : 2) );
			break;

			default:
				pluralForm = 1;
			break;
		}
	}
	else
		pluralForm = 1;

	return (BX.message(msgId + '_PLURAL_' + pluralForm));
};


BX.CJSTask.createItem = function(newTaskData, params)
{
	var params = params || null;
	var columnsIds = null;

	if (params.columnsIds)
		columnsIds = params.columnsIds;

	var postData = {
		sessid : BX.message('bitrix_sessid'),
		batch  : [
			{
				operation : 'CTaskItem::add()',
				taskData  :  newTaskData
			},
			{
				operation : 'CTaskItem::getTaskData()',
				taskData  : {
					ID : '#RC#$arOperationsResults#-1#justCreatedTaskId'
				}
			},
			{
				operation : 'CTaskItem::getAllowedTaskActions()',
				taskData  : {
					ID : '#RC#$arOperationsResults#-1#returnValue#ID'
				}
			},
			{
				operation : 'NOOP'
			},
			{
				operation : 'CTaskItem::getAllowedTaskActionsAsStrings()',
				taskData  : {
					ID : '#RC#$arOperationsResults#-3#returnValue#ID'
				}
			},
			{
				operation : 'tasksRenderJSON() && tasksRenderListItem()',
				taskData  : {
					ID : '#RC#$arOperationsResults#-4#returnValue#ID'
				},
				columnsIds : columnsIds
			}
		]
	};

	BX.ajax({
		method      : 'POST',
		dataType    : 'json',
		url         :  BX.CJSTask.ajaxUrl,
		data        :  postData,
		processData :  true,
		onsuccess   : (function(params) {
			var callbackOnSuccess = false;
			var callbackOnFailure = false;

			if (params)
			{
				if (params.callback)
					callbackOnSuccess = params.callback;

				if (params.callbackOnFailure)
					callbackOnFailure = params.callbackOnFailure;
			}

			return function(reply) {
				if ((reply.status === 'success') && (!!callbackOnSuccess))
				{
					var precachedData = {
						taskData                    : reply['data'][1]['returnValue'],
						allowedTaskActions          : reply['data'][2]['returnValue'],
						allowedTaskActionsAsStrings : reply['data'][4]['returnValue']
					}

					var oTask = new BX.CJSTask.Item(
						reply['data'][1]['returnValue']['ID'],
						precachedData
					);

					var legacyDataFormat = BX.parseJSON(reply['data'][5]['returnValue']['tasksRenderJSON']);
					var legacyHtmlTaskItem = reply['data'][5]['returnValue']['tasksRenderListItem'];

					callbackOnSuccess(oTask, precachedData, legacyDataFormat, legacyHtmlTaskItem);
				}
				else if ((reply.status !== 'success') && (!!callbackOnFailure))
				{
					var errMessages = [];
					var errorsCount = 0;

					if (
						(reply.repliesCount > 0)
						&& reply.data[reply.repliesCount - 1].hasOwnProperty('errors')
					)
					{
						errorsCount = reply.data[reply.repliesCount - 1].errors.length;

						for (var i = 0; i < errorsCount; i++)
							errMessages.push(reply.data[reply.repliesCount - 1].errors[i]['text']);
					}

					callbackOnFailure({
						rawReply    : reply,
						status      : reply.status,
						errMessages : errMessages
					});
				}
			}
		})(params)
	});
};


BX.CJSTask.Item = function(taskId, precachedData)
{
	if ( ! taskId )
		throw ('taskId must be set');

	if ( ! (taskId >= 1) )
		throw ('taskId must be >= 1');

	this.taskId = taskId;
	this.cachedData = {
		taskData                    : false,
		allowedTaskActions          : false,
		allowedTaskActionsAsStrings : false
	};

	if (precachedData)
	{
		if (precachedData.taskData)
			this.cachedData.taskData = precachedData.taskData;

		if (precachedData.allowedTaskActions)
			this.cachedData.allowedTaskActions = precachedData.allowedTaskActions;

		if (precachedData.allowedTaskActionsAsStrings)
			this.cachedData.allowedTaskActionsAsStrings = precachedData.allowedTaskActionsAsStrings;
	}


	this.getCachedData = function()
	{
		return (this.cachedData);
	};


	this.refreshCache = function(params)
	{
		var params = params || null;

		var postData = {
			sessid : BX.message('bitrix_sessid'),
			batch  : [
				{
					operation : 'CTaskItem::getTaskData()',
					taskData  : {
						ID : this.taskId
					}
				},
				{
					operation : 'CTaskItem::getAllowedTaskActions()',
					taskData  : {
						ID : this.taskId
					}
				},
				{
					operation : 'CTaskItem::getAllowedTaskActionsAsStrings()',
					taskData  : {
						ID : this.taskId
					}
				}
			]
		};

		BX.ajax({
			method      : 'POST',
			dataType    : 'json',
			url         :  BX.CJSTask.ajaxUrl,
			data        :  postData,
			processData :  true,
			onsuccess   : (function(params, objTask) {
				var callback = false;

				if (params && params.callback)
					callback = params.callback;

				return function(reply) {
					objTask.cachedData = {
						taskData                    : reply['data'][0]['returnValue'],
						allowedTaskActions          : reply['data'][1]['returnValue'],
						allowedTaskActionsAsStrings : reply['data'][2]['returnValue']
					}

					if (!!callback)
						callback(objTask.cachedData);
				}
			})(params, this)
		});
	};


	this.complete = function(params)
	{
		var postData = {
			sessid : BX.message('bitrix_sessid'),
			batch  : [
				{
					operation : 'CTaskItem::complete()',
					taskData  : {
						ID : this.taskId
					}
				},
				{
					operation : 'CTaskItem::getTaskData()',
					taskData  : {
						ID : this.taskId
					}
				},
				{
					operation : 'CTaskItem::getAllowedTaskActions()',
					taskData  : {
						ID : '#RC#$arOperationsResults#-1#returnValue#ID'
					}
				},
				{
					operation : 'CTaskItem::getAllowedTaskActionsAsStrings()',
					taskData  : {
						ID : '#RC#$arOperationsResults#-2#returnValue#ID'
					}
				}
			]
		};

		BX.ajax({
			method      : 'POST',
			dataType    : 'json',
			url         :  BX.CJSTask.ajaxUrl,
			data        :  postData,
			processData :  true,
			onsuccess   : (function(params) {
				var callbackOnSuccess = false;
				var callbackOnFailure = false;

				if (params)
				{
					if (params.callbackOnSuccess)
						callbackOnSuccess = params.callbackOnSuccess;

					if (params.callbackOnFailure)
						callbackOnFailure = params.callbackOnFailure;
				}

				return function(reply) {
					if ((reply.status === 'success') && (!!callbackOnSuccess))
					{
						var precachedData = {
							taskData                    : reply['data'][1]['returnValue'],
							allowedTaskActions          : reply['data'][2]['returnValue'],
							allowedTaskActionsAsStrings : reply['data'][3]['returnValue']
						}

						var oTask = new BX.CJSTask.Item(
							reply['data'][1]['returnValue']['ID'],
							precachedData
						);

						callbackOnSuccess(oTask);
					}
					else if ((reply.status !== 'success') && (!!callbackOnFailure))
					{
						var errMessages = [];
						var errorsCount = 0;

						if (
							(reply.repliesCount > 0)
							&& reply.data[reply.repliesCount - 1].hasOwnProperty('errors')
						)
						{
							errorsCount = reply.data[reply.repliesCount - 1].errors.length;

							for (var i = 0; i < errorsCount; i++)
								errMessages.push(reply.data[reply.repliesCount - 1].errors[i]['text']);
						}

						callbackOnFailure({
							rawReply    : reply,
							status      : reply.status,
							errMessages : errMessages
						});
					}
				}
			})(params)
		});
	};


	this.startExecutionOrRenewAndStart = function(params)
	{
		var postData = {
			sessid : BX.message('bitrix_sessid'),
			batch  : [
				{
					operation : 'CTaskItem::startExecutionOrRenewAndStart',
					taskData  : {
						ID : this.taskId
					}
				},
				{
					operation : 'CTaskItem::getTaskData()',
					taskData  : {
						ID : this.taskId
					}
				},
				{
					operation : 'CTaskItem::getAllowedTaskActions()',
					taskData  : {
						ID : '#RC#$arOperationsResults#-1#returnValue#ID'
					}
				},
				{
					operation : 'CTaskItem::getAllowedTaskActionsAsStrings()',
					taskData  : {
						ID : '#RC#$arOperationsResults#-2#returnValue#ID'
					}
				}
			]
		};

		BX.ajax({
			method      : 'POST',
			dataType    : 'json',
			url         :  BX.CJSTask.ajaxUrl,
			data        :  postData,
			processData :  true,
			onsuccess   : (function(params) {
				var callbackOnSuccess = false;
				var callbackOnFailure = false;

				if (params)
				{
					if (params.callbackOnSuccess)
						callbackOnSuccess = params.callbackOnSuccess;

					if (params.callbackOnFailure)
						callbackOnFailure = params.callbackOnFailure;
				}

				return function(reply) {
					if ((reply.status === 'success') && (!!callbackOnSuccess))
					{
						var precachedData = {
							taskData                    : reply['data'][1]['returnValue'],
							allowedTaskActions          : reply['data'][2]['returnValue'],
							allowedTaskActionsAsStrings : reply['data'][3]['returnValue']
						}

						var oTask = new BX.CJSTask.Item(
							reply['data'][1]['returnValue']['ID'],
							precachedData
						);

						callbackOnSuccess(oTask);
					}
					else if ((reply.status !== 'success') && (!!callbackOnFailure))
					{
						var errMessages = [];
						var errorsCount = 0;

						if (
							(reply.repliesCount > 0)
							&& reply.data[reply.repliesCount - 1].hasOwnProperty('errors')
						)
						{
							errorsCount = reply.data[reply.repliesCount - 1].errors.length;

							for (var i = 0; i < errorsCount; i++)
								errMessages.push(reply.data[reply.repliesCount - 1].errors[i]['text']);
						}

						callbackOnFailure({
							rawReply    : reply,
							status      : reply.status,
							errMessages : errMessages
						});
					}
				}
			})(params)
		});
	};


	/**
	 * data is array with elements MINUTES, COMMENT_TEXT
	 */
	this.addElapsedTime = function(data, callbacks)
	{
		var elapsedTimeData = {
			TASK_ID      : this.taskId,
			MINUTES      : data.MINUTES,
			COMMENT_TEXT : data.COMMENT_TEXT
		};

		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation       : 'CTaskItem::addElapsedTime()',
					elapsedTimeData :  elapsedTimeData
				}
			],
			callbacks
		);

		return (batchId);
	};


	this.checklistAddItem = function(title, callbacks)
	{
		var arFields = {
			TITLE : title
		};

		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation     : 'CTaskCheckListItem::add()',
					checklistData :  arFields,
					taskId        :  this.taskId
				}
			],
			callbacks
		);

		return (batchId);
	};


	this.checklistRename = function(id, newTitle, callbacks)
	{
		var arFields = {
			TITLE : newTitle
		};

		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation     : 'CTaskCheckListItem::update()',
					checklistData :  arFields,
					itemId        :  id,
					taskId        :  this.taskId
				}
			],
			callbacks
		);

		return (batchId);
	};


	this.checklistComplete = function(id, callbacks)
	{
		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation : 'CTaskCheckListItem::complete()',
					itemId    :  id,
					taskId    :  this.taskId
				}
			],
			callbacks
		);

		return (batchId);
	};


	this.checklistRenew = function(id, callbacks)
	{
		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation : 'CTaskCheckListItem::renew()',
					itemId    :  id,
					taskId    :  this.taskId
				}
			],
			callbacks
		);

		return (batchId);
	};


	this.checklistDelete = function(id, callbacks)
	{
		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation : 'CTaskCheckListItem::delete()',
					itemId    :  id,
					taskId    :  this.taskId
				}
			],
			callbacks
		);

		return (batchId);
	};


	this.checklistMoveAfterItem = function(id, insertAfterItemId, callbacks)
	{
		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation         : 'CTaskCheckListItem::moveAfterItem()',
					itemId            :  id,
					taskId            :  this.taskId,
					insertAfterItemId :  insertAfterItemId
				}
			],
			callbacks
		);

		return (batchId);
	};


	this.stopWatch = function(callbacks)
	{
		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation : 'CTaskItem::stopWatch()',
					taskData  : {
						ID : this.taskId
					}
				}
			],
			callbacks
		);

		return (batchId);
	};


	this.startWatch = function(callbacks)
	{
		var batchId = BX.CJSTask.batchOperations(
			[
				{
					operation : 'CTaskItem::startWatch()',
					taskData  : {
						ID : this.taskId
					}
				}
			],
			callbacks
		);

		return (batchId);
	};
};


BX.CJSTask.TimerManager = function(taskId)
{
	if ( ! taskId )
		throw ('taskId must be set');

	if ( ! (taskId >= 1) )
		throw ('taskId must be >= 1');

	this.taskId = taskId;

	this.__private = {
		startOrStop : function(operation, taskId, callbacks)
		{
			var batchId = BX.CJSTask.batchOperations(
				[
					{
						operation : operation,
						taskData  : {
							ID : taskId
						}
					},
					{
						operation : 'CTaskItem::getTaskData()',
						taskData  : {
							ID : '#RC#$arOperationsResults#-1#requestedTaskId'
						}
					},
					{
						operation : 'CTaskTimerManager::getLastTimer()'
					}
				],
				callbacks
			);

			return (batchId);
		}
	};


	this.start = function(callbacks)
	{
		var batchId = this.__private.startOrStop('CTaskTimerManager::start()', this.taskId, callbacks);
		return (batchId);
	};


	this.stop = function(callbacks)
	{
		var batchId = this.__private.startOrStop('CTaskTimerManager::stop()', this.taskId, callbacks);
		return (batchId);
	};
};


BX.CJSTask.setTimerCallback = function(timerCodeName, callback, milliseconds)
{
	if (BX.CJSTask[timerCodeName])
	{
		window.clearInterval(BX.CJSTask[timerCodeName]);
		BX.CJSTask[timerCodeName] = null;
	}

	if (callback !== null)
		BX.CJSTask[timerCodeName] = window.setInterval(callback, milliseconds);
};


BX.CJSTask.formatUsersNames = function(arUsersIds, params)
{
	var params = params || null;

	var userId = null;
	var batch  = [];

	for (var key in arUsersIds)
	{
		userId = arUsersIds[key];

		batch.push({
			operation : 'CUser::FormatName()',
			userData  :  { ID : userId }
		});
	}

	var postData = {
		sessid : BX.message('bitrix_sessid'),
		batch  : batch
	};

	BX.ajax({
		method      : 'POST',
		dataType    : 'json',
		url         :  BX.CJSTask.ajaxUrl,
		data        :  postData,
		processData :  true,
		onsuccess   : (function(params) {
			var callback = false;

			if (params && params.callback)
				callback = params.callback;

			return function(reply) {
				if (!!callback)
				{
					var replyItem = null;
					var result = {};
					var repliesCount = reply['repliesCount'];

					for (var i = 0; i < repliesCount; i++)
					{
						replyItem = reply['data'][i];
						result['u' + replyItem['requestedUserId']] = replyItem['returnValue'];
					}

					callback(result);
				}
			}
		})(params)
	});
}


BX.CJSTask.getGroupsData = function(arGroupsIds, params)
{
	var params = params || null;

	var groupId = null;
	var batch   = [];

	for (var key in arGroupsIds)
	{
		groupId = arGroupsIds[key];

		batch.push({
			operation : 'CSocNetGroup::GetByID()',
			groupData  :  { ID : groupId }
		});
	}

	var postData = {
		sessid : BX.message('bitrix_sessid'),
		batch  : batch
	};

	BX.ajax({
		method      : 'POST',
		dataType    : 'json',
		url         :  BX.CJSTask.ajaxUrl,
		data        :  postData,
		processData :  true,
		onsuccess   : (function(params) {
			var callback = false;

			if (params && params.callback)
				callback = params.callback;

			return function(reply) {
				if (!!callback)
				{
					var replyItem = null;
					var result = {};
					var repliesCount = reply['repliesCount'];

					for (var i = 0; i < repliesCount; i++)
					{
						replyItem = reply['data'][i];
						result[replyItem['requestedGroupId']] = replyItem['returnValue'];
					}

					callback(result);
				}
			}
		})(params)
	});
}


BX.CJSTask.batchOperations = function(batch, callbacks, sync)
{
	var callbacks = callbacks || null;
	var sync = sync || false;
	var batchId   = 'batch_sequence_No_' + (++BX.CJSTask.sequenceId);

	var postData = {
		sessid  : BX.message('bitrix_sessid'),
		batch   : batch,
		batchId : batchId
	};

	BX.ajax({
		method      : 'POST',
		dataType    : 'json',
		url         :  BX.CJSTask.ajaxUrl,
		data        :  postData,
		async       :  !sync,
		processData :  true,
		onsuccess   : (function(callbacks) {
			var callbackOnSuccess = false;
			var callbackOnFailure = false;

			if (callbacks)
			{
				if (callbacks.callbackOnSuccess)
					callbackOnSuccess = callbacks.callbackOnSuccess;

				if (callbacks.callbackOnFailure)
					callbackOnFailure = callbacks.callbackOnFailure;
			}

			return function(reply) {
				if ((reply.status === 'success') && (!!callbackOnSuccess))
				{
					callbackOnSuccess({
						rawReply : reply,
						status   : reply.status
					});
				}
				else if ((reply.status !== 'success') && (!!callbackOnFailure))
				{
					var errMessages = [];
					var errorsCount = 0;

					if (
						(reply.repliesCount > 0)
						&& reply.data[reply.repliesCount - 1].hasOwnProperty('errors')
					)
					{
						errorsCount = reply.data[reply.repliesCount - 1].errors.length;

						for (var i = 0; i < errorsCount; i++)
							errMessages.push(reply.data[reply.repliesCount - 1].errors[i]['text']);
					}

					callbackOnFailure({
						rawReply    : reply,
						status      : reply.status,
						errMessages : errMessages
					});
				}
			}
		})(callbacks)
	});

	return (batchId);
}

})();

/* End */
;
; /* Start:/bitrix/js/tasks/task-quick-popups.js*/
(function() {

if (!BX.Tasks)
	BX.Tasks = {};

if (BX.Tasks.lwPopup)
	return;

BX.Tasks.lwPopup = {
	ajaxUrl : '/bitrix/components/bitrix/tasks.list/ajax.php',
	onTaskAdded : null,
	onTaskAddedMultiple : null,
	loggedInUserId : null,
	loggedInUserFormattedName : null,

	garbageAreaId : 'garbageAreaId_id',
	functions : {},
	functionsCount : 0,
	firstRunDone : false,

	createForm : {
		objPopup    : null,
		objTemplate : null,
		callbacks   : {
			onAfterPopupCreated : null,
			onBeforePopupShow   : null,
			onAfterPopupShow    : null,
			onAfterEditorInited : null,
			onPopupClose        : null
		}
	},

	anyForm : [],
	anyFormsCount : 0,


	registerForm : function(params)
	{
		params = params || { callbacks : {} };

		var anyFormIndex = this.anyFormsCount++;

		this.anyForm[anyFormIndex] = {
			formIndex   : anyFormIndex,
			objPopup    : null,
			objTemplate : null,
			callbacks   : params.callbacks
		};

		return (this.anyForm[anyFormIndex]);
	},


	__runAnyFormCallback : function (formIndex, callbackName, args)
	{
		args = args || [];

		if ( ! this.anyForm[formIndex] )
			throw Error('Form with index ' + formIndex + ' not exists');

		if (
			BX.Tasks.lwPopup.anyForm[formIndex].callbacks.hasOwnProperty(callbackName)
			&& (BX.Tasks.lwPopup.anyForm[formIndex].callbacks[callbackName] !== null)
		)
		{
			BX.Tasks.lwPopup.anyForm[formIndex].callbacks[callbackName].apply(
				BX.Tasks.lwPopup.anyForm[formIndex].objTemplate,
				args
			);
		}
	},


	showForm : function(formIndex, pData)
	{
		pData = typeof pData !== 'undefined' ? pData : {};

		if ( ! this.anyForm[formIndex] )
			throw Error('Form with index ' + formIndex + ' not exists');

		var oForm = this.anyForm[formIndex];

		BX.Tasks.lwPopup.__firstRun();

		var isPopupJustCreated = false;

		if (oForm.objPopup === null)
		{
			this.buildForm(formIndex, pData);

			isPopupJustCreated = true;
		}

		this.__runAnyFormCallback(
			formIndex,
			'onBeforePopupShow',
			[ pData, { isPopupJustCreated: isPopupJustCreated } ]
		);

		oForm.objPopup.show();
	},


	buildForm : function(formIndex, pData, zIndexIn)
	{
		var zIndex = -110;

		pData = typeof pData !== 'undefined' ? pData : {};

		if (typeof zIndexIn !== 'undefined')
			zIndex = zIndexIn;

		if ( ! this.anyForm[formIndex] )
			throw Error('Form with index ' + formIndex + ' not exists');

		var oForm = this.anyForm[formIndex];

		BX.Tasks.lwPopup.__firstRun();

		oForm.objPopup = new BX.PopupWindow(
			'bx-tasks-quick-popup-anyForm-' + formIndex,
			null,
			{
				zIndex       : zIndex,
				autoHide     : false,
				buttons      : oForm.objTemplate.prepareButtons(),
				closeByEsc   : false,
				overlay      : true,
				draggable    : true,
				bindOnResize : false,
				titleBar     : oForm.objTemplate.prepareTitleBar(),
				closeIcon    : { right : "12px", top : "10px"},
				events       : {
					onPopupClose : function() {
						BX.Tasks.lwPopup.__runAnyFormCallback(
							formIndex,
							'onPopupClose',
							[]
						);
					},
					onPopupFirstShow : function() {
						BX.Tasks.lwPopup.__runAnyFormCallback(
							formIndex,
							'onPopupFirstShow',
							[]
						);
					},
					onPopupShow : function() {
						BX.Tasks.lwPopup.__runAnyFormCallback(
							formIndex,
							'onPopupShow',
							[]
						);
					},
					onAfterPopupShow : function() {
						BX.Tasks.lwPopup.__runAnyFormCallback(
							formIndex,
							'onAfterPopupShow',
							[]
						);
					}
				},
				content : oForm.objTemplate.prepareContent(pData)
			}
		);

		this.__runAnyFormCallback(
			formIndex,
			'onAfterPopupCreated',
			[pData]
		);
	},


	__runCreateFormCallback : function (callbackName, args)
	{
		args = args || [];

		if (
			BX.Tasks.lwPopup.createForm.callbacks.hasOwnProperty(callbackName)
			&& (BX.Tasks.lwPopup.createForm.callbacks[callbackName] !== null)
		)
		{
			BX.Tasks.lwPopup.createForm.callbacks[callbackName].apply(
				BX.Tasks.lwPopup.createForm.objTemplate,
				args
			);
		}
	},


	showCreateForm : function(pTaskData)
	{
		pTaskData = typeof pTaskData !== 'undefined' ? pTaskData : {};

		BX.Tasks.lwPopup.__firstRun();

		if ( ! pTaskData.RESPONSIBLE_ID )
		{
			pTaskData.RESPONSIBLE_ID = BX.Tasks.lwPopup.loggedInUserId;
			pTaskData['META:RESPONSIBLE_FORMATTED_NAME'] = BX.Tasks.lwPopup.loggedInUserFormattedName;
		}
		else if (
			(pTaskData.RESPONSIBLE_ID == BX.Tasks.lwPopup.loggedInUserId)
			&& ( ! pTaskData.hasOwnProperty('META:RESPONSIBLE_FORMATTED_NAME') )
		)
		{
			pTaskData['META:RESPONSIBLE_FORMATTED_NAME'] = BX.Tasks.lwPopup.loggedInUserFormattedName;
		}

		var isPopupJustCreated = false;

		if (BX.Tasks.lwPopup.createForm.objPopup === null)
		{
			BX.Tasks.lwPopup.createForm.objPopup = new BX.PopupWindow(
				'bx-tasks-quick-popup-create-new-task',
				null,
				{
					zIndex       : -110,
					autoHide     : false,
					buttons      : BX.Tasks.lwPopup.createForm.objTemplate.prepareButtons(),
					closeByEsc   : false,
					overlay      : true,
					draggable    : true,
					bindOnResize : false,
					titleBar     : BX.Tasks.lwPopup.createForm.objTemplate.prepareTitleBar(),
					closeIcon    : { right : "12px", top : "10px"},
					events       : {
						onPopupClose : function() {
							BX.Tasks.lwPopup.__runCreateFormCallback(
								'onPopupClose',
								[]
							);
						},
						onPopupFirstShow : function() {
						},
						onPopupShow : function() {
						},
						onAfterPopupShow : function() {
							if (
								BX('bx-panel')
								&& (parseInt(BX.Tasks.lwPopup.createForm.objPopup.popupContainer.style.top) < 147)
							)
							{
								BX.Tasks.lwPopup.createForm.objPopup.popupContainer.style.top = 147 + "px";
							}

							BX.Tasks.lwPopup.__runCreateFormCallback(
								'onAfterPopupShow',
								[]
							);
						}
					},
					content : BX.Tasks.lwPopup.createForm.objTemplate.prepareContent(pTaskData)
				}
			);

			BX.Tasks.lwPopup.__runCreateFormCallback(
				'onAfterPopupCreated',
				[pTaskData]
			);

			isPopupJustCreated = true;
		}

		BX.Tasks.lwPopup.__runCreateFormCallback(
			'onBeforePopupShow',
			[ pTaskData, { isPopupJustCreated: isPopupJustCreated } ]
		);

		BX.Tasks.lwPopup.createForm.objPopup.show();
	},


	_createTask : function(params)
	{
		params = params || {};

		var onceMore = false;
		var callbackOnSuccess = null;
		var callbackOnFailure = null;
		var columnsIds = null;

		var taskData = {};
		if (params.hasOwnProperty('taskData'))
			taskData = params.taskData;

		if (params.hasOwnProperty('onceMore'))
			onceMore = params.onceMore;

		if (params.hasOwnProperty('columnsIds'))
			columnsIds = params.columnsIds;

		if (params.hasOwnProperty('callbackOnSuccess'))
			callbackOnSuccess = params.callbackOnSuccess;

		if (params.hasOwnProperty('callbackOnFailure'))
			callbackOnFailure = params.callbackOnFailure;

		if ( ! taskData.hasOwnProperty('TITLE') )
			taskData.TITLE = '';

		if ( ! taskData.hasOwnProperty('RESPONSIBLE_ID') )
			taskData.RESPONSIBLE_ID = this.loggedInUserId;

		BX.CJSTask.createItem(taskData, {
			columnsIds : columnsIds,
			callback: (function(onceMore, callbackOnSuccess) {
				return function(oTask, precachedData, legacyDataFormat, legacyHtmlTaskItem) {
					var newDataPack = {
						oTask                       : oTask,
						taskData                    : precachedData.taskData,
						allowedTaskActions          : precachedData.allowedTaskActions,
						allowedTaskActionsAsStrings : precachedData.allowedTaskActionsAsStrings,
						params                      : { onceMore : onceMore }
					};

					if (callbackOnSuccess)
						callbackOnSuccess(newDataPack);

					if (BX.Tasks.lwPopup.onTaskAdded && (onceMore === false))
						BX.Tasks.lwPopup.onTaskAdded(legacyDataFormat, null, null, newDataPack, legacyHtmlTaskItem);
					else if (BX.Tasks.lwPopup.onTaskAddedMultiple && (onceMore === true))
						BX.Tasks.lwPopup.onTaskAddedMultiple(legacyDataFormat, null, null, newDataPack, legacyHtmlTaskItem);
				};
			})(onceMore, callbackOnSuccess),
			callbackOnFailure : (function(callbackOnFailure){
				return function(data)
				{
					if (callbackOnFailure)
						callbackOnFailure(data);
				}
			})(callbackOnFailure)
		});
	},


	__initSelectors : function(arParams)
	{
		var cnt = arParams.length;

		var bUserSelectorPresents = false;

		BX.Tasks.lwPopup.__firstRun();

		for (var i=0; i<cnt; i++)
		{
			if (arParams[i]['requestedObject'] === 'intranet.user.selector.new')
			{
				bUserSelectorPresents = true;
				break;
			}
		}

		var userSelectorAreaId = null;
		if (bUserSelectorPresents)
		{
			// use new function number for unique id
			var newFuncIndex = BX.Tasks.lwPopup.functionsCount++;
			BX.Tasks.lwPopup.functions['f' + newFuncIndex] = function(){};

			userSelectorAreaId =  BX.Tasks.lwPopup.garbageAreaId 
				+ '__userSelectors_' + newFuncIndex + '_loadedHtml';
			BX(BX.Tasks.lwPopup.garbageAreaId).appendChild(
				BX.create(
					'DIV',
					{
						props: { id: userSelectorAreaId }
					}
				)
			);
		}

		var ajaxData  = {
			sessid        : BX.message('bitrix_sessid'),
			requestsCount : cnt
		};
		var sData     = [];
		var selectors = [];

		for (var i=0; i<cnt; i++)
		{
			if (arParams[i]['requestedObject'] === 'intranet.user.selector.new')
				sData[i] = this.__prepareUserSelectorsData(arParams[i]);
			else if (arParams[i]['requestedObject'] === 'socialnetwork.group.selector')
				sData[i] = this.__prepareGroupsSelectorsData(arParams[i]);
			else if (arParams[i]['requestedObject'] === 'LHEditor')
				sData[i] = this.__prepareLheData(arParams[i]);
			else if (arParams[i]['requestedObject'] === 'system.field.edit::CRM')
			{
				sData[i] = this.__prepareUserFieldData(arParams[i]);

				for (var key in sData[i]['postData'])
					ajaxData[key] = sData[i]['postData'][key];
			}
			else if (arParams[i]['requestedObject'] === 'system.field.edit::WEBDAV')
			{
				sData[i] = this.__prepareUserFieldDataWebdav(arParams[i]);

				for (var key in sData[i]['postData'])
					ajaxData[key] = sData[i]['postData'][key];
			}

			ajaxData['data_' + i] = sData[i]['ajaxParams'];
			selectors[i]          = sData[i]['object'];
		}

		BX.ajax({
			method      : 'POST',
			dataType    : 'html',
			url         : '/bitrix/components/bitrix/tasks.iframe.popup/ajax_loader.php?SITE_ID=' + BX.message('SITE_ID'),
			data        :  ajaxData,
			processData :  true,
			autoAuth    :  true,
			onsuccess   : (function(selectors, userSelectorAreaId, bUserSelectorPresents){
				return function(reply)
				{
					if (bUserSelectorPresents)
						BX(userSelectorAreaId).innerHTML = reply;

					var cnt = selectors.length;

					for (var i=0; i<cnt; i++)
					{
						if (selectors[i].hasOwnProperty('onLoadedViaAjax'))
							selectors[i].onLoadedViaAjax();
					}
				};
			})(selectors, userSelectorAreaId, bUserSelectorPresents)
		});

		return (selectors);
	},


	__prepareUserFieldData : function(params)
	{
		var newFuncIndex    =  BX.Tasks.lwPopup.functionsCount++;
		var nameContainerId = 'OBJ_TASKS_CONTAINER_NAME_ID_' + newFuncIndex;
		var dataContainerId = 'OBJ_TASKS_CONTAINER_DATA_ID_' + newFuncIndex;
		var ajaxParams      = {
			requestedObject : 'system.field.edit::CRM',
			userFieldName   :  params['userFieldName'],
			taskId          :  params['taskId'],
			nameContainerId :  nameContainerId,
			dataContainerId :  dataContainerId,
			values          :  params['value']
		};

		var newArr = [];
		newArr.push.apply(newArr, params['value']);

		BX.Tasks.lwPopup.functions['f' + newFuncIndex] = {
			allParams       : params,
			ajaxParams      : ajaxParams,
			ready           : false,
			available       : null,
			timeoutId       : null,
			valuesBuffer    : newArr,
			nameContainerId : nameContainerId,
			dataContainerId : dataContainerId,
			onLoadedViaAjax : function()
			{
				if (BX(this.nameContainerId))
					this.available = true;
				else
					this.available = false;

				if ( ! this.available )
					return (false);

				var fieldLabel = BX(this.nameContainerId).innerHTML;
				BX.remove(BX(this.nameContainerId));
				this.allParams.callbackOnRedraw(fieldLabel, this.dataContainerId);
				this.ready = true;
			},
			getValue : function()
			{
				var itemsIds = [];

				if (this.ready === true)
				{
					var arItems = document.getElementsByName('UF_CRM_TASK[]');

					if (arItems)
					{
						var cnt = arItems.length;

						for (var i=0; i<cnt; i++)
							itemsIds.push(arItems[i].value);
					}
				}
				else
				{
					itemsIds = this.valuesBuffer;
				}

				return (itemsIds);
			},
			setValue : function(values)
			{
				// Skip data set, if it's the same
				if (this.valuesBuffer.length === values.length)
				{
					//slice so we do not effect the original
					//sort makes sure they are in order
					//join makes it a string so we can do a string compare
					var cA = this.valuesBuffer.slice().sort().join(";"); 
					var cB = values.slice().sort().join(";");

					if (cA === cB)
						return;		// arrays are equal
				}

				this.valuesBuffer = [];
				this.valuesBuffer.push.apply(this.valuesBuffer, values);
				this.__delayedSetContent(30);
			},
			__delayedSetContent : function(delay)
			{
				if (this.available === false)
					return (false);

				if (this.ready === false)
				{
					if (this.timeoutId !== null)
						window.clearTimeout(this.timeoutId);

					this.timeoutId = window.setTimeout(
						function()
						{
							var newDelay = delay + 100;

							if (delay < 30)
								newDelay = 30;
							else if (delay > 500)
								newDelay = 500;

							BX.Tasks.lwPopup.functions['f' + newFuncIndex].__delayedSetContent(newDelay);
						},
						delay
					);
				}
				else
				{
					if (BX(this.nameContainerId))
						BX.remove(BX(this.nameContainerId));

					if (BX(this.dataContainerId))
						BX.remove(BX(this.dataContainerId));

					var urlParams = '';
					var cnt = this.valuesBuffer.length;
					for (var i=0; i<cnt; i++)
						urlParams = urlParams + '&UF_CRM_TASK[]=' + this.valuesBuffer[i];

					// Reload user field from server
					var ajaxData  = {
						sessid        : BX.message('bitrix_sessid'),
						requestsCount : 1,
						data_0        : this.ajaxParams
					};
					BX.ajax({
						method      : 'POST',
						dataType    : 'html',
						url         : '/bitrix/components/bitrix/tasks.iframe.popup/ajax_loader.php?SITE_ID=' + BX.message('SITE_ID') + urlParams,
						data        :  ajaxData,
						processData :  true,
						autoAuth    :  true,
						//async       :  false,
						onsuccess   : (function(selfObj){
							return function(reply)
							{
								BX(BX.Tasks.lwPopup.garbageAreaId).appendChild(
									BX.create(
										'div',
										{
											html : reply
										}
									)
								);

								selfObj.ready = true;

								var fieldLabel = BX(selfObj.nameContainerId).innerHTML;
								BX.remove(BX(selfObj.nameContainerId));
								selfObj.allParams.callbackOnRedraw(fieldLabel, selfObj.dataContainerId);
							};
						})(this)
					});
				}
			}
		};

		var rc = {
			object     : BX.Tasks.lwPopup.functions['f' + newFuncIndex],
			ajaxParams : ajaxParams,
			postData   : {
				UF_CRM_TASK : params['value']
			}
		};

		return (rc);
	},


	__prepareUserFieldDataWebdav : function(params)
	{
		var newFuncIndex    =  BX.Tasks.lwPopup.functionsCount++;
		var nameContainerId = 'OBJ_TASKS_CONTAINER_NAME_ID_' + newFuncIndex;
		var dataContainerId = 'OBJ_TASKS_CONTAINER_DATA_ID_' + newFuncIndex;
		var ajaxParams      = {
			requestedObject : 'system.field.edit::WEBDAV',
			userFieldName   :  params['userFieldName'],
			taskId          :  params['taskId'],
			nameContainerId :  nameContainerId,
			dataContainerId :  dataContainerId,
			values          :  params['value']
		};

		var newArr = [];
		newArr.push.apply(newArr, params['value']);

		BX.Tasks.lwPopup.functions['f' + newFuncIndex] = {
			allParams       : params,
			ajaxParams      : ajaxParams,
			ready           : false,
			available       : null,
			timeoutId       : null,
			valuesBuffer    : newArr,
			nameContainerId : nameContainerId,
			dataContainerId : dataContainerId,
			onLoadedViaAjax : function()
			{
				if (BX(this.nameContainerId))
					this.available = true;
				else
					this.available = false;

				if ( ! this.available )
					return (false);

				var fieldLabel = BX(this.nameContainerId).innerHTML;
				BX.remove(BX(this.nameContainerId));
				this.allParams.callbackOnRedraw(fieldLabel, this.dataContainerId);
				this.ready = true;
			},
			getValue : function()
			{
				var itemsIds = [];

				if (this.ready === true)
				{
					var arItems = document.getElementsByName('UF_TASK_WEBDAV_FILES[]');

					if (arItems)
					{
						var cnt = arItems.length;

						for (var i=0; i<cnt; i++)
							itemsIds.push(arItems[i].value);
					}
				}
				else
				{
					itemsIds = this.valuesBuffer;
				}

				return (itemsIds);
			},
			setValue : function(values)
			{
				// Skip data set, if it's the same
				if (this.valuesBuffer.length === values.length)
				{
					//slice so we do not effect the original
					//sort makes sure they are in order
					//join makes it a string so we can do a string compare
					var cA = this.valuesBuffer.slice().sort().join(";"); 
					var cB = values.slice().sort().join(";");

					if (cA === cB)
						return;		// arrays are equal
				}

				this.valuesBuffer = [];
				this.valuesBuffer.push.apply(this.valuesBuffer, values);
				this.__delayedSetContent(30);
			},
			__delayedSetContent : function(delay)
			{
				if (this.available === false)
					return (false);

				if (this.ready === false)
				{
					if (this.timeoutId !== null)
						window.clearTimeout(this.timeoutId);

					this.timeoutId = window.setTimeout(
						function()
						{
							var newDelay = delay + 100;

							if (delay < 30)
								newDelay = 30;
							else if (delay > 500)
								newDelay = 500;

							BX.Tasks.lwPopup.functions['f' + newFuncIndex].__delayedSetContent(newDelay);
						},
						delay
					);
				}
				else
				{
					if (BX(this.nameContainerId))
						BX.remove(BX(this.nameContainerId));

					if (BX(this.dataContainerId))
						BX.remove(BX(this.dataContainerId));

					var urlParams = '';
					var cnt = this.valuesBuffer.length;
					for (var i=0; i<cnt; i++)
						urlParams = urlParams + '&UF_TASK_WEBDAV_FILES[]=' + this.valuesBuffer[i];

					// Reload user field from server
					var ajaxData  = {
						sessid        : BX.message('bitrix_sessid'),
						requestsCount : 1,
						data_0        : this.ajaxParams
					};
					BX.ajax({
						method      : 'POST',
						dataType    : 'html',
						url         : '/bitrix/components/bitrix/tasks.iframe.popup/ajax_loader.php?SITE_ID=' + BX.message('SITE_ID') + urlParams,
						data        :  ajaxData,
						processData :  true,
						autoAuth    :  true,
						//async       :  false,
						onsuccess   : (function(selfObj){
							return function(reply)
							{
								BX(BX.Tasks.lwPopup.garbageAreaId).appendChild(
									BX.create(
										'div',
										{
											html : reply
										}
									)
								);

								selfObj.ready = true;

								var fieldLabel = BX(selfObj.nameContainerId).innerHTML;
								BX.remove(BX(selfObj.nameContainerId));
								selfObj.allParams.callbackOnRedraw(fieldLabel, selfObj.dataContainerId);
							};
						})(this)
					});
				}
			}
		};

		var rc = {
			object     : BX.Tasks.lwPopup.functions['f' + newFuncIndex],
			ajaxParams : ajaxParams,
			postData   : {
				UF_TASK_WEBDAV_FILES : params['value']
			}
		};

		return (rc);
	},


	__prepareLheData : function(params)
	{
		var newFuncIndex =  BX.Tasks.lwPopup.functionsCount++;
		var jsObjectName = 'OBJ_TASKS_LHEDITOR_NS_' + newFuncIndex;
		var elementId    = 'OBJ_TASKS_ELEMENT_ID_NS_' + newFuncIndex;
		var inputId      = 'OBJ_TASKS_INPUT_ID_NS_' + newFuncIndex;

		BX.Tasks.lwPopup.functions['f' + newFuncIndex] = {
			allParams       : params,
			jsObjectName    : jsObjectName,
			elementId       : elementId,
			editor          : null,
			inputId         : inputId,
			content         : '',
			getContent      : function()
			{
				if (this.editor !== null)
				{
					this.editor.SaveContent();
					return (this.editor.GetContent());
				}
				else
				{
					if (BX(this.inputId))
						return (BX(this.inputId).value);
					else
						return ('');
				}
			},
			setContent : function(content)
			{
				this['content'] = content;
				this.__delayedSetContent(30);
			},
			__delayedSetContent : function(delay)
			{
				if (this.editor === null)
				{
					window.setTimeout(
						function()
						{
							var newDelay = delay + 100;

							if (delay < 30)
								newDelay = 30;
							else if (delay > 500)
								newDelay = 500;

							BX.Tasks.lwPopup.functions['f' + newFuncIndex].__delayedSetContent(newDelay);
						},
						delay
					);
				}
				else
				{
					this.editor.SetContent(this['content']);
					this.editor.SetEditorContent(this['content']);
				}
			}
		};

		BX.addCustomEvent(
			window,
			'LHE_OnInit',
			(function(selfObj, attachTo){
				var inited = false;
				return function(data){
					if ( (!inited) && (data.id == selfObj.elementId) )
					{
						selfObj.editor = data;

						BX(attachTo).innerHTML = '';
						BX(attachTo).appendChild(data.pFrame.parentNode.removeChild(data.pFrame));
						inited = true;
						data.ReInit(selfObj['content']);

						BX.Tasks.lwPopup.__runCreateFormCallback('onAfterEditorInited', []);
					}
				}
			})(BX.Tasks.lwPopup.functions['f' + newFuncIndex], params.attachTo)
		);

		var rc = {
			object     : BX.Tasks.lwPopup.functions['f' + newFuncIndex],
			ajaxParams : {
				requestedObject : 'LHEditor',
				jsObjectName    :  jsObjectName,
				elementId       :  elementId,
				inputId         :  inputId
			}
		};

		return (rc);
	},


	__prepareGroupsSelectorsData : function(params)
	{
		var newFuncIndex =  BX.Tasks.lwPopup.functionsCount++;
		var jsObjectName = 'OBJ_TASKS_GROUP_SELECTOR_NS_' + newFuncIndex;

		BX.Tasks.lwPopup.functions['f' + newFuncIndex] = {
			allParams       : params,
			jsObjectName    : jsObjectName,
			bindElement     : params.bindElement,
			onLoadedViaAjax : function()
			{
				BX.bind(
					BX(this.bindElement),
					'click',
					(function(obj){
						return function(e) {
							if (!e)
								e = window.event;

							var oGroupObject = window[obj.jsObjectName];

							if (oGroupObject)
							{
								oGroupObject.popupWindow.params.zIndex = 1400;
								oGroupObject.show();
							}

							BX.PreventDefault(e);
						};
					})(this)
				);

				if (this.allParams.onLoadedViaAjax)
					this.allParams.onLoadedViaAjax(this.jsObjectName);
			},
			setSelected : function(groupData)
			{
				// If object is not loaded yet => we shouldn't set
				// group id, because it will be setted on PHP side
				// during initialization of group.selector
				if ( ! window[this.jsObjectName] )
					return;

				if (groupData.id == 0)
				{
					var currentItem = null;

					if (window[this.jsObjectName].selected[0])
					{
						currentItem = window[this.jsObjectName].selected[0];
						window[this.jsObjectName].deselect(currentItem.id);
					}
				}
				else
					window[this.jsObjectName].select(groupData);
			},
			deselect : function (groupId)
			{
				window[this.jsObjectName].deselect(groupId);
			}
		};

		// groups selector needs function in window
		var onSelectFunctionName = 'FUNC_TASKS_GROUP_SELECTOR_NS_' + newFuncIndex;
		window[onSelectFunctionName] = (function(callbackOnSelect){
			return function(arGroups){
				if (callbackOnSelect)
					callbackOnSelect(arGroups);
			}
		})(params.callbackOnSelect);

		var rc = {
			object     : BX.Tasks.lwPopup.functions['f' + newFuncIndex],
			ajaxParams : {
				requestedObject  : 'socialnetwork.group.selector',
				jsObjectName     :  jsObjectName,
				bindElement      :  params.bindElement,
				onSelectFuncName :  onSelectFunctionName
			}
		};

		return (rc);
	},


	__prepareUserSelectorsData : function(params)
	{
		var userInputId = null;
		var bindClickTo = null;
		var GROUP_ID_FOR_SITE = 0;

		if (params.hasOwnProperty('userInputId'))
			userInputId = params.userInputId;

		if (params.hasOwnProperty('bindClickTo'))
			bindClickTo = params.bindClickTo;
		else
			bindClickTo = userInputId;

		var callbackOnSelect   =  params.callbackOnSelect;
		var selectedUsersIds   =  params.selectedUsersIds;
		var anchorId           =  params.anchorId;
		var multiple           =  params['multiple'];
		var newFuncIndex       =  BX.Tasks.lwPopup.functionsCount++;
		var nsObjectName       = 'OBJ_TASKS_USER_SELECTOR_NS_' + newFuncIndex;

		if (params.GROUP_ID_FOR_SITE)
			GROUP_ID_FOR_SITE = params.GROUP_ID_FOR_SITE;

		// Register named function for callback (onUserSelect)
		// We need name for functions, because we transmit this name to PHP,
		// which than generates js-code who calls our callback.
		BX.Tasks.lwPopup.functions['f' + newFuncIndex] = {
			allParams          : params,
			multiple           : multiple,
			popupId            : nsObjectName + '_popupId',
			bindClickTo        : bindClickTo,
			userInputId        : userInputId,
			anchorId           : anchorId,
			userPopupWindow    : null,
			nsObjectName       : nsObjectName,
			onLoadedViaAjax    : function()
			{
				var obj = this;

				if (this.userInputId)
				{
					BX.bind(
						BX(this.userInputId),
						'focus',
						function(e)
						{
							obj.showUserSelector(e);
						}
					);

					if (BX(this.bindClickTo))
					{
						BX.bind(
							BX(this.bindClickTo),
							'click',
							function(e) {
								if (!e)
									e = window.event;

								BX(obj.userInputId).focus();
								BX.PreventDefault(e);
							}
						);
					}
				}

				if (this.allParams.onLoadedViaAjax)
					this.allParams.onLoadedViaAjax();

				if (this.allParams.onReady)
				{
					(function(objName, callbackOnReady){
						var wait = function(delay, timeout, callbackOnReady)
						{
							if (typeof window[objName] === 'undefined')
							{
								if (timeout > 0)
								{
									window.setTimeout(
										function() {
											wait(delay, timeout - delay, callbackOnReady);
										},
										delay
									);
								}
							}
							else
							{
								callbackOnReady(window[objName]);
							}
						}

						wait(100, 15000, callbackOnReady);	// every 100ms, not more than 15000ms
					})('O_' + this.nsObjectName, this.allParams.onReady)
				}
			},
			onPopupClose : function(selfObj)
			{
				var O_USER_DATA = window['O_' + selfObj.nsObjectName];
				var emp = O_USER_DATA.arSelected.pop();

				if (emp)
				{
					O_USER_DATA.arSelected.push(emp);
					O_USER_DATA.searchInput.value = emp.name;
				}
			},
			setSelectedUsers : function(selectedUsers, timeCalled)
			{
				var timeCalled = timeCalled || 1;

				if (timeCalled > 100)
					return;

				if ( ! window['O_' + this.nsObjectName] )
				{
					window.setTimeout(
						(function(selfObj, timeCalled, selectedUsers){
							return function()
							{
								selfObj.setSelectedUsers(selectedUsers, timeCalled + 1);
							}
						})(this, timeCalled, selectedUsers),
						50
					);

					return;
				}

				var O_USER_DATA = window['O_' + this.nsObjectName];

				O_USER_DATA.setSelected(selectedUsers);
			},
			showUserSelector : function(e)
			{
				if (!e)
					e = window.event;

				if (
					(this.userPopupWindow !== null)
					&& (this.userPopupWindow.popupContainer.style.display == "block")
				)
				{
					return;		// Popup already showed
				}

				var anchor  = BX(this.anchorId);
				var buttons = null;
				var obj     = this;

				if (this['multiple'] === 'Y')
				{
					buttons = [
						new BX.PopupWindowButton({
							text      :  this.allParams.btnSelectText,
							className : 'popup-window-button-accept',
							events    : {
								click : function(e)
								{
									obj.btnSelectClick(e);
									obj.userPopupWindow.close();
								}
							 }
						}),

						new BX.PopupWindowButtonLink({
							text      :  this.allParams.btnCancelText,
							className : 'popup-window-button-link-cancel',
							events    : {
								click : function(e)
								{
									if (!e)
										e = window.event;

									obj.userPopupWindow.close();
									
									if (e)
										BX.PreventDefault(e);
								}
							}
						})
					];
				}

				this.userPopupWindow = BX.PopupWindowManager.create(
					this.popupId,
					anchor,
					{
						offsetTop  : 1,
						autoHide   : true,
						closeByEsc : true,
						content    : BX(this.nsObjectName + "_selector_content"),
						buttons    : buttons
					}
				);
					
				if (this['multiple'] === 'N')
				{
					BX.addCustomEvent(
						this.userPopupWindow,
						"onPopupClose",
						function()
						{
							obj.onPopupClose(obj);
						}
					);
				}
				else
				{
					BX.addCustomEvent(
						this.userPopupWindow,
						'onAfterPopupShow',
						function(e) { setTimeout(
							function() { window['O_' + obj.nsObjectName].searchInput.focus(); }, 100
						);}
					);
				}

				this.userPopupWindow.show();
				BX(this.userPopupWindow.uniquePopupId).style.zIndex = 1400;
				BX.focus(anchor);
				BX.PreventDefault(e);
			}
		}

		if (multiple === 'N')
		{
			BX.Tasks.lwPopup.functions['f' + newFuncIndex].onUserSelect = 
				(function(callbackOnSelect){
					var obj = BX.Tasks.lwPopup.functions['f' + newFuncIndex];

					return function(arUser){
						if (obj.userPopupWindow)
							obj.userPopupWindow.close();

						callbackOnSelect(arUser);
					}
				})(callbackOnSelect);

			BX.Tasks.lwPopup.functions['f' + newFuncIndex].btnSelectClick = function(){};
		}
		else
		{
			BX.Tasks.lwPopup.functions['f' + newFuncIndex].onUserSelect = function(){};

			BX.Tasks.lwPopup.functions['f' + newFuncIndex].btnSelectClick = 
				(function(callbackOnSelect){
					return function(e){
						if (!e)
							e = window.event;

						var arAllUsers = window['O_' + this.nsObjectName].arSelected;
						var arAllUsersCount = arAllUsers.length;
						var arUsers = [];

						for (i = 0; i < arAllUsersCount; i++)
						{
							if (arAllUsers[i])
								arUsers.push(arAllUsers[i]);
						}

						callbackOnSelect(arUsers);
					}
				})(callbackOnSelect);
		}

		var ajaxParams = {
			requestedObject      : 'intranet.user.selector.new',
			multiple             :  multiple,
			namespace            :  nsObjectName,
			inputId              :  userInputId,
			onSelectFunctionName : 'BX.Tasks.lwPopup.functions.f' + newFuncIndex + '.onUserSelect',
			GROUP_ID_FOR_SITE    :  GROUP_ID_FOR_SITE,
			selectedUsersIds     :  selectedUsersIds
		};

		if (params.callbackOnChange)
		{
			BX.Tasks.lwPopup.functions['f' + newFuncIndex].onUsersChange = params.callbackOnChange;

			ajaxParams.onChangeFunctionName = 'BX.Tasks.lwPopup.functions.f' + newFuncIndex + '.onUsersChange'
		}

		var rc = {
			object     : BX.Tasks.lwPopup.functions['f' + newFuncIndex],
			ajaxParams : ajaxParams
		};

		return (rc);
	},


	_showCalendar : function(node, field, params)
	{
		if (typeof(params) === 'undefined')
			var params = {};

		var bTime = true;
		if (params.hasOwnProperty('bTime'))
			bTime = params.bTime;

		var bHideTime = false;
		if (params.hasOwnProperty('bHideTime'))
			bHideTime = params.bHideTime;

		var callback_after = null;
		if (params.hasOwnProperty('callback_after'))
			callback_after = params.callback_after;

		var curDate = new Date();

		if (!!field.value)
			var selectedDate = field.value;
		else
		{
			var curDayEveningTime = new Date(
				curDate.getFullYear(),
				curDate.getMonth(),
				curDate.getDate(),
				19, 0, 0
			);

			var selectedDate = curDayEveningTime;
		}

		BX.calendar({
			node        : node, 
			field       : field,
			bTime       : bTime, 
			value       : selectedDate,
			bHideTime   : bHideTime,
			currentTime : Math.round(curDate / 1000) - curDate.getTimezoneOffset()*60, 
			callback_after : callback_after
		});
	},


	__firstRun : function()
	{
		if (BX.Tasks.lwPopup.firstRunDone)
			return;		// do nothing, if already run

		BX.Tasks.lwPopup.firstRunDone = true;

		var body = document.getElementsByTagName('body')[0];

		// Init garbage area
		if ( ! BX(BX.Tasks.lwPopup.garbageAreaId) )
		{
			body.appendChild(
				BX.create(
					'DIV',
					{
						props: { id: BX.Tasks.lwPopup.garbageAreaId }
					}
				)
			);
		}
	}
}

})();

/* End */
;
; /* Start:/bitrix/js/tasks/core_planner_handler.js*/
;(function(){

if(!!window.BX.CTasksPlannerHandler)
	return;

var
	BX = window.BX,
	TASK_SUFFIXES = {"-1": "overdue", "-2": "new", 1: "new", 2: "accepted", 3: "in-progress", 4: "waiting", 5: "completed", 6: "delayed", 7: "declined"},
	PLANNER_HANDLER = null;

BX.addTaskToPlanner = function(taskId)
{
	PLANNER_HANDLER.addTask({id:taskId});
}

BX.CTasksPlannerHandler = function()
{
	this.TASKS = null;
	this.TASKS_LIST = null;
	this.ADDITIONAL = {};
	this.MANDATORY_UFS = null;

	this.TASK_CHANGES = {add: [], remove: []};
	this.TASK_CHANGES_TIMEOUT = null;

	this.TASKS_WND = null;

	this.DATA_TASKS = null;

	this.PLANNER = null;

	this.taskTimerSwitch = false;
	this.timerTaskId = 0;

	this.onTimeManDataRecievedEventDetected = false;

	BX.addCustomEvent('onPlannerDataRecieved', BX.proxy(this.draw, this));
	BX.addCustomEvent("onTaskTimerChange", BX.proxy(this.onTaskTimerChange, this));
};

BX.CTasksPlannerHandler.prototype.formatTime = function(ts, bSec)
{
	var hours   = Math.floor(ts / 3600);
	var minutes = Math.floor(ts / 60) % 60;
	var seconds = null;
	var str = ((hours < 10) ? '0' : '') + hours.toString()
		+ ((minutes < 10) ? ':0' : ':') + minutes.toString();

	if (bSec)
	{
		seconds = ts % 60;
		str = str + ((seconds < 10) ? ':0' : ':') + seconds.toString();
	}

	return (str);
};

BX.CTasksPlannerHandler.prototype.draw = function(obPlanner, DATA)
{
	if (typeof DATA.MANDATORY_UFS !== 'undefined')
		this.MANDATORY_UFS = DATA.MANDATORY_UFS;

	if(!DATA.TASKS_ENABLED)
		return;

	this.PLANNER = obPlanner;

	if (null == this.TASKS)
	{
		this.TASKS = BX.create('DIV');

		this.TASKS.appendChild(BX.create('DIV', {
			props: {className: 'tm-popup-section tm-popup-section-tasks'},
			children: [
				BX.create('SPAN', {
					props: {className: 'tm-popup-section-text'},
					text: BX.message('JS_CORE_PL_TASKS')
				}),
				BX.create('span', {
					props: {className: 'tm-popup-section-right-link'},
					events: {click: BX.proxy(this.showTasks, this)},
					text: BX.message('JS_CORE_PL_TASKS_CHOOSE')
				})
			]
		}));

		this.TASKS.appendChild(BX.create('DIV', {
			props: {className: 'tm-popup-tasks'},
			children: [
			(this.TASKS_LIST = BX.create('div', {
				props: {
					className: 'tm-task-list'
				}
			})),
			this.drawTasksForm(BX.proxy(this.addTask, this))
		]}));
	}
	else
	{
		BX.cleanNode(this.TASKS_LIST);
	}

	if (DATA.TASKS && DATA.TASKS.length > 0)
	{
		var LAST_TASK = null;
		var clsName   = '';
		var children  = [];
		var timeSpent = 0;
		var timeEstim = 0;
		var strTimer  = '';
		var isComplete = null;

		BX.removeClass(this.TASKS, 'tm-popup-tasks-empty');

		for (var i=0,l=DATA.TASKS.length; i<l; i++)
		{
			isComplete = (DATA.TASKS[i].STATUS == 4) || (DATA.TASKS[i].STATUS == 5);

			if (isComplete)
				clsName = ' tm-task-item-done';
			else
				clsName = '';

			children = [];
			children.push(BX.create('input', {
				props: {className: 'tm-task-checkbox', type: 'checkbox', checked : isComplete},
				events: {
					click: (function(taskData){
						return function(){
							var oTask = new BX.CJSTask.Item(taskData.ID);

							if (this.checked)
							{
								oTask.complete({
									callbackOnSuccess : function(){
										if (BX.TasksTimerManager)
											BX.TasksTimerManager.reLoadInitTimerDataFromServer();
									}
								});
							}
							else
							{
								oTask.startExecutionOrRenewAndStart({
									callbackOnSuccess : function(){
										if (BX.TasksTimerManager)
											BX.TasksTimerManager.reLoadInitTimerDataFromServer();
									}
								});
							}
						}
					})(DATA.TASKS[i])
				}
			}));

			if (
				(DATA.TASKS[i].TIME_SPENT_IN_LOGS > 0)
				|| (DATA.TASKS[i].TIME_ESTIMATE > 0)
			)
			{
				timeSpent = parseInt(DATA.TASKS[i].TIME_SPENT_IN_LOGS);
				timeEstim = parseInt(DATA.TASKS[i].TIME_ESTIMATE);

				if (isNaN(timeSpent))
					timeSpent = 0;

				if (isNaN(timeEstim))
					timeEstim = 0;

				strTimer = (this.formatTime(timeSpent, true));
				if (timeEstim > 0)
					strTimer = strTimer + ' / ' + this.formatTime(timeEstim);
			}
			else
				strTimer = '';

			children.push(BX.create('a', {
				attrs: {href: 'javascript:void(0)'},
				props: {
					className: 'tm-task-name' + ((strTimer === '') ? ' tm-task-no-timer' : '')
				},
				text: DATA.TASKS[i].TITLE,
				events: {click: BX.proxy(this.showTask, this)}
			}));

			if (strTimer !== '')
			{
				children.push(BX.create('SPAN', {
					props: {className: 'tm-task-time', id : 'tm-task-time-' + DATA.TASKS[i].ID},
					text : strTimer
				}));
			}

			children.push(BX.create('SPAN', {
				props: {className: 'tm-task-item-menu'},
				events : {
					click : (function(taskData, timerData, self){
						return function(){
							var menuItems = [];

							if (timerData 
								&& (timerData.TASK_ID == taskData.ID)
								&& (timerData.TIMER_STARTED_AT > 0)
							)
							{
								menuItems.push({
									text      : BX.message('JS_CORE_PL_TASKS_STOP_TIMER'),
									className : 'menu-popup-item-hold',
									onclick   : function(e)
									{
										BX.TasksTimerManager.stop(taskData.ID);
										this.popupWindow.close();
									}
								});
							}
							else
							{
								if (taskData.ALLOW_TIME_TRACKING === 'Y')
								{
									menuItems.push({
										text      : BX.message('JS_CORE_PL_TASKS_START_TIMER'),
										className : 'menu-popup-item-begin',
										onclick   : function(e)
										{
											BX.TasksTimerManager.start(taskData.ID);
											this.popupWindow.close();
										}
									});
								}
							}

							menuItems.push({
								text      : BX.message('JS_CORE_PL_TASKS_MENU_REMOVE_FROM_PLAN'),
								className : 'menu-popup-item-decline',
								onclick   : function(e)
								{
									self.removeTask(e, taskData.ID);
									this.popupWindow.close();
								}
							});

							BX.PopupMenu.destroy('task-tm-item-entry-menu-' + taskData.ID);

							menu = BX.PopupMenu.create(
								'task-tm-item-entry-menu-' + taskData.ID,
								this,
								menuItems,
								{
									autoHide : true,
									//"offsetLeft": -1 * anchorPos["width"],
									"offsetTop": 4,
									"events":
									{
										"onPopupClose" : function(ind){
										}
									}
								}
							);

							menu.popupWindow.show();
						};
					})(DATA.TASKS[i], DATA.TASKS_TIMER, this)
				}
			}));		

			var q = this.TASKS_LIST.appendChild(BX.create('div', {
				props: {
					id         : 'tm-task-item-' + DATA.TASKS[i].ID,
					className  : 'tm-task-item ' + clsName,
					bx_task_id : DATA.TASKS[i].ID
				},
				children: children
			}));

			if (DATA.TASK_LAST_ID && DATA.TASKS[i].ID == DATA.TASK_LAST_ID)
			{
				LAST_TASK = q;
			}
		}

		if (LAST_TASK)
		{
			setTimeout(BX.delegate(function()
			{
				if (LAST_TASK.offsetTop < this.TASKS_LIST.scrollTop || LAST_TASK.offsetTop + LAST_TASK.offsetHeight > this.TASKS_LIST.scrollTop + this.TASKS_LIST.offsetHeight)
				{
					this.TASKS_LIST.scrollTop = LAST_TASK.offsetTop - parseInt(this.TASKS_LIST.offsetHeight/2);
				}
			}, this), 10);
		}
	}
	else
	{
		BX.addClass(this.TASKS, 'tm-popup-tasks-empty');
	}

	this.DATA_TASKS = BX.clone(DATA.TASKS);

	obPlanner.addBlock(this.TASKS, 200);
	obPlanner.addAdditional(this.drawAdditional());
};

BX.CTasksPlannerHandler.prototype.drawAdditional = function()
{
	if(!this.TASK_ADDITIONAL)
	{
		this.ADDITIONAL.TASK_TEXT = BX.create('SPAN', {props: {className: 'tm-info-bar-text'}});
		this.ADDITIONAL.TASK_TIMER = BX.create('SPAN', {props: {className: 'tm-info-bar-time'}});

		this.TASK_ADDITIONAL = BX.create('DIV', {
			props: {className: 'tm-info-bar'},
			children: [
				BX.create('SPAN', {
					props: {
						title    : BX.message('JS_CORE_PL_TASKS_START_TIMER'),
						className: 'tm-info-bar-btn tm-info-bar-btn-play'
					},
					events: {
						click: BX.proxy(this.timerStart, this)
					}
				}),
				BX.create('SPAN', {
					props: {
						title    : BX.message('JS_CORE_PL_TASKS_STOP_TIMER'),
						className: 'tm-info-bar-btn tm-info-bar-btn-pause'
					},
					events: {
						click: BX.proxy(this.timerStop, this)
					}
				}),
				BX.create('SPAN', {
					props: {
						title    : BX.message('JS_CORE_PL_TASKS_FINISH'),
						className: 'tm-info-bar-btn tm-info-bar-btn-flag'
					},
					events: {
						click: BX.proxy(this.timerFinish, this)
					}
				}),
				this.ADDITIONAL.TASK_TEXT,
				this.ADDITIONAL.TASK_TIMER,
			]
		});
		BX.hide(this.TASK_ADDITIONAL);
	}

	return this.TASK_ADDITIONAL;
};

BX.CTasksPlannerHandler.prototype.timerStart = function()
{
	if(this.timerTaskId > 0)
	{
		BX.TasksTimerManager.start(this.timerTaskId);
	}
};

BX.CTasksPlannerHandler.prototype.timerStop = function()
{
	if(this.timerTaskId > 0)
	{
		BX.TasksTimerManager.stop(this.timerTaskId);
	}
};

BX.CTasksPlannerHandler.prototype.timerFinish = function()
{
	if(this.timerTaskId > 0)
	{
		var oTask = new BX.CJSTask.Item(this.timerTaskId);
		oTask.complete({
			callbackOnSuccess : function(){
				if (BX.TasksTimerManager)
					BX.TasksTimerManager.reLoadInitTimerDataFromServer();
			}
		});
	}
};

BX.CTasksPlannerHandler.prototype.onTaskTimerChange = function(params)
{
	if (params.action === 'refresh_daemon_event')
	{
		this.timerTaskId = params.taskId;
		if(this.PLANNER && !!this.PLANNER.WND && this.PLANNER.WND.isShown() && params.taskId > 0)
		{
			var d = this.drawAdditional();

			if(!!this.taskTimerSwitch)
			{
				d.style.display = '';
				this.taskTimerSwitch = false;
			}

			var curTime = parseInt(params.data.TIMER.RUN_TIME||0) + parseInt(params.data.TASK.TIME_SPENT_IN_LOGS||0),
				planTime = parseInt(params.data.TASK.TIME_ESTIMATE||0);

			if(planTime > 0 && curTime > planTime)
			{
				BX.addClass(d, 'tm-info-bar-overdue');
			}
			else
			{
				BX.removeClass(d, 'tm-info-bar-overdue');
			}

			var s = '';
			s += this.formatTime(curTime, true);

			if(planTime > 0)
			{
				s += ' / ' + this.formatTime(planTime);
			}

			this.ADDITIONAL.TASK_TIMER.innerHTML = s;
			this.ADDITIONAL.TASK_TEXT.innerHTML = BX.util.htmlspecialchars(params.data.TASK.TITLE);

			var tmListTaskEntry = BX('tm-task-time-' + this.timerTaskId);
			if (tmListTaskEntry)
				tmListTaskEntry.innerHTML = s;
		}
	}
	else if(params.action === 'start_timer')
	{
		if (this.isClosed(params.taskData))
		{
			BX.addClass(this.drawAdditional(), 'tm-info-bar-closed');
		}
		else
		{
			BX.removeClass(this.drawAdditional(), 'tm-info-bar-closed');
		}

		this.timerTaskId = params.taskData.ID;
		this.taskTimerSwitch = true;
		BX.addClass(this.drawAdditional(), 'tm-info-bar-active');
		BX.removeClass(this.drawAdditional(), 'tm-info-bar-pause');
	}
	else if(params.action === 'stop_timer')
	{
		this.timerTaskId = params.taskData.ID;
		if (this.isClosed(params.taskData))
		{
			BX.hide(this.drawAdditional());
		}
		else
		{
			BX.addClass(this.drawAdditional(), 'tm-info-bar-pause');
			BX.removeClass(this.drawAdditional(), 'tm-info-bar-active');
		}
	}
	else if(params.action === 'init_timer_data')
	{
		if (params.data.TIMER && params.data.TASK.ID > 0 && (params.data.TIMER.TASK_ID == params.data.TASK.ID))
		{
			this.timerTaskId = params.data.TASK.ID;

			if (this.isClosed(params.data.TASK))
			{
				BX.addClass(this.drawAdditional(), 'tm-info-bar-closed');
			}
			else
			{
				BX.removeClass(this.drawAdditional(), 'tm-info-bar-closed');
			}

			if (params.data.TIMER.TIMER_STARTED_AT == 0)
			{
				if (this.isClosed(params.data.TASK))
				{
					BX.hide(this.drawAdditional());
				}
				else
				{
					this.taskTimerSwitch = true;
					BX.addClass(this.drawAdditional(), 'tm-info-bar-pause');
					BX.removeClass(this.drawAdditional(), 'tm-info-bar-active');
				}
			}
			else
			{
				this.taskTimerSwitch = true;
				BX.addClass(this.drawAdditional(), 'tm-info-bar-active');
				BX.removeClass(this.drawAdditional(), 'tm-info-bar-pause');
			}
		}
		else
		{
			BX.hide(this.drawAdditional());
		}

		this.onTaskTimerChange({action:'refresh_daemon_event',taskId:+params.data.TASK.ID,data:params.data});
	}
};

BX.CTasksPlannerHandler.prototype.isClosed = function(task)
{
	return task.STATUS == 5||task.STATUS == 4;
};

BX.CTasksPlannerHandler.prototype.addTask = function(task_data)
{
	if(!!this.TASKS_LIST)
	{
		this.TASKS_LIST.appendChild(BX.create('LI', {
			props: {className: 'tm-popup-task'},
			text: task_data.name
		}));

		BX.removeClass(this.TASKS, 'tm-popup-tasks-empty');
	}

	var data = {action: 'add'};

	if(typeof task_data.id != 'undefined')
		data.id = task_data.id;
	if(typeof task_data.name != 'undefined')
		data.name = task_data.name;

	this.query(data);
};

BX.CTasksPlannerHandler.prototype.removeTask = function(e, taskId)
{
	this.query({action: 'remove', id: taskId});
	BX.cleanNode(BX('tm-task-item-' + taskId), true);

	if(!this.TASKS_LIST.firstChild)
	{
		BX.addClass(this.TASKS, 'tm-popup-tasks-empty');
	}
};

BX.CTasksPlannerHandler.prototype.showTasks = function()
{
	if (!this.TASKS_WND)
	{
		this.TASKS_WND = new BX.CTasksPlannerSelector({
			node: BX.proxy_context,
			onselect: BX.proxy(this.addTask, this)
		});
	}
	else
	{
		this.TASKS_WND.setNode(BX.proxy_context);
	}

	this.TASKS_WND.Show();
};

BX.CTasksPlannerHandler.prototype.showTask = function(e)
{
	var task_id = BX.proxy_context.parentNode.bx_task_id,
		tasks = this.DATA_TASKS,
		arTasks = [];

	if (tasks.length > 0)
	{
		for(var i=0; i<tasks.length; i++)
		{
			arTasks.push(tasks[i].ID);
		}

		taskIFramePopup.tasksList = arTasks;
		taskIFramePopup.view(task_id);
	}

	return false;
};

BX.CTasksPlannerHandler.prototype.drawTasksForm = function(cb)
{
	var handler  = null;
	var inp_Task = null;
	var children = null;

	if (this.MANDATORY_UFS !== 'Y')
	{
		handler = BX.delegate(function(e, bEnterPressed) {
			inp_Task.value = BX.util.trim(inp_Task.value);
			if (inp_Task.value && inp_Task.value!=BX.message('JS_CORE_PL_TASKS_ADD'))
			{
				cb({
					name: inp_Task.value
				});

				if (!bEnterPressed)
				{
					BX.addClass(inp_Task.parentNode, 'tm-popup-task-form-disabled')
					inp_Task.value = BX.message('JS_CORE_PL_TASKS_ADD');
				}
				else
				{
					inp_Task.value = '';
				}
			}

			return BX.PreventDefault(e);
		}, this);

		var inp_Task = BX.create('INPUT', {
			props: {type: 'text', className: 'tm-popup-task-form-textbox', value: BX.message('JS_CORE_PL_TASKS_ADD')},
			events: {
				keypress: function(e) {
					return (e.keyCode == 13) ? handler(e, true) : true;
				},
				blur: function() {
					if (this.value == '')
					{
						BX.addClass(this.parentNode, 'tm-popup-task-form-disabled');
						this.value = BX.message('JS_CORE_PL_TASKS_ADD');
					}
				},
				focus: function() {
					BX.removeClass(this.parentNode, 'tm-popup-task-form-disabled');
					if (this.value == BX.message('JS_CORE_PL_TASKS_ADD'))
						this.value = '';
				}
			}
		});

		BX.focusEvents(inp_Task);

		children = [
			inp_Task,
			BX.create('SPAN', {
				props: {className: 'tm-popup-task-form-submit'},
				events: {click: handler}
			})
		];
	}
	else
	{
		children = [
			BX.create('A', {
				text : BX.message('JS_CORE_PL_TASKS_CREATE'),
				attrs: {href: 'javascript:void(0)'},
				events : {
					click: function(){
						window['taskIFramePopup'].add({ADD_TO_TIMEMAN : 'Y'});
					}
				}
			})
		];
	}
	
	return BX.create('DIV', {
		props: {
			className: 'tm-popup-task-form tm-popup-task-form-disabled'
		},
		children: children
	});
};

BX.CTasksPlannerHandler.prototype.query = function(entry, callback)
{
	if (this.TASK_CHANGES_TIMEOUT)
	{
		clearTimeout(this.TASK_CHANGES_TIMEOUT);
	}

	if (typeof entry == 'object')
	{
		if(!!entry.id)
		{
			this.TASK_CHANGES[entry.action].push(entry.id);
		}

		if (entry.action == 'add')
		{
			if(!entry.id)
			{
				this.TASK_CHANGES.name = entry.name;
			}

			this.query();
		}
		else
		{
			this.TASK_CHANGES_TIMEOUT = setTimeout(
				BX.proxy(this.query, this), 1000
			);
		}
	}
	else
	{
		if(!!this.PLANNER)
		{
			this.DATA_TASKS = [];
			this.PLANNER.query('task', this.TASK_CHANGES);
		}
		else
		{
			window.top.BX.CPlanner.query('task', this.TASK_CHANGES);
		}
		this.TASK_CHANGES = {add: [], remove: []};
	}
};

BX.CTasksPlannerSelector = function(params)
{
	this.params = params;

	this.isReady = false;
	this.WND = BX.PopupWindowManager.create(
		'planner_tasks_selector_' + parseInt(Math.random() * 10000), this.params.node,
		{
			autoHide: true,
			closeByEsc: true,
			content: (this.content = BX.create('DIV')),
			buttons: [
				new BX.PopupWindowButtonLink({
					text : BX.message('JS_CORE_WINDOW_CLOSE'),
					className : "popup-window-button-link-cancel",
					events : {click : function(e) {this.popupWindow.close();return BX.PreventDefault(e);}}
				})
			]
		}
	);
};

BX.CTasksPlannerSelector.prototype.Show = function()
{
	if (!this.isReady)
	{
		var suffix = parseInt(Math.random() * 10000);
		window['PLANNER_ADD_TASK_' + suffix] = BX.proxy(this.setValue, this);

		return BX.ajax.get('/bitrix/tools/tasks_planner.php', {action:'list', suffix: suffix, sessid: BX.bitrix_sessid(), site_id: BX.message('SITE_ID')}, BX.proxy(this.Ready, this));
	}

	return this.WND.show();
};

BX.CTasksPlannerSelector.prototype.Hide = function()
{
	this.WND.close();
};

BX.CTasksPlannerSelector.prototype.Ready = function(data)
{
	this.content.innerHTML = data;

	this.isReady = true;
	this.Show();
};

BX.CTasksPlannerSelector.prototype.setValue = function(task)
{
	this.params.onselect(task)
	this.WND.close();
};

BX.CTasksPlannerSelector.prototype.setNode = function(node)
{
	this.WND.setBindElement(node);
};

PLANNER_HANDLER = new BX.CTasksPlannerHandler();
})();
/* End */
;
; /* Start:/bitrix/js/tasks/task-iframe-popup.js*/
(function (window) {
	var resizeInterval, lastSrc;
	var lastheight = 0;

	BX.TasksIFramePopup = {
		create : function(params)
		{
			if (!window.top.BX.TasksIFrameInst)
				window.top.BX.TasksIFrameInst = new TasksIFramePopup(params);

			if (params.events)
			{
				for (var eventName in params.events)
					BX.addCustomEvent(window.top.BX.TasksIFrameInst, eventName, params.events[eventName]);
			}

			return window.top.BX.TasksIFrameInst;
		}
	};

	var TasksIFramePopup = function(params) {

		this.inited = false;
		this.pathToEdit = "";
		this.pathToView = "";
		this.iframeWidth = 900;
		this.iframeHeight = 400;
		this.topBottomMargin = 15;
		this.leftRightMargin = 50;
		this.tasksList = [];
		this.currentURL = window.location.href;
		this.currentTaskId = 0;
		this.lastAction = null;
		this.loading = false;
		this.isEditMode = false;
		this.prevIframeSrc = '';
		this.descriptionBuffered = null;

		if (params)
		{
			if (params.pathToEdit)
			{
				this.pathToEdit = params.pathToEdit + (params.pathToEdit.indexOf("?") == -1 ? "?" : "&") + "IFRAME=Y";
			}
			if (params.pathToView)
			{
				this.pathToView = params.pathToView + (params.pathToView.indexOf("?") == -1 ? "?" : "&") + "IFRAME=Y";
			}
			if (params.tasksList)
			{
				for(var i = 0, count = params.tasksList.length; i < count; i++)
				{
					this.tasksList[i] = parseInt(params.tasksList[i]);
				}
			}
		}
	};


	TasksIFramePopup.prototype.init = function() {

		if (this.inited)
			return;

		this.inited = true;

		this.header = BX.create("div", {
			props : {className : "popup-window-titlebar"},
			html : '<table width="877" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td align="left">&nbsp;</td><td width="13" style="padding-top: 2px;"><div class="tasks-iframe-close-icon">&nbsp;</div></td></tr></tbody></table>',
			style : {
				background : "#e8e8e8",
				height : "20px",
				padding : "5px 0px 5px 15px",
				borderRadius : "4px 4px 0px 0px"
			}
		});
		this.title = this.header.firstChild.tBodies[0].rows[0].cells[0];
		this.closeIcon = this.header.firstChild.tBodies[0].rows[0].cells[1].firstChild;
		this.closeIcon.onclick = BX.proxy(this.close, this);
		this.iframe = BX.create("iframe", {
			props : {
				scrolling : "no",
				frameBorder : "0"
			},
			style : {
				width : this.iframeWidth + "px",
				height : this.iframeHeight + "px",
				overflow : "hidden",
				border : "1px solid #fff",
				borderTop : "0px",
				borderRadius : "4px"
			}
		});
		this.prevTaskLink = BX.create("a", {props : {href : "javascript: void(0)", className : "tasks-popup-prev-slide"}, html : "<span></span>"});
		this.closeLink = BX.create("a", {props : {href : "javascript: void(0)", className : "tasks-popup-close"}, html : "<span></span>"});
		this.nextTaskLink = BX.create("a", {props : {href : "javascript: void(0)", className : "tasks-popup-next-slide"}, html : "<span></span>"});

		// Set nav
		this.prevTaskLink.onclick = BX.proxy(this.previous, this);
		this.nextTaskLink.onclick = BX.proxy(this.next, this);
		this.closeLink.onclick = BX.proxy(this.close, this);

		this.table = BX.create("table", {
			props : {className : "tasks-popup-main-table"},
			style : {
				top : this.topBottomMargin + "px"
			},
			children : [
				BX.create("tbody", {
					children : [
						BX.create("tr", {
							children : [
								this.prevTaskArea = BX.create("td", {
									props : {className : "tasks-popup-prev-slide-wrap"},
									children : [this.prevTaskLink]
								}),
								BX.create("td", {
									props : {
										id : 'tasks-crazy-heavy-cpu-usage-item',
										className : "tasks-popup-main-block-wrap tasks-popup-main-block-wrap-bg"
									},
									children : [
										BX.create("div", {
											props : {className : "tasks-popup-main-block-inner"},
											children : [this.header, this.iframe]
										})
									]
								}),
								this.nextTaskArea = BX.create("td", {
									props : {className : "tasks-popup-next-slide-wrap"},
									children : [this.closeLink, this.nextTaskLink]
								})
							]
						})
					]
				})
			]
		});

		this.overlay = document.body.appendChild(BX.create("div", {
			props : {
				className : "tasks-fixed-overlay"
			},
			children : [
				BX.create("div", {props : {className : "bx-task-dialog-overlay"}}),
				this.table
			]
		}));

		this.__adjustControls();

		BX.bind(window.top, "resize", BX.proxy(this.__onWindowResize, this));
	};

	TasksIFramePopup.prototype.view = function(taskId, tasksList) {
		this.init();
		if (tasksList)
		{
			this.currentList = [];
			for(var i = 0, count = tasksList.length; i < count; i++)
			{
				this.currentList[i] = parseInt(tasksList[i]);
			}
		}
		else
		{
			this.currentList = null;
		}
		BX.adjust(this.title, {text: BX.message("TASKS_TASK_NUM").replace("#TASK_NUM#", taskId)});
		this.currentTaskId = taskId;
		this.lastAction = "view";
		var isViewMode = true;
		this.load(this.pathToView.replace("#task_id#", taskId), isViewMode);
		this.show();
	};

	TasksIFramePopup.prototype.edit = function(taskId) {
		this.init();
		BX.adjust(this.title, {text: BX.message("TASKS_TITLE_EDIT_TASK").replace("#TASK_ID#", taskId)});
		this.currentTaskId = taskId;
		this.lastAction = "edit";
		this.load(this.pathToEdit.replace("#task_id#", taskId));
		this.show();
	};

	TasksIFramePopup.prototype.add = function(params) {
		this.init();
		BX.adjust(this.title, {text: BX.message("TASKS_TITLE_CREATE_TASK")});
		this.currentTaskId = 0;
		this.lastAction = "add";
		var url = this.pathToEdit.replace("#task_id#", 0) + '&UTF8encoded=1';
		this.descriptionBuffered = null;
		for(var name in params)
		{
			if ((name === 'DESCRIPTION') && (params[name].length > 1000))
				this.descriptionBuffered = params[name];
			else
				url += "&" + name + "=" + encodeURIComponent(params[name]);
		}

		this.load(url);
		this.show();
	};

	TasksIFramePopup.prototype.show = function() {
		BX.onCustomEvent(this, "onBeforeShow", []);
		this.overlay.style.display = "block";
		BX.addClass(document.body, "tasks-body-overlay");
		this.closeLink.style.display = 'none';		// This is first part of hack for Chrome due to bug http://jabber.bx/view.php?id=39643
		this.__onWindowResize();
		this.closeLink.style.display = 'block';		// This is last part of hack, I don't know how is it works, but it is.
		BX.bind(this.iframe.contentDocument ? this.iframe.contentDocument : this.iframe.contentWindow.document, "keypress", BX.proxy(this.__onKeyPress, this));
		BX.onCustomEvent(this, "onAfterShow", []);
	};

	TasksIFramePopup.prototype.close = function() {
		BX.onCustomEvent(this, "onBeforeHide", []);
		this.overlay.style.display = "none";
		BX.removeClass(document.body, "tasks-body-overlay");
		BX.unbind(this.iframe.contentDocument ? this.iframe.contentDocument : this.iframe.contentWindow.document, "keypress", BX.proxy(this.__onKeyPress, this));
		BX('tasks-crazy-heavy-cpu-usage-item').className = 'tasks-popup-main-block-wrap tasks-popup-main-block-wrap-bg';
		BX.onCustomEvent(this, "onAfterHide", []);
		/*if(history.replaceState)
		{
			history.replaceState({}, '', this.currentURL);
		}*/
	};

	TasksIFramePopup.prototype.previous = function() {
		var list = this.currentList ? this.currentList : this.tasksList;
		if (this.currentTaskId && list.length > 1)
		{
			var currentIndex = this.__indexOf(this.currentTaskId, list);
			if (currentIndex != -1)
			{
				if (currentIndex == 0)
				{
					var previousIndex = list.length - 1;
				}
				else
				{
					var previousIndex = currentIndex - 1;
				}

				this.view(list[previousIndex], list);
			}
		}
	};

	TasksIFramePopup.prototype.next = function() {
		var list = this.currentList ? this.currentList : this.tasksList;
		if (this.currentTaskId && list.length > 1)
		{
			var currentIndex = this.__indexOf(this.currentTaskId, list);
			if (currentIndex != -1)
			{
				if (currentIndex == list.length - 1)
				{
					var nextIndex = 0;
				}
				else
				{
					var nextIndex = currentIndex + 1;
				}

				this.view(list[nextIndex], list);
			}
		}
	};

	TasksIFramePopup.prototype.load = function(url, isViewMode)
	{
		this.isEditMode = true;
		if (isViewMode === true)
			this.isEditMode = false;

		var loc = this.iframe.contentWindow ? this.iframe.contentWindow.location : "";
		/*if(history.replaceState)
		{
			history.replaceState({}, '', url.replace("?IFRAME=Y", "").replace("&IFRAME=Y", ""))
		}*/

		this.__onUnload();
		this.iframe.src = url;
	};

	TasksIFramePopup.prototype.isOpened = function() {
		this.init();
		return this.overlay.style.display == "block";
	};

	TasksIFramePopup.prototype.isEmpty = function() {
		this.init();
		return this.iframe.contentWindow.location == "about:blank";
	};

	TasksIFramePopup.prototype.isLeftClick = function(event) {
		if (!event.which && event.button !== undefined)
		{
			if (event.button & 1)
				event.which = 1;
			else if (event.button & 4)
				event.which = 2;
			else if (event.button & 2)
				event.which = 3;
			else
				event.which = 0;
		}

		return event.which == 1 || (event.which == 0 && BX.browser.IsIE());
	};

	TasksIFramePopup.prototype.onTaskLoaded = function() {
		this.__onLoad();
	};

	TasksIFramePopup.prototype.onTaskAdded = function(task, action, params, newDataPack, legacyHtmlTaskItem) {
		this.tasksList.push(task.id);
		BX.onCustomEvent(this, "onTaskAdded", [task, action, params, newDataPack, legacyHtmlTaskItem]);
	};

	TasksIFramePopup.prototype.onTaskChanged = function(task, action, params, newDataPack, legacyHtmlTaskItem) {
		BX.onCustomEvent(this, "onTaskChanged", [task, action, params, newDataPack, legacyHtmlTaskItem]);
	};

	TasksIFramePopup.prototype.onTaskDeleted = function(taskId) {
		BX.onCustomEvent(this, "onTaskDeleted", [taskId]);
	};

	TasksIFramePopup.prototype.__onKeyPress = function(e) {
		if (!e) e = window.event;
		if(e.keyCode == 27)
		{
			// var params = {
			// 	canClose : true
			// };

			// BX.onCustomEvent(this, "onBeforeCloseByEscape", [params]);


			//if (params.canClose)

			if (
				(this.lastAction === 'view')
				|| confirm(BX.message('TASKS_CONFIRM_CLOSE_CREATE_DIALOG'))
			)
			{
				this.close();
			}
		}
	};

	TasksIFramePopup.prototype.__indexOf = function(needle, haystack) {
		for(var i = 0, count = haystack.length; i < count; i++) {
			if (needle == haystack[i])
			{
				return i;
			}
		}

		return -1;
	};

	TasksIFramePopup.prototype.__onMouseMove = function(e)
	{
		if (!e)
			e = this.iframe.contentWindow.event;

		var innerDoc = (this.iframe.contentDocument) ? this.iframe.contentDocument : this.iframe.contentWindow.document;

		if (innerDoc && innerDoc.body)
		{
			innerDoc.body.onbeforeunload = BX.proxy(this.__onUnload, this);

			if (this.iframe.contentDocument)
				this.iframe.contentDocument.body.onbeforeunload = BX.proxy(this.__onBeforeUnload, this);

			innerDoc.body.onunload = BX.proxy(this.__onUnload, this);

			var eTarget = e.target || e.srcElement;
			if (eTarget)
			{
				eTargetA = false;
				if (eTarget && eTarget.tagName == "SPAN")
				{
					var oTmp = BX.findParent(eTarget);
					if ((oTmp !== null) && (oTmp.tagName == 'A'))
						eTargetA = oTmp;
				}
				else
					eTargetA = eTarget;

				if (eTargetA.tagName == "A" && eTargetA.href)
				{
					if (eTargetA.href.substr(0, 11) == "javascript:")
					{
						innerDoc.body.onbeforeunload = null;
						innerDoc.body.onunload = null;
					}
					else if (
						(eTargetA.href.indexOf("IFRAME=Y") == -1) 
						&& (eTargetA.href.indexOf("/show_file.php?fid=") == -1)
						&& (eTargetA.target !== '_blank')
					)
					{
						eTargetA.target = "_top";
					}
				}
			}
		}
	};

	TasksIFramePopup.prototype.__onLoad = function() {
		if (!this.isEmpty())
		{
			var innerDoc = (this.iframe.contentDocument) ? this.iframe.contentDocument : this.iframe.contentWindow.document;

			if (innerDoc && innerDoc.body)
			{
				if (BX('tasks-crazy-heavy-cpu-usage-item'))
					BX('tasks-crazy-heavy-cpu-usage-item').className = 'tasks-popup-main-block-wrap';

				this.loading = false;

				innerDoc.body.onmousemove = BX.proxy(this.__onMouseMove, this);

				if (!innerDoc.getElementById("task-reminder-link"))
				{
					window.top.location = innerDoc.location.href.replace("?IFRAME=Y", "").replace("&IFRAME=Y", "").replace("&CALLBACK=CHANGED", "").replace("&CALLBACK=ADDED", "");
				}
				lastSrc = this.iframe.contentWindow.location.href;
				BX.bind(innerDoc, "keyup", BX.proxy(this.__onKeyPress, this));
				this.iframe.style.height = innerDoc.getElementById("tasks-content-outer").offsetHeight + "px";
				this.iframe.style.visibility = "visible";
				this.iframe.contentWindow.focus();

				this.__onWindowResize();
			}

			if (resizeInterval)
				clearInterval(resizeInterval);

			resizeInterval = setInterval(BX.proxy(this.__onContentResize, this), 300);
		}
	};

	TasksIFramePopup.prototype.__onBeforeUnload = function(e)
	{
	};

	TasksIFramePopup.prototype.__onUnload = function(e) {
		if (!e) e = window.event;
		if (!this.loading)
		{
			this.loading = true;
			this.iframe.style.visibility = "hidden";
			clearInterval(resizeInterval);
		}
	};

	TasksIFramePopup.prototype.__onContentResize = function(){
		if (this.isOpened())
		{
			var innerDoc = (this.iframe.contentDocument) ? this.iframe.contentDocument : this.iframe.contentWindow.document;
			if (innerDoc && innerDoc.body)
			{
				var mainContainerHeight = innerDoc.getElementById("tasks-content-outer");
				if (mainContainerHeight)
				{
					var iframeScrollHeight = this.__getWindowScrollHeight(innerDoc);
					var innerSize = BX.GetWindowInnerSize(innerDoc);

					var realHeight = 0;
					if (iframeScrollHeight > innerSize.innerHeight)
						realHeight = iframeScrollHeight - 1;
					else
						realHeight = mainContainerHeight.offsetHeight;//innerDoc.documentElement.scrollHeight;//this.heightDiv ? this.heightDiv.scrollTop + 15 : 0;

					var loc = this.iframe.contentWindow ? this.iframe.contentWindow.location : '';

					if (loc.toString)
						loc = loc.toString();

					if (
						(realHeight != lastheight)
						|| (this.prevIframeSrc != loc)
					)
					{
						lastheight = realHeight;
						this.prevIframeSrc = loc;
						this.iframe.style.height = realHeight + "px";
						this.__onWindowResize();
					}
				}
			}
		}
	};

	TasksIFramePopup.prototype.__getWindowScrollHeight = function(pDoc)
	{
		var height;
		if (!pDoc)
			pDoc = document;

		if ( (pDoc.compatMode && pDoc.compatMode == "CSS1Compat") && !BX.browser.IsSafari())
		{
			height = pDoc.documentElement.scrollHeight;
		}
		else
		{
			if (pDoc.body.scrollHeight > pDoc.body.offsetHeight)
				height = pDoc.body.scrollHeight;
			else
				height = pDoc.body.offsetHeight;
		}
		return height;
	};

	TasksIFramePopup.prototype.__onWindowResize = function(){
		var size = BX.GetWindowInnerSize();
		this.overlay.style.height = size.innerHeight + "px";
		this.overlay.style.width = size.innerWidth + "px";
		var scroll = BX.GetWindowScrollPos();
		this.overlay.style.top = scroll.scrollTop + "px";
		if (BX.browser.IsIE() && !BX.browser.IsIE9())
		{
			this.table.style.width = (size.innerWidth - 20) + "px";
		}
		this.overlay.firstChild.style.height = Math.max(this.iframe.offsetHeight + this.topBottomMargin * 2 + 31, this.overlay.clientHeight) + "px";
		this.overlay.firstChild.style.width = Math.max(1024, this.overlay.clientWidth) + "px";

		this.prevTaskArea.style.width = Math.max(0, Math.max(1024, this.overlay.clientWidth) / 2) + "px";
		this.nextTaskArea.style.width = this.prevTaskArea.style.width;

		this.__adjustControls();
	};

	TasksIFramePopup.prototype.__adjustControls = function(){
		if (this.lastAction != "view" || ((!this.currentList || this.currentList.length <= 1 || this.__indexOf(this.currentTaskId, this.currentList) == -1) && (this.tasksList.length <= 1 || this.__indexOf(this.currentTaskId, this.tasksList) == -1)))
		{
			this.nextTaskLink.style.display = this.prevTaskLink.style.display = "none";
		}
		else
		{
			if(!BX.browser.IsDoctype() && BX.browser.IsIE())
			{
				this.nextTaskLink.style.height = this.prevTaskLink.style.height = document.documentElement.offsetHeight + "px";
				this.prevTaskLink.style.width = (this.prevTaskLink.parentNode.clientWidth - 1) + 'px';
				this.nextTaskLink.style.width = (this.nextTaskLink.parentNode.clientWidth - 1) + 'px';
			}
			else
			{
				this.nextTaskLink.style.height = this.prevTaskLink.style.height = document.documentElement.clientHeight + "px";
				this.prevTaskLink.style.width = this.prevTaskLink.parentNode.clientWidth + 'px';
				this.nextTaskLink.style.width = this.nextTaskLink.parentNode.clientWidth + 'px';
			}
			this.prevTaskLink.firstChild.style.left = (this.prevTaskLink.parentNode.clientWidth * 4 / 10) + 'px';
			this.nextTaskLink.firstChild.style.right = (this.nextTaskLink.parentNode.clientWidth * 4 / 10) + 'px';
			this.nextTaskLink.style.display = this.prevTaskLink.style.display = "";
		}
		this.closeLink.style.width = this.closeLink.parentNode.clientWidth + 'px';
	};
})(window);


(function(){
	if (BX.TasksTimerManager)
		return;

	BX.TasksTimerManager = {
		popup : null,
		onTimeManDataRecievedEventDetected : false
	};


	BX.TasksTimerManager.reLoadInitTimerDataFromServer = function()
	{
		var updated = true;

		// This will run onTimeManDataRecieved/onPlannerDataRecieved 
		// and after it init_timer_data event
		if (window.BXTIMEMAN)
			window.BXTIMEMAN.Update(true);
		else if (window.BXPLANNER && window.BXPLANNER.update)
			window.BXPLANNER.update();
		else
			updated = false;

		if (window.top !== window)
		{
			if (window.top.BXTIMEMAN)
				window.top.BXTIMEMAN.Update(true);
			else if (window.top.BXPLANNER && window.top.BXPLANNER.update)
				window.top.BXPLANNER.update();
		}

		return (updated);
	};


	BX.TasksTimerManager.start = function(taskId)
	{
		BX.CJSTask.batchOperations(
			[{
				operation : 'CTaskTimerManager::getLastTimer()'
			}],
			{
				callbackOnSuccess : (function(taskId){
					return function(data)
					{
						// some other task on timer?
						if (
							(data.rawReply.data[0].returnValue)
							&& (data.rawReply.data[0].returnValue.TASK_ID > 0)
							&& (data.rawReply.data[0].returnValue.TIMER_STARTED_AT > 0)
							&& (taskId != data.rawReply.data[0].returnValue.TASK_ID)
						)
						{
							BX.CJSTask.batchOperations(
								[{
									operation : 'CTaskItem::getTaskData()',
									taskData  : {
										ID : data.rawReply.data[0].returnValue.TASK_ID
									}
								}],
								{
									callbackOnSuccess : (function(taskId){
										return function(data)
										{
											if (
												(data.rawReply.data[0].returnValue.ID)
												&& (taskId != data.rawReply.data[0].returnValue.ID)
											)
											{
												BX.TasksTimerManager.__showConfirmPopup(
													data.rawReply.data[0].returnValue.ID,
													data.rawReply.data[0].returnValue.TITLE,
													(function(taskId){
														return function(bConfirmed)
														{
															if (bConfirmed)
																BX.TasksTimerManager.__doStart(taskId);
														}
													})(taskId)
												);
											}
										};
									})(taskId),
									callbackOnFailure : (function(taskId){
										return function(data)
										{
											// probably task not exists or not accessible
											BX.TasksTimerManager.__doStart(taskId);
										};
									})(taskId)
								},
								true	// sync
							);
						}
						else
							BX.TasksTimerManager.__doStart(taskId);
					}
				})(taskId)
			},
			true	// sync
		);
	};


	BX.TasksTimerManager.stop = function(taskId)
	{
		var oTaskTimer = new BX.CJSTask.TimerManager(taskId);

		oTaskTimer.stop({
			callbackOnSuccess : function(data)
			{
				if (data.status === 'success')
				{
					BX.onCustomEvent(
						window,
						'onTaskTimerChange',
						[{
							module           : 'tasks',
							action           : 'stop_timer',
							taskId           :  data.rawReply.data[0].requestedTaskId,
							taskData         :  data.rawReply.data[1].returnValue,
							timerData        :  data.rawReply.data[2].returnValue
						}]
					);
				}
			}
		});
	};


	BX.TasksTimerManager.__doStart = function(taskId)
	{
		var oTaskTimer = new BX.CJSTask.TimerManager(taskId);
		oTaskTimer.start({
			callbackOnSuccess : function(data)
			{
				if (data.status === 'success')
				{
					BX.onCustomEvent(
						window,
						'onTaskTimerChange',
						[{
							module    : 'tasks',
							action    : 'start_timer',
							taskId    :  data.rawReply.data[0].requestedTaskId,
							taskData  :  data.rawReply.data[1].returnValue,
							timerData :  data.rawReply.data[2].returnValue
						}]
					);
				}
			}
		});
	};


	BX.TasksTimerManager.__showConfirmPopup = function(taskId, taskName, callback)
	{
		if (this.popup)
		{
			this.popup.close();
			this.popup.destroy();
		}

		var message = BX.message('TASKS_TASK_CONFIRM_START_TIMER');
		message = message.replace('#TASK#', '"' + BX.util.htmlspecialchars(taskName) + '"')

		this.popup = new BX.PopupWindow(
			'task-confirm-stop-other-task',
			null,
			{
				zIndex : 22000,
				overlay : { opacity: 50 },
				titleBar : {
					content: BX.create(
						'span',
						{ html : BX.message('TASKS_TASK_CONFIRM_START_TIMER_TITLE') }
					)
				},
				content : '<div style="width: 400px; padding: 25px;">' 
					+ message + '</div>',
				autoHide   : false,
				closeByEsc : false,
				buttons : [
					new BX.PopupWindowButton({
						text: BX.message('TASKS_BTN_CONTINUE'),
						className: "popup-window-button-accept",
						events : {
							click : (function(callback){
								return function() {
									BX.TasksTimerManager.popup.close();
									callback(true);
								}
							})(callback)
						}
					}),
					new BX.PopupWindowButton({
						text: BX.message('TASKS_BTN_CANCEL'),
						events : {
							click : (function(callback){
								return function() {
									BX.TasksTimerManager.popup.close();
									callback(false);
								}
							})(callback)
						}
					})
				]
			}
		);
		this.popup.show();
	};


	BX.TasksTimerManager.refreshDaemon = new function()
	{
		this.data = null;


		this.onTick = function()
		{
			if (this.data !== null)
			{
				var JS_UNIX_TIMESTAMP = Math.round((new Date()).getTime() / 1000);
				this.data.TIMER.RUN_TIME = JS_UNIX_TIMESTAMP - this.data.TIMER.TIMER_STARTED_AT - this.data.UNIX_TIMESTAMP_DELTA;

				BX.onCustomEvent(
					window,
					'onTaskTimerChange',
					[{
						action : 'refresh_daemon_event',
						taskId : this.data.TIMER.TASK_ID,
						data   : this.data
					}]
				);
			}
		};

		BX.ready(
			(function(self){
				return function(){
					BX.CJSTask.setTimerCallback(
						'tasks_timer_refresh_daemon_event',
						(function(self){
							return function(){
								self.onTick();
							}
						})(self),
						1024
					);
				}
			})(this)
		);

		this.catchTimerChange = function(params)
		{
			if (params.module !== 'tasks')
				return;

			if (params.action === 'refresh_daemon_event')
			{
				return;
			}
			else if (params.action === 'stop_timer')
			{
				this.data = null;

				// This will transfer data through browsers tabs
				BX.TasksTimerManager.reLoadInitTimerDataFromServer();
			}
			else if (params.action === 'start_timer')
			{
				if (
					( ! (params.timerData && params.timerData.USER_ID) )
					|| (params.timerData.TASK_ID != params.taskData.ID)
				)
				{
					// We cannot work with this data
					this.data = null;
					return;
				}

				if (params.timerData.TIMER_STARTED_AT == 0)
				{
					// Task on pause
					this.data = null;
					return;
				}

				var UNIX_TIMESTAMP_DELTA = 0;
				var JS_UNIX_TIMESTAMP    = Math.round((new Date()).getTime() / 1000);
				var RUN_TIME             = parseInt(params.timerData.RUN_TIME);
				var TIME_SPENT_IN_LOGS   = parseInt(params.taskData.TIME_SPENT_IN_LOGS);
				var TIMER_STARTED_AT     = parseInt(params.timerData.TIMER_STARTED_AT);

				if (isNaN(RUN_TIME))
					RUN_TIME = 0;

				if (isNaN(TIME_SPENT_IN_LOGS))
					TIME_SPENT_IN_LOGS = 0;

				if (TIMER_STARTED_AT > 0)
					UNIX_TIMESTAMP_DELTA = JS_UNIX_TIMESTAMP - TIMER_STARTED_AT - RUN_TIME;

				this.data = {
					TIMER : {
						TASK_ID          : parseInt(params.timerData.TASK_ID),
						USER_ID          : parseInt(params.timerData.USER_ID),
						TIMER_STARTED_AT : TIMER_STARTED_AT,
						RUN_TIME         : RUN_TIME
					},
					TASK : {
						ID                  : params.taskData.ID,
						TITLE               : params.taskData.TITLE,
						TIME_SPENT_IN_LOGS  : TIME_SPENT_IN_LOGS,
						TIME_ESTIMATE       : parseInt(params.taskData.TIME_ESTIMATE),
						ALLOW_TIME_TRACKING : params.taskData.ALLOW_TIME_TRACKING
					},
					UNIX_TIMESTAMP_DELTA : UNIX_TIMESTAMP_DELTA
				};

				// This will transfer data through browsers tabs
				BX.TasksTimerManager.reLoadInitTimerDataFromServer();
			}
			else if (params.action === 'init_timer_data')
			{
				if (
					( ! (params.data.TIMER && params.data.TIMER.USER_ID) )
					|| (params.data.TIMER.TASK_ID != params.data.TASK.ID)
				)
				{
					// We cannot work with this data
					this.data = null;
					return;
				}

				if (params.data.TIMER.TIMER_STARTED_AT == 0)
				{
					// Task on pause
					this.data = null;
					return;
				}

				var UNIX_TIMESTAMP_DELTA = 0;
				var JS_UNIX_TIMESTAMP    = Math.round((new Date()).getTime() / 1000);
				var RUN_TIME             = parseInt(params.data.TIMER.RUN_TIME);
				var TIME_SPENT_IN_LOGS   = parseInt(params.data.TASK.TIME_SPENT_IN_LOGS);
				var TIMER_STARTED_AT     = parseInt(params.data.TIMER.TIMER_STARTED_AT);

				if (isNaN(RUN_TIME))
					RUN_TIME = 0;

				if (isNaN(TIME_SPENT_IN_LOGS))
					TIME_SPENT_IN_LOGS = 0;

				if (TIMER_STARTED_AT > 0)
					UNIX_TIMESTAMP_DELTA = JS_UNIX_TIMESTAMP - TIMER_STARTED_AT - RUN_TIME;

				this.data = {
					TIMER : {
						TASK_ID          : parseInt(params.data.TIMER.TASK_ID),
						USER_ID          : parseInt(params.data.TIMER.USER_ID),
						TIMER_STARTED_AT : TIMER_STARTED_AT,
						RUN_TIME         : RUN_TIME
					},
					TASK : {
						ID                  : params.data.TASK.ID,
						TITLE               : params.data.TASK.TITLE,
						TIME_SPENT_IN_LOGS  : TIME_SPENT_IN_LOGS,
						TIME_ESTIMATE       : parseInt(params.data.TASK.TIME_ESTIMATE),
						ALLOW_TIME_TRACKING : params.data.TASK.ALLOW_TIME_TRACKING
					},
					UNIX_TIMESTAMP_DELTA : UNIX_TIMESTAMP_DELTA
				};
			}
		};

		BX.addCustomEvent(
			window,
			'onTaskTimerChange',
			(function(self){
				return function(params){
					self.catchTimerChange(params);
				};
			})(this)
		);
	};

	BX.TasksTimerManager.onDataRecieved = function(PLANNER)
	{
		var RUN_TIME = 0;
		var reply = { TIMER : false, TASK : false };

		if ( ! PLANNER )
			return;

		if (PLANNER.TASKS_TIMER)
		{
			if (parseInt(PLANNER.TASKS_TIMER.TIMER_STARTED_AT) > 0)
				RUN_TIME = Math.round((new Date()).getTime() / 1000) - parseInt(PLANNER.TASKS_TIMER.TIMER_STARTED_AT);

			if (RUN_TIME < 0)
				RUN_TIME = 0;

			reply.TIMER = {
				TASK_ID          : PLANNER.TASKS_TIMER.TASK_ID,
				USER_ID          : PLANNER.TASKS_TIMER.USER_ID,
				TIMER_STARTED_AT : PLANNER.TASKS_TIMER.TIMER_STARTED_AT,
				RUN_TIME         : RUN_TIME
			};
		}

		if (PLANNER.TASK_ON_TIMER)
		{
			reply.TASK = {
				ID                  : PLANNER.TASK_ON_TIMER.ID,
				TITLE               : PLANNER.TASK_ON_TIMER.TITLE,
				STATUS              : PLANNER.TASK_ON_TIMER.STATUS,
				TIME_SPENT_IN_LOGS  : PLANNER.TASK_ON_TIMER.TIME_SPENT_IN_LOGS,
				TIME_ESTIMATE       : PLANNER.TASK_ON_TIMER.TIME_ESTIMATE,
				ALLOW_TIME_TRACKING : PLANNER.TASK_ON_TIMER.ALLOW_TIME_TRACKING
			};
		}

		BX.onCustomEvent(
			window,
			'onTaskTimerChange',
			[{
				action : 'init_timer_data',
				module : 'tasks',
				data   :  reply
			}]
		);
	};

	BX.addCustomEvent(
		window,
		'onTimeManDataRecieved',
		function(data){
			BX.TasksTimerManager.onTimeManDataRecievedEventDetected = true;
			if (data.PLANNER)
				BX.TasksTimerManager.onDataRecieved(data.PLANNER);
		}
	);

	BX.addCustomEvent(
		window,
		'onPlannerDataRecieved',
		function(obPlanner, data){
			if (BX.TasksTimerManager.onTimeManDataRecievedEventDetected === false)
				BX.TasksTimerManager.onDataRecieved(data);
		}
	);
})();


/* End */
;