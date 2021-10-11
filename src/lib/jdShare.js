/**
 * Created by Tong Zeng on 2015/10/10.
 */
/*
 V1.2
 date: 2016-04-26
 changes: 将协议封装进函数，大幅减少代码行数
 */
/**
 V1.3
 * @Author:CAISENLEI
 * @DateTime         2016-07-14T13:26:43+0800
 * 新增二维码分享以及 clickcallback事件  客户端5.2版本新功能
 */
 /**
 V1.4
 * @Author:CAISENLEI
 * @DateTime         2016-09-20T11:05:37+0800
 * 新增二维码分享自定义图片 及 分享朋友圈标题
 */
;(function (global, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory(global);
        });
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory(global);
    } else {
        global.jdShare = factory(global);
    }
}(typeof window !== 'undefined' ? window : this, function (window) {
    //##**common_start
    'use strict';
    var INSTANCE;
    var ua = navigator.userAgent.toLowerCase(),
        uaArr = ua.split(';'),
        isJdApp = ua.indexOf('jdapp') != -1, // 包括 Android，iphone，ipad
        jdAppVersionDigits = (function () {
            if (isJdApp && uaArr[2]) {
                try {
                    return parseInt(uaArr[2].replace(/\./g, ''));
                } catch (e) {
                }
            }
        })(),
        // 钱程说 iphone内的ua可能会存在android
        // isAndroid = ua.indexOf('android') != -1,
        // isIphone = ua.indexOf('iphone') != -1,
        isAndroid = uaArr[1] === 'android',
        isIphone = uaArr[1] === 'iphone',
        isMobilePhone = isAndroid || isIphone,
        isIpad = ua.indexOf('ipad') != -1,
        isWeChat = /MicroMessenger/i.test(ua),
        isMobilePhoneJdAppGte500 = isMobilePhone && isJdApp && jdAppVersionDigits >= 500,
        isMobilePhoneJdAppGte440Lt500 = isMobilePhone && isJdApp && jdAppVersionDigits >= 440 && jdAppVersionDigits < 500,
        isIpadJdAppGte360 = isIpad && isJdApp && jdAppVersionDigits >= 360,
        scheme = (function () {
            if (isMobilePhone) {
                return 'openapp.jdmobile://'
            } else if (isIpad) {
                return 'openapp.jdipad://'
            }
        })(),
        CONST = {
            WITH_CALLBACK: "Y",      // 带回调
            WITHOUT_CALLBACK: "N",   // 不带回调
            SHARE_ACTION_SET: "S",    // 设置分享信息 setShareInfo
            SHARE_ACTION_PANE: "P",   // 唤起分享面板 callSharePane
            SHARE_ACTION_OPEN: "O"    // 直接分享到制定渠道  sendDirectShare
        };

    function androidOpenAppGte500(paramsObj) {
        return 'openapp.jdmobile://communication?params={' +
            '"des":"share",' +
            '"type":"111",' +
            '"title":"' + paramsObj.title + '",' +
            '"content":"' + paramsObj.content + '",' +
            '"shareUrl":"' + paramsObj.url + '",' +
            '"iconUrl":"' + paramsObj.img + '",' +
            '"shareActionType":"' + paramsObj.shareActionType + '",' +
            '"channel":"' + paramsObj.channel + '",' +
            '"timeline_title":"' + paramsObj.timeline_title + '",' +
            '"qrparam":"' + paramsObj.qrparam + '",' +
            '"callback":"' + paramsObj.callbackSwitcher + '",' +
            '"clickcallback":"' + paramsObj.clickcallbackSwitcher + '"' +
            '}';
    }

    function androidJsBridgeInitShare(paramsObj) {
        shareHelper.initShare(JSON.stringify({
            "title": paramsObj.title,
            "content": paramsObj.content,
            "shareUrl": decodeURIComponent(paramsObj.url),
            "iconUrl": decodeURIComponent(paramsObj.img),
            "shareActionType": paramsObj.shareActionType,
            "channel": paramsObj.channel,
            "timeline_title": paramsObj.timeline_title,
            "qrparam": paramsObj.qrparam,
            "callback": paramsObj.callbackSwitcher,
            "clickcallback": paramsObj.clickcallbackSwitcher,
            "eventId": ""
        }));
    }

    function androidJsBridgeFiveParams(funcName, paramsObj) {
        shareHelper[funcName](
            paramsObj.title,
            paramsObj.content,
            decodeURIComponent(paramsObj.url),
            decodeURIComponent(paramsObj.img),
            paramsObj.callbackSwitcher
        );
    }

    function androidJsBridgeFourParams(funcName, paramsObj) {
        shareHelper[funcName](
            paramsObj.title,
            paramsObj.content,
            decodeURIComponent(paramsObj.url),
            decodeURIComponent(paramsObj.img)
        );
    }

    function iphoneOpenAppLt500(paramsObj, actionType) {
        return 'openapp.jdmobile://communication?params={' +
            '"action":"' + actionType + '",' +
            '"title":"' + paramsObj.title + '",' +
            '"content":"' + paramsObj.content + '",' +
            '"shareUrl":"' + paramsObj.url + '",' +
            '"iconUrl":"' + paramsObj.img + '",' +
            '"isCallBack":"' + paramsObj.callbackSwitcher + '"' +
            '}';
    }

    function iphoneIpadOpenAppGte500(paramsObj) {
        var jsonObj = {
            category: "jump",
            des: "share",
            type: "111",
            title: paramsObj.title,
            content: paramsObj.content,
            shareUrl: paramsObj.url,
            //分享的图片url，自定义， V 5.0 之前，使用该字段下发分享icon url
            imageUrl: paramsObj.img,
            //分享的图片url，自定义，V 5.0 之后，使用该字段下发分享 icon url
            iconUrl: paramsObj.img,
            timeline_title: paramsObj.timeline_title,
            qrparam: paramsObj.qrparam,
            channel: paramsObj.channel,
            isCallBack: paramsObj.callbackSwitcher,
            clickcallback: paramsObj.clickcallbackSwitcher,
            shareActionType: paramsObj.shareActionType
        }
        return scheme + 'virtual?params=' + JSON.stringify(jsonObj);
    }

    /**
     * 构造函数
     * @param options
     * @returns {JdShare}
     */
    function JdShare(options) {
        if (!(this instanceof JdShare)) {
            return new JdShare(options);
        }
    }

    /**
     * 自定义异常构造函数
     * @param message
     * @constructor
     */
    function JdShareException(message) {
        this.message = message;
        this.name = "JdShareException";
        this.toString = function () {
            return this.name + ": " + this.message;
        };
    }

    JdShareException.prototype = Object.create(Error.prototype);
    JdShareException.prototype.constructor = JdShareException;
    /**
     * 合并对象
     * @param target
     * @param source
     */
    function extend(target, source) {
        for (var key in source) {
            if (source.hasOwnProperty(key) && source[key] !== undefined) {
                target[key] = source[key];
            }
        }
    }

    /**
     * 拼接查询字符串
     * @param url
     * @param query
     * @returns {*}
     */
    function appendQuery(url, query) {
        if (query == '') return url
        return (url + '&' + query).replace(/[&?]{1,2}/, '?')
    }

    /**
     * 配置回调函数
     * @param callback
     */
    function makeShareResultCallback(o) {
        window.jdappShareRes = function (result) {
            var temp;
            // IOS 在 4.4 最初实现回调的时候，就把 shareChannel 与 shareResult 弄反了，并且 shareChannel 是数值
            // 此 bug 在 4.4.1 版本中会被修复，以与 andriod 版本保持统一
            /*if (result.shareChannel && typeof result.shareChannel === 'number') {
             temp = result.shareChannel;
             result.shareChannel = (result.shareResult).toString();
             result.shareResult = temp;
             }*/
             // 有这个字段为 callback 没有则为 clickcallback
            if(result.hasOwnProperty('shareResult')){
                o.callback && o.callback(result);
            }else{
                o.clickcallback && o.clickcallback(result);
            }
            
        }
    }

    /**
     * 将配置中的channel字段，转成相应的iphone版本字段
     * @param inputChannels
     */
    function processingChannel(inputChannels) {
        var androidShareChannel2IPhoneMap = {
            Wxfriends: "WeChat_Friend",
            Wxmoments: "WeChat_FriendTimeline",
            Sinaweibo: "Weibo",
            QQfriends: "QQFriend_SHARE_CLIENT",
            QQzone: "QQZone_SHARE_CLIENT",
            Moreshare: ""
        };
        var convertedChannelStr = '';
        if (inputChannels) {
            if (isIphone) {
                // 仅仅在 4.4 以后，至5.0以前的 iphone版本中需要转换，否则不需转换；且channel仅支持单个渠道或者为"" 空字符串// 5.0以后才支持channel字段用逗号分隔多个参数// 5.0之后与安卓统一了输入参数，无需转换// 写此代码时，公司已经不为4.2以下App服务了
                if (isMobilePhoneJdAppGte440Lt500) {
                    convertedChannelStr = androidShareChannel2IPhoneMap[inputChannels];
                    if (convertedChannelStr) {
                        return convertedChannelStr;
                    } else {
                        throw new JdShareException("输入的channel参数在iphone版本中不存在");
                    }
                } else {
                    return inputChannels;
                }
            } else {
                return inputChannels;
            }
        } else {
            // 用户值传给客户端，客户端已做处理；
            // 不做处理的原因是，我认为客户端的实现有问题，就要让它暴露出来，调用者才知道，客户端开发才知道
            // JdShare 是用户分享设置信息传递者，不在中间加入一层，不对用户的设置做操作、容错等；
            return inputChannels;
        }
    }

    /**
     * 判断用户是否设置了每个配置项，如果没有任何一项没有设置，返回 false
     * @param inputParamObj
     * @returns {boolean}
     */
    function isInputParamObjLegal(inputParamObj) {
        if (inputParamObj["title"] !== undefined
            && inputParamObj["content"] !== undefined
            && inputParamObj["url"] !== undefined
            && inputParamObj["img"] !== undefined) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * 集中处理用户输入的配置参数
     * @param inputParamObj
     */
    function processingInputParam(inputParamObj) {
        if (isInputParamObjLegal(inputParamObj)) {
            try {
                var targetParamObj = {timeline_title: '',channel: '', qrparam: null, callback: null, clickcallback: null}, hasCallbackFunc, callbackSwitcher, hasClickCallbackFunc, clickcallbackSwitcher;
                if (Object.prototype.toString.call(inputParamObj) === "[object Object]") {
                    extend(targetParamObj, inputParamObj);
                }

                // 处理回调
                hasCallbackFunc = (typeof targetParamObj.callback === 'function');
                hasClickCallbackFunc = (typeof targetParamObj.clickcallback === 'function');
                if (hasCallbackFunc) {
                    callbackSwitcher = CONST.WITH_CALLBACK;
                } else {
                    callbackSwitcher = CONST.WITHOUT_CALLBACK;
                }

                if (hasClickCallbackFunc) {
                    clickcallbackSwitcher = CONST.WITH_CALLBACK;
                } else {
                    clickcallbackSwitcher = CONST.WITHOUT_CALLBACK;
                }

                if(hasCallbackFunc && hasClickCallbackFunc){
                    // 2个回调都设置了 传入2个回调函数
                    makeShareResultCallback({
                        callback:targetParamObj.callback,
                        clickcallback:targetParamObj.clickcallback
                    });
                }else if(hasCallbackFunc){
                    makeShareResultCallback({
                        callback:targetParamObj.callback
                    });
                }else if(hasClickCallbackFunc){
                     makeShareResultCallback({
                        clickcallback:targetParamObj.clickcallback
                    });
                }

                // 二维码分享配置
                if(Object.prototype.toString.call(targetParamObj.qrparam) === "[object Object]"){
                    targetParamObj.qrparam.top_pic = targetParamObj.qrparam.top_pic ? encodeURIComponent(decodeURIComponent(targetParamObj.qrparam.top_pic)) : '';
                    targetParamObj.qrparam.mid_pic = targetParamObj.qrparam.mid_pic ? encodeURIComponent(decodeURIComponent(targetParamObj.qrparam.mid_pic)) : '';
                    targetParamObj.qrparam.qr_direct = targetParamObj.qrparam.qr_direct ? encodeURIComponent(decodeURIComponent(targetParamObj.qrparam.qr_direct)) : '';
                }

                // 是否需要回调的控制字段添加到 targetParamObj 对象中；
                targetParamObj.callbackSwitcher = callbackSwitcher;
                targetParamObj.clickcallbackSwitcher = clickcallbackSwitcher;

                // 分享出去的地址自动加时间戳
                targetParamObj.url = appendQuery(targetParamObj.url, "_ts=" + (new Date()).getTime());
                // 统一处理 channel 字段
                targetParamObj.channel = processingChannel(targetParamObj.channel);
                // 编码url
                targetParamObj.url = encodeURIComponent(targetParamObj.url);
                targetParamObj.img = encodeURIComponent(targetParamObj.img);
            } catch (e) {
                throw e;
            }
            return targetParamObj;
        } else {
            throw new JdShareException("调用方法时传入配置对象格式错误，请查看文档")
        }
    }

    /**
     *作用：下发分享设置
     *版本：jdApp4.4.0以上版本支持，低于 jdApp4.4.0的部分版本可能支持(具体不详，但 2015年12月25日，Android 平台 V＜4.1，IPhone 平台 V＜4.3 已经强制升级)
     *jdApp 内表现：预期在屏幕右上角出现分享按钮
     *jdApp 外表现：该功能不可用；执行该函数没有反应
     * @param params
     */
    JdShare.prototype.setShareInfo = function (params) {
        try {
            var paramsObj = null, link = "", jsonObj = null;
            // 仅在 jdApp 内执行
            if (isJdApp) {
                // 保存各种配置信息
                paramsObj = processingInputParam(params);
                paramsObj.shareActionType = CONST.SHARE_ACTION_SET;
                if (isAndroid) {
                    // 仅当 shareHelper对象存在时才能下发分享配置，更老版本不支持；未来如果该对象删除了也不出错
                    if (window.shareHelper) {
                        // jdApp 5.0版本新增方法
                        if (typeof shareHelper.initShare === 'function') {
                            //channel 参数可设置，配置后，分享面板仅出现配置过的项目; 如果为空，则显示默认全部
                            androidJsBridgeInitShare(paramsObj);
                        } else if (typeof shareHelper.setShareInfoCallback === 'function') {
                            if (paramsObj.callbackSwitcher === CONST.WITH_CALLBACK) {
                                try {
                                    //根据needCallBack 以及 window.jdappShareRes 函数，决定是否需要回调；
                                    //jdApp V4.4版本通过开关控制; jdApp V4.4之前，setShareInfoCallback 会忽略 "Y/N" 参数，默认就是添加回调的
                                    androidJsBridgeFiveParams('setShareInfoCallback', paramsObj);
                                } catch (e) {
                                    //jdApp V4.4 之前版本，如果已经有setShareInfoCallback函数，但参数是4个的话，上面代码会出错 //jdApp V4.4版本通过开关控制//jdApp V4.4之前，setShareInfoCallback 会忽略 "Y/N" 参数，默认就是添加回调的
                                    androidJsBridgeFourParams('setShareInfoCallback', paramsObj);
                                }
                            } else {
                                try {// 关掉
                                    androidJsBridgeFiveParams('setShareInfoCallback', paramsObj)
                                } catch (e) {
                                    if (typeof shareHelper.setShareInfo === 'function') {
                                        androidJsBridgeFourParams('setShareInfo', paramsObj);
                                    }
                                }
                            }
                            //如果不存在setShareInfoCallback，则调用setShareInfo，其能否回调实现是不确定的，依赖于CMS配置等，Android客户端那边有个回调全局开关，如果开关被别的配置或者代码打开了，那么就有回调，否则就没有回调。
                        } else if (typeof shareHelper.setShareInfo === 'function') {
                            androidJsBridgeFourParams('setShareInfo', paramsObj);
                        }
                    } else {
                        //在没有 shareHelper 对象时，有可能是4.4以下版本，也可能是5.0以上版本，例如5.1的XVIEW中也不存在 shareHelper 对象
                        //使用 openApp 协议，不支持回调 // jdApp5.0 可以支持自定义分享面板； // jdApp V4.4支持channel，// 更老版本会忽略shareActionType参数 与 channel 参数，弹出分享面板，保证至少能用
                        window.location.href = androidOpenAppGte500(paramsObj);
                    }
                } else if (isIphone || isIpad) {// jdApp 5.0及以上版本
                    if ((isMobilePhoneJdAppGte500) || (isIpadJdAppGte360)) {
                        location.href = iphoneIpadOpenAppGte500(paramsObj);
                    } else if (isIphone) {// 包括 jdApp5.0以下，以及非 jdApp
                        location.href = iphoneOpenAppLt500(paramsObj, "syncShareData");
                    }
                }
            }
        } catch (e) {
            throw e;
        }
    }
    /**
     * 作用：唤起分享面板
     版本：
     * jdApp 5.0 支持唤起自定义面板
     * jdApp 4.4.0 加入唤起分享面板方法
     * jdApp 4.4.0 之前的某些版本 (具体不详，但 2015年12月25日，Android 平台 V＜4.1，IPhone 平台 V＜4.3 已经强制升级)，能够唤起默认分享面板
     表现：出现自定义配置的分享面板 / 或者唤起默认分享面板
     * @param params
     */
    JdShare.prototype.callSharePane = function (params) {
        try {
            var link, jsonObj = null, paramsObj = null, shareParam;
            // 保存各种配置信息
            paramsObj = processingInputParam(params);
            paramsObj.shareActionType = CONST.SHARE_ACTION_PANE;
            if (isAndroid) {
                //在 jdApp 内，调用各种方法
                if (isJdApp) {
                    if (window.shareHelper) {
                        // jdApp 5.0 新增方法;// 回调函数也是 5.0 新增，5.0以下不支持
                        if (typeof shareHelper.initShare === "function") {
                            androidJsBridgeInitShare(paramsObj);
                            //如果存在 callShare,那么看它是否需要回调，否则使用 openApp 协议，不支持回调
                        } else if (typeof shareHelper.callShare === "function") {
                            //最后一个参数是 jdAppV4.4才新增的，老版本的jdApp不能识别，则会直接忽略掉此参数
                            androidJsBridgeFiveParams('callShare', paramsObj);
                        } else {
                            // jdApp4.4.0以下老版本//使用 openApp 协议，不支持回调
                            window.location.href = androidOpenAppGte500(paramsObj);
                        }
                    } else {
                        //在没有 shareHelper 对象时，有可能是4.4以下版本，也可能是5.0以上版本，例如5.1的XVIEW中也不存在 shareHelper 对象
                        //使用 openApp 协议，不支持回调// jdApp5.0 可以支持自定义分享面板；// jdApp V4.4支持channel，// 更老版本会忽略shareActionType参数 与 channel 参数，弹出分享面板，保证至少能用
                        window.location.href = androidOpenAppGte500(paramsObj);
                    }
                } else {
                    //在jdApp外使用时//使用 openApp 协议，不支持回调 // jdApp5.0 可以支持自定义分享面板；// jdApp V4.4支持channel，// 更老版本会忽略shareActionType参数 与 channel 参数，弹出分享面板，保证至少能用
                    window.location.href = androidOpenAppGte500(paramsObj);
                }
            } else if (isIphone || isIpad) {
                // jdApp5.0及以上
                if ((isMobilePhoneJdAppGte500) || (isIpadJdAppGte360)) {
                    location.href = iphoneIpadOpenAppGte500(paramsObj);
                } else if (isIphone) {
                    // 包括 jdApp5.0以下，以及非 jdApp
                    location.href = iphoneOpenAppLt500(paramsObj, "share");
                }
            }
        } catch (e) {
            throw e;
        }
    }
    /**
     *作用：直接分享到某个渠道
     版本：jdApp4.4.0以上版本支持，低于 jdApp4.4.0的部分版本可能支持(具体不详，但 2015年12月25日，Android 平台 V＜4.1，IPhone 平台 V＜4.3 已经强制升级)
     表现：直接唤起相应渠道APP的分享设置界面
     * @param params
     */
    JdShare.prototype.sendDirectShare = function (params) {
        try {
            var link, jsonObj = null, paramsObj = null, shareParam;
            // 保存各种配置信息
            paramsObj = processingInputParam(params);
            paramsObj.shareActionType = CONST.SHARE_ACTION_OPEN;
            if (isAndroid) {
                //在 jdApp 内，调用各种方法
                if (isJdApp) {
                    if (window.shareHelper) {
                        // jdApp 5.0 新增方法;// 回调函数也是 5.0 新增，5.0以下不支持// 如果有 sendShare则调用，否则使用 openApp 协议
                        if (typeof shareHelper.initShare === "function") {
                            androidJsBridgeInitShare(paramsObj);
                        } else if (typeof shareHelper.sendShare === "function") {//jdApp 4.4版本，支持回调
                            shareHelper.sendShare(
                                paramsObj.title,
                                paramsObj.content,
                                decodeURIComponent(paramsObj.url),
                                decodeURIComponent(paramsObj.img),
                                paramsObj.channel,
                                paramsObj.callbackSwitcher
                            );
                        } else {
                            //使用 openApp 协议, jdApp V4.4支持channel，更老版本会忽略此参数 channel 参数，弹出分享面板，保证至少能用
                            location.href = androidOpenAppGte500(paramsObj);
                        }
                    } else {
                        //在没有 shareHelper 对象时，有可能是4.4以下版本，也可能是5.0以上版本，例如5.1的XVIEW中也不存在 shareHelper 对象//使用 openApp 协议，不支持回调 // jdApp5.0 可以支持自定义分享面板； // jdApp V4.4支持channel， // 更老版本会忽略shareActionType参数 与 channel 参数，弹出分享面板，保证至少能用
                        window.location.href = androidOpenAppGte500(paramsObj);
                    }
                } else {
                    //在jdApp外使用时//使用 openApp 协议，不支持回调 // jdApp5.0 可以支持自定义分享面板；// jdApp V4.4支持channel，// 更老版本会忽略shareActionType参数 与 channel 参数，弹出分享面板，保证至少能用
                    window.location.href = androidOpenAppGte500(paramsObj);
                }
            } else if (isIphone || isIpad) {
                //有直接分享的渠道设置
                if (paramsObj.channel) {
                    if ((isMobilePhoneJdAppGte500) || (isIpadJdAppGte360)) {
                        location.href = iphoneIpadOpenAppGte500(paramsObj);
                    } else if (isIphone) {
                        // 包括 jdApp5.0以下，以及非 jdApp
                        link = 'openapp.jdmobile://virtual?params={' +
                            '"category":"jump",' +
                            '"des":"share",' +
                            '"type":"111",' +
                            '"title":"' + paramsObj.title + '",' +
                            '"content":"' + paramsObj.content + '",' +
                            '"shareUrl":"' + paramsObj.url + '",' +
                            '"imageUrl":"' + paramsObj.img + '",' +
                            '"channel":"' + paramsObj.channel + '",' +
                            '"isCallBack":"' + paramsObj.callbackSwitcher + '"' +
                            '}';
                        location.href = link;
                    }
                } else {
                    throw new JdShareException("分享渠道未设置");
                }
            }
        } catch (e) {
            throw e;
        }
    }
    if (!INSTANCE) {
        INSTANCE = JdShare();
    }
    return INSTANCE;

    //##**common_end
}))
;
