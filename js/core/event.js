/**
 * @description 事件类
 * @author      yanglei
 * @since       1.0
 */
 /**
  * 事件分为自有事件和代理事件
  * 自有事件绑定在view上
  * 代理事件绑定在父view上，存储于事件对象的events数组中
  * 如果所绑定对象已存在该事件名对应的事件，如果是代理事件，则添加到子事件队列，否则替换view自有事件
  * 事件执行顺序，先执行代理事件，再执行自有事件
  */
class Event{
    /**
     * @param eventName     事件名
     * @param eventStr      事件串(可空) 方法名[:delg(代理到父对象):nopopo(禁止冒泡):once(只执行一次):useCapture]
     */
    constructor(eventName,eventStr){
        const me = this;
        me.events = undefined;  //子事件，存储代理事件集合，结构为{'click':[ev1,ev2],'swipe':[],...}
        me.name = eventName;

        //如果事件串不为空，则不需要处理
        if(eventStr){
            eventStr.split(':').forEach((item,i)=>{
                item = item.trim();
                if(i===0){    //事件方法
                    me.handler = item;
                }else{              //事件附加参数
                    me[item] = true;
                }
            });
        }
        //触屏事件根据设备类型进行处理
        if(nodom.config.deviceType === 1){ //触屏设备
            switch(me.name){
                case 'click':
                    me.name = 'tap';
                    break;
                case 'mousedown':
                    me.name = 'touchstart';
                    break;
                case 'mouseup':
                    me.name = 'touchend';
                    break;
                case 'mousemove':
                    me.name = 'touchmove';
                    break;
            }
        }else{  //转非触屏
            switch(me.name){
                case 'tap':
                    me.name = 'click';
                    break;
                case 'touchstart':
                    me.name = 'mousedown';
                    break;
                case 'touchend':
                    me.name = 'mouseup';
                    break;
                case 'touchmove':
                    me.name = 'mousemove';
                    break;
            }
        }

    }

    /**
     * 事件触发
     * @param e         事件
     */
    fire(e){
        const me = this;
        const module = ModuleFactory.get(me.moduleName);
        const dom = module.renderTree.query(me.domKey);
        if(!module.hasContainer()){
            return;
        }
        const el = module.container.querySelector("[key='" + me.domKey + "']");
        const model = module.modelFactory.get(dom.modelId);
        //如果capture为true，则先执行自有事件，再执行代理事件，否则反之
        if(me.capture){
            handleSelf(e,model,module,el);
            handleDelg(e,model,module,el);
        }else{
            if(handleDelg(e,model,module,el)){
                handleSelf(e,model,module,el);
            }
        }

        //判断是否清除事件
        if(me.events !== undefined && me.events[me.name].length === 0 && me.handler === undefined){
            if(ExternalEvent.TouchEvents[me.name]){
                ExternalEvent.unregist(me,el);
            }else{
                if(el !== null){
                    el.removeEventListener(me.name,me.handleEvent); 
                }
            }
        }

        /**
         * 处理自有事件
         * @param model     模型
         * @param e         事件
         * @param module    模块
         * @param el        事件element
         */
        function handleDelg(e,model,module,el){
            //代理事件执行
            if(me.events === undefined){
                return true;
            }
            let arr = me.events[me.name];
            if(nodom.isArray(arr)){
                if(arr.length > 0){
                    for(let i=0;i<arr.length;i++){
                        // 找到对应的子事件执行
                        if(arr[i].el && arr[i].el.contains(e.target)){
                            //执行
                            arr[i].fire(e);
                            //执行一次，需要移除
                            if(arr[i].once){
                                me.removeSubEvt(arr[i]);
                            }
                            //禁止冒泡
                            if(arr[i].nopopo){
                                return false;
                            }
                        }
                    }    
                }else{ //删除该事件
                    me.events.delete(me.name);
                }
            }
            return true;
        }

        /**
         * 处理自有事件
         * @param model     模型
         * @param e         事件
         * @param module    模块
         * @param el        事件element
         */
        function handleSelf(e,model,module,el){
            let foo = module.methodFactory.get(me.handler);
            //自有事件
            if(nodom.isFunction(foo)){
                //禁止冒泡
                if(me.nopopo){
                    e.stopPropagation();
                }
                nodom.apply(foo,model,[e,module,el,dom]);
                //事件只执行一次，则删除handler
                if(me.once){  
                    delete me.handler;
                }
            }
        }
    }
        
