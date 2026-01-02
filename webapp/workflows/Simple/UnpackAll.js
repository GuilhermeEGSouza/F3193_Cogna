/*
 * Copyright (C) 2009-2023 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["scm/ewm/packoutbdlvs1/workflows/WorkFlow","scm/ewm/packoutbdlvs1/utils/Util"],function(W,U){"use strict";return function(s,S){var w=new W().then(function(){},s).then(function(){},S);w.errors().subscribe("",function(){});return w;};});
