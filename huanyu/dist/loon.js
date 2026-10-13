// 幻宇星球 Loon http-request 脚本
// 请求经 Worker 代理获取 VIP 内容, $done({response}) 直接返回结果, 不请求原站

var WORKER = "https://huanyu-proxy.daoyufan.workers.dev";

// 手工解析 path+query (Loon 的 JSC 环境不一定有 URL 类)
var m = ($request.url || "").match(/^https?:\/\/[^\/]+(\/[^?]*)?(\?[^#]*)?/);
var path = (m && m[1] ? m[1] : "/") + (m && m[2] ? m[2] : "");
var url = WORKER + path;

var reqH = $request.headers || {};
var headers = { "Accept-Encoding": "identity" };
var ua = reqH["User-Agent"] || reqH["user-agent"];
if (ua) headers["User-Agent"] = ua;
var ref = reqH["Referer"] || reqH["referer"];
if (ref) headers["Referer"] = ref;

function finish(err, resp, data) {
	if (err || !resp) {
		console.log("[huanyu] fetch error: " + (err || "empty response"));
		return $done({});
	}
	var status = resp.status || resp.statusCode || 200;
	var h = {};
	var rawH = resp.headers || {};
	for (var k in rawH) {
		var lk = k.toLowerCase();
		if (lk === "content-encoding" || lk === "content-length" || lk === "transfer-encoding") continue;
		h[k] = rawH[k];
	}
	var loc = h["Location"] || h["location"];
	if (status >= 300 && status < 400 && loc) {
		var safe = String(loc).replace(/"/g, "&quot;");
		return $done({
			response: {
				status: 200,
				headers: { "Content-Type": "text/html; charset=utf-8" },
				body: '<html><head><meta http-equiv="refresh" content="0;url=' + safe + '"><script>location.href="' + safe + '"</' + 'script></head></html>'
			}
		});
	}
	$done({ response: { status: status, headers: h, body: data || "" } });
}

var method = ($request.method || "GET").toLowerCase();
var opt = { url: url, headers: headers };
if (method === "post") {
	opt.body = $request.body || "";
	$httpClient.post(opt, finish);
} else {
	$httpClient.get(opt, finish);
}
