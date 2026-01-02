/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/utils/ErrorHandler",
	"scm/ewm/packoutbdlvs1/utils/Util"
], function(ErrorHandler, Util) {
	"use strict";

	function WorkFlow() {
		this._aHandler = [];
		this._oErrorHandler = new ErrorHandler();
		this._oResult = null;
	}
	WorkFlow.prototype.then = function(fnHandler, context) {
		this._aHandler.push(fnHandler.bind(context));
		return this;
	};
	WorkFlow.prototype.run = function(vPara) {
		var that = this;
		var mSession = {};
		this._oResult = new Promise(function(resolve, reject) {
			var _oPromise = Promise.resolve(vPara);
			this._aHandler.forEach(function(fnHandler) {
				_oPromise = _oPromise.then(function(vResult) {
					return fnHandler(vResult, mSession);
				});
			});
			_oPromise.then(function() {
				resolve();
			});
			_oPromise.catch(function(vError) {
				that._oErrorHandler.catch(vError, mSession);
				//pass the error out
				reject(vError);
			});
		}.bind(this));
		return this;
	};
	WorkFlow.prototype.getResult = function() {
		return this._oResult;
	};
	WorkFlow.prototype.errors = function() {
		return this._oErrorHandler;
	};

	return WorkFlow;
});