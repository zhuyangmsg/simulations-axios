function Ajax(){
    this.default = null;
    this.interceptors = {
        request: new InterceptorManger(),
        response: new InterceptorManger()
    }
}
Ajax.prototype.request = function(config){
    this.default = config;
    var promise = Promise.resolve(config);
    var chinas = [dispatchRequest,undefined];
    this.interceptors.request.handle.forEach(function(item){
        chinas.unshift(item.rejected);
        chinas.unshift(item.resolved);
    })
    this.interceptors.response.handle.forEach(function(item){
        chinas.push(item.resolved);
        chinas.push(item.rejected);
    })
    while(chinas.length>0){
        promise = promise.then(chinas.shift(),chinas.shift());
    }
    return promise;
}
Ajax.prototype.get = function(config){
    return Ajax.prototype.request(Object.assign({},{method:'get'},config));
}
Ajax.prototype.post = function(){
    return Ajax.prototype.request(Object.assign({},{method:'post'},config));
}
function dispatchRequest(config){
    return xhrAdapter(config).then(function(response){
        return response;
    },function(error){
        console.log(error);
    })
}
// 发送ajax请求
function xhrAdapter(options){
    return new Promise(function(resolve,reject){
        options = options || {};
        options.type = (options.type || "GET").toUpperCase();
        options.dataType = options.dataType || "json";
        var params = formatParams(options.data);
        if (window.XMLHttpRequest) {
            var xhr = new XMLHttpRequest();
        } else { //IE6及其以下版本浏览器
            var xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
        if (options.type == "GET") {
            xhr.open("GET", options.url + "?" + params, true);
            xhr.send(null);
        } else if (options.type == "POST") {
            xhr.open("POST", options.url, true);
            //设置表单提交时的内容类型
            xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            xhr.send(params);
        }
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                var status = xhr.status;
                if (status >= 200 && status < 300) {
                    resolve({
                        config: options,
                        data: xhr.response,
                        headers: xhr.getAllResponseHeaders(),
                        request: xhr,
                        status: status,
                        statusText: xhr.statusText
                    });
                } else {
                   reject(new Error("请求失败，请求状态码："+status));
                }
            }
        }
        if(options.cancelToken){
            options.cancelToken.promise.then(function(){
                xhr.abort();
            })
        }
    })
}
//格式化参数
function formatParams(data) {
    var arr = [];
    for (var name in data) {
        arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
    }
    arr.push(("v=" + Math.random()).replace(".",""));
    return arr.join("&");
}
// 请求拦截
function InterceptorManger(){
    this.handle = [];
}
InterceptorManger.prototype.use = function(resolved,rejected){
    this.handle.push({resolved,rejected})
}
// 取消请求
function CancelToken(executor){
    var resultResolve = null;
    this.promise = new Promise(function(resolve){
        resultResolve = resolve
    })
    executor(resultResolve);
}
function createInstance(){
    var context = new Ajax();
    var instance = Ajax.prototype.request.bind(context);
    instance.CancelToken = CancelToken;
    Object.keys(context).forEach(function(key){
        instance[key] = context[key];
    })
    Object.keys(Ajax.prototype).forEach(function(key){
        instance[key] = Ajax.prototype[key];
    })
    console.dir(instance);
    return instance;
}
var axios = createInstance();