
/**
 * 指令名 model
 * 描述：模型
 */

/**
 *    每个指令类型都有一个init和handle方法，init和handle都可选
 *    init 方法在编译时执行，包含一个参数 directive 指令，无返回
 *    handle方法在渲染时执行，包含三个参数 directive 指令  vdom 虚拟dom  parent父对象(可选)
 *    return true/false false则不进行后面的所有渲染工作
 */ 

DirectiveManager.addType('model',{
    prio:1,
    init:(directive,dom,module)=>{
        let value = directive.value;

        if(nodom.isEmpty(value)){
            throw Error.handle("paramException","x-model");
        }
        
        //处理以.分割的字段，没有就是一个
        let arr = new Array();
        value.split('.').forEach((item)=>{  
            let ind1 = -1,ind2 = -1;
            if((ind1 = item.indexOf('[')) !== -1 && (ind2 = item.indexOf(']')) !== -1){ //数组
                let fn = item.substr(0,ind1);
                let index = item.substring(ind1+1,ind2);
                arr.push(fn + ',' + index);
            }else{ //普通字符串
                arr.push(item);
            }
        });
        directive.value = arr;

    },

    handle:(directive,dom,module,parent)=>{
        let model = module.modelFactory.get(dom.modelId);
        if(!model || !model.data){
            return;
        }
        let data = model.data;
        directive.value.forEach((item)=>{
            if(!data){
                return;
            }
            if(item.indexOf(',') !== -1){   //处理数组
                let a = item.split(',');
                data = data[a[0]][parseInt(a[1])];    
            }else{                          //非数组
                
                data = data[item];
            }
        });
        if(data){
            dom.modelId = data.$modelId;    
        }
        return true;
    }
});

/**
 * 指令名 repeat
 * 描述：重复指令
 */
DirectiveManager.addType('repeat',{
    prio:2,
    init:(directive,dom,module)=>{
        let value = directive.value;
        if(!value){
            throw Error.handle("paramException","x-repeat");
        }
        
        let ind,filter,modelName;
        //过滤器
        if((ind=value.indexOf('|')) !== -1){
            modelName = value.substr(0,ind).trim();
            directive.filter = new Filter(value.substr(ind+1));
        }else{
            modelName = value;
        }

        // 增加model指令
        let dir1 = new Directive('model',modelName,dom);
        dom.directives.unshift(dir1);
        directive.value = modelName;
    },
    handle:(directive,dom,module,parent)=>{
        let modelFac = module.modelFactory;

        let rows = modelFac.get(dom.modelId).data;

        //有过滤器，处理数据集合
        if(directive.filter !== undefined){
            rows = directive.filter.exec(rows,module);
        }
        

        // 无数据，不渲染
        if(rows === undefined || rows.length === 0){
            dom.dontRender = true;
            return true;
        }

        let chds = [];
        let key = dom.key;
        
        // 移除指令
        dom.removeDirectives(['model','repeat']);
        
        for(let i=0;i<rows.length;i++){
            let node = dom.clone(module);
            //设置modelId
            node.modelId = rows[i].$modelId;
            //设置key
            setKey(node,key,node.modelId);
            rows[i].$index = i;
            chds.push(node);     
        }
        

        //找到并追加到dom后
        if(chds.length > 0){
            for(let i=0,len=parent.children.length;i<len;i++){
                if(parent.children[i] === dom){
                    chds = [i+1,0].concat(chds);
                    Array.prototype.splice.apply(parent.children,chds);
                    break;
                }
            }
        }
        
        // 不渲染该节点
        dom.dontRender = true;
        // return true;
        return false;

        function setKey(node,key,id){
            node.key = key + '_' + id;
            node.children.forEach((dom)=>{
                setKey(dom,dom.key,id);
            });
        }
    }
});

/**
 * 指令名 if
 * 描述：条件指令
 */
