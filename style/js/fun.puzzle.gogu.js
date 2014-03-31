jQuery(document).ready(function($) {
    var projectname = "Christmas-puzzle", //工程名
        listurl = "Merry?screen=", // 留言列表地址，get方法
        createurl = "Dispose", // 留言提交地址，post方法
        approurl = "Suppot?id=", // 赞提交地址，get方法
        scrlisturl = "Info"; //拼图列表地址，get方法
    var testmode = 0; // 测试环境 0：前台 1：后台

    var viewindex = -1,
        opennext = false;

    var Puzzle = Backbone.Model.extend({
        urlRoot: "",
        defaults: {
            "id": 0,
            "nickname": "",
            "nto": "",
            "nindex": 0,
            "message": "",
            "status": 0,
            "screen": 0,
            "approval": 0
        }
    });

    var PuzzleList = Backbone.Collection.extend({
        model: Puzzle
    });
    var PuzzleList = new PuzzleList;

    var screennum = 0;
    var ScreenView = Backbone.View.extend({
        el: $(".puzzle-screen"),
        tagName: "li",
        sum: 392,
        limit: 242,
        counter: 1,
        template: function() {
            var temp = "";
            for (var i=0; i<=this.sum; i++) {
                temp += '<li class="frag"><div class="bgon"></div></li>';
            }
            return temp;
        },
        listlength:function() {
            return listlength = PuzzleList.length;
        },
        done: function() {
            return this.listlength() + "/" + this.sum;
        },
        distance: function() {
            var over = this.limit - this.listlength();
            return parseInt(over / this.sum * 100);
        },
        render: function() {
            var here = 0,
                _this = this;
            $(this.el).html(this.template()).css("backgroundImage", "none");
            var $frag = $(".frag");
            $frag
                .addClass("pointer")
                .bind("mouseenter", function() { 
                    $(this).children(".bgon").stop().show(); 
                    here = $(this).index(); 
                    _this.miniAction($(this).index());
                })
                .bind("mouseleave", function() {
                    $(this).children(".bgon").stop().fadeOut(200);
                    $("#mini").stop().fadeOut(200);
                });
            $("div.bgon").bind("click", function() { 
                _this.dataAction(here);
            });

            var temp = "",
                done = this.done(),
                distance = this.distance(),
                dontxt = "<span class='highnav'>"+done+"</span>块已翻开，",
                distxt = "还有<span class='highnav'>"+distance+"%</span>解锁下一图";
            if (distance < 0) {
                distxt = "已解锁下一图";
                opennext = !opennext;
            }
            temp = dontxt + distxt;
            $("#tips").html(temp);

            var prev = parseInt(screennum) - 1,
                next = parseInt(screennum) + 1,
                host = window.location.host,
                project = projectname;
            $("#prevScreen").attr("href", "http://"+host+"/"+project+"/#screen/" + prev).show();
            $("#nextScreen").attr("href", "http://"+host+"/"+project+"/#screen/" + next).show();
            if (screennum <= 0) {
                $("#prevScreen").hide();
            } 
            if(opennext) {
                $("#nextScreen").hide();
            }
            $(".screen-to").bind("click", function(){ viewindex = -1 });

            return this;
        },
        openFrag: function(index) {
            var complete = $(".frag").eq(index),
                top = complete.position().top - 28 + 40,
                left = complete.position().left -28 + 40;
            var messnum = parseInt(screennum * 18793.5 + 1);

            complete
                .addClass("complete")
                .css({
                    "backgroundPosition": "-"+left+"px -"+top+"px",
                    "background-image": "url(bg/"+messnum+".jpg)"
                });
            if (index === parseInt(viewindex)) {
                this.dataAction(index);
            }
            return complete;
        },
        completeFrag: function(data) {
            var index = data.get("nindex"),
                complete = this.openFrag(index),
                _this = this;
            complete.fadeTo(0, 0).delay(_this.counter * 10).fadeTo(500, 1);
            $(".dark").fadeTo(300, 0.6);
            _this.counter ++;
            if (data.get("status") === 1) {
                complete.addClass("dark");
            }
        },
        miniAction: function(index) {
            var frag = $(".frag").eq(index),
                show = frag.is(".complete"),
                top = frag.offset().top + 1,
                left = frag.offset().left + 41;
            if (top > 470) {
                top -= 80;
            }
            if (left > 1160) {
                left -= 240;
            }
            if (show) {
                MessageView.minishow(index, top, left);
            }
        },
        dataAction: function(index) {
            var frag = $(".frag").eq(index),
                _show = frag.is(".complete");
            if (_show) {
                MessageView.show(PuzzleList, index);
            } else {
                frag.addClass("selectbg").show();
                FormView.setIndex(index);
                FormView.show();
            }
        }
    });
    var ScreenView = new ScreenView();

    var MessageView = Backbone.View.extend({
        el: $("#puzzle-message"),
        aid: -1,
        minitemp: function(data) {
            var mini = data.message;
            if (mini.length > 24) {
                mini = mini.substring(0, 18) + "...";
            }
            var temp = "{{#nto}}<p class='m-to'>给{{nto}}</p>{{/nto}}<blockquote class='m-message'>"+mini+"</blockquote><p class='m-nickname'>{{nickname}}</p>";
            return Mustache.to_html(temp, data);
        },
        minishow: function(index, top, left) {
            var list = PuzzleList;
            data = list.filter(function(e) {
              return e.get("nindex") === index;
            });
            if (data[0] !== undefined) {
                $("#mini")
                    .html(this.minitemp(data[0].toJSON()))
                    .css({"top": top + "px", "left": left + "px", "opacity": 0.7})
                    .bind("mouseenter", function() {
                        $(this).hide();
                    })
                    .stop().show();
            }
        },
        template: function(data) {
            var host = window.location.host, 
                project = projectname,
                temp = '<span id="message-cancel">x</span><div class="p-url"><input id="url" type="text" readonly value="http://'+host+'/'+project+'/#screen/{{screen}}/{{nindex}}"><div id="paste" name="paste">复制地址</div></div><div class="p-content"><h4 class="p-to">{{#nto}}给<span class="p-nto">{{nto}}</span>的话{{/nto}}</h4><p class="p-message">{{{message}}}</p><p class="p-from">{{nickname}}</p><p class="p-other"><span id="approve">赞</span><span class="p-read">被赞<span id="appronum">{{approval}}</span>次</span></p></div>';
            return Mustache.to_html(temp, data);
        },
        events: {
            'click #message-cancel': 'cancel',
            'click #approAction': 'approAction',
            'click #approve': 'approAction'
        },
        show: function(list, index) {
            data = list.filter(function(e) {
                return e.get("nindex") === index;
            });
            this.aid = data[0].id;
            $el = $(this.el);
            $el
                .html(this.template(data[0].toJSON())).fadeIn(400);
                .removeClass();
            var tempbg = "randombg" + parseInt(Math.random()*4);
            $el.addClass(tempbg);
            $("#puzzle-info").fadeIn(200);
            if (window.clipboardData) {
                $('#paste').live("click", function() {
                    window.clipboardData.setData("text", $("#url").val());
                });
            } else {
                $('#paste').zclip({
                    path: 'style/js/lib/ZeroClipboard.swf',
                    copy: $("#url").val(),
                    afterCopy: function() {
                        AlertView.render("网址已复制到剪切板，<br />Ctrl+V 给你的朋友看看吧 : >", "cancel")
                    }
                });
            }
            //clip.glue('paste'); 
        },
        cancel: function() {
            $(this.el).fadeOut(200);
            $("#puzzle-info").fadeOut(200);
            $("li.selectbg").removeClass("selectbg");
        },
        approAction: function() {
            var appro = $("#approve"),
                approplus = $("#appronum");
            var appronum = parseInt(approplus.text()) + 1;
            /*test*/if (testmode===0) {
                    appro.text("赞+1");
                    approplus.text(appronum);
                }

            $.get(approurl + this.aid, function() {
                appro.text("赞+1");
                approplus.text(appronum);
            }).error(function(response) {
                AlertView.render(response, 'cancel');
            });

        }
    });
    var MessageView = new MessageView();

    var FormView = Backbone.View.extend({
        el: $("#puzzle-form"),
        index: 0,
        getIndex: function() {
            return this.index;
        },
        setIndex: function(index) {
            this.index = index;
        },
        getName: function() {
            return $("input[name='nickname']");
        },
        getTo: function() {
            return $("input[name='to']");
        },
        getMessage: function() {
            return $("textarea[name='message']");
        },
        events: {
            'click #form-cancel': 'cancel',
            'submit form': 'submitAction'
        },
        show: function() {
            this.getMessage().val("");
            this.getTo().val("");
            $(this.el).fadeIn(200);
            $("#puzzle-info").fadeIn(200);
        },
        cancel: function() {
            $(this.el).fadeOut(200);
            $("#puzzle-info").fadeOut(200);
            $("li.selectbg").removeClass("selectbg");
        },
        checkAll: function() {
            var nname = this.getName(),
                nto = this.getTo(),
                nmessage = this.getMessage(),
                result = true;

            if (nmessage.val().length <= 0 || nmessage.val() > 200){
                nmessage.focus().select();
                result = false;
            }
            if (!nto.val().length > 0) {
                nto.focus().select();
                result = false;
            }
            if (!nname.val().length > 0) {
                nname.focus().select();
                result = false;
            }

            return result;
        },
        submitAction: function(e) {
            e.preventDefault();
            var reg = this.checkAll(),
                _this = this;
            if (reg) {
                if (testmode === 0) {
                    /* test */_this.cancel();
                    /* test */ScreenView.openFrag(_this.getIndex()).addClass("dark");
                }
                var data = {
                    nickname: _this.getName().val(),
                    nto: _this.getTo().val(),
                    message: _this.getMessage().val(),
                    nindex: _this.getIndex(),
                    screen: screennum,  
                    status: 0,
                    approval: 0
                };
                $.post(createurl, data).success(function(response) {
                    response = parseInt(response);
                    if (response === 0) {
                        _this.cancel();
                        AlertView.render("你已成功翻开", "cancel");
                        ScreenView.openFrag(_this.getIndex()).addClass("dark");
                        PuzzleList.fetch();
                        // 0 成功
                        // 100重复提交
                        // 102系统繁忙
                        // 104请认真填写
                        // 106提交过于频繁
                        // 108信息提交有误
                        // 110该位置被占用
                    } else {
                        AlertView();
                        AlertView.render(response, "cancel");
                        ScreenView.openFrag(_this.getIndex()).addClass("dark");
                    }
                }).error(function(response) {
                    AlertView.render(response.status, "cancel");
                });
            } else {
                AlertView.render("祝福没有发送，请核对信息", "cancel");
            }
            return false;
        }
    });
    var FormView = new FormView();

    var ScrlistView = Backbone.View.extend({
        el: $("#screen-list"),
        render: function() {
            var _this = this;
            var url = (testmode === 0) ? "scrlist.json" : scrlisturl;
            $("#normal").hide();
            $("#screen-list").delay(100).animate({marginTop: "0px"}, 900);
            /* test */ this.show();
            $.getJSON(url + "?" + Math.random(), function(data){
                var length = data.length,
                    limit = 9,
                    page = 0,
                    all = parseInt(length / limit),
                    temp = "";
                for (var pi=0; pi<=all; pi++) {
                    temp += '<ul id="page'+pi+'">';
                    for (var i=0; i<=9; i++) {
                        var index = i + page*10;
                        if (index < length) {
                            temp += _this.template(data[index]);
                        } else {
                            temp += '<li></li>';
                        }
                    }
                    temp += '</ul>';
                    page ++;
                };
                $("#list-ul").html(temp);

                var pageid = page - 1,
                    limitid = pageid;
                console.log(pageid);
                console.log(limitid);
                for (var i=0; i<= pageid - 1; i++) {
                    $("#list-ul ul").eq(i).delay(200).animate({marginTop: "-=300px"}, 500);
                }
                var prevto = function() {
                    if (pageid > 0) {
                        var h = 300;
                        $("#list-ul ul").eq(pageid - 1).animate({marginTop: "+="+h+"px"}, 500);
                        console.log(pageid);
                        pageid = pageid - 1;
                    }
                }
                var nextto = function() {
                    if (pageid < limitid) {
                        var h = 300;
                        $("#list-ul ul").eq(pageid).animate({marginTop: "-="+h+"px"}, 500);
                        console.log(pageid);
                        pageid = pageid + 1;
                    }
                }
                $("#prevList").live("click", prevto);
                $("#nextList").live("click", nextto);
            }).error(function(response) {
                AlertView.render("请求错误", "cancel");
            });

        },
        template: function(data) {
            var temp = "";
            if (data.status === 0) {
                temp = '<li><a href="#screen/{{screen}}" class="screen-link"><div class="img-block"><img src="{{img}}" alt="" /></div><span class="screen-name">{{title}}</span></a></li>';
            } else {
                temp = '<li><div class="img-block"></div><span class="screen-name">{{title}}</span></li>';
            }
            return Mustache.to_html(temp, data);
        },
        show: function() {
            $(this.el).show();
        },
        hide: function() {
            $("#prevList").die();
            $("#nextList").die();
            $("#screen-list").delay(130).animate({marginTop: "-900px"}, 900);
            $("#normal").show();
        }
    });
    var ScrlistView = new ScrlistView();

    var AlertView = Backbone.View.extend({
        el: $("#alertex"),
        render: function(text, mode) {
            $(this.el).html(this.template(text, mode));
            $(this.el).show(200);
            $("#alertbg").fadeIn(100);
        },
        template: function(text, mode) {
            return '<span id="alert-cancel" class="alert-cancel">x</span><div class="alert-content"><p>'+ text +'</p><div class="alert-buttons"><button class="alert-'+ mode +'">确 认</button></div></div>';
        },
        events: {
            'click .alert-cancel': "cancel"
        },
        cancel: function() {
            $(this.el).fadeOut(200);
            $("#alertbg").fadeOut(200);
        }
    });
    var AlertView = new AlertView();

    var Workspace = Backbone.Router.extend({
        routes: {
            "screen": "showScrlist",
            "screen/:num": "changeScreen",
            "screen/:num/:index": "showFragInfo"
        },
        showScrlist: function() {
            ScrlistView.render();
        },
        changeScreen: function(num) {
            $("#puzzle-screen").removeAttr("styel");
            ScrlistView.hide();
            screennum = num;
            opennext = 1;
            ScreenView.counter = 1;
            turl = (testmode === 0) ? "data" + num + ".json?" + Math.random():listurl + num + "&radom=" + Math.random();
            PuzzleList.url = turl;
            PuzzleList.fetch();
        },
        showFragInfo: function(num, index) {
            this.changeScreen(num);
            viewindex = index;
        }
    });
    var Work = new Workspace();
    Backbone.history.start();

    var AppView = Backbone.View.extend({
        el: $("#puzzle"),
        initialize: function() {
            PuzzleList.bind('reset', this.addAll, this);
        },
        addOne: function(data) {
            ScreenView.completeFrag(data);
        },
        addAll: function() {
            ScreenView.render();
            PuzzleList.each(this.addOne);
        }
    });
    var AppView = new AppView();
});