/**
 * 链式操作器
 */
class Linker{
	constructor(type,config){
		const me = this;
		let p;
		switch(type){
			case 'ajax':  //单个ajax
				p = me.ajax(config);
				break;
			case 'getfiles': //ajax get 多个文件
				p = me.getfiles(config);
				break;
			case 'dolist': 	//同步操作组
				if(arguments.length === 3){
					p = me.dolist(arguments[1],0,arguments[2]);
				}else{
					p = me.dolist(arguments[1],0);		
				}
				
		}
		return p;
	}

	/**
	 * ajax 请求
	 * @param config 	url 				请求地址
	 *					reqType 			请求类型 GET(默认) POST
	 *					params 				参数，json格式
	 *					async 				异步，默认true
	 *  				timeout 			超时时间
	 *					withCredentials 	同源策略，跨域时cookie保存，默认false
	 * 					
	 */
	ajax(config){
		return new Promise((resolve,reject)=>{
			//随机数
	        if(config.rand){  //针对数据部分，仅在app中使用
	            config.params = config.params || {};
	            config.params.$rand = Math.random();
	        }
	        let url = config.url;
	        const async = config.async===false?false:true;
			const req = new XMLHttpRequest();
		    //设置同源策略
		    req.withCredentials = config.withCredentials;
		    //类型默认为get
		    const reqType = config.reqType||'GET';
		    //超时，同步时不能设置
		    req.timeout = async?config.timeout:0;
		    
		    req.onload = ()=>{
		    	if(req.status === 200){
		    		let r = req.responseText;
			    	if(config.type === 'json'){
	                    try{
	                        r = JSON.parse(r);
	                    }catch(e){
	                        reject({type:"jsonparse"});
	                    }
	                }
	                resolve(r);
		    	}else{
		    		reject({type:'error',url:url});
		    	}
		    }

            req.ontimeout = () => reject({type:'timeout'});
	        req.onerror = () => reject({type:'error',url:url});
			
		    switch(reqType){
	            case 'GET':
	                //参数
	                let pa;
	                if(nodom.isObject(config.params)){
	                    let ar = [];
	                    nodom.getOwnProps(config.params).forEach(function(key){
	                        ar.push(key + '=' + config.params[key]);
	                    });
	                    pa = ar.join('&');
	                }
	                if(pa !== undefined){
	                    if(url.indexOf('?') !== -1){
	                        url += '&' + pa;
	                    }else{
	                        url += '?' + pa;
	                    }
					}
	                req.open(reqType,url,async,config.user,config.pwd);
	                req.send(null);
	                break;
	            case 'POST':
	                let fd = new FormData();
	                for(let o in config.params){
	                    fd.append(o,config.params[o]);
					}
					req.open(reqType,url,async,config.user,config.pwd);
	                req.send(fd);
	                break;
	        }
	    }).catch((re)=>{
			console.log(re);
	    	switch(re.type){
	    		case "error":
	    			throw Error.handle("notexist1",nodom.words.resource,re.url);
	    		case "timeout":
	    			throw Error.handle("timeout");
	    		case "jsonparse":
	    			throw Error.handle("jsonparse");
	    	}
	    });
	}

	/**
	 * 通过get获取多个文件
	 */
	getfiles(urls){
		let promises = [];
		urls.forEach((url)=>{
			promises.push(new Promise((resolve,reject)=>{
				const req = new XMLHttpRequest();
		    	req.onload = () => resolve(req.responseText);
			    req.onerror = () => reject(url);
			    req.open("GET", url);
			    req.send();
			}));
		});

		return Promise.all(promises).catch((text)=>{
			throw Error.handle("notexist1",nodom.words.resource,text);
		});
	}

	/**
	 * 同步顺序执行
	 * @param funcArr 	函数数组
	 * @param index 	当前index	
	 * @param paramArr 	参数数组
	 * @return 			promise对象
	 */
	dolist(funcArr,index,paramArr){
		const me = this;
		return foo(funcArr,index,paramArr);
	
		function foo(fa,i,pa){
			if(fa.length === 0){
				return Promise.resolve();
			}else{
				return new Promise((resolve,reject)=>{
					if(pa !== null || pa !== undefined){
						fa[i](resolve,reject,pa[i]);
					}else{
						fa[i](resolve,reject);	
					}
				}).then((success)=>{
					if(i<fa.length-1){
						return foo(fa,i+1,pa);
					}
				});	
			}
		}
	}	
}