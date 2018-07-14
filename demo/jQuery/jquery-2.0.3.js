/*!
 * jQuery JavaScript Library v2.0.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-07-03T13:30Z
 */
/**
 * 1.	为什么要将 window 作为实参传入，再函数中直接访问 window 不可以吗？
 * 		访问全局变量的速度会比访问局部变量的速度慢，因为局部变量是存储在栈中的。这样做的原因就是优化访问 window 的速度
 * 2.	undefined 变量的作用？
 * 		undefined 在某些浏览器下可以被修改，例如 var undefined = 10; 
 * 		在某些浏览器下，此时 undefined 就是 10 了，而不再是本身的 undefined 值了
 * 		这样做可以防止其他人修改 undefined 的值，如果有人在其他 js 文件修改了 undefined 的值，那么在 jquery 文件中是不受影响的
 */

(function( window, undefined ) {

// Can't do this because several apps including ASP.NET trace
// the stack via arguments.caller.callee and Firefox dies if
// you try to trace through "use strict" call chains. (#13335)
// Support: Firefox 18+
//"use strict";
var
	// A central reference to the root jQuery(document)
	rootjQuery,

	// The deferred used on DOM ready
	readyList,

	// Support: IE9
	// For `typeof xmlNode.method` instead of `xmlNode.method !== undefined`
	/**
	 * 在一些低版本的 IE 中，如果直接使用 a === undefined 判断可能是无法成功判断的，但是如果使用
	 * typeof a === 'undefined' 来判断是绝对没有问题的
	 */
	core_strundefined = typeof undefined,	

	// Use the correct document accordingly with window argument (sandbox)
	// 优化访问速度和压缩
	location = window.location,
	document = window.document,
	docElem = document.documentElement,

	// 以下两个变量是专门用于解决变量名冲突的解决手段，如果不冲突的情况下，这两个值都是 undefined
	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,
	
	// Map over the $ in case of overwrite
	_$ = window.$,

	// 这个变量用于类型判断，用于工具方法 $.type() 判断一个实例的类型
	// 该变量最终的被存储为 { '[object String]': 'string', '[object Array]': 'array' } 的形式
	// [[Class]] -> type pairs
	class2type = {},

	// 用于数据缓存，但是在 2.X 版本中，数据缓存已经改写为面向对象的写法了，这个变量也就没什么用了，下面通过这个数组实例获取到一些方法的引用
	// List of deleted data cache ids, so we can reuse them
	core_deletedIds = [],

	core_version = "2.0.3",

	// 保存一些方法的引用，可以优化访问速度和压缩
	core_concat 	= core_deletedIds.concat,
	core_push 		= core_deletedIds.push,
	core_slice 		= core_deletedIds.slice,
	core_indexOf 	= core_deletedIds.indexOf,
	core_toString 	= class2type.toString,
	core_hasOwn 	= class2type.hasOwnProperty,	// 判断一个属性是否属于实例本身，不会从原型上判断
	core_trim 		= core_version.trim,

	// 定义 jQuery 函数，通过 window.jQuery = jQuery 暴露
	jQuery = function( selector, context ) {
		// 注释1
		// 返回一个 jQuery 的对象
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	/**
	 * 	数字正则，包括正负数、小数点、科学计数法
	 * 		1.	有零个或一个 +、-
	 * 		2.	(有零个或多个数字，并且还有一个点)，或者 (什么都没有)
	 * 		3.	最少一个数字
	 * 		4.	(有 e 或 E，零或一个 +、-，最少一个数字) 或者什么都没有
	 */
	core_pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,

	/**
	 * 非空格正则
	 * 		除了空格以外的所有字符
	 */
	core_rnotwhite = /\S+/g,

	/**
	 * 	匹配 HTML 标签以及 id 选择器的正则
	 * 		1.	这个正则有两个子项：(<[\w\w]+>) 和 ([\w-]*)
	 * 		2.	有零个或多个空格
	 * 		3.	< (\w 或者 \W)最少一个 >
	 * 		4.	除了 > 之外的任意字符，零个以上，用来匹配类似于 <input>内容 这样的形式
	 * 		5.	id 选择器：#(\w或者-)零个以上
	 */
	rquickExpr = /^(?:\s*(<[\w\w]+>)[^>]*|#([\w-]*))$/,

	/**
	 * 	匹配单独的 HTML 标签，其中没有内容
	 * 		以 &lt; 开头，最少一个 \w，紧跟零个或多个个空格，然后紧跟 /&gt;
	 * 		然后再跟 %lt/&gt，其中括号的内容就是前面 (\w+) 的内容，也有可能什么都不跟
	 * 		\1 \2 类似于这种正则，指的是：在整个正则表达式中，从左往右第 1 个、第 2 个 () 中的内容
	 * 		其中，\/? 中的 ? 是惰性模式，匹配到后取最少的个数为结果
	 */
	rsingleTag = /^<(\w+)\s*\ ?="">(?:<\ \1="">|)$/,

	/**
	 * 	匹配前缀
	 * 		在非 ie 下，例如 Chrome，它的前缀值 -webkit，此时，C3 的属性 -webkit-transition 会转换为 webkitTransition
	 * 		在 ie 下，它的前缀是 —ms，C3 的前缀 -ms-transition 会转换为 MsTransition
	 * 	rdashAlpha 用于匹配类似于 -size、-2d、-3d 这样的形式
	 */
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	/**
	 * 	将 CSS 中含有 - 的样式名转换为驼峰的回调
	 * 	@param { String } all 	 rdashAlpha 正则匹配到的部分，例如 margin-left 就是 -l
	 * 	@param { String } letter all 的部分中，第一个子项，也就是 - 后面的字符
	 */
	fcamelCase = function( all, letter ) {
		// 将 letter 转成大写，并返回以替代 all
		return letter.toUpperCase();
	},

	// DOM 加载完之后的回调
	// The ready event handler and self cleanup method
	completed = function() {
		document.removeEventListener( "DOMContentLoaded", completed, false );
		window.removeEventListener( "load", completed, false );
		jQuery.ready();
	};

jQuery.fn = jQuery.prototype = {
	jquery: core_version,	// jQuery 当前版本
	constructor: jQuery,	// 修改 constructor 的指向

	// 注释2
	/**
	 * @param { String | Object | Function } selector	选择器，可能是字符串、DOM、函数
	 * @param { Object }					 context	上下文，可能是 document、属性对象
	 * @param { Object } 					 rootjQuery jQ 对象，该对象默认被初始化为 $(document)
	 */
	init: function( selector, context, rootjQuery ) {
		var match, elem;

		/**
		 * 第一部分
		 * 排除选择器为 空字符串、null、undefined、false 这些情况，此时会返回 jQuery.prototype
		 */
		if ( !selector ) {
			return this;
		}

		/**
		 * 第二部分
		 * 判断选择器是否是字符串
		 */
		if ( typeof selector === "string" ) {
			/**
			 * 2.1 判断选择器的首尾是否是 <> 并且选择器的长度最少要 3 个字符，即最少也要是 <a> 这种情况
			 *     这种情况是为了创建 HTML 标签
			 *     如果满足这个条件，将 match 赋值一个新的数组，将第 1 个元素的值赋为 selector，第 0 个和第 3 个赋值为 null，这是模拟正则 exec 的返回值
			 */
			if ( selector.charAt(0) === "<" 1="" &&="" selector.charat(="" selector.length="" -="" )="==" "="">" && selector.length >= 3 ) {
				match = [ null, selector, null ];
			} 

			/**
			 * 2.2 如果没有 2.1 的情况，那就不是创建 HTML 标签，此时会有以下几种情况：CSS 选择器、单标签带内容，例如
			 *     $('.box') $('#box') $('#box li') $('div') 
			 *     $('&lt;<input>&gt;hello') 这种情况和 $('&lt;<input>&gt;') 是一模一样的
			 *     此时，这几种情况用 rquickExpr 正则匹配，这个正则匹配的就是 HTML 标签和 CSS 的 id 选额器，如果 selector 中不含有 id 选择器 和 HTML 标签，那么 match 就是 null
			 *     如果含有 id 选择器，那么 match 就类似于这种形式：[ '#box', null, 'box' ]
			 *     如果含有 HTML 元素，那么 match 就类似于这种形式：[ '<input>OK', '<input>', null ]
 			 */
			else {
				match = rquickExpr.exec( selector );
			}

			/**
			 * 	2.3 判断 match 的值
			 * 		match 为 null：只有当 selector 中匹配不到 rquickExpr 正则的时候，既不是 HTML 标签也不是 id 选择器
			 * 		match 不为 null：当 selector 是 HTML 标签或者 id 选择器
			 * 		match[1] 为 true：只有 selector 是一个 HTML 标签，即新创建 HTML 标签，进入 if
			 * 		match[1] 为 false： selector 是一个 id 选择器，根据 context 来决定是进入 if 还是 else
			 */
			if ( match && (match[1] || !context) ) {
				/**
				 *  2.3.1 如果 selector 中是 HTML 标签，则进入 if
				 *  此时 match 的内容形如 [ '<div>', '<div>', null ]
				 */
				if ( match[1] ) {
					/**
					 * 2.3.1.1 
					 * 判断 context 是否是 jQ 对象，如果是，取出索引为 0 的 DOM 元素；如果不是，直接使用
					 * 在创建新的 HTML 元素时，可以为其指定一个 document，这样，可以在不同的 document 下创建标签，常用在 iframe 下
					 */
					context = context instanceof jQuery ? context[0] : context;

					/**
					 * 2.3.1.2
					 * 将 HTML 标签转换为数组，然后通过 jQuert.merge 方法与当前 jQ 对象合并
					 */
					jQuery.merge( this, jQuery.parseHTML(
						match[1],
						context && context.nodeType ? context.ownerDocument || context : document,
						true
					) );

					/**
					 * 2.3.1.3
					 * 处理创建标签时附加的属性，例如 ('<li>', { class: 'box' })
					 *     判断 HTML 标签是否是一个空标签并且 context 是否是字面量对象（ 即使用 {} 或者 new Object() 创建的对象 ）
					 */
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						for ( match in context ) {
							/**
							 * 如果满足上面的条件，就遍历 context 对象
							 *     如果当前属性存在对应的方法，就调用该方法进行设置，jQuery.isFunction 方法用于判断参数是否是一个函数
							 *     如果不存在对应的方法，就调用 attr 方法设置属性
							 *     例如：$('</li><li>', { html: 'test', title: '标题' })
							 *         设置 html 时，调用 this.html() 方法设置
							 *         设置 title 时，调用 this.attr() 方法设置
							 */
							if ( jQuery.isFunction( this[ match ] ) ) {
								this[ match ]( context[ match ] );
							} else {
								this.attr( match, context[ match ] );
							}
						}
					}

					/**
					 * 2.3.1.4 返回当前的 jQ 对象
					 */
					return this;
				} 
				/**
				 *  2.3.2 如果 selector 中不是 HTML 标签，而是 id 选择器，则进入 else
				 */
				else {
					/**
					 * 2.3.2.1 
					 *     根据 id 获取到 DOM 元素
					 *     此时 match 的 形式就如 [ '#div', undefined, 'div' ] 这样，match[2] 就是 id
					 */
					elem = document.getElementById( match[2] );
					
					/**
					 * 2.3.2.2 
					 *     判断根据 id 取到的 DOM 元素是否存在
					 *     之所以还要判断 elem 的父节点是否存在，是因为，在黑莓 4.6 以下的浏览器中，判断一个 DOM 元素是否存在，仅仅判断其本身是否存在是不够的，可能会出现 DOM 节点不存在页面中，但是还是可以获取到其值的这种情况
					 *     所以，不仅需要判断 elem 是否存在，还需要判断它的父节点是否存在；如果一个元素在页面上，必然会有父节点
					 */
					if ( elem && elem.parentNode ) {
						/**
						 * 如果该 DOM 元素确实存在，就将当前 jQ 对象的 length 设置为 1，第 0 属性的值设置为该 DOM 对象
						 * 并且将当前 jQ 对象的第 0 属性的值设置为该 DOM 对象
						 */
						this.length = 1;
						this[0] = elem;
					}

					/**
					 * 2.3.2.3
					 * 将当前 jQ 对象的 context 属性设置为 document
					 * 将当前 jQ 对象的 selector 属性设置为参数选择器
					 */
					this.context = document;
					this.selector = selector;

					/**
					 * 2.3.2.3
					 * 返回当前的 jQ 对象
					 */
					return this;
				}
			} 

			/**
			 * 	2.4	如果不是 HTML 标签或者 id 选择器，那么只能是 CSS 选择器，再判断是否提供了 context 参数
			 * 		如果没有提供 context，进入 else if，调用 find() 进行选择元素
			 * 		如果有，再判断其是否是 jQ 对象
			 * 			如果是 jQ 对象，进入 else if，调用 find() 进行选择元素
			 * 			如果不是，进入 else，调用 find() 进行选择元素
			 * 			
			 *      else if 和 else 做的是相同的事，都是通过 find 方法来查询 selector
			 *      如果没有提供 context，就从 $(document) 中查找，如果有，再将其转换为 jQ 对象（ 如果本来就是 jQ 对象就不用转换 ），再从指定的 context 中查找
			 */
			else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );
			} else {
				return this.constructor( context ).find( selector );
			}
		} 
		/**
		 * 第三部分
		 * 处理 selector 为 DOM 元素，类似于 $(document)
		 *       如果选择器中含有 nodeType 属性，就说明是 DOM 节点
		 *           元素节点  -> 1
		 *           文本节点  -> 3
		 *           document -> 9
 		 */
		else if ( selector.nodeType ) {
			/**
			 * 如果 selector 是 DOM 元素的话，就将当前 jQ 对象的 0 属性设置为该 DOM 元素并且将当前 jQ 对象的 length 设置为 1
			 * 节点也不存在上下文，所以上下文就是自身
			 * 最后直接返回当前 jQ 对象
			 */
			this.context = this[0] = selector;
			this.length = 1;
			return this;
		} 
		/**
		 * 第四部分
		 * 处理 selector 为函数
		 * 		当 selector 为函数时，实际上该函数就是 DOM 加载的回调
		 * 
		 * 		jQ 中加载 DOM 的回调有以下几种形式
		 * 		$(document).ready( function () {} )
		 * 		$().ready( function () {} )
		 * 		$( function () {} )	 这种写法就是处理 selector 为函数时的写法，此时，会将其转换为 $(document).ready( selector )，和第一种是一样的
		 */
		else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		/**
		 * 5. 再判断 selector 是否是 jQ 对象，判断其是否含有 selector 属性，如果有（ 就是 jQ 对象 ），则进入 if
		 * 		可能会有这样的写法：$( $('#div') )，此时 selector 就是 jQ 对象，含有 selector 属性
		 */
		if ( selector.selector !== undefined ) {
			// 5.1	将 selector jQ 对象的 selector 属性赋给当前 jQ 对象的 selector 属性
			// 5.2	将 selector jQ 对象的 context  属性赋给当前 jQ 对象的 context 属性
			this.selector = selector.selector;
			this.context = selector.context;
		}
		/**
		 *  如果 selector 既不是字符串，也不是 DOM，也不是函数，此时它可以是 对象（ jQ对象 ），数组等，此时调用
		 * 	makeArray 方法，该方法接受一个参数时，将参数转换为 数组，接受两个参数时，将参数合并为一个 json 对象
		 * 	所以此时，如果 selector 只是 对象或数组，就将 selector 与 当前 jQ 对象合并
		 */
		return jQuery.makeArray( selector, this );
	},

	// 存取当前选择的字符串，默认是空
	selector: "",

	// jQ 对象的 length 长度属性，默认是 0
	length: 0,

	// 将当前的 jQ 对象转换为数组，实例方法
	toArray: function() {
		// 通过 Array.prototype.slice 方法将类数组转换为数组
		// slice 方法用于浅拷贝一个数组的部分元素，如果不指定起始位置和结束位置，那么就拷贝的是整个数组，在将 slice 的操作对象改为当前的 jQ 对象，就可将类数组抓换为数组了
		return core_slice.call( this );
	},

	/**
	 * 用于获取原生的 DOM 对象或原生 DOM 对象的集合
	 * @param { Number } num 指定索引，返回指定索引的原生 DOM 元素；如果不指定，则将当前的 jQ 对象转换为数组并返回
	 */
	get: function( num ) {
		// 1. 判断是否提供了 num 参数
		return num == null ?
			// 1.1 如果没传递 num，则将当前的 jQ 对象转换为数组
			this.toArray() :
			// 1.2 如果传递了 num，则根据 num 值返回指定的原生 DOM 元素
			/**
			 * 此时会判断 num 是正数还是负数
			 * 		如果是正数，则直接获取 num 对应的索引值
			 * 		如果是负数，则从尾部开始获取 num 对应的索引值，-1 代表最后一个，-2 代表倒数第二个；通过 legnth + num（负数）来获取索引
			 */
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	/**
	 * 入栈方法
	 * @param { Object } elems 入栈的元素，可以是 jQ 对象，原生 DOM 的集合
	 * 该方法模拟一个栈，实现将 elems 压入到栈顶，this 作为次栈顶
	 * 实际上该方法并没有操作任何的栈或者数组，只是模拟了一个栈，这个栈并不存在
	 * 通过这个方法将 elems 压入栈顶，然后返回栈顶的 jQ 对象
	 */
	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems ) {
		console.log( elems )
		// 1. 将一个空的 jQ 对象和 elems 合并
		var ret = jQuery.merge( this.constructor(), elems );
		console.log( ret )
		// 2. 将当前的 jQ 对象作为待入栈对象的一个属性，该属性保存当前 jQ 对象的引用
		ret.prevObject = this;
		// 3. 将当前的 jQ 对象的上下文作为带入栈的一个属性
		ret.context = this.context;
		// 4. 返回带入栈的对象（ 栈顶对象 ）
		return ret;
	},

	/**
	 * 循环 jQ 对象每个属性的方法，该方法调用了工具方法 each
	 * @param { Function } 	callback 回调
	 * @param { Object } 	args 	 参数
	 */
	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	/**
	 * DOM 加载
	 * @param { Function } fn 回调
	 */
	ready: function( fn ) {
		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	},

	/**
	 * 截取 jQ 对象的部分属性
	 * 该方法将截取当前对象的部分转换为数组，在通过 pushStack 方法压入栈中，最终返回截取出的 jQ 对象
	 */
	slice: function() {
		return this.pushStack( core_slice.apply( this, arguments ) );
	},

	/**
	 * 获取当前 jQ 对象索引为 0 的元素
	 * 该方法内部通过 eq 方法实现，所以返回的是位于栈顶索引为 0 的元素
	 */
	first: function() {
		return this.eq( 0 );
	},

	/**
	 * 获取当前 jQ 对象索引为 length-1 的元素
	 * 该方法内部通过 eq 方法实现，所以返回的是位于栈顶索引为 length-1（ -1 ） 的元素
	 */
	last: function() {
		return this.eq( -1 );
	},

	/**
	 * 根据索引 i 获取对应的值，该方法会返回对应索引值的 jQ 对象
	 * @param { Number } i 索引值，可正可负，也可为字符串数字
	 */
	eq: function( i ) {
		// 1. 先获取当前 jQ 对象的长度
		// 2. 判断索引 i 是大于 0 还是小于 0，如果是大于 0，那么将索引 i + 0，即不变；如果是小于 0，那么将素索引 i + length，就能获得正负数下对应的索引
		var len = this.length,
			j = +i + ( i < 0 ? len : 0 );
		// 3. 判断索引 j 是否在 0 到 长度之间，如果满足，则将当前 jQ 对象中索引为 j 的属性值入栈；否则将一个空数组入栈
		return this.pushStack( j >= 0 && j < len ? [ this[j] ] : [] );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	/**
	 * 该方法返回的是次栈顶的元素，栈内每个元素都有一个 prevObject 属性，该属性保存的是次栈顶元素的引用
	 * 如果没有 prevObject 属性，则意味着当前元素位于栈底，返回 jQuery.prototype
	 */
	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// 以下方法只在 jQuery 内部使用
	// Behaves like an Array's method, not like a jQuery method.
	push: core_push,	// Array.prototype.push
	sort: [].sort,		// Array.prototype.sort
	splice: [].splice	// Array.prototype.splcie
};

// 将 jQuery 中 init 构造方法的原型指向了 jQuery 的原型，这样，通过 init 构造函数实例化的对象，就可以访问 jQuery 原型中的方法了
jQuery.fn.init.prototype = jQuery.fn;

// 注释3，继承
/**
 * @param  {  }
 * @return {[type]} [description]
 */
jQuery.extend = jQuery.fn.extend = function() {
	var options, 						// 循环保存每个参数的引用，如果第一个参数为布尔值，那么久从第二个参数开始保存
		name, 
		src, 
		copy, 
		copyIsArray, 		
		clone,
		target = arguments[0] || {},	// 将第一个参数作为目标对象
		i = 1,							// 循环变量，此时设置为 1，原因有两个，1、是因为之后会和参数的个数比较是否相等，如果相等，就是插件，如果不相等，就是拷贝；2、如果是拷贝的话，那么之后遍历每个参数就会跳过第一个参数，从第二个参数开始遍历了
		length = arguments.length,		// 参数的个数
		deep = false;					// 是否是深拷贝，默认为 false

	/**
	 * 	1. 	处理提供深浅拷贝布尔值的情况
	 * 		先判断目标对象是否是布尔值
	 * 			如果是布尔值，说明指定了深拷贝（ true ） 或者浅拷贝（ false ）
	 * 				此时先将布尔值保存在 deep 中，然后将 target 保存第二个参数的引用，如果没有下一个参数（ 例如示例4 ），就保存一个空对象的引用
	 * 				然后将循环变量保存为 2，因为第一个是布尔值，第二个是目标对象，所以从第三个参数开始遍历
	 */
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		i = 2;
	}

	/**
	 * 	2.	判断参数是否正确，如果参数不正确，就将目标对象设置为空对象
	 * 		参数只能是对象或者函数
	 */
	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	/**
	 * 	3.	判断是否是插件的情况，此时只能有一个参数
	 */
	if ( length === i ) {
		/**
		 * 	如果是添加新的工具方法，那么就将 target 保存为 jQuery 类的引用
		 * 	如果是添加新的实例方法，那么就将 target 保存为当前的 jQ 实例对象的引用
		 * 	然后将循环 i 减 1 变为 0，用于之后只进行一次循环
		 */
		target = this;
		--i;
	}

	/**
	 * 	4.	遍历参数，进行不同的拷贝
	 */
	for ( ; i < length; i++ ) {
		/**
		 * 	如果是插件的话，options 保存的就是唯一参数的引用，然后 options 是否有效（ 即不是 null 或者 undefined ）
		 * 	如果是浅拷贝的话
		 * 		如果没有提供是否是深浅拷贝的布尔值，参考示例2，那么此时循环变量 i 是 1，所以会跳过第一个参数，从第二个开始遍历
		 * 		如果提供是否是深浅拷贝的布尔值为 false，参考示例3，那么此时循环变量 i 是 2，所以会跳过前两个参数，从第三个开始遍历
		 * 	如果是深拷贝的话
		 * 		此时循环变量就是 2，所以跳过前两个参数，从第三个参数开始遍历
		 */
		if ( (options = arguments[ i ]) != null ) {
			/**
			 * 	遍历当前参数的每个属性
			 * 	src 变量保存的是在目标对象中，以当前属性 name 为键的值的引用，如果不存在就是 undefined
			 * 	copy 变量保存的是在当前参数对象中，以当前属性 name 为键的值的引用
			 */
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				/**
				 * 	如果 目标元素 和 copy 指向同一块内存，则退出当前循环，防止循环引用
				 * 	let obj = { name: 'IconMan' };
				 * 	$.extend( obj, { name: obj } );
				 * 	如果不退出，此时就会出现循环引用，这样做的结果就是 obj 的结果如下
				 * 	{
				 * 		name: {
				 * 			name: {
				 * 				name: {
				 * 					name: ...
				 * 				}
				 * 			}
				 * 		}
				 * 	}
				 */
				if ( target === copy ) {
					// continue;
				}

				/**
				 * 	判断是深拷贝还是浅拷贝
				 * 	如果是插件的话，deep 的值为 false，直接进入 else，只要 copy 有效，就在目标对象中（ jQuery 或者当前 jQ 实例 ）添加一个以 name 属性，并保存 copy 的引用
				 * 	如果是浅拷贝的话，deep 的值为 false，直接进入 else，只要 copy 有效，就在目标对象中（ 第一个参数 ）添加一个以 name 属性，并保存 copy 的引用
				 * 	如果是深拷贝，deep 的值为 true，再判断 copy 的值是否存在以及 copy 是否是对象或者数组，如果都满足，进入 if
				 */
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					// console.log( copy );
					/**
					 * 	处理 copy 是数组的情况
					 * 	先将保存 copy 是否是数组的布尔值置为 false，以确保下次循环不会出错
					 * 	如果在目标对象中存在当前的 name 属性并且其值也是一个数组，那么 clone 就保存的是 src 所指向的数组的引用
					 * 	如果在目标对象中不存在当前的 name 属性，或者存在但其并不是一个数组，那么 clone 就保存一个新的空数组的引用
					 */
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];
					} 
					/**
					 * 	处理 copy 是 json 对象的情况
					 * 	如果在目标对象中存在当前的 name 属性并且也是一个 json，那么 clone 就保存的是 src 所指向的对象的引用
					 * 	如果在目标对象中不存在当前的 name 属性，或者存在但其并不是一个 json 对象，那么 clone 就保存的是新的对象的引用
					 */
					else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}
					/**
					 * 	递归调用 extend 方法，并进行深拷贝
					 * 		此时，deep 的值为 true，肯定是深拷贝
					 * 		clone 的值分为两种
					 * 			1、目标对象中存在 name 属性并且和 copy 属于同一类型，此时 clone 指向的是目标对象中的 name 属性的值
					 * 			2、目标对象中不存在 name 属性，此时 clone 指向的是一个新的数组或 json 对象
					 * 		通过递归调用 extend 方法，最终将所有的引用类型都转换为了基本类型的赋值
					 */
					target[ name ] = jQuery.extend( deep, clone, copy );
				} 
				/**
				 * 	浅拷贝
				 * 	先判断当前循环参数的值是否是 undefined，如果不是
				 * 	直接将当前循环参数的值赋给目标对象的同名参数（ 如果 copy 是引用类型，仅仅拷贝指针，即浅拷贝 ）
				 */
				else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// 	5.	返回目标对象
	return target;
};

