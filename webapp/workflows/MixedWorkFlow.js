/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/workflows/WorkFlow",
	"scm/ewm/packoutbdlvs1/modelHelper/Global"
], function(WorkFlow, Global) {
	"use strict";
	/**
	 * support async mode. 
	 */
	//observer object will be resolve/rejected after no pending async request. based on _bFailed flag
	var _oObserver = null;
	//indicator of if there are failed pending service since _oObserver assigned.
	var _bFailed = false;
	function MixedWorkFlow() {
		this.asyncPromise = null;
		WorkFlow.apply(this, arguments);
		this._aFnServiceSuccessCallback = [];
	}
	MixedWorkFlow.reset = function() {
		Global.resetPendingTaskNumber();
		_oObserver = null;
		_bFailed = false;
	};
	MixedWorkFlow.decreaseCounter = function() {
		var iNumber = Global.decreasePendingTaskNumber();
		var Observer;
		var bFailed;
		if(iNumber === 0 && _oObserver) {
			Observer = _oObserver;
			bFailed = _bFailed;
			//reset it first in case of any errors of reject/resolve may not work.
			MixedWorkFlow.reset();
			if(bFailed) {
				Observer.reject();
			} else {
				Observer.resolve();
			}
		}
	};
	//only one observer object at a time
	//todo:: remove, as it is promise chainable
	MixedWorkFlow.setObserver = function(resolve, reject) {
		if(_oObserver !== null) {
			jQuery.sap.log.warning("there is alread a observerble object");
			_oObserver = null;
		}
		// ignore the previouse error
		_bFailed = false;
		if(Global.getPendingTaskNumber() > 0) {
			_oObserver = {
				resolve: resolve,
				reject: reject
			};
		} else {
			resolve();
		}
	};
	
	MixedWorkFlow.prototype = Object.create(WorkFlow.prototype);
	MixedWorkFlow.prototype.constructor = MixedWorkFlow;
	
	//return the promise of the case
	MixedWorkFlow.prototype.service = function(fnHandler, context) {
		var self = this;
		if(Global.getAsyncMode()) {
			this.then(function(vResult, mSession){
				self.asyncPromise = new Promise(function(resolve, reject) {
					var _promsie = fnHandler.apply(context, [vResult, mSession]);
					//there will be no request in some case, on simple mode
					if(_promsie) {
						Global.increasePendingTaskNumber();
						self._aFnServiceSuccessCallback.forEach(function(fnCallback) {
							_promsie = _promsie.then(function(vPre){
								return fnCallback(vPre, mSession);
							});
						});
						_promsie = _promsie.then(function(){
							MixedWorkFlow.decreaseCounter();
							resolve();
						});
						_promsie.catch(function(vError) {
							_bFailed = true;
							MixedWorkFlow.decreaseCounter();
							self._oErrorHandler.catch(vError, mSession);
							reject(vError);
						});
					} else {
						resolve();
					}
				});
				
			}, context);
		} else {
			this.then(fnHandler, context);
		}
		return this;
	};
	MixedWorkFlow.prototype.getAsyncPromise = function() {
		return this.asyncPromise;	
	};
	//only works for async mode todo:: refine
	MixedWorkFlow.prototype.serviceCallback = function(fnHandler, context) {
		this._aFnServiceSuccessCallback.push(fnHandler.bind(context));
		return this;
	};
	MixedWorkFlow.prototype.asyncOnly = function(fnHandler, context) {
		if(Global.getAsyncMode()) {
			this.then(fnHandler, context);
		}
		return this;
	};
	MixedWorkFlow.prototype.syncOnly = function(fnHandler, context) {
		if(!Global.getAsyncMode()) {
			this.then(fnHandler, context);
		}
		return this;
	};

	return MixedWorkFlow;
});