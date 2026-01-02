/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["scm/ewm/packoutbdlvs1/workflows/WorkFlow","scm/ewm/packoutbdlvs1/service/ODataService","scm/ewm/packoutbdlvs1/utils/Const","scm/ewm/packoutbdlvs1/modelHelper/Message"],function(W,S,C,M){"use strict";return function(s,o){var w=new W().then(function(){return S.print();},o,"init package matrial buttons").then(function(){M.addSuccess(this.getI18nText("printSuccess"));this.playAudio(C.INFO);},o,"init package matrial buttons");w.errors().default(function(e,p,m,c){if(c){this.showErrorMessagePopup(e);}},s).always(function(e){this.playAudio(C.ERROR);},o);return w;};});
