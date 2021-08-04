function apply_rules(data, post, id) {

    var ref_ids = [];
    var rules = [
        [/>>>\/([a-z0-9]+)(?:[#\/](\d+))?/g, function (m, o) {
            o.push(board_link(m[1], m[2]));
        }],
        [/(?:\{(\d+)\}|>>(\d+))/g, function (m, o) {
            var ref_id = parseInt(m[1] ? m[1] : m[2], 10);
            if (!ref_ids.includes(ref_id)) ref_ids.push(ref_id);
            o.push(quote_link(ref_id));
        }],
        [/^>+/mg, function (m, o) {
            var body = this.parse(rules, /$/mg);
            o.push($("<output class='greentext'/>").text(m[0]).append(body));
        }],
        [/\r?\n/g, function (m, o) {
            o.push($("<br>"));
        }],
        [/\[code(?: language=([a-z]+))?\](?:\r?\n)?/g, function (m, o) {
            var body = this.no_parse(/\[\/code\]/g);
            try {
                if (m[1]) {
                    try {
                        o.push($("<pre class='code'/>").html($("<code/>").html(hljs.highlight(m[1], body).value)));
                    } catch (e) {
                        o.push($("<pre class='code'/>").html($("<code/>").html(hljs.highlightAuto(body).value)));
                    }
                } else {
                    o.push($("<pre class='code'/>").html($("<code/>").html(hljs.highlightAuto(body).value)));
                }
            } catch (e) {
                o.push($("<pre class='code'/>").text(body));
            }
        }],
        [/\[spoiler\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/spoiler\]/g);
            o.push($("<span class='spoiler'/>").append(body));
        }],
        [/(?:https?:\/\/)?(?:www\.)?(?:twitter\.com)\/(.*)/g, function (m, o) {
            var main = $("<span/>");
            var url = m[0][0] == 'y' ? "https://" + m[0] : m[0];
            var elem = $("<a target='_blank'/>").attr("href", url).text(m[0]);
            var embed = $("<span>(embed)</span>").css({cursor: "pointer", fontSize: '10px'});
            main.append(elem, " ", embed);
            o.push(main);
            var embedded = false;
            embed.click(function (e) {
                e.stopPropagation();
                if (embedded) {
                    main.find("div.twit").remove();
                } else {
                    $.ajax({
                        url: 'https://publish.twitter.com/oembed?url=' + url,
                        dataType: 'jsonp',
                        success: function (data) {
                            main.append('<div class="twit">' + data.html + '</div>');
                        }
                    });
                }
                embedded = !embedded;
                embed.text(embedded ? "(unembed)" : "(embed)");
                var post = main.parents(".chat");
                post.toggleClass('chat_embed', embedded);// post.find("div.twit").length > 0);
            });
        }],
        [/(?:https?:\/\/)?(?:www\.)?(?:coub\.com)\/view\/(\S+)/g, function (m, o) {
            var main = $("<span/>");
            var url = m[0][0] == 'y' ? "https://" + m[0] : m[0];
            var elem = $("<a target='_blank'/>").attr("href", url).text(m[0]);
            var embed = $("<span>(embed)</span>").css({cursor: "pointer", fontSize: '10px'});
            main.append(elem, " ", embed);
            o.push(main);
            var embedded = false;
            embed.click(function (e) {
                e.stopPropagation();
                if (embedded) {
                    main.find("iframe").remove();
                } else {
                    var cb = $('<iframe allowfullscreen frameborder="0" width="640" height="360" allow="autoplay"></iframe>')
                        .attr("src", '//coub.com/embed/' + m[1] + '?muted=false&autostart=false&originalSize=false&startWithHD=false')
                        .css({float: "left", marginRight: '5px'});
                    main.append(cb);
                }
                embedded = !embedded;
                embed.text(embedded ? "(unembed)" : "(embed)");
                var post = main.parents(".chat");
                post.toggleClass('chat_embed', post.find("iframe").length > 0);
            });
        }],
        [/(?:https?:\/\/)?(?:www\.)?(?:instagram\.com)\/(.*)/g, function (m, o) {
            var main = $("<span/>");
            var url = m[0][0] == 'y' ? "https://" + m[0] : m[0];
            var elem = $("<a target='_blank'/>").attr("href", url).text(m[0]);
            var embed = $("<span>(embed)</span>").css({cursor: "pointer", fontSize: '10px'});
            main.append(elem, " ", embed);
            o.push(main);
            var embedded = false;
            embed.click(function (e) {
                e.stopPropagation();
                if (embedded) {
                    main.find("div.twit").remove();
                } else {
                    $.ajax({
                        url: 'https://api.instagram.com/oembed?url=' + url,
                        dataType: 'jsonp',
                        success: function (data) {
                            main.append('<div class="twit">' + data.html + '</div>');
                        }
                    });
                }
                embedded = !embedded;
                embed.text(embedded ? "(unembed)" : "(embed)");
                var post = main.parents(".chat");
                post.toggleClass('chat_embed', embedded);// post.find("div.twit").length > 0);
            });
        }],
        [/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(\S+)/g, function (m, o) {
            var main = $("<span/>");
            var url = m[0][0] == 'y' ? "https://" + m[0] : m[0];
            var elem = $("<a target='_blank'/>").attr("href", url).text(m[0]);
            var embed = $("<span>(embed)</span>").css({cursor: "pointer", fontSize: '10px'});
            main.append(elem, " ", embed);
            o.push(main);
            var embedded = false;
            embed.click(function (e) {
                e.stopPropagation();
                if (embedded) {
                    main.find("iframe").remove();
                } else {
                    var yt = $("<iframe width='560' height='315' style='max-width:100%;' frameborder='0' allowfullscreen></iframe>")
                        .attr("src", "https://www.youtube.com/embed/" + m[1]).css({float: "left", marginRight: '5px'});
                    main.append(yt);
                }
                embedded = !embedded;
                embed.text(embedded ? "(unembed)" : "(embed)");
                var post = main.parents(".chat");
                post.toggleClass('chat_embed', post.find("iframe").length > 0);
            });
            get_youtube_data(m[1], elem);
        }],
        [/(?:https?:\/\/)?(?:www\.)?(?:music\.yandex\.[a-z]{2})\/album\/(\d+)\/track\/(\d+)\/?/g, function (m, o) {
            var main = $("<span/>");
            var url = m[0][0] == 'y' ? "https://" + m[0] : m[0];
            var elem = $("<a target='_blank' class='yandex'/>").attr("href", url).text(url);
            var embed = $("<span>(embed)</span>").css({cursor: "pointer", fontSize: '10px'});
            main.append(elem, " ", embed);
            o.push(main);
            var embedded = false;
            embed.click(function (e) {
                e.stopPropagation();
                if (embedded) {
                    main.find("iframe").remove();
                } else {
                    var src = "https://music.yandex.ru/iframe/#track/" + m[2] + "/";
                    main.append($('<iframe frameborder="0" style="border:none;width:400px;height:100px;" width="400" height="100">')
                        .attr('src', src));
                }
                embedded = !embedded;
                embed.text(embedded ? "(unembed)" : "(embed)");
                var post = main.parents(".chat");
                post.toggleClass('chat_embed', post.find("iframe").length > 0);
            });
        }],
        [/https?:\/\/\S+()/g, function (m, o) { // stupid extra () is for some syntax highlighters to play nice.
            o.push($("<a target='_blank'/>").attr("href", m[0]).text(m[0]));
        }],
        [/\[b\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/b\]/g);
            o.push($("<span style='font-weight: bold;'/>").append(body));
        }],
        [/\[i\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/i\]/g);
            o.push($("<span style='font-style: italic;'/>").append(body));
        }],
        [/\[u\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/u\]/g);
            o.push($("<span style='text-decoration: underline;'/>").append(body));
        }],
        [/\[s\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/s\]/g);
            o.push($("<span style='text-decoration: line-through;'/>").append(body));
        }],
        [/\[ree\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/ree\]/g);
            o.push($("<article class='shake'/>").append(body));
        }],
        [/\[roll\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/roll\]/g);
            o.push($("<article class='roll'/>").append(body));
        }],
        [/\[lspin\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/lspin\]/g);
            o.push($("<article class='lspin'/>").append(body));
        }],
        [/\[spin\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/spin\]/g);
            o.push($("<article class='spin'/>").append(body));
        }],
        [/\[hflip\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/hflip\]/g);
            o.push($("<article class='hflip'/>").append(body));
        }],
        [/\[vflip\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/vflip\]/g);
            o.push($("<article class='vflip'/>").append(body));
        }],
        [/\[nonono\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/nonono\]/g);
            o.push($("<article class='nonono'/>").append(body));
        }],
	[/\[twirl\]/g, function (m, o) {
	    var body = this.parse(rules, /\[\/twirl\]/g);
            o.push($("<article class='twirl'/>").append(body));
        }],
        [/\[color=([#\w]+)\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/color\]/g);
            if ($('#spoilers').prop("checked")) {
                o.push($("<span/>").css("color", m[1]).append(body));
            } else {
                o.push($("<span/>").append(body));
            }
        }],
        [/Bavaria/gi, function (m, o) {
            o.push("Uganda");
        }],
        [/\[rotate=([+-]{0,1}[\d]+)\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/rotate\]/g);
            o.push($("<article/>").css("transform", "rotate(" + m[1] + "deg)").css("display", "inline-block").append(body));
        }],
        [/\[flag\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/flag\]/g);
            if (special_countries) {
                o.push($("<img/>").attr("src", encodeURI("/icons/countries2/" + body[0].data.replace('/', '').toUpperCase() + ".png")).css({height: "44px"}));
            } else {
                o.push($("<span>").text(body[0].data.toUpperCase()));
            }
        }],
        [/\[st\]/g, function (m, o) {
            var body = this.parse(rules, /\[\/st\]/g);
            o.push($("<img/>").attr("src", encodeURI("/images/stickers/" + body[0].data.replace('/', '') + ".png")).css({'min-height': "64px"}).css({'max-height': '100px'}).click(sticker_click));
        }],
        [/\[noparse\]/g, function (m, o) {
            var body = this.no_parse(/\[\/noparse\]/g);
            o.push(document.createTextNode(body));
        }]
    ];
    var smilies = [];

    for (var i = smiles.length - 1; i >= 0; i--) {
        let imgpath = smiles[i]+'.gif'
        smilies.push([new RegExp('\\*'+smiles[i]+'\\*','g'),function(m,o) {
            o.push($("<img/>").attr('src','/icons/smiles/'+ imgpath));
        }]);
    }

    rules = rules.concat(smilies);

    var body = new Parser(data.body).parse(rules);
    post.find(".chat_body").empty().append(body);


    // Create new backlinks
    $(ref_ids).each(function () {
        var link = quote_link(id);
        link.addClass("back_link");
        var their_refs = $("#chat_" + this + " .chat_refs");
        if (their_refs.length === 0) {
            if (future_ids[this] === undefined) future_ids[this] = $("<output />");
            future_ids[this].append(" ", link);
        } else {
            their_refs.append(" ", link);
        }
    });
}