DirectiveManager.addType('if',{
    init:(directive,dom,module)=>{
        let value = directive.value;
        if(!value){
            throw Error.handle("paramException","x-repeat");
        }
        //value为一个表达式
        let expr = new Expression(value,module);
        directive.value = expr;
    },
    handle:(directive,dom,module,parent)=>{
        //设置forceRender
        let model = module.modelFactory.get(dom.modelId);
        let v = directive.value.val(model);
        //找到并存储if和else在父对象中的位置
        let indif=-1,indelse=-1; 
        for(let i=0;i<parent.children.length;i++){
            if(parent.children[i] === dom){
                indif = i;
            }else if(indelse === -1 && parent.children[i].hasDirective('else')){
                indelse = i;
            }
            
            //if后的第一个element带else才算，否则不算
            if(i !== indif && indif !== -1 && indelse === -1 && parent.children[i].tagName !== undefined){
                indelse = -2;
            }
            
            //都找到了
            if(indif !== -1 && indelse !== -1){
                break;
            }
        }
        if(v && v !== 'false'){ //为真
            let ind = 0;
            //删除else
            if(indelse > 0){
                parent.children[indelse].dontRender = true;
            }
        }else if(indelse>0){    //为假则进入else渲染
            //替换if
            dom.dontRender = true;
        }
        return true;
    }

});

/**
 * 指令名 else
 * 描述：else指令
 */
DirectiveManager.addType('else',{
    name:'else',
    init:(directive,dom,module)=>{
        return;
    },
    handle:(directive,dom,module,parent)=>{
        return;
    }
});

/**
 * 指令名 show
 * 描述：显示指令
 */
DirectiveManager.addType('show',{
    init:(directive,dom,module)=>{
        let value = directive.value;
        if(!value){
            throw Error.handle("paramException","x-show");
        }
        //value为一个表达式
        let expr = new Expression(value,module);
        directive.value = expr;
    },
    handle:(directive,dom,module,parent)=>{
        //设置forceRender
        let model = module.modelFactory.get(dom.modelId);
        let v = directive.value.val(model);
        
        // 获取style属性数组
        let arr = dom.style?dom.style.split(';'):[];
        let find = false;
        let show = v && v !== 'false'? 'visible':'hidden';
        
        for(let i=0;i<arr.length;i++){
            if(arr[i].indexOf('visibility')){
                find = true;
                arr[i] = 'visibility:' + show;
                break;
            }
        }
        if(!find){
            arr.push('visibility:' + show);
        }
        //组合style属性
        dom.props['style'] = arr.join(';');
    }
});

/**
 * 指令名 class
 * 描述：class指令
 */
DirectiveManager.addType('class',{
    init:(directive,dom,module)=>{
        //转换为json数据
        let obj = eval('(' + directive.value + ')');
        if(!nodom.isObject(obj)){
            return;
        }
        let robj = {};
        nodom.getOwnProps(obj).forEach(function(key){
            if(nodom.isString(obj[key])){
                //如果是字符串，转换为表达式
                robj[key] = new Expression(obj[key],module);
            }else{
                robj[key] = obj[key];
            }
        });
        directive.value = robj;
    },
    handle:(directive,dom,module,parent)=>{
        let obj = directive.value;
        let clsArr = [];
        let cls = dom.props['class'];
        let model = module.modelFactory.get(dom.modelId);
        if(nodom.isString(cls) && !nodom.isEmpty(cls)){
            clsArr = cls.trim().split(/\s+/);
        }

        nodom.getOwnProps(obj).forEach(function(key){
            let r = obj[key];
            // console.log(r);
            if(r instanceof Expression){
                r = r.val(model);
            }
            let ind = clsArr.indexOf(key);
            // console.log(r,dom);
            if(!r || r === 'false'){
                //移除class
                if(ind !== -1){
                    clsArr.splice(ind,1);
                }
            }else if(ind === -1){ //添加class
                clsArr.push(key);
            }
        });
        //刷新dom的class
        dom.props['class'] = clsArr.join(' ');
    }
});

/**
 * 指令名 field
 * 描述：字段指令
 */