// 扩展工具方法
jQuery.extend({
	/**
	 * 生成一个唯一的字符串
	 * 格式是 " jQuery + 版本号 + 随机的小数 "，并且将其中的非数字，例如小数点替换为空字符串
	 * 例如：jQuery20306758780764383274
	 */
	expando: "jQuery" + ( core_version + Math.random() ).replace( /\D/g, "" ),

	/**
	 * 	将 $ 或者 jQuery 构造函数的控制权交出去（ 即用别的变量代替 $ 或者 jQuery ），交出去后，$ 或者 jQuery 就无法再使用了
	 * 	防止 $ 符号与其他的库起冲突，因为 $ 符号不仅仅是 jQuery 在使用，其他的库有可能也会用
	 * 	@param 	{ Boolean } deep 	是否移交 jQuery 的控制权
	 * 	@return { Function }		jQuery 构造函数
	 */
	noConflict: function( deep ) {
		/**
		 * 	_$ 和 _jQuery 的值
		 * 	如果在引入当前文件之前，没有修改 window.$ 和 window.jQuery 指向的话，那么 _$ 和 _jQuery 就是 undefined 了
		 *	如果在引入当前文件之前修改了 window.$ 和 window.jQuery 的指向，那么 _$ 和 _jQuery 就指向的是修改的那个对象了
		 */
		/**
		 * 	处理 $ 的控制权
		 * 	判断 window.$ 是否等于 jQuery
		 * 		如果在之前没有修改 $ 的指向，那么条件为 true，进入 if，此时将 _$（ undefined ） 赋值给 window.$，即执行该方法之后，window.$ 就指向了 undefined
		 * 		如果之前修改了 $ 的指向，那么条件就为 false，不会进入 if，保持原样
		 */
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		/**
		 * 	处理 jQuery 的控制权，如果要处理 jQuery 的控制权，那么 deep 参数必须为 true
		 * 	判断 window.jQuery 是否等于 jQuery
		 * 		如果在之前没有修改 jQuery 的指向，那么条件为 true，进入 if，此时将 _jQuery（ undefined ） 赋值给 window.jQuery，即执行该方法之后，window.jQuery 就指向了 undefined
		 * 		如果之前修改了 $ 的指向，那么条件就为 false，不会进入 if，保持原样
		 */
		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		// 直接返回 jQuery 对象，这样，可以将接受该方法的变量指向 jQuery 函数，所以可以用新的变量来代替 jQuery
		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	},

	/**
	 * 	判断一个对象是否是函数
	 * 	自从 1.3 版本之后，对于一些 DOM 方法和原生的函数，例如 alert 是检测不出来的，在一些低版本的 IE 浏览器中，检测出来的是 object 而非 function。(#2968)
	 * 	@param 	{ Any } 	obj 	待判断的对象
	 * 	@return { Boolean }			obj 是否是函数的布尔值
	 */
	isFunction: function( obj ) {
		// 通过 $.type 工具方法来检测是否等于 function
		return jQuery.type(obj) === "function";
	},

	/**
	 * 	判断一个对象是否数组
	 * 	通过 ES5 的 Array.isArray 方法
	 */
	isArray: Array.isArray,

	/**
	 * 	判断一个对象是否是 window
	 * 	@param 	{ Any }		obj 	待判断的对象
	 * 	@return { Boolean }			obj 是否是 window 的布尔值
	 */
	isWindow: function( obj ) {
		// 首先判断 obj 如果不是 null 和 undefined，再判断其下面是否有 window 属性，只有 window 全局对象才会有 window 属性
		return obj != null && obj === obj.window;
	},

	/**
	 * 	判断一个对象是否是有效数字
	 * 	@param 	{ Any } 	obj 	待判断的对象
	 * 	@return { Boolean }			obj 是否是有效数值的布尔值
	 */
	isNumeric: function( obj ) {
		/**
		 * 	首先通过 parseFloat 方法判断 obj 是否可以转换为数值，如果可以那么就返回对应的数值；如果不可以返回 NaN
		 * 	再通过 isNaN 方法判断返回的结果是否是 NaN	
		 * 		如果是，则说明 obj 不是数值，直接返回 false
		 * 		如果不是，则说明 obj 是数值，再通过 isFinite 方法判断该数值是否在数值的范围内
		 *
		 * 	为什么不直接使用 typeof 来判断，因为如果用 typeof 来判断 NaN 的话，那么得到的还是 number，这和我们想得到的结果不同
		 */
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

	/**
	 * 	判断 obj 对象的数据类型
	 * 	@param  { Any } 	obj 待判断的对象
	 * 	@return { String } 		obj 以字符串形式表示的数据类型
	 */
	type: function( obj ) {
		//	1.	先判断 obj 是否是 undefined 或者 null，如果是的话，直接通过 String 构造函数将 null 和 undefined 转换为字符串形式的 null 和 undefined
		if ( obj == null ) {
			return String( obj );
		}
		/**
		 * 	2.	通过 typeof 来判断 obj 是否是 object 或者 function，因为只有这两种情况下，obj 才是引用类型
		 * 			如果不满足，就是原始数据类型，可以直接使用 typeof 的返回值
		 * 			如果满足，利用 Object.prototype.toString 方法，将 obj 转换为类似于 [ object Object ] 的形式，再从 class2type 对象中，查找该形式属性的值，直接返回；如果没有，则返回 object
		 * 		此时，class2type 对象的内容如下
		 * 		{
		 * 			[object Array]: 	'array',
		 * 			[object Boolean]: 	'boolean',
		 * 			[object Date]: 		'date',
		 * 			[object Error]: 	'error',
		 * 			[object Function]: 	'function',
		 * 			[object Number]: 	'number',
		 * 			[object Object]: 	'object',
		 * 			[object RegExp]: 	'regexp',
		 * 			[object String]: 	'string'
		 * 		}
		 */
		return typeof obj === "object" || typeof obj === "function" 
			? class2type[ core_toString.call(obj) ] || "object" 
			: typeof obj;

		/**
		 * 	在 Safari 低版本中，使用 typeof 判断 RegExp 对象，会得到 function 而非 object，
		 * 	但是在 jQuery 中的 type 工具方法兼容了这个问题
		 */
	},

	/**
	 * 	判断一个对象是否是字面量对象（ 原型直接继承 Object.prototype ）
	 * 	只有以下两种情况创建的对象是字面量对象
	 * 		使用对象字面量语法：{  }
	 * 		使用 Object 类实例的对象：new Object()
	 * 
	 * 	其他对象，例如：DOM 节点、window、调用 toString 的返回值不是 [object Object] 的对象，都不属于字面量对象
	 * 	@param  { Any } 	obj 待判断的对象
	 * 	@return { Boolean } 	表示 obj 是否是字面量对象的布尔值
	 */
	isPlainObject: function( obj ) {
		/**
		 * 	1.	先通过工具方法 type 判断 obj 的类型是否不等于 object
		 * 		或者 obj 有 nodeType 属性（ DOM 节点 ）
		 * 		或者 obj 是 window
		 * 		满足三者之一的，直接返回 false，不是字面量对象
		 */
		if ( jQuery.type( obj ) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		/**
		 * 	2.	判断 obj 的 constructor 是否存在
		 * 		通过 hasOwnProperty 方法判断 obj 构造函数的原型是否有 isPrototypeOf 属性，该方法只会查找实例本身的属性（ 包括实例属性和其原型上的属性 ）而不会查找其继承而来的属性
		 * 		所以如果该isProperty 属性存在，那就说明 obj 是接继承 Object.prototype 的，直接跳出 if
		 * 		如果不存在该属性，那就说明 obj 不是直接继承 Object.prototype 的，那么直接返回 false
		 * 
		 * 		在 FireFox 20 以下，如果多次访问 window.location.constructor 会抛出异常，所以使用 try...catch 进行容错
		 */
		try {
			if ( obj.constructor && !core_hasOwn.call( obj.constructor.prototype, "isPrototypeOf" ) ) {
				return false;
			}
		} catch ( e ) {
			return false;
		}

		// 3. 经过上面的筛选，如果都满足，那么就是对象字面量了，直接返回 true
		return true;
	},

	/**
	 * 	判断一个对象是否是空对象（ 没有任何可枚举属性就是空对象 ）
	 * 	@param  { Any } 	obj 待判断的对象
	 * 	@return { Boolean } 	obj 是否是空对象的布尔值
	 */
	isEmptyObject: function( obj ) {
		/**
		 * 	1.	使用 for...in 循环遍历 obj，
		 * 		如果 obj 存在属性，那么会进入 for 循环，直接返回 false；
		 * 		如果 obj 不出在属性，就不会进入 for，直接返回 true
		 * 		之所以使用 for...in 循环是因为 for...in 可以遍历到可枚举的属性，这样，不管 obj 存在实例属性还是继承的属性。只要是可枚举的，都可以遍历到
		 * 
		 * 	2. 	如果没有遍历到，说明 obj 中（ 包括实例属性和原型中的属性 ）没有可枚举的属性，它就是一个空对象，直接返回 true
		 */
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	/**
	 * 	抛出异常方法
	 * 	@param { String } msg 错误信息
	 */
	error: function( msg ) {
		throw new Error( msg );
	},

	/**
	 * @param { String }  data 			HTML 字符串
	 * @param { Object }  context 		新创建的 HTML 标签所在的 document
	 * @param { Boolean } keepScripts 	是否可以创建 script 标签，默认为 false
	 */
	// data: string of html
	// context (optional): If specified, the fragment will be created in this context, defaults to document
	// keepScripts (optional): If true, will include scripts passed in the html string
	parseHTML: function( data, context, keepScripts ) {
		/**
		 * 1. 判断是否提供了 data 参数，如果没有提供，直接退出
		 *    如果提供的 data 参数不是 String 类型的，也会直接退出
		 */
		if ( !data || typeof data !== "string" ) {
			return null;
		}

		/**
		 * 2.  判断 context 的类型是否是 Boolean 
		 *         如果是，则意味着此时 context 的意义就是 是否可以创建 script 标签，将 context 的值赋给 keepScripts
		 *         并将 context 的值设置为 false
		 */
		if ( typeof context === "boolean" ) {
			keepScripts = context;
			context = false;
		}

		/**
		 * 3.  如果提供了 context，那么就直接将 context 的值保存
		 *     如果没提供，或者第二个参数是布尔值的话，那么就将默认的 document 赋给 context
		 */
		context = context || document;

		var parsed = rsingleTag.exec( data ),
			scripts = !keepScripts && [];

		/**
		 * 4.  如果 data 是一个没有内容的 HTML 标签，那么直接返回一个数组，其中的元素是根据 data 新创建的 DOM 元素
		 *     此时，parsed 的形式就如 [ '<a></a>', 'a' ] 这样
		 */
		if ( parsed ) {
			return [ context.createElement( parsed[1] ) ];
		}

		parsed = jQuery.buildFragment( [ data ], context, scripts );

		if ( scripts ) {
			jQuery( scripts ).remove();
		}

		return jQuery.merge( [], parsed.childNodes );
	},

	/**
	 * 	解析为 JSON 对象
	 * 	通过 JSON.parse 方法将字符串解析为 JSON 对象
	 * 	ie6、7 不支持该方法
	 */
	parseJSON: JSON.parse,

	// Cross-browser xml parsing
	/**
	 * 	将字符串解析为 XML
	 * 	@param  { String } 	data 解析的字符串
	 * 	@return { Object } 		 解析后的 XML 节点
	 */
	parseXML: function( data ) {
		var xml, tmp;
		if ( !data || typeof data !== "string" ) {
			return null;
		}

		// Support: IE9
		try {
			tmp = new DOMParser();
			xml = tmp.parseFromString( data , "text/xml" );
		} catch ( e ) {
			xml = undefined;
		}

		if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

	/**
	 * 	空函数
	 * 	
	 */
	noop: function() {},

	/**
	 * 	将 JS 代码解析为全局作用域中的代码
	 * 	@param { String } code 要执行的代码
	 * 
	 * 	eval 和 window.eval 是两个不同的函数
	 * 		eval 是 js 的关键字，他可以将参数解析为 js 代码，但是不会解析为全局作用域中变量
	 * 		window.eval 可以将参数解析为 js 代码，并且会解析为全局作用域中的变量
	 * 
	 * 	如果处于严格模式下，在创建 script 标签之后，执行了其中的代码，为什么最后还要将 script 标签移除？
	 * 		JS 代码都是按照块来执行的，每个 script 标签中的 JS 代码执行后，就会在内存中分配地址，此时和 DOM 中的 script 标签完全没有关系了，所以可以删除
	 */
	globalEval: function( code ) {
		var script,				// 在严格模式下保存 script 标签
			indirect = eval;	// 此时，indirect 指向的是 window.eval 方法

		// 1. 将代码的前后空格删掉
		code = jQuery.trim( code );

		// 2. 如果代码存在
		if ( code ) {
			/**
			 * 	2.1	判断代码中是否包含严格模式
			 * 		如果包含严格模式，则新创建 script 标签，并将 代码 设置为 script 的 text 文本属性
			 */
			if ( code.indexOf("use strict") === 1 ) {
				script = document.createElement("script");
				script.text = code;
				document.head.appendChild( script ).parentNode.removeChild( script );
			} 
			/**
			 * 	2.2	如果代码不包含严格模式，则直接使用 window.eval 方法解析代码
			 * 		此时解析的代码就在全局作用域中
			 */
			else {
				indirect( code );
			}
		}
	},

	/**
	 * 	将 CSS 中含有 - 的部分转换为驼峰写法
	 * 	例如：margin-left -> marginLeft
	 * 	在 ie 下，含有前缀的样式名按照如下的方式转换：
	 * 		-ms-transition -> msTransition
	 * 	在非 ie 下，含有前缀的样式名按照如下的方式转换：
	 * 		-moz-transition -> MozTransition
	 * 	@param { String } string 待转换的字符串
	 * 	@return { String } 		转换成功的字符串
	 */
	camelCase: function( string ) {
		/**
		 * 	1. 先用 rmsPrefix 正则将 string 中含有 -ms- 的部分替换为 ms-
		 * 	2. 再用 rdashAlpha 正则将 string 中匹配到的部分调用 fcamelCase 回调返回值进行替换
		 */
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	/**
	 * 	判断一个指定节点的标签名是否等于指定的名称
	 * 	@param  { Object } elem 指定的节点
	 * 	@param  { String } name 指定的名称
	 * 	@return { Boolean } 	该节点的标签名是否等于指定名称的布尔值
	 */
	nodeName: function( elem, name ) {
		/**
		 * 	1.	先判断 elem 是否是一个节点
		 * 		如果是的话，获取该节点的 nodeName 标签名，并转小写，然后与指定的名称参数（ 也转小写 ）进行相等判断
		 * 		之所以都转成小写是因为在不同的浏览器下，标签名可能是大写，也可能是小写的，所以为了统一，一律转换成小写的
		 */
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	/**
	 * 	遍历 json 对象或者数组/类数组
	 * 	@param { Object } 	obj 		待遍历的对象
	 * 	@param { Function } callback 	obj 中每个值都会执行的回调，该回调在外部使用接受两个参数（ 当前的索引和该索对应的值 ）
	 * 	@param { Array } 	args  		只用于 jQ 内部
	 */
	each: function( obj, callback, args ) {
		var value,							// 保存 callback 回调的返回值
			i = 0,							// 循环变量
			length = obj.length,			// obj 的长度，只在 obj 是 数组/类数组下才有值
			isArray = isArraylike( obj );	// 通过 isArraylike 方法判断 obj 是否是一个 数组/类数组，并保存其布尔值

		/**
		 * 	1.	先判断 args 是否存在，如果存在，说明是内部调用了 each，进入 if 
		 */
		if ( args ) {
			// 	1.1 判断 obj 是 json 对象还是 数组/类数组；如果 obj 数组/类数组，进入 if
			if ( isArray ) {
				/**
				 * 	如果是 数组/类数组，使用 for 循环，根据 obj 中的 length 属性遍历每个值
				 * 	通过 apply 方法，将 callback 的作用域指向当前遍历到的对象，并且将参数 args 传递给 callback 作参数
				 * 	并且将 callback 的返回值保存，如果返回值是 false，那么直接结束遍历
				 */
				for ( ; i < length; i++ ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			} 
			// 	2.2 obj 是 json 对象
			else {
				/**
				 * 	和遍历数组一模一样，只不过使用 for...in 循环来遍历
				 * 	通过 apply 方法将 callback 的作用域指向当前遍历的对象，并将参数 args 当做参数传递
				 * 	并且将 callback 的返回值保存，如果返回值是 false，那么直接结束遍历
				 */
				for ( i in obj ) {
					value = callback.apply( obj[ i ], args );

					if ( value === false ) {
						break;
					}
				}
			}
		}
		// 	2. 如果 args 不存在，进入 else，通常我们调用 each 方法就会进入 else，因为 args 只供内部使用
		else {
			// 	2.1 判断 obj 是 json 对象还是 数组/类数组；如果 obj 数组/类数组，进入 if
			if ( isArray ) {
				/**
				 * 	如果是 数组/类数组，使用 for 循环，根据 obj 中的 length 属性遍历每个值
				 * 	通过 call 方法，将 callback 的作用域指向当前遍历到的值，并且将循环变量 i 和 i 所对应的值都传递给 callback 作参数
				 * 	并且将 callback 的返回值保存，如果返回值是 false，那么直接结束遍历
				 */
				for ( ; i < length; i++ ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			} 
			// 	2.2 obj 是 json 对象
			else {
				/**
				 * 	和遍历数组一模一样，只不过使用 for...in 循环来遍历
				 * 	通过 call 方法将 callback 的作用域指向当前遍历的对象，并将索引 i 和 obj[i] 当做参数传递
				 * 	并且将 callback 的返回值保存，如果返回值是 false，那么直接结束遍历
				 */
				for ( i in obj ) {
					value = callback.call( obj[ i ], i, obj[ i ] );

					if ( value === false ) {
						break;
					}
				}
			}
		}

		// 	3.	返回 obj，即第一个参数的引用
		return obj;
	},

	/**
	 * 	去出指定字符串的首尾空格
	 * 	@param 	{ String } text 待处理的字符串
	 * 	@return { String }		处理完成的字符串
	 */
	trim: function( text ) {
		/**
		 * 	先判断 text 是否是 undefined 或者 null
		 * 		如果是，则直接返回空字符串
		 * 		如果不是，调用 String.prototype.trim 方法将 text 的首尾空格去除
		 */		   
		return text == null ? "" : core_trim.call( text );
	},

	/**
	 * 	将类数组、String 实例转换为真正的数组
	 * 	@param 	{ Object | Array | String }	arr		待转换的对象
	 * 	@param  { Array }					results	只共内部使用的对象
	 * 	@return { Array }							转换成功后的数组对象
	 */
	makeArray: function( arr, results ) {
		var ret = results || [];

		/**
		 * 	判断 arr 是否是 undefined 或者 null	
		 * 		如果不是，则通过 isArraylike 方法判断 obj 是否是一个数组/类数组/String 实例的类数组
		 * 		这里将 arr 作为参数传入了构造函数 Object 中，是为了如果 arr 是一个字符串的话，通过 Object 构造函数可以将其转换为 String 的实例，就可以检测其是否属于类数组了
		 * 			如果是的话，通过 merge 方法，将 arr 合并到 ret 中
		 * 				如果 arr 是一个字符串的话，那么将其放入到一个新的数组中，因为 merge 方法的第二个参数必须是一个数组/类数组
		 * 				如果 arr 不是字符串的话，那么就是数组或者类数组了，直接传入 merge 中并合并到 ret 中
		 * 			如果 arr 不满足数组/类数组的条件，那么就通过 Array.prototype.slice 方法将 arr 转换为数组
		 */
		if ( arr != null ) {
			if ( isArraylike( Object(arr) ) ) {
				jQuery.merge( ret,
					typeof arr === "string" ?
					[ arr ] : arr
				);
			} else {
				core_push.call( ret, arr );
			}
		}

		// 返回转换成功后的 ret 数组
		return ret;
	},

	/**
	 * 	搜索 elem 在数组 arr 中的索引
	 * 	@param { Any } elem 要查找到元素
	 * 	@param { Array } arr 从 arr 数组中查找
	 * 	@param { Number } i 开始查找的位置，如果该是大于数组的 length，那么就不会在数组中查找，直接返回 -1
	 */
	inArray: function( elem, arr, i ) {
		// 先判断 arr 是否是 undefined 或者 null，如果是，直接返回 -1；如果不是，再调用 Array.prototype.indexOf 方法搜索
		return arr == null ? -1 : core_indexOf.call( arr, elem, i );
	},

	/**
	 * 	合并对象
	 * 	@param  { Object | Array } 	first  	合并后的对象，必须是数组/类数组
	 * 	@param  { Object } 			second 	将要合并的对象，可以是数组/类数组、也可以是普通的 json 对象
	 * 	@return { Object | Array } 		  	合并后的对象，即第一个参数的引用
	 * 
	 * 	合并后的对象形式都是类似于 { 0: '', 1: '', 2: '', 3: '', length: 4 } 这种类数组的，不会再有其他的形式
	 */
	merge: function( first, second ) {
		var l = second.length,	// 获取第二个参数的 length
			i = first.length,	// 获取第一个参数的 length
			j = 0;				// 循环变量

		/**
		 * 	1. 	判断第二个参数是否含有 length 属性，如果有，说明第二个参数是一个数组/类数组
		 * 		如果有，进入 if
		 * 			通过 for 循环以及第二个参数的 length 来遍历第二个参数，将第一个参数以 length 为索引的元素设置为第二个参数的属性值，然后对第一个参数的 length + 1
		 */
		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}
		} 
		/**
		 * 	2.	如果没有 length 属性，进入 else，说明第二个参数是一个普通的 json 对象
		 * 		通过 while 循环判断第二个参数的每一个元素是否是 undeinfed
		 * 			如果不是，则将第二个参数的每一个元素赋给第一个参数从 length 开始的属性
		 */
		else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		// 3. 将此时循环变量 i 的值赋给第一个参数的 length 属性，此时 i 的值就是第一个参数中元素的个数
		first.length = i;

		// 4. 返回第一个参数的引用
		return first;
	},

	/**
	 * 	过滤数组
	 * 	@param  { Array | Object } 	 elems		待过滤的数组/类数组
	 * 	@param  { Function } callback			过滤回调，即 elems 中的每个元素都会执行该回调，如果回调返回 true，
	 * 	@param  { Boolean }	 inv				是否按照 callback 的相反条件进行过滤	
	 * 	@return { Array }						过滤后的新数组
	 * 
	 * 	$.grep( [1, 2, 3, 4], item => item > 2 )		-> [ 3, 4 ]
	 * 	$.grep( [1, 2, 3, 4], item => item > 2, true )	-> [ 1, 2 ]
	 */
	grep: function( elems, callback, inv ) {
		var retVal,		// 保存回调的返回值，是一个 Boolean
			ret = [],	// 返回的新数组
			i = 0,		// 循环遍历
			length = elems.length;	// 数组的长度

		// 	1. 取得第三个参数的布尔值
		inv = !!inv;

		// 	2. 循环遍历数组
		for ( ; i < length; i++ ) {
			// 	2.1 调用 callback，并将当前遍历的元素和索引当做参数传递，并且将 callback 的返回值进行 Boolean 的转换
			retVal = !!callback( elems[ i ], i );
			/**
			 * 	2.2 判断 callback 的返回值和第三个参数的布尔值是否相等
			 * 		如果满足过滤条件，即 callback 返回 true
			 * 			此时若 inv 为 true，那么直接将不满足过滤条件的元素 push 到新数组中
			 * 			如果 inv 为 false，那么就将满足过滤条件的元素 push 到新数组中
			 * 		如果不满足过滤条件，即 callback 返回 false
			 * 			此时若 inv 为 true，那么直接将满足过滤条件的元素 push 到新数组中
			 * 			如果 inv 为 false，那么就将不满足过滤条件的元素 push 到新数组中
			 * 
			 * 		总的来说，就是判断 callback 的返回值与第三个参数的布尔值是否相等
			 * 			如果相等，则将不满足过滤条件的元素 push 到新的数组中
			 * 			如果不相等，则将满足过滤条件的元素 push 到新的数组中
			 */			
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		// 	3.	返回过滤后的数组
		return ret;
	},

	/**
	 * 	映射数组
	 * 	@param  { Object } 		elems		可以是数组或类数组
	 * 	@param  { Function } 	callback	每个元素执行的回调
	 * 	@param  { Object } 		arg			jQuery 内部使用的时提供的参数
	 * 	@return 							映射后的新数组
	 */
	map: function( elems, callback, arg ) {
		var value,
			i = 0,							// 循环变量
			length = elems.length,			// 获取数组/类数组的长度
			isArray = isArraylike( elems ),	// 判断 elems 是否是数组/类数组
			ret = [];						// 结果数组

		// 	1. 判断 elems 是数组还是类数组，如果是数组/类数组，进入 if
		if ( isArray ) {
			/**
			 * 	遍历数组/类数组
			 * 	每循环一次，调用一次 callback，并将当前遍历的元素、索引、arg 当做实参
			 * 	判断 callback 的返回值是否是 undefined 或者 null
			 * 		如果不是，则将 callback 的返回值添加到 ret 数组中
			 */
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		} 
		// 	2. 如果不是数组/类数组，也就是普通的 json 对象，进入 else
		else {
			/**
			 * 	使用 for...in 遍历对象
			 * 	每循环一次，调用一次 callback，并将当前遍历的元素、索引、arg 当做实参
			 * 	判断 callback 的返回值是否是 undefined 或者 null
			 * 		如果不是，则将 callback 的返回值添加到 ret 数组中
			 */
			for ( i in elems ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}
		console.log( ret )
		// 3. 通过 concat 方法将保存结果的数组 ret 与 [] 进行连接，并返回结果
		//		这样做可以防止在 callback 中返回的就是一个数组，保证该方法得到的新数组是一个简单的数组，而不是嵌套的数组
		return core_concat.apply( [], ret );
	},

	// A global GUID counter for objects
	/**
	 *  jQuery 中唯一标志符
	 */
	guid: 1,

	/**
	 * 	修改 this 指向
	 * 	@param { Function } fn
	 * 	@param { Object | String } context
	 * 
	 * 	let obj = {
	 * 		show: function () {
	 * 			console.log( this );
	 * 		}
	 * 	};
	 * 	$(document).click( obj.show );						// 此时打印出的就是 document
	 * 	$(document).click( $.proxy(obj.show, obj) );		// 此时打印出的就是 obj
	 * 	$(document).click( $.proxy(obj, 'show') );			// 此时打印出的就是 obj
	 * 
	 * 	
	 * 	function show ( value1, value2 ) {
	 * 		console.log( value1 );
	 * 		console.log( value2 );
	 * 	}
	 * 	$.proxy( show, document )( 1, 2 );	// 打印 1, 2
	 * 	$.proxy( show, document, 1, 2 )();	// 打印 1, 2
	 * 	$.proxy( show, document, 1 )( 2 );	// 打印 1, 2
	 */
	// Bind a function to a context, optionally partially applying any
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		/**
		 * 	1. 	如果 context 是一个字符串，那么此时 fn 就是一个对象（ 就是上下文对象 ）
		 * 		获取该对象下的 context 属性值，是一个方法
		 * 		再将 fn 赋给上下文变量 context 并且将该方法赋给 fn
		 */
		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// 2. 判断 fn 是否是函数，如果不是，直接退出函数
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// 3. 从 arguments 的第二个参数开始截取至结尾，返回一个新的数组，因为第一个参数和第二个参数分别是 fn 和 上下文对象
		args = core_slice.call( arguments, 2 );
		/**
		 * 	4. 	创建一个新的函数
		 * 		其中，返回一个 fn 函数
		 * 		修改 fn 中的 this，将其指向为 context，如果不存在则指向当前对象 this，即 $
		 * 		再将 $.proxy 中的参数数组 args 与 调用该方法的参数通过 concat 连接，例如 1233 行的代码，此时合并后的数组就是 [ 1, 2 ]
		 */
		proxy = function() {
			return fn.apply( context || this, args.concat( core_slice.call( arguments ) ) );
		};

		/**
		 * 	5.	为返回的新函数和传进来的函数 fn 设置唯一的标识
		 * 		该标识如果在 fn 中存在，那么直接设置
		 * 		如果不存在，那么使用 jQuery.guid 的值 + 1
		 */
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		// 5. 返回新创建的函数
		return proxy;
	},

	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	/**
	 * 	多功能值的操作
	 * 	@param 	{ Object } elems		当前操作的 jQ 对象
	 * 	@param 	{ Function } fn			回调
	 * 	@param 	{} key					类似于 $().css( 'background': 'red' ) 中的第一个参数 background，或者 $().css( { background: 'red' } ) 中的 { background: 'red' }
	 * 	@param 	{} value				类似于 $().css( 'background': 'red' ) 中的第二个参数 red
	 * 	@param 	{ Boolean } chainable	设置获取还是设置；true -> 设置；false -> 获取
	 * 	@param 	{} emptyGet
	 * 	@param 	{} raw
	 * 	@return 
	 * 	在 jQuery 中的一些方法，例如 $().css() 方法，既可以设置，又可以取值
	 * 		设置时，又可以提供两个参数，用于设置一个属性；也可以提供一个 json 对象，用于设置多个值
	 * 		取值时，只需要提供一个参数就可以获取到该属性的对应值了
	 */
	access: function( elems, fn, key, value, chainable, emptyGet, raw ) {
		var i = 0,					// 循环变量
			length = elems.length,	// 集合的长度
			bulk = key == null;

		/**
		 * 	1.  处理设置多个值的情况，此时 key 就是一个对象
		 * 		例如 $( document ).css( { fontSize: '12px', color: '#f99' } )
		 */
		if ( jQuery.type( key ) === "object" ) {
			// 1.1 手动将 chainable 置为 true，因为在设置多个属性时，也只有一个参数，所以在这之前 chainable 的值也是 false
			chainable = true;
			/**
			 * 1.2 	遍历 key
			 * 		递归调用 access 方法
			 */
			for ( i in key ) {
				jQuery.access( elems, fn, i, key[i], true, emptyGet, raw );
			}
		} 
		/**
		 * 	2.	设置一个属性，类似于下面
		 * 		$().css( 'backgound', 'red' )
		 * 		此时，key 就是字符串，进入 else if
		 * 
		 * 		既然 key 不是 Object 而且 value 又不是 undefined 的话，那么肯定是设置一个属性值了，就像上面代码一样
		 */
		else if ( value !== undefined ) {
			// 	2.1 手动将 chainable 置为 true，确保该值为设置时的值（ true ），因为后面会用到
			chainable = true;

			/**
			 * 	2.2 判断要设置的值是否是函数
			 * 		如果不是，则将 raw 设置为 true
			 */
			if ( !jQuery.isFunction( value ) ) {
				raw = true;
			}

			/**
			 * 	2.3 判断提供的 key 是否是 undefined 或者 null
			 * 		如果是，则进入 if 中
			 */
			if ( bulk ) {
				// Bulk operations run against the entire set
				/**
				 * 	1.3.1	如果 value 不是函数，进入 if
				 * 			调用回调 fn，并将其中的 this 修改为当前的 jq 对象，并将 value 传给回调
				 */
				if ( raw ) {
					fn.call( elems, value );
					fn = null;

				// ...except when executing function values
				} else {
					bulk = fn;
					fn = function( elem, key, value ) {
						return bulk.call( jQuery( elem ), value );
					};
				}
			}

			/**
			 * 	2.4 判断是否提供了操作的回调
			 * 		如果提供，则进入 if 中，遍历 jQuery 对象中的所有 DOM 元素，每遍历一次，执行一次 fn 方法
			 * 		并为 fn 方法传递三个参数
			 * 			参数一：当前遍历的 DOM 元素
			 * 			参数二：当前的 key 值
			 * 			参数三：value 的值；如果 value 不是函数，则直接将 value 作为参数；如果 value 是函数，则先调用这个函数，再将返回值作为参数
			 */
			if ( fn ) {
				for ( ; i < length; i++ ) {
					fn( elems[i], key, raw ? value : value.call( elems[i], i, fn( elems[i], key ) ) );
				}
			}
		}

		/**
		 * 	3.  判断当前是设置值还是取值
		 * 		chainable 为 true，代表设置值；为 false，代表取值
		 * 			如果是设置值，那么返回的就是传入的 elems jQuery 对象本身的引用
		 * 			如果是取值，首先会判断提供的 key 是否有效
		 * 				如果有效，则调用 fn 并返回其调用结果
		 * 				如果无效，则判断 elems jQuery 对象是否含有元素
		 * 					如果含有 DOM 元素，则调用 fn 并将其结果返回
		 * 					如果不含 DOM 元素，则直接返回 emptyGet 参数
		 */
		return chainable 
			? elems
			: bulk
				? fn.call( elems )
				: length ? fn( elems[0], key ) : emptyGet;
	},

	/**
	 * 	获取当前的时间戳的方法
	 */
	now: Date.now,

	// A method for quickly swapping in/out CSS properties to get correct calculations.
	// Note: this method belongs to the css module but it's needed here for the support module.
	// If support gets modularized, this method should be moved back to the css module.
	/**
	 * 	CSS 交换
	 * 	@param  {} elem		操作的元素
	 * 	@param  {} options	新样式的 JSON 对象
	 * 	@param  {} callback	回调
	 * 	@param  {} args		数组参数（ 内部使用 ）
	 * 	@return 			回调的返回值
	 * 
	 * 	当一个盒子的 display 为 none 时，此时使用 jQuery 能够获取到其宽高等值，而是用原生 JS 的方式是获取不到的
	 * 	那么 jQuery 是怎么获取到隐藏元素的宽高呢？
	 * 	其实可以使用 visibility: hidden 这个样式，它也是隐藏元素，只不过占文档流；但是再加上 position: absolute 就不占文档流了，效果不就和 display: none 一样了嘛
	 * 	jQuery 的做法就是将 display 置为 block，再加上 visibility 和 position 实现
	 * 	jQuery 的做法就是先把老样式存下，然后替换新样式，此时进行一些操作（ 例如取宽高 ），灾后再恢复老样式
	 */
	swap: function( elem, options, callback, args ) {
		var ret, 
			name,
			old = {};	// 保存老样式的对象

		/**
		 * 	遍历保存样式的对象 options	
		 * 	将 elem 元素中每个样式的值保存在 old 中，并将 options 中每个样式的值赋给 elem 元素
		 * 	for 循环结束后，old 保存的是 elem 元素的老样式，而 elem 元素上已经添加了新样式
		 */
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		/**
		 * 	调用 callback 方法，并将 callback 的作用域设置为 elem，并且传递数组 args，没有的话传递空数组
		 */
		ret = callback.apply( elem, args || [] );

		/**
		 * 	再次遍历 options 新样式对象，将之前的老样式依次还原给 elem 元素
		 */
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		// 返回 callback 的返回值
		return ret;
	}
});

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready );

		} else {

			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", completed, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", completed, false );
		}
	}
	return readyList.promise( obj );
};

/**
 * 	调用 $.each 方法，将 class2type 对象设置为如下的形式
 * 	{
 * 		[object Boolean]: 	'boolean',
 * 		[object Number]: 	'number',
 * 		[object String]: 	'string',
 * 		[object Function]: 	'function',
 * 		[object Array]: 	'array',
 * 		[object Date]: 		'date',
 * 		[object RegExp]: 	'regexp',
 * 		[object Object]: 	'object',
 * 		[object Error]: 	'error'
 * 	}
 */
jQuery.each("Boolean Number String Function Array Date RegExp Object Error".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

/**
 * 	判断 obj 是否是数组或类数组
 * 	@param 	{ Any }	 obj 	待判断的对象
 * 	@return 				obj 是否是数组/类数组的布尔值
 */
function isArraylike( obj ) {
	var length = obj.length,		// 获取 obj 的长度，只有在 obj 是数组/类数组时才会有值
		type = jQuery.type( obj );	// 获取 obj 的数据类型

	// 1. 判断 obj 是否是 window，如果是，直接返回 false
	if ( jQuery.isWindow( obj ) ) {
		return false;
	}

	// 2. 这个地方没有看懂，什么情况下进入 if
	if ( obj.nodeType === 1 && length ) {
		return true;
	}

	/**
	 * 	3.	
	 * 		第一步
	 * 		如果 obj 的类型是数组，则进行第二步判断
	 * 		如果 obj 不是数组，再判断 obj 是否是函数，因为函数也是对象，也可能存在 length 这样的属性，但是函数并不是一个数组/类数组
	 * 			所以，如果 obj 是函数，直接返回 false
	 * 			如果 obj 不是函数，此时，obj 就是除数组和函数以外的任意类型了，进行第二步的判断
	 * 
	 * 		第二步
	 * 		判断 length 是否是 0
	 * 			如果 length 是 0，说明 obj 是一个数组/类数组，只是不存在任何元素
	 * 				之所以要判断是否是 0，原因就在下面，如果不判断，那么下面 length - 1 就是 -1 了，-1 是不在 obj 为数组的情况中的，那么此时判断结果就是 false 了，但它实际应该是 Array，应该返回 true
	 * 			如果 length 不是 0，那么判断 length 的类型是否是 number 以及是否大于 0，再判断 length - 1 的属性是否存在于 obj 中，如果都满足，那就是一个类数组/数组，返回 true
	 * 
	 * 		注意
	 * 			如果 obj 是 String 的实例，那么也是满足以下条件的，因为 String 的实例也属于类数组
	 * 			String 的实例类似于 { 0: 'h', 1: 'e', 2: 'l', 3: 'l', 4: 'o', length: 5 }
	 */
	return type === "array" || type !== "function" &&
		( length === 0 ||
		typeof length === "number" && length > 0 && ( length - 1 ) in obj );
}

// 将 rootjQuery 变量赋值为 $( document )
rootjQuery = jQuery(document);

/*!
 * Sizzle CSS Selector Engine v1.9.4-pre
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2013-06-03
 */
(function( window, undefined ) {

var i,
	support,
	cachedruns,
	Expr,
	getText,
	isXML,
	compile,
	outermostContext,
	sortInput,

	// Local document vars
	setDocument,
	document,
	docElem,
	documentIsHTML,
	rbuggyQSA,
	rbuggyMatches,
	matches,
	contains,

	// Instance-specific data
	expando = "sizzle" + -(new Date()),
	preferredDoc = window.document,
	dirruns = 0,
	done = 0,
	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),
	hasDuplicate = false,
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}
		return 0;
	},

	// General-purpose constants
	strundefined = typeof undefined,
	MAX_NEGATIVE = 1 << 31,

	// Instance methods
	hasOwn = ({}).hasOwnProperty,
	arr = [],
	pop = arr.pop,
	push_native = arr.push,
	push = arr.push,
	slice = arr.slice,
	// Use a stripped-down indexOf if we can't use a native one
	indexOf = arr.indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	booleans = "checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",

	// Regular expressions

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier http://www.w3.org/TR/css3-selectors/#attribute-selectors
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:([*^$|!~]?=)" + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments quoted,
	//   then not containing pseudos/brackets,
	//   then attribute selectors/non-parenthetical expressions,
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\(((['\"])((?:\\\\.|[^\\\\])*?)\\3|((?:\\\\.|[^\\\\()[\\]]|" + attributes.replace( 3, 8 ) + ")*)|.*)\\)|)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([>+~]|" + whitespace + ")" + whitespace + "*" ),

	rsibling = new RegExp( whitespace + "*[+~]" ),
	rattributeQuotes = new RegExp( "=" + whitespace + "*([^\\]'\"]*)" + whitespace + "*\\]", "g" ),

	rpseudo = new RegExp( pseudos ),
	ridentifier = new RegExp( "^" + identifier + "$" ),

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"CHILD": new RegExp( "^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		"bool": new RegExp( "^(?:" + booleans + ")$", "i" ),
		// For use in libraries implementing .is()
		// We use this for POS matching in `select`
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(" +
			whitespace + "*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)", "i" )
	},

	rnative = /^[^{]+\{\s*\[native \w/,

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,

	rinputs = /^(?:input|select|textarea|button)$/i,
	rheader = /^h\d$/i,

	rescape = /'|\\/g,

	// CSS escapes http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
	runescape = new RegExp( "\\\\([\\da-f]{1,6}" + whitespace + "?|(" + whitespace + ")|.)", "ig" ),
	funescape = function( _, escaped, escapedWhitespace ) {
		var high = "0x" + escaped - 0x10000;
		// NaN means non-codepoint
		// Support: Firefox
		// Workaround erroneous numeric interpretation of +"0x"
		return high !== high || escapedWhitespace ?
			escaped :
			// BMP codepoint
			high < 0 ?
				String.fromCharCode( high + 0x10000 ) :
				// Supplemental Plane codepoint (surrogate pair)
				String.fromCharCode( high >> 10 | 0xD800, high & 0x3FF | 0xDC00 );
	};

// Optimize for push.apply( _, NodeList )
try {
	push.apply(
		(arr = slice.call( preferredDoc.childNodes )),
		preferredDoc.childNodes
	);
	// Support: Android<4.0 1="" 8="" 9="" detect="" silently="" failing="" push.apply="" arr[="" preferreddoc.childnodes.length="" ].nodetype;="" }="" catch="" (="" e="" )="" {="" push="{" apply:="" arr.length="" ?="" leverage="" slice="" if="" possible="" function(="" target,="" els="" push_native.apply(="" slice.call(els)="" );="" :="" support:="" ie<9="" otherwise="" append="" directly="" var="" j="target.length," i="0;" can't="" trust="" nodelist.length="" while="" (target[j++]="els[i++])" {}="" target.length="j" -="" 1;="" };="" function="" sizzle(="" selector,="" context,="" results,="" seed="" match,="" elem,="" m,="" nodetype,="" qsa="" vars="" i,="" groups,="" old,="" nid,="" newcontext,="" newselector;="" context="" context.ownerdocument="" ||="" preferreddoc="" !="=" document="" setdocument(="" document;="" results="results" [];="" !selector="" typeof="" selector="" "string"="" return="" results;="" (nodetype="context.nodeType)" &&="" nodetype="" documentishtml="" !seed="" shortcuts="" (match="rquickExpr.exec(" ))="" speed-up:="" sizzle("#id")="" (m="match[1])" elem="context.getElementById(" m="" check="" parentnode="" to="" when="" blackberry="" 4.6="" returns="" nodes="" that="" are="" no="" longer="" in="" the="" #6963="" elem.parentnode="" handle="" case="" where="" ie,="" opera,="" and="" webkit="" items="" by="" name="" instead="" of="" id="" elem.id="==" results.push(="" else="" is="" not="" a="" (elem="context.ownerDocument.getElementById(" contains(="" sizzle("tag")="" match[2]="" push.apply(="" context.getelementsbytagname(="" sizzle(".class")="" support.getelementsbyclassname="" context.getelementsbyclassname="" context.getelementsbyclassname(="" path="" support.qsa="" (!rbuggyqsa="" !rbuggyqsa.test(="" nid="old" =="" expando;="" newcontext="context;" newselector="nodeType" selector;="" works="" strangely="" on="" element-rooted="" queries="" we="" can="" work="" around="" this="" specifying="" an="" extra="" root="" working="" up="" from="" there="" (thanks="" andrew="" dupont="" for="" technique)="" ie="" doesn't="" object="" elements="" context.nodename.tolowercase()="" "object"="" groups="tokenize(" (old="context.getAttribute("id"))" rescape,="" "\\$&"="" context.setattribute(="" "id",="" +="" "']="" ";="" i--="" groups[i]="nid" toselector(="" context.parentnode="" context;="" try="" newcontext.queryselectorall(="" catch(qsaerror)="" finally="" !old="" context.removeattribute("id");="" all="" others="" select(="" selector.replace(="" rtrim,="" "$1"="" ),="" **="" *="" create="" key-value="" caches="" limited="" size="" @returns="" {function(string,="" object)}="" data="" after="" storing="" it="" itself="" with="" property="" (space-suffixed)="" string="" (if="" cache="" larger="" than="" expr.cachelength)="" deleting="" oldest="" entry="" createcache()="" keys="[];" cache(="" key,="" value="" use="" (key="" "="" ")="" avoid="" collision="" native="" prototype="" properties="" (see="" issue="" #157)="" keys.push(="" key=""> Expr.cacheLength ) {
			// Only keep the most recent entries
			delete cache[ keys.shift() ];
		}
		return (cache[ key ] = value);
	}
	return cache;
}

/**
 * Mark a function for special use by Sizzle
 * @param {Function} fn The function to mark
 */
function markFunction( fn ) {
	fn[ expando ] = true;
	return fn;
}

/**
 * Support testing using an element
 * @param {Function} fn Passed the created div and expects a boolean result
 */
function assert( fn ) {
	var div = document.createElement("div");

	try {
		return !!fn( div );
	} catch (e) {
		return false;
	} finally {
		// Remove from its parent by default
		if ( div.parentNode ) {
			div.parentNode.removeChild( div );
		}
		// release memory in IE
		div = null;
	}
}

/**
 * Adds the same handler for all of the specified attrs
 * @param {String} attrs Pipe-separated list of attributes
 * @param {Function} handler The method that will be applied
 */
function addHandle( attrs, handler ) {
	var arr = attrs.split("|"),
		i = attrs.length;

	while ( i-- ) {
		Expr.attrHandle[ arr[i] ] = handler;
	}
}

/**
 * Checks document order of two siblings
 * @param {Element} a
 * @param {Element} b
 * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
 */
function siblingCheck( a, b ) {
	var cur = b && a,
		diff = cur && a.nodeType === 1 && b.nodeType === 1 &&
			( ~b.sourceIndex || MAX_NEGATIVE ) -
			( ~a.sourceIndex || MAX_NEGATIVE );

	// Use IE sourceIndex if available on both nodes
	if ( diff ) {
		return diff;
	}

	// Check if b follows a
	if ( cur ) {
		while ( (cur = cur.nextSibling) ) {
			if ( cur === b ) {
				return -1;
			}
		}
	}

	return a ? 1 : -1;
}

/**
 * Returns a function to use in pseudos for input types
 * @param {String} type
 */
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for buttons
 * @param {String} type
 */
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

/**
 * Returns a function to use in pseudos for positionals
 * @param {Function} fn
 */
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Detect xml
 * @param {Element|Object} elem An element or a document
 */
isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

// Expose support vars for convenience
support = Sizzle.support = {};

/**
 * Sets document-related variables once based on the current document
 * @param {Element|Object} [doc] An element or document object to use to set the document
 * @returns {Object} Returns the current document
 */
setDocument = Sizzle.setDocument = function( node ) {
	var doc = node ? node.ownerDocument || node : preferredDoc,
		parent = doc.defaultView;

	// If no document and documentElement is available, return
	if ( doc === document || doc.nodeType !== 9 || !doc.documentElement ) {
		return document;
	}

	// Set our document
	document = doc;
	docElem = doc.documentElement;

	// Support tests
	documentIsHTML = !isXML( doc );

	// Support: IE>8
	// If iframe document is assigned to "document" variable and if iframe has been reloaded,
	// IE will throw "permission denied" error when accessing "document" variable, see jQuery #13936
	// IE6-8 do not support the defaultView property so parent will be undefined
	if ( parent && parent.attachEvent && parent !== parent.top ) {
		parent.attachEvent( "onbeforeunload", function() {
			setDocument();
		});
	}

	/* Attributes
	---------------------------------------------------------------------- */

	// Support: IE<8 1="" 4="" 7="" 8="" 9="" 11="" 16="" 2011="" 12359="" 13378="" verify="" that="" getattribute="" really="" returns="" attributes="" and="" not="" properties="" (excepting="" ie8="" booleans)="" support.attributes="assert(function(" div="" )="" {="" div.classname="i" ;="" return="" !div.getattribute("classname");="" });="" *="" getelement(s)by*="" ----------------------------------------------------------------------="" check="" if="" getelementsbytagname("*")="" only="" elements="" support.getelementsbytagname="assert(function(" div.appendchild(="" doc.createcomment("")="" );="" !div.getelementsbytagname("*").length;="" getelementsbyclassname="" can="" be="" trusted="" support.getelementsbyclassname="assert(function(" div.innerhtml="<div class='a'></div><div class='a i'></div>" support:="" safari<4="" catch="" class="" over-caching="" div.firstchild.classname="i" opera<10="" gebcn="" failure="" to="" find="" non-leading="" classes="" div.getelementsbyclassname("i").length="==" 2;="" ie<10="" getelementbyid="" by="" name="" the="" broken="" methods="" don't="" pick="" up="" programatically-set="" names,="" so="" use="" a="" roundabout="" getelementsbyname="" test="" support.getbyid="assert(function(" docelem.appendchild(="" ).id="expando;" !doc.getelementsbyname="" ||="" !doc.getelementsbyname(="" expando="" ).length;="" id="" filter="" (="" expr.find["id"]="function(" id,="" context="" typeof="" context.getelementbyid="" !="=" strundefined="" &&="" documentishtml="" var="" m="context.getElementById(" parentnode="" when="" blackberry="" 4.6="" nodes="" are="" no="" longer="" in="" document="" #6963="" m.parentnode="" ?="" [m]="" :="" [];="" }="" };="" expr.filter["id"]="function(" attrid="id.replace(" runescape,="" funescape="" function(="" elem="" elem.getattribute("id")="==" attrid;="" else="" ie6="" is="" reliable="" as="" shortcut="" delete="" expr.find["id"];="" node="typeof" elem.getattributenode="" elem.getattributenode("id");="" node.value="==" tag="" expr.find["tag"]="support.getElementsByTagName" tag,="" context.getelementsbytagname="" context.getelementsbytagname(="" elem,="" tmp="[]," i="0," results="context.getElementsByTagName(" out="" possible="" comments="" "*"="" while="" (elem="results[i++])" elem.nodetype="==" tmp.push(="" tmp;="" results;="" expr.find["class"]="support.getElementsByClassName" classname,="" context.getelementsbyclassname="" context.getelementsbyclassname(="" classname="" qsa="" matchesselector="" support="" matchesselector(:active)="" reports="" false="" true="" (ie9="" opera="" 11.5)="" rbuggymatches="[];" qsa(:focus)="" (chrome="" 21)="" we="" allow="" this="" because="" of="" bug="" throws="" an="" error="" whenever="" `document.activeelement`="" accessed="" on="" iframe="" so,="" :focus="" pass="" through="" all="" time="" avoid="" ie="" see="" http:="" bugs.jquery.com="" ticket="" rbuggyqsa="[];" (support.qsa="rnative.test(" doc.queryselectorall="" ))="" build="" regex="" strategy="" adopted="" from="" diego="" perini="" assert(function(="" select="" set="" empty="" string="" purpose="" ie's="" treatment="" explicitly="" setting="" boolean="" content="" attribute,="" since="" its="" presence="" should="" enough="" "value"="" treated="" correctly="" !div.queryselectorall("[selected]").length="" rbuggyqsa.push(="" "\\["="" +="" whitespace="" "*(?:value|"="" booleans="" ")"="" webkit="" -="" :checked="" selected option="" www.w3.org="" tr="" rec-css3-selectors-20110929="" #checked="" here="" will="" later="" tests="" !div.queryselectorall(":checked").length="" rbuggyqsa.push(":checked");="" 10-12="" ^="$=" values="" anything="" windows="" native="" apps="" type="" attribute="" restricted="" during="" .innerhtml="" assignment="" input="doc.createElement("input");" input.setattribute(="" "type",="" "hidden"="" ).setattribute(="" "t",="" ""="" div.queryselectorall("[t^="" ]").length="" "[*^$]=" + whitespace + " *(?:''|\"\")"="" ff="" 3.5="" :enabled="" :disabled="" hidden (hidden="" still="" enabled)="" !div.queryselectorall(":enabled").length="" ":enabled",="" ":disabled"="" 10-11="" does="" throw="" post-comma="" invalid="" pseudos="" div.queryselectorall("*,:x");="" rbuggyqsa.push(",.*:");="" (support.matchesselector="rnative.test(" (matches="docElem.webkitMatchesSelector" docelem.mozmatchesselector="" docelem.omatchesselector="" docelem.msmatchesselector)="" it's="" do="" disconnected="" (ie="" 9)="" support.disconnectedmatch="matches.call(" div,="" "div"="" fail="" with="" exception="" gecko="" error,="" instead="" matches.call(="" "[s!="" ]:x"="" rbuggymatches.push(="" "!=", pseudos );
		});
	}

	rbuggyQSA = rbuggyQSA.length && new RegExp( rbuggyQSA.join(" |")="" new="" regexp(="" rbuggymatches.join("|")="" contains="" element="" another="" purposefully="" implement="" inclusive="" descendent="" in,="" contain="" itself="" docelem.contains="" docelem.comparedocumentposition="" a,="" b="" adown="a.nodeType" =="=" a.documentelement="" bup="b" b.parentnode;="" !!(="" bup.nodetype="==" adown.contains="" adown.contains(="" a.comparedocumentposition="" a.comparedocumentposition(="" &="" ));="" (b="b.parentNode)" true;="" false;="" sorting="" order="" sortorder="docElem.compareDocumentPosition" flag="" for="" duplicate="" removal="" hasduplicate="true;" 0;="" compare="b.compareDocumentPosition" (!support.sortdetached="" b.comparedocumentposition(="" compare)="" choose="" first="" related="" our="" preferred="" doc="" contains(preferreddoc,="" a)="" -1;="" b)="" 1;="" maintain="" original="" sortinput="" indexof.call(="" sortinput,="" -1="" directly="" comparable,="" sort="" existence="" method="" cur,="" aup="a.parentNode," ap="[" ],="" bp="[" ];="" exit="" early="" identical="" parentless="" either="" documents="" or="" !aup="" !bup="" siblings,="" quick="" siblingcheck(="" otherwise="" need="" full="" lists="" their="" ancestors="" comparison="" cur="a;" (cur="cur.parentNode)" ap.unshift(="" bp.unshift(="" walk="" down="" tree="" looking="" discrepancy="" ap[i]="==" bp[i]="" i++;="" sibling="" have="" common="" ancestor="" ap[i],="" preferreddoc="" doc;="" sizzle.matches="function(" expr,="" sizzle(="" null,="" sizzle.matchesselector="function(" expr="" vars="" needed="" elem.ownerdocument="" setdocument(="" make="" sure="" selectors="" quoted="" rattributequotes,="" "="$1" ]"="" support.matchesselector="" !rbuggymatches="" !rbuggymatches.test(="" !rbuggyqsa="" !rbuggyqsa.test(="" try="" ret="matches.call(" 9's="" well,="" said="" fragment="" elem.document="" elem.document.nodetype="" ret;="" catch(e)="" {}="" document,="" [elem]="" ).length=""> 0;
};

Sizzle.contains = function( context, elem ) {
	// Set document vars if needed
	if ( ( context.ownerDocument || context ) !== document ) {
		setDocument( context );
	}
	return contains( context, elem );
};

Sizzle.attr = function( elem, name ) {
	// Set document vars if needed
	if ( ( elem.ownerDocument || elem ) !== document ) {
		setDocument( elem );
	}

	var fn = Expr.attrHandle[ name.toLowerCase() ],
		// Don't get fooled by Object.prototype properties (jQuery #13807)
		val = fn && hasOwn.call( Expr.attrHandle, name.toLowerCase() ) ?
			fn( elem, name, !documentIsHTML ) :
			undefined;

	return val === undefined ?
		support.attributes || !documentIsHTML ?
			elem.getAttribute( name ) :
			(val = elem.getAttributeNode(name)) && val.specified ?
				val.value :
				null :
		val;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

/**
 * Document sorting and removing duplicates
 * @param {ArrayLike} results
 */
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		j = 0,
		i = 0;

	// Unless we *know* we can detect duplicates, assume their presence
	hasDuplicate = !support.detectDuplicates;
	sortInput = !support.sortStable && results.slice( 0 );
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		while ( (elem = results[i++]) ) {
			if ( elem === results[ i ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	return results;
};

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( !nodeType ) {
		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	} else if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
		// Use textContent for elements
		// innerText usage removed for consistency of new lines (see #11153)
		if ( typeof elem.textContent === "string" ) {
			return elem.textContent;
		} else {
			// Traverse its children
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				ret += getText( elem );
			}
		}
	} else if ( nodeType === 3 || nodeType === 4 ) {
		return elem.nodeValue;
	}
	// Do not include comment or processing instruction nodes

	return ret;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	attrHandle: {},

	find: {},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( runescape, funescape );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( runescape, funescape );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 what (child|of-type)
				3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				4 xn-component of xn+y argument ([+-]?\d*n|)
				5 sign of xn-component
				6 x of xn-component
				7 sign of y-component
				8 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1].slice( 0, 3 ) === "nth" ) {
				// nth-* requires argument
				if ( !match[3] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[4] = +( match[4] ? match[5] + (match[6] || 1) : 2 * ( match[3] === "even" || match[3] === "odd" ) );
				match[5] = +( ( match[7] + match[8] ) || match[3] === "odd" );

			// other types prohibit arguments
			} else if ( match[3] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var excess,
				unquoted = !match[5] && match[2];

			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			// Accept quoted arguments as-is
			if ( match[3] && match[4] !== undefined ) {
				match[2] = match[4];

			// Strip excess characters from unquoted arguments
			} else if ( unquoted && rpseudo.test( unquoted ) &&
				// Get excess from tokenize (recursively)
				(excess = tokenize( unquoted, true )) &&
				// advance to the next closing parenthesis
				(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

				// excess is a negative index
				match[0] = match[0].slice( 0, excess );
				match[2] = unquoted.slice( 0, excess );
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {

		"TAG": function( nodeNameSelector ) {
			var nodeName = nodeNameSelector.replace( runescape, funescape ).toLowerCase();
			return nodeNameSelector === "*" ?
				function() { return true; } :
				function( elem ) {
					return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
				};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( typeof elem.className === "string" && elem.className || typeof elem.getAttribute !== strundefined && elem.getAttribute("class") || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.slice( -check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.slice( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, what, argument, first, last ) {
			var simple = type.slice( 0, 3 ) !== "nth",
				forward = type.slice( -4 ) !== "last",
				ofType = what === "of-type";

			return first === 1 && last === 0 ?

				// Shortcut for :nth-*(n)
				function( elem ) {
					return !!elem.parentNode;
				} :

				function( elem, context, xml ) {
					var cache, outerCache, node, diff, nodeIndex, start,
						dir = simple !== forward ? "nextSibling" : "previousSibling",
						parent = elem.parentNode,
						name = ofType && elem.nodeName.toLowerCase(),
						useCache = !xml && !ofType;

					if ( parent ) {

						// :(first|last|only)-(child|of-type)
						if ( simple ) {
							while ( dir ) {
								node = elem;
								while ( (node = node[ dir ]) ) {
									if ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) {
										return false;
									}
								}
								// Reverse direction for :only-* (if we haven't yet done so)
								start = dir = type === "only" && !start && "nextSibling";
							}
							return true;
						}

						start = [ forward ? parent.firstChild : parent.lastChild ];

						// non-xml :nth-child(...) stores cache data on `parent`
						if ( forward && useCache ) {
							// Seek `elem` from a previously-cached index
							outerCache = parent[ expando ] || (parent[ expando ] = {});
							cache = outerCache[ type ] || [];
							nodeIndex = cache[0] === dirruns && cache[1];
							diff = cache[0] === dirruns && cache[2];
							node = nodeIndex && parent.childNodes[ nodeIndex ];

							while ( (node = ++nodeIndex && node && node[ dir ] ||

								// Fallback to seeking `elem` from the start
								(diff = nodeIndex = 0) || start.pop()) ) {

								// When found, cache indexes on `parent` and break
								if ( node.nodeType === 1 && ++diff && node === elem ) {
									outerCache[ type ] = [ dirruns, nodeIndex, diff ];
									break;
								}
							}

						// Use previously-cached element index if available
						} else if ( useCache && (cache = (elem[ expando ] || (elem[ expando ] = {}))[ type ]) && cache[0] === dirruns ) {
							diff = cache[1];

						// xml :nth-child(...) or :nth-last-child(...) or :nth(-last)?-of-type(...)
						} else {
							// Use the same loop as above to seek `elem` from the start
							while ( (node = ++nodeIndex && node && node[ dir ] ||
								(diff = nodeIndex = 0) || start.pop()) ) {

								if ( ( ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1 ) && ++diff ) {
									// Cache the index of each encountered element
									if ( useCache ) {
										(node[ expando ] || (node[ expando ] = {}))[ type ] = [ dirruns, diff ];
									}

									if ( node === elem ) {
										break;
									}
								}
							}
						}

						// Incorporate the offset, then check against cycle size
						diff -= last;
						return diff === first || ( diff % first === 0 && diff / first >= 0 );
					}
				};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		// Potentially complex pseudos
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		// "Whether an element is represented by a :lang() selector
		// is based solely on the element's language value
		// being equal to the identifier C,
		// or beginning with the identifier C immediately followed by "-".
		// The matching of C against the element's language value is performed case-insensitively.
		// The identifier C does not have to be a valid language name."
		// http://www.w3.org/TR/selectors/#lang-pseudo
		"lang": markFunction( function( lang ) {
			// lang value must be a valid identifier
			if ( !ridentifier.test(lang || "") ) {
				Sizzle.error( "unsupported lang: " + lang );
			}
			lang = lang.replace( runescape, funescape ).toLowerCase();
			return function( elem ) {
				var elemLang;
				do {
					if ( (elemLang = documentIsHTML ?
						elem.lang :
						elem.getAttribute("xml:lang") || elem.getAttribute("lang")) ) {

						elemLang = elemLang.toLowerCase();
						return elemLang === lang || elemLang.indexOf( lang + "-" ) === 0;
					}
				} while ( (elem = elem.parentNode) && elem.nodeType === 1 );
				return false;
			};
		}),

		// Miscellaneous
		"target": function( elem ) {
			var hash = window.location && window.location.hash;
			return hash && hash.slice( 1 ) === elem.id;
		},

		"root": function( elem ) {
			return elem === docElem;
		},

		"focus": function( elem ) {
			return elem === document.activeElement && (!document.hasFocus || document.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		// Boolean properties
		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		// Contents
		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
			//   not comment, processing instructions, or others
			// Thanks to Diego Perini for the nodeName shortcut
			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
			for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
				if ( elem.nodeName > "@" || elem.nodeType === 3 || elem.nodeType === 4 ) {
					return false;
				}
			}
			return true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		// Element/input types
		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"text": function( elem ) {
			var attr;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" &&
				elem.type === "text" &&
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === elem.type );
		},

		// Position-in-collection
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 0;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			var i = 1;
			for ( ; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			var i = argument < 0 ? argument + length : argument;
			for ( ; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Add button/input type pseudos
for ( i in { radio: true, checkbox: true, file: true, password: true, image: true } ) {
	Expr.pseudos[ i ] = createInputPseudo( i );
}
for ( i in { submit: true, reset: true } ) {
	Expr.pseudos[ i ] = createButtonPseudo( i );
}

// Easy API for creating new setFilters
function setFilters() {}
setFilters.prototype = Expr.filters = Expr.pseudos;
Expr.setFilters = new setFilters();

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( tokens = [] );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			matched = match.shift();
			tokens.push({
				value: matched,
				// Cast descendant combinators to space
				type: match[0].replace( rtrim, " " )
			});
			soFar = soFar.slice( matched.length );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {
				matched = match.shift();
				tokens.push({
					value: matched,
					type: type,
					matches: match
				});
				soFar = soFar.slice( matched.length );
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function toSelector( tokens ) {
	var i = 0,
		len = tokens.length,
		selector = "";
	for ( ; i < len; i++ ) {
		selector += tokens[i].value;
	}
	return selector;
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( elem.nodeType === 1 || checkNonElements ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			var data, cache, outerCache,
				dirkey = dirruns + " " + doneName;

			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( xml ) {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						if ( matcher( elem, context, xml ) ) {
							return true;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( elem.nodeType === 1 || checkNonElements ) {
						outerCache = elem[ expando ] || (elem[ expando ] = {});
						if ( (cache = outerCache[ dir ]) && cache[0] === dirkey ) {
							if ( (data = cache[1]) === true || data === cachedruns ) {
								return data === true;
							}
						} else {
							cache = outerCache[ dir ] = [ dirkey ];
							cache[1] = matcher( elem, context, xml ) || cachedruns;
							if ( cache[1] === true ) {
								return true;
							}
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator(elementMatcher( matchers ), matcher) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && toSelector(
						// If the preceding token was a descendant combinator, insert an implicit any-element `*`
						tokens.slice( 0, i - 1 ).concat({ value: tokens[ i - 2 ].type === " " ? "*" : "" })
					).replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && toSelector( tokens )
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	// A counter to specify which element is currently being matched
	var matcherCachedRuns = 0,
		bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, expandContext ) {
			var elem, j, matcher,
				setMatched = [],
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				outermost = expandContext != null,
				contextBackup = outermostContext,
				// We must always have either seed elements or context
				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
				// Use integer dirruns iff this is the outermost matcher
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1);

			if ( outermost ) {
				outermostContext = context !== document && context;
				cachedruns = matcherCachedRuns;
			}

			// Add elements passing elementMatchers directly to results
			// Keep `i` a string if there are no elements so `matchedCount` will be "00" below
			for ( ; (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					j = 0;
					while ( (matcher = elementMatchers[j++]) ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
						cachedruns = ++matcherCachedRuns;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				j = 0;
				while ( (matcher = setMatchers[j++]) ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed ) {
	var i, tokens, token, type, find,
		match = tokenize( selector );

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					support.getById && context.nodeType === 9 && documentIsHTML &&
					Expr.relative[ tokens[1].type ] ) {

				context = ( Expr.find["ID"]( token.matches[0].replace(runescape, funescape), context ) || [] )[0];
				if ( !context ) {
					return results;
				}
				selector = selector.slice( tokens.shift().value.length );
			}

			// Fetch a seed set for right-to-left matching
			i = matchExpr["needsContext"].test( selector ) ? 0 : tokens.length;
			while ( i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( runescape, funescape ),
						rsibling.test( tokens[0].type ) && context.parentNode || context
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && toSelector( tokens );
						if ( !selector ) {
							push.apply( results, seed );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		!documentIsHTML,
		results,
		rsibling.test( selector )
	);
	return results;
}

// One-time assignments

// Sort stability
support.sortStable = expando.split("").sort( sortOrder ).join("") === expando;

// Support: Chrome<14 0="" 1="" 2="" 4="" 25="" always="" assume="" duplicates="" if="" they="" aren't="" passed="" to="" the="" comparison="" function="" support.detectduplicates="hasDuplicate;" initialize="" against="" default document="" setdocument();="" support:="" webkit<537.32="" -="" safari="" 6.0.3="" chrome="" (fixed="" in="" 27)="" detached="" nodes="" confoundingly="" follow="" *each="" other*="" support.sortdetached="assert(function(" div1="" )="" {="" should="" return="" 1,="" but="" returns="" (following)="" div1.comparedocumentposition(="" document.createelement("div")="" &="" 1;="" });="" ie<8="" prevent="" attribute="" property="" "interpolation"="" http:="" msdn.microsoft.com="" en-us="" library="" ms536429%28vs.85%29.aspx="" (="" !assert(function(="" div="" div.innerhtml="<a href='#'></a>" ;="" div.firstchild.getattribute("href")="==" "#"="" })="" addhandle(="" "type|href|height|width",="" function(="" elem,="" name,="" isxml="" !isxml="" elem.getattribute(="" name.tolowercase()="==" "type"="" ?="" :="" );="" }="" ie<9="" use="" defaultvalue="" place="" of="" getattribute("value")="" !support.attributes="" ||="" div.firstchild.setattribute(="" "value",="" ""="" div.firstchild.getattribute(="" "value"="" "";="" &&="" elem.nodename.tolowercase()="==" "input"="" elem.defaultvalue;="" getattributenode="" fetch="" booleans="" when="" getattribute="" lies="" div.getattribute("disabled")="=" null;="" booleans,="" var="" val;="" (val="elem.getAttributeNode(" name="" ))="" val.specified="" val.value="" elem[="" ]="==" true="" jquery.find="Sizzle;" jquery.expr="Sizzle.selectors;" jquery.expr[":"]="jQuery.expr.pseudos;" jquery.unique="Sizzle.uniqueSort;" jquery.text="Sizzle.getText;" jquery.isxmldoc="Sizzle.isXML;" jquery.contains="Sizzle.contains;" })(="" window="" string="" object="" options="" format="" cache="" 保存="" $.callbacks="" 中参数的缓存="" optionscache="{};" convert="" string-formatted="" into="" object-formatted="" ones="" and="" store="" **="" *="" 创建参数="" json="" 对象="" @param="" callback="" 的参数对象，例如="" 'once="" memory'="" @return="" 创建的="" 如果="" 是="" 的话，那么返回的="" 对象就是="" once:="" true,="" memory:="" createoptions(="" 1.="" 创建一个以="" 为键的属性，并赋值空对象="" 2.="" 通过="" core_rnotwhite="" 正则将="" 中除空格以外的其他字符进行匹配，并遍历这个数组="" 将第一步中的空对象遍历设置正则匹配后的值，设置为="" jquery.each(="" options.match(="" [],="" _,="" flag="" object[="" object;="" create="" a="" list="" using="" following="" parameters:="" options:="" an="" optional="" space-separated="" that="" will="" change="" how="" behaves="" or="" more="" traditional="" option="" by="" act="" like="" event="" can="" be="" "fired"="" multiple times.="" possible="" ensure="" only="" fired="" once="" (like="" deferred)="" keep="" track="" previous="" values="" call="" any="" added="" after="" has="" been="" right="" away="" with="" latest="" "memorized"="" unique:="" (no="" duplicate="" list)="" stoponfalse:="" interrupt="" callings="" false="" jquery.callbacks="function(" from="" needed="" (we="" check="" first)="" 先检查="" 是否是字符串="" 如果是的话，先从缓存中读取数据，如果缓存没有，则调用="" createoptions="" 方法先在缓存中创建数据="" 如果不是的话，即没有传参数，直接返回一个空的="" "string"="" optionscache[="" jquery.extend(="" {},="" last="" fire="" value="" (for="" non-forgettable="" lists)="" memory,="" 是否执行过="" 队列中所有回调的标识；最开始为="" undefined，只有执行了一次="" 后，该值为被置为="" fired,="" 队列中的所有回调正在被执行时的标识="" firing,="" first="" (used="" internally="" add="" firewith)="" firingstart,="" end="" loop firing="" firinglength,="" index="" currently="" (modified="" remove="" needed)="" firingindex,="" 保存回调的队列="" 中传递了="" 参数，那么该值就是="" false；如果没有提供="" once，那么该是就是空数组="" stack="!options.once" 执行所有的回调="" array="" 包括调用="" 时的作用域以及参数两个元素="" data="" 1.1="" 判断="" 时是否提供了="" memory="" 参数，如果提供了，那么="" 就是合并后的数组；如果没提供，就是="" data;="" 1.2="" 将="" 置为="" true，代表已经触发过="" 方法了，如果没有调用过="" 方法，那么该值就是="" undefined="" 1.3="" 遍历="" 队列的循环变量，先判断="" firingstart="" 是否存在有效值，如果有的话，就代表此时是在有="" 参数的情况下，通过="" 方法来执行回调，而不是通过外部的="" 方法；="" firingindex="firingStart" 0;="" 1.4="" 恢复="" 1.5="" 保存当前队列的长度="" firinglength="list.length;" 1.6="" true，代表正在进行遍历触发每个回调="" 1.7="" 遍历每一个回调并触发="" 调用队列中的每一个回调，并修改每个回调中的="" this，就是当前调用="" 方法的接受者；再将调用="" 时传递的参数当做实参传递给每一个回调="" cb="$.Callbacks();" cb.add(="" func1="" cb.fire('hello',="" 'world');="" 此时，func1="" 中的="" this="" 就指向的是="" 方法的接受者，即="" cb；func1="" 接受两个参数，分别是="" 'hello'="" 和="" 'world'="" 再判断每个回调的返回值是否是="" false，如果是="" 的话，再判断="" 中是否传递了="" stoponfalse="" 如果传递了，那么直接退出循环，不再继续执行之后的回调="" for="" <="" firinglength;="" firingindex++="" list[="" ].apply(="" data[="" ],="" options.stoponfalse="" further="" calls="" break;="" 1.8="" false，代表已经结束了所有回调的触发="" 1.9="" 是否存在="" 1.9.1="" 是否存在，只要不提供="" 就存在="" 1.9.1.1="" 中是否含有元素="" stack.length="" 如果能进入到这个="" 就说明在某一个回调中调用="" 方法="" 此时，stack="" 中存储的是在回调中调用="" 传递的参数以及调用者组成的数组="" 此时，在通过内部方法="" 来遍历当前的合并数组，以此用当前合并的数组来执行="" 队列中的每个方法="" fire(="" stack.shift()="" 1.9.2="" 如果不存在="" stack（="" 提供了="" 参数="" ）并且提供了="" 参数，就意味着只有第一次的="" 是有效的，并且之后的="" 也有效="" 那么在执行="" 方法是，就会进入这个="" if，此时将="" 队列清空，所以之后的="" 方法就不会有效了，遍历的只是一个空数组="" else="" 1.9.3="" 如果提供了="" 但是不提供="" memory，那么就意味着只有第一次的="" 是有效的="" 此时就会进入这个="" if，调用="" disable="" 方法，禁止当前回调队列，禁止会将回调队列="" 设置为="" self.disable();="" },="" actual="" callbacks="" self="{" 添加一个回调到队列中="" add:="" function()="" 先判断队列是否存在，如果存在进入="" 获取当前队列的长度="" start="list.length;" $.each="" 方法，遍历每一个参数="" 如果当前是一个函数的话，首先判断此时在="" unique="" 如果没有传递，则直接将当前的函数="" push="" 到队列中="" 如果传递了，再判断当前队列里是否已经存在该函数了，如果存在，则不再进行="" push；如果不存在，则进行="" 如果当前参数不是一个函数，可能会是一个数组="" 类数组，此时再递归调用="" 方法，并将该数组作为参数传递="" 的参数可能有以下几种="" add(="" func1,="" [="" (function="" args="" args,="" arg="" type="jQuery.type(" "function"="" !options.unique="" !self.has(="" list.push(="" arg.length="" !="=" console.log('000')="" arguments="" 判断当前是否正在调用="" 队列中的所有回调（="" 如果正在调用回调，那么="" 就是="" ）="" 能加进入到这个="" 就说明，在="" 中的回调，执行了="" 方法，此时，因为正在遍历="" 队列，所以="" 此时，修改="" 的值为最新的长度，这样，就能在外层的遍历="" 队列中，使得多循环一次，来执行最新加到队列中的方法="" 如果当前没有调用回调，就判断="" 在第一次执行="" 方法时，该值是="" undefined，所以不会进入="" 在执行了一次="" 方法之后，如果在="" 参数，那么="" 变量就被置为合并后的数组；否则就是="" 如果能进入这个="" if，就代表此时已经提供了="" 参数，并且在调用了="" 之后又调用了="" 此时，记录下当前队列的长度="" length，以确保在遍历队列的时候，只执行当前操作的函数，而不再执行之前的那些函数="" 并且调用="" 内部方法，并将合并后的数组当做实参传递，以此进行当前="" 操作针对的函数进行以此调用="" this;="" 移除指定的回调="" remove:="" 队列是否存在="" arguments,="" 1.1.1="" 查找当前的参数是否在="" 队列中，如果存在，进入="" while="" index;="" while(="" arg,="" list,=""> -1 ) {
							// 1.1.1.1 从 list 队列中移除该回调
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								/**
								 *  判断当前移除的回调在 list 中的索引是否小于等于 firingLength
								 *      如果成立，则将 firingLength 的值减 1
								 */
								if ( index <= 1="" 2="" firinglength="" )="" {="" firinglength--;="" }="" **="" *="" 判断="" index="" 是否小于等于="" firingindex="" 如果成立，说明在回调队列="" list="" 中，当前移除的回调在当前执行的回调之前，或者移除的回调就是当前执行的回调，此时将循环变量="" 的值减="" 例如，回调队列="" 中的回调是这样的="" [="" func1,="" func2,="" func3="" ]="" 如果移除的回调是="" func1，那么只有当执行="" func1、func2="" 或者="" 时，才会进入这个="" if="" func2，那么只有当执行="" func2="" func3，那么只有当执行="" 之所以样将这个值减="" 1，是因为如果不减="" 1，会影响之后的操作="" 例如上面的例子中，移除的回调是="" func1="" 且是在="" 中移除的；在执行="" 回调时，firingindex="" 的值是="" 0，firinglength="" 3；当使用="" splice="" 移除="" 后，="" 的值为="" 2，如果此时不对="" 减="" 的话，那么就会接着执行="" func2，而不会执行="" 了（="" 因为="" 为="" ），所以要将="" 1，="" 恢复移除之前的状态="" (="" <="firingIndex" firingindex--;="" });="" return="" this;="" },="" 检查一个指定的回调是否在队列中="" @param="" function="" 指定的回调="" @return="" 是否存在的布尔值="" has:="" function(="" fn="" 1.="" 首先判断是否指定了参数="" 如果指定了，再通过="" $.inarray="" 方法判断="" 是否在="" 里="" 如果没指定，则是判断回调队列是否存在（="" 包括队列存在以及队列里是否有元素="" ）="" ?="" jquery.inarray(="" fn,=""> -1 : !!( list && list.length );
			},

			list: function () {
				console.log( list );
				return list;
			},

			/**
			 * 	删除队列中的所有回调
			 * 	@return 	返回 self，以供链式调用
			 */
			empty: function() {
				// 	1. 将 list 队列清空并且将保存 list 长度的变量清零
				list = [];
				firingLength = 0;

				return this;
			},
			/**
			 * 	禁止当前回调队列
			 * 	@return 	返回 self，以供链式调用
			 */
			disable: function() {
				/**
				 *  将 list 队列、stack、memory 都置为 undefined，此时这个回调队列已经无法使用了
				 */
				list = stack = memory = undefined;
				return this;
			},
			/**
			 * 	判断当前回调队列是否被禁用
			 * 	@return 	当前回调队列是否被禁用的布尔值
			 */
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					// console.log( '锁定 - 禁用' );
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			/**
			 * 	通过指定的作用域以及参数，调用队列中所有的回调
			 * 	@param 	{ Object } context 	作用域（ self ）
			 * 	@param  { Object } args		参数
			 * 	@return 					返回 self
			 */
			fireWith: function( context, args ) {
				// console.log( args )
				/**
				 * 	1.	判断 list 是否存在
				 * 		如果存在，再判断 fired 的值，如果是第一次执行 fire 方法的话，那么 fired 就是 undefined，!fired 就是 true，直接进入 if
				 * 		如果是第二次或更多次执行 fire 方法的话，此时 fired 已经被置为 true 了，所以此时要判断 stack 的值了		
				 * 			如果在 $.Callbacks 中传递了 once 参数，那么 stack 就是 false，此时不进入 if，也就无法执行每个回调了，保证所有的回调只执行一次
				 * 			如果在 $.Callbacks 中没传递 once 参数，那么 stack 就是 空数组，此时进入 if，再一次执行每一个回调
				 */
				if ( list && ( !fired || stack ) ) {
					// 	1.1 如果在调用 fire 时传递了参数，就将参数对象赋给 args，如果没有传递，就赋一个空数组
					args = args || [];
					/**
					 * 	1.2	将作用域和参数对象合为一个新的数组（ 第1个元素为作用域，第2个元素为参数对象 ）
					 */
					args = [ context, args.slice ? args.slice() : args ];

					/**
					 * 	1.3	判断当前是否正在执行 list 队列中的每个回调
					 * 		如果是第一次执行 fire 方法，那么此时 firing 就是 undefined，所以会进入 else，调用 fire 方法，并将整合后的数组作为实参传递
					 */
					if ( firing ) {
						/**
						 * 	如果能进入这个 if 就说明，在某一个回调里面调用 fire 方法，因为在遍历 list 队列时，firing 是 true
						 * 	然后将当前的合并数组 push 到 stack 中，不执行 fire 内部，即不会进行遍历操作
						 */
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			/**
			 * 	通过一些参数，调用队列中所有的回调
			 * 	@return 	返回 fire 的调用者，即 self 对象
			 */
			fire: function() {
				// 1.	调用 fireWith 并将 this（ self ） 和 arguments 当做实参传递
				self.fireWith( this, arguments );
				return this;
			},

			/**
			 *	判断当前 list 队列是否执行过 fire 方法
			 *	@return 	是否执行过 fire 的布尔值 
			 */
			fired: function() {
				return !!fired;
			}
		};

	return self;
};

/**
 * 	Deferred 对象
 * 		主要还是通过 Callbacks 来实现，它其中的 resolve、reject 等方法就会调用 fire 方法，而 done、fail 等方法就是 add 方法
 * 		而我们之所以调用 resolve 方法之后，就确定了它的状态，实际上就是调用了 fire 方法，所以此时
 */
jQuery.extend({

	Deferred: function( func ) {
		/**
		 * 	声明延迟对象的状态数组
		 * 		成功（ 动作、监听方法、回调队列，状态 ）
		 * 		失败（ 同上 ）
		 * 		进行中（ 同上 ）
		 * 
		 * 	三个状态的回调队列只有 resolve 和 reject 添加 once 属性，这意味着只能调用一次 resolve 或者 reject 方法，如果之后在调用是无法再次遍历回调队列触发每个回调的
		 * 	而 notify 不一样，调用一次 notify 就可以遍历一次回调队列，导致触发每个回调
		 * 
		 * 	监听方法是添加在 promise 对象上的；而 动作方法是添加在 deferred 上的
		 */
		var tuples = [
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],

		/**
		 * 	声明状态变量，初始化为 pending（ 等待 ）
		 */
			state = "pending",

		/**
		 * 	声明 promise 对象
		 */
			promise = {
				/**
				 * 	@return	返回当前的状态 	
				 */
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					/**
					 * 	then 方法会返回一个新的延迟对象，并在调用 $.Deferred 方法的时候传递了一个函数作为参数，该函数的参数（ newDefer ）就是即将返回的这个新的延迟对象
					 * 		这个函数中，遍历了 tuples 数组（ 三次 ），每次遍历，首先判断 then 的参数是否是函数，如果是的话，将其引用保存在 fn 变量中
					 * 		注意，40 行的 deferred 对象就是 then 的调用者（ 先称其为 dfd 变量 ），所以，接下来调用了 dfd 的 done、fail 和 progress 方法，分别向 dfd 的三个状态的回调对象添加了一个新的回调
					 * 			这个新的回调中只有一点不一样，剩余的都一样；不一样的是，每次调用的 fn 方法不同
					 * 				如果将 dfd 的状态指定为成功，那么就会执行 then 方法的第一个函数参数
         			 *              如果将 dfd 的状态指定为失败，那么就会执行 then 方法的第二个函数参数
         			 *              如果将 dfd 的状态指定为进行中，那么就会执行 then 方法的第三个函数参数
					  * 		然后会判断 fn 的返回值
					  * 			如果是一个延迟对象，
					  * 			如果不是延迟对象，就将 then 方法返回的延迟对象的状态指定为和 dfd 一样，主要是用过 action 这个变量来调用 resolveWith、rejectWith 或者 notifyWith 方法的
					 */
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var action = tuple[ 0 ],	
								fn = jQuery.isFunction( fns[ i ] ) && fns[ i ];
							
							deferred[ tuple[1] ](function() {
								var returned = fn && fn.apply( this, arguments );
								if ( returned && jQuery.isFunction( returned.promise ) ) {
									returned.promise()
										.done( newDefer.resolve )
										.fail( newDefer.reject )
										.progress( newDefer.notify );
								} else {
									newDefer[ action + "With" ]( this === promise ? newDefer.promise() : this, fn ? [ returned ] : arguments );
								}
							});
						});
						fns = null;
					}).promise();
				},
				
				/**
				 * 	@param { Object }	obj 	待合并的对象
				 * 	如果提供了参数，那么就将 promise 中的所有属性添加到 obj 中
				 * 	如果没有提供参数，那么就返回 promise 对象
				 */
				promise: function( obj ) {
					return obj != null 
						? jQuery.extend( obj, promise ) 
						: promise;
				}
			},
		/**
		 * 	声明 deferred 对象
		 */
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		/**
		 * 	遍历延迟对象状态数组
		 * 	将每个状态的监听方法 done、fail、progress 保存为当前状态回调对象的 add 方法的引用
		 * 	向 deferred 对象中添加 resolveWith、rejectWith、notifyWith 属性，保存为当前状态回调对象的 fireWith 方法的引用
		 * 	向 deferred 对象中添加 resolve、reject、notify 属性方法，其内部调用 resolveWith、rejectWith、notifyWith
		 * 	向 resolve 和 reject 状态的回调队列中添加几个回调
		 */
		jQuery.each( tuples, function( i, tuple ) {
			//	1.1	保存每种状态所对应的回调队列的引用以及对应的状态
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			/**
			 * 	1.2	保存回调队列 add 方法的引用到 promise 中的 done、fail、progress 属性
			 * 		每次循环的 list 都是不同的回调对象（ 即 $.Callbacks 中的 self ），所以回调队列中的 list 队列也是不同的
			 * 		即 resolve 的 add 只会往 resolve 的回调队列添加，reject 的 add 只会往 reject 的回调队列添加3
			 */
			promise[ tuple[1] ] = list.add;

			// 	1.3 如果当前状态存在状态值的话（ resolve 和 reject 两种 ）进入 if
			if ( stateString ) {
				/**
				 * 	为当前状态的回调队列添加三个回调
				 * 		如果是 resolved 状态
				 * 			回调一：修改 state 为 resolved
				 * 			回调二：rejected 状态下的回调队列的 disable
				 * 			回调三：进行状态（ progress ）回调队列的 lock
				 * 		如果是 rejected 状态
				 * 			回调一：修改 state 为 rejected
				 * 			回调二：resolved 状态下的回调队列的 disable
				 * 			回调三：进行状态（ progress ）回调队列的 lock
				 */
				list.add(function() {
					state = stateString;
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// 	1.4	将 deferred 下面的 resolve、reject、notify 三个属性存储为函数对象
			deferred[ tuple[0] ] = function() {
				/**
				 * 	1.4.1 	调用 deferred 下面的 resolveWith、rejectWith、notifyWith 方法，实际上就是调用
				 * 			回调队列的内部的 fireWith 方法
				 * 			如果调用当前方法的对象时 deferred 对象（ 即 $.Deferred() 的返回值 ），那么 fireWith 的作用域就是 promise 对象；否则就是 deferred 对象
				 * 			将当前方法接受的参数传入 fireWith
				 */
				deferred[ tuple[0] + "With" ]( this === deferred ? promise : this, arguments );
				return this;
			};

			// 	1.5	将 deferred 下面的 resolveWith、rejectWith、notifyWith 三个属性存储为回调队列 fireWith 的引用
			deferred[ tuple[0] + "With" ] = list.fireWith;

			deferred[ tuple[0] + 'Callbacks' ] = function () {
				return tuple[2];
			}
		});

		/**
		 * 	利用 promise 对象下面的 promise 方法，将 promise 下的所有方法深拷贝到 deferred 下
		 * 	此时，deferred 下面比 promise 下面多三个方法（ 状态方法：resolve、reject、notify ）
		 */
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	/**
	 *  当参数中的所有延迟对象的状态都变为 resolved 时
	 */
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,	
			resolveValues = core_slice.call( arguments ),	// 将 arguments 转换为数组
			length = resolveValues.length,					// 保存数组的长度

			/**
			 * 	保存未完成的延迟对象的个数到 remaining 变量中
			 * 		如果参数的个数不为 1，那么此时未完成的个数就是参数的个数
			 * 		如果参数的个数为 1，那么就要判断这个参数是否是延迟对象（ 通过是否有 promise 方法来判断 ）
			 * 			如果是，那未完成的个数就是 1
			 * 			如果不是，那未完成的个数就是 0
			 */
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) 
				? length 
				: 0,
			/**
			 * 	保存延迟对象
			 * 		如果未完成的延迟对象个数是 1，那么就直接保存该延迟对象的引用
			 * 		如果未完成的延迟对象个数不是 1，那么就新创建一个延迟对象
			 */
			deferred = remaining === 1 
				? subordinate 
				: jQuery.Deferred(),

			// Update function for both resolve and progress values
			/**
			 *  3.  定义 updateFunc 函数，如果参数中存在两个以上的延迟对象，就会将这个函数的返回值添加到参数中的延迟对象的回调对象里  
			 *  这个函数的功能主要由三个
			 *      修改作用域的集合（ resolveContexts 或者 progressContexts ）
			 *      修改参数的集合（ resolveValues 或者 progressValues ）
			 *      判断
			 *  @param { Number }   i           $.when 方法中参数的索引
			 *  @param { Array }    contexts    作用域的集合
			 *  @param { Array }    values      参数的集合
			 */
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					/**
					 *  将当前的 this（ $.when 中每个延迟对象的 promise 对象 ）赋给 contexts 以 i 为索引的元素
					 *  contexts 最终保存的就是 $.when 中所有延迟对象的 promise 对象
					 */
					contexts[ i ] = this;	

					/**
					 *  将当前的参数保存在 values 中以 i 为索引的元素，当前的参数就是 $.when 中的每个延迟对象在通过 resolve 或者 reject 方法指定状态时传递的参数
					 *  	判断参数的个数是否大于 1
					 * 			如果大于 1，那么将 arguments 转换为数组，并存在 values 中以 i 为索引的元素中
					 * 			如果小于等于 1，那么将当前的参数 value 存在 values 中以 i 为索引的元素中
					 */
					values[ i ] = arguments.length > 1 
						? core_slice.call( arguments ) 
						: value;

					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} 
					/**
					 * 	只有当 未完成的延迟对象的个数为 0 时，才会进入 else if，将延迟对象的状态改变为 resolved
					 * 
					 * 	当 $.when 中有两个以上的延迟对象时，每个延迟对象的 resolve 状态对应的回调对象中，都会 add updateFunc 方法，然后在某一时刻
					 * 	将 $.when 中的延迟对象的状态设置为 resolved，那么就会调用当前延迟对象中 resolve 状态对应的回调对象中的所有回调，此时就会
					 * 	调用 updateFunc
					 * 	$.when 中的每一个延迟对象都是如此，所以会再次会将 未完成的回调对象个数减 1，如果减到 0，那么就将 $.when 的返回值（ 也是一个延迟对 ）
					 * 	的状态设置为 resolve，此时就会调用这个延迟对象 resolve 状态下的回调对象中的所有回调，即 $.when().done 中的所有回调
					 */
					/**
					 *  对未完成的延迟对象的个数 remaining - 1，判断其是否等于 0
					 * 		如果是的话，那么就将此时的 deferred 对象的状态设置为 resolved，遍历调用其中 resolve 状态的回调队列
					 */
					else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		/**
		 * 	处理两个以上参数的情况（ 包括两个 ）
		 */
		if ( length > 1 ) {
			// 用当前参数的个数实例化数组
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			/**
			 * 	遍历参数数组，判断每个参数是否是一个延迟对象
			 * 		如果是，则向每一个延迟对象的三种状态的回调队列中添加回调
			 * 			resolved：
			 * 			reject：
			 * 			notify：
			 * 		如果不是，将未完成的延迟对象的个数 - 1
			 */
			for ( ; i < length; i++ ) {
				// console.log( deferred.reject )
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						// i 是当前参数的索引，resolveContexts 最开始是空数组且长度为参数的个数
						.done( updateFunc( i, resolveContexts, resolveValues ) )	
						.fail( deferred.reject )
						// 将 notify 状态的作用域和参数传递给 updateFunction
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}
		
		/**
		 * 	如果未完成延迟对象为 0 了，那么就调用 deferred 的 resolveWith，将延迟对象的状态指定为成功
		 */
		if ( !remaining ) {
			console.log( resolveValues )
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});

/**
 * 	功能检测
 */
jQuery.support = (function( support ) {
	var input = document.createElement("input"),
		fragment = document.createDocumentFragment(),
		div = document.createElement("div"),
		select = document.createElement("select"),
		opt = select.appendChild( document.createElement("option") );

	// Finish early in limited environments
	/**
	 * 	input 的 type 值默认值是 text
	 */
	if ( !input.type ) {
		return support;
	}

	// 	1.	将 input 类型设置为复选框
	input.type = "checkbox";

	// Support: Safari 5.1, iOS 5.1, Android 4.x, Android 2.3
	/**
	 * 		判断 input 复选框的默认值是否是 空字符串，并将结果赋给 checkOn 属性
	 * 		在老版本的 webkit 浏览器中，其默认值是 空字符串；其他的都是 "on"
	 * 		checkOn 为 true：复选框/单选框的默认值是 "on"
	 * 		checkOn 为 false：复选框/单选框的默认值是 ""
	 */
	support.checkOn = input.value !== "";

	/**
	 * 	2.	检测在 select 标签中的第一个 option 是否被默认选中
	 * 		在 Chrome、FF、Safari 下，select 下的第一个 option 默认被选中，即 option 的 selected 为 true
	 * 		在 IE9，IE10，IE11 下，select 下的第一个 option 默认未选中，即 option 的 selected 为 false
	 */
	support.optSelected = opt.selected;

	/**
	 * 	3.  定义一些默认值，在 DOM 加载完成之后再设置
	 */
	support.reliableMarginRight = true;
	support.boxSizingReliable = true;
	support.pixelPosition = false;

	/**
	 * 	4.	检测克隆一个选中的 单/复选框 的节点是否也是选中的
	 * 		将 单/复选框的 checked 设置为 true，即被选中，在对其进行克隆，获取克隆后的 checked
	 * 		在 IE9、IE10 下，克隆后的 checked 为 false，即克隆后的节点未选中，和原来选中是不同的
	 */
	input.checked = true;
	support.noCloneChecked = input.cloneNode( true ).checked;

	/**
	 * 	5.	检测把一个 select 下拉菜单禁用后，其下面的子项 option 是否也被禁止了
	 * 		将 select 禁止，将其下面的 option 的 disabled 值赋给 optDisabled
	 * 		只有在老版本的 webkit 中，option 的 disabled 值才是 true，即被禁止；基本目前的浏览器中，option 的 disabled 都是 false，即未被禁止
	 */
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	/**
	 * 	6.	检测在给一个默认的 input （ 即 type 为 text ）赋 value 值之后，将其类型变为单选框，此时这个 input 的值是否还是原来的值
	 * 		在 IE9、IE10、IE11 下，该值就被重置为 'on' 了（ 因为此时是单选框，ie 下默认被选中 ），而在其他浏览器下，还是原来设置的值
	 */
	input = document.createElement("input");
	input.value = "t";
	input.type = "radio";
	support.radioValue = input.value === "t";

	// #11217 - WebKit loses check when the name is after the checked attribute
	input.setAttribute( "checked", "t" );
	input.setAttribute( "name", "t" );

	fragment.appendChild( input );

	// Support: Safari 5.1, Android 4.x, Android 2.3
	// old WebKit doesn't clone checked state correctly in fragments
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Support: Firefox, Chrome, Safari
	// Beware of CSP restrictions (https://developer.mozilla.org/en/Security/CSP)
	/**
	 * 	8.	检测是否支持 onfocusin 事件
	 * 		该事件只在 IE 下支持
	 * 		普通的 onfocus 事件不能冒泡，而 onfocusin 支持冒泡
	 */
	support.focusinBubbles = "onfocusin" in window;

	/**
	 * 	9.	检测使用 js 创建的一个节点，设置其某一背景属性，再对其进行克隆，将克隆节点背景属性修改，是否会影响到原来节点的背景属性
	 * 		如果原节点的背景属性还是原来的不变，那么就返回 true 并赋给 clearCloneStyle
	 * 		如果不是原来的，那么就返回 false
	 * 		在 IE9、IE10、IE11 下，原来节点的背景属性就会被修改，即返回 false；其余浏览器不会
	 */
	div.style.backgroundClip = "content-box";
	div.cloneNode( true ).style.backgroundClip = "";
	support.clearCloneStyle = div.style.backgroundClip === "content-box";

	/**
	 * 	当 DOM 结构加载文完毕时，再进行进一步的检测
	 */
	jQuery(function() {
		var container, marginDiv,
			// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
			// 设置一些默认的属性（ 内外边距 + 边框都清零，并且设置块元素 ），包括盒模型为标准模式
			divReset = "padding:0;margin:0;border:0;display:block;-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box",
			body = document.getElementsByTagName("body")[ 0 ];

		/**
		 * 	判断如果不存在 body 元素，证明当前不是一个页面，可能是一些框架等，此时直接退出，不再进行下面的检测
		 */
		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		/**
		 * 	新创建一个 div 元素，并设置其样式
		 * 	设置绝对定位以及 left 为 -9999px 是因为让其加载到页面中，不影响整个页面的样式
		 * 	而 margin-top 为 1px 是为了检测一些其他的功能，只不过该检测只在一些 1.x 的版本中存在，当前版本并没有检测
		 */
		container = document.createElement("div");
		container.style.cssText = "border:0;width:0;height:0;position:absolute;top:0;left:-9999px;margin-top:1px";

		// Check box-sizing and margin behavior.
		body.appendChild( container ).appendChild( div );
		div.innerHTML = "";
		// Support: Firefox, Android 2.3 (Prefixed box-sizing versions).
		/**
		 * 	设置 div 的样式，将其盒模型设置为怪异模式，1px 的 padding、width 为 4px、top 为 1%
		 */
		div.style.cssText = "-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%";

		/**
		 * 	如果 body 设置了 zoom 属性，那么将 zoom 属性统一置为 1，即不缩放
		 * 
		 * 	判断 div 的 offsetWidth 是否等于 4px，注意此时 div 是处于 box-border 下的
		 * 	如果结果为 true， 那么代表当前浏览器支持  box-sizing 属性
		 * 	如果结果为 false，那么代表当前浏览器不支持 box-sizing 属性，因为不支持 box-sizing 的话，那么 offsetWitdh = width + padding + border
		 * 	
		 */
		jQuery.swap( body, body.style.zoom != null ? { zoom: 1 } : {}, function() {
			support.boxSizing = div.offsetWidth === 4;
		});

		// Use window.getComputedStyle because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
			/**
			 * 	获取 div 的 top 值，判断其是否是 1%
			 * 	除了 Safari 以外，其他浏览器都返回 1% 对应的像素值，所以该属性是 true
			 * 	只有 Safari 返回 1%，而不是一个具体的像素值，所以该值是 false
			 */
			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";

			/**
			 * 	一个盒子在怪异盒模式下，将其 width 设置为 100px，padding 为 1px
			 * 	在非 IE 下，通过 getComputedStyle 获取 width 的值还是 100px
			 * 	在 IE 下，通过 getComputedStyle 获取 width 的值还是 98px
			 * 	所以，在 IE 下，该属性就是 false，非 IE 下就是 true
			 * 	也就会说，设置一个盒子的值为百分比，只有在 Safari 下得到的也是百分比，其他浏览器得到的都是百分比对应的像素值
			 */
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			/**
			 * 	创建一个新的 div（ marginDiv ） 并添加到 div 中，再将这两个 div 的样式重置为 divReset 的样式
			 * 	再将 marginDiv 的 width 和 margin-right 设置为 0 后，修改 div 的 width 为 1
			 * 	此时判断 marginDiv 的 margin-right 是否是 0
			 * 		如果是 0，那么该属性就是 true
			 * 		如果不是 0，那么该属性就是 false
			 * 	在目前的浏览器下，该属性都是 true
			 * 	在一些老版本的 webkit 浏览器中，如果容器元素的 width 改变，那么其中的子元素的 margin-right 也会改变
			 */
			marginDiv = div.appendChild( document.createElement("div") );
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";

			support.reliableMarginRight =
				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
		}

		body.removeChild( container );
	});

	return support;
})( {} );

/*
	Implementation Summary

	1. Enforce API surface and semantic compatibility with 1.9.x branch
	2. Improve the module's maintainability by reducing the storage
		paths to a single mechanism.
	3. Use the same single mechanism to support "private" and "user" data.
	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
	5. Avoid exposing implementation details on user objects (eg. expando properties)
	6. Provide a clear path for implementation upgrade to WeakMap in 2014
*/

/**
 * 	jQuery 数据缓存
 */
var data_user, data_priv,						// 保存 Data 实例的两个对象，一个用于内部，一个用于暴露给外部
	rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,	// 检测 json 语法，必须有 {} 或者 []
	rmultiDash = /([A-Z])/g;					// 检测大写字母

/**
 * 	数据缓存 Data 构造函数
 * 	该实例的对象有两个属性
 * 		cache: 数据缓存的对象，每一个 DOM 元素对应的属性都在这个对象中
 * 		expando: 当前实例的唯一标识
 */
function Data() {
	// Support: Android < 4,
	// Old WebKit does not have Object.preventExtensions/freeze method,
	// return new empty object instead with no [[set]] accessor
	/**
	 * 	1.	为 Data 实例的 cache 属性对象添加一个 0 属性
	 * 		这个 0 属性只提供了 getter，所以只能访问，不能设置
	 */
	Object.defineProperty( this.cache = {}, 0, {
		get: function() {
			return {};
		}
	});

	// 	2.	为 Data 实例设置 expando 属性，该属性的值是 jQuery.expando 再加上一个随机数	
	this.expando = jQuery.expando + Math.random();
}

/**
 * 	DOM 元素在 cahce 中的索引，每个 DOM 在 cache 中只有一个唯一的索引 key，就是该属性
 * 	当向 cache 中添加一个 DOM 对应的数据时，该值会 +1
 */
Data.uid = 1;

/**
 * 	判断指定的参数是否是元素节点、文档节点以及任何其他类型的数据
 * 	@param 	{ Element } 	owner 	DOM 元素	
 * 	@return 						布尔值；如果参数是元素节点、文档节点以及任何其他类型，都会返回 true；否则就会返回false
 */
Data.accepts = function( owner ) {
	/**
	 * 	只要 owner 是元素节点、文档节点、其他任何类型都返回 true
	 * 	如果是文本节点、注释节点这些，则返回 false
	 */
	return owner.nodeType 
		? owner.nodeType === 1 || owner.nodeType === 9 
		: true;
};

Data.prototype = {
	/**
	 * 	获取当前 DOM 元素在 cache 中的 key 值，一个 DOM 对象在 cache 中只有一个唯一的 key 值，从 1 开始
	 * 	@param 	{ Object }	owner	获取索引的 DOM 元素
	 * 	@return 					DOM 元素在 cache 中的索引 key
	 */
	key: function( owner ) {
		/**
		 * 	1.	判断参数的类型，如果不是元素节点、文档节点以及任何其他数据类型，那么直接退出函数，返回索引 0
		 */
		if ( !Data.accepts( owner ) ) {
			return 0;
		}

		var descriptor = {},
			//	获取 DOM 对象中以当前 Data 实例的 expando 为键的值，即当前 DOM 元素在 cache 中的 key 值，如果是第一次，则该属性值为 undefined
			unlock = owner[ this.expando ];	

		/**
		 * 	2.	如果 DOM 元素在 cache 中不存在索引值，那么就为其创建一个
		 */
		if ( !unlock ) {
			// 2.1	将当前的 uid 设置为当前 DOM 的索引，然后对其加 1
			unlock = Data.uid++;

			/**
			 * 	2.2	将 this.expando 作为 descriptor 的属性，并将 unlock 的值赋给该属性，然后将 expando 作为 DOM 对象的属性
			 * 		因为 defineProperties 方法存在兼容性的问题，所以在不支持该方法的浏览器中，使用 jQuery.extend 方法，将 descriptor 中的属性（ expando ） 添加到 owner 上
			 * 		只不过使用 defineProperties 方法可以将该属性设置为常量
			 * 
			 * 		类似于 DOM.xxx = key
			 * 		其中，xxx 是当前 Data 实例的唯一标志，key 则是当前 DOM 在 cache 中的索引
			 */
			try {
				descriptor[ this.expando ] = { value: unlock };
				Object.defineProperties( owner, descriptor );
			} catch ( e ) {
				descriptor[ this.expando ] = unlock;
				jQuery.extend( owner, descriptor );
			}
		}

		/**
		 * 	3.	如果缓存对象中不存在此时 DOM 对应的索引，那么就添加一个以 unlock 值的属性，并将其属性值设置为空对象
		 * 		此时，就为当前的 DOM 元素在 cache 中设置了与其对应的 key
		 */
		if ( !this.cache[ unlock ] ) {
			this.cache[ unlock ] = {};
		}

		// 	4.	返回当前 DOM 在 cache 中的索引
		return unlock;
	},
	
	/**
	 * 	根据指定的 DOM 元素，为其设置指定的值
	 * 	@param 	{ Element } 			owner	操作的 DOM 元素
	 * 	@param 	{ String | Object } 	data	键；为 String 时，将 value 作为 data 键的值；为 Object 时，将 data 作为 owner 在 cache 的 json 对象
	 * 	@param 	{ Any }		 			value	当 data 为 String 时要设置的值
	 * 	@return 								owner 在 cache 中的 json 对象
	 */
	set: function( owner, data, value ) {
		var prop,
			// 获取 DOM 元素在 cache 中的索引
			unlock = this.key( owner ),
			// 获取 DOM 元素在 cache 中的 json 对象
			cache = this.cache[ unlock ];

		/**
		 * 	处理键是一个字符串的情况下
		 * 	直接将 DOM 在 cache 中的 json 对象上添加一个属性，并将该属性设置为数据 value
		 */
		if ( typeof data === "string" ) {
			cache[ data ] = value;
		} 
		/**
		 * 	处理键是一个对象的情况下
		 */
		else {
			/**
			 * 	如果当前 DOM 在 cache 中的 json 对象是一个空的对象，那么就将 data 中的所有属性赋给当前 DOM 元素在 cache 中的 json 对象
			 * 	如果当前 DOM 在 caceh 中的 json 对象不是一个空的对象，那么通过 for...in 将 data 中的所有属性添加给 DOM 在 cache 中的 json 对象
			 */
			if ( jQuery.isEmptyObject( cache ) ) {
				jQuery.extend( this.cache[ unlock ], data );
			} else {
				for ( prop in data ) {
					cache[ prop ] = data[ prop ];
				}
			}
		}

		// 返回设置完成后的 json 对象
		return cache;
	},

	/**
	 * 	获取指定 DOM 元素在 cache 中的 json 对象
	 * 	@param 	{ Object }	owner	从 owner DOM 元素上取值
	 * 	@param 	{ Number }	key		在缓存对象中的 key 值 
	 * 	@return 					owner 在 cache 中的 json 对象
	 */
	get: function( owner, key ) {
		/**
		 * 	1.	通过 key 方法找出 DOM 对象在 cache 中的的索引
		 * 		然后从 cache 中获取该 DOM 对象对应的 json 对象
		 * 
		 * 	2.	如果没有提供 key 参数，那么就直接返回 DOM 对象在 cache 中的 json 对象
		 * 		如果提供了 key 参数，那么返回的是 DOM 对象在 cache 中的 json 对象以 key 为键的值
		 */
		var cache = this.cache[ this.key( owner ) ];

		return key === undefined 
			? cache 
			: cache[ key ];
	},

	/**
	 * 	将 set 和 get 方法结合的方法
	 * 	@param  { Element }    owner	操作的 DOM
	 * 	@param  { String }     key		
	 * 	@param  { Any }        key	
	 */
	access: function( owner, key, value ) {
		var stored;
		/**
		 *  1.  判断是否是取值的情况
		 * 			如果没有提供 key 值
		 * 			如果提供了一个字符串的 key 值并且没有提供 value
		 */
		if ( key === undefined || ((key && typeof key === "string") && value === undefined) ) {
			/**
			 * 	1.1 调用 get 方法，获取 owner 在 cache 中以 key 为属性的值
			 * 		如果提供了 key 值，那么就是以 key 为属性的值
			 * 		如果没提供 key 值，那么就是 owner 在 cache 中对应的对象
			 */
			stored = this.get( owner, key );

			/**	
			 * 	1.2 判断 get 的返回值是否是 undefied
			 * 		只有一种情况可能是 undefined，就是提供了 key 值，但是 owner 在 cache 中的对象并没有以 key 为属性的值，此时就会得到 undefined
			 * 		此时就会将 key 转换为驼峰写法，然后再一次调用 get 方法，然后返回 get 的返回值
			 * 			如果在 cache 中存在属性 firstName，那么传递 first-name 也可以获得该值
			 */
			return stored !== undefined 
				? stored 
				: this.get( owner, jQuery.camelCase(key) );
		}

		/**
		 * 	2.  如果不是获取值的情况，那么就是设置数据的情况了
		 *		此时也有两种情况
		 * 			key 为 String，value 存在
		 * 			key 为 Object，value 不存在
		 * 		通过 set 方法对 owner 在 cache 中进行数据的设置
		 */
		this.set( owner, key, value );

		/**
		 * 	3.  根据是否提供了 value 参数来确定返回值
		 * 			如果提供了 value 参数，那么就返回 value
		 * 			如果没提供 calue 参数，那么就返回 key 值
		 */
		return value !== undefined ? value : key;
	},

	/**
	 * 	删除指定 DOM 元素在 cache 中的属性
	 * 	@param  { Element }						owner	DOM 元素
	 * 	@param  { Undefined | String | Array }	key		删除的 key 值或者是一个数组，里面包含的是多个 key
	 */
	remove: function( owner, key ) {
		var i, name, camel,
			//  1.  通过 key 方法获取 owner 在 cache 中的索引
			unlock = this.key( owner ),		
			//  2.  获取 owner 在 cache 中以索引为属性的对象
			cache = this.cache[ unlock ];	

		/**
		 * 	3.  判断是否提供了 key 参数
		 * 		如果没提供，那么直接将 owner 在 cache 中以索引为属性的对象清空
		 */
		if ( key === undefined ) {
			this.cache[ unlock ] = {};
		} 
		/**
		 * 	情况二：提供了具体要移除的属性键 key
		 * 			key 可以是一个字符串，代表要删除的某一个键
		 * 			key 也可以是数组，数组的每一个元素都是一个 key，会将这些 key 都删除
		 * 
		 * 			name 最终被置为一个数组，其中存储的是每一个要删除的键
		 */
		/**
		 *  4.  如果提供了 key 参数，此时会判断 key 的类型
		 */
		else {
			/**
			 * 	4.1 如果 key 是一个数组，其中的每个元素都是要删除的属性名
			 * 			首先将 key 中的所有元素转换成驼峰的写法，然后将转换后的元素拼接到原数组的后面，最终将结果保存在 name 变量中
			 */
			if ( jQuery.isArray( key ) ) {
				name = key.concat( key.map( jQuery.camelCase ) );
			} 
			/**
			 * 	4.2 如果提供的 key 不是数组，那么就是字符串
			 * 		首先将字符串 key 转换为驼峰写法并保存在 camel 中
			 * 			然后判断未转换前的 key 是否在 cache 中
			 * 				如果存在的话，则新创建一个数组并保存在 name 中，里面分别存储未转换和转换后的两个值
			 * 				如果不存在的话，那么判断驼峰写法是否存在于 cache 中
			 * 					如果存在，那么新创建一个数组并保存在 name 中，将转换后的值放进数组中
			 * 					如果不存在，那么就用 core_rnotwhite 正则（ 非空格外的任何字符 ）将 name 匹配到的内容保存在一个新的数组中，然后将其引用赋给 name 变量
			 * 						例如：'name age' 会被匹配为 [ 'name', 'age' ]
			 */
			else {
				camel = jQuery.camelCase( key );
				if ( key in cache ) {
					name = [ key, camel ];
				} else {
					name = camel;
					name = name in cache 
						? [ name ] 
						: ( name.match( core_rnotwhite ) || [] );
				}
			}

			/**
			 * 	4.3 遍历上述操作后的结果数组 name
			 * 		使用 delete 操作符删除 cache 中以数组中的每个元素为键的属性
			 */
			i = name.length;
			while ( i-- ) {
				delete cache[ name[ i ] ];
			}
		}
	},

	/**
	 * 	判断指定的 DOM 元素在 cache 中的 json 对象中是否存在数据
	 * 	@param	{ Element }	owner	判断的 DOM 元素
	 * 	@return						DOM 元素在 cache 中的 json 对象是否存在数据的布尔值
	 */
	hasData: function( owner ) {
		/**
		 * 	首先获取到 owner 中以 expando 为键的值（ 这个值就是 owner 在缓存 cache 中的索引 ）
		 * 	再在 cache 中获取以该索引为属性的对象
		 * 		如果此时 owner 在缓存 cache 中存在对应的对象，那么就将这个对象传入 $.isEmptyObject 中
		 * 		如果不存在这个对象，则代表此时没有执行过 Data.prototype.key 方法，所以在缓存 cache 中根本不存在以索引值为属性的对象，此时得到的就是 undefined，所以将一个空对象传入 $.isEmptyObject 中
		 * 	最后通过 $.isEmptyObject 来判断结果是否存在数据
		 */
		return !jQuery.isEmptyObject(
			this.cache[ owner[ this.expando ] ] || {}
		);
	},

	/**
	 * 	删除指定 DOM 元素在 cache 中的对象（ 直接删除该属性 ）
	 * 	@param 	{ Element }	owner	操作的 DOM 元素
	 */
	discard: function( owner ) {
		/**
		 * 	首先判断 DOM 元素在 cache 中是否存在对应的索引
		 * 		如果存在的话，那么就将 DOM 在 cache 中对应的索引删除，即也删除了对应的 json 对象
		 */
		if ( owner[ this.expando ] ) {
			delete this.cache[ owner[ this.expando ] ];
		}
	},
	getCache: function ( owner ) {
		return owner 
			? this.cache[ this.key( owner ) ]
			: this.cache;
	},

	expando: function () {
		console.log( this.expando );
	}
};

// These may be used throughout the jQuery core codebase
data_user = new Data();		// 对外的数据缓存对象
data_priv = new Data();		// 私有的数据缓存对象


jQuery.extend({
	acceptData: Data.accepts,

	hasData: function( elem ) {
		return data_user.hasData( elem ) || data_priv.hasData( elem );
	},

	data: function( elem, name, data ) {
		return data_user.access( elem, name, data );
	},

	removeData: function( elem, name ) {
		data_user.remove( elem, name );
	},

	// TODO: Now that all calls to _data and _removeData have been replaced
	// with direct calls to data_priv methods, these can be deprecated.
	_data: function( elem, name, data ) {
		return data_priv.access( elem, name, data );
	},

	_removeData: function( elem, name ) {
		data_priv.remove( elem, name );
	}
});

jQuery.fn.extend({
	/**
	 * 	为调用者 jQ 对象中的 DOM 元素设置 cache 中的数据，或者获取第一个 DOM 元素在 cache 中的数据
	 * 	@param { String | Object }	key			要设置的键
	 * 	@param { String | Object }	value		要设置的值
	 */
	data: function( key, value ) {
		var attrs, name,
			//  1.  获取当前 jQ 对象中的第一个 DOM 元素，如果在一个 jQ 对象中有多个 DOM 元素，那么使用 data 方法获取值时，只会返回第一个 DOM 元素的值
			elem = this[ 0 ],
			i = 0,
			data = null;

		/**
		 * 	2.  判断有没有提供参数
		 * 			如果没有提供任何参数，那么就会获取当前 jQuery 实例第一个 DOM 元素在 cache 中的对象
		 */
		if ( key === undefined ) {
			//  2.1 判断当前 jQ 对象是否存在 DOM 元素，如果不存在，则直接返回 null
			if ( this.length ) {
				// 	2.1.1 从公用缓存中获取 elem 元素的缓存对象
				data = data_user.get( elem );
				/**
				 * 	2.1.2 设置 HTML5 自定义的属性，例如 data-custom-index
				 * 		  首先 elem 必须是一个元素
				 * 		  其次，在私有缓存中，如果 elem 不存在 hasDataAttrs 属性，进入 if
				 */
				if ( elem.nodeType === 1 && !data_priv.get( elem, "hasDataAttrs" ) ) {
					// 	2.1.2.1	获取 elem 元素所有属性节点的集合（ 该集合是一个类数组，包括 HTML5 自定义的属性 ）并将其引用保存在 attrs 变量中
					attrs = elem.attributes;
					/**
					 * 	2.1.2.2	
					 * 	遍历 attrs 变量（ 其中每个元素都是一个属性节点，获取该属性的名称可以用 name 属性获得，获取该属性的值可以用 value 获得 ）
					 *  	获取到每一个属性节点的属性名，判断属性名中是否存在 data-，即是否是自定义属性
					 *			如果是的话，那么将 data- 之后的内容转换为驼峰写法，例如 data-custom-index 会转换为 customIndex
					 *				然后通过 dataAttr 方法为 elem 元素在公用缓存中设置自定义属性以及其值
					 *			如果不是的话，那么进行下一次的遍历循环
					 */
					for ( ; i < attrs.length; i++ ) {
						name = attrs[ i ].name;

						if ( name.indexOf( "data-" ) === 0 ) {
							name = jQuery.camelCase( name.slice(5) );
							dataAttr( elem, name, data[ name ] );
						}
					}
					/**
					 * 	2.1.2.2
					 * 		在私有缓存中，为 elem 元素设置 hasDataAttr 属性为 true
					 *			这样，当第二次之后使用 data 方法获取 DOM 的数据时，就不会再进入这个 if 了
					 *			这个 if 的作用只是获取到 elem 的自定义属性，并设置到公用 cache 中，所以只会设置一次
					 */
					data_priv.set( elem, "hasDataAttrs", true );
				}
			}

			/**
			 * 	2.2 返回 data 变量（ elem 在公用缓存中的对象 ）
			 */
			return data;
		}

		/**
		 * 	3.  处理 key 是一个对象的时候（ 也就是设置多个值 ）
		 * 		调用 each 方法，为当前 jQuery 实例中的每一个 DOM 元素在公用缓存中设置 key 中所有的键值对
		 */
		if ( typeof key === "object" ) {
			return this.each(function() {
				data_user.set( this, key );
			});
		}

		/**
		 * 	4.  处理一个值的情况（ key 是键，value 是值 ）
		 */
		return jQuery.access( this, function( value ) {
			var data,
				//  4.1. 将 key 转换为驼峰写法并保存在 camelKey 中
				camelKey = jQuery.camelCase( key );

			/**
			 * 	4.2 如果 data 方法中只提供了一个参数（ 即 value 是 undefined ），并且当前 jQuery 实例中至少存在一个 DOM 元素
			 * 		那么就会获取这个 DOM 元素在公用缓存中的对象以 key 为键的值
			 */
			if ( elem && value === undefined ) {
				/**
				 * 	4.2.1 获取 elem 元素在公用缓存中以 key 为键的值
				 * 		  如果该值存在，那么直接退出函数返回该值
				 * 		  如果不存在，再进行下一步处理
				 */
				data = data_user.get( elem, key );
				if ( data !== undefined ) {
					return data;
				}

				/**
				 * 	4.2.2 获取 elem 元素在公用缓存中以 key 的驼峰写法为键的值
				 * 		  如果该值存在，那么直接退出返回该值
				 * 		  如果该值不存在，那么再进行下一步处理
				 */
				data = data_user.get( elem, camelKey );
				if ( data !== undefined ) {
					return data;
				}

				/**
				 * 	4.2.3 获取 elem 元素在公用缓存中以 data- + key 为键的值	
				 * 	      如果该值存在，那么直接退出返回该值
				 * 		  如果该值不存在，那么再进行下一步处理
				 */
				data = dataAttr( elem, camelKey, undefined );
				if ( data !== undefined ) {
					return data;
				}

				/**
				 *  4.2.4 如果经过上述的步骤都没有获取到，那么就说明不存在，返回 undefined
				 */
				return ;
			}

			/**
			 * 	4.3 设置一个值的情况
			 * 	    通过 each 方法遍历当前 jQuery 对象中的每个 DOM 元素
			 */
			this.each(function() {
				/**
				 * 	4.3.1 获取当前 DOM 在公有缓存中，以 camelKey 为键的值
				 */
				var data = data_user.get( this, camelKey );

				/**
				 * 	4.3.2 在公有缓存中为当前 DOM 元素设置以 camelKey 为属性，value 为值的数据
				 */
				data_user.set( this, camelKey, value );

				/**
				 * 	如果 key 中存在 -，并且当前 DOM 元素在公有缓存中存在以 camelKey 为属性的值
				 * 	那么就会在公有缓存中为当前 DOM 元素添加一个以 key 为属性，value 为值的数据
				 */
				if ( key.indexOf("-") !== -1 && data !== undefined ) {
					data_user.set( this, key, value );
				}
			});
		}, null, value, arguments.length > 1, null, true );
	},

	/**
	 * 	删除调用该方法的 jq 对象中的所有 DOM 元素 在 cache 中，以 key 为键的属性
	 * 	@param 	{ Undefined | String | Array }	key	要删除的某个属性（ String ），或者多个属性（ Array ），或者在 cache 中的 json 对象（ Undefined ）
	 */
	removeData: function( key ) {
		return this.each(function() {
			data_user.remove( this, key );
		});
	},
	getCache: function () {
		return data_user.getCache();
	},

	expando: function () {
		console.log( data_user )
	}
});

/**
 * 	在缓存对象中设置 HTML5 的自定义属性
 * 	@param 	{ Element }	elem 	操作的 DOM 元素
 * 	@param 	{ String }	key 	自定义属性 data- 之后的值（ 该值已经转换为了驼峰写法 ），例如 data-custom-index 就是 customIndex
 * 	@param 	{ String }	data 	elem 在 cache 中的对象以 key 为属性的值；如果是第一次设置，那么该值为 undefined
 * 	@return { Any }             设置成功后的 data
 */
function dataAttr( elem, key, data ) {
	var name;
	/**
	 * 	1.  判断 data 是否是 undefined，也就是在 cache 中是否存在以 key 为属性的值
	 * 		如果不存在且 elem 是元素，进入 if
	 */
	if ( data === undefined && elem.nodeType === 1 ) {
		/**
		 * 	1.1 将 key 的驼峰写法转换为 - 的写法，然后将 key 中的大写字母全部转换为小写字母，最后用 data- 拼接转换后的结果到 name 中
		 * 		$1 代表的是 rmultiDash 正则中第一个子项（ 第一个用 () 括起来的内容 ）
		 */
		name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();
		// 	1.2	通过原生的 getAttribute 方法来获取 elem 元素中以 name 为属性的值，将结果保存在 data 中
		data = elem.getAttribute( name );
		/**
		 * 	1.3	根据不同的值，来进行不同的处理
		 * 		如果获取到的自定义属性值是字符串
		 * 			字符串 true，转换为布尔值 true
		 * 			字符串 false，转换为布尔值 false
		 * 			字符串 null，转换为 null
		 * 			字符串数值，转换为数值
		 * 			字符串 json，转换为对应的 js 对象
		 * 		如果值不是字符串，那么就将自定义属性值设置为 undefined
		 */
		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					/**
					 * 	之所以要将 data 先转换为数值（ 用 + 号 ），再转换为字符串（ 拼接空字符串 ），是因为确保原始的 data 是一个纯的字符串数字
					 * 		如果是一个纯数字字符串，那么得到的结果就是该数值
					 * 		如果不是（ 又有字符、又有数字 ），那么 +data 得到 NaN，再转换为字符串 NaN，与原始的 data 就不相等了，就不会得到该数值，进入下一个判断
					 */
					+data + "" === data ? +data :
					/**
					 * 	利用 rbrace 正则判断 data 是否是 json 字符串
					 * 		如果是的话，通过 JSON.parse 将其装换为 js 的对象/数组
					 */
					rbrace.test( data ) ? JSON.parse( data ) :
					// 如果不满足以上所有的条件，那么直接获取原始的数据
					data;
			} catch( e ) {}

			/**
			 * 	调用公用缓存对象的 set 方法，为 elem 在公用缓存中设置以 key 为属性，data 为其值的缓存
			 */
			data_user.set( elem, key, data );
		} else {
			data = undefined;
		}
	}

	/**
	 * 	2.  返回 data
	 */
	return data;
}

jQuery.extend({
	/**
	 * 	入队操作
	 * 	@param  { Element }		elem	操作的 DOM 元素
	 * 	@param  { String }		type	队列的名字
	 * 	@param  { Function }	data	存储在队列中的数据，必须是 Function
	 * 	@return { Array }				DOM 以 type 为键的队列
	 */
	queue: function( elem, type, data ) {
		var queue;

		// 如果提供了 elem 参数，进入 if
		/**
		 * 	1.  判断是否提供了可操作的 DOM 元素
		 */
		if ( elem ) {
			/**
			 * 	1.1 如果提供了队列的名字，那么将其后面拼接上 queue 作为该 DOM 元素队列的名字
			 * 		如果没有提供队列的名字，那么将使用默认的 fx 后面拼接上 queue 作为该 DOM 元素队列的名字
			 * 		然后获取私有缓存中，该 DOM 元素的对象中以队列的名字（ 上一步得到 ）为属性的值
			 */
			type = ( type || "fx" ) + "queue";
			queue = data_priv.get( elem, type );

			/**
			 * 	1.2 判断是否提供了队列中的数据参数
			 * 			如果提供了队列中的数据，那么就判断上一步得到的 queue 是否存在
			 * 				如果是第一次执行该方法，肯定不存在（ 此时是 undefined ），所以直接进入 if
			 * 					在 if 中，在私有缓存中为该 DOM 元素设置一个新的键值对，其中属性是队列的名字，值是一个数组，其中包含我们传递的数据
			 * 				如果是第二次之后执行该方法，那么 queue 就是存在的，此时就会判断 data 是否是一个数组，如果是的话，就进入 if
			 * 					在 if 中，在私有缓存中为该 DOM 元素设置一个新的键值对，替换原来的数据
			 * 				如果是第二次之后执行该方法，并且提供的数据参数不是数组，那么就进入 else
			 * 					在 else 中，直接将当前的数据参数（ 函数 ）push 到 queue 中（ 此时 queue 就是该 DOM 元素在私有缓存中，以队列名称为属性的值，该是是一个数组，其中的元素是函数 ）
			 */
			if ( data ) {
				if ( !queue || jQuery.isArray( data ) ) {
					queue = data_priv.access( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}

			/**
			 * 	1.3 返回该 DOM 元素在私有缓存中以 队列名称（ type ）为属性的值
			 */
			return queue || [];
		}
	},

	/**
	 * 	出队操作
	 * 	@param	{ Element }	elem	操作的 DOM 元素
	 * 	@param	{ String }	type	队列名称
	 */
	dequeue: function( elem, type ) {
		/**
		 * 	1.  判断是否提供了队列名称
		 * 		如果提供了，将其保存在 type 变量中
		 * 		如果没提供，则保存默认的 fx
		 */
		type = type || "fx";

		/**
		 * 	2.  通过 $.queue 方法获取 elem 元素在私有缓存中以 type 为属性的值，该值是一个数组，其中保存的是 elem 这个元素所对应队列中的所有操作（ 函数 ）
		 */
		var queue = jQuery.queue( elem, type ),
			// 3.  保存队列的长度
			startLength = queue.length,
			// 4.  将队列中第一个元素弹出，并保存其引用到 fn
			fn = queue.shift(),
			// 5.  调用 _queueHooks 方法，并将返回值保存在 hooks 中
			hooks = jQuery._queueHooks( elem, type ),
			// 6.  定义 next 方法，其中会调用 $.dequeue 进行出队操作 
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;

			/**
			 * 	调用出队的元素，并将其作用域设置为当前 DOM 元素，然后将 next 和 hooks 作为参数
			 */
			fn.call( elem, next, hooks );
		}

		/**
		 * 	如果此时队列中没有任何元素，并且 hooks 也存在，那么就调用其中的回调对象的 fire 方法
		 * 	执行其中所有的回调（ 此时只有一个回调，就是在第一次执行 $._queueHooks 时添加的回调 ）
		 * 		会将该 DOM 元素的队列清空
		 */
		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	/**
	 * 	私有方法
	 * 	
	 */
	_queueHooks: function( elem, type ) {
		/**
		 * 	将指定队列名称后拼接 queueHooks
		 * 	从私有的 cache 中获取 DOM 的 json 对象中以 key 为键的值
		 * 		如果存在，直接返回
		 * 		如果不存在，那么为 DOM 在 cache 中的 json 对象添加一个 empty 属性，该属性是一个回调对象，并且向回调队列中添加了一个 function
		 */
		var key = type + "queueHooks";
		return data_priv.get( elem, key ) || data_priv.access( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				data_priv.remove( elem, [ type + "queue", key ] );
			})
		});
	}
});

jQuery.fn.extend({
	/**
	 * 	@param 	{ String }						type	队列名称
	 * 	@param 	{ Function | Array<function> }	data	队列中的数据
	 */
	queue: function( type, data ) {
		/**
		 * 	1.  定义 setter 变量且初始化为 2
		 * 		这个变量可以用于区分当前是 getter 还是 setter
		 * 			如果是 getter，则直接返回当前 jQuery 实例的第一个 DOM 元素的队列
		 * 			如果是 setter，则会为当前 jQuery 实例中的每个 DOM 元素的队列中添加指定的操作（ 方法 ）
		 * 
		 * 		之后会用 queue 的参数个数来与 setter 变量比较
		 * 			如果参数的个数小于其值，那么就是 getter
		 * 			如果参数的个数不小于其值，那么就是 setter
		 */
		var setter = 2;

		/**
		 * 	2.  处理第一个参数不是字符串的情况
		 * 		此时就是直接传递的队列中的操作，而队列的名称则使用默认名称 fx
		 * 		并且此时是 setter 操作而非 getter 
		 * 			将操作保存的 data 变量中，并将队列名称 type 设置为默认的 fx，再将 setter - 1
		 */
		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		/**
		 * 	3.  用参数的个数与 setter 变量进行比较
		 * 		如果参数的个数小于 setter，那么就是 getter
		 * 			通过 $.queue 方法获取到当前 jQuery 实例的第一个 DOM 元素，以 type 为队列名称的队列（ 即私有缓存中的数据 ）
		 * 		如果参数的个数不小于其值，那么就是 setter，不会进入 if
		 */
		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		/**
		 * 	4.  如果不是 getter，就是 setter
		 * 		如果 data 不存在，直接返回 jQuery.fn
		 * 		如果 data 存在，那么会遍历当前 jQuery 对象
		 * 			首先通过工具方法 queue 将 data 入对到当前 DOM 以 type 为名的队列中，并保存其队列的引用
		 */
		return data === undefined ?
			this :
			this.each(function() {
				/**
				 * 	4.1 通过 $.queue 会每一个 DOM 元素设置名称为 type 的队列，并将数据 data 放入队列中
				 * 		并将每个 DOM 元素的队列保存在 queue 变量中
				 */
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	/**
	 * 	@param  { Number | String }    time    延迟的描述，可以是数值指定（ 单位为毫秒 ），也可以是字符串的 slow、fast、_default
	 * 	@param  { String }    		   typr    队列的名称
	 */
	delay: function( time, type ) {
		/**
		 * 	1.  判断 jQuery.fx 是否存在
		 * 			如果存在的话，将从 jQuery.fx.speeds 对象中获取以 time 为属性的值，将结果保存在 time 变量中；如果从对象中取出的是 undefined，那么 time 值不变
		 * 			如果不存在的话，time 值不变
		 */
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		/**
		 * 	2.  调用实例方法 queue，为当前 jQuery 实例中的所有 DOM 元素中，以 type 为名的队列中添加一个方法
		 * 			该方法内部会开启一个延迟器，延迟 time 秒后，执行 next 方法，此时 next 方法调用其实是 $.dequeue，并将当前的 DOM 元素
		 */
		return this.queue( type, function( next, hooks ) {
			var timeout = setTimeout( next, time );
			hooks.stop = function() {
				clearTimeout( timeout );
			};
		});
	},

	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},

	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			//  1.  保存队列中的元素，默认为 1
			count = 1,
			//  2.  定义延迟对象
			defer = jQuery.Deferred(),
			//  3.  保存当前 jQuery 实例的引用到 elements 变量
			elements = this,
			// 	4.  保存当前 jQuery 实例中的 DOM 元素的个数
			i = this.length,
			/**
			 * 	5.  定义 resolve 函数
			 * 		其中首先对 count - 1，然后判断其是否是 0，只有当 0 才意味者队列中的所有元素都已经执行完
			 * 		此时将延迟对象的状态指定为成功，并将成功回调的作用域和参数都设置为当前 jQuery 对象
			 */
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		/**
		 * 	6.  判断是否提供了队列的名称
		 * 		如果没提供，那么第一个参数就不是字符串，此时将第一个参数保存到 obj 中，并将 type 置为 undefined，方便下面将其设置默认值 fx
		 */
		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}

		//  7.  如果 type 不存在，则将其设置为默认值 fx
		type = type || "fx";

		/**
		 * 	8.  遍历当前 jQuery 对象中的所有 DOM 元素
		 */
		while( i-- ) {
			/**
			 * 	8.1 获取当前 DOM 元素的 hooks 对象，并判断其是否存在，因为只要存在 hooks 对象，那么队列也就一定存在
			 * 		只要 hooks 对象存在，就将 count + 1 并向 hooks 对象中的回调对象添加一个回调，即 resolve 函数
			 */
			tmp = data_priv.get( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}

		//  9.  执行 resolve 方法，以为 count 默认为 1，如果所有 DOM 元素都不存在队列和 hooks 对象，那么就会直接将延迟对象的状态指定为成功
		resolve();

		//  10. 返回延迟对象的 promise 对象
		return defer.promise( obj );
	}
});

var nodeHook, boolHook,
	rclass = /[\t\r\n\f]/g,	 // 匹配制表符、回车、换行、换页
	rreturn = /\r/g,
	rfocusable = /^(?:input|select|textarea|button)$/i;

jQuery.fn.extend({
	/**
	 * 	@param  { String | Object }	name	当为 String 时是要设置的一个属性名；当为 Object 时是要设置的多个属性的键值对
	 * 	@param  { String }			value	要设置一个属性的属性值
	 * 	@return { jQuery }					当前的 jQuery 对象
	 */
	attr: function( name, value ) {
		/**
		 * 	调用 jQuery.access 方法，并传递五个参数
		 * 		参数一：当前 jQuery 对象
		 * 		参数二：jQuery.attr 方法，这个方法在 access 中会被执行
		 * 		参数三：设置一个属性的属性名或者多个属性的键值对集合
		 * 		参数四：设置一个属性的属性值
		 * 		参数五：参数个数是否大于 1 的布尔值
		 */
		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	/**
	 * 	@param  { String } 	name 	要删除的属性名
	 */
	removeAttr: function( name ) {
		/**
		 * 	遍历当前 jQuery 对象中的所有 DOM 元素，为每一个 DOM 元素执行一次 jQuery.removeAttr 方法
		 * 	将当前的 DOM 元素和参数 name 作为参数传递 
		 */
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	},

	prop: function( name, value ) {
		return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		return this.each(function() {
			delete this[ jQuery.propFix[ name ] || name ];
		});
	},

	addClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			//  1.  判断参数是否是字符串，如果是的话，将参数保存在 proceed 变量中
			proceed = typeof value === "string" && value;

		/**
		 * 	2.  判断参数是否是函数
		 */
		if ( jQuery.isFunction( value ) ) {
			/**
			 * 	如果是函数的话，那么首先遍历当前 jQuery 中的所有 DOM 元素
			 * 	遍历过程中，先调用参数函数，并将其作用域设置为当前的 DOM 元素，并传递当前 DOM 元素在 jQuery 实例中的索引和当前 DOM 元素的 class 属性为参数
			 * 		然后将当前 DOM 元素转换为 jQuery 对象并调用 addClass 方法，将参数的返回值作为参数
			 */
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call( this, j, this.className ) );
			});
		}

		/**
		 * 	3.  判断提供的字符串参数是否不为空
		 */
		if ( proceed ) {
			//  3.1 将字符串参数按照空格匹配，保存在一个数组中，并将数组的引用保存在 classes 中
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			//  3.2 遍历当前 jQuery 对象中的 DOM 元素
			for ( ; i < len; i++ ) {
				elem = this[ i ];   
				/**
				 * 	判断当前遍历的是否是元素节点
				 * 		如果是的话，再判断当前元素的 class 是否有内容
				 * 			如果有，则将内容首尾加上空格，并将制表符、回车换行等替换为空格，将结果保存在 cur 中
				 * 			如果没有，则直接将空格字符串赋给 cur
				 */
				cur = elem.nodeType === 1 && ( elem.className 
					? ( " " + elem.className + " " ).replace( rclass, " " )
					: " "
				);

				if ( cur ) {
					/**
					 * 	遍历 classes 数组
					 * 	查看 cur 中是否有数组中的每个元素
					 * 		如果没有，则将当前元素 + 空格直接拼在 cur 字符串的后面
					 */
					j = 0;
					while ( (clazz = classes[j++]) ) {
						if ( cur.indexOf( " " + clazz + " " ) < 0 ) {
							cur += clazz + " ";
						}
					}
					// 	将 cur 去除首尾空格后的值，直接赋给当前 DOM 元素的 class
					elem.className = jQuery.trim( cur );

				}
			}
		}
		// 返回当前 jQuery 实例，以供链式调用
		return this;
	},

	removeClass: function( value ) {
		var classes, elem, cur, clazz, j,
			i = 0,
			len = this.length,
			/**
			 * 	1.  判断是否传递了参数
			 * 		如果没传递，那么 proceed 就是 true
			 * 		如果传递了，再判断参数是否是字符串，如果是字符串，那么 proceed 就是参数字符串
			 */
			proceed = arguments.length === 0 || typeof value === "string" && value;

		/**
		 * 	2.  判断参数是否是函数
		 */
		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call( this, j, this.className ) );
			});
		}

		/**
		 * 	3.  判断 proceed 是否存在
		 * 		只有两种情况会进入 if
		 * 			第一：传入的是非空字符串
		 * 			第二：没有传递任何参数
		 */
		if ( proceed ) {
			//  将字符串参数按照空格分隔，并存在数组 classes 中
			classes = ( value || "" ).match( core_rnotwhite ) || [];

			//  遍历当前 jQuery 中的 DOM 元素
			for ( ; i < len; i++ ) {
				elem = this[ i ];

				/**
				 * 	判断当前遍历的是否是元素节点
				 * 		如果是的话，再判断当前元素的 class 是否有内容
				 * 			如果有，则将内容首尾加上空格，并将制表符、回车换行等替换为空格，将结果保存在 cur 中
				 * 			如果没有，则直接将空格字符串赋给 cur
				 */
				cur = elem.nodeType === 1 && ( elem.className ?
					( " " + elem.className + " " ).replace( rclass, " " ) :
					""
				);

				if ( cur ) {
					/**
					 * 	遍历 classes 数组
					 * 	查看 cur 中是否有数组中的每个元素
					 * 		如果有，则将这个元素从 cur 字符串中删除
					 */
					j = 0;
					while ( (clazz = classes[j++]) ) {
						while ( cur.indexOf( " " + clazz + " " ) >= 0 ) {
							cur = cur.replace( " " + clazz + " ", " " );
						}
					}

					/**
					 * 	判断是否提供了字符串参数
					 * 		如果有，则将 cur 去除首尾空格后的值赋给当前 DOM 的 class 属性
					 * 		如果没有，则将空字符串赋给当前 DOM 的 class 属性
					 */
					elem.className = value ? jQuery.trim( cur ) : "";
				}
			}
		}

		//  4.  返回当前 jQuery 对象，以供链式调用
		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value;

		/**
		 * 	1.  判断第二个参数是否是布尔值并且第一个参数是否是字符串，满足进入 if
		 * 			if 中会判断这个布尔值是 true 还是 false
		 * 			如果是 true，那么直接调用 addClass
		 * 			如果是 false，那么直接调用 removeClass
		 */
		if ( typeof stateVal === "boolean" && type === "string" ) {
			return stateVal ? this.addClass( value ) : this.removeClass( value );
		}

		/**
		 * 	2.  判断第一个参数是否是函数
		 */
		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		/**
		 * 	3.  处理以上情形之外的情况
		 * 		遍历当前 jQuery 对象中的所有 DOM 元素
		 */
		return this.each(function() {
			/**
			 * 	3.1 处理第一个参数为字符串的情况
			 */
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					//  3.1.1 将当前 DOM 元素转换为 jQuery 对象
					self = jQuery( this ),
					//  3.1.2 将字符串参数按照空格匹配，并将结果存在 classNames 数组中
					classNames = value.match( core_rnotwhite ) || [];

				/**
				 * 	3.1.3 循环 classNames 数组
				 * 		判断 classNsmes 数组中当前元素是否存在于当前 DOM 元素的 class 中
				 * 			如果存在，就将其删除
				 * 			如果不存在，就将其添加
				 */
				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					if ( self.hasClass( className ) ) {
						self.removeClass( className );
					} else {
						self.addClass( className );
					}
				}

			} 
			/**
			 * 	3.2 处理没有传递任何参数或者第一个参数为布尔值的情况
			 */
			else if ( type === core_strundefined || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					data_priv.set( this, "__className__", this.className );
					console.log( data_priv.cache )
				}

				// If the element has a class name or if we're passed "false",
				// then remove the whole classname (if there was one, the above saved it).
				// Otherwise bring back whatever was previously saved (if anything),
				// falling back to the empty string if nothing was stored.
				this.className = this.className || value === false ? "" : data_priv.get( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		//  1.  将参数首尾加上空格并保存在 className 变量中
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		/**
		 * 	2.  遍历当前 jQuery 实例中的 DOM 元素
		 * 		如果当前遍历的是元素节点，那么获取其 class 属性并在首尾加上空格，然后将其中的制表符、回车符、换行符等都替换为空格
		 * 		然后再从替换的结果查找是否存在 className 值
		 * 			如果存在，直接返回 true
		 * 			如果不存在，则进行下一次的遍历
		 */
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		//  3.  如果都没有，那么就返回 false
		return false;
	},

	/**
	 * 	@param  { String | Function | Array }  value  要设置的数据
	 */
	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		/**
		 *  1.  判断参数的个数，如果是 0，则代表此时是获取，进入 if
		 */
		if ( !arguments.length ) {
			if ( elem ) {
				/**
				 * 	1.1 获取 hooks 对象
				 * 		当 type 为 checkbox 或者 radio，或者是 select 元素、option 元素时会进行兼容的处理，获取 hooks 对象，此时获取的 hooks 对象就是 valHooks
				 */
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				/**
				 * 	1.2 判断是否有兼容处理的结果
				 * 		因为此时是在获取值，所以只需要判断 hooks 对象中是否存在 get 方法
				 * 			如果存在说明有兼容性要处理，兼容性的处理就在 get 方法中
				 * 			如果不存在就没有兼容性问题，直接执行后面的代码
				 */
				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				//  1.3 获取 elem 的 value 值并保存在 ret 中
				ret = elem.value;

				/**
				 * 	1.4 判断 ret 是否是字符串
				 * 		如果是的话，则将其中的回车符替换为空字符串，并返回
				 */
				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		/**
		 * 	2.  判断提供的参数是否是函数
		 */
		isFunction = jQuery.isFunction( value );

		/**
		 * 	3.  处理是设置值的情况，遍历当前 jQuery 对象中的每个 DOM 元素
		 */
		return this.each(function( i ) {
			var val;

			//  3.1 如果当前遍历的不是一个元素，那么直接退出方法
			if ( this.nodeType !== 1 ) {
				return;
			}

			/**
			 * 	3.2 处理参数为函数的情况
			 * 		如果是函数，则执行这个函数，将结果保存在 val 变量中，并将其作用域设置为当前的 DOM 元素，并传递两个参数
			 * 			参数一：当前 DOM 元素在 jQuery 对象中的索引
			 * 			参数二：当前 DOM 元素的 value 属性值
			 */
			if ( isFunction ) {
				val = value.call( this, i, jQuery( this ).val() );
			} 
			/**
			 * 	3.3 处理参数不是函数，即字符串的情况，直接将其赋值给 val 变量 
			 */
			else {
				val = value;
			}

			/**
			 * 	3.4 如果 val 的值为 null 或 undefined，则将其重新设置为空字符串
			 * 		只有两种情况才会进入这个 if
			 * 		情况一：调用该方法时显示传递 undefined 或者 null
			 * 		情况二：调用该方法时传递了一个函数，且这个函数没有返回值或者返回 undefined 或 null
			 */
			if ( val == null ) {
				val = "";
			} 
			/**
			 * 	3.5 如果 val 的值为数值，那么将其转换为字符串的形式
			 * 		只有两种情况才会进入这个 else if
			 * 		情况一：调用该方法时传递数值
			 * 		情况二：调用该方法时传递了一个函数，且这个函数返回值是数值
			 */
			else if ( typeof val === "number" ) {
				val += "";
			} 
			/**
			 * 	3.6 如果 val 为数组，那么将数组中的每个元素转换为字符串的形式，并将结果数组爆粗在 val 中
			 * 		只有两种情况才会进入这个 else if
			 * 		情况一：调用该方法时传递数组
			 * 		情况二：调用该方法时传递了一个函数，且这个函数返回值是数组
			 */
			else if ( jQuery.isArray( val ) ) {
				val = jQuery.map(val, function ( value ) {
					return value == null ? "" : value + "";
				});
			}

			/**
			 * 	3.7 获取 hooks 对象
			 * 		当 type 为 checkbox 或者 radio，或者是 select 元素、option 元素时会进行兼容的处理，获取 hooks 对象，此时获取的 hooks 对象就是 valHooks
			 */
			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			/**
			 * 	3.8 判断是否有兼容处理的结果
			 * 		因为此时是在设置值，所以只需要判断 hooks 对象中是否存在 set 方法
			 * 			如果存在说明有兼容性要处理，兼容性的处理就在 set 方法中
			 * 			如果不存在就没有兼容性问题，直接执行后面的代码
			 */
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				console.log( 999 )
				this.value = val;
			}
		});		
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				// attributes.value is undefined in Blackberry 4.7 but
				// uses .value. See #6932
				/**
				 * 	如果当前 option 元素没有 value 属性值，那么就获取其 text 值，即 option 标签内的文本
				 */
				var val = elem.attributes.value;
				return !val || val.specified ? elem.value : elem.text;
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					//  1.  获取 select 元素的 option 子元素的集合，该集合还是一个类数组
					options = elem.options,
					/**
					 * 	2.  获取当前默认选中的 option 子元素的索引
					 * 		如果 select 元素中没有 option 元素，那么该属性的值就是 -1
					 * 		如果 select 元素中有 option 元素并且没有给任何一个 option 元素添加 selected 属性，那么该属性的值就是 0，即默认选中第一个
					 * 		如果 select 元素中有 option 元素并且给其中一个 option 元素添加 selected 属性，那么该属性的值就是这个 option 元素的索引
					 */
					index = elem.selectedIndex,
					/**
					 * 	3.  判断 select 元素是否是单选的
					 * 			如果是，则将 one 变量设置为 true
					 */
					one = elem.type === "select-one" || index < 0,

					/**
					 * 	设置 values 变量的值
					 * 		如果当前 select 元素是单选的，那么就将 values 设置为 null，因为单选情况返回的是一个值
					 * 		而多选的话返回的是一组值，values 数组用于存储这组值
					 */
					values = one 
						? null 
						: [],

					/**
					 * 	5.  设置循环长度 max 变量
					 * 		如果 select 元素是单选的话，那么就将当前选中的 option 的索引再加 1 并存储到 max 变量中，这样之后的 for 循环就可以只循环一次，也就是被选中的 option 元素
					 */
					max = one 
						? index + 1 
						: options.length,

					/**
					 * 	6.  设置循环变量 i
					 * 		如果 select 元素中没有一个 option 元素，那么就将 max 的变量赋给 i
					 * 		如果 select 元素中有 option 元素，并且 select 元素单选的话，那么就将 select 元素的 selectedIndex 值赋给 i
					 * 		如果 select 元素中有 option 元素，并且 select 元素复选的话，那么就将 i 的值设置为 0
					 */
					i = index < 0 
						? max
						: one 
							? index 
							: 0;
					console.log( options );

				/**
				 * 	循环当前选中的 option 元素
				 */
				for ( ; i < max; i++ ) {
					// 	获取当前选中的 option 元素
					option = options[ i ];

					// IE6-9 doesn't update selected after form reset (#2551)
					/**
					 * 	判断 option 元素是否被选中；如果被选中，那么 selected 就是 true，否则就是 false
					 * 	如果 option 被选中，再判断 jQuery.support.optDisabled 是否是 true，在老版本的 webkit 浏览器中，该值是 false，在目前的浏览器中，该值都是 true
					 * 		如果该值是 true，那么会再判断 option 元素是否被禁用
					 * 			如果被禁用，不会进入 if，直接返回 values，此时 values 是 null。因为 option 元素被禁用的话是获取不到其值的
					 * 			如果没有被禁用，再判断 option 的父元素，也就是 select 元素是否被禁用
					 * 				如果 select 元素没有被禁用，那么就进入 if 中
					 * 				如果 select 元素被禁用了，那么再判断 option 父元素是否是 optgroup 元素
					 * 					如果是，则不会进入 if，直接返回 values
					 * 					如果不是，则进入 if
					 * 		如果该值是 false，
					 * 
					 * 	在 if 中，首先通过 val 方法获取 option 元素的 value 属性值（ 如果没有 value 就是 text 值 ），将结果保存在 value 变量中
					 * 	然后 one 是否是 true
					 * 		如果是的话，说明当前 select 元素是单选，直接返回 value 变量
					 * 		如果不是，说明当前 select 元素是复选，将 value 变量的值 push 到 values 数组中，等到循环结束，直接返回 values 数组
					 */
					// console.log( option.parentNode.disabled )
					if ( ( option.selected || i === index ) &&
							( jQuery.support.optDisabled 
								? !option.disabled 
								: option.getAttribute("disabled") === null ) && 
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// 获取当前 option 元素的 value 属性值（ 如果没有 value 就获取其文本 ）
						value = jQuery( option ).val();

						// 如果 select 是单选的，那么就直接返回获取到 option 元素的属性值
						if ( one ) {
							return value;
						}

						// 如果 select 是复选的，将当前 option 元素的属性值 push 到 values 数组中
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var optionSet, option,
					options = elem.options,
					values = jQuery.makeArray( value ),
					i = options.length;

				while ( i-- ) {
					option = options[ i ];
					if ( (option.selected = jQuery.inArray( jQuery(option).val(), values ) >= 0) ) {
						optionSet = true;
					}
				}

				// force browsers to behave consistently when non-matching value is set
				if ( !optionSet ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	/**
	 * 	@param  { Element }	elem	要设置属性的 DOM 元素
	 * 	@param  { String }	name	要设置的属性名
	 * 	@param  { String }	value	要设置的属性值
	 */
	attr: function( elem, name, value ) {
		var hooks, ret,
			nType = elem.nodeType;	// 保存节点的类型

		/**
		 *  1.  首先判断 elem 是否存在
		 * 		如果存在，则再判断其是否是属性节点、文本节点、注释节点，如果是其中的一种，直接退出
		 * 		因为在这三种节点上是无法设置/获取属性的
		 */
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		/**
		 * 	2.  判断 elem 节点是否存在 getAttribute 方法，如果不存在，则调用 jQuery.prop 方法来实现
		 * 		像 document 这样的节点就不存在这个方法，所以此时就要通过 jQuery.prop 来方法给 document 添加属性
		 */
		if ( typeof elem.getAttribute === core_strundefined ) {
			return jQuery.prop( elem, name, value );
		}

		/**
		 * 	3.  判断 elem 是否是 HTML 元素，而不是 XML 元素；如果满足，进入 if
		 * 		这一步主要是根据设置的属性来获取不同的 hooks 对象
		 */
		if ( nType !== 1 || !jQuery.isXMLDoc( elem ) ) {
			/**
			 * 	将需要添加的属性名称转小写，并根据 name 来获取不同的钩子对象
			 * 		如果添加的是 type 属性，那么获取的 hooks 就是 attrHook 对象
			 * 		如果添加的是上面 16 种中的一种属性，那么获取的 hooks 就是 boolHook 对象（ 通过 jQuery.expr.match.bool 正则来检验是否是上述的 16 种情况之一 ）
			 * 		除此之外，获得的 hooks 都是 nodeHook 对象（ nodeHook 就是 undefined ）
			 */
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] ||
				( jQuery.expr.match.bool.test( name ) ? boolHook : nodeHook );
		}

		/**
		 *  4.  判断是否有要添加属性的值，如果提供属性值不是 undefined，则意味着要对属性处理，进入 if	
		 */
		if ( value !== undefined ) {
			/**
			 *  4.1 如果属性的值为 null，则调用 jQuery.removeAttr 方法将该属性删除 
			 */
			if ( value === null ) {
				jQuery.removeAttr( elem, name );
			} 
			/**
			 *  4.2 判断 hooks 对象是否存在
			 * 		只有当设置的属性是 type 或者上面 16 种之一时，hooks 对象才存在，剩余的属性 hooks 对象都是 undefined
			 * 		如果 hooks 对象存在，则再判断其中是否有 set 属性，boolHook 和 attrHook 中都存在 set 方法，所以进一步会调用 set 方法，并将要设置的 DOM 元素、属性名和属性值作为参数传递，并判断 set 的返回值是否是 undefined
			 * 			如果不是 undefined，则直接返回这个值
			 */
			else if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;
			} 
			/**
			 * 	4.3 处理前两种情况之外的情况，例如设置 class，id 等属性的时候会走这个 else
			 * 		直接通过原生方法 setAttribute 为 DOM 元素添加属性
			 */
			else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
			return ret;
		} else {
			ret = jQuery.find.attr( elem, name );

			// Non-existent attributes return null, we normalize to undefined
			return ret == null ?
				undefined :
				ret;
		}
	},

	/**
	 * 	@param  { Element }	elem	删除属性的 DOM 元素
	 * 	@param  { String }	value	删除属性的属性名，如果有多个以空格分开
	 */
	removeAttr: function( elem, value ) {
		var name, propName,
			i = 0,
			//  1.  将参数 value 按照空格匹配，将匹配到的结果数组保存在 attrNames 中 
			attrNames = value && value.match( core_rnotwhite );

		/**
		 * 	判断是否有匹配结果，并且 elem 是元素节点
		 */
		if ( attrNames && elem.nodeType === 1 ) {
			/**
			 * 	遍历 attrNames 数组
			 * 		调用原生方法 removeAttribute 将数组中的每个属性移除
			 */
			while ( (name = attrNames[i++]) ) {
				propName = jQuery.propFix[ name ] || name;

				// Boolean attributes get special treatment (#10870)
				if ( jQuery.expr.match.bool.test( name ) ) {
					// Set corresponding property to false
					elem[ propName ] = false;
				}

				elem.removeAttribute( name );
			}
		}
	},

	attrHooks: {
		type: {
			/**
			 * 	@param  { Element }	elem	操作的 DOM 元素
			 * 	@param  { String }	value	设置的属性值
			 */
			set: function( elem, value ) {
				/**
				 * 	1.  首先判断是否存在兼容性（ 根据 jQuery.support.radioValue 的值，这个值代表的是一个 type 为 text 的 input 输入框，在对其设置一个 value 属性后，再将其 type 设置为单选框，即 radio，此时，这个 input 的 value 值是否是原来设置过的值，在 IE 下，其值为 on（ 此值为 false ），在非 IE 下，其值还是原来的值（ 此值为 true ） ）
				 * 		如果存在兼容性，即处于 IE 下，则再判断此时要设置的属性值是否是 radio 并且要设置的元素标签是否是 input 标签，如果都满足，则进入 if
				 */
				if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					/**
					 * 	首先将此时 input 的 value 值保存下来，如果在设置 input 的 type 为 radio 之前，input 已经存在了 value 值，那么就将其值保存在 val 变量中
					 * 	然后通过 setAttribute 方法将 input 的 type 改为 radio
					 * 	然后再判断修改 input 的 type 之前是否存在 value 值
					 * 		如果之前存在，则将此时 input 的 value 设置为之前的 value 值，改变了 IE 下 value 为 on 的情况
					 * 		如果之前不存在，则不进行操作
					 */
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}

					// 	返回 value 值，也就是字符串 radio
					return value;
				}
			}
		}
	},

	propFix: {
		"for": "htmlFor",
		"class": "className"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			return hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ?
				ret :
				( elem[ name ] = value );

		} else {
			return hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ?
				ret :
				elem[ name ];
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				return elem.hasAttribute( "tabindex" ) || rfocusable.test( elem.nodeName ) || elem.href ?
					elem.tabIndex :
					-1;
			}
		}
	}
});

// Hooks for boolean attributes
boolHook = {
	/**
	 * 	@param  { Element }	elem	操作的 DOM 元素
	 * 	@param  { Boolean }	value	属性值，是一个布尔值
	 * 	@param  { String }	name	属性名
	 */
	set: function( elem, value, name ) {
		/**
		 * 	判断属性值是 false 还是 true
		 * 		如果是 false，则调用 $.removeAttr 方法，将该属性移除
		 * 		如果是 true，则为 DOM 元素设置该属性，且属性名和属性值相同
		 */
		if ( value === false ) {
			jQuery.removeAttr( elem, name );
		} else {
			elem.setAttribute( name, name );
		}

		// 	返回属性名
		return name;
	}
};

jQuery.each( jQuery.expr.match.bool.source.match( /\w+/g ), function( i, name ) {
	var getter = jQuery.expr.attrHandle[ name ] || jQuery.find.attr;

	jQuery.expr.attrHandle[ name ] = function( elem, name, isXML ) {
		var fn = jQuery.expr.attrHandle[ name ],
			ret = isXML ?
				undefined :
				/* jshint eqeqeq: false */
				// Temporarily disable this handler to check existence
				(jQuery.expr.attrHandle[ name ] = undefined) !=
					getter( elem, name, isXML ) ?

					name.toLowerCase() :
					null;

		// Restore handler
		jQuery.expr.attrHandle[ name ] = fn;

		return ret;
	};
});

// Support: IE9+
// Selectedness for an option in an optgroup can be inaccurate
if ( !jQuery.support.optSelected ) {
	jQuery.propHooks.selected = {
		get: function( elem ) {
			var parent = elem.parentNode;
			if ( parent && parent.parentNode ) {
				parent.parentNode.selectedIndex;
			}
			return null;
		}
	};
}

jQuery.each([
	"tabIndex",
	"readOnly",
	"maxLength",
	"cellSpacing",
	"cellPadding",
	"rowSpan",
	"colSpan",
	"useMap",
	"frameBorder",
	"contentEditable"
], function() {
	jQuery.propFix[ this.toLowerCase() ] = this;
});

// 向 valHooks 中添加 radio 和 checkbox 的兼容性处理
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = {
		/**
		 * 	radio 和 checkbox 在 valHooks 中的 set 方法
		 * 	@param  { Element }	elem	操作的 DOM 元素	
		 * 	@param  { Any }		elem	设置的值，该值只有是数组的情况下才有效
		 * 	@return { Boolean }			操作的 DOM 元素是否被选中的布尔值
		 */
		set: function( elem, value ) {
			/**
			 * 	判断提供的值是否是数组
			 * 		如果不是的话，则直接退出函数	
			 * 		如果是的话，判断当前操作的 DOM 元素的 value 值是否存在于这个数组中
			 * 			如果存在，则将当前 DOM 元素的 checked 属性设置为 true，即被选中
			 * 			如果不存在，则将当前 DOM 元素的 checked 属性设置为 false，即未被选中
			 */
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	};
	/**
	 * 	判断 radio 和 checkbox 的默认值（ value 属性值 ）是否是空字符串，只有在老版本的 webkit 浏览器中，其默认值是 空字符串，其他浏览器都是 "on"
	 * 	如果当前是老版本的 webkit 浏览器，进入 if
	 */
	if ( !jQuery.support.checkOn ) {
		/**
		 * 	radio 和 checkbox 在 valHooks 中的 get 方法（ 只在老版本的 webkit 中存在 ）
		 * 	@param  { Element }	elem	操作的 DOM 元素	
		 * 	@return { String }			DOM 元素本身的 value 属性值，如果没有则是字符串 on
		 */
		jQuery.valHooks[ this ].get = function( elem ) {
			/**
			 * 	判断此时 DOM 元素是否提供了 value 属性
			 * 		如果没有提供，则返回字符串 on，兼容其他浏览器都返回字符串 on
			 * 		如果提供了，则返回提供的属性值
			 */
			return elem.getAttribute("value") === null 
				? "on" 
				: elem.value;
		};
	}
});

var rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	rtypenamespace = /^([^.]*)(?:\.(.+)|)$/;

function returnTrue() {
	return true;
}

function returnFalse() {
	return false;
}

function safeActiveElement() {
	try {
		return document.activeElement;
	} catch ( err ) { }
}

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	global: {},

	add: function( elem, types, handler, data, selector ) {

		var handleObjIn, eventHandle, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.get( elem );

		// Don't attach events to noData or text/comment nodes (but allow plain objects)
		if ( !elemData ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		if ( !(events = elemData.events) ) {
			events = elemData.events = {};
		}
		if ( !(eventHandle = elemData.handle) ) {
			eventHandle = elemData.handle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== core_strundefined && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// There *must* be a type, no attaching namespace-only handlers
			if ( !type ) {
				continue;
			}

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: origType,
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			if ( !(handlers = events[ type ]) ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var j, origCount, tmp,
			events, t, handleObj,
			special, handlers, type, namespaces, origType,
			elemData = data_priv.hasData( elem ) && data_priv.get( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = ( types || "" ).match( core_rnotwhite ) || [""];
		t = types.length;
		while ( t-- ) {
			tmp = rtypenamespace.exec( types[t] ) || [];
			type = origType = tmp[1];
			namespaces = ( tmp[2] || "" ).split( "." ).sort();

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector ? special.delegateType : special.bindType ) || type;
			handlers = events[ type ] || [];
			tmp = tmp[2] && new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" );

			// Remove matching events
			origCount = j = handlers.length;
			while ( j-- ) {
				handleObj = handlers[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					( !handler || handler.guid === handleObj.guid ) &&
					( !tmp || tmp.test( handleObj.namespace ) ) &&
					( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					handlers.splice( j, 1 );

					if ( handleObj.selector ) {
						handlers.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( origCount && !handlers.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;
			data_priv.remove( elem, "events" );
		}
	},

	trigger: function( event, data, elem, onlyHandlers ) {

		var i, cur, tmp, bubbleType, ontype, handle, special,
			eventPath = [ elem || document ],
			type = core_hasOwn.call( event, "type" ) ? event.type : event,
			namespaces = core_hasOwn.call( event, "namespace" ) ? event.namespace.split(".") : [];

		cur = tmp = elem = elem || document;

		// Don't do events on text and comment nodes
		if ( elem.nodeType === 3 || elem.nodeType === 8 ) {
			return;
		}

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf(".") >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}
		ontype = type.indexOf(":") < 0 && "on" + type;

		// Caller can pass in a jQuery.Event object, Object, or just an event type string
		event = event[ jQuery.expando ] ?
			event :
			new jQuery.Event( type, typeof event === "object" && event );

		// Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)
		event.isTrigger = onlyHandlers ? 2 : 3;
		event.namespace = namespaces.join(".");
		event.namespace_re = event.namespace ?
			new RegExp( "(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) :
			null;

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data == null ?
			[ event ] :
			jQuery.makeArray( data, [ event ] );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( !onlyHandlers && special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			if ( !rfocusMorph.test( bubbleType + type ) ) {
				cur = cur.parentNode;
			}
			for ( ; cur; cur = cur.parentNode ) {
				eventPath.push( cur );
				tmp = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( tmp === (elem.ownerDocument || document) ) {
				eventPath.push( tmp.defaultView || tmp.parentWindow || window );
			}
		}

		// Fire handlers on the event path
		i = 0;
		while ( (cur = eventPath[i++]) && !event.isPropagationStopped() ) {

			event.type = i > 1 ?
				bubbleType :
				special.bindType || type;

			// jQuery handler
			handle = ( data_priv.get( cur, "events" ) || {} )[ event.type ] && data_priv.get( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}

			// Native handler
			handle = ontype && cur[ ontype ];
			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( eventPath.pop(), data ) === false) &&
				jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Don't do default actions on window, that's where global variables be (#6170)
				if ( ontype && jQuery.isFunction( elem[ type ] ) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					tmp = elem[ ontype ];

					if ( tmp ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( tmp ) {
						elem[ ontype ] = tmp;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event );

		var i, j, ret, matched, handleObj,
			handlerQueue = [],
			args = core_slice.call( arguments ),
			handlers = ( data_priv.get( this, "events" ) || {} )[ event.type ] || [],
			special = jQuery.event.special[ event.type ] || {};

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers
		handlerQueue = jQuery.event.handlers.call( this, event, handlers );

		// Run delegates first; they may want to stop propagation beneath us
		i = 0;
		while ( (matched = handlerQueue[ i++ ]) && !event.isPropagationStopped() ) {
			event.currentTarget = matched.elem;

			j = 0;
			while ( (handleObj = matched.handlers[ j++ ]) && !event.isImmediatePropagationStopped() ) {

				// Triggered event must either 1) have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( !event.namespace_re || event.namespace_re.test( handleObj.namespace ) ) {

					event.handleObj = handleObj;
					event.data = handleObj.data;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						if ( (event.result = ret) === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	handlers: function( event, handlers ) {
		var i, matches, sel, handleObj,
			handlerQueue = [],
			delegateCount = handlers.delegateCount,
			cur = event.target;

		// Find delegate handlers
		// Black-hole SVG <use></use> instance trees (#13180)
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && cur.nodeType && (!event.button || event.type !== "click") ) {

			for ( ; cur !== this; cur = cur.parentNode || this ) {

				// Don't process clicks on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.disabled !== true || event.type !== "click" ) {
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];

						// Don't conflict with Object.prototype properties (#13203)
						sel = handleObj.selector + " ";

						if ( matches[ sel ] === undefined ) {
							matches[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( matches[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, handlers: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( delegateCount < handlers.length ) {
			handlerQueue.push({ elem: this, handlers: handlers.slice( delegateCount ) });
		}

		return handlerQueue;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	props: "altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var eventDoc, doc, body,
				button = original.button;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop, copy,
			type = event.type,
			originalEvent = event,
			fixHook = this.fixHooks[ type ];

		if ( !fixHook ) {
			this.fixHooks[ type ] = fixHook =
				rmouseEvent.test( type ) ? this.mouseHooks :
				rkeyEvent.test( type ) ? this.keyHooks :
				{};
		}
		copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = new jQuery.Event( originalEvent );

		i = copy.length;
		while ( i-- ) {
			prop = copy[ i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Support: Cordova 2.5 (WebKit) (#13255)
		// All events should have a target; Cordova deviceready doesn't
		if ( !event.target ) {
			event.target = document;
		}

		// Support: Safari 6.0+, Chrome < 28
		// Target should not be a text node (#504, #13143)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},
		focus: {
			// Fire native event if possible so blur/focus sequence is correct
			trigger: function() {
				if ( this !== safeActiveElement() && this.focus ) {
					this.focus();
					return false;
				}
			},
			delegateType: "focusin"
		},
		blur: {
			trigger: function() {
				if ( this === safeActiveElement() && this.blur ) {
					this.blur();
					return false;
				}
			},
			delegateType: "focusout"
		},
		click: {
			// For checkbox, fire native event so checked state will be right
			trigger: function() {
				if ( this.type === "checkbox" && this.click && jQuery.nodeName( this, "input" ) ) {
					this.click();
					return false;
				}
			},

			// For cross-browser consistency, don't fire native .click() on links
			_default: function( event ) {
				return jQuery.nodeName( event.target, "a" );
			}
		},

		beforeunload: {
			postDispatch: function( event ) {

				// Support: Firefox 20+
				// Firefox doesn't alert if the returnValue field is not set.
				if ( event.result !== undefined ) {
					event.originalEvent.returnValue = event.result;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{
				type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

jQuery.removeEvent = function( elem, type, handle ) {
	if ( elem.removeEventListener ) {
		elem.removeEventListener( type, handle, false );
	}
};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = ( src.defaultPrevented ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	preventDefault: function() {
		var e = this.originalEvent;

		this.isDefaultPrevented = returnTrue;

		if ( e && e.preventDefault ) {
			e.preventDefault();
		}
	},
	stopPropagation: function() {
		var e = this.originalEvent;

		this.isPropagationStopped = returnTrue;

		if ( e && e.stopPropagation ) {
			e.stopPropagation();
		}
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	}
};

// Create mouseenter/leave events using mouseover/out and event-time checks
// Support: Chrome 15+
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// Create "bubbling" focus and blur events
// Support: Firefox, Chrome, Safari
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				if ( attaches++ === 0 ) {
					document.addEventListener( orig, handler, true );
				}
			},
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) {
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		var elem = this[0];
		if ( elem ) {
			return jQuery.event.trigger( type, data, elem, true );
		}
	}
});
var isSimple = /^.[^:#\[\.,]*$/,
	rparentsprev = /^(?:parents|prev(?:Until|All))/,
	rneedsContext = jQuery.expr.match.needsContext,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
	find: function( selector ) {
		var i,
			ret = [],
			self = this,
			len = self.length;

		if ( typeof selector !== "string" ) {
			return this.pushStack( jQuery( selector ).filter(function() {
				for ( i = 0; i < len; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			}) );
		}

		for ( i = 0; i < len; i++ ) {
			jQuery.find( selector, self[ i ], ret );
		}

		// Needed because $( selector, context ) becomes $( context ).find( selector )
		ret = this.pushStack( len > 1 ? jQuery.unique( ret ) : ret );
		ret.selector = this.selector ? this.selector + " " + selector : selector;
		return ret;
	},

	has: function( target ) {
		var targets = jQuery( target, this ),
			l = targets.length;

		return this.filter(function() {
			var i = 0;
			for ( ; i < l; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector || [], true) );
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector || [], false) );
	},

	is: function( selector ) {
		return !!winnow(
			this,

			// If this is a positional/relative selector, check membership in the returned set
			// so $("p:first").is("p:last") won't return true for a doc with two "p".
			typeof selector === "string" && rneedsContext.test( selector ) ?
				jQuery( selector ) :
				selector || [],
			false
		).length;
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			matched = [],
			pos = ( rneedsContext.test( selectors ) || typeof selectors !== "string" ) ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			for ( cur = this[i]; cur && cur !== context; cur = cur.parentNode ) {
				// Always skip document fragments
				if ( cur.nodeType < 11 && (pos ?
					pos.index(cur) > -1 :

					// Don't pass non-elements to Sizzle
					cur.nodeType === 1 &&
						jQuery.find.matchesSelector(cur, selectors)) ) {

					cur = matched.push( cur );
					break;
				}
			}
		}

		return this.pushStack( matched.length > 1 ? jQuery.unique( matched ) : matched );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[ 0 ] && this[ 0 ].parentNode ) ? this.first().prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return core_indexOf.call( jQuery( elem ), this[ 0 ] );
		}

		// Locate the position of the desired element
		return core_indexOf.call( this,

			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[ 0 ] : elem
		);
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context ) :
				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( jQuery.unique(all) );
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

function sibling( cur, dir ) {
	while ( (cur = cur[dir]) && cur.nodeType !== 1 ) {}

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return elem.contentDocument || jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var matched = jQuery.map( this, fn, until );

		if ( name.slice( -5 ) !== "Until" ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			matched = jQuery.filter( selector, matched );
		}

		if ( this.length > 1 ) {
			// Remove duplicates
			if ( !guaranteedUnique[ name ] ) {
				jQuery.unique( matched );
			}

			// Reverse order for parents* and prev-derivatives
			if ( rparentsprev.test( name ) ) {
				matched.reverse();
			}
		}

		return this.pushStack( matched );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		var elem = elems[ 0 ];

		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 && elem.nodeType === 1 ?
			jQuery.find.matchesSelector( elem, expr ) ? [ elem ] : [] :
			jQuery.find.matches( expr, jQuery.grep( elems, function( elem ) {
				return elem.nodeType === 1;
			}));
	},

	dir: function( elem, dir, until ) {
		var matched = [],
			truncate = until !== undefined;

		while ( (elem = elem[ dir ]) && elem.nodeType !== 9 ) {
			if ( elem.nodeType === 1 ) {
				if ( truncate && jQuery( elem ).is( until ) ) {
					break;
				}
				matched.push( elem );
			}
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var matched = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				matched.push( n );
			}
		}

		return matched;
	}
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, not ) {
	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep( elements, function( elem, i ) {
			/* jshint -W018 */
			return !!qualifier.call( elem, i, elem ) !== not;
		});

	}

	if ( qualifier.nodeType ) {
		return jQuery.grep( elements, function( elem ) {
			return ( elem === qualifier ) !== not;
		});

	}

	if ( typeof qualifier === "string" ) {
		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter( qualifier, elements, not );
		}

		qualifier = jQuery.filter( qualifier, elements );
	}

	return jQuery.grep( elements, function( elem ) {
		return ( core_indexOf.call( qualifier, elem ) >= 0 ) !== not;
	});
}
var rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+) ,="" rhtml="/<|&#?\w+;/," rnoinnerhtml="/<(?:script|style|link)/i," manipulation_rcheckabletype="/^(?:checkbox|radio)$/i," checked="checked" or="" rchecked="/checked\s*(?:[^=]|=\s*.checked.)/i," rscripttype="/^$|\/(?:java|ecma)script/i," rscripttypemasked="/^true\/(.*)/," rcleanscript="/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)">\s*$/g,

	// We have to close these tags to support XHTML (#13200)
	wrapMap = {

		// Support: IE 9
		option: [ 1, "<select multiple="multiple">", "</select>" ],

		thead: [ 1, "<table>", "</table>" ],
		col: [ 2, "<table><colgroup>", "</colgroup></table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],

		_default: [ 0, "", "" ]
	};

// Support: IE 9
wrapMap.optgroup = wrapMap.option;

wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

jQuery.fn.extend({
	text: function( value ) {
		return jQuery.access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[ 0 ] && this[ 0 ].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	append: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9 ) {
				var target = manipulationTarget( this, elem );
				target.insertBefore( elem, target.firstChild );
			}
		});
	},

	before: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this );
			}
		});
	},

	after: function() {
		return this.domManip( arguments, function( elem ) {
			if ( this.parentNode ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			}
		});
	},

	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		var elem,
			elems = selector ? jQuery.filter( selector, this ) : this,
			i = 0;

		for ( ; (elem = elems[i]) != null; i++ ) {
			if ( !keepData && elem.nodeType === 1 ) {
				jQuery.cleanData( getAll( elem ) );
			}

			if ( elem.parentNode ) {
				if ( keepData && jQuery.contains( elem.ownerDocument, elem ) ) {
					setGlobalEval( getAll( elem, "script" ) );
				}
				elem.parentNode.removeChild( elem );
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( elem.nodeType === 1 ) {

				// Prevent memory leaks
				jQuery.cleanData( getAll( elem, false ) );

				// Remove any remaining nodes
				elem.textContent = "";
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function () {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return jQuery.access( this, function( value ) {
			var elem = this[ 0 ] || {},
				i = 0,
				l = this.length;

			if ( value === undefined && elem.nodeType === 1 ) {
				return elem.innerHTML;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				!wrapMap[ ( rtagName.exec( value ) || [ "", "" ] )[ 1 ].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1>" );

				try {
					for ( ; i < l; i++ ) {
						elem = this[ i ] || {};

						// Remove element nodes and prevent memory leaks
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( getAll( elem, false ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch( e ) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function() {
		var
			// Snapshot the DOM in case .domManip sweeps something relevant into its fragment
			args = jQuery.map( this, function( elem ) {
				return [ elem.nextSibling, elem.parentNode ];
			}),
			i = 0;

		// Make the changes, replacing each context element with the new content
		this.domManip( arguments, function( elem ) {
			var next = args[ i++ ],
				parent = args[ i++ ];

			if ( parent ) {
				// Don't use the snapshot next if it has moved (#13810)
				if ( next && next.parentNode !== parent ) {
					next = this.nextSibling;
				}
				jQuery( this ).remove();
				parent.insertBefore( elem, next );
			}
		// Allow new content to include elements from the context set
		}, true );

		// Force removal if there was no new content (e.g., from empty arguments)
		return i ? this : this.remove();
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, callback, allowIntersection ) {

		// Flatten any nested arrays
		args = core_concat.apply( [], args );

		var fragment, first, scripts, hasScripts, node, doc,
			i = 0,
			l = this.length,
			set = this,
			iNoClone = l - 1,
			value = args[ 0 ],
			isFunction = jQuery.isFunction( value );

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( isFunction || !( l <= 0="" 1="" ||="" typeof="" value="" !="=" "string"="" jquery.support.checkclone="" !rchecked.test(="" )="" {="" return="" this.each(function(="" index="" var="" self="set.eq(" );="" if="" (="" isfunction="" args[="" ]="value.call(" this,="" index,="" self.html()="" }="" self.dommanip(="" args,="" callback,="" allowintersection="" });="" l="" fragment="jQuery.buildFragment(" this[="" ].ownerdocument,="" false,="" !allowintersection="" &&="" this="" first="fragment.firstChild;" fragment.childnodes.length="==" scripts="jQuery.map(" getall(="" fragment,="" "script"="" ),="" disablescript="" hasscripts="scripts.length;" use="" the="" original="" for="" last="" item="" instead="" of="" because="" it="" can="" end="" up="" being="" emptied="" incorrectly="" in="" certain="" situations="" (#8070).="" ;="" i="" <="" l;="" i++="" node="fragment;" inoclone="" node,="" true,="" true="" keep="" references="" to="" cloned="" later="" restoration="" support:="" qtwebkit="" jquery.merge="" core_push.apply(_,="" arraylike)="" throws="" jquery.merge(="" scripts,="" callback.call(="" ],="" doc="scripts[" scripts.length="" -="" ].ownerdocument;="" reenable="" jquery.map(="" restorescript="" evaluate="" executable="" on="" document="" insertion="" hasscripts;="" ];="" rscripttype.test(="" node.type="" ""="" !data_priv.access(="" "globaleval"="" jquery.contains(="" doc,="" node.src="" hope="" ajax="" is="" available...="" jquery._evalurl(="" else="" jquery.globaleval(="" node.textcontent.replace(="" rcleanscript,="" this;="" jquery.each({="" appendto:="" "append",="" prependto:="" "prepend",="" insertbefore:="" "before",="" insertafter:="" "after",="" replaceall:="" "replacewith"="" },="" function(="" name,="" jquery.fn[="" name="" selector="" elems,="" ret="[]," insert="jQuery(" 1,="" elems="i" =="=" ?="" :="" this.clone(="" jquery(="" insert[="" )[="" ](="" .get()="" core_push.apply(="" ret,="" elems.get()="" this.pushstack(="" };="" jquery.extend({="" clone:="" elem,="" dataandevents,="" deepdataandevents="" i,="" l,="" srcelements,="" destelements,="" clone="elem.cloneNode(" inpage="jQuery.contains(" elem.ownerdocument,="" elem="" ie="">= 9
		// Fix Cloning issues
		if ( !jQuery.support.noCloneChecked && ( elem.nodeType === 1 || elem.nodeType === 11 ) && !jQuery.isXMLDoc( elem ) ) {

			// We eschew Sizzle here for performance reasons: http://jsperf.com/getall-vs-sizzle/2
			destElements = getAll( clone );
			srcElements = getAll( elem );

			for ( i = 0, l = srcElements.length; i < l; i++ ) {
				fixInput( srcElements[ i ], destElements[ i ] );
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			if ( deepDataAndEvents ) {
				srcElements = srcElements || getAll( elem );
				destElements = destElements || getAll( clone );

				for ( i = 0, l = srcElements.length; i < l; i++ ) {
					cloneCopyEvent( srcElements[ i ], destElements[ i ] );
				}
			} else {
				cloneCopyEvent( elem, clone );
			}
		}

		// Preserve script evaluation history
		destElements = getAll( clone, "script" );
		if ( destElements.length > 0 ) {
			setGlobalEval( destElements, !inPage && getAll( elem, "script" ) );
		}

		// Return the cloned set
		return clone;
	},

	buildFragment: function( elems, context, scripts, selection ) {
		var elem, tmp, tag, wrap, contains, j,
			i = 0,
			l = elems.length,
			fragment = context.createDocumentFragment(),
			nodes = [];

		for ( ; i < l; i++ ) {
			elem = elems[ i ];

			if ( elem || elem === 0 ) {

				// Add nodes directly
				if ( jQuery.type( elem ) === "object" ) {
					// Support: QtWebKit
					// jQuery.merge because core_push.apply(_, arraylike) throws
					jQuery.merge( nodes, elem.nodeType ? [ elem ] : elem );

				// Convert non-html into a text node
				} else if ( !rhtml.test( elem ) ) {
					nodes.push( context.createTextNode( elem ) );

				// Convert html into DOM nodes
				} else {
					tmp = tmp || fragment.appendChild( context.createElement("div") );

					// Deserialize a standard representation
					tag = ( rtagName.exec( elem ) || ["", ""] )[ 1 ].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					tmp.innerHTML = wrap[ 1 ] + elem.replace( rxhtmlTag, "<$1>" ) + wrap[ 2 ];

					// Descend through wrappers to the right content
					j = wrap[ 0 ];
					while ( j-- ) {
						tmp = tmp.lastChild;
					}

					// Support: QtWebKit
					// jQuery.merge because core_push.apply(_, arraylike) throws
					jQuery.merge( nodes, tmp.childNodes );

					// Remember the top-level container
					tmp = fragment.firstChild;

					// Fixes #12346
					// Support: Webkit, IE
					tmp.textContent = "";
				}
			}
		}

		// Remove wrapper from fragment
		fragment.textContent = "";

		i = 0;
		while ( (elem = nodes[ i++ ]) ) {

			// #4087 - If origin and destination elements are the same, and this is
			// that element, do not do anything
			if ( selection && jQuery.inArray( elem, selection ) !== -1 ) {
				continue;
			}

			contains = jQuery.contains( elem.ownerDocument, elem );

			// Append to fragment
			tmp = getAll( fragment.appendChild( elem ), "script" );

			// Preserve script evaluation history
			if ( contains ) {
				setGlobalEval( tmp );
			}

			// Capture executables
			if ( scripts ) {
				j = 0;
				while ( (elem = tmp[ j++ ]) ) {
					if ( rscriptType.test( elem.type || "" ) ) {
						scripts.push( elem );
					}
				}
			}
		}

		return fragment;
	},

	cleanData: function( elems ) {
		var data, elem, events, type, key, j,
			special = jQuery.event.special,
			i = 0;

		for ( ; (elem = elems[ i ]) !== undefined; i++ ) {
			if ( Data.accepts( elem ) ) {
				key = elem[ data_priv.expando ];

				if ( key && (data = data_priv.cache[ key ]) ) {
					events = Object.keys( data.events || {} );
					if ( events.length ) {
						for ( j = 0; (type = events[j]) !== undefined; j++ ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}
					if ( data_priv.cache[ key ] ) {
						// Discard any remaining `private` data
						delete data_priv.cache[ key ];
					}
				}
			}
			// Discard any remaining `user` data
			delete data_user.cache[ elem[ data_user.expando ] ];
		}
	},

	_evalUrl: function( url ) {
		return jQuery.ajax({
			url: url,
			type: "GET",
			dataType: "script",
			async: false,
			global: false,
			"throws": true
		});
	}
});

// Support: 1.x compatibility
// Manipulating tables requires a tbody
function manipulationTarget( elem, content ) {
	return jQuery.nodeName( elem, "table" ) &&
		jQuery.nodeName( content.nodeType === 1 ? content : content.firstChild, "tr" ) ?

		elem.getElementsByTagName("tbody")[0] ||
			elem.appendChild( elem.ownerDocument.createElement("tbody") ) :
		elem;
}

// Replace/restore the type attribute of script elements for safe DOM manipulation
function disableScript( elem ) {
	elem.type = (elem.getAttribute("type") !== null) + "/" + elem.type;
	return elem;
}
function restoreScript( elem ) {
	var match = rscriptTypeMasked.exec( elem.type );

	if ( match ) {
		elem.type = match[ 1 ];
	} else {
		elem.removeAttribute("type");
	}

	return elem;
}

// Mark scripts as having already been evaluated
function setGlobalEval( elems, refElements ) {
	var l = elems.length,
		i = 0;

	for ( ; i < l; i++ ) {
		data_priv.set(
			elems[ i ], "globalEval", !refElements || data_priv.get( refElements[ i ], "globalEval" )
		);
	}
}

function cloneCopyEvent( src, dest ) {
	var i, l, type, pdataOld, pdataCur, udataOld, udataCur, events;

	if ( dest.nodeType !== 1 ) {
		return;
	}

	// 1. Copy private data: events, handlers, etc.
	if ( data_priv.hasData( src ) ) {
		pdataOld = data_priv.access( src );
		pdataCur = data_priv.set( dest, pdataOld );
		events = pdataOld.events;

		if ( events ) {
			delete pdataCur.handle;
			pdataCur.events = {};

			for ( type in events ) {
				for ( i = 0, l = events[ type ].length; i < l; i++ ) {
					jQuery.event.add( dest, type, events[ type ][ i ] );
				}
			}
		}
	}

	// 2. Copy user data
	if ( data_user.hasData( src ) ) {
		udataOld = data_user.access( src );
		udataCur = jQuery.extend( {}, udataOld );

		data_user.set( dest, udataCur );
	}
}


function getAll( context, tag ) {
	var ret = context.getElementsByTagName ? context.getElementsByTagName( tag || "*" ) :
			context.querySelectorAll ? context.querySelectorAll( tag || "*" ) :
			[];

	return tag === undefined || tag && jQuery.nodeName( context, tag ) ?
		jQuery.merge( [ context ], ret ) :
		ret;
}

// Support: IE >= 9
function fixInput( src, dest ) {
	var nodeName = dest.nodeName.toLowerCase();

	// Fails to persist the checked state of a cloned checkbox or radio button.
	if ( nodeName === "input" && manipulation_rcheckableType.test( src.type ) ) {
		dest.checked = src.checked;

	// Fails to return the selected option to the default selected state when cloning options
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;
	}
}
jQuery.fn.extend({
	wrapAll: function( html ) {
		var wrap;

		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapAll( html.call(this, i) );
			});
		}

		if ( this[ 0 ] ) {

			// The elements to wrap the target around
			wrap = jQuery( html, this[ 0 ].ownerDocument ).eq( 0 ).clone( true );

			if ( this[ 0 ].parentNode ) {
				wrap.insertBefore( this[ 0 ] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstElementChild ) {
					elem = elem.firstElementChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function( i ) {
				jQuery( this ).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function( i ) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	}
});
var curCSS, iframe,
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rmargin = /^margin/,
	rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
	rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
	rrelNum = new RegExp( "^([+-])=(" + core_pnum + ")", "i" ),
	elemdisplay = { BODY: "block" },

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssExpand = [ "Top", "Right", "Bottom", "Left" ],
	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ];

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function isHidden( elem, el ) {
	// isHidden might be called from jQuery#filter function;
	// in that case, element will be second argument
	elem = el || elem;
	return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

// NOTE: we've included the "window" in window.getComputedStyle
// because jsdom on node.js will break without it.
function getStyles( elem ) {
	return window.getComputedStyle( elem, null );
}

function showHide( elements, show ) {
	var display, elem, hidden,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}

		values[ index ] = data_priv.get( elem, "olddisplay" );
		display = elem.style.display;
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = data_priv.access( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
			}
		} else {

			if ( !values[ index ] ) {
				hidden = isHidden( elem );

				if ( display && display !== "none" || !hidden ) {
					data_priv.set( elem, "olddisplay", hidden ? display : jQuery.css(elem, "display") );
				}
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.fn.extend({
	css: function( name, value ) {
		return jQuery.access( this, function( elem, name, value ) {
			var styles, len,
				map = {},
				i = 0;

			if ( jQuery.isArray( name ) ) {
				styles = getStyles( elem );
				len = name.length;

				for ( ; i < len; i++ ) {
					map[ name[ i ] ] = jQuery.css( elem, name[ i ], false, styles );
				}

				return map;
			}

			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state ) {
		if ( typeof state === "boolean" ) {
			return state ? this.show() : this.hide();
		}

		return this.each(function() {
			if ( isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;
				}
			}
		}
	},

	// Don't automatically add "px" to these possibly-unitless properties
	cssNumber: {
		"columnCount": true,
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"order": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": "cssFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// Fixes #8908, it can be done more correctly by specifying setters in cssHooks,
			// but it would mean to define eight (for every problematic property) identical functions
			if ( !jQuery.support.clearCloneStyle && value === "" && name.indexOf("background") === 0 ) {
				style[ name ] = "inherit";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
				style[ name ] = value;
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, extra, styles ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name, styles );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( extra === "" || extra ) {
			num = parseFloat( val );
			return extra === true || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	}
});

curCSS = function( elem, name, _computed ) {
	var width, minWidth, maxWidth,
		computed = _computed || getStyles( elem ),

		// Support: IE9
		// getPropertyValue is only needed for .css('filter') in IE9, see #12537
		ret = computed ? computed.getPropertyValue( name ) || computed[ name ] : undefined,
		style = elem.style;

	if ( computed ) {

		if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
			ret = jQuery.style( elem, name );
		}

		// Support: Safari 5.1
		// A tribute to the "awesome hack by Dean Edwards"
		// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
		// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
		if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {

			// Remember the original values
			width = style.width;
			minWidth = style.minWidth;
			maxWidth = style.maxWidth;

			// Put in the new values to get a computed value out
			style.minWidth = style.maxWidth = style.width = ret;
			ret = computed.width;

			// Revert the changed values
			style.width = width;
			style.minWidth = minWidth;
			style.maxWidth = maxWidth;
		}
	}

	return ret;
};


function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
		// Guard against undefined "subtract", e.g., when used as in cssHooks
		Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
		value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox, styles ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			val += jQuery.css( elem, extra + cssExpand[ i ], true, styles );
		}

		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += jQuery.css( elem, "padding" + cssExpand[ i ], true, styles );

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += jQuery.css( elem, "border" + cssExpand[ i ] + "Width", true, styles );
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var valueIsBorderBox = true,
		val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		styles = getStyles( elem ),
		isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0="" ||="" val="=" null="" )="" {="" fall="" back="" to="" computed="" then="" uncomputed="" css="" if="" necessary="" elem,="" name,="" styles="" );="" (="" <="" name="" ];="" }="" unit="" is="" not="" pixels.="" stop="" here="" and="" return.="" rnumnonpx.test(val)="" return="" val;="" we="" need="" the="" check="" for="" style="" in="" case="" a="" browser="" which="" returns="" unreliable="" values="" getcomputedstyle="" silently="" falls="" reliable="" elem.style="" valueisborderbox="isBorderBox" &&="" jquery.support.boxsizingreliable="" elem.style[="" ]="" normalize="" "",="" auto,="" prepare="" extra="" 0;="" use="" active="" box-sizing="" model="" add="" subtract="" irrelevant="" +="" augmentwidthorheight(="" isborderbox="" ?="" "border"="" :="" "content"="" ),="" valueisborderbox,="" "px";="" try="" determine="" default display="" value="" of="" an="" element="" function="" css_defaultdisplay(="" nodename="" var="" doc="document," !display="" nodename,="" simple="" way="" fails,="" read="" from="" inside="" iframe="" "none"="" already-created="" possible="" jquery("<iframe="" frameborder="0" width="0" height="0">")
				.css( "cssText", "display:block !important" )
			).appendTo( doc.documentElement );

			// Always write a new HTML skeleton so Webkit and Firefox don't choke on reuse
			doc = ( iframe[0].contentWindow || iframe[0].contentDocument ).document;
			doc.write("<!doctype html><html><body>");
			doc.close();

			display = actualDisplay( nodeName, doc );
			iframe.detach();
		}

		// Store the correct default display
		elemdisplay[ nodeName ] = display;
	}

	return display;
}

// Called ONLY from within css_defaultDisplay
function actualDisplay( name, doc ) {
	var elem = jQuery( doc.createElement( name ) ).appendTo( doc.body ),
		display = jQuery.css( elem[0], "display" );
	elem.remove();
	return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				return elem.offsetWidth === 0 && rdisplayswap.test( jQuery.css( elem, "display" ) ) ?
					jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					}) :
					getWidthOrHeight( elem, name, extra );
			}
		},

		set: function( elem, value, extra ) {
			var styles = extra && getStyles( elem );
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.support.boxSizing && jQuery.css( elem, "boxSizing", false, styles ) === "border-box",
					styles
				) : 0
			);
		}
	};
});

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
	// Support: Android 2.3
	if ( !jQuery.support.reliableMarginRight ) {
		jQuery.cssHooks.marginRight = {
			get: function( elem, computed ) {
				if ( computed ) {
					// Support: Android 2.3
					// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
					// Work around by temporarily setting element display to inline-block
					return jQuery.swap( elem, { "display": "inline-block" },
						curCSS, [ elem, "marginRight" ] );
				}
			}
		};
	}

	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// getComputedStyle returns percent when specified for top/left/bottom/right
	// rather than make the css module depend on the offset module, we just check for it here
	if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
		jQuery.each( [ "top", "left" ], function( i, prop ) {
			jQuery.cssHooks[ prop ] = {
				get: function( elem, computed ) {
					if ( computed ) {
						computed = curCSS( elem, prop );
						// if curCSS returns percentage, fallback to offset
						return rnumnonpx.test( computed ) ?
							jQuery( elem ).position()[ prop ] + "px" :
							computed;
					}
				}
			};
		});
	}

});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		// Support: Opera <= 0="" 2="" 12.12="" opera="" reports="" offsetwidths="" and="" offsetheights="" less="" than="" zero="" on="" some="" elements="" return="" elem.offsetwidth="" <="0" &&="" elem.offsetheight="" };="" jquery.expr.filters.visible="function(" elem="" )="" {="" !jquery.expr.filters.hidden(="" );="" }="" these="" hooks="" are="" used="" by="" animate="" to="" expand="" properties="" jquery.each({="" margin:="" "",="" padding:="" border:="" "width"="" },="" function(="" prefix,="" suffix="" jquery.csshooks[="" prefix="" +="" ]="{" expand:="" value="" var="" i="0," expanded="{}," assumes="" a="" single="" number="" if="" not="" string="" parts="typeof" "string"="" ?="" value.split("="" ")="" :="" [="" ];="" for="" (="" ;="" 4;="" i++="" expanded[="" cssexpand[="" ||="" parts[="" -="" expanded;="" !rmargin.test(="" ].set="setPositiveNumber;" });="" r20="/%20/g," rbracket="/\[\]$/," rcrlf="/\r?\n/g," rsubmittertypes="/^(?:submit|button|image|reset|file)$/i," rsubmittable="/^(?:input|select|textarea|keygen)/i;" jquery.fn.extend({="" serialize:="" function()="" jquery.param(="" this.serializearray()="" serializearray:="" this.map(function(){="" can="" add="" prophook="" "elements"="" filter="" or="" form="" this,="" jquery.makearray(="" this;="" })="" .filter(function(){="" type="this.type;" use="" .is(":disabled")="" so="" that="" fieldset[disabled]="" works="" this.name="" !jquery(="" this="" ).is(="" ":disabled"="" rsubmittable.test(="" this.nodename="" !rsubmittertypes.test(="" this.checked="" !manipulation_rcheckabletype.test(="" .map(function(="" i,="" ){="" val="jQuery(" ).val();="" null="" jquery.isarray(="" jquery.map(="" val,="" name:="" elem.name,="" value:="" val.replace(="" rcrlf,="" "\r\n"="" }).get();="" serialize="" an="" array="" of="" set="" key="" values="" into="" query="" jquery.param="function(" a,="" traditional="" s="[]," key,="" is="" function,="" invoke="" it="" its="" value()="" ""="" s[="" s.length="" "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the " old"="" way="" (the="" 1.3.2="" older="" did="" it),="" otherwise="" encode="" params="" recursively.="" in="" buildparams(="" a[="" ],="" traditional,="" the="" resulting="" serialization="" s.join(="" "&"="" ).replace(="" r20,="" "+"="" function="" obj,="" name;="" obj="" item.="" jquery.each(="" v="" rbracket.test(="" treat="" each="" item="" as="" scalar.="" add(="" else="" non-scalar="" (array="" object),="" numeric="" index.="" "["="" typeof="" "object"="" "]",="" v,="" !traditional="" jquery.type(="" object="" name="" obj[="" scalar="" ("blur="" focus="" focusin="" focusout="" load="" resize="" scroll="" unload="" click="" dblclick="" "mousedown="" mouseup="" mousemove="" mouseover="" mouseout="" mouseenter="" mouseleave="" "change="" select="" submit="" keydown="" keypress="" keyup="" error="" contextmenu").split("="" "),="" handle="" event="" binding="" jquery.fn[="" data,="" fn="" arguments.length=""> 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};
});

jQuery.fn.extend({
	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	}
});
var
	// Document location
	ajaxLocParts,
	ajaxLocation,

	ajax_nonce = jQuery.now(),

	ajax_rquery = /\?/,
	rhash = /#.*$/,
	rts = /([?&])_=[^&]*/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)$/mg,
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

	// Keep a copy of the old load method
	_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = "*/".concat("*");

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType,
			i = 0,
			dataTypes = dataTypeExpression.toLowerCase().match( core_rnotwhite ) || [];

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			while ( (dataType = dataTypes[i++]) ) {
				// Prepend if requested
				if ( dataType[0] === "+" ) {
					dataType = dataType.slice( 1 ) || "*";
					(structure[ dataType ] = structure[ dataType ] || []).unshift( func );

				// Otherwise append
				} else {
					(structure[ dataType ] = structure[ dataType ] || []).push( func );
				}
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR ) {

	var inspected = {},
		seekingTransport = ( structure === transports );

	function inspect( dataType ) {
		var selected;
		inspected[ dataType ] = true;
		jQuery.each( structure[ dataType ] || [], function( _, prefilterOrFactory ) {
			var dataTypeOrTransport = prefilterOrFactory( options, originalOptions, jqXHR );
			if( typeof dataTypeOrTransport === "string" && !seekingTransport && !inspected[ dataTypeOrTransport ] ) {
				options.dataTypes.unshift( dataTypeOrTransport );
				inspect( dataTypeOrTransport );
				return false;
			} else if ( seekingTransport ) {
				return !( selected = dataTypeOrTransport );
			}
		});
		return selected;
	}

	return inspect( options.dataTypes[ 0 ] ) || !inspected[ "*" ] && inspect( "*" );
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};

	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || (deep = {}) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}

	return target;
}

jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	var selector, type, response,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// If we have elements to modify, make the request
	if ( self.length > 0 ) {
		jQuery.ajax({
			url: url,

			// if "type" variable is undefined, then "GET" method will be used
			type: type,
			dataType: "html",
			data: params
		}).done(function( responseText ) {

			// Save response for use in complete callback
			response = arguments;

			self.html( selector ?

				// If a selector was specified, locate the right elements in a dummy div
				// Exclude scripts to avoid IE 'Permission Denied' errors
				jQuery("<div>").append( jQuery.parseHTML( responseText ) ).find( selector ) :

				// Otherwise use the full result
				responseText );

		}).complete( callback && function( jqXHR, status ) {
			self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
		});
	}

	return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( [ "ajaxStart", "ajaxStop", "ajaxComplete", "ajaxError", "ajaxSuccess", "ajaxSend" ], function( i, type ){
	jQuery.fn[ type ] = function( fn ){
		return this.on( type, fn );
	};
});

jQuery.extend({

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {},

	ajaxSettings: {
		url: ajaxLocation,
		type: "GET",
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		processData: true,
		async: true,
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			"*": allTypes,
			text: "text/plain",
			html: "text/html",
			xml: "application/xml, text/xml",
			json: "application/json, text/javascript"
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText",
			json: "responseJSON"
		},

		// Data converters
		// Keys separate source (or catchall "*") and destination types with a single space
		converters: {

			// Convert anything to text
			"* text": String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			url: true,
			context: true
		}
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		return settings ?

			// Building a settings object
			ajaxExtend( ajaxExtend( target, jQuery.ajaxSettings ), settings ) :

			// Extending ajaxSettings
			ajaxExtend( jQuery.ajaxSettings, target );
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var transport,
			// URL without anti-cache param
			cacheURL,
			// Response headers
			responseHeadersString,
			responseHeaders,
			// timeout handle
			timeoutTimer,
			// Cross-domain detection vars
			parts,
			// To know if global events are to be dispatched
			fireGlobals,
			// Loop variable
			i,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events is callbackContext if it is a DOM node or jQuery collection
			globalEventContext = s.context && ( callbackContext.nodeType || callbackContext.jquery ) ?
				jQuery( callbackContext ) :
				jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks("once memory"),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {
				readyState: 0,

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while ( (match = rheaders.exec( responseHeadersString )) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match == null ? null : match;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Caches the header
				setRequestHeader: function( name, value ) {
					var lname = name.toLowerCase();
					if ( !state ) {
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Status-dependent callbacks
				statusCode: function( map ) {
					var code;
					if ( map ) {
						if ( state < 2 ) {
							for ( code in map ) {
								// Lazy-add the new callback in a way that preserves old ones
								statusCode[ code ] = [ statusCode[ code ], map[ code ] ];
							}
						} else {
							// Execute the appropriate callbacks
							jqXHR.always( map[ jqXHR.status ] );
						}
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					var finalText = statusText || strAbort;
					if ( transport ) {
						transport.abort( finalText );
					}
					done( 0, finalText );
					return this;
				}
			};

		// Attach deferreds
		deferred.promise( jqXHR ).complete = completeDeferred.add;
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (prefilters might expect it)
		// Handle falsy url in the settings object (#10093: consistency with old signature)
		// We also use the url parameter if available
		s.url = ( ( url || s.url || ajaxLocation ) + "" ).replace( rhash, "" )
			.replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Alias method option to type as per ticket #12004
		s.type = options.method || options.type || s.method || s.type;

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().match( core_rnotwhite ) || [""];

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? "80" : "443" ) ) !==
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? "80" : "443" ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger("ajaxStart");
		}

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Save the URL in case we're toying with the If-Modified-Since
		// and/or If-None-Match header later on
		cacheURL = s.url;

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				cacheURL = ( s.url += ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + s.data );
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Add anti-cache in url if needed
			if ( s.cache === false ) {
				s.url = rts.test( cacheURL ) ?

					// If there is already a '_' parameter, set its value
					cacheURL.replace( rts, "$1_=" + ajax_nonce++ ) :

					// Otherwise add one to the end
					cacheURL + ( ajax_rquery.test( cacheURL ) ? "&" : "?" ) + "_=" + ajax_nonce++;
			}
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			if ( jQuery.lastModified[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ cacheURL ] );
			}
			if ( jQuery.etag[ cacheURL ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ cacheURL ] );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
			// Abort if not done already and return
			return jqXHR.abort();
		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;

			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout(function() {
					jqXHR.abort("timeout");
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch ( e ) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		// Callback for when everything is done
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Determine if successful
			isSuccess = status >= 200 && status < 300 || status === 304;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// Convert no matter what (that way responseXXX fields are always set)
			response = ajaxConvert( s, response, jqXHR, isSuccess );

			// If successful, handle type chaining
			if ( isSuccess ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {
					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ cacheURL ] = modified;
					}
					modified = jqXHR.getResponseHeader("etag");
					if ( modified ) {
						jQuery.etag[ cacheURL ] = modified;
					}
				}

				// if no content
				if ( status === 204 || s.type === "HEAD" ) {
					statusText = "nocontent";

				// if not modified
				} else if ( status === 304 ) {
					statusText = "notmodified";

				// If we have data, let's convert it
				} else {
					statusText = response.state;
					success = response.data;
					error = response.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( status || !statusText ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( isSuccess ? "ajaxSuccess" : "ajaxError",
					[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger("ajaxStop");
				}
			}
		}

		return jqXHR;
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	}
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			url: url,
			type: method,
			dataType: type,
			data: data,
			success: callback
		});
	};
});

/* Handles responses to an ajax request:
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes;

	// Remove auto dataType and get content-type in the process
	while( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader("Content-Type");
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

/* Chain conversions given the request and the original response
 * Also sets the responseXXX fields on the jqXHR instance
 */
function ajaxConvert( s, response, jqXHR, isSuccess ) {
	var conv2, current, conv, tmp, prev,
		converters = {},
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice();

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	current = dataTypes.shift();

	// Convert to each sequential dataType
	while ( current ) {

		if ( s.responseFields[ current ] ) {
			jqXHR[ s.responseFields[ current ] ] = response;
		}

		// Apply the dataFilter if provided
		if ( !prev && isSuccess && s.dataFilter ) {
			response = s.dataFilter( response, s.dataType );
		}

		prev = current;
		current = dataTypes.shift();

		if ( current ) {

		// There's only work to do if current dataType is non-auto
			if ( current === "*" ) {

				current = prev;

			// Convert response if prev dataType is non-auto and differs from current
			} else if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split( " " );
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.unshift( tmp[ 1 ] );
								}
								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s[ "throws" ] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}
		}
	}

	return { state: "success", data: response };
}
// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /(?:java|ecma)script/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and crossDomain
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function( s ) {
	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {
		var script, callback;
		return {
			send: function( _, complete ) {
				script = jQuery("<script>").prop({
					async: true,
					charset: s.scriptCharset,
					src: s.url
				}).on(
					"load error",
					callback = function( evt ) {
						script.remove();
						callback = null;
						if ( evt ) {
							complete( evt.type === "error" ? 404 : 200, evt.type );
						}
					}
				);
				document.head.appendChild( script[ 0 ] );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});
var oldCallbacks = [],
	rjsonp = /(=)\?(?=&|$)|\?\?/;

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( ajax_nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		jsonProp = s.jsonp !== false && ( rjsonp.test( s.url ) ?
			"url" :
			typeof s.data === "string" && !( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") && rjsonp.test( s.data ) && "data"
		);

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( jsonProp || s.dataTypes[ 0 ] === "jsonp" ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;

		// Insert callback into url or form data
		if ( jsonProp ) {
			s[ jsonProp ] = s[ jsonProp ].replace( rjsonp, "$1" + callbackName );
		} else if ( s.jsonp !== false ) {
			s.url += ( ajax_rquery.test( s.url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		overwritten = window[ callbackName ];
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});
jQuery.ajaxSettings.xhr = function() {
	try {
		return new XMLHttpRequest();
	} catch( e ) {}
};

var xhrSupported = jQuery.ajaxSettings.xhr(),
	xhrSuccessStatus = {
		// file protocol always yields status code 0, assume 200
		0: 200,
		// Support: IE9
		// #1450: sometimes IE returns 1223 when it should be 204
		1223: 204
	},
	// Support: IE9
	// We need to keep track of outbound xhr and abort them manually
	// because IE is not smart enough to do it all by itself
	xhrId = 0,
	xhrCallbacks = {};

if ( window.ActiveXObject ) {
	jQuery( window ).on( "unload", function() {
		for( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]();
		}
		xhrCallbacks = undefined;
	});
}

jQuery.support.cors = !!xhrSupported && ( "withCredentials" in xhrSupported );
jQuery.support.ajax = xhrSupported = !!xhrSupported;

jQuery.ajaxTransport(function( options ) {
	var callback;
	// Cross domain only allowed if supported through XMLHttpRequest
	if ( jQuery.support.cors || xhrSupported && !options.crossDomain ) {
		return {
			send: function( headers, complete ) {
				var i, id,
					xhr = options.xhr();
				xhr.open( options.type, options.url, options.async, options.username, options.password );
				// Apply custom fields if provided
				if ( options.xhrFields ) {
					for ( i in options.xhrFields ) {
						xhr[ i ] = options.xhrFields[ i ];
					}
				}
				// Override mime type if needed
				if ( options.mimeType && xhr.overrideMimeType ) {
					xhr.overrideMimeType( options.mimeType );
				}
				// X-Requested-With header
				// For cross-domain requests, seeing as conditions for a preflight are
				// akin to a jigsaw puzzle, we simply never set it to be sure.
				// (it can always be set on a per-request basis or even using ajaxSetup)
				// For same-domain requests, won't change header if already provided.
				if ( !options.crossDomain && !headers["X-Requested-With"] ) {
					headers["X-Requested-With"] = "XMLHttpRequest";
				}
				// Set headers
				for ( i in headers ) {
					xhr.setRequestHeader( i, headers[ i ] );
				}
				// Callback
				callback = function( type ) {
					return function() {
						if ( callback ) {
							delete xhrCallbacks[ id ];
							callback = xhr.onload = xhr.onerror = null;
							if ( type === "abort" ) {
								xhr.abort();
							} else if ( type === "error" ) {
								complete(
									// file protocol always yields status 0, assume 404
									xhr.status || 404,
									xhr.statusText
								);
							} else {
								complete(
									xhrSuccessStatus[ xhr.status ] || xhr.status,
									xhr.statusText,
									// Support: IE9
									// #11426: When requesting binary data, IE9 will throw an exception
									// on any attempt to access responseText
									typeof xhr.responseText === "string" ? {
										text: xhr.responseText
									} : undefined,
									xhr.getAllResponseHeaders()
								);
							}
						}
					};
				};
				// Listen to events
				xhr.onload = callback();
				xhr.onerror = callback("error");
				// Create the abort callback
				callback = xhrCallbacks[( id = xhrId++ )] = callback("abort");
				// Do send the request
				// This may raise an exception which is actually
				// handled in jQuery.ajax (so no try/catch here)
				xhr.send( options.hasContent && options.data || null );
			},
			abort: function() {
				if ( callback ) {
					callback();
				}
			}
		};
	}
});
var fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([+-])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [function( prop, value ) {
			var tween = this.createTween( prop, value ),
				target = tween.cur(),
				parts = rfxnum.exec( value ),
				unit = parts && parts[ 3 ] || ( jQuery.cssNumber[ prop ] ? "" : "px" ),

				// Starting value computation is required for potential unit mismatches
				start = ( jQuery.cssNumber[ prop ] || unit !== "px" && +target ) &&
					rfxnum.exec( jQuery.css( tween.elem, prop ) ),
				scale = 1,
				maxIterations = 20;

			if ( start && start[ 3 ] !== unit ) {
				// Trust units reported by jQuery.css
				unit = unit || start[ 3 ];

				// Make sure we update the tween properties later on
				parts = parts || [];

				// Iteratively approximate from a nonzero starting point
				start = +target || 1;

				do {
					// If previous iteration zeroed out, double until we get *something*
					// Use a string for doubling factor so we don't accidentally see scale as unchanged below
					scale = scale || ".5";

					// Adjust and apply
					start = start / scale;
					jQuery.style( tween.elem, prop, start + unit );

				// Update scale, tolerating zero or NaN from tween.cur()
				// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
				} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
			}

			// Update tween properties
			if ( parts ) {
				start = tween.start = +start || +target || 0;
				tween.unit = unit;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[ 1 ] ?
					start + ( parts[ 1 ] + 1 ) * parts[ 2 ] :
					+parts[ 2 ];
			}

			return tween;
		}]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	});
	return ( fxNow = jQuery.now() );
}

function createTween( value, prop, animation ) {
	var tween,
		collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
		index = 0,
		length = collection.length;
	for ( ; index < length; index++ ) {
		if ( (tween = collection[ index ].call( animation, prop, value )) ) {

			// we're done with this property
			return tween;
		}
	}
}

function Animation( elem, properties, options ) {
	var result,
		stopped,
		index = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			if ( stopped ) {
				return false;
			}
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;
				if ( stopped ) {
					return this;
				}
				stopped = true;
				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	jQuery.map( props, createTween, animation );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			elem: elem,
			anim: animation,
			queue: animation.opts.queue
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

function defaultPrefilter( elem, props, opts ) {
	/* jshint validthis: true */
	var prop, value, toggle, tween, hooks, oldfire,
		anim = this,
		orig = {},
		style = elem.style,
		hidden = elem.nodeType && isHidden( elem ),
		dataShow = data_priv.get( elem, "fxshow" );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE9-10 do not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		if ( jQuery.css( elem, "display" ) === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			style.display = "inline-block";
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		anim.always(function() {
			style.overflow = opts.overflow[ 0 ];
			style.overflowX = opts.overflow[ 1 ];
			style.overflowY = opts.overflow[ 2 ];
		});
	}


	// show/hide pass
	for ( prop in props ) {
		value = props[ prop ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ prop ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {

				// If there is dataShow left over from a stopped hide or show and we are going to proceed with show, we should pretend to be hidden
				if ( value === "show" && dataShow && dataShow[ prop ] !== undefined ) {
					hidden = true;
				} else {
					continue;
				}
			}
			orig[ prop ] = dataShow && dataShow[ prop ] || jQuery.style( elem, prop );
		}
	}

	if ( !jQuery.isEmptyObject( orig ) ) {
		if ( dataShow ) {
			if ( "hidden" in dataShow ) {
				hidden = dataShow.hidden;
			}
		} else {
			dataShow = data_priv.access( elem, "fxshow", {} );
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;

			data_priv.remove( elem, "fxshow" );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( prop in orig ) {
			tween = createTween( hidden ? dataShow[ prop ] : 0, prop, anim );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing an empty string as a 3rd parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Support: IE9
// Panic based approach to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations, or finishing resolves immediately
				if ( empty || data_priv.get( this, "finish" ) ) {
					anim.stop( true );
				}
			};
			doAnimation.finish = doAnimation;

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = data_priv.get( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	},
	finish: function( type ) {
		if ( type !== false ) {
			type = type || "fx";
		}
		return this.each(function() {
			var index,
				data = data_priv.get( this ),
				queue = data[ type + "queue" ],
				hooks = data[ type + "queueHooks" ],
				timers = jQuery.timers,
				length = queue ? queue.length : 0;

			// enable finishing flag on private data
			data.finish = true;

			// empty the queue first
			jQuery.queue( this, type, [] );

			if ( hooks && hooks.stop ) {
				hooks.stop.call( this, true );
			}

			// look for any active animations, and finish them
			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && timers[ index ].queue === type ) {
					timers[ index ].anim.stop( true );
					timers.splice( index, 1 );
				}
			}

			// look for any animations in the old queue and finish them
			for ( index = 0; index < length; index++ ) {
				if ( queue[ index ] && queue[ index ].finish ) {
					queue[ index ].finish.call( this );
				}
			}

			// turn off finishing flag
			delete data.finish;
		});
	}
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth? 1 : 0;
	for( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p*Math.PI ) / 2;
	}
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	if ( timer() && jQuery.timers.push( timer ) ) {
		jQuery.fx.start();
	}
};

jQuery.fx.interval = 13;

jQuery.fx.start = function() {
	if ( !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
jQuery.fn.offset = function( options ) {
	if ( arguments.length ) {
		return options === undefined ?
			this :
			this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
	}

	var docElem, win,
		elem = this[ 0 ],
		box = { top: 0, left: 0 },
		doc = elem && elem.ownerDocument;

	if ( !doc ) {
		return;
	}

	docElem = doc.documentElement;

	// Make sure it's not a disconnected DOM node
	if ( !jQuery.contains( docElem, elem ) ) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if ( typeof elem.getBoundingClientRect !== core_strundefined ) {
		box = elem.getBoundingClientRect();
	}
	win = getWindow( doc );
	return {
		top: box.top + win.pageYOffset - docElem.clientTop,
		left: box.left + win.pageXOffset - docElem.clientLeft
	};
};

jQuery.offset = {

	setOffset: function( elem, options, i ) {
		var curPosition, curLeft, curCSSTop, curTop, curOffset, curCSSLeft, calculatePosition,
			position = jQuery.css( elem, "position" ),
			curElem = jQuery( elem ),
			props = {};

		// Set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		curOffset = curElem.offset();
		curCSSTop = jQuery.css( elem, "top" );
		curCSSLeft = jQuery.css( elem, "left" );
		calculatePosition = ( position === "absolute" || position === "fixed" ) && ( curCSSTop + curCSSLeft ).indexOf("auto") > -1;

		// Need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;

		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );

		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({

	position: function() {
		if ( !this[ 0 ] ) {
			return;
		}

		var offsetParent, offset,
			elem = this[ 0 ],
			parentOffset = { top: 0, left: 0 };

		// Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
		if ( jQuery.css( elem, "position" ) === "fixed" ) {
			// We assume that getBoundingClientRect is available when computed position is fixed
			offset = elem.getBoundingClientRect();

		} else {
			// Get *real* offsetParent
			offsetParent = this.offsetParent();

			// Get correct offsets
			offset = this.offset();
			if ( !jQuery.nodeName( offsetParent[ 0 ], "html" ) ) {
				parentOffset = offsetParent.offset();
			}

			// Add offsetParent borders
			parentOffset.top += jQuery.css( offsetParent[ 0 ], "borderTopWidth", true );
			parentOffset.left += jQuery.css( offsetParent[ 0 ], "borderLeftWidth", true );
		}

		// Subtract parent offsets and element margins
		return {
			top: offset.top - parentOffset.top - jQuery.css( elem, "marginTop", true ),
			left: offset.left - parentOffset.left - jQuery.css( elem, "marginLeft", true )
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || docElem;

			while ( offsetParent && ( !jQuery.nodeName( offsetParent, "html" ) && jQuery.css( offsetParent, "position") === "static" ) ) {
				offsetParent = offsetParent.offsetParent;
			}

			return offsetParent || docElem;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
	var top = "pageYOffset" === prop;

	jQuery.fn[ method ] = function( val ) {
		return jQuery.access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? win[ prop ] : elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : window.pageXOffset,
					top ? val : window.pageYOffset
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

function getWindow( elem ) {
	return jQuery.isWindow( elem ) ? elem : elem.nodeType === 9 && elem.defaultView;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return jQuery.access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
					// whichever is greatest
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});
// Limit scope pollution from any deprecated API
// (function() {

// The number of elements contained in the matched element set
jQuery.fn.size = function() {
	return this.length;
};

jQuery.fn.andSelf = jQuery.fn.addBack;

// })();
if ( typeof module === "object" && module && typeof module.exports === "object" ) {
	// Expose jQuery as module.exports in loaders that implement the Node
	// module pattern (including browserify). Do not create the global, since
	// the user will be storing it themselves locally, and globals are frowned
	// upon in the Node module world.
	module.exports = jQuery;
} else {
	// Register as a named AMD module, since jQuery can be concatenated with other
	// files that may use define, but not via a proper concatenation script that
	// understands anonymous AMD modules. A named AMD is safest and most robust
	// way to register. Lowercase jquery is used because AMD module names are
	// derived from file names, and jQuery is normally delivered in a lowercase
	// file name. Do this after creating the global so that if an AMD module wants
	// to call noConflict to hide this version of jQuery, it will work.
	if ( typeof define === "function" && define.amd ) {
		define( "jquery", [], function () { return jQuery; } );
	}
}

// If there is a window object, that at least has a document property,
// define jQuery and $ identifiers
if ( typeof window === "object" && typeof window.document === "object" ) {
	window.jQuery = window.$ = jQuery;
}

})( window );
</script></div></=></body></html></=></$1></=></$1></([\w:]+)></(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^></function></=></14></8></4.0></li></div></div></"></a></\></(\w+)\s*\></[\w\w]+></[\w\w]+>