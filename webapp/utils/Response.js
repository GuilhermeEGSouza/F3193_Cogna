/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"scm/ewm/packoutbdlvs1/utils/CustomError",
	"scm/ewm/packoutbdlvs1/modelHelper/Message"
], function (CustomError, Message) {
	"use strict";
	return {
		parseError: function (mResponse, reject) {
			var sKey, sMessage;
			var oError;
			if (mResponse.MsgType === "E" || mResponse.MsgSuccess === false) {
				sKey = mResponse.MsgId + "-" + mResponse.MsgKey;
				sMessage = mResponse.MsgVar;
				oError = new CustomError(sKey, sMessage, mResponse);
				reject(oError);
			}
			return oError;
		},
		parseWarning: function (mResponse) {
			if (mResponse.MsgType === "W") {
				Message.addWarning(mResponse.MsgVar);
			}

		},
		parseSuccess: function (mResponse) {
			if (mResponse.MsgType === "S") {
				if (this.getMessage(mResponse.MsgVar)) {
					Message.addSuccess(mResponse.MsgVar);
				}
			}
		},
		parseErrorAsWarning: function (mResponse) {
			if (mResponse.MsgType === "E" || mResponse.MsgSuccess === false) {
				if (this.getMessage(mResponse.MsgVar)) {
					Message.addWarning(mResponse.MsgVar);
				}
			}
		},
		getMessage: function (sMessage) {
			return sMessage && sMessage !== "" ? true : false;
		}
	};
});