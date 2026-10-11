game.import("extension",function(lib,game,ui,get,ai,_status){return {name:"指示线",editable:false,content:function (config,pack) {

        // ---------------------------------------指示线------------------------------------------//
        var jianqiLineAnim = {
            "time": 1400,
            "position": "screen",
            "width": "81px",
            "height": "256px",
            "backgroundSize": "100% 100%",
            "opacity": 1,
            "show": "none",
            "fade": true,
            "pause": false,
            "rate_zhen": 24,
            "jump_zhen": false,
            "qianzhui": "",
            "liang": false,
            "isLine": true,
            "cycle": true,
            "style": {},
            "skills": [],
            "cards": [],
            "forbid": false,
            "image": "jianqilinexy"
        };
        if (config.zhishixian == "yulong") {
            lib.skill._player_xxgg_zhishixian_xxxxx_ggg = {
                trigger: {
                    source: 'damageBegin4'
                },
                charlotte: true,
                forced: true,
                content: function () {
                    'step 0'
                    if (trigger.num > 1) {
                        game.linexy = game.zsbaojiLineXy;
                        player.line(trigger.player);
                    }
                    'step 1'
                        game.linexy = game.zsyulongLineXy;

                },
            }
            game.zsPlayLineAnimation = function (name, node, fake, points) {
                var animation = jianqiLineAnim;
                //     alert(jianqiLineAnim);
                animation["image"] = name;
                if (lib.config.zsGuideTime) {
                    animation["time"] = parseInt(lib.config.zsGuideTime);
                }
                if (animation == undefined) return;
                if (animation.time <= 100000) {
                    if (animation.pause != false && !_status.paused2 && !_status.nopause) {
                        _status.zhx_onAnimationPause = true;
                        game.pause2();
                    }
                    ;
                    if (_status.zhx_onAnimation == undefined) _status.zhx_onAnimation = 0;
                    _status.zhx_onAnimation++;
                }
                ;
                var src;
                if (animation.image != undefined) src = 'extension/指示线/pointer/' + animation.image + '?' + new Date().getTime();
                var finish = function () {
                    var animationID;
                    var timeoutID;
                    var interval;
                    var div = ui.create.div();
                    if (fake == true) {
                        ui.window.appendChild(div);
                    } else {
                        if (node == undefined || node == false) {
                            ui.window.appendChild(div);
                        } else {
                            node.appendChild(div);
                        }
                        ;
                    }
                    ;
                    if (animation.style != undefined) {
                        for (var i in animation.style) {
                            if (i == 'innerHTML') continue;
                            div.style[i] = animation.style[i];
                        }
                        ;
                    }
                    ;
                    var judgeStyle = function (style) {
                        if (animation.style == undefined) return false;
                        if (animation.style != undefined && animation.style[style] != undefined) return true;
                        return false;
                    };
                    if (judgeStyle('innerHTML')) div.innerHTML = animation.style.innerHTML;
                    if (judgeStyle('width') == false) div.style.width = animation.width;
                    if (judgeStyle('height') == false) div.style.height = animation.height;
                    if (judgeStyle('backgroundSize') == false && judgeStyle('background-size') == false) div.style.backgroundSize = animation.backgroundSize;
                    if (judgeStyle('opacity') == false) div.style.opacity = animation.opacity;
                    if (judgeStyle('zIndex') == false && judgeStyle('z-index') == false) div.style.zIndex = 1001;
                    if (judgeStyle('borderRadius') == false && judgeStyle('border-radius') == false) div.style.borderRadius = '5px';
                    if (judgeStyle('pointer-events') == false && judgeStyle('pointerEvents') == false) div.style['pointer-events'] = 'none';
                    if (src != undefined) {
                        if (animation.image.indexOf('.') != -1) {
                            div.setBackgroundImage(src);
                        } else {
                            var type_frame1 = 0;
                            var type_frame = '.jpg';
                            var num_frame = 1;
                            type_frame = '.png';
                            num_frame = 8;
                            var folder_frame = lib.assetURL + 'extension/指示线/pointer/' + animation.image + '/';
                            var div1 = ui.create.div();
                            div1.style.height = '100%';
                            div1.style.width = '100%';
                            div1.style.top = '0px';
                            div1.style.left = '0px';
                            div1.style.opacity = '0.7';
                            div.appendChild(div1);
                            var canvas = document.createElement("canvas");
                            canvas.width = div1.offsetWidth;
                            canvas.height = div1.offsetHeight;
                            div1.appendChild(canvas);
                            var context = canvas.getContext("2d");
                            var start;
                            var imgs = [];
                            var imgs_num = 0;
                            for (var i = 0; i < num_frame; i++) {
                                var img = new Image();
                                img.src = folder_frame + (animation.qianzhui == undefined ? '' : animation.qianzhui) +
                                    (animation.liang == true ? (i < 10 ? '0' + i : i) : i) + type_frame;
                                if (i >= num_frame - 1) img.zhx_final = true;
                                img.onload = function () {
                                    imgs.push(this);
                                    if (this.zhx_final == true) start();
                                };
                                img.onerror = function () {
                                    if (this.zhx_final == true) start();
                                };
                            }
                            ;
                            start = function () {
                                var play = function () {
                                    if (imgs_num >= imgs.length) return;
                                    var img = imgs[imgs_num];
                                    context.clearRect(0, 0, img.width, img.height);
                                    context.drawImage(img, 0, 0, img.width, img.height, 0, 0, div1.offsetWidth, div1.offsetHeight);
                                    imgs_num++;
                                    if (animation.jump_zhen == true && imgs[imgs_num + 1] != undefined) imgs.remove(imgs_num + 1);
                                    if (imgs_num >= imgs.length) {
                                        if (animation.cycle == true) {
                                            imgs_num = 0;
                                        } else {
                                            if (interval != undefined) clearInterval(interval);
                                            if (timeoutID != undefined) clearTimeout(timeoutID);
                                            if (animationID != undefined) cancelAnimationFrame(animationID);
                                        }
                                        ;
                                    }
                                    ;
                                };
                                interval = setInterval(play, animation.rate_zhen == undefined ? 45 : (1000 / animation.rate_zhen));
                            };


                        }
                        ;
                    }
                    ;
                    if (points == undefined) {
                        if (fake == true) {
                            div.style.top = (top - div.offsetHeight / 2) + 'px';
                            div.style.left = (left - div.offsetWidth / 2) + 'px';
                        } else {
                            if (judgeStyle('top') == false) div.style.top = 'calc(50% - ' + (div.offsetHeight / 2) + 'px)';
                            if (judgeStyle('left') == false) div.style.left = 'calc(50% - ' + (div.offsetWidth / 2) + 'px)';
                        }
                        ;
                    } else {
                        div.style.top = (points[0][1] - div.offsetHeight / 2) + 'px';
                        div.style.left = (points[0][0]) + 'px';
                    }
                    ;
                    if (points != undefined) {
                        var timeS = ((animation.fade == true ? animation.time - 450 : animation.time - 100) / 1000) / 2;
                        var getAngle = function (x1, y1, x2, y2, bool) {
                            var x = x1 - x2;
                            var y = y1 - y2;
                            var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                            var cos = y / z;
                            var radina = Math.acos(cos);
                            var angle = 180 / (Math.PI / radina);
                            if (x2 > x1 && y2 === y1) angle = 0;
                            if (x2 > x1 && y2 < y1) angle = angle - 90;
                            if (x2 === x1 && y1 > y2) angle = -90;
                            if (x2 < x1 && y2 < y1) angle = 270 - angle;
                            if (x2 < x1 && y2 === y1) angle = 180;
                            if (x2 < x1 && y2 > y1) angle = 270 - angle;
                            if (x2 === x1 && y2 > y1) angle = 90;
                            if (x2 > x1 && y2 > y1) angle = angle - 90;
                            if (bool == true && angle > 90) angle -= 180;
                            return angle;
                        };
                        var p1 = points[0];
                        var p2 = points[1];
                        var x0 = p1[0];
                        var y0 = p1[1];
                        var x1 = p2[0];
                        var y1 = p2[1];
                        div.style.transition = 'all 0s';
                        div.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1, true) + 'deg)' + (x0 > x1 ? '' : ' rotateY(180deg)');
                        div.style['transform-origin'] = '0 50%';
                        var div2 = ui.create.div();
                        div2.style.zIndex = 1000;
                        div2.style['pointer-events'] = 'none';
                        div2.style.height = '50px';
                        div2.style.width = (Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2) + 'px';
                        div2.style.left = (x0) + 'px';
                        div2.style.top = (y0 - 30) + 'px';
                        div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) scaleX(0)';
                        div2.style['transform-origin'] = '0 50%';
                        div2.style.transition = 'all ' + (timeS * 4 / 3) + 's';
                        if (src != undefined && animation.image.indexOf('.') == -1) {
                            div2.style.backgroundSize = '100% 100%';
                            div2.style.opacity = '1';
                            div2.setBackgroundImage('extension/指示线/pointer/' + animation.image + '/line.png');
                        } else {
                            div2.style.background = '#ffffff';
                        }
                        ;
                        setTimeout(function () {
                            div.style.transition = 'all ' + (timeS * 4 / 3) + 's';
                            div.style.transform += ' translateX(' + (-(Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2)) + 'px)';
                            div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) scaleX(1)';
                        }, 50);
                        setTimeout(function () {
                            div2.style.transition = 'all ' + (timeS * 2 / 3) + 's';
                            div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) translateX(' +
                                (Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2 -
                                    Math.pow(Math.pow(div.offsetHeight / 2, 2) + Math.pow(div.offsetWidth / 2, 2), 0.1)) + 'px) scaleX(0.01)';
                        }, 50 + timeS * 4 / 3 * 1000);
                        node.appendChild(div2);
                    }
                    ;
                    if (animation.time <= 100000) {
                        if (animation.fade == true) {
                            if (div2 != undefined) {
                                setTimeout(function () {
                                    div2.hide();
                                }, animation.time - 350);
                                setTimeout(function () {
                                    div.hide();
                                }, animation.time - 400);
                            } else {
                                setTimeout(function () {
                                    div.hide();
                                }, animation.time - 350);
                            }
                            ;
                        }
                        ;
                        setTimeout(function () {
                            if (interval != undefined) clearInterval(interval);
                            if (timeoutID != undefined) clearTimeout(timeoutID);
                            if (animationID != undefined) cancelAnimationFrame(animationID);
                            if (fake == true) {
                                ui.window.removeChild(div);
                            } else {
                                if (node == undefined || node == false) {
                                    ui.window.removeChild(div);
                                } else {
                                    node.removeChild(div);
                                }
                                ;
                            }
                            ;
                            if (div2 != undefined) node.removeChild(div2);
                            _status.zhx_onAnimation--;
                            if (_status.zhx_onAnimationPause == true && _status.zhx_onAnimation == 0) {
                                delete _status.zhx_onAnimationPause;
                                game.resume2();
                            }
                            ;
                        }, animation.time);
                    }
                    ;
                };
                if (animation.delay != undefined) {
                    setTimeout(finish, animation.delay);
                } else {
                    finish();
                }
                ;
            };
        }
        if (config.zhishixian == "jingdian") {
            lib.skill._player_xxgg_zhishixian2_xxxxx_ggg = {
                trigger: {
                    source: 'damageBegin4'
                },
                charlotte: true,
                forced: true,
                content: function () {
                    'step 0'
                    if (trigger.num > 1) {
                        game.linexy = game.zsbaojiLineXy;
                        player.line(trigger.player);
                    }
                    'step 1'
                    game.linexy = game.zsjingdianLineXy;
                },
            }
        game.zsPlayLineAnimation = function (name, node, fake, points) {
            var animation = jianqiLineAnim;
            //     alert(jianqiLineAnim);
            animation["image"] = name;
            if (lib.config.zsGuideTime) {
                animation["time"] = parseInt(lib.config.zsGuideTime);
            }
            if (animation == undefined) return;
            if (animation.time <= 100000) {
                if (animation.pause != false && !_status.paused2 && !_status.nopause) {
                    _status.zhx_onAnimationPause = true;
                    game.pause2();
                }
                ;
                if (_status.zhx_onAnimation == undefined) _status.zhx_onAnimation = 0;
                _status.zhx_onAnimation++;
            }
            ;
            var src;
            if (animation.image != undefined) src = 'extension/指示线/pointer/' + animation.image + '?' + new Date().getTime();
            var finish = function () {
                var animationID;
                var timeoutID;
                var interval;
                var div = ui.create.div();
                if (fake == true) {
                    ui.window.appendChild(div);
                } else {
                    if (node == undefined || node == false) {
                        ui.window.appendChild(div);
                    } else {
                        node.appendChild(div);
                    }
                    ;
                }
                ;
                if (animation.style != undefined) {
                    for (var i in animation.style) {
                        if (i == 'innerHTML') continue;
                        div.style[i] = animation.style[i];
                    }
                    ;
                }
                ;
                var judgeStyle = function (style) {
                    if (animation.style == undefined) return false;
                    if (animation.style != undefined && animation.style[style] != undefined) return true;
                    return false;
                };
                if (judgeStyle('innerHTML')) div.innerHTML = animation.style.innerHTML;
                if (judgeStyle('width') == false) div.style.width = animation.width;
                if (judgeStyle('height') == false) div.style.height = animation.height;
                if (judgeStyle('backgroundSize') == false && judgeStyle('background-size') == false) div.style.backgroundSize = animation.backgroundSize;
                if (judgeStyle('opacity') == false) div.style.opacity = animation.opacity;
                if (judgeStyle('zIndex') == false && judgeStyle('z-index') == false) div.style.zIndex = 1001;
                if (judgeStyle('borderRadius') == false && judgeStyle('border-radius') == false) div.style.borderRadius = '5px';
                if (judgeStyle('pointer-events') == false && judgeStyle('pointerEvents') == false) div.style['pointer-events'] = 'none';
                if (src != undefined) {
                    if (animation.image.indexOf('.') != -1) {
                        div.setBackgroundImage(src);
                    } else {
                        var type_frame1 = 0;
                        var type_frame = '.jpg';
                        var num_frame = 1;
                        type_frame = '.png';
                        num_frame = 8;
                        var folder_frame = lib.assetURL + 'extension/指示线/pointer/' + animation.image + '/';
                        var div1 = ui.create.div();
                        div1.style.height = '100%';
                        div1.style.width = '100%';
                        div1.style.top = '0px';
                        div1.style.left = '0px';
                        div1.style.opacity = '0.7';
                        div.appendChild(div1);
                        var canvas = document.createElement("canvas");
                        canvas.width = div1.offsetWidth;
                        canvas.height = div1.offsetHeight;
                        div1.appendChild(canvas);
                        var context = canvas.getContext("2d");
                        var start;
                        var imgs = [];
                        var imgs_num = 0;
                        for (var i = 0; i < num_frame; i++) {
                            var img = new Image();
                            img.src = folder_frame + (animation.qianzhui == undefined ? '' : animation.qianzhui) +
                                (animation.liang == true ? (i < 10 ? '0' + i : i) : i) + type_frame;
                            if (i >= num_frame - 1) img.zhx_final = true;
                            img.onload = function () {
                                imgs.push(this);
                                if (this.zhx_final == true) start();
                            };
                            img.onerror = function () {
                                if (this.zhx_final == true) start();
                            };
                        }
                        ;
                        start = function () {
                            var play = function () {
                                if (imgs_num >= imgs.length) return;
                                var img = imgs[imgs_num];
                                context.clearRect(0, 0, img.width, img.height);
                                context.drawImage(img, 0, 0, img.width, img.height, 0, 0, div1.offsetWidth, div1.offsetHeight);
                                imgs_num++;
                                if (animation.jump_zhen == true && imgs[imgs_num + 1] != undefined) imgs.remove(imgs_num + 1);
                                if (imgs_num >= imgs.length) {
                                    if (animation.cycle == true) {
                                        imgs_num = 0;
                                    } else {
                                        if (interval != undefined) clearInterval(interval);
                                        if (timeoutID != undefined) clearTimeout(timeoutID);
                                        if (animationID != undefined) cancelAnimationFrame(animationID);
                                    }
                                    ;
                                }
                                ;
                            };
                            interval = setInterval(play, animation.rate_zhen == undefined ? 45 : (1000 / animation.rate_zhen));
                        };


                    }
                    ;
                }
                ;
                if (points == undefined) {
                    if (fake == true) {
                        div.style.top = (top - div.offsetHeight / 2) + 'px';
                        div.style.left = (left - div.offsetWidth / 2) + 'px';
                    } else {
                        if (judgeStyle('top') == false) div.style.top = 'calc(50% - ' + (div.offsetHeight / 2) + 'px)';
                        if (judgeStyle('left') == false) div.style.left = 'calc(50% - ' + (div.offsetWidth / 2) + 'px)';
                    }
                    ;
                } else {
                    div.style.top = (points[0][1] - div.offsetHeight / 2) + 'px';
                    div.style.left = (points[0][0]) + 'px';
                }
                ;
                if (points != undefined) {
                    var timeS = ((animation.fade == true ? animation.time - 450 : animation.time - 100) / 1000) / 2;
                    var getAngle = function (x1, y1, x2, y2, bool) {
                        var x = x1 - x2;
                        var y = y1 - y2;
                        var z = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
                        var cos = y / z;
                        var radina = Math.acos(cos);
                        var angle = 180 / (Math.PI / radina);
                        if (x2 > x1 && y2 === y1) angle = 0;
                        if (x2 > x1 && y2 < y1) angle = angle - 90;
                        if (x2 === x1 && y1 > y2) angle = -90;
                        if (x2 < x1 && y2 < y1) angle = 270 - angle;
                        if (x2 < x1 && y2 === y1) angle = 180;
                        if (x2 < x1 && y2 > y1) angle = 270 - angle;
                        if (x2 === x1 && y2 > y1) angle = 90;
                        if (x2 > x1 && y2 > y1) angle = angle - 90;
                        if (bool == true && angle > 90) angle -= 180;
                        return angle;
                    };
                    var p1 = points[0];
                    var p2 = points[1];
                    var x0 = p1[0];
                    var y0 = p1[1];
                    var x1 = p2[0];
                    var y1 = p2[1];
                    div.style.transition = 'all 0s';
                    div.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1, true) + 'deg)' + (x0 > x1 ? '' : ' rotateY(180deg)');
                    div.style['transform-origin'] = '0 50%';
                    var div2 = ui.create.div();
                    div2.style.zIndex = 1000;
                    div2.style['pointer-events'] = 'none';
                    div2.style.height = '60px';
                    div2.style.width = (Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2) + 'px';
                    div2.style.left = (x0) + 'px';
                    div2.style.top = (y0 - 30) + 'px';
                    div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) scaleX(0)';
                    div2.style['transform-origin'] = '0 50%';
                    div2.style.transition = 'all ' + (timeS * 4 / 3) + 's';
                    if (src != undefined && animation.image.indexOf('.') == -1) {
                        div2.style.backgroundSize = '100% 100%';
                        div2.style.opacity = '1';
                        div2.setBackgroundImage('extension/指示线/pointer/' + animation.image + '/line.png');
                    } else {
                        div2.style.background = '#ffffff';
                    }
                    ;
                    setTimeout(function () {
                        div.style.transition = 'all ' + (timeS * 4 / 3) + 's';
                        div.style.transform += ' translateX(' + (-(Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2)) + 'px)';
                        div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) scaleX(1)';
                    }, 50);
                    setTimeout(function () {
                        div2.style.transition = 'all ' + (timeS * 2 / 3) + 's';
                        div2.style.transform = 'rotate(' + getAngle(x0, y0, x1, y1) + 'deg) translateX(' +
                            (Math.pow(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2), 0.5) + 2 -
                                Math.pow(Math.pow(div.offsetHeight / 2, 2) + Math.pow(div.offsetWidth / 2, 2), 0.1)) + 'px) scaleX(0.01)';
                    }, 50 + timeS * 4 / 3 * 1000);
                    node.appendChild(div2);
                }
                ;
                if (animation.time <= 100000) {
                    if (animation.fade == true) {
                        if (div2 != undefined) {
                            setTimeout(function () {
                                div2.hide();
                            }, animation.time - 350);
                            setTimeout(function () {
                                div.hide();
                            }, animation.time - 400);
                        } else {
                            setTimeout(function () {
                                div.hide();
                            }, animation.time - 350);
                        }
                        ;
                    }
                    ;
                    setTimeout(function () {
                        if (interval != undefined) clearInterval(interval);
                        if (timeoutID != undefined) clearTimeout(timeoutID);
                        if (animationID != undefined) cancelAnimationFrame(animationID);
                        if (fake == true) {
                            ui.window.removeChild(div);
                        } else {
                            if (node == undefined || node == false) {
                                ui.window.removeChild(div);
                            } else {
                                node.removeChild(div);
                            }
                            ;
                        }
                        ;
                        if (div2 != undefined) node.removeChild(div2);
                        _status.zhx_onAnimation--;
                        if (_status.zhx_onAnimationPause == true && _status.zhx_onAnimation == 0) {
                            delete _status.zhx_onAnimationPause;
                            game.resume2();
                        }
                        ;
                    }, animation.time);
                }
                ;
            };
            if (animation.delay != undefined) {
                setTimeout(finish, animation.delay);
            } else {
                finish();
            }
            ;
        };
    }
            game.zsOriginLineXy = game.linexy;
            game.zsShuimoLineXy = function(path){
                var from=[path[0],path[1]];
                var to=[path[2],path[3]];
                var total=typeof arguments[1]==='number'?arguments[1]:lib.config.duration*2;
                var opacity=0.85;
                r = Math.floor(Math.random() * 256); //随机生成256以内r值
                g = Math.floor(Math.random() * 256); //随机生成256以内g值
                b = Math.floor(Math.random() * 256); //随机生成256以内b值
                var color=[r,g,b];
                var dashed=false;
                var drag=false;
                if(typeof arguments[1]=='object'){
                    for(var i in arguments[1]){
                        switch(i){
                            case 'opacity':opacity=arguments[1][i];break;
                            case 'color':color=arguments[1][i];break;
                            case 'dashed':dashed=arguments[1][i];break;
                            case 'duration':total=arguments[1][i];break;
                        }
                    }
                }
                else if(arguments[1]=='fire'||arguments[1]=='thunder'||arguments[1]=='green'){
                    color=arguments[1];
                }
                total *= 2;
                var longtou = ui.create.div('.zhx-longtou');
                ui.create.div('.zhx-longtou-image',longtou);
                color = [r,g,b];
                var node;
                if(arguments[1]=='drag'){
                    color=[r,g,b];
                    drag=true;
                    if(arguments[2]){
                        node=arguments[2]
                    }
                    else{
                        node=ui.create.div('.linexy.drag');
                        ui.create.div('.zhx-shuimo-line',node);
                        node.style.left=from[0]+'px';
                        node.style.top=from[1]+'px';
                        node.style.opacity=0.7;
                        longtou.style.left=from[0]+'px';
                        longtou.style.top=from[1]+'px';
                        longtou.style.opacity=0;
                        node.style.background='linear-gradient(transparent,rgba('+color.toString()+','+opacity+'),rgba('+color.toString()+','+opacity+'))';
                        if(game.chess){
                            ui.chess.appendChild(node);
                            ui.chess.appendChild(longtou);
                        }
                        else{
                            ui.arena.appendChild(node);
                            ui.arena.appendChild(longtou);
                        }
                    }
                }
                else{
                    node=ui.create.div('.linexy.hidden');
                    ui.create.div('.zhx-shuimo-line',node);
                    node.style.left=from[0]+'px';
                    node.style.top=from[1]+'px';
                    node.style.opacity=0.7;
                    node.style.background='linear-gradient(transparent,rgba('+color.toString()+','+opacity+'),rgba('+color.toString()+','+opacity+'))';
                    if(lib.config.zsGuideTime){
                        node.style.transitionDuration=(parseInt(lib.config.zsGuideTime)/1000)+'s';
                    }else{
                        node.style.transitionDuration=(1200/1000)+'s';
                    }
                    longtou.style.left=from[0]+'px';
                    longtou.style.top=from[1]+'px';
                    longtou.style.opacity=0;
                    if(lib.config.zsGuideTime){
                        longtou.style.transitionDuration=(parseInt(lib.config.zsGuideTime)/1000)+'s';
                    }else{
                        longtou.style.transitionDuration=(1200/1000)+'s';
                    }
                }
                var dy=to[1]-from[1];
                var dx=to[0]-from[0];
                var deg=Math.atan(Math.abs(dy)/Math.abs(dx))/Math.PI*180;
                if(dx>=0){
                    if(dy<=0){
                        deg+=90;
                    }
                    else{
                        deg=90-deg;
                    }
                }
                else{
                    if(dy<=0){
                        deg=270-deg;
                    }
                    else{
                        deg+=270;
                    }
                }
                if(drag){
                    node.style.transform='rotate('+(-deg)+'deg)';
                    node.style.height=get.xyDistance(from,to)+'px';
            
                    longtou.style.transform='rotate('+(-deg)+'deg)';
                    longtou.style.opacity=0.7;
                }
                else{
                    node.style.transform='rotate('+(-deg)+'deg) scaleY(0)';
                    node.style.height=get.xyDistance(from,to)+'px';
            
                    longtou.style.transform='rotate('+(-deg)+'deg) translate(0,0)';
                    if(game.chess){
                        ui.chess.appendChild(node);
                        ui.chess.appendChild(longtou);
                    }
                    else{
                        ui.arena.appendChild(node);
                        ui.arena.appendChild(longtou);
                    }
                    ui.refresh(node);
                    node.show();
                    node.style.transform='rotate('+(-deg)+'deg) scaleY(1)';
                    ui.refresh(longtou);
                    longtou.show();
                    longtou.style.transform='rotate('+(-deg)+'deg) translate(0,'+get.xyDistance(from,to)+'px)';
                    longtou.style.opacity=0.7;
                    node.listenTransition(function(){
                        setTimeout(function(){
                            if(node.classList.contains('removing')) return;
                            node.delete();
                        },total/3);
                    });
                    longtou.listenTransition(function(){
                        //setTimeout(function(){
                            if(longtou.classList.contains('removing')) return;
                            longtou.delete();
                        //},total/3);
                    });
                }
                return node;
            };
            //借鉴了极光的扩展OL，以及玄武江湖。
            //玉龙指示线
            game.zsyulongLineXy=function(path){
                var from=[path[0],path[1]];
                var to=[path[2],path[3]];
                if(game.chess){
                    game.zsPlayLineAnimation('yulongLineXy',ui.chess,false,[from,to]);
                }else{
                    game.zsPlayLineAnimation('yulongLineXy',ui.arena,false,[from,to]);
                };
             };
            //经典指示线
            game.zsjingdianLineXy=function(path){
                var from=[path[0],path[1]];
                var to=[path[2],path[3]];
                if(game.chess){
                    game.zsPlayLineAnimation('jingdianLineXy',ui.chess,false,[from,to]);
                }else{
                    game.zsPlayLineAnimation('jingdianLineXy',ui.arena,false,[from,to]);
                };
             };
            //暴击指示线
            game.zsbaojiLineXy=function(path){
                var from=[path[0],path[1]];
                var to=[path[2],path[3]];
                if(game.chess){
                    game.zsPlayLineAnimation('baojilinexy',ui.chess,false,[from,to]);
                }else{
                    game.zsPlayLineAnimation('baojilinexy',ui.arena,false,[from,to]);
                };
            };
            
            if(lib.config.zuanzhishixian && lib.config.zuanzhishixian !== 'moren'){
                game.saveConfig('extension_十周年UI_playerLineEffect', false);
                if (window.decadeUI) decadeUI.config.playerLineEffect = false;
                game.linexy = game['zs'+lib.config.zuanzhishixian+'LineXy'];
            }
        
          game.saveConfig('zuanzhishixian',lib.config['extension_指示线_zhishixian']);
                    game.saveConfig('extension_十周年UI_playerLineEffect', lib.config['extension_指示线_zhishixian']);
                    if (window.decadeUI) decadeUI.config.playerLineEffect = lib.config['extension_指示线_zhishixian'];
                    if(lib.config['extension_指示线_zhishixian'] == 'moren'){
                        game.linexy = game.zsOriginLineXy;
                    }else{
                        game.linexy = game['zs'+lib.config['extension_指示线_zhishixian']+'LineXy'];
                    }
    // ---------------------------------------指示线------------------------------------------//

    // ---------------------------------------指示线确认------------------------------------------//
            lib.skill._zuanattacklinecheck={
                            trigger:{
                                global:['gameDrawBefore'],
                                player:"enterGame",
                            },
                            direct:true,
                            priority:105,
                            filter:function(event,player){
                                 return player==game.me;
                            },
                            content:function(){
game.saveConfig('zuanzhishixian',lib.config['extension_指示线_zhishixian']);
                    game.saveConfig('extension_十周年UI_playerLineEffect', lib.config['extension_指示线_zhishixian']);
                    if (window.decadeUI) decadeUI.config.playerLineEffect = lib.config['extension_指示线_zhishixian'];
                    if(lib.config['extension_指示线_zhishixian'] == 'moren'){
                        game.linexy = game.zsOriginLineXy;
                    }else{
                        game.linexy = game['zs'+lib.config['extension_指示线_zhishixian']+'LineXy'];
                    }
                },
            }
    // ---------------------------------------指示线确认------------------------------------------//

},precontent:function (){
    window.alive = function (name, time, arena) {
        if (arena) ui.arena.hide();
        game.addVideo('playerfocus2');
        game.broadcastAll(function () {
            ui.arena.classList.add('playerfocus');
            setTimeout(function () {
                ui.arena.classList.remove('playerfocus');
            }, time * 1000);
        });
        game.delay(time);
        ui.background.style.filter = '';
        ui.background.style.webkitFilter = '';
        ui.background.style.transform = '';
        ui.background.setBackgroundImage(name);
        setTimeout(function () {
            if (lib.config.image_background_blur) {
                ui.background.style.filter = 'blur(8px)';
                ui.background.style.webkitFilter = 'blur(8px)';
                ui.background.style.transform = 'scale(1.05)';
            }
            ui.arena.show();
            ui.background.setBackgroundImage('image/background/' + lib.config.image_background + '.jpg');
        }, time * 1000);
    };

    var style = document.createElement('style');
                style.innerHTML = "@keyframes fairy{"
                for (var i = 1; i <= 20; i++) {
                    var rand1 = Math.floor(Math.random() * 255), rand2 = Math.floor(Math.random() * 255),
                        rand3 = Math.floor(Math.random() * 255), rand4 = Math.random();
                    style.innerHTML += i * 5 + '%{text-shadow: black 0 0 1px,rgba(' + rand1 + ', ' + rand2 + ', ' + rand3 + ', 0.6) 0 0 2px,rgba(' + rand1 + ', ' + rand2 + ', ' + rand3 + ', 0.6) 0 0 5px,rgba(' + rand1 + ', ' + rand2 + ', ' + rand3 + ', 0.6) 0 0 10px,rgba(' + rand1 + ', ' + rand2 + ', ' + rand3 + ', 0.6) 0 0 10px,rgba(' + rand1 + ', ' + rand2 + ', ' + rand3 + ', 0.6) 0 0 20px,rgba(' + rand1 + ', ' + rand2 + ', ' + rand3 + ', 0.6) 0 0 20px}';
                }
                style.innerHTML += "}";
                document.head.appendChild(style);
},config:{
    // ---------------------------------------按钮开关------------------------------------------//
            zhishixian:{
                "name":"攻击指示特效",
                intro:"设置卡牌、技能的指示特效",
                init:lib.config.zuanzhishixian === undefined ? 'moren':lib.config.zuanzhishixian,
                item:{
                    "yulong":"玉龙指示线",
                    "jingdian":"经典指示线",
                },
                onclick:function(item){
                    if(item.indexOf('next_')!=-1) {
                        var items=item.slice(5);
                    }else {
                        var items=item;
                    }
                    var value = !items || items == 'moren';
                    game.saveConfig('extension_指示线_zhishixian',items);
                    game.saveConfig('zuanzhishixian',items);
                    game.saveConfig('extension_十周年UI_playerLineEffect', value);
                    if (window.decadeUI) decadeUI.config.playerLineEffect = value;
                    if(items == 'moren'){
                        game.linexy = game.zsOriginLineXy;
                    }else{
                        game.linexy = game['zs'+items+'LineXy'];
                    }
                    
                }
            }
},package:{
    intro:"",
    author:"",
    diskURL:"",
    forumURL:"",
    version:"1.0",
}}})
