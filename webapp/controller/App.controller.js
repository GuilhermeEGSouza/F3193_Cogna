/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","scm/ewm/packoutbdlvs1/modelHelper/Items","sap/ui/model/json/JSONModel","scm/ewm/packoutbdlvs1/control/Audio","sap/suite/ui/commons/collaboration/CollaborationHelper"],function(C,T,J,A,a){"use strict";return C.extend("scm.ewm.packoutbdlvs1.controller.App",{onInit:function(){var e=a.processAndExpandHash();e.then(function(){this.getView().setModel(this.getOwnerComponent().getModel());}.bind(this));},bindAudioList:function(f){this.byId("audio-player").bindItems({path:"/AudioURISet",template:new A({src:"{AudioUri}",type:"{Msgty}"}),filters:f});}});});
