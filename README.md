nodom2
#### 介绍
nodom是一个前端mvvm框架，于2017年发布版本1.0，经过几个webapp开发后，综合使用过程中的问题，
现升级为2.0，用ES6进行了重新架构，主要区别如下:
1. 转json格式的虚拟dom;
2. class抽取；
3. 增加工厂的使用；
4. 简化view结构；
5. 简化model结构；
6. 取消插件，统一为自定义指令；
7. 增加对象的序列化和反序列化，便于对象存储和还原，也会更好支持预编译功能；（实现中）
8. 增加工作流引擎，降低页面间耦合度（实现中）。

使用方式和nodom1相似，取消了DD命名空间，全部改为nodom。

#### 文件结构说明
nodom2核心文件在js目录下，core目录存放原始文件，bin目录存放合并文件；examples存放例子文件（持续更新中）

#### 文件说明
1. base.js: 					nodom基础类，用于提供基础方法集
2. class.js: 					主要模拟java class类，用于类的实例化，主要用于反序列化
3. compiler.js:				编译类，用于编译html串
4. config.js: 					基础配置
5. directive.js: 				指令类
6. directivefactory.js: 		指令工厂，用于管理指令实例 	
7. directivemanager.js: 		指令管理器，用于管理指令类型
8. element.js: 				虚拟dom类
9. error.js: 					异常处理类
10. exprssion.js: 				表达式类
11. expressionfactory.js: 		指令工厂类，用于管理表达式实例
12. factory.js: 				工厂基类
13. filter.js: 					过滤器类
14. filterfactory.js: 			过滤器工厂类，用于管理过滤器实例
15. filtermanager.js: 			过滤器管理器，用于管理过滤器类型
16. linker: 					链式操作器，包括ajax，ajax get多个文件，异步操作串行执行
17. messagefactory.js: 			消息工厂，用于消息收发
18. methodfactory.js: 			方法工厂，每个模块一个
19. model.js: 					数据模型
20. modelfactory.js: 			模型工厂，用于管理数据模型实例
21. module.js: 					模块类
22. modulefactory.js: 			模块工厂，用于管理模块实例
23. renderer.js: 				渲染器
24. router.js: 					路由器
25. scheduler.js: 				调度器类

26. extend/classinit.js: 		类初始化，为反序列化服务
27. extend/directiveinit.js: 	指令类型初始化
28. extend/exposemethods: 		以nodom命名空间暴露的方法
29. filterinit.js: 				过滤器类型初始化 	

30. locales 					国际化支持

#### 使用说明
请参考examples目录


#### 参与贡献



