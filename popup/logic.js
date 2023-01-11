chrome.tabs.query({
    active:true,
    currentWindow: true
},
    (tabs) => {
        var cur_tab = tabs[0]
        document.getElementById("favicon").src = cur_tab.favIconUrl;

        var url = cur_tab.url;
        const r = url.indexOf(".com");
        const l = Math.max(url.lastIndexOf(".", r - 1), url.lastIndexOf("/", r - 1) + 1);
        const domain_url = url.slice(l, r + 4);

        function cookies_remove(n) {
            chrome.storage.local.remove([n], () => { return true; });
            location.reload();
        }
        function cookies_get(n) {
            chrome.cookies.getAll({ domain: domain_url }, (cookies) => {
                var l = [];
                for (const cookie of cookies) {
                    l.push(cookie)
                }
                chrome.storage.local.set({ [n]: l }).then(() => {
                    console.log("set", n, "to", l);
                });
            });
            location.reload();
        }

        function cookies_set(n) {
            chrome.storage.local.get([n]).then((result) => {
                total = 0;
                for (const cookie of result[n]) {
                    let url =
                        (cookie.secure ? "https://" : "http://") +
                        (cookie.domain.startsWith(".")
                            ? cookie.domain.slice(1)
                            : cookie.domain) +
                        cookie.path;
                    if (cookie.hostOnly == true) {
                        // https://developer.chrome.com/extensions/cookies#method-set
                        // if the cookie is hostOnly, we don't
                        // supply the domain because that sets hostOnly to true
                        delete cookie.domain;
                    }
                    if (cookie.session == true) {
                        // if session is true, then expirationDate
                        // needs to be omitted
                        delete cookie.expirationDate;
                    }
                    // .set doesn't accepts these
                    delete cookie.hostOnly;
                    delete cookie.session;
                    // .set wants url
                    cookie.url = url;
                    chrome.cookies.set(cookie, (_c) => {});
                    total++;
                }
                chrome.tabs.reload(cur_tab.id);
            });
        }
        var stat = document.getElementById("status");

        function cookies_clear() {
            var target_url = domain_url;
            if (domain_url.startsWith("www.")) {
                target_url = domain_url.slice(4);
            }
            stat.textContent = target_url;
            chrome.cookies.getAll({ domain: target_url }, function (cookies) {
                for (const cookie of cookies) {
                    chrome.cookies.remove({
                        url:
                            (cookie.secure ? "https://" : "http://") +
                            (cookie.domain.startsWith(".")
                                ? cookie.domain.slice(1)
                                : cookie.domain) +
                            cookie.path,
                        name: cookie.name
                    });
                }
                chrome.tabs.reload(cur_tab.id);
            });
        }
        var list = document.getElementById("cookies-list");
        chrome.storage.local.get(null, (items) => {
            for (const key in items) {
                var divider = document.createElement("li");
                divider.className = "item-divider";
                list.append(divider);
                var li = document.createElement("li");

                var  a = document.createElement("span");
                a.className = "cookies-item";
                a.appendChild(document.createTextNode(key));
                a.onclick = () => {
                    stat.textContent = key + "加载中……";
                    cookies_set(key);
                    stat.textContent = key + "加载完成！";
                };
                li.appendChild(a);

                var del_button = document.createElement("span");
                del_button.className = "glyphicon";
                del_button.appendChild(document.createTextNode("del"));
                del_button.onclick = () => { cookies_remove(key) };
                li.appendChild(del_button);

                var update_button = document.createElement("span");
                update_button.className = "glyphicon";
                update_button.appendChild(document.createTextNode("update"));
                update_button.onclick = () => { cookies_get(key); };
                li.appendChild(update_button);

                list.appendChild(li);
            }
        })
        var input = document.getElementById("input");
        input.value = domain_url;
        var button = document.getElementById("button");
        button.onclick = () => { cookies_get(input.value); }
        var clear = document.getElementById("clear_button");
        clear.onclick = () => { cookies_clear(); }
    }
)