/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/ValueState",
	"zcogna/ewm/packoutbdlvs1/model/Global",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Global",
	"zcogna/ewm/packoutbdlvs1/utils/Util",
	"zcogna/ewm/packoutbdlvs1/modelHelper/SerialNumber",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Cache",
	"zcogna/ewm/packoutbdlvs1/utils/Const",
	"zcogna/ewm/packoutbdlvs1/model/PackingMode",
	"zcogna/ewm/packoutbdlvs1/modelHelper/PackingMode",
	"sap/ui/core/CustomData",
	"sap/ushell/ui/footerbar/AddBookmarkButton",
	"sap/suite/ui/commons/collaboration/ServiceContainer",
	"sap/suite/ui/commons/collaboration/CollaborationHelper",
	'sap/ui/performance/trace/FESRHelper',
	"sap/ui/model/json/JSONModel",
	"sap/fe/navigation/NavigationHandler",
	"zcogna/ewm/packoutbdlvs1/model/Material",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Material",
	"zcogna/ewm/packoutbdlvs1/model/AdvancedSourceTableSetting",
	"zcogna/ewm/packoutbdlvs1/model/BasicSourceTableSetting",
	"zcogna/ewm/packoutbdlvs1/model/InternalSourceTableSetting",
	"zcogna/ewm/packoutbdlvs1/model/AdvancedShipTableSetting",
	"zcogna/ewm/packoutbdlvs1/model/BasicShipTableSetting",
	"zcogna/ewm/packoutbdlvs1/model/InternalShipTableSetting",
	"zcogna/ewm/packoutbdlvs1/modelHelper/ItemWeight",
	"zcogna/ewm/packoutbdlvs1/modelHelper/Message",
	"zcogna/ewm/packoutbdlvs1/service/ODataService"
], function (Controller, MessageBox, ValueState, GlobalModel, GlobalHelper, Util, SerialNumber, Cache, Const, PackingModeModel,
	PackingMode, CustomData,
	AddBookmarkButton,
	ServiceContainer, CollaborationHelper, FESRHelper, JSONModel, NavigationHandler, MaterialModel, MaterialHelper,
	AdvancedSourceTableSetting, BasicSourceTableSetting, InternalSourceTableSetting, AdvancedShipTableSetting, BasicShipTableSetting,
	InternalShipTableSetting, ItemWeight, MessageHelper, Service) {
	"use strict";

	var audioId = "audio-player";
	var sSourceViewId_PostFix = "source-view";
	var sShipViewId_PostFix = "ship-view";
	var sAdvanced_MainView_PostFix = "main";
	var sInternal_MainView_PostFix = "internal";
	var sBasic_MainView_PostFix = "simple";
	var sDefaultViewId_PostFix = "default";
	return Controller.extend("zcogna.ewm.packoutbdlvs1.controller.BaseController", {

		bCollaborationInitialized: false,

		onInit: function () {
			this.setModel(GlobalModel, "global");

			//set i18n model to the view
			this.setModel(this.getOwnerComponent().getModel("i18n"), "i18n");
			this.initModel();
			this.initWorkFlow();
			this.initErrorHandler();
			this.initSubscription();
			this.init();
			this.oPersonalizationService = this.getPersonalizationService();
			this.oNavigationHandler = new NavigationHandler(this);
			if (this.getView().getId().endsWith(sAdvanced_MainView_PostFix) || this.getView().getId().endsWith(sInternal_MainView_PostFix) ||
				this.getView().getId().endsWith(sBasic_MainView_PostFix)) {
				this.initShareFunctions();
			}

			var url = window.location.href;
			if (url.includes("sap-iapp-state")) {
				this.initAppState();
			}

			this.getRouter().attachRouteMatched(function (oEvent) {
				var oParameters = oEvent.getParameters();
				if (oParameters.name === this.sRouteName) {
					if (Util.isEmpty(GlobalHelper.getWarehouseNumber()) || Util.isEmpty(GlobalHelper.getPackStation())) {
						if (this.sRouteName !== Const.DEFAULT_ROUTE_NAME) {
							this.getRouter().navTo("default", true);
						}
					} else {
						this.onRouteMatched(oParameters.arguments);
					}
					if (oParameters.name !== Const.DEFAULT_ROUTE_NAME) {
						this.publish(Const.EVENT_BUS.CHANNELS.ROUTE_MATCHED, Const.EVENT_BUS.EVENTS.SUCCESS);
					}
				}

			}.bind(this), this);
		},

		initShareFunctions: function () {
			//Below are the code for Share Functions "Send as Email", "Save as Tile" and "Microsoft Teams"
			this.oBookmarkButton = null;
			var oResourceBundleM = sap.ui.getCore().getLibraryResourceBundle("sap.m");
			this.oShareActionSheet = this.byId("ShareButton");

			// share Model: holds all the sharing relevant texts and info
			var oShareModel = new JSONModel({
				// BUTTON TEXTS
				emailButtonText: oResourceBundleM.getText("SEMANTIC_CONTROL_SEND_EMAIL"),
				bookmarkButtonText: oResourceBundleM.getText("SEMANTIC_CONTROL_SAVE_AS_TILE"),
				// BOOKMARK START
				bookmarkTitle: PackingMode.isInternalMode() ? this.getI18nText("BOOKMARK_TITLE_PWS") : this.getI18nText("BOOKMARK_TITLE_POD"),
				bookmarkSubtitle: "",
				bookmarkIcon: PackingMode.isInternalMode() ? "sap-icon://Fiori2/F3738" : "sap-icon://Fiori2/F3193",
				bookmarkCustomUrl: function () {
					this.storeCurrentAppState();
					if (!window.hasher) {
						sap.ui.require("sap/ui/thirdparty/hasher");
					}
					var sHash = window.hasher.getHash();
					return sHash ? ("#" + sHash) : window.location.href;
				}.bind(this),
				bookmarkServiceUrl: function () {
					var serviceUrl = PackingMode.isInternalMode() ?
						'/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#EWMWorkCenter-packInternal?PackMode=2' :
						'/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html#EWMOutboundDelivery-packOutboundDelivery?PackMode=1';
					return serviceUrl;
				}.bind(this),
				// BOOKMARK END
				// Teams START
				teamsTitle: PackingMode.isInternalMode() ? this.getI18nText("TEAMS_TITLE_PWS") : this.getI18nText("TEAMS_TITLE_POD"),
				// Teams END
				// EMAIL START
				emailSubject: PackingMode.isInternalMode() ? this.getI18nText("EMAIL_SUBJECT_PWS") : this.getI18nText("EMAIL_SUBJECT_POD")
					// EMAIL END
			});

			// Collaboration integration (e.g. MS Teams)
			CollaborationHelper.isTeamsModeActive().then(function (bIsActive) {
				// hides the share menu button when url has &appState=lean&sap-collaboration-teams=true parameters
				oShareModel.setProperty('/isShareMenuButtonVisible', !bIsActive);
			}.bind(this));

			this.oInternalShareButton = this.byId("ShareButton-internalBtn");

			if (!Util.isEmpty(this.oInternalShareButton)) {
				this.oInternalShareButton.attachPress(function () {
					if (!this.bCollaborationInitialized) {
						this.adjustShareMenu();
					}
				}.bind(this));
			}

			// setting the models to the view
			this.setModel(oShareModel, "share");
		},

		initModel: function () {

		},
		initWorkFlow: function () {

		},
		initErrorHandler: function () {

		},
		initSubscription: function () {

		},
		init: function () {

		},
		onRouteMatched: function (oEvent) {},

		oItemHelper: null, //table items helper method
		_updateInput: function (vInput, sValueState, sValueStateText, sValue) {
			var oInput = vInput;
			if (typeof vInput === "string") {
				oInput = this.byId(vInput);
			}
			oInput.setValueState(sValueState);
			oInput.setValueStateText(sValueStateText);
			if (sValue !== undefined) {
				oInput.setValue(sValue);
			}
		},
		onCancelDialog: function (oEvent) {
			oEvent.getSource().getParent().close();
			this.setBusy(false);
		},
		/**
		 * set the input control to None, and clear all error message. if sVaule is undefined, then keep the current value
		 * 
		 * @param {string} sId The id of input control
		 * @param {string} sValue The value which want to set to the input. if undefied, keep the current value.
		 */
		updateInputWithDefault: function (vInput, sValue) {
			this._updateInput(vInput, ValueState.None, "", sValue);
		},
		updateInputWithWarning: function (vInput, sWarningMsg, sValue) {
			this._updateInput(vInput, ValueState.Warning, sWarningMsg, sValue);
		},
		updateInputWithSuccess: function (vInput, sValue) {
			this._updateInput(vInput, ValueState.Success, "", sValue);
		},
		updateInputWithError: function (vInput, sErrorText) {
			var sError = "";
			if (Util.isEmpty(sErrorText)) {
				sError = this.getI18nText("invalidEntry");
			} else {
				sError = sErrorText;
			}
			this._updateInput(vInput, ValueState.Error, sError, "");
		},

		getI18nText: function (sText, aParameter) {
			var i18n = this.getOwnerComponent().getModel("i18n");
			return i18n.getResourceBundle().getText(sText, aParameter);
		},
		setModel: function (oModel, sName) {
			this.getView().setModel(oModel, sName);
		},
		getModel: function (sModelName) {
			return this.getOwnerComponent().getModel(sModelName);
		},
		getGlobalModel: function () {
			return this.getView().getModel("global");
		},
		getSourceHU: function () {
			return this.getGlobalModel().getProperty("/sSourceHandlingUnit");
		},
		setSourceHU: function (sValue) {
			this.getGlobalModel().setProperty("/sSourceHandlingUnit", sValue);
		},

		setInputEnable: function (sId, bEnable) {
			var oInput = this.byId(sId);
			oInput.setEnable(bEnable);
		},
		focus: function (vInput) {
			var oInput = vInput;
			if (typeof vInput === "string") {
				oInput = this.byId(vInput);
			}
			oInput.focus();
			return this;
		},
		getValue: function (vInput) {
			var oInput = vInput;
			if (typeof vInput === "string") {
				oInput = this.byId(vInput);
			}
			return oInput.getValue();
		},
		getValueState: function (vInput) {
			var oInput = vInput;
			if (typeof vInput === "string") {
				oInput = this.byId(vInput);
			}
			return oInput.getValueState();
		},
		displayInfoMessageBox: function (sMessage) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.information(
				sMessage, {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			);
			this.playAudio(Const.INFO);
		},
		showErrorMessageBox: function (sMessage) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.error(
				sMessage, {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			);
			this.playAudio(Const.ERROR);
		},
		setBusy: function (bBusy) {
			GlobalHelper.setBusy(!!bBusy);
		},
		publish: function (sChannel, sEvent, mParam) {
			this.getEventBus().publish(sChannel, sEvent, mParam);
		},
		subscribe: function (sChannel, sEvent, fnCallback) {
			this.getEventBus().subscribe(sChannel, sEvent, fnCallback);
		},
		getEventBus: function () {
			return this.getOwnerComponent().getEventBus();
		},
		formatSerialIcon: function (bSerial) {
			var sIcon = "sap-icon://minimize";
			if (bSerial) {
				sIcon = "sap-icon://bullet-text";
			}
			return sIcon;
		},
		formatEnableBtn: function (sValue) {
			if (GlobalHelper.hasOpenShipHandlingUnit()) {
				return true;
			}
			return false;
		},
		//the cached promise object for dialogue
		_mDialogPromise: null,
		openDialog: function (oDialog) {
			var that = this;
			if (this._mDialogPromise !== null) {
				jQuery.sap.log.error("The prev closeDialog not called");
			}
			oDialog.open();
			return new Promise(function (resolve, reject) {
				that._mDialogPromise = {
					resolve: resolve,
					reject: reject
				};
			});

		},
		cancelDialog: function (oEvent) {
			this.closeDialog(oEvent.getSource().getParent(), Const.ERRORS.INTERRUPT_WITH_NO_ACTION, true);
			this.setBusy(false);
		},

		closeDialog: function (oDialog, vData, bReject) {
			if (this._mDialogPromise === null) {
				jQuery.sap.log.error("openDialog/closeDialog must be pair worked");
			}
			oDialog.close();
			if (bReject) {
				this._mDialogPromise.reject(vData);
			} else {
				this._mDialogPromise.resolve(vData);
			}
			this._mDialogPromise = null;
		},
		openSerialNumberPopover: function (oEvent, sModelName, oItemHelper) {
			var oIcon = oEvent.getSource();
			var oItem = oEvent.getSource().getBindingContext(sModelName).getObject();
			var oView = this.getView();
			var iuidActive = oItem.isIuidActive == Const.ABAP_TRUE ? true : false;
			var oPopover = oView.byId("serial-number-popover");
			var oPopoverUii = oView.byId("serial-number-uii-popover");
			if (iuidActive) {
				SerialNumber.setSerialNumberUiisList(oItemHelper.getItemSerialNumberUii(oItem));
				if (!oPopoverUii) {
					oPopoverUii = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.SerialNumberUiiPopover", this);
					oView.addDependent(oPopoverUii);
				}
				if (oPopover) {
					oPopover.close();
				}
				oPopoverUii.openBy(oIcon);
			} else {
				SerialNumber.setSerialNumbersList(oItemHelper.getItemSerialNumber(oItem));
				if (!oPopover) {
					oPopover = sap.ui.xmlfragment(oView.getId(), "zcogna.ewm.packoutbdlvs1.view.SerialNumberPopover", this);
					oView.addDependent(oPopover);
				}
				if (oPopoverUii) {
					oPopoverUii.close();
				}
				oPopover.openBy(oIcon);
			}
		},
		onAfterOpenSerialNumberPopover: function (oEvent) {
			oEvent.getSource().focus();
		},
		checkQuantityOverflow: function (fQuantity, oInput) {
			if (!isNaN(fQuantity) && Util.isQuantityOverflow(fQuantity)) {
				var sRoundQuantity = Util.formatNumber(fQuantity, 3);
				var sWarningText = this.getI18nText("roundUpQuantity");
				this.updateInputWithWarning(oInput, sWarningText, sRoundQuantity);
				this.focus(oInput);
				return true;
			}
			return false;
		},
		getRouter: function () {
			return this.getOwnerComponent().getRouter();
		},
		navToHome: function () {
			var fnFlushPendings = Util.flushPendings.get();
			if (fnFlushPendings) {
				fnFlushPendings().then(function () {
					// get a handle on the global XAppNav service
					var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
					var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
						target: {
							shellHash: "#Shell-home"
						}
					})) || "";
					//Generate a  URL for the second application
					var url = window.location.href.split('#')[0] + hash.split('?')[0];
					//Navigate to second app
					sap.m.URLHelper.redirect(url, false);

				}.bind(this));
			}
		},
		playAudio: function (sMsgType) {
			var oAudio = this.getAudioFromParent(this.oView);
			oAudio.play(sMsgType);
		},
		getAudioFromParent: function (oView) {
			if (oView.byId && oView.byId(audioId)) {
				this.oAudio = oView.byId(audioId);
			} else {
				this.getAudioFromParent(oView.getParent());
			}
			return this.oAudio;
		},
		setButtonToolTip: function (sId) {
			var oButton = this.byId(sId);
			if (Util.isEmpty(oButton)) {
				return;
			}
			var sTooltip = oButton.getTooltip();
			if (Util.isEmpty(sTooltip)) {
				oButton.setTooltip(oButton.getText());
			}
		},
		getTextAccordingToMode: function (sInternalKey, sOutBoundKey, aParameter, sMode) {
			var sPackMode = Util.isEmpty(sMode) ? PackingMode.getSelectedMode() : sMode;
			var sMessage = "";
			if (sPackMode === Const.INTERNAL_MODE) {
				if (Util.isEmpty(aParameter) || aParameter.length === 0) {
					sMessage = this.getI18nText(sInternalKey);
				} else {
					sMessage = this.getI18nText(sInternalKey, aParameter);
				}
			} else {
				if (Util.isEmpty(aParameter) || aParameter.length === 0) {
					sMessage = this.getI18nText(sOutBoundKey);
				} else {
					sMessage = this.getI18nText(sOutBoundKey, aParameter);
				}
			}
			return sMessage;
		},

		getPersonalizationService: function () {
			return sap.ushell.Container.getService("Personalization");
		},

		getPersonalizationContainer: function () {
			return new Promise(function (resolve, reject) {
				var sContainer = this.getContainerId();
				this.oPersonalizationService.getContainer(sContainer)
					.fail(function () {
						var oContainer = this.oPersonalizationService.createEmptyContainer(sContainer);
						resolve(oContainer);
					}.bind(this))
					.done(function (oContainer) {
						resolve(oContainer);
					}.bind(this));
			}.bind(this));
		},
		getContainerId: function () {
			return PackingMode.getSelectedMode() !== Const.INTERNAL_MODE ? "zcogna.ewm.packoutbdlvs1" :
				"zcogna.ewm.packoutbdlvs1.av1";
		},

		//Below are functions for Share Functions "Send as Email", "Save as Tile" and "Microsoft Teams" 		
		/**
		 * Event handler when a Teams menu item is selected 
		 * @public
		 */
		onTeamsMenuItemPressed: function () {
			var oView = this.getParent();
			var that = this;
			while (!(oView instanceof sap.ui.core.mvc.XMLView)) {
				oView = oView.getParent();
			}
			oView.getController().storeCurrentAppState().done(function () {
				ServiceContainer.getServiceAsync().then(function (oTeamsHelper) {
					var oShareModel = this.getModel("share");
					var data = {
						url: document.URL,
						appTitle: oShareModel.getProperty("/teamsTitle"),
						subTitle: "",
						minifyUrlForChat: true
					};
					oTeamsHelper.share(this.getCustomData()[0].getValue(), data);
				}.bind(that));
			});
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPressed: function () {
			this.storeCurrentAppState().done(function () {
				var oShareModel = this.getView().getModel("share");
				sap.m.URLHelper.triggerEmail(
					null,
					oShareModel.getProperty("/emailSubject"),
					document.URL
				);
			}.bind(this));
		},

		/**
		 * Event handler when Save as Tile button has been clicked 
		 * @public
		 */
		onSaveAsTilePressed: function () {
			var that = this;
			this.storeCurrentAppState().done(function () {
				if (!this.oBookmarkButton) {
					var oShareModel = that.getView().getModel("share");
					this.oBookmarkButton = new AddBookmarkButton("", {
						customUrl: oShareModel.getProperty("/bookmarkCustomUrl"),
						title: oShareModel.getProperty("/bookmarkTitle"),
						subtitle: oShareModel.getProperty("/bookmarkSubtitle"),
						tileIcon: oShareModel.getProperty("/bookmarkIcon")
					});
				}
				this.oBookmarkButton.firePress();
			});
		},

		/**
		 * Changes the URL according to the current app state and stores the app state for later retrieval.
		 */
		storeCurrentAppState: function () {
			var oAppStatePromise = this.oNavigationHandler.storeInnerAppStateAsync(this.getCurrentAppState());
			oAppStatePromise.done(function (sAppStateKey) {
				//your inner app state is saved now; sAppStateKey was added to URL
			}.bind(this));
			oAppStatePromise.fail(function (oError) {
				this._handleError(oError);
			}.bind(this));
			return oAppStatePromise;
		},

		adjustShareMenu: function (oEvent) {
			var iIndexForCollaborationOptions = 1;
			ServiceContainer.getServiceAsync().then(function (oTeamsHelper) {
				var aItems = oTeamsHelper.getOptions();
				if (aItems.length > 0) {
					this.bCollaborationInitialized = true;
					aItems.forEach(function (oMainMenuItem) {
						if (oMainMenuItem.subOptions && oMainMenuItem.subOptions.length > 1) {
							var aMenus = [];
							oMainMenuItem.subOptions.forEach(function (menuItem) {
								var oItem = new sap.m.MenuItem({
									text: menuItem.text,
									icon: menuItem.icon,
									press: this.onTeamsMenuItemPressed
								});
								oItem.addCustomData(new CustomData({
									key: "data",
									value: menuItem
								}));
								FESRHelper.setSemanticStepname(oItem, "press", menuItem.fesrStepName);
								aMenus.push(oItem);
							}.bind(this));
							this.oShareActionSheet.getMenu().insertItem(new sap.m.MenuItem({
								text: oMainMenuItem.text,
								icon: oMainMenuItem.icon,
								items: aMenus
							}), iIndexForCollaborationOptions);
						} else {
							var oItem = new sap.m.MenuItem({
								text: oMainMenuItem.text,
								icon: oMainMenuItem.icon,
								press: this.onTeamsMenuItemPressed
							});
							oItem.addCustomData(new CustomData({
								key: "data",
								value: oMainMenuItem
							}));
							FESRHelper.setSemanticStepname(oItem, "press", oMainMenuItem.fesrStepName);
							this.oShareActionSheet.getMenu().insertItem(oItem, iIndexForCollaborationOptions);
						}
						iIndexForCollaborationOptions++;
					}.bind(this));
				}
			}.bind(this));
		},

		/*
		 * @param {string} sMessage
		 * Show error message in message box
		 * public
		 */
		showErrorMessagePopup: function (sMessage) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var oInput = this.getView().byId(Const.ID.PRODUCT_INPUT);
			MessageBox.error(
				sMessage, {
					styleClass: bCompact ? "sapUiSizeCompact" : "",
					actions: [sap.m.MessageBox.Action.OK],
					onClose: function () {
						this.focus(oInput);
					}.bind(this)
				}
			);
		},

		/**
		 * @returns {object} the current app state consisting of the selection variant, the table variant and additional custom data
		 */
		getCurrentAppState: function () {
			var oSourceTabelSetting, oShipTabelSetting;
			if (PackingMode.isAdvancedMode()) {
				oSourceTabelSetting = AdvancedSourceTableSetting.getJSON();
				oShipTabelSetting = AdvancedShipTableSetting.getJSON();
			} else if (PackingMode.isInternalMode()) {
				oSourceTabelSetting = InternalSourceTableSetting.getJSON();
				oShipTabelSetting = InternalShipTableSetting.getJSON();
			} else {
				oSourceTabelSetting = BasicSourceTableSetting.getJSON();
				oShipTabelSetting = BasicShipTableSetting.getJSON();
			}

			return {
				globalModel: GlobalModel.getJSON(),
				materialModel: MaterialModel.getJSON(),
				material: MaterialHelper.getData(),
				packmodeModel: PackingModeModel.getJSON(),
				sourceTabelSetting: oSourceTabelSetting,
				shipTableSetting: oShipTabelSetting,
				itemWeight: ItemWeight.getObject_Cache(),
				mCache: Cache.get_mCache(),
				mIsEmptyHU: Cache.get_mIsEmptyHU()
			};
		},

		initAppState: function () {
			if (this.oView.getId().endsWith(sDefaultViewId_PostFix)) {
				return;
			}

			var that = this;
			var oParseNavigationPromise = this.oNavigationHandler.parseNavigation();
			oParseNavigationPromise.done(function (oAppData, oURLParameters, sNavType) {
				if (sNavType === sap.fe.navigation.NavType.initial) {
					return;
				}
				var globalModelJSON = oAppData.globalModel;
				if (Util.isEmpty(globalModelJSON)) {
					return;
				}

				if (that.oView.getId().endsWith(sSourceViewId_PostFix)) {
					that.restoreGlobal(oAppData);
					that.restoreSource(oAppData);
				} else if (that.oView.getId().endsWith(sShipViewId_PostFix)) {
					that.restoreShip(oAppData);
				}
			});
		},

		restoreGlobal: function (oAppData) {
			var that = this;
			var globalModelJSON = oAppData.globalModel;

			GlobalModel.setJSON(globalModelJSON);
			GlobalModel.updateBindings(true);

			var materialModelJSON = oAppData.materialModel;
			MaterialModel.setJSON(materialModelJSON);

			var material = oAppData.material;
			MaterialHelper.setData(material);
			MaterialModel.updateBindings(true);

			var packmodeModelJSON = oAppData.packmodeModel;
			PackingModeModel.setJSON(packmodeModelJSON);
			PackingModeModel.updateBindings(true);

			if (PackingMode.isAdvancedMode() || PackingMode.isInternalMode()) {
				//basic mode does not have exception buttons
				that.publish(Const.EVENT_BUS.CHANNELS.EXCEPTION_LIST, Const.EVENT_BUS.EVENTS.SUCCESS, GlobalHelper.getExceptionList());
			}

		},

		restoreSourceTableSetting: function (oAppData) {
			var oSourceTabelSettingJSON = oAppData.sourceTabelSetting;
			if (PackingMode.isAdvancedMode()) {
				AdvancedSourceTableSetting.setJSON(oSourceTabelSettingJSON);
				AdvancedSourceTableSetting.updateBindings(true);

			} else if (PackingMode.isInternalMode()) {
				InternalSourceTableSetting.setJSON(oSourceTabelSettingJSON);
				InternalSourceTableSetting.updateBindings(true);
			} else {
				BasicSourceTableSetting.setJSON(oSourceTabelSettingJSON);
				BasicSourceTableSetting.updateBindings(true);
			}
		},

		restoreSource: function (oAppData) {
			var that = this;
			this.restoreSourceTableSetting(oAppData);

			var sWorkCenter = GlobalHelper.getPackStation();
			Service.verifyWorkCenter(sWorkCenter)
				.then(function (oResult) {
					GlobalHelper.setAsyncMode(!!oResult.IsUIAsync);
				}.bind(this))
				.then(function () {
					that.initDefaultColumnSetting();
					that.initColumnSetting();
				}.bind(this));

			var itemWeight = oAppData.itemWeight;
			ItemWeight.setObject_Cache(itemWeight);

			MessageHelper.clearAll();

			Cache.set_mCache(oAppData.mCache);
			Cache.set_mIsEmptyHU(oAppData.mIsEmptyHU);

			this.oItemHelper.clear();

		},

		restoreShipTableSetting: function (oAppData) {
			//restore ship view setting
			var oShipTabelSettingJSON = oAppData.shipTableSetting;
			if (PackingMode.isAdvancedMode()) {
				AdvancedShipTableSetting.setJSON(oShipTabelSettingJSON);
				AdvancedShipTableSetting.updateBindings(true);

			} else if (PackingMode.isInternalMode()) {
				InternalShipTableSetting.setJSON(oShipTabelSettingJSON);
				InternalShipTableSetting.updateBindings(true);
			} else {
				BasicShipTableSetting.setJSON(oShipTabelSettingJSON);
				BasicShipTableSetting.updateBindings(true);
			}

			this.initDefaultColumnSetting();
			this.initColumnSetting();
		},
		restoreShip: function (oAppData) {

			var that = this;

			this.restoreShipTableSetting(oAppData);

			if (PackingMode.isBasicMode() && MaterialHelper.getFavoriteMaterials().length !== 0) {
				this.getWorkFlowFactory().getInitWorkFlow().run();
			}

			this.oItemHelper.clear();

			var iSelectIndex = -1;
			var currentShipHU = GlobalHelper.getCurrentShipHandlingUnit();
			var aShipHUs = GlobalHelper.getShipHandlingUnits();
			this.clearShipHUTabs();
			if (Util.isEmpty(currentShipHU) || aShipHUs.lenght === 0) {
				return;
			}

			//restore ship hu tabs
			this.createTabForShipHUsExist()
				.then(function () {
					var oBar = that.oView.byId("shipHUBar");
					if (GlobalHelper.getShipHandlingUnits().length === 0) {
						//no ship hu
						GlobalHelper.setCurrentShipHandlingUnit("");
						MaterialHelper.setCurrentMaterial("");
					} else {
						//ship hu exists
						currentShipHU = GlobalHelper.getCurrentShipHandlingUnit();
						if (PackingMode.isBasicMode()) {
							var sDefaultMaterialId = MaterialHelper.getDefaultMaterialId();
							var sCurrentMaterial = MaterialHelper.getCurrentMaterial();
							if (sDefaultMaterialId !== sCurrentMaterial) {
								MaterialHelper.setFavoriteMaterialSelectedById(sDefaultMaterialId, false);
								MaterialHelper.setFavoriteMaterialSelectedById(sCurrentMaterial, true);
							}
						}

						for (var i = 0; i < oBar.getItems().length; i++) {
							if (oBar.getItems()[i].getKey() === currentShipHU) {
								iSelectIndex = i;
							}
						}
						if (iSelectIndex !== -1) {
							that.getWorkFlowFactory().getShipHUSelectionWorkFlow().run(currentShipHU);
						}
					}
					// load source data after ship data
					if (!Util.isEmpty(GlobalHelper.getSourceId())) {
						that.getWorkFlowFactory().getSourceChangeWorkFlow().run({
							sReferenceNumber: GlobalHelper.getSourceId(),
							bToCreateShipHU: PackingMode.isBasicMode() ? true : false,
							bReferenceNumberValidated: false,
							bToSelectProductInSource: true,
							bToUpdateShipItemStatus: false
						});
					}
				}.bind(this));
		},

		createTabForShipHUsExist: function () {
			var aShipHUs = GlobalHelper.getShipHandlingUnits();
			var currentShipHU = GlobalHelper.getCurrentShipHandlingUnit();
			this.setBusy(true);
			var aExistingShipHus = [];
			return new Promise(function (resolve, reject) {
				Service.validateShipHUSet(aShipHUs)
					.then(function (oResult) {
						//only restore an existing ship hu
						this.setBusy(false);
						var sShipHU, sCurrentShipHUMaterial, sCurrentShipHU;
						for (var i = oResult.length; i >= 0; i--) {
							if (!Util.isEmpty(oResult[i])) {
								var sShipHU = oResult[i].HuId;
								aExistingShipHus.push(oResult[i].HuId);
								//set current ship hu to be the first ship hu if the current ship hu is not found
								if (Util.isEmpty(sCurrentShipHUMaterial) && Util.isEmpty(sCurrentShipHU)) {
									sCurrentShipHUMaterial = oResult[i].PackagingMaterial;
									sCurrentShipHU = oResult[i].HuId;
								}
								if (currentShipHU === sShipHU) {
									sCurrentShipHUMaterial = oResult[i].PackagingMaterial;
									sCurrentShipHU = oResult[i].HuId;
								}
								if (PackingMode.isAdvancedMode() || PackingMode.isInternalMode()) {
									this.createNewTab(sShipHU, Const.TAB.ADVANCED);
								} else {
									this.createNewTab(sShipHU, Const.TAB.BASIC);
								}
							}
						}
						aExistingShipHus = aExistingShipHus.reverse();
						GlobalHelper.setShipHandlingUnits(aExistingShipHus);

						GlobalHelper.setCurrentShipHandlingUnit(sCurrentShipHU);
						MaterialHelper.setCurrentMaterial(sCurrentShipHUMaterial);

						resolve();
					}.bind(this))
					.catch(function (error) {
						this.setBusy(false);
						resolve();
					}.bind(this));
			}.bind(this));
		}
	});
});