DirectiveManager.addType('field',{
    init:(directive,dom,module)=>{
        // 带过滤器情况
        let dv = directive.value;
        let field = dv;
        let tgname = dom.tagName.toLowerCase();
        let type = dom.props['type'];
        let eventName = 'input';
        if(tgname === 'input' && (type === 'checkbox' || type === 'radio')){
            eventName = 'change';
        }

        //增加name和value属性，属性可能在后面，需要延迟处理
        setTimeout(()=>{
            //增加name属性
            if(!dom.props.hasOwnProperty('name')){
              dom.props['name'] = field;
            }

            //增加value属性
            if(!dom.exprProps.hasOwnProperty('value') && !dom.props.hasOwnProperty('value')){
                dom.exprProps['value'] = new Expression(field,module);
            }    
        },0);
        

        //增加自定义方法
        let method = '$nodomGenMethod' + nodom.genId();
        module.methodFactory.add(method,
            function(e,view,module,dom){
                let type = dom.props['type'];
                let model = module.modelFactory.get(dom.modelId);
                let field = dom.getDirective('field').value;
                let fv = model.data[field];
                let v = view.value;
                //根据选中状态设置checkbox的value
                if(type === 'checkbox'){
                    if(dom.props['yes-value'] == v){
                        v = dom.props['no-value'];
                    }else{
                        v = dom.props['yes-value'];
                    }
                }else if(type === 'radio'){
                    if(!view.checked){
                        v = undefined;
                    }
                }
                //修改字段值
                this.data[field] = v;
                //修改value值，该节点不重新渲染
                if(type !== 'radio'){
                    dom.props['value'] = v;
                    view.value = v;
                }
            }
        );
        //追加事件
        dom.events[eventName] = new Event(eventName,method);
    },

    handle:(directive,dom,module,parent)=>{
        let type = dom.props['type'];
        let tgname = dom.tagName.toLowerCase();

        if(type !== 'radio' && type !== 'checkbox' && tgname !== 'select'){
            return;
        }

        let model = module.modelFactory.get(dom.modelId);
        let dataValue = model.data[directive.value];
        let value = dom.props['value'];
            
        if(type === 'radio'){
            if(dataValue == value){
                dom.props['checked'] = 'checked';
            }else{
                delete dom.props['checked'];
            }
        }else if(type === 'checkbox'){
            //设置状态和value
            let yv = dom.props['yes-value'];
            //当前值为yes-value
            if(dataValue == yv){
                dom.props['checked'] = 'checked';
                dom.props['value'] = yv;
            }else{ //当前值为no-value
                delete dom.props['checked'];
                dom.props['value'] = dom.props['no-value'];
            }
        }else if(tgname === 'select'){ //下拉框
            dom.props['value'] = dataValue;
            //option可能没生成，延迟赋值
            setTimeout(function(){
                module.container.querySelector("[key='"+ dom.key +"']").value = dataValue;
            },0);
        }
    }
});

/**
 * 指令名 validity
 * 描述：字段指令
 */
DirectiveManager.addType('validity',{
    init:(directive,dom,module)=>{
        var ind,fn=value,method;
        //处理带自定义校验方法
        if((ind=value.indexOf('|')) !== -1){
            fn = value.substr(0,ind);
            method=value.substr(ind+1);
        }

        directive.value = fn;
        //如果有方法，则需要存储
        directive.method = method;
        //需要找到form

    },
    
    handle:(directive,dom,module,parent)=>{
        //首次渲染不处理
        if(module.firstRender){
            return;
        }
        
        function valid(fieldName){
            let form = module.container.querySelector("[key='" + directive.form + "']");
            let el = form.querySelector("[name='" + fieldName + "']");
            if(el === null){
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
            if(directive.method){
                var foo = module.methodFactory.get(directive.method);
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
                let vn = handle(validArr);
                //单个校验
                if(chds.length === 0){
                    let rel = dom.props['ref'];
                    if(rel === vn){
                        setTip(dom,vn);
                    }else{  //隐藏
                        dom.dontRender = true;
                    }
                }else{ //多个校验
                    for(let i=0;i<chds.length;i++){
                        let rel = chds[i].props['ref'];
                        if(rel === vn){
                            setTip(chds[i],vn);
                        }else{ //隐藏
                            chds[i].dontRender = true;
                        }   
                    }
                }
            }
    
        }


        /**
         * 设置提示
         * @param vd    dom节点
         * @param vn    验证结果名
         */
        function setTip(vd,vn){
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
                }
            }
        }
    }
});