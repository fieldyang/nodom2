DirectiveManager.addType('validity',{
    init:(directive,dom,module)=>{
        let ind,fn,method;
        let value = directive.value;
        //处理带自定义校验方法
        if((ind=value.indexOf('|')) !== -1){
            fn = value.substr(0,ind);
            method=value.substr(ind+1);
        }else{
            fn = value;
        }
        directive.value = fn;
        
        directive.params = {
            enabled:false    //不可用
        }
        //如果有方法，则需要存储
        if(method){
            directive.params.method = method;
        }

        //如果没有子节点，添加一个，需要延迟执行
        setTimeout(()=>{
            if(dom.children.length === 0){
                let vd1 = new Element();
                vd1.textContent = '   ';
                dom.children.push(vd1);
            }else{ //子节点
                dom.children.forEach((item)=>{
                    if(item.children.length === 0){
                        let vd1 = new Element();
                        vd1.textContent = '   ';
                        item.children.push(vd1);      
                    }
                })
            }

        },0);

        module.addFirstRenderOperation(function(){
            const m = this;
            const el = module.container.querySelector("[name='" + directive.value + "']");
            if(el){
                //增加事件
                el.addEventListener('focus',function(e){
                    el.canBeValid = true;
                });
                el.addEventListener('blur',function(e){
                    Renderer.add(m);
                });
            }
        });
    },
    
    handle:(directive,dom,module,parent)=>{
        const el = module.container.querySelector("[name='" + directive.value + "']");
        if(!el || !el.canBeValid){
            dom.dontRender = true;
            return;
        }
        
        let chds = [];
        //找到带rel的节点
        dom.children.forEach((item)=>{
            if(item.tagName !== undefined && item.props.hasOwnProperty('rel')){
                chds.push(item);
            }
        });
        
        let resultArr = [];

        //自定义方法校验
        if(directive.params.method){
            const foo = module.methodFactory.get(directive.params.method);
            if(nodom.isFunction(foo)){
                let r = foo.call(module.model,el.value);
                if(!r){
                    resultArr.push('custom');
                }
            }
        }

        let vld = el.validity;
        if(!vld.valid){
            // 查找校验异常属性
            for(var o in vld){
                if(vld[o] === true) {
                    resultArr.push(o);
                }
            }
        }
        if(resultArr.length>0){
            //转换成ref对应值
            let vn = handle(resultArr);
            //单个校验
            if(chds.length === 0){
                setTip(dom,vn,el);
            }else{ //多个校验
                for(let i=0;i<chds.length;i++){
                    let rel = chds[i].props['rel'];
                    if(rel === vn){
                        setTip(chds[i],vn,el);
                    }else{ //隐藏
                        chds[i].dontRender = true;
                    }
                }
            }
        }else{
            dom.dontRender = true;
        }
    

        /**
         * 设置提示
         * @param vd    dom节点
         * @param vn    验证结果名
         */
        function setTip(vd,vn,el){
            //子节点不存在，添加一个
            let text = vd.children[0].textContent.trim();
            if(text === ''){  //没有提示内容，根据类型提示
                text = nodom.compileStr(nodom.FormMsgs[vn],el.getAttribute(vn));
            }
            vd.children[0].textContent = text;
        }

        /**
         * 验证名转换
         */
        function handle(arr){
            for(var i=0;i<arr.length;i++){
                switch(arr[i]){
                    case 'valueMissing':
                        return 'required';
                    case 'typeMismatch':
                        return 'type';
                    case 'tooLong':
                        return 'maxLength';
                    case 'tooShort':
                        return 'minLength';
                    case 'rangeUnderflow':
                        return 'min';
                    case 'rangeOverflow':
                        return 'max';
                    case 'patternMismatch':
                        return 'pattern';
                    default:
                        return arr[i];
                }
            }
        }
    }
});
