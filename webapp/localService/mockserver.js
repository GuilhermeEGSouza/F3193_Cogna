/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/util/MockServer", "scm/ewm/packoutbdlvs1/utils/Util", "scm/ewm/packoutbdlvs1/localService/mockConfig",
		"scm/ewm/packoutbdlvs1/Component", "sap/ui/thirdparty/sinon"
	],
	function (MockServer, Util, mockConfig, Component, sinon) {
		"use strict";
		var oMockServer,
			_sAppModulePath = "scm/ewm/packoutbdlvs1/",
			_sJsonFilesModulePath = _sAppModulePath + "localService/mockdata";
		return {
			/**
			 * Initializes the mock server.
			 * You can configure the delay with the URL parameter "serverDelay".
			 * The local mock data in this folder is returned instead of the real data for testing.
			 * @public
			 */
			init: function () {
				this._mockComponent();
				this._mockShell();
				var sManifestUrl = jQuery.sap.getModulePath(_sAppModulePath + "manifest", ".json"),
					oManifest = jQuery.sap.syncGetJSON(sManifestUrl).data;

				oMockServer = this._initMockServerByDataSource(oManifest["sap.app"].dataSources.mainService);
				var oDefaultMockServer = this._initMockServerByDataSource(oManifest["sap.app"].dataSources.defaultParametersService);
				this.initSimulates(mockConfig);

				oMockServer.start();
				oDefaultMockServer.start();

				jQuery.sap.log.info("Running the app with mock data");
			},
			_mockComponent: function () {
				sinon.stub(Component.prototype, "getComponentData").returns({
					startupParameters: {
						Warehouse: ["EW1"],
						PackMode: [1]
					}
				});
			},
			_mockShell: function () {
				//mock sap.ushell service
			},
			_initMockServerByDataSource: function (oDataSource) {
				jQuery.sap.getModulePath(_sAppModulePath + "manifest", ".json");
				var oUriParameters = jQuery.sap.getUriParameters();
				var sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath);
				var sMetadataUrl = jQuery.sap.getModulePath(_sAppModulePath + oDataSource.settings.localUri.replace(".xml", ""), ".xml");
				var sMockServerUrl = /.*\/$/.test(oDataSource.uri) ? oDataSource.uri : oDataSource.uri + "/";
				var mockServer = new MockServer({
					rootUri: sMockServerUrl
				});

				// configure mock server with a delay of 0.1s
				MockServer.config({
					autoRespond: true,
					autoRespondAfter: oUriParameters.get("serverDelay") || 50
				});

				mockServer.simulate(sMetadataUrl, {
					sMockdataBaseUrl: sJsonFilesUrl,
					bGenerateMissingMockData: true
				});
				return mockServer;
			},
			initSimulates: function (aConfig) {
				var aRequests = oMockServer.getRequests();
				aConfig.forEach(function (mConfig) {
					var sMethod = mConfig.method ? mConfig.method.toUpperCase() : "GET";
					aRequests.push({
						method: sMethod,
						path: mConfig.path,
						response: function (oXhr, sUrlParams) {
							var sResponseUrl;
							if (typeof mConfig.response === "string") {
								sResponseUrl = mConfig.response;
							} else if (mConfig.response instanceof Function) {
								var vBody;
								if (mConfig.method === "POST" || mConfig.method === "PUT") {
									vBody = JSON.parse(oXhr.requestBody);
								}
								sResponseUrl = mConfig.response(sUrlParams, vBody);
							} else {
								jQuery.sap.log.error("mock server config: invalide config info for request path:" + mConfig.path);
							}
							if (sResponseUrl === undefined) {
								jQuery.sap.log.error("not found a valide response for request path:" + mConfig.path);
							}
							var oResponse = jQuery.sap.sjax({
								url: sResponseUrl
							});
							oXhr.respondJSON(200, {}, JSON.stringify(oResponse.data));
							return true;
						}
					});
				});
				oMockServer.setRequests(aRequests);
			},

			getParameterByName: function (name, url) {
				var match = RegExp("[?&]" + name + "=([^&]*)").exec(url);
				return match && decodeURIComponent(match[1].replace(/\+/g, " "));
			}
		};
	});