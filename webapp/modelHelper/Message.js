/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["scm/ewm/packoutbdlvs1/model/Message","scm/ewm/packoutbdlvs1/utils/Util"],function(M,U){"use strict";return{addError:function(e){var d=M.getData();d.unshift({text:e,description:e,type:"Error"});M.setData(d);M.updateBindings(true);return this;},addWarning:function(w){var d=M.getData();d.unshift({text:w,description:w,type:"Warning"});M.setData(d);M.updateBindings(true);return this;},addSuccess:function(s){var d=M.getData();d.unshift({text:s,description:s,type:"Success"});M.setData(d);M.updateBindings(true);return this;},clearAll:function(){M.setData([]);}};});