    /**
     * 绑定事件
     * @param module    模块
     * @param vdom      虚拟dom
     * @param el        element
     
     */
    bind(module,vdom,el){
        const me = this;
        me.domKey = vdom.key;
        me.moduleName = module.name;
        //触屏事件
        if(ExternalEvent.TouchEvents[me.name]){
            ExternalEvent.regist(me,el,module,vdom);
        }else{
            me.handleEvent = function(e){
                me.fire(e);
            }
            el.addEventListener(me.name,me.handleEvent,me.capture);
        }
    }

    /**
     * 
     * 事件代理到父对象
     * @param parent    父虚拟dom
     * @param el        事件作用的html element 
     * @param model     模型
     * @param module    模块
     */
    delegateTo(module,vdom,el,parent,parentEl){
        const me = this;
        me.domKey = vdom.key;
        me.moduleName = module.name;

        //如果不存在父对象，则用body
        if(!parentEl){
            parentEl = document.body;
        }

        //父节点如果没有这个事件，则新建，否则直接指向父节点相应事件
        if(!parent.events[me.name]){
            let ev = new Event(me.name);
            ev.bind(module,parent,parentEl);
            parent.events[me.name] = ev;
        }

        parent.events[me.name].addSubEvt(me);
    }

    /**
     * 添加子事件
     * @param ev    事件
     */
    addSubEvt(ev){
        const me = this;
        if(!me.events){
            me.events = Object.create(null);
        }
        
        //事件类型对应的数组
        if(!me.events[me.name]){
            me.events[me.name] = new Array();
        }
        me.events[me.name].push(ev);
    }

    /**
     * 移除子事件
     * @param ev    子事件
     */
    removeSubEvt(ev){
        const me = this;
        if(me.events === undefined || me.events[ev.name] === undefined){
            return;
        }
        let ind = me.events[ev.name].indexOf(ev);
        if(ind !== -1){
            me.events[ev.name].splice(ind,1);
            if(me.events[ev.name].length === 0){
                me.events.delete(ev.name);
            }
        }
    }

    clone(){
        const me = this;
        let evt = new Event(me.name);
        let arr = ['delg','once','nopopo','useCapture','handler','handleEvent','module'];
        arr.forEach((item)=>{
            evt[item] = me[item];
        });
        return evt;
    }
}

/****************扩展事件*********************/


class ExternalEvent{
    /**
     * 注册事件
     * @param evtObj    event对象
     */
    static regist(evtObj,el){
        let evt = ExternalEvent.TouchEvents[evtObj.name];
        //如果绑定了，需要解绑
        if(!nodom.isEmpty(evtObj.touchListeners)){
            ExternalEvent.unregist(evtObj);
        }
        
        if(!el){
            const module = ModuleFactory.get(evtObj.moduleName);
            el = module.container.querySelector("[key='" + evtObj.domKey + "']");    
        }

        // el不存在
        evtObj.touchListeners = {};
        if(evt && el !== null){
            // console.log(el);
            // 绑定事件组
            nodom.getOwnProps(evt).forEach(function(ev){
                //先记录下事件，为之后释放
                evtObj.touchListeners[ev] = function(e){
                    evt[ev](e,evtObj);
                }
                el.addEventListener(ev,evtObj.touchListeners[ev],evtObj.capture);
            });
        }
    }

    /**
     * 取消已注册事件
     * @param evtObj    event对象
     */
    static unregist(evtObj,el){
        let evt = nodom.Event.TouchEvents[evtObj.eventName];
        if(!el){
            const module = ModuleFactory.get(evtObj.moduleName);
            el = module.container.querySelector("[key='" + evtObj.domKey + "']");
        }
        if(evt){
            // 解绑事件
            if(el !== null){
                nodom.getOwnProps(evtObj.touchListeners).forEach(function(ev){
                    el.removeEventListener(ev,evtObj.touchListeners[ev]);
                });    
            }
        }  
    }

}

