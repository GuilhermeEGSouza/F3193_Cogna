/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/utils/CustomError",
	"scm/ewm/packoutbdlvs1/utils/Util",
	"scm/ewm/packoutbdlvs1/utils/Const",
	"scm/ewm/packoutbdlvs1/modelHelper/Message"
], function(CustomError, Util, Const, Message) {
	"use strict";

	function ErrorHandler() {
		this._mHandler = {};
		this._afnAlways = [];
		this._afnDefault = [];
	}
	ErrorHandler.sDefaultMessage = null;
	ErrorHandler.prototype.subscribe = function(sKey, fnHandler, context) {
		if (!this._mHandler[sKey]) {
			this._mHandler[sKey] = [];
		}
		this._mHandler[sKey].push(fnHandler.bind(context));
		return this;
	};
	ErrorHandler.prototype.default = function(fnCallback, context) {
		this._afnDefault.push(fnCallback.bind(context));
		return this;
	};
	ErrorHandler.prototype.always = function(fnCallback, context) {
		this._afnAlways.push(fnCallback.bind(context));
		return this;
	};
	ErrorHandler.prototype.catch = function(vError, mSession) {
		var sKey, vPara, sDescription, bCustomErrorUnprocessed = false;
		if (vError instanceof CustomError) {
			if(!vError.getProcessed()) {
				bCustomErrorUnprocessed = true;
				vError.setProcessed(true);
			}
			sKey = vError.getKey();
			sDescription = vError.getDescription();
			vPara = vError.getParameters();

		} else if (Util.isString(vError)) {
			sKey = vError;
			sDescription = vError;
		} else {
			sKey = ErrorHandler.sDefaultMessage;
			sDescription = ErrorHandler.sDefaultMessage;
			jQuery.sap.log.error("unexpected error");
		}

		var aCallback = this._mHandler[sKey];
		if (aCallback) {
			aCallback.forEach(function(fnCallback) {
				fnCallback(sDescription, vPara, mSession);
			});
		}
		if (sKey === Const.ERRORS.INTERRUPT_WITH_NO_ACTION) {
			//if it is an interruption, return then do not execution always
			//todo:: need reconsider always function as it may cause confusion now
			return;
		}
		if (!aCallback) {
			if (this._afnDefault.length > 0) {
				this._afnDefault.forEach(function(fnDefault) {
					fnDefault(sDescription, vPara, mSession, bCustomErrorUnprocessed);
				});
			}
		}

		if (this._afnAlways.length > 0) {
			this._afnAlways.forEach(function(fnAlways) {
				fnAlways(sDescription, vPara, mSession);
			});
		}
		return vError;
	};

	return ErrorHandler;
});