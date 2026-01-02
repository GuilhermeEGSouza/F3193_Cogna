/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["scm/ewm/packoutbdlvs1/utils/CustomError","scm/ewm/packoutbdlvs1/modelHelper/Message"],function(C,M){"use strict";return{parseError:function(r,a){var k,m;var e;if(r.MsgType==="E"||r.MsgSuccess===false){k=r.MsgId+"-"+r.MsgKey;m=r.MsgVar;e=new C(k,m,r);a(e);}return e;},parseWarning:function(r){if(r.MsgType==="W"){M.addWarning(r.MsgVar);}},parseSuccess:function(r){if(r.MsgType==="S"){if(this.getMessage(r.MsgVar)){M.addSuccess(r.MsgVar);}}},parseErrorAsWarning:function(r){if(r.MsgType==="E"||r.MsgSuccess===false){if(this.getMessage(r.MsgVar)){M.addWarning(r.MsgVar);}}},getMessage:function(m){return m&&m!==""?true:false;}};});