/**
 * 触屏事件
 */

ExternalEvent.TouchEvents = {
    tap:{
        touchstart:function(e,evtObj){
            let tch = e.touches[0];
            evtObj.extParams={
                pos : {sx:tch.pageX,sy:tch.pageY,t:Date.now()}
            }
        },
        touchmove:function(e,evtObj){
            let pos = evtObj.extParams.pos;
            let tch = e.touches[0];
            let dx = tch.pageX - pos.sx;
            let dy = tch.pageY - pos.sy;
            //判断是否移动
            if(Math.abs(dx) > 5 || Math.abs(dy) > 5){
                pos.move = true;  
            }
        },
        touchend:function(e,evtObj){
            let pos = evtObj.extParams.pos;
            let dt = Date.now() - pos.t;
            //点下时间不超过200ms
            if(pos.move === true || dt > 200){
                return;
            }
            evtObj.fire(e);
        }
    },
    swipe:{
        touchstart:function(e,evtObj){
            let tch = e.touches[0];
            let t = Date.now();
            evtObj.extParams={
                swipe:{
                    oldTime:[t,t],
                    speedLoc:[{x:tch.pageX,y:tch.pageY},{x:tch.pageX,y:tch.pageY}],
                    oldLoc:{x:tch.pageX,y:tch.pageY}
                }
            }
        },
        touchmove:function(e,evtObj){
            let nt = Date.now();
            let tch = e.touches[0];
            let mv = evtObj.extParams['swipe'];
            //50ms记录一次
            if(nt-mv.oldTime > 50){
                mv.speedLoc[0] = {x:mv.speedLoc[1].x,y:mv.speedLoc[1].y};
                mv.speedLoc[1] = {x:tch.pageX, y:tch.pageY};
                mv.oldTime[0] = mv.oldTime[1];
                mv.oldTime[1] = nt;
            }
            mv.oldLoc={x:tch.pageX,y:tch.pageY};
        },
        touchend:function(e,evtObj){
            let mv = evtObj.extParams['swipe'];
            let nt = Date.now();

            //取值序号 0 或 1，默认1，如果释放时间与上次事件太短，则取0
            let ind=(nt-mv.oldTime[1]<30)?0:1;
            let dx = mv.oldLoc.x - mv.speedLoc[ind].x;
            let dy = mv.oldLoc.y - mv.speedLoc[ind].y;
            let s = Math.sqrt(dx*dx + dy*dy);
            let dt = nt - mv.oldTime[ind];
            //超过300ms 不执行事件
            if(dt > 300 || s < 10){
                return;
            }
            let v0 = s/dt;
            //速度>0.1,触发swipe事件
            if(v0 > 0.05){
                let sname = '';
                if(dx<0 && Math.abs(dy/dx)<1){
                    e.v0 = v0;   //添加附加参数到e
                    sname = 'swipeleft';
                }
                if(dx>0 && Math.abs(dy/dx)<1){
                    e.v0 = v0;
                    sname = 'swiperight';
                }
                if(dy>0 && Math.abs(dx/dy)<1){
                    e.v0 = v0;
                    sname = 'swipedown';
                }
                if(dy<0 && Math.abs(dx/dy)<1){
                    e.v0 = v0;
                    sname = 'swipeup';
                }
                if(evtObj.name === sname){
                    evtObj.fire(e);
                }
            }
        }
    }
}

ExternalEvent.TouchEvents['swipeleft'] = ExternalEvent.TouchEvents['swipe'];
ExternalEvent.TouchEvents['swiperight'] = ExternalEvent.TouchEvents['swipe'];
ExternalEvent.TouchEvents['swipeup'] = ExternalEvent.TouchEvents['swipe'];
ExternalEvent.TouchEvents['swipedown'] = ExternalEvent.TouchEvents['swipe'];
    